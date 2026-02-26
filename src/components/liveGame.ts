import { state } from '../main/state';
import { updateOverlayWindow } from './overlayUI';

const DDR = 'https://ddragon.leagueoflegends.com/cdn/16.4.1/img/champion';



export function startLiveTracking(): void {
    if (state.liveTrackingInterval) clearInterval(state.liveTrackingInterval);
    checkActiveGame();
    state.liveTrackingInterval = setInterval(checkActiveGame, 60_000);
}


export async function checkActiveGame(): Promise<void> {
    if (!state.currentUser) return;

    try {
        const activeGame = await window.ipcRenderer.invoke('get-active-game', {
            puuid: state.currentUser.puuid,
            region: state.currentUser.region,
        });

        if (activeGame) {

            if (state.isOverlayEnabled) {
                window.ipcRenderer.invoke('toggle-overlay', true);
            }
            updateLiveUI(activeGame);
        } else {

            window.ipcRenderer.invoke('toggle-overlay', false);
            renderFeaturedGames();
        }
    } catch (err) {
        console.error('[LiveGame] Fehler beim Prüfen des aktiven Spiels:', err);
    }
}

async function updateLiveUI(game: any): Promise<void> {
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }

    const participantsList = document.querySelector('.participants-list');
    const selfMatch = game.participants.find(
        (p: any) => p.puuid === state.currentUser?.puuid
    ) ?? game.participants[0];

    if (participantsList) {

        participantsList.innerHTML = game.participants.map((p: any) => {
            const isAlly = p.teamId === selfMatch.teamId;
            const champInfo = state.allChampions.find((c: any) => c.key === String(p.championId));
            const champImg = champInfo?.image.full ?? 'Unknown.png';

            return `
                <div class="participant-row ${isAlly ? 'ally' : 'enemy'}" id="live-p-${p.summonerId ?? p.puuid}">
                    <div class="champ-img" style="
                        background-image:url(${DDR}/${champImg});
                        width:32px; height:32px; background-size:cover; border-radius:4px;">
                    </div>
                    <span class="p-name">${p.riotId || p.summonerName || 'Hidden'}</span>
                    <span class="p-rank rank-placeholder">Analyzing...</span>
                    <span class="p-winrate wr-placeholder"></span>
                </div>`;
        }).join('');


        try {
            const ranks = await window.ipcRenderer.invoke('get-live-participants-ranks', {
                participants: game.participants,
                region: state.currentUser?.region ?? 'euw1',
                gameMode: game.gameMode,
            });

            ranks.forEach((r: any) => {
                const row = document.getElementById(`live-p-${r.summonerId ?? r.puuid}`);
                if (!row) return;
                const rankEl = row.querySelector('.rank-placeholder');
                const wrEl = row.querySelector('.wr-placeholder');
                if (rankEl) rankEl.textContent = r.rank;
                if (wrEl && r.winrate !== '-') wrEl.textContent = `${r.winrate}% WR`;
            });
        } catch (err) {
            console.error('[LiveGame] Ränge konnten nicht geladen werden:', err);
        }
    }


    updateOverlayWindow(game);
}


async function renderFeaturedGames(): Promise<void> {
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }

    const participantsList = document.querySelector('.participants-list');
    if (!participantsList) return;

    const header = document.querySelector('#view-live .widget-header');
    if (header) header.textContent = 'GLOBALE FEATURED MATCHES';

    const featured = await window.ipcRenderer.invoke(
        'get-featured-games',
        state.currentUser?.region
    );

    if (!featured || featured.length === 0) {
        participantsList.innerHTML = `
            <div style="padding:20px; color:var(--text-muted); text-align:center;">
                Keine Featured Matches verfügbar.
            </div>`;
        return;
    }

    participantsList.innerHTML = featured.slice(0, 5).map((game: any) => {
        const minutes = Math.floor(game.gameLength / 60);
        const previewChamps = game.participants.slice(0, 3).map((p: any) => {
            const info = state.allChampions.find((c: any) => c.key === String(p.championId));
            return info?.image.full ?? 'Unknown.png';
        });

        return `
            <div class="participant-row ally" style="justify-content:flex-start; gap:15px; grid-template-columns:none;">
                <div style="display:flex;">
                    ${previewChamps.map((img: string) => `
                        <div class="champ-img" style="
                            background-image:url(${DDR}/${img});
                            width:28px; height:28px; background-size:cover;
                            border-radius:50%; border:2px solid var(--bg-color);">
                        </div>`).join('')}
                </div>
                <span class="p-name" style="color:var(--text-primary); font-weight:700;">${game.gameMode} Match</span>
                <span class="p-rank" style="color:var(--accent); margin-left:auto;">${minutes} min</span>
                <span class="p-winrate" style="color:var(--text-muted);">${game.platformId}</span>
            </div>`;
    }).join('');
}
