/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Match History
 *  Holt die letzten Matches per IPC und rendert
 *  die detaillierten Match-Karten inkl. KDA,
 *  Items, Spells, Teilnehmer und Badges.
 * ─────────────────────────────────────────────
 */

const DDR_CHAMP = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';
const DDR_ITEM = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/item';
const DDR_SPELL = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/spell';

// Summoner Spell ID → Name Mapping
const SPELL_MAP: Record<number, string> = {
    1: 'SummonerBoost', 3: 'SummonerExhaust', 4: 'SummonerFlash',
    6: 'SummonerHaste', 7: 'SummonerHeal', 11: 'SummonerSmite',
    12: 'SummonerTeleport', 13: 'SummonerMana', 14: 'SummonerDot',
    21: 'SummonerBarrier', 32: 'SummonerSnowball',
};

// ── Public API ───────────────────────────────────────────────────────────────

/** Holt Match-History vom Backend und rendert sie */
export async function fetchMatchHistory(puuid: string, region?: string): Promise<void> {
    try {
        const matches = await window.ipcRenderer.invoke('get-recent-matches', puuid, region);
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        if (matches.length === 0) {
            historyList.innerHTML = '<div class="no-matches">Keine aktuellen Matches gefunden.</div>';
            return;
        }

        _renderDashboardPerformance(matches);
        historyList.innerHTML = matches.map((m: any) => _buildMatchCard(m, puuid)).join('');
    } catch (err) {
        console.error('[MatchHistory] Fehler beim Laden:', err);
    }
}

// ── Private Hilfsfunktionen ──────────────────────────────────────────────────

/** Rendert den Win-Rate / KDA Block auf dem Dashboard */
function _renderDashboardPerformance(matches: any[]): void {
    const el = document.getElementById('dh-recent-perf');
    if (!el) return;

    const wins = matches.filter((m: any) => m.win).length;
    const winPct = Math.round((wins / matches.length) * 100);
    let totalK = 0, totalD = 0, totalA = 0;
    matches.forEach((m: any) => { totalK += m.kills; totalD += m.deaths; totalA += m.assists; });
    const avgKda = ((totalK + totalA) / Math.max(1, totalD)).toFixed(2);
    const winColor = winPct >= 50 ? 'var(--success)' : 'var(--danger)';

    el.innerHTML = `
        <div style="padding:24px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">WIN RATE</span>
                    <span style="font-size:2.2rem; font-weight:800; font-family:'Outfit'; color:${winColor};">${winPct}%</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:5px; text-align:right;">
                    <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">AVERAGE KDA</span>
                    <span style="font-size:2.2rem; font-weight:800; font-family:'Outfit'; color:var(--accent);">${avgKda}</span>
                </div>
            </div>
            <div style="display:flex; gap:6px; height:16px; border-radius:8px; overflow:hidden; background:rgba(255,255,255,0.05); margin-bottom:12px;">
                ${matches.map((m: any) => `<div style="flex:1; background:${m.remake ? 'var(--text-muted)' : (m.win ? 'var(--success)' : 'var(--danger)')}; opacity:0.8;"></div>`).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); font-weight:600;">
                <span>Älter</span><span>Neuer</span>
            </div>
        </div>`;
}

/** Baut eine vollständige Match-Karte als HTML-String */
function _buildMatchCard(match: any, puuid: string): string {
    // Ergebnis
    let statusText = match.win ? 'Sieg' : 'Verloren';
    let statusColor = match.win ? '#3b82f6' : '#ef4444';
    let cardBorder = match.win ? '#1d4ed8' : '#b91c1c';
    if (match.remake) { statusText = 'Abbruch'; statusColor = '#94a3b8'; cardBorder = '#475569'; }

    // Zeitberechnung
    const diffH = Math.floor((Date.now() - match.timestamp) / 3_600_000);
    const timeAgo = diffH < 1 ? 'Vor wenigen Minuten'
        : diffH < 24 ? `Vor ${diffH} Stunden`
            : `Vor ${Math.floor(diffH / 24)} Tagen`;

    // KDA
    const kda = match.deaths === 0 ? 'Perfekt' : ((match.kills + match.assists) / match.deaths).toFixed(1);
    const minutes = Math.floor(match.duration / 60);
    const secs = (match.duration % 60).toString().padStart(2, '0');
    const csPerMin = minutes > 0 ? (match.cs / minutes).toFixed(1) : '0';

    // Spells
    const spell1 = SPELL_MAP[match.spells?.[0]] ?? 'SummonerFlash';
    const spell2 = SPELL_MAP[match.spells?.[1]] ?? 'SummonerDot';

    // Items
    const item = (id: number, isTrinket = false) =>
        !id || id === 0
            ? `<div class="b-item empty ${isTrinket ? 'trinket' : ''}"></div>`
            : `<div class="b-item ${isTrinket ? 'trinket' : ''}"><img src="${DDR_ITEM}/${id}.png"/></div>`;

    // Teams
    const team1 = (match.participants ?? []).filter((p: any) => p.teamId === 100);
    const team2 = (match.participants ?? []).filter((p: any) => p.teamId === 200);
    const playerCard = (p: any) => {
        const isMe = p.puuid === puuid;
        return `
            <div class="b-player" title="${p.summonerName}">
                <div class="b-p-icon" style="background-image:url(${DDR_CHAMP}/${p.championName}.png)"></div>
                <span class="b-p-name" style="${isMe ? 'font-weight:800;color:#fff;' : ''}">${p.summonerName?.substring(0, 8) ?? '?'}</span>
            </div>`;
    };

    // Badges
    let badges = '';
    if (match.largestMultiKill >= 3) badges += `<div class="b-badge gold"><i class="fa-solid fa-medal"></i> Dreifachtötung!</div>`;
    else if (match.largestMultiKill === 2) badges += `<div class="b-badge"><i class="fa-solid fa-dragon"></i> Doppeltötung</div>`;
    if (match.firstBloodKill) badges += `<div class="b-badge"><i class="fa-solid fa-droplet" style="color:#ef4444;"></i> Erste Tötung</div>`;
    if (Number(kda) >= 3.0) badges += `<div class="b-badge"><i class="fa-solid fa-fist-raised"></i> Gute KDA</div>`;
    if (match.totalDamageDealtToChampions > 20000) badges += `<div class="b-badge"><i class="fa-solid fa-fire"></i> Guter Schaden</div>`;

    return `
        <div class="b-match-card" style="border-left:6px solid ${cardBorder};">
            <div class="b-champ-col">
                <div class="b-c-icon" style="background-image:url(${DDR_CHAMP}/${match.champion}.png)"></div>
            </div>
            <div class="b-main-info">
                <div class="b-meta">
                    <span style="color:${statusColor}; font-weight:800;">${statusText}</span>
                    <span class="b-dot">•</span>
                    <span>${match.mode === 'CLASSIC' ? 'Abwechselnde Wahl' : match.mode}</span>
                    <span class="b-dot">•</span>
                    <span>${minutes}:${secs}</span>
                    <span class="b-dot">•</span>
                    <span>${timeAgo}</span>
                </div>
                <div class="b-stats-row">
                    <div class="b-kda-block">
                        <div class="b-kda-ratio">${kda} KTA</div>
                        <div class="b-kda-nums">${match.kills} / ${match.deaths} / ${match.assists}</div>
                    </div>
                    <div class="b-cs-block">
                        <div class="b-cs-min">${csPerMin} CS/Min.</div>
                        <div class="b-cs-tot">${match.cs} CS</div>
                    </div>
                    <div class="b-spells-runes">
                        <div class="b-col">
                            <img src="${DDR_SPELL}/${spell1}.png"/>
                            <img src="${DDR_SPELL}/${spell2}.png"/>
                        </div>
                        <div class="b-col runes-col">
                            <div class="rune-circle"></div>
                            <div class="rune-circle small"></div>
                        </div>
                    </div>
                    <div class="b-items">
                        <div class="b-items-grid">
                            ${item(match.items?.[0])}${item(match.items?.[1])}
                            ${item(match.items?.[2])}${item(match.items?.[3])}
                            ${item(match.items?.[4])}${item(match.items?.[5])}
                        </div>
                        ${item(match.items?.[6], true)}
                    </div>
                </div>
                <div class="b-badges-row">${badges}</div>
            </div>
            <div class="b-players-col">
                <div class="b-team">${team1.map(playerCard).join('')}</div>
                <div class="b-team">${team2.map(playerCard).join('')}</div>
            </div>
            <div class="b-expand"><i class="fa-solid fa-chevron-down"></i></div>
        </div>`;
}
