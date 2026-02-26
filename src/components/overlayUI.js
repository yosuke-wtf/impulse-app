/**
 * ─────────────────────────────────────────────
 *  IMPULSE – In-Game Overlay UI
 *  Aktualisiert das transparente Overlay-Fenster
 *  (id="in-game-overlay") mit Live-Spieldaten.
 * ─────────────────────────────────────────────
 */
import { state } from '../main/state';
import { OVERLAY_TOGGLE_IDS, OVERLAY_BADGE_LABELS, isToggleActive } from './overlaySettings';
const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';
/** Schaltet zwischen Overlay-Modus und normalem App-Modus um */
export function initOverlayMode() {
    if (window.location.hash !== '#overlay')
        return;
    const appContainer = document.querySelector('.container');
    const overlayContainer = document.getElementById('in-game-overlay');
    if (appContainer)
        appContainer.style.display = 'none';
    if (overlayContainer)
        overlayContainer.style.display = 'flex';
    document.body.style.backgroundColor = 'transparent';
}
/**
 * Befüllt das In-Game Overlay-Fenster mit Daten
 * des aktuellen Spiels (Champion, Team, aktive Overlays).
 */
export function updateOverlayWindow(game) {
    if (!game?.participants)
        return;
    const selfMatch = game.participants.find((p) => p.puuid === state.currentUser?.puuid) ?? game.participants[0];
    _updateChampionSection(game, selfMatch);
    _updateTeamList(game, selfMatch);
    _updateActiveBadges();
}
// ── Private Hilfsfunktionen ──────────────────────────────────────────────────
function _updateChampionSection(game, selfMatch) {
    const champInfo = state.allChampions.find((c) => c.key === String(selfMatch?.championId));
    const champImage = champInfo?.image.full ?? 'Unknown.png';
    const champName = champInfo?.name ?? 'Unbekannt';
    const nameEl = document.getElementById('overlay-champ-name');
    const iconEl = document.getElementById('overlay-champ-icon');
    const modeEl = document.getElementById('overlay-game-mode');
    if (nameEl)
        nameEl.textContent = champName;
    if (modeEl)
        modeEl.textContent = game.gameMode ?? '';
    if (iconEl)
        iconEl.style.backgroundImage = `url(${DDR}/${champImage})`;
}
function _updateTeamList(game, selfMatch) {
    const listEl = document.getElementById('overlay-team-list');
    if (!listEl || !selfMatch)
        return;
    const allies = game.participants.filter((p) => p.teamId === selfMatch.teamId);
    listEl.innerHTML = allies.map((ally) => {
        const champInfo = state.allChampions.find((c) => c.key === String(ally.championId));
        const champImg = champInfo?.image.full ?? 'Unknown.png';
        return `
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="
                    width:24px; height:24px; border-radius:4px; flex-shrink:0;
                    background-image:url(${DDR}/${champImg}); background-size:cover;">
                </div>
                <span style="font-size:0.8rem; color:#e2e8f0; flex:1;">${ally.summonerName ?? 'Ally'}</span>
                <span style="font-size:0.7rem; color:#a78bfa;">READY</span>
            </div>`;
    }).join('');
}
function _updateActiveBadges() {
    const badgesEl = document.getElementById('overlay-active-badges');
    if (!badgesEl)
        return;
    const activeBadges = OVERLAY_TOGGLE_IDS
        .filter(id => isToggleActive(id))
        .map(id => {
        const label = OVERLAY_BADGE_LABELS[id] ?? id;
        return `<span style="
                background:rgba(91,75,184,0.25); color:#a78bfa;
                border:1px solid rgba(91,75,184,0.4);
                font-size:0.58rem; padding:2px 7px;
                border-radius:99px; font-weight:600; letter-spacing:0.05em;">
                ${label}
            </span>`;
    }).join('');
    badgesEl.innerHTML = activeBadges
        || '<span style="font-size:0.65rem; color:rgba(255,255,255,0.2);">Keine Overlays aktiv</span>';
}
//# sourceMappingURL=overlayUI.js.map