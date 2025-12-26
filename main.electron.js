const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 450,
        height: 800,
        minWidth: 320,
        minHeight: 568,
        title: "Sonic Glow",
        icon: path.join(__dirname, 'manifest.json'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    // Force 9:16 aspect ratio (Portrait mode)
    win.setAspectRatio(9 / 16);

    // Remove the menu bar for a cleaner "app" look
    win.setMenuBarVisibility(false);

    win.loadFile('index.html');
}

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
