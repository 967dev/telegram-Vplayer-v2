const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('download_progress', (event, percent) => callback(percent)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
    onUpdateError: (callback) => ipcRenderer.on('update_error', (event, message) => callback(message)),
    restartApp: () => ipcRenderer.send('restart_app'),
    startMetadata: (url) => ipcRenderer.send('start_metadata', url),
    stopMetadata: () => ipcRenderer.send('stop_metadata'),
    onMetadataUpdated: (callback) => ipcRenderer.on('metadata_updated', (event, title) => callback(title))
});
