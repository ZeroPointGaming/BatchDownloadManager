const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('Electron', {
    ipcRenderer: {
      send: (channel, data) => ipcRenderer.send(channel, data),
      on: (channel, listener) => ipcRenderer.on(channel, listener),
      once: (channel, listener) => ipcRenderer.once(channel, listener),
      invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    },
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
    loadSettings: () => ipcRenderer.send('load-settings'),
    startDownloads: (data) => ipcRenderer.send('start-downloads', data),
    pauseDownload: (url) => ipcRenderer.send('pause-download', url),
    resumeDownload: (url) => ipcRenderer.send('resume-download', url),
    stopDownload: (url) => ipcRenderer.send('stop-download', url),
    setMaxSpeed: (speed) => ipcRenderer.send('set-max-speed', speed),
    setMaxConcurrentDownloads: (maxConcurrent) => ipcRenderer.send('set-max-concurrent-downloads', maxConcurrent),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, url) => callback(url)),
    onDownloadError: (callback) => ipcRenderer.on('download-error', (event, data) => callback(data)),
    onSettingsLoaded: (callback) => ipcRenderer.on('settings-loaded', (event, settings) => callback(settings)),
})