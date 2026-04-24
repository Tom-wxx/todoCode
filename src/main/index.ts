import { app, BrowserWindow, ipcMain, Notification, dialog, Tray, Menu, nativeTheme, shell } from 'electron'
import { join, resolve as resolvePath, relative as relativePath, isAbsolute } from 'path'
import fs from 'fs'
import Store from 'electron-store'

// 判断 child 是否等于 parent 或位于 parent 内部（规范化后比较，避免 startsWith 前缀歧义）
function isPathInside(parent: string, child: string): boolean {
  const p = resolvePath(parent)
  const c = resolvePath(child)
  if (p === c) return true
  const rel = relativePath(p, c)
  return !!rel && !rel.startsWith('..') && !isAbsolute(rel)
}

const isDev = !app.isPackaged

// 应用配置 store（独立于用户数据，存储路径等元配置）
const configStore = new Store({
  name: 'config',
  defaults: {
    dataPath: '',  // 空表示使用默认路径
    logPath: '',   // 空表示使用默认路径
    logEnabled: true
  }
})

// 获取数据存储路径
function getDataPath(): string {
  const custom = configStore.get('dataPath') as string
  return custom || app.getPath('userData')
}

// 获取日志存储路径
function getLogPath(): string {
  const custom = configStore.get('logPath') as string
  return custom || join(app.getPath('userData'), 'logs')
}

// 日志工具
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 日志写入队列：串行化 append，避免同步 IO 阻塞主线程
let logQueue: Promise<void> = Promise.resolve()

function writeLog(level: string, message: string) {
  const enabled = configStore.get('logEnabled') as boolean
  if (!enabled) return

  const logDir = getLogPath()
  const now = new Date()
  // 日志按本地日期滚动，避免用户看到的"今天"日志跨到另一个文件
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const logFile = join(logDir, `${dateStr}.log`)
  const line = `[${now.toISOString()}] [${level}] ${message}\n`

  logQueue = logQueue.then(async () => {
    try {
      await fs.promises.mkdir(logDir, { recursive: true })
      await fs.promises.appendFile(logFile, line, 'utf-8')
    } catch { /* ignore write errors */ }
  })
}

// 使用自定义路径创建数据 store
const DATA_STORE_DEFAULTS = {
  todos: [],
  categories: ['工作', '学习', '生活'],
  settings: { darkMode: false }
}

function createDataStore() {
  try {
    const dataPath = getDataPath()
    ensureDir(dataPath)
    return new Store({ cwd: dataPath, name: 'todo-data', defaults: DATA_STORE_DEFAULTS })
  } catch (_e) {
    // 自定义路径不可用，重置为默认路径
    configStore.set('dataPath', '')
    const fallbackPath = app.getPath('userData')
    ensureDir(fallbackPath)
    writeLog('WARN', `自定义数据路径不可用，已回退到默认路径: ${fallbackPath}`)
    return new Store({ cwd: fallbackPath, name: 'todo-data', defaults: DATA_STORE_DEFAULTS })
  }
}

let store = createDataStore()
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

// Windows/Linux: 防止多开导致多个托盘图标
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow()
    }

    if (mainWindow?.isMinimized()) mainWindow.restore()
    mainWindow?.show()
    mainWindow?.focus()
  })
}

function getAppIconPath(): string {
  return join(__dirname, '../../resources', process.platform === 'win32' ? 'icon.ico' : 'icon.png')
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    show: false,
    icon: getAppIconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    // 正常关闭 → 隐藏到托盘；应用真正退出时（isQuitting）放行，让 before-quit 的 flush 逻辑生效
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  writeLog('INFO', '应用窗口已创建')
}

function createTray(): void {
  if (tray) return
  tray = new Tray(getAppIconPath())
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { label: '退出', click: () => { app.quit() } }
  ])
  tray.setToolTip('待办事项')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => mainWindow?.show())
}

// IPC handlers
function setupIPC(): void {
  const ALLOWED_KEYS = ['todos', 'categories', 'settings']

  ipcMain.handle('store:get', (_event, key: string) => {
    if (!ALLOWED_KEYS.includes(key)) return null
    try {
      return store.get(key)
    } catch (e) {
      writeLog('ERROR', `store.get 失败 (key=${key}): ${e}，尝试回退到默认路径`)
      configStore.set('dataPath', '')
      store = createDataStore()
      return store.get(key)
    }
  })

  ipcMain.handle('store:set', (_event, key: string, value: any) => {
    if (!ALLOWED_KEYS.includes(key)) return
    try {
      store.set(key, value)
    } catch (e) {
      // 自定义路径写入失败，重置为默认路径并重试
      writeLog('ERROR', `store.set 失败 (key=${key}): ${e}，尝试回退到默认路径`)
      configStore.set('dataPath', '')
      store = createDataStore()
      store.set(key, value)
      writeLog('WARN', '已自动回退到默认数据路径')
    }
  })

  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => mainWindow?.hide())

  ipcMain.handle('dialog:export', async (_event, data: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: '导出待办数据',
      defaultPath: 'todos-backup.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (!result.canceled && result.filePath) {
      await fs.promises.writeFile(result.filePath, data, 'utf-8')
      writeLog('INFO', `数据已导出到: ${result.filePath}`)
      return true
    }
    return false
  })

  ipcMain.handle('dialog:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '导入待办数据',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const content = await fs.promises.readFile(result.filePaths[0], 'utf-8')
      writeLog('INFO', `数据已从 ${result.filePaths[0]} 导入`)
      return content
    }
    return null
  })

  // 提醒由 renderer 扫描触发，这里只负责展示原生通知（main 不再触碰 todos 数据）
  ipcMain.handle('notify:show', (_event, title: string, body: string) => {
    try {
      new Notification({ title, body }).show()
      writeLog('INFO', `提醒触发: ${body}`)
    } catch (e) {
      writeLog('ERROR', `通知展示失败: ${e}`)
    }
  })

  ipcMain.handle('theme:get-system', () => {
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('app:getVersion', () => app.getVersion())

  // 设置相关 IPC
  ipcMain.handle('config:get', () => {
    return {
      dataPath: configStore.get('dataPath') as string || getDataPath(),
      logPath: configStore.get('logPath') as string || getLogPath(),
      logEnabled: configStore.get('logEnabled') as boolean,
      defaultDataPath: app.getPath('userData'),
      defaultLogPath: join(app.getPath('userData'), 'logs')
    }
  })

  ipcMain.handle('config:setDataPath', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '选择数据存储目录',
      defaultPath: getDataPath(),
      properties: ['openDirectory', 'createDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const newPath = result.filePaths[0]
      // 必须在创建 Store 之前检查，因为 Store 构造时会自动将 defaults 写入磁盘
      const existingFile = join(newPath, 'todo-data.json')
      const hasExistingData = fs.existsSync(existingFile)
      configStore.set('dataPath', newPath)
      const newStore = new Store({ cwd: newPath, name: 'todo-data', defaults: DATA_STORE_DEFAULTS })
      // 目标目录没有已有数据文件时，将当前数据迁移过去
      if (!hasExistingData) {
        newStore.set('todos', store.get('todos'))
        newStore.set('categories', store.get('categories'))
        newStore.set('settings', store.get('settings'))
      }
      store = newStore
      writeLog('INFO', `数据路径已更改为: ${newPath}`)
      return newPath
    }
    return null
  })

  ipcMain.handle('config:resetDataPath', () => {
    configStore.set('dataPath', '')
    store = createDataStore()
    writeLog('INFO', '数据路径已重置为默认')
    return app.getPath('userData')
  })

  ipcMain.handle('config:setLogPath', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '选择日志存储目录',
      defaultPath: getLogPath(),
      properties: ['openDirectory', 'createDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const newPath = result.filePaths[0]
      configStore.set('logPath', newPath)
      writeLog('INFO', `日志路径已更改为: ${newPath}`)
      return newPath
    }
    return null
  })

  ipcMain.handle('config:resetLogPath', () => {
    configStore.set('logPath', '')
    writeLog('INFO', '日志路径已重置为默认')
    return join(app.getPath('userData'), 'logs')
  })

  ipcMain.handle('config:setLogEnabled', (_event, enabled: boolean) => {
    configStore.set('logEnabled', enabled)
    if (enabled) writeLog('INFO', '日志记录已启用')
  })

  ipcMain.handle('config:openPath', (_event, target: string) => {
    // 仅允许打开数据目录和日志目录。用 relative 判断包含关系，避免 startsWith 前缀歧义（如 C:\data vs C:\data2）
    const allowedRoots = [getDataPath(), getLogPath(), app.getPath('userData')]
    const isAllowed = allowedRoots.some(root => isPathInside(root, target))
    if (isAllowed) {
      shell.openPath(target)
    } else {
      writeLog('WARN', `拒绝打开非白名单路径: ${target}`)
    }
  })
}

// 退出前让 renderer flush 未落盘的数据，避免托盘"退出"丢 300ms 防抖窗内的变更
async function flushRendererBeforeQuit(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      writeLog('WARN', '退出前 flush 超时，继续退出')
      resolve()
    }, 2000)
    ipcMain.once('app:flush-done', () => {
      clearTimeout(timer)
      resolve()
    })
    mainWindow!.webContents.send('app:before-quit')
  })
}

app.whenReady().then(() => {
  writeLog('INFO', '应用启动')
  setupIPC()
  createWindow()
  try { createTray() } catch (_e) { /* no tray icon */ }
})

app.on('before-quit', (e) => {
  if (isQuitting) return
  e.preventDefault()
  isQuitting = true
  flushRendererBeforeQuit().finally(() => {
    writeLog('INFO', '应用关闭')
    try { tray?.destroy() } catch { /* ignore */ }
    tray = null
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
