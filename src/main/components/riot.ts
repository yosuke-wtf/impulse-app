import { ipcMain } from 'electron';
import RiotService from '../riot-api';

export function registerRiotHandlers() {
    ipcMain.handle('get-summoner-info', async (_event, args?: { name: string, region: string }) => {
        const name = args?.name || process.env.SUMMONER_NAME;
        const region = args?.region || process.env.REGION;

        if (!process.env.RIOT_API_KEY) return { success: false, error: 'NO_API_KEY' };
        if (!name || !region) return { success: false, error: 'MISSING_CONFIG' };

        const service = new RiotService(process.env.RIOT_API_KEY, region);

        try {
            const summoner = await service.getSummonerResolve(name);
            if (!summoner) return { success: false, error: 'NOT_FOUND' };

            let leagueEntries = [];
            try {
                leagueEntries = await service.getLeagueEntriesByPuuid(summoner.puuid);
            } catch (err: any) {
                if (summoner.id) {
                    leagueEntries = await service.getLeagueEntries(summoner.id);
                }
            }

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

            return {
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
        if (!puuid || puuid === 'undefined') return [];
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
                        riotIdGameName: p.riotIdGameName,
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
            if (err.response?.status === 404) return null;
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
        } catch (err: any) {
            return [];
        }
    });

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
                    return { puuid: p.puuid, summonerId: p.summonerId, rank: 'API Limit', winrate: 0 };
                }
            })
        );

        return resolvedRanks;
    });
}
