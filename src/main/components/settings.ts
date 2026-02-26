import { app, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

const settingsPath = path.join(app.getPath('userData'), 'impulse-settings.json');

function readSettings(): Record<string, any> {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch { }
    return {};
}

export function registerSettingsHandlers() {
    ipcMain.handle('save-settings', (_event, settings: Record<string, any>) => {
        try {
            const existing = readSettings();
            const merged = { ...existing, ...settings };
            fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2), 'utf8');
            return { ok: true };
        } catch (err: any) {
            return { ok: false };
        }
    });

    ipcMain.handle('load-settings', () => {
        return readSettings();
    });
}
