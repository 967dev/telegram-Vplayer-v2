const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
    onUpdateError: (callback) => ipcRenderer.on('update_error', (event, message) => callback(message)),
    restartApp: () => ipcRenderer.send('restart_app')
});
