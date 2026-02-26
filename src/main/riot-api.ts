import axios from 'axios';

class RiotService {
    private apiKey: string;
    private region: string;
    private routingRegion: string;

    constructor(apiKey: string, region: string) {
        this.apiKey = apiKey;
        this.region = region;
        this.routingRegion = this.getRoutingRegion(region);
    }

    private getRoutingRegion(region: string): string {
        const mapping: Record<string, string> = {
            'euw1': 'europe',
            'eun1': 'europe',
            'na1': 'americas',
            'kr': 'asia',
            'jp1': 'asia',
            'br1': 'americas',
            'la1': 'americas',
            'la2': 'americas',
            'oc1': 'sea',
            'ph2': 'sea',
            'sg2': 'sea',
            'th2': 'sea',
            'tr1': 'europe',
            'ru': 'europe',
            'vn2': 'sea'
        };
        return mapping[region] || 'europe';
    }

    private async request(url: string) {
        try {
            const response = await axios.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return null;
            if (error.response?.status === 403) {

                throw error;
            }
            console.error(`Riot API Error [${url}]:`, error.response?.status, error.message);
            throw error;
        }
    }

    async getSummonerResolve(input: string) {

        if (input.includes('#')) {
            const [gameName, tagLine] = input.split('#');
            const account = await this.request(`https://${this.routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
            if (!account) return null;
            return this.getSummonerByPuuid(account.puuid);
        }


        return this.request(`https://${this.region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(input)}`);
    }

    async getSummonerByPuuid(puuid: string) {
        return this.request(`https://${this.region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`);
    }

    async getLeagueEntries(summonerId: string) {
        return this.request(`https://${this.region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`);
    }

    async getLeagueEntriesByPuuid(puuid: string) {
        return this.request(`https://${this.region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`);
    }

    async getMatchHistory(puuid: string, count: number = 20) {
        const matchIds = await this.request(`https://${this.routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`);
        return matchIds;
    }

    async getMatchDetails(matchId: string) {
        return this.request(`https://${this.routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`);
    }

    async getActiveGame(puuid: string) {
        return this.request(`https://${this.region}.api.riotgames.com/lol/spectator/v5/active-games/by-puuid/${puuid}`);
    }

    async getFeaturedGames() {
        return this.request(`https://${this.region}.api.riotgames.com/lol/spectator/v5/featured-games`);
    }
}

export default RiotService;
