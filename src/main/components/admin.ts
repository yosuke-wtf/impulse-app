import { ipcMain } from 'electron';

let latestAnnouncement = "";
let announcementAuthor = "";
let announcementTime = 0;

export function registerAdminHandlers() {
    ipcMain.handle('verify-admin', async (_event, discordId: string) => {
        if (!discordId) return false;
        const allowedString = process.env.AdminAllowed || '';
        const adminIds = allowedString.split(',').map((id: string) => id.trim());
        return adminIds.includes(discordId.trim());
    });

    ipcMain.handle('post-announcement', async (_event, data: { text: string, author: string }) => {
        latestAnnouncement = data.text;
        announcementAuthor = data.author || 'Admin';
        announcementTime = Date.now();
        return true;
    });

    ipcMain.handle('get-announcement', async () => {
        return { text: latestAnnouncement, author: announcementAuthor, time: announcementTime };
    });
}
