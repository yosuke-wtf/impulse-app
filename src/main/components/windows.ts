import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

let overlayWin: BrowserWindow | null = null;
const DIST_PATH = path.join(__dirname, '../../dist');

export function registerWindowHandlers() {
    ipcMain.handle('toggle-overlay', (_event, visible: boolean) => {
        if (visible) {
            if (!overlayWin) {
                overlayWin = new BrowserWindow({
                    width: 350,
                    height: 500,
                    x: 50,
                    y: 50,
                    transparent: true,
                    frame: false,
                    alwaysOnTop: true,
                    hasShadow: false,
                    webPreferences: {
                        preload: path.join(__dirname, '../preload.js'),
                    },
                });

                if (process.env.VITE_DEV_SERVER_URL) {
                    overlayWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}#overlay`);
                } else {
                    overlayWin.loadFile(path.join(DIST_PATH, 'index.html'), { hash: 'overlay' });
                }
            } else {
                overlayWin.show();
            }
        } else {
            overlayWin?.hide();
        }
    });

    return {
        getOverlayWindow: () => overlayWin
    };
}
