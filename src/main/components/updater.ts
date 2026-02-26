import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

export function initAutoUpdater() {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
    });

    autoUpdater.on('update-downloaded', async () => {
        const result = await dialog.showMessageBox({
            type: 'info',
            title: 'Impulse - Update verfügbar!',
            message: 'Ein neues Update wurde erfolgreich heruntergeladen.\nMöchtest du Impulse jetzt neustarten, um das Update zu installieren?',
            buttons: ['Jetzt installieren', 'Später (beim nächsten Start)']
        });

        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
}
