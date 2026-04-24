import type { IApi } from '../../preload/index.d'

// 内存存储，作为开发模式下的 fallback
const memoryStore: Record<string, any> = {
  todos: [],
  categories: ['工作', '学习', '生活'],
  settings: { darkMode: false }
}

// 当 window.api 不可用时（浏览器中直接打开），使用内存 fallback
const fallbackApi: IApi = {
  store: {
    get: async (key: string) => memoryStore[key],
    set: async (key: string, value: any) => { memoryStore[key] = value }
  },
  window: {
    minimize: async () => {},
    maximize: async () => {},
    close: async () => {}
  },
  dialog: {
    exportData: async (data: string) => {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'todos-backup.json'
      a.click()
      URL.revokeObjectURL(url)
      return true
    },
    importData: async () => {
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = () => {
          const file = input.files?.[0]
          if (!file) { resolve(null); return }
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsText(file)
        }
        input.click()
      })
    }
  },
  theme: {
    getSystem: async () => window.matchMedia('(prefers-color-scheme: dark)').matches
  },
  notify: {
    show: async (title: string, body: string) => {
      // 浏览器模式下使用 Web Notification（需用户授权），失败时静默
      try {
        if (typeof Notification === 'undefined') return
        if (Notification.permission === 'granted') {
          new Notification(title, { body })
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission()
          if (perm === 'granted') new Notification(title, { body })
        }
      } catch { /* ignore */ }
    }
  },
  app: {
    getVersion: async () => '（浏览器模式）',
    onBeforeQuit: () => { /* 浏览器模式下不需要 */ },
    notifyFlushDone: () => { /* 浏览器模式下不需要 */ }
  },
  config: {
    get: async () => ({
      dataPath: '（浏览器模式 - 内存存储）',
      logPath: '（浏览器模式 - 无日志）',
      logEnabled: false,
      defaultDataPath: '（浏览器模式）',
      defaultLogPath: '（浏览器模式）'
    }),
    setDataPath: async () => null,
    resetDataPath: async () => '（浏览器模式）',
    setLogPath: async () => null,
    resetLogPath: async () => '（浏览器模式）',
    setLogEnabled: async () => {},
    openPath: async () => {}
  }
}

export function getApi(): IApi {
  return window.api || fallbackApi
}
