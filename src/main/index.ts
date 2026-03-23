import { app, BrowserWindow, ipcMain, Notification, dialog, Tray, Menu, nativeTheme, shell } from 'electron'
import { join } from 'path'
import fs from 'fs'
import Store from 'electron-store'

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

function writeLog(level: string, message: string) {
  const enabled = configStore.get('logEnabled') as boolean
  if (!enabled) return

  const logDir = getLogPath()
  ensureDir(logDir)

  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const logFile = join(logDir, `${dateStr}.log`)
  const timestamp = now.toISOString()
  const line = `[${timestamp}] [${level}] ${message}\n`

  try {
    fs.appendFileSync(logFile, line, 'utf-8')
  } catch (_e) { /* ignore write errors */ }
}

// 使用自定义路径创建数据 store
function createDataStore() {
  const dataPath = getDataPath()
  ensureDir(dataPath)
  return new Store({
    cwd: dataPath,
    name: 'todo-data',
    defaults: {
      todos: [],
      categories: ['工作', '学习', '生活'],
      settings: {
        darkMode: false
      }
    }
  })
}

let store = createDataStore()
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let reminderTimer: NodeJS.Timeout | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  writeLog('INFO', '应用窗口已创建')
}

function createTray(): void {
  tray = new Tray(join(__dirname, '../../resources/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { label: '退出', click: () => { mainWindow?.destroy(); app.quit() } }
  ])
  tray.setToolTip('待办事项')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => mainWindow?.show())
}

function setupReminderCheck(): void {
  reminderTimer = setInterval(() => {
    const todos = store.get('todos') as any[]
    const now = new Date()
    let changed = false
    todos.forEach((todo: any) => {
      if (todo.reminder && !todo.completed && !todo.reminded) {
        const reminderTime = new Date(todo.reminder)
        if (reminderTime <= now) {
          new Notification({
            title: '待办提醒',
            body: todo.title
          }).show()
          todo.reminded = true
          changed = true
          writeLog('INFO', `提醒触发: ${todo.title}`)
        }
      }
    })
    if (changed) {
      store.set('todos', todos)
    }
  }, 60000)
}

// IPC handlers
function setupIPC(): void {
  const ALLOWED_KEYS = ['todos', 'categories', 'settings']

  ipcMain.handle('store:get', (_event, key: string) => {
    if (!ALLOWED_KEYS.includes(key)) return null
    return store.get(key)
  })

  ipcMain.handle('store:set', (_event, key: string, value: any) => {
    if (!ALLOWED_KEYS.includes(key)) return
    store.set(key, value)
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
      fs.writeFileSync(result.filePath, data, 'utf-8')
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
      const content = fs.readFileSync(result.filePaths[0], 'utf-8')
      writeLog('INFO', `数据已从 ${result.filePaths[0]} 导入`)
      return content
    }
    return null
  })

  ipcMain.handle('theme:get-system', () => {
    return nativeTheme.shouldUseDarkColors
  })

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
      properties: ['openDirectory', 'createDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const newPath = result.filePaths[0]
      // 迁移旧数据到新路径
      const oldData = {
        todos: store.get('todos'),
        categories: store.get('categories'),
        settings: store.get('settings')
      }
      configStore.set('dataPath', newPath)
      store = createDataStore()
      store.set('todos', oldData.todos)
      store.set('categories', oldData.categories)
      store.set('settings', oldData.settings)
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

  ipcMain.handle('config:openPath', (_event, path: string) => {
    // 仅允许打开数据目录和日志目录
    const allowedPaths = [getDataPath(), getLogPath(), app.getPath('userData')]
    const isAllowed = allowedPaths.some(allowed => path.startsWith(allowed))
    if (isAllowed) {
      shell.openPath(path)
    }
  })
}

app.whenReady().then(() => {
  writeLog('INFO', '应用启动')
  setupIPC()
  createWindow()
  try { createTray() } catch (_e) { /* no tray icon */ }
  setupReminderCheck()
})

app.on('window-all-closed', () => {
  writeLog('INFO', '应用关闭')
  if (reminderTimer) clearInterval(reminderTimer)
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
