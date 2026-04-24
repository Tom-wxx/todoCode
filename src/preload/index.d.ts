export interface IApi {
  store: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
  }
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
  }
  dialog: {
    exportData: (data: string) => Promise<boolean>
    importData: () => Promise<string | null>
  }
  theme: {
    getSystem: () => Promise<boolean>
  }
  notify: {
    show: (title: string, body: string) => Promise<void>
  }
  app: {
    getVersion: () => Promise<string>
    onBeforeQuit: (callback: () => void) => void
    notifyFlushDone: () => void
  }
  config: {
    get: () => Promise<{
      dataPath: string
      logPath: string
      logEnabled: boolean
      defaultDataPath: string
      defaultLogPath: string
    }>
    setDataPath: () => Promise<string | null>
    resetDataPath: () => Promise<string>
    setLogPath: () => Promise<string | null>
    resetLogPath: () => Promise<string>
    setLogEnabled: (enabled: boolean) => Promise<void>
    openPath: (path: string) => Promise<void>
  }
}

declare global {
  interface Window {
    api: IApi
  }
}
