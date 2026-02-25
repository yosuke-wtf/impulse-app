import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import * as dotenv from 'dotenv'
import RiotService from './riot-api'
import fs from 'node:fs'
import axios from 'axios'
import https from 'node:https'
import { autoUpdater } from 'electron-updater'

// Global LCU Config
let lcuConfig: { port: string, token: string } | null = null;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Find LCU Lockfile
function discoverLCU() {
    const lockfilePath = 'C:\\Riot Games\\League of Legends\\lockfile';
    if (fs.existsSync(lockfilePath)) {
        const content = fs.readFileSync(lockfilePath, 'utf8');
        const [, , port, token] = content.split(':');
        lcuConfig = { port, token };
        return true;
    }
    return false;
}

// LCU Request Helper
async function lcuRequest(method: string, endpoint: string, data?: any) {
    if (!lcuConfig) discoverLCU();
    if (!lcuConfig) return null;
    try {
        const response = await axios({
            method,
            url: `https://127.0.0.1:${lcuConfig.port}${endpoint}`,
            data,
            headers: {
                'Authorization': `Basic ${Buffer.from(`riot:${lcuConfig.token}`).toString('base64')}`,
                'Accept': 'application/json'
            },
            httpsAgent: httpsAgent
        });
        return response.data;
    } catch (err) {
        return null;
    }
}

// Load environment variables - looking in root directory
dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(__dirname, '../src/.env') }) // Backup for different build structures
dotenv.config({ path: path.join(process.resourcesPath, '.env') }) // For packaged app resources
dotenv.config({ path: path.join(process.resourcesPath, 'src/.env') }) // For packaged app resources


const DIST_PATH = path.join(__dirname, '../dist')
const PUBLIC_PATH = app.isPackaged ? DIST_PATH : path.join(DIST_PATH, '../public')

process.env.DIST = DIST_PATH
process.env.VITE_PUBLIC = PUBLIC_PATH

let win: BrowserWindow | null
let riotService: RiotService | null = null

if (process.env.RIOT_API_KEY && process.env.REGION) {
    riotService = new RiotService(process.env.RIOT_API_KEY, process.env.REGION);
}

// Verification Log for API Key
if (process.env.RIOT_API_KEY) {
    const key = process.env.RIOT_API_KEY;
    const maskedKey = `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    console.log(`[SYSTEM] Loaded Riot API Key: ${maskedKey}`);
} else {
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
    })

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('api-config', {
            apiKey: 'PROTECTED', // Don't leak full key to console
            region: process.env.REGION,
            summonerName: process.env.SUMMONER_NAME
        })
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(DIST_PATH, 'index.html'))
    }
}

// IPC Handlers for Riot Data
ipcMain.handle('get-summoner-info', async (_event, args?: { name: string, region: string }) => {
    const name = args?.name || process.env.SUMMONER_NAME;
    const region = args?.region || process.env.REGION;

    if (!process.env.RIOT_API_KEY) return { success: false, error: 'NO_API_KEY' };
    if (!name || !region) return { success: false, error: 'MISSING_CONFIG' };

    // Use specific service for the requested region
    const service = new RiotService(process.env.RIOT_API_KEY, region);

    try {
        const summoner = await service.getSummonerResolve(name);
        if (!summoner) return { success: false, error: 'NOT_FOUND' };

        console.log('[DEBUG] Summoner Object Keys:', Object.keys(summoner));
        console.log('[DEBUG] Summoner ID:', summoner.id);

        let leagueEntries = [];
        if (summoner.id) {
            leagueEntries = await service.getLeagueEntries(summoner.id);
        } else {
            console.warn('[WARN] No Summoner ID found (Encrypted ID). Profile might be incomplete.');
        }

        // Find solo queue rank
        const soloQ = leagueEntries.find((e: any) => e.queueType === 'RANKED_SOLO_5x5');

        const allRanks = leagueEntries.map((e: any) => ({
            queueType: e.queueType,
            tier: e.tier,
            rank: e.rank,
            lp: e.leaguePoints,
            wins: e.wins,
            losses: e.losses,
            winrate: Math.round((e.wins / (e.wins + e.losses)) * 100)
        }));

        const returnData = {
            success: true,
            data: {
                name: summoner.name || name,
                level: summoner.summonerLevel,
                rank: soloQ ? `${soloQ.tier} ${soloQ.rank}` : 'UNRANKED',
                lp: soloQ ? soloQ.leaguePoints : 0,
                winrate: soloQ ? Math.round((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100) : 0,
                iconId: summoner.profileIconId,
                puuid: summoner.puuid,
                region: region,
                allRanks: allRanks
            }
        };
        console.log('[DEBUG] Returning Data:', JSON.stringify(returnData, null, 2));
        return returnData;
    } catch (err: any) {
        console.error('IPC get-summoner-info error:', err);
        return {
            success: false,
            error: 'API_ERROR',
            status: err.response?.status || 500
        };
    }
});

ipcMain.handle('get-recent-matches', async (_event, puuid: string, regionArg?: string) => {
    const region = regionArg || process.env.REGION;
    console.log('[DEBUG] get-recent-matches called with:', { puuid, region });

    if (!puuid || puuid === 'undefined') {
        console.error('[ERROR] Matches requested for undefined PUUID!');
        return [];
    }

    if (!process.env.RIOT_API_KEY || !region) return [];

    const service = new RiotService(process.env.RIOT_API_KEY, region);

    try {
        const matchIds = await service.getMatchHistory(puuid, 5);
        const matches = await Promise.all(matchIds.map((id: string) => service.getMatchDetails(id)));

        return matches.map(m => {
            const participant = m.info.participants.find((p: any) => p.puuid === puuid);
            const isRemake = m.info.gameDuration < 300;

            return {
                win: participant.win,
                remake: isRemake,
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                champion: participant.championName,
                mode: m.info.gameMode,
                duration: m.info.gameDuration,
                timestamp: m.info.gameCreation,
                cs: (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0),
                spells: [participant.summoner1Id, participant.summoner2Id],
                runes: [
                    participant.perks?.styles?.[0]?.selections?.[0]?.perk,
                    participant.perks?.styles?.[1]?.style
                ],
                items: [
                    participant.item0, participant.item1, participant.item2,
                    participant.item3, participant.item4, participant.item5, participant.item6
                ],
                largestMultiKill: participant.largestMultiKill,
                firstBloodKill: participant.firstBloodKill,
                totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
                participants: m.info.participants.map((p: any) => ({
                    summonerName: p.summonerName,
                    championName: p.championName,
                    teamId: p.teamId,
                    puuid: p.puuid
                }))
            };
        });
    } catch (err) {
        console.error('IPC get-recent-matches error:', err);
        return [];
    }
});

ipcMain.handle('get-active-game', async (_event, args: { puuid: string, region: string }) => {
    if (!process.env.RIOT_API_KEY || !args.puuid || !args.region) return null;
    const service = new RiotService(process.env.RIOT_API_KEY, args.region);
    try {
        return await service.getActiveGame(args.puuid);
    } catch (err: any) {
        if (err.response?.status === 404) return null; // Not in game
        if (err.response?.status === 403) {
            // New accounts or certain regions might return 403 for spectator calls
            console.warn('[OFFSIDE] Spectator API returned 403 (Forbidden). This is common for new accounts.');
            return null;
        }
        console.error('IPC get-active-game error:', err);
        return null;
    }
});

ipcMain.handle('get-featured-games', async (_event, regionArg: string) => {
    const region = regionArg || process.env.REGION || 'euw1';
    if (!process.env.RIOT_API_KEY) return [];
    const service = new RiotService(process.env.RIOT_API_KEY, region);
    try {
        const data = await service.getFeaturedGames();
        return data?.gameList || [];
    } catch (err) {
        console.error('IPC get-featured-games error:', err);
        return [];
    }
});

ipcMain.handle('verify-admin', async (_event, discordId: string) => {
    if (!discordId) return false;
    const allowedString = process.env.AdminAllowed || '';
    const adminIds = allowedString.split(',').map((id: string) => id.trim());
    return adminIds.includes(discordId.trim());
});

let latestAnnouncement = "";
let announcementAuthor = "";
let announcementTime = 0;

ipcMain.handle('post-announcement', async (_event, data: { text: string, author: string }) => {
    latestAnnouncement = data.text;
    announcementAuthor = data.author || 'Admin';
    announcementTime = Date.now();
    return true;
});

ipcMain.handle('get-announcement', async () => {
    return { text: latestAnnouncement, author: announcementAuthor, time: announcementTime };
});

// Added to fetch live ranks for all participants during the match
ipcMain.handle('get-live-participants-ranks', async (_event, args: { participants: any[], region: string, gameMode: string }) => {
    if (!process.env.RIOT_API_KEY || !args.participants || !args.region) return [];
    const service = new RiotService(process.env.RIOT_API_KEY, args.region);

    const resolvedRanks = await Promise.all(
        args.participants.map(async (p: any) => {
            try {
                let summonerId = p.summonerId;
                if (!summonerId && p.puuid) {
                    const sum = await service.getSummonerByPuuid(p.puuid);
                    if (sum) summonerId = sum.id;
                }

                if (!summonerId) return { puuid: p.puuid, summonerId: p.summonerId, rank: 'Unranked', winrate: 0 };

                const entries = await service.getLeagueEntries(summonerId);
                let queueType = 'RANKED_SOLO_5x5';
                if (args.gameMode.includes('FLEX')) queueType = 'RANKED_FLEX_SR';
                if (args.gameMode.includes('ARAM')) {
                    // ARAM has no "rank", just show Unranked or generic level
                    return { puuid: p.puuid, summonerId: p.summonerId, rank: 'ARAM', winrate: '-' };
                }

                const queueEntry = entries.find((e: any) => e.queueType === queueType) || entries[0];

                if (queueEntry) {
                    const totalGames = queueEntry.wins + queueEntry.losses;
                    const winrate = totalGames > 0 ? Math.round((queueEntry.wins / totalGames) * 100) : 0;
                    return {
                        puuid: p.puuid,
                        summonerId: p.summonerId,
                        rank: `${queueEntry.tier} ${queueEntry.rank}`,
                        winrate: winrate
                    };
                }

                return { puuid: p.puuid, summonerId: p.summonerId, rank: 'Unranked', winrate: 0 };
            } catch (err) {
                console.error('Error fetching live participant rank:', err);
                return { puuid: p.puuid, summonerId: p.summonerId, rank: 'API Limit', winrate: 0 };
            }
        })
    );

    return resolvedRanks;
});

// --- Tactical Overlay APIs ---

// 1. Gold Difference Calculator
ipcMain.handle('get-gold-analysis', async (_event, gameData: any) => {
    if (!gameData || !gameData.participants) return null;

    // In a real app, we'd fetch item values from DataDragon
    // For now, let's mock the analysis
    const teams: Record<string, number> = { '100': 0, '200': 0 };
    gameData.participants.forEach((p: any) => {
        // Mock gold calculation based on level and generic item count
        const mockGold = (p.summonerLevel * 500) + 1000;
        teams[p.teamId] += mockGold;
    });

    return {
        team100: teams['100'],
        team200: teams['200'],
        diff: Math.abs(teams['100'] - teams['200'])
    };
});

// 2. Jungle Respawn Timers
ipcMain.handle('get-jungle-timers', async (_event) => {
    // This would typically monitor game events via LCU or Memory Reading
    return [
        { name: 'Blue Buff', respawnIn: 120, side: 'ally' },
        { name: 'Red Buff', respawnIn: 45, side: 'enemy' },
        { name: 'Dragon', respawnIn: 310, side: 'neutral' }
    ];
});

// 3. Benchmarking (Performance)
ipcMain.handle('get-performance-stats', async (_event) => {
    // Local LCU stats
    const stats = await lcuRequest('GET', '/lol-ingame-counter/v1/stats');
    return stats || { cs: 0, csPerMin: 0, kda: "0/0/0" };
});

// 4. Arena Data
ipcMain.handle('get-arena-data', async () => {
    return await lcuRequest('GET', '/lol-arena/v1/augments');
});

// 5. Skill Order
ipcMain.handle('get-skill-order', async (_event, champId: number) => {
    return [1, 2, 3, 1, 1, 4, 1]; // Mock: Q, W, E, Q, Q, R, Q
});

// 6. Trinket Status
ipcMain.handle('get-trinket-status', async () => {
    const items = await lcuRequest('GET', '/lol-active-inventory/v1/items');
    return items?.find((i: any) => i.slot === 'Trinket') || null;
});

// 7. Loading Screen Analysis
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

// 8. Champions API
ipcMain.handle('get-champions', async () => {
    try {
        const res = await axios.get('https://ddragon.leagueoflegends.com/cdn/14.4.1/data/en_US/champion.json');
        return Object.values(res.data.data);
    } catch (err) {
        console.error('Failed to fetch champions:', err);
        return [];
    }
});

// 9. Global Tier List
ipcMain.handle('get-tier-list', async (_event, mode = 'Rangliste Solo') => {
    // Note: The official Riot API does NOT provide global champion tier lists or win rates.
    // In a real prod app, you would query an internal database that aggregates millions of matches.
    // Here we generate realistic mock data based on the selected mode.

    let tiers = {
        SP: ['Ahri', 'Zilean'],
        S: ['Velkoz', 'LeeSin', 'Kaisa', 'Jinx'],
        A: ['Aatrox', 'Lux', 'Ezreal', 'Malphite', 'Thresh', 'Zed'],
        B: ['Vayne', 'Garen', 'Veigar', 'Ashe', 'Braum', 'Annie'],
        C: ['Sivir', 'Brand', 'Morg'],
        D: ['Riven', 'Yasuo', 'Yone']
    };

    if (mode.includes('ARAM')) {
        tiers = {
            SP: ['Veigar', 'Sona'],
            S: ['Ziggs', 'Xerath', 'Lux', 'Ezreal'],
            A: ['Ashe', 'Kaisa', 'Jinx', 'MissFortune', 'Jhin', 'Velkoz'],
            B: ['Aatrox', 'Garen', 'Darius', 'Sett', 'Illaoi', 'Mordekaiser'],
            C: ['Zed', 'Talon', 'Qiyana'],
            D: ['Evelynn', 'Rengar', 'Shaco']
        };
    } else if (mode === 'URF') {
        tiers = {
            SP: ['Hecarim', 'Zed'],
            S: ['Shaco', 'Fizz', 'Vladimir', 'MasterYi'],
            A: ['Malphite', 'Lux', 'Morgana', 'Ezreal', 'Yuumi', 'Nidalee'],
            B: ['Jax', 'Fiora', 'Irelia', 'Riven', 'Camille', 'Vi'],
            C: ['Ashe', 'Caitlyn', 'Jinx'],
            D: ['Braum', 'TahmKench', 'Taric']
        };
    } else if (mode.includes('Arena')) {
        tiers = {
            SP: ['Trundle', 'Warwick'],
            S: ['Kayn', 'Mordekaiser', 'Taric', 'Swain'],
            A: ['Alistar', 'Poppy', 'Vayne', 'Fiora', 'Jax', 'Vi'],
            B: ['Brand', 'Zyra', 'Heimerdinger', 'Shaco', 'Teemo', 'Singed'],
            C: ['Katarina', 'Akali', 'Qiyana'],
            D: ['Yuumi', 'Soraka', 'Sona']
        };
    }

    return tiers;
});

// 10. ARAM Augments & Sets
ipcMain.handle('get-aram-data', async () => {
    // Note: Mock data as real Riot API doesn't have an endpoint for ARAM specific Augments & Sets.
    return [
        {
            name: "Würfelspieler",
            iconClass: "fa-dice",
            tier: "",
            desc: "Collect multiple augments from the same set to unlock powerful bonuses.",
            bonuses: [
                { count: 2, text: "Vasallen haben eine Chance, bei ihrem Tod eine Werte-Schmiede fallen zu lassen." },
                { count: 3, text: "+20 % Chance auf goldene oder prismatische Schmieden" },
                { count: 4, text: "+50 % Chance auf goldene oder prismatische Schmieden" }
            ],
            augments: ["Iceborn", "Rapid Firecannon", "Locket", "Zhonyas"],
            champions: []
        },
        {
            name: "Steigerosaurus Rex",
            iconClass: "fa-dragon",
            tier: "S",
            desc: "Wenn du Steigerungen erhältst, erhältst du zusätzliche Steigerungen.",
            bonuses: [
                { count: 2, text: "Du erhältst <strong style='color:#fff'>50%</strong> mehr Steigerungen." },
                { count: 3, text: "Du erhältst <strong style='color:#fff'>100%</strong> mehr Steigerungen." },
                { count: 4, text: "Du erhältst <strong style='color:#fff'>200%</strong> mehr Steigerungen." }
            ],
            augments: ["Grasp", "Overgrowth", "Conditioning", "Gathering Storm", "Dark Harvest"],
            champions: ["Samira", "Leona", "Chogath", "Swain", "Sejuani", "Galio", "Alistar", "Ornn"]
        },
        {
            name: "Feuerwerksset",
            iconClass: "fa-bomb",
            tier: "A",
            desc: "<strong style='color:#0f0'>Feuerwerkskörper</strong> springen zusätzliche Male zu den nächstbefindlichen Gegnern und verursachen einen Anteil ihres ursprünglichen Schadens.",
            bonuses: [
                { count: 2, text: "<strong>2 Sprünge</strong>, die 25% des ursprünglichen Schadens verursachen." },
                { count: 4, text: "<strong>3 Sprünge</strong>, die 50% des ursprünglichen Schadens verursachen." }
            ],
            augments: ["Arcane Comet", "Aery", "Scorch", "Cheap Shot"],
            champions: ["Brand", "Jinx", "Ezreal", "Kaisa", "KogMaw", "Velkoz"]
        },
        {
            name: "Vollautomatisch",
            iconClass: "fa-dharmachakra",
            tier: "A",
            desc: "Set-Bonus",
            bonuses: [
                { count: 2, text: "Verringert Abklingzeit von <strong style='color:#d8b4fe'>Automatisches Beschwören</strong> um 30 %." },
                { count: 3, text: "Abklingzeit von <strong style='color:#d8b4fe'>Automatisches Beschwören</strong> skaliert mit Fähigkeitstempo." }
            ],
            augments: ["Glacial Augment", "Inspiration", "Cosmic Insight"],
            champions: ["Heimerdinger", "Zyra", "Teemo", "Shaco", "Ivern"]
        }
    ];
});

let overlayWin: BrowserWindow | null = null;

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
                    preload: path.join(__dirname, 'preload.js'),
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(() => {
    createWindow();

    // Auto-Updater Logic
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
        console.log('[AUTO-UPDATER] Update available.');
    });

    autoUpdater.on('update-downloaded', async () => {
        console.log('[AUTO-UPDATER] Update downloaded. Prompting user.');
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
});
