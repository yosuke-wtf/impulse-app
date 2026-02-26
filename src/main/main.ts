import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { registerRiotHandlers } from './components/riot';
import { registerTacticalHandlers } from './components/tactical';
import { registerDataHandlers } from './components/data';
import { registerAdminHandlers } from './components/admin';
import { registerSettingsHandlers } from './components/settings';
import { registerWindowHandlers } from './components/windows';
import { initAutoUpdater } from './components/updater';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../src/.env') });
dotenv.config({ path: path.join(process.resourcesPath, '.env') });
dotenv.config({ path: path.join(process.resourcesPath, 'src/.env') });

const DIST_PATH = path.join(__dirname, '../dist');
const PUBLIC_PATH = app.isPackaged ? DIST_PATH : path.join(DIST_PATH, '../public');

process.env.DIST = DIST_PATH;
process.env.VITE_PUBLIC = PUBLIC_PATH;

let win: BrowserWindow | null = null;

if (!process.env.RIOT_API_KEY) {
    console.warn('[SYSTEM] No Riot API Key found in .env!');
}

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(PUBLIC_PATH, 'logo.png'),
        width: 1240,
        height: 840,
        backgroundColor: '#0a0e1a',
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0a0e1a',
            symbolColor: '#ffffff',
            height: 35
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('api-config', {
            apiKey: 'PROTECTED',
            region: process.env.REGION,
            summonerName: process.env.SUMMONER_NAME
        });
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(DIST_PATH, 'index.html'));
    }
}

app.whenReady().then(() => {
    registerRiotHandlers();
    registerTacticalHandlers();
    registerDataHandlers();
    registerAdminHandlers();
    registerSettingsHandlers();
    registerWindowHandlers();
    initAutoUpdater();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});
