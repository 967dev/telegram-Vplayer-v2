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
    if (win) win.webContents.send('update_available');
});

autoUpdater.on('download-progress', (progressObj) => {
    if (win) win.webContents.send('download_progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', () => {
    if (win) win.webContents.send('update_downloaded');
});

autoUpdater.on('error', (err) => {
    win.webContents.send('update_error', err.message);
});

// ICY Metadata Logic
const http = require('http');
const https = require('https');
let metadataRequest = null;

function stopMetadataMonitoring() {
    if (metadataRequest) {
        metadataRequest.destroy();
        metadataRequest = null;
    }
}

function startMetadataMonitoring(url, redirectCount = 0) {
    stopMetadataMonitoring();
    if (!url || !url.startsWith('http') || redirectCount > 5) return;

    try {
        const protocol = url.startsWith('https') ? https : http;
        metadataRequest = protocol.get(url, { headers: { 'Icy-MetaData': '1' } }, (res) => {
            // Handle Redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return startMetadataMonitoring(res.headers.location, redirectCount + 1);
            }

            const icyMetaInt = parseInt(res.headers['icy-metaint']);
            if (!icyMetaInt) return;

            let bytesUntilMeta = icyMetaInt;
            let metaLength = -1;
            let metaBuffer = Buffer.alloc(0);

            res.on('data', (chunk) => {
                let offset = 0;
                while (offset < chunk.length) {
                    if (metaLength === -1) {
                        // Skipping audio data
                        const canSkip = Math.min(bytesUntilMeta, chunk.length - offset);
                        offset += canSkip;
                        bytesUntilMeta -= canSkip;

                        if (bytesUntilMeta === 0) {
                            if (offset < chunk.length) {
                                // We reached the length byte
                                metaLength = chunk[offset] * 16;
                                offset++;
                                if (metaLength === 0) {
                                    bytesUntilMeta = icyMetaInt;
                                    metaLength = -1;
                                }
                            } else {
                                // Length byte is in the next chunk
                                // (This is rare but possible, handled in next loop)
                            }
                        }
                    } else {
                        // Collecting metadata string
                        const canCollect = Math.min(metaLength - metaBuffer.length, chunk.length - offset);
                        metaBuffer = Buffer.concat([metaBuffer, chunk.slice(offset, offset + canCollect)]);
                        offset += canCollect;

                        if (metaBuffer.length === metaLength) {
                            try {
                                const metaData = metaBuffer.toString('utf8');
                                const match = metaData.match(/StreamTitle='(.*?)';/);
                                if (match && match[1] && win) {
                                    win.webContents.send('metadata_updated', match[1]);
                                }
                            } catch (e) {}
                            
                            metaBuffer = Buffer.alloc(0);
                            metaLength = -1;
                            bytesUntilMeta = icyMetaInt;
                        }
                    }
                    
                    // Small guard for edge case where offset is at end but metaLength still -1
                    if (offset === chunk.length && metaLength === -1 && bytesUntilMeta === 0) {
                        // The very last byte of chunk was NOT the length byte (it belongs to next chunk)
                    }
                }
            });
        }).on('error', () => {});
    } catch (e) {
        console.log('ICY Exception:', e.message);
    }
}

// IPC Listener to restart and install
const { ipcMain } = require('electron');
ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

ipcMain.on('start_metadata', (event, url) => {
    startMetadataMonitoring(url);
});

ipcMain.on('stop_metadata', () => {
    stopMetadataMonitoring();
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
