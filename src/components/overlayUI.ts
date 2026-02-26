

import { state } from '../main/state';
import { OVERLAY_TOGGLE_IDS, OVERLAY_BADGE_LABELS, isToggleActive } from './overlaySettings';

const DDR = 'https://ddragon.leagueoflegends.com/cdn/16.4.1/img/champion';


export function initOverlayMode(): void {
    if (window.location.hash !== '#overlay') return;

    const appContainer = document.querySelector('.container') as HTMLElement | null;
    const overlayContainer = document.getElementById('in-game-overlay');

    if (appContainer) appContainer.style.display = 'none';
    if (overlayContainer) overlayContainer.style.display = 'flex';
    document.body.style.backgroundColor = 'transparent';
}


export function updateOverlayWindow(game: any): void {
    if (!game?.participants) return;

    const selfMatch = game.participants.find(
        (p: any) => p.puuid === state.currentUser?.puuid
    ) ?? game.participants[0];

    _updateChampionSection(game, selfMatch);
    _updateTeamList(game, selfMatch);
    _updateActiveBadges();
}



function _updateChampionSection(game: any, selfMatch: any): void {
    const champInfo = state.allChampions.find((c: any) => c.key === String(selfMatch?.championId));
    const champImage = champInfo?.image.full ?? 'Unknown.png';
    const champName = champInfo?.name ?? 'Unbekannt';

    const nameEl = document.getElementById('overlay-champ-name');
    const iconEl = document.getElementById('overlay-champ-icon');
    const modeEl = document.getElementById('overlay-game-mode');

    if (nameEl) nameEl.textContent = champName;
    if (modeEl) modeEl.textContent = game.gameMode ?? '';
    if (iconEl) iconEl.style.backgroundImage = `url(${DDR}/${champImage})`;
}

function _updateTeamList(game: any, selfMatch: any): void {
    const listEl = document.getElementById('overlay-team-list');
    if (!listEl || !selfMatch) return;

    const allies = game.participants.filter((p: any) => p.teamId === selfMatch.teamId);

    listEl.innerHTML = allies.map((ally: any) => {
        const champInfo = state.allChampions.find((c: any) => c.key === String(ally.championId));
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

function _updateActiveBadges(): void {
    const badgesEl = document.getElementById('overlay-active-badges');
    if (!badgesEl) return;

    const activeBadges = (OVERLAY_TOGGLE_IDS as readonly string[])
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
