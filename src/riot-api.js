import axios from 'axios';
class RiotService {
    apiKey;
    region;
    routingRegion;
    constructor(apiKey, region) {
        this.apiKey = apiKey;
        this.region = region;
        this.routingRegion = this.getRoutingRegion(region);
    }
    getRoutingRegion(region) {
        const mapping = {
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
    async request(url) {
        try {
            const response = await axios.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            console.log(`[DEBUG] Riot API Response [${url.split('?')[0]}]:`, JSON.stringify(response.data));
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404)
                return null;
            console.error(`Riot API Error [${url}]:`, error.response?.status, error.message);
            throw error;
        }
    }
    async getSummonerResolve(input) {
        // Handle Name#Tag
        if (input.includes('#')) {
            const [gameName, tagLine] = input.split('#');
            const account = await this.request(`https://${this.routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
            if (!account)
                return null;
            return this.getSummonerByPuuid(account.puuid);
        }
        // Try traditional summoner name (deprecated but still works for many)
        return this.request(`https://${this.region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(input)}`);
    }
    async getSummonerByPuuid(puuid) {
        return this.request(`https://${this.region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`);
    }
    async getLeagueEntries(summonerId) {
        return this.request(`https://${this.region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`);
    }
    async getMatchHistory(puuid, count = 20) {
        const matchIds = await this.request(`https://${this.routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`);
        return matchIds;
    }
    async getMatchDetails(matchId) {
        return this.request(`https://${this.routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`);
    }
    async getActiveGame(puuid) {
        return this.request(`https://${this.region}.api.riotgames.com/lol/spectator/v5/active-games/by-puuid/${puuid}`);
    }
    async getFeaturedGames() {
        return this.request(`https://${this.region}.api.riotgames.com/lol/spectator/v5/featured-games`);
    }
}
export default RiotService;
//# sourceMappingURL=riot-api.js.map