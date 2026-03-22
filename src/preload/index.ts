import { contextBridge, ipcRenderer } from 'electron'

const api = {
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value)
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  dialog: {
    exportData: (data: string) => ipcRenderer.invoke('dialog:export', data),
    importData: () => ipcRenderer.invoke('dialog:import')
  },
  theme: {
    getSystem: () => ipcRenderer.invoke('theme:get-system')
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    setDataPath: () => ipcRenderer.invoke('config:setDataPath'),
    resetDataPath: () => ipcRenderer.invoke('config:resetDataPath'),
    setLogPath: () => ipcRenderer.invoke('config:setLogPath'),
    resetLogPath: () => ipcRenderer.invoke('config:resetLogPath'),
    setLogEnabled: (enabled: boolean) => ipcRenderer.invoke('config:setLogEnabled', enabled),
    openPath: (path: string) => ipcRenderer.invoke('config:openPath', path)
  }
}

contextBridge.exposeInMainWorld('api', api)
