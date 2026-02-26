import { ipcMain } from 'electron';
import { lcuRequest } from './lcu';
import RiotService from '../riot-api';

export function registerTacticalHandlers() {
    ipcMain.handle('get-gold-analysis', async (_event, gameData: any) => {
        if (!gameData || !gameData.participants) return null;
        const teams: Record<string, number> = { '100': 0, '200': 0 };
        gameData.participants.forEach((p: any) => {
            const mockGold = (p.summonerLevel * 500) + 1000;
            teams[p.teamId] += mockGold;
        });
        return {
            team100: teams['100'],
            team200: teams['200'],
            diff: Math.abs(teams['100'] - teams['200'])
        };
    });

    ipcMain.handle('get-jungle-timers', async (_event) => {
        return [
            { name: 'Blue Buff', respawnIn: 120, side: 'ally' },
            { name: 'Red Buff', respawnIn: 45, side: 'enemy' },
            { name: 'Dragon', respawnIn: 310, side: 'neutral' }
        ];
    });

    ipcMain.handle('get-performance-stats', async (_event) => {
        const stats = await lcuRequest('GET', '/lol-ingame-counter/v1/stats');
        return stats || { cs: 0, csPerMin: 0, kda: "0/0/0" };
    });

    ipcMain.handle('get-arena-data', async () => {
        return await lcuRequest('GET', '/lol-arena/v1/augments');
    });

    ipcMain.handle('get-skill-order', async (_event, champId: number) => {
        return [1, 2, 3, 1, 1, 4, 1];
    });

    ipcMain.handle('get-trinket-status', async () => {
        const items = await lcuRequest('GET', '/lol-active-inventory/v1/items');
        return items?.find((i: any) => i.slot === 'Trinket') || null;
    });

    ipcMain.handle('get-loading-analysis', async (_event, participants: any[]) => {
        if (!participants || !process.env.RIOT_API_KEY) return [];
        const service = new RiotService(process.env.RIOT_API_KEY, process.env.REGION || 'euw1');
        return await Promise.all(participants.map(async (p) => {
            try {
                const league = await service.getLeagueEntries(p.summonerId);
                return { ...p, league };
            } catch { return p; }
        }));
    });
}
