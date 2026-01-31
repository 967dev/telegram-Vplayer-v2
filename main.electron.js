const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 450,
        height: 800,
        minWidth: 320,
        minHeight: 568,
        title: "967player",
        icon: path.join(__dirname, 'logo1.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Force 9:16 aspect ratio (Portrait mode)
    win.setAspectRatio(9 / 16);

    // Remove the menu bar for a cleaner "app" look
    win.setMenuBarVisibility(false);

    win.loadFile('index.html');

    // Check for updates after the window is shown
    win.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
}

// Auto-Update Events
autoUpdater.on('update-available', () => {
    win.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update_downloaded');
});

autoUpdater.on('error', (err) => {
    win.webContents.send('update_error', err.message);
});

// IPC Listener to restart and install
const { ipcMain } = require('electron');
ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
