/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Live Game Tracking
 *  Prüft ob der Spieler im Spiel ist.
 *  Zeigt Live-Teilnehmerdaten oder Featured Games.
 * ─────────────────────────────────────────────
 */
import { state } from '../main/state';
import { updateOverlayWindow } from './overlayUI';
const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';
// ── Public API ───────────────────────────────────────────────────────────────
/** Startet das Live-Tracking (pollt alle 60 Sekunden) */
export function startLiveTracking() {
    if (state.liveTrackingInterval)
        clearInterval(state.liveTrackingInterval);
    checkActiveGame();
    state.liveTrackingInterval = setInterval(checkActiveGame, 60_000);
}
/** Prüft einmalig ob der Spieler in einem aktiven Spiel ist */
export async function checkActiveGame() {
    if (!state.currentUser)
        return;
    try {
        const activeGame = await window.ipcRenderer.invoke('get-active-game', {
            puuid: state.currentUser.puuid,
            region: state.currentUser.region,
        });
        if (activeGame) {
            // Spieler ist in einem Spiel → Overlay anzeigen und UI aktualisieren
            if (state.isOverlayEnabled) {
                window.ipcRenderer.invoke('toggle-overlay', true);
            }
            updateLiveUI(activeGame);
        }
        else {
            // Kein aktives Spiel → Overlay verbergen und Featured Games zeigen
            window.ipcRenderer.invoke('toggle-overlay', false);
            renderFeaturedGames();
        }
    }
    catch (err) {
        console.error('[LiveGame] Fehler beim Prüfen des aktiven Spiels:', err);
    }
}
// ── Privat ───────────────────────────────────────────────────────────────────
/** Rendert die eigentliche Live-Game-Ansicht mit Teilnehmern und Rängen */
async function updateLiveUI(game) {
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }
    const participantsList = document.querySelector('.participants-list');
    const selfMatch = game.participants.find((p) => p.puuid === state.currentUser?.puuid) ?? game.participants[0];
    if (participantsList) {
        // Initiales Rendering (Analyzing…)
        participantsList.innerHTML = game.participants.map((p) => {
            const isAlly = p.teamId === selfMatch.teamId;
            const champInfo = state.allChampions.find((c) => c.key === String(p.championId));
            const champImg = champInfo?.image.full ?? 'Unknown.png';
            return `
                <div class="participant-row ${isAlly ? 'ally' : 'enemy'}" id="live-p-${p.summonerId ?? p.puuid}">
                    <div class="champ-img" style="
                        background-image:url(${DDR}/${champImg});
                        width:32px; height:32px; background-size:cover; border-radius:4px;">
                    </div>
                    <span class="p-name">${p.summonerName ?? 'Hidden'}</span>
                    <span class="p-rank rank-placeholder">Analyzing...</span>
                    <span class="p-winrate wr-placeholder"></span>
                </div>`;
        }).join('');
        // Ränge asynchron nachladen
        try {
            const ranks = await window.ipcRenderer.invoke('get-live-participants-ranks', {
                participants: game.participants,
                region: state.currentUser?.region ?? 'euw1',
                gameMode: game.gameMode,
            });
            ranks.forEach((r) => {
                const row = document.getElementById(`live-p-${r.summonerId ?? r.puuid}`);
                if (!row)
                    return;
                const rankEl = row.querySelector('.rank-placeholder');
                const wrEl = row.querySelector('.wr-placeholder');
                if (rankEl)
                    rankEl.textContent = r.rank;
                if (wrEl && r.winrate !== '-')
                    wrEl.textContent = `${r.winrate}% WR`;
            });
        }
        catch (err) {
            console.error('[LiveGame] Ränge konnten nicht geladen werden:', err);
        }
    }
    // Overlay-Fenster aktualisieren
    updateOverlayWindow(game);
}
/** Zeigt Featured Games wenn der Spieler nicht in einem Spiel ist */
async function renderFeaturedGames() {
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }
    const participantsList = document.querySelector('.participants-list');
    if (!participantsList)
        return;
    const header = document.querySelector('#view-live .widget-header');
    if (header)
        header.textContent = 'GLOBALE FEATURED MATCHES';
    const featured = await window.ipcRenderer.invoke('get-featured-games', state.currentUser?.region);
    if (!featured || featured.length === 0) {
        participantsList.innerHTML = `
            <div style="padding:20px; color:var(--text-muted); text-align:center;">
                Keine Featured Matches verfügbar.
            </div>`;
        return;
    }
    participantsList.innerHTML = featured.slice(0, 5).map((game) => {
        const minutes = Math.floor(game.gameLength / 60);
        const previewChamps = game.participants.slice(0, 3).map((p) => {
            const info = state.allChampions.find((c) => c.key === String(p.championId));
            return info?.image.full ?? 'Unknown.png';
        });
        return `
            <div class="participant-row ally" style="justify-content:flex-start; gap:15px; grid-template-columns:none;">
                <div style="display:flex;">
                    ${previewChamps.map((img) => `
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
//# sourceMappingURL=liveGame.js.map