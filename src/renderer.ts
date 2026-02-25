// Pro Renderer Interaction - Final Integration Edition
export { };

declare global {
    interface Window {
        ipcRenderer: any;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Impulse Real-API Edition Initialized');

    let currentUser: any = null;
    let liveTrackingInterval: any = null;
    let isOverlayEnabled = true;
    let allChampions: any[] = [];
    let currentRole = 'all';
    let currentChampSearch = '';

    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const loginStatus = document.getElementById('login-status');
    const retryBtn = document.getElementById('manual-login-btn');
    const detectionView = document.getElementById('detection-view');
    const manualLoginView = document.getElementById('manual-login-view');
    const manualTrigger = document.getElementById('manual-login-trigger');
    const backToDetection = document.getElementById('back-to-detection');
    const loginNameInput = document.getElementById('login-summoner-name') as HTMLInputElement;
    const loginRegionSelect = document.getElementById('login-region') as HTMLSelectElement;
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const summonerRankField = document.getElementById('summoner-rank-display');
    const summonerIcon = document.getElementById('summoner-icon');
    const navLinks = document.querySelectorAll('.nav-link');
    const tabViews = document.querySelectorAll('.tab-view');

    // --- Champions & Tier List Logic ---

    async function loadStatistics() {
        if (allChampions.length === 0) {
            allChampions = await window.ipcRenderer.invoke('get-champions');
        }
        renderStatistics(allChampions);
    }

    function renderStatistics(champs: any[]) {
        const body = document.getElementById('stats-list-body');
        if (!body) return;

        body.innerHTML = champs.map((c, index) => {
            const winRate = (50 + Math.random() * 10).toFixed(1);
            const tier = index < 10 ? 'S' : (index < 30 ? 'A' : 'B');
            return `
                <tr>
                    <td><span class="rank-text">${index + 1}</span></td>
                    <td>
                        <div class="tier-champ-cell">
                            <div class="tier-champ-icon" style="background-image: url('https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${c.image.full}')">
                                <div class="tier-tooltip">
                                    <span class="tt-name">${c.name}</span>
                                    <span class="tt-rate">${winRate}% WR</span>
                                </div>
                            </div>
                            <span>${c.name}</span>
                        </div>
                    </td>
                    <td><span class="tier-badge ${tier.toLowerCase()}">${tier}</span></td>
                    <td><span class="win-rate-text">${winRate}%</span></td>
                    <td>${(Math.random() * 5).toFixed(1)}%</td>
                    <td>${(Math.random() * 10).toFixed(1)}%</td>
                </tr>
            `;
        }).join('');
    }

    async function loadChampions() {
        if (allChampions.length === 0) {
            allChampions = await window.ipcRenderer.invoke('get-champions');
        }
        filterAndRenderChampions();
    }

    function renderChampions(champs: any[]) {
        const grid = document.getElementById('champions-grid');
        if (!grid) return;
        grid.innerHTML = champs.map(c => {
            const winRate = (48 + Math.random() * 10).toFixed(1);
            return `
            <div class="champ-card">
                <div class="avatar" style="background-image: url('https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${c.image.full}')">
                    <div class="tier-tooltip">
                        <span class="tt-name">${c.name}</span>
                        <span class="tt-rate">${winRate}% WR</span>
                    </div>
                </div>
                <span class="name">${c.name}</span>
            </div>
        `;
        }).join('');
    }

    async function loadTierList(mode = 'Rangliste Solo') {
        const tierList = await window.ipcRenderer.invoke('get-tier-list', mode);
        const renderTier = (tier: string, ids: string[]) => {
            const row = document.getElementById(`tier-${tier.toLowerCase()}-row`);
            if (!row) return;
            row.innerHTML = ids.map(id => {
                const winRate = (50 + Math.random() * 8).toFixed(1);
                return `
                <div class="tier-item" style="background-image: url('https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${id}.png')">
                    <div class="tier-tooltip">
                        <span class="tt-name">${id}</span>
                        <span class="tt-rate">${winRate}% WR</span>
                    </div>
                </div>
            `;
            }).join('');
        };

        renderTier('SP', tierList.SP);
        renderTier('S', tierList.S);
        renderTier('A', tierList.A);
        renderTier('B', tierList.B);
        renderTier('C', tierList.C);
        renderTier('D', tierList.D);
    }

    // Search Filters
    document.getElementById('champ-search')?.addEventListener('input', (e) => {
        currentChampSearch = (e.target as HTMLInputElement).value.toLowerCase();
        filterAndRenderChampions();
    });

    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.getAttribute('data-role') || 'all';
            filterAndRenderChampions();
        });
    });

    // Tier List Submenu
    document.querySelectorAll('.view-submenu .submenu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.view-submenu .submenu-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const modeName = link.textContent?.trim() || 'Rangliste Solo';
            loadTierList(modeName);
        });
    });

    function filterAndRenderChampions() {
        const filtered = allChampions.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(currentChampSearch) ||
                c.id.toLowerCase().includes(currentChampSearch);
            const matchesRole = currentRole === 'all' || c.tags.includes(currentRole);
            return matchesSearch && matchesRole;
        });
        renderChampions(filtered);
    }

    document.getElementById('stats-search')?.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value.toLowerCase();
        const filtered = allChampions.filter(c =>
            c.name.toLowerCase().includes(val) ||
            c.id.toLowerCase().includes(val)
        );
        renderStatistics(filtered);
    });

    // --- Tab Switching Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            if (!tabId) return;

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            tabViews.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${tabId}`) {
                    view.classList.add('active');
                }
            });

            if (tabId === 'statistics') loadStatistics();
            if (tabId === 'champions') loadChampions();
            if (tabId === 'tierlist') loadTierList();
            if (tabId === 'aram') loadAramData();
            if (tabId === 'live') {
                checkActiveGame();
                const plist = document.querySelector('.participants-list');
                if (plist && plist.innerHTML.trim() === '') {
                    plist.innerHTML = '<div style="padding: 20px; color: var(--text-muted); text-align: center;">Waiting for active match...</div>';
                }
            }
        });
    });

    async function loadAramData() {
        const aramData = await window.ipcRenderer.invoke('get-aram-data');
        const grid = document.getElementById('aram-grid');
        if (!grid) return;

        grid.innerHTML = aramData.map((item: any) => {
            const bonusesHtml = item.bonuses.map((b: any) => `
                <div class="bonus-row" style="display: flex; gap: 10px; margin-bottom: 8px;">
                    <div style="background: rgba(255,255,255,0.1); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-weight: 800; font-size: 0.8rem;">
                        ${b.count}
                    </div>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; flex: 1;">${b.text}</p>
                </div>
            `).join('');

            const augmentsHtml = item.augments.map((aug: string) => `
                <div style="width: 24px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.2);">
                    <i class="fa-solid fa-puzzle-piece" style="font-size: 0.6rem; color: var(--accent);"></i>
                </div>
            `).join('');

            const champsHtml = item.champions && item.champions.length > 0 ? `
                <div style="display: flex; gap: 4px; margin-top: 16px;">
                    ${item.champions.map((c: string) => `
                        <div style="width: 24px; height: 24px; background-image: url('https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${c}.png'); background-size: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);"></div>
                    `).join('')}
                </div>
            ` : '';

            const tierBadge = item.tier ? `
                <div style="position: absolute; right: 16px; top: 16px; background: ${item.tier === 'S' ? '#fbbf24' : '#818cf8'}; color: #000; font-weight: 900; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; box-shadow: 0 0 10px ${item.tier === 'S' ? 'rgba(251,191,36,0.3)' : 'rgba(129,140,248,0.3)'};">
                    ${item.tier}
                </div>
            ` : '';

            return `
            <div class="widget-card augment-card" style="position: relative; padding: 24px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px;">
                ${tierBadge}
                <div class="augment-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <i class="fa-solid ${item.iconClass}" style="font-size: 1.5rem; color: var(--text-primary);"></i>
                    <span style="font-size: 1.1rem; font-weight: 800;">${item.name}</span>
                </div>
                <div class="augment-body">
                    <p style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600; margin-bottom: 12px;">${item.desc.replace('Set-Bonus', '<strong style="color: var(--text-primary);">Set-Bonus</strong>')}</p>
                    ${bonusesHtml}
                    <div style="display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05);">
                        ${augmentsHtml}
                    </div>
                    ${champsHtml}
                </div>
            </div>
            `;
        }).join('');
    }

    // --- Overlay Mode ---
    if (window.location.hash === '#overlay') {
        const appContainer = document.querySelector('.container') as HTMLElement;
        const overlayContainer = document.getElementById('in-game-overlay');
        if (appContainer) appContainer.style.display = 'none';
        if (overlayContainer) overlayContainer.style.display = 'flex';
        document.body.style.backgroundColor = 'transparent';
    }

    // --- Login & Account Detection ---

    async function detectAccount() {
        if (loginStatus) loginStatus.textContent = 'Connecting to Riot Servers...';

        // Check for persistent login (localStorage)
        const savedLogin = localStorage.getItem('impulse_session');
        if (savedLogin) {
            const session = JSON.parse(savedLogin);
            const now = Date.now();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;

            if (now - session.timestamp < thirtyDays) {
                console.log('Session valid, attempting auto-login:', session.name);
                const success = await attemptAutoLogin(session.name, session.region);
                if (success) return;
            } else {
                localStorage.removeItem('impulse_session');
            }
        }

        try {
            const res = await window.ipcRenderer.invoke('get-summoner-info');
            if (res && res.success) {
                currentUser = res.data;
                if (loginStatus) loginStatus.textContent = `Found Account: ${currentUser.name}!`;
                updateSummonerUI(currentUser);
                await fetchMatchHistory(currentUser.puuid, currentUser.region);
                startLiveTracking();
                hideLogin();
            } else {
                if (res?.error === 'MISSING_CONFIG') {
                    showManualLogin();
                } else if (loginStatus) {
                    loginStatus.textContent = 'Account not found.';
                    if (retryBtn) retryBtn.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Detection error:', error);
            if (loginStatus) loginStatus.textContent = 'Connection Error.';
            if (retryBtn) retryBtn.style.display = 'block';
        }
    }

    async function attemptAutoLogin(name: string, region: string) {
        try {
            const res = await window.ipcRenderer.invoke('get-summoner-info', { name, region });
            if (res && res.success) {
                currentUser = res.data;
                updateSummonerUI(currentUser);
                await fetchMatchHistory(currentUser.puuid, currentUser.region);
                startLiveTracking();
                hideLogin();
                return true;
            }
        } catch (err) { console.error('Auto-login failed:', err); }
        return false;
    }

    function showManualLogin() {
        if (detectionView && manualLoginView) {
            detectionView.style.display = 'none';
            manualLoginView.style.display = 'block';
        }
    }

    function hideLogin() {
        setTimeout(() => {
            if (loginScreen) {
                loginScreen.style.opacity = '0';
                setTimeout(() => loginScreen.style.display = 'none', 500);
            }
        }, 1000);
    }

    function updateSummonerUI(data: any) {
        document.querySelectorAll('.summoner-name, #summoner-name-display, .current-acc-name, #welcome-name').forEach(f => f.textContent = data.name);

        if (summonerRankField) summonerRankField.textContent = data.rank;
        if (summonerIcon) {
            summonerIcon.style.backgroundImage = `url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/profileicon/${data.iconId}.png)`;
            summonerIcon.style.backgroundSize = 'cover';
        }

        const dhAvatar = document.getElementById('dh-avatar-img');
        if (dhAvatar) dhAvatar.style.backgroundImage = `url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/profileicon/${data.iconId}.png)`;

        const dhWinrate = document.getElementById('dh-winrate');
        if (dhWinrate) dhWinrate.textContent = `Level ${data.level}`;

        const dhRank = document.getElementById('dh-rank');
        if (dhRank) dhRank.textContent = data.rank;

        const summary = document.getElementById('dashboard-summary');
        if (summary) {
            if (data.allRanks && data.allRanks.length > 0) {
                const rankStrings = data.allRanks.map((r: any) => {
                    const qName = r.queueType.replace('RANKED_', '').replace('_5x5', '').replace('_SR', ' FLEX');
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 16px; background: rgba(0,0,0,0.3); border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border);">
                            <span style="font-weight:700; color: var(--text-muted); font-size: 0.8rem;">${qName}</span>
                            <div style="text-align: right;">
                                <div style="color: var(--text-primary); font-weight: 800; font-size: 0.95rem;">${r.tier} ${r.rank} <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:500;">(${r.lp} LP)</span></div>
                                <div style="color: ${r.winrate >= 50 ? 'var(--success)' : 'var(--warning)'}; font-size: 0.75rem; font-weight:700;">${r.winrate}% WR</div>
                            </div>
                        </div>
                    `;
                });
                summary.innerHTML = `<div style="margin-bottom: 12px; font-weight: 700; color: var(--text-secondary);">Current Queue Ranks</div>${rankStrings.join('')}`;
            } else {
                summary.innerHTML = `<div style="padding: 20px; background: rgba(0,0,0,0.3); border-radius: 12px;">No ranked data available. You are currently ${data.rank}.</div>`;
            }
        }

        const settingsAvatar = document.getElementById('settings-p-avatar');
        if (settingsAvatar) {
            settingsAvatar.style.backgroundImage = `url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/profileicon/${data.iconId}.png)`;
            settingsAvatar.style.backgroundSize = 'cover';
        }
    }

    async function fetchMatchHistory(puuid: string, region?: string) {
        try {
            const matches = await window.ipcRenderer.invoke('get-recent-matches', puuid, region);
            const historyList = document.querySelector('.history-list');
            if (historyList) {
                const dhRecentPerf = document.getElementById('dh-recent-perf');
                if (matches.length > 0) {
                    if (dhRecentPerf) {
                        const wins = matches.filter((m: any) => m.win).length;
                        const winPct = Math.round((wins / matches.length) * 100);
                        let totalK = 0, totalD = 0, totalA = 0;
                        matches.forEach((m: any) => { totalK += m.kills; totalD += m.deaths; totalA += m.assists; });
                        const avgKda = ((totalK + totalA) / Math.max(1, totalD)).toFixed(2);

                        dhRecentPerf.innerHTML = `
                            <div style="padding: 24px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                                    <div style="display:flex; flex-direction:column; gap: 5px;">
                                        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">WIN RATE</span>
                                        <span style="font-size: 2.2rem; font-weight: 800; font-family: 'Outfit'; color: ${winPct >= 50 ? 'var(--success)' : 'var(--danger)'};">${winPct}%</span>
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap: 5px; text-align: right;">
                                        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">AVERAGE KDA</span>
                                        <span style="font-size: 2.2rem; font-weight: 800; font-family: 'Outfit'; color: var(--accent);">${avgKda}</span>
                                    </div>
                                </div>
                                <div style="display:flex; gap: 6px; height: 16px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.05); margin-bottom: 12px;">
                                    ${matches.map((m: any) => `<div style="flex:1; background: ${m.remake ? 'var(--text-muted)' : (m.win ? 'var(--success)' : 'var(--danger)')}; opacity: 0.8;"></div>`).join('')}
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                                    <span>Older</span>
                                    <span>Newer</span>
                                </div>
                            </div>
                        `;
                    }

                    historyList.innerHTML = matches.map((match: any) => {
                        const isWin = match.win;
                        const isRemake = match.remake;

                        let statusText = isWin ? 'Sieg' : 'Verloren';
                        let statusColor = isWin ? '#3b82f6' : '#ef4444';
                        let cardBorder = isWin ? '#1d4ed8' : '#b91c1c';

                        if (isRemake) {
                            statusText = 'Abbruch';
                            statusColor = '#94a3b8';
                            cardBorder = '#475569';
                        }

                        // Time ago Calculation
                        const diffHours = Math.floor((Date.now() - match.timestamp) / (1000 * 60 * 60));
                        const timeString = diffHours < 1 ? 'Vor wenigen Minuten' : (diffHours < 24 ? `Vor ${diffHours} Stunden` : `Vor ${Math.floor(diffHours / 24)} Tagen`);

                        // KDA Calculation
                        const kdaRatio = match.deaths === 0 ? 'Perfekt' : ((match.kills + match.assists) / match.deaths).toFixed(1);

                        // CS calculations
                        const minutes = Math.floor(match.duration / 60);
                        const csPerMin = minutes > 0 ? (match.cs / minutes).toFixed(1) : '0';

                        // Common Summoner Spells Map
                        const spellsMap: Record<number, string> = {
                            1: 'SummonerBoost', 3: 'SummonerExhaust', 4: 'SummonerFlash', 6: 'SummonerHaste',
                            7: 'SummonerHeal', 11: 'SummonerSmite', 12: 'SummonerTeleport', 13: 'SummonerMana',
                            14: 'SummonerDot', 21: 'SummonerBarrier', 32: 'SummonerSnowball'
                        };
                        const spell1 = spellsMap[match.spells[0]] || 'SummonerFlash';
                        const spell2 = spellsMap[match.spells[1]] || 'SummonerDot';

                        // Items
                        const renderItem = (id: number, isTrinket = false) => {
                            if (!id || id === 0) return `<div class="b-item empty ${isTrinket ? 'trinket' : ''}"></div>`;
                            return `<div class="b-item ${isTrinket ? 'trinket' : ''}"><img src="https://ddragon.leagueoflegends.com/cdn/14.4.1/img/item/${id}.png" /></div>`;
                        };

                        // Participants (Team 1 and Team 2)
                        const team1 = match.participants.filter((p: any) => p.teamId === 100);
                        const team2 = match.participants.filter((p: any) => p.teamId === 200);

                        const renderPlayer = (p: any) => {
                            const isMe = p.puuid === puuid;
                            return `
                                <div class="b-player" title="${p.summonerName}">
                                    <div class="b-p-icon" style="background-image: url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${p.championName}.png)"></div>
                                    <span class="b-p-name" style="${isMe ? 'font-weight: 800; color: #fff;' : ''}">${p.summonerName.substring(0, 8)}</span>
                                </div>
                            `;
                        };

                        // Badges
                        let badgesHtml = '';
                        if (match.largestMultiKill >= 3) badgesHtml += `<div class="b-badge gold"><i class="fa-solid fa-medal"></i> Dreifachtötung!</div>`;
                        else if (match.largestMultiKill === 2) badgesHtml += `<div class="b-badge"><i class="fa-solid fa-dragon"></i> Doppeltötung</div>`;
                        if (match.firstBloodKill) badgesHtml += `<div class="b-badge"><i class="fa-solid fa-droplet" style="color:#ef4444;"></i> Erste Tötung</div>`;
                        if (Number(kdaRatio) >= 3.0) badgesHtml += `<div class="b-badge"><i class="fa-solid fa-fist-raised"></i> Gute KDA</div>`;
                        if (match.totalDamageDealtToChampions > 20000) badgesHtml += `<div class="b-badge"><i class="fa-solid fa-fire"></i> Guter Schaden</div>`;

                        return `
                        <div class="b-match-card" style="border-left: 6px solid ${cardBorder}">
                            <div class="b-champ-col">
                                <div class="b-c-icon" style="background-image: url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${match.champion}.png)"></div>
                            </div>
                            <div class="b-main-info">
                                <div class="b-meta">
                                    <span style="color: ${statusColor}; font-weight: 800;">${statusText}</span>
                                    <span class="b-dot">•</span>
                                    <span>${match.mode === 'CLASSIC' ? 'Abwechselnde Wahl' : match.mode}</span>
                                    <span class="b-dot">•</span>
                                    <span>${minutes}:${(match.duration % 60).toString().padStart(2, '0')}</span>
                                    <span class="b-dot">•</span>
                                    <span>${timeString}</span>
                                </div>
                                <div class="b-stats-row">
                                    <div class="b-kda-block">
                                        <div class="b-kda-ratio">${kdaRatio} KTA</div>
                                        <div class="b-kda-nums">${match.kills} / ${match.deaths} / ${match.assists}</div>
                                    </div>
                                    <div class="b-cs-block">
                                        <div class="b-cs-min">${csPerMin} CS/Min.</div>
                                        <div class="b-cs-tot">${match.cs} CS</div>
                                    </div>
                                    <div class="b-spells-runes">
                                        <div class="b-col">
                                            <img src="https://ddragon.leagueoflegends.com/cdn/14.4.1/img/spell/${spell1}.png" />
                                            <img src="https://ddragon.leagueoflegends.com/cdn/14.4.1/img/spell/${spell2}.png" />
                                        </div>
                                        <div class="b-col runes-col">
                                            <div class="rune-circle"></div>
                                            <div class="rune-circle small"></div>
                                        </div>
                                    </div>
                                    <div class="b-items">
                                        <div class="b-items-grid">
                                            ${renderItem(match.items[0])}
                                            ${renderItem(match.items[1])}
                                            ${renderItem(match.items[2])}
                                            ${renderItem(match.items[3])}
                                            ${renderItem(match.items[4])}
                                            ${renderItem(match.items[5])}
                                        </div>
                                        ${renderItem(match.items[6], true)}
                                    </div>
                                </div>
                                <div class="b-badges-row">
                                    ${badgesHtml}
                                </div>
                            </div>
                            <div class="b-players-col">
                                <div class="b-team">
                                    ${team1.map(renderPlayer).join('')}
                                </div>
                                <div class="b-team">
                                    ${team2.map(renderPlayer).join('')}
                                </div>
                            </div>
                            <div class="b-expand">
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                        </div>
                        `;
                    }).join('');
                } else {
                    historyList.innerHTML = '<div class="no-matches">No recent matches found.</div>';
                }
            }
        } catch (err) { console.error(err); }
    }

    // Manual Login UI
    manualTrigger?.addEventListener('click', () => showManualLogin());
    backToDetection?.addEventListener('click', () => {
        manualLoginView!.style.display = 'none';
        detectionView!.style.display = 'block';
    });

    loginSubmitBtn?.addEventListener('click', async () => {
        const name = loginNameInput?.value;
        const region = loginRegionSelect?.value;
        if (!name) return;

        loginSubmitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> CONNECTING...';
        (loginSubmitBtn as HTMLButtonElement).disabled = true;

        try {
            const res = await window.ipcRenderer.invoke('get-summoner-info', { name, region });
            if (res && res.success) {
                // Save session for 30 days
                localStorage.setItem('impulse_session', JSON.stringify({
                    name,
                    region,
                    timestamp: Date.now()
                }));

                currentUser = res.data;
                updateSummonerUI(currentUser);
                await fetchMatchHistory(currentUser.puuid, currentUser.region);
                startLiveTracking();
                hideLogin();
            } else {
                alert(res?.error === 'API_ERROR' ? `API Error: ${res.status}` : 'Summoner not found!');
            }
        } catch (err) { alert('Connection failed.'); }
        finally {
            loginSubmitBtn.innerHTML = 'READY TO PLAY';
            (loginSubmitBtn as HTMLButtonElement).disabled = false;
        }
    });

    // Admin View Logic
    const adminDiscordId = document.getElementById('admin-discord-id') as HTMLInputElement;
    const adminVerifyBtn = document.getElementById('admin-verify-btn');
    const adminAuthContainer = document.getElementById('admin-auth-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminAuthMsg = document.getElementById('admin-auth-msg');

    adminVerifyBtn?.addEventListener('click', async () => {
        const discordId = adminDiscordId?.value;
        if (!discordId) return;

        adminVerifyBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...';
        (adminVerifyBtn as HTMLButtonElement).disabled = true;

        try {
            const isVerified = await window.ipcRenderer.invoke('verify-admin', discordId);
            if (isVerified) {
                if (adminAuthContainer) adminAuthContainer.style.display = 'none';
                if (adminDashboard) adminDashboard.style.display = 'block';
            } else {
                if (adminAuthMsg) {
                    adminAuthMsg.style.display = 'block';
                    adminAuthMsg.style.color = 'var(--danger)';
                    adminAuthMsg.textContent = 'Access Denied: Discord ID not found in whitelist.';
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
        } finally {
            adminVerifyBtn.innerHTML = 'Verify Access';
            (adminVerifyBtn as HTMLButtonElement).disabled = false;
        }
    });

    const adminAnnounceInput = document.getElementById('admin-announce-input') as HTMLInputElement;
    const adminAnnounceAuthor = document.getElementById('admin-announce-author') as HTMLInputElement;
    const adminAnnounceBtn = document.getElementById('admin-announce-btn');
    const adminAnnounceMsg = document.getElementById('admin-announce-msg');

    adminAnnounceBtn?.addEventListener('click', async () => {
        const text = adminAnnounceInput.value.trim();
        const author = adminAnnounceAuthor?.value.trim() || 'Admin';
        if (!text) return;
        await window.ipcRenderer.invoke('post-announcement', { text, author });
        if (adminAnnounceMsg) {
            adminAnnounceMsg.style.display = 'block';
            setTimeout(() => { adminAnnounceMsg.style.display = 'none'; }, 3000);
        }
        adminAnnounceInput.value = '';
    });

    const notifBtn = document.getElementById('notif-btn');
    const notifFlyout = document.getElementById('notif-flyout');
    const notifDot = document.getElementById('notif-dot');
    const notifText = document.getElementById('notif-text');
    let lastSeenAnnounceTime = 0;

    notifBtn?.addEventListener('click', () => {
        if (notifFlyout) {
            const isVisible = notifFlyout.style.display === 'block';
            notifFlyout.style.display = isVisible ? 'none' : 'block';
            if (!isVisible && notifDot) notifDot.style.display = 'none'; // Clear badge when opened
        }
    });

    // --- Core Loops ---
    async function pollAnnouncements() {
        try {
            const announce = await window.ipcRenderer.invoke('get-announcement');
            if (announce && announce.text && announce.time > lastSeenAnnounceTime) {
                const dateObj = new Date(announce.time);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString();

                if (notifText) {
                    notifText.innerHTML = `<strong>${announce.author}:</strong> ${announce.text}<br><span style="font-size:0.75rem; color:var(--text-muted);">${timeStr}</span>`;
                }

                const dhAnnounce = document.getElementById('dh-announcement-content');
                if (dhAnnounce) {
                    dhAnnounce.innerHTML = `
                        <div style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #5865F2; display: flex; align-items: center; justify-content: center; color: white;">
                                        <i class="fa-brands fa-discord"></i>
                                    </div>
                                    <span style="font-weight: 700; color: var(--accent); font-size: 1.1rem;">${announce.author}</span>
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 600;">
                                    <i class="fa-regular fa-clock"></i> ${dateStr} - ${timeStr}
                                </div>
                            </div>
                            <div style="color: var(--text-primary); font-size: 1.05rem; line-height: 1.6; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; border-left: 3px solid var(--accent);">
                                ${announce.text}
                            </div>
                        </div>
                    `;
                }

                if (notifDot && lastSeenAnnounceTime !== 0) {
                    notifDot.style.display = 'block'; // Show red dot for new announcements
                }
                lastSeenAnnounceTime = announce.time;
            }
        } catch (e) { }
    }

    // Check for announcements every 5 seconds
    setInterval(pollAnnouncements, 5000);

    async function startLiveTracking() {
        if (liveTrackingInterval) clearInterval(liveTrackingInterval);
        checkActiveGame();
        liveTrackingInterval = setInterval(checkActiveGame, 60000);
    }

    async function checkActiveGame() {
        if (!currentUser) return;
        try {
            const activeGame = await window.ipcRenderer.invoke('get-active-game', { puuid: currentUser.puuid, region: currentUser.region });
            if (activeGame) {
                if (isOverlayEnabled) window.ipcRenderer.invoke('toggle-overlay', true);
                updateLiveUI(activeGame);
            } else {
                window.ipcRenderer.invoke('toggle-overlay', false);
                await renderFeaturedGames();
            }
        } catch (err) { console.error(err); }
    }

    async function renderFeaturedGames() {
        if (allChampions.length === 0) {
            allChampions = await window.ipcRenderer.invoke('get-champions');
        }

        const participantsList = document.querySelector('.participants-list');
        if (!participantsList) return;

        const header = document.querySelector('#view-live .widget-header');
        if (header) header.textContent = "GLOBAL FEATURED LIVE MATCHES";

        const featuredGames = await window.ipcRenderer.invoke('get-featured-games', currentUser.region);

        if (!featuredGames || featuredGames.length === 0) {
            participantsList.innerHTML = '<div style="padding: 20px; color: var(--text-muted); text-align: center;">No featured matches available at the moment.</div>';
            return;
        }

        // Just take the top 5 featured matches and display some info
        const topGames = featuredGames.slice(0, 5);
        participantsList.innerHTML = topGames.map((game: any) => {
            const minutes = Math.floor(game.gameLength / 60);

            // Randomly grab 3 champs from the game to show as preview
            const previewChamps = game.participants.slice(0, 3).map((p: any) => {
                const champInfo = allChampions.find((c: any) => c.key === String(p.championId));
                return champInfo ? champInfo.image.full : 'Unknown.png';
            });

            return `
                <div class="participant-row ally" style="justify-content: flex-start; gap: 15px; grid-template-columns: none;">
                    <div style="display: flex; gap: -10px;">
                        ${previewChamps.map((img: string) => `
                            <div class="champ-img" style="background-image: url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${img}); width: 28px; height: 28px; background-size: cover; border-radius: 50%; border: 2px solid var(--bg-color);"></div>
                        `).join('')}
                    </div>
                    <span class="p-name" style="color: var(--text-primary); font-weight: 700;">${game.gameMode} Match</span>
                    <span class="p-rank" style="color: var(--accent); margin-left: auto;">${minutes} min</span>
                    <span class="p-winrate" style="color: var(--text-muted);">${game.platformId}</span>
                </div>
            `;
        }).join('');
    }

    async function updateLiveUI(game: any) {
        if (allChampions.length === 0) {
            allChampions = await window.ipcRenderer.invoke('get-champions');
        }

        const participantsList = document.querySelector('.participants-list');
        const selfMatch = game.participants.find((self: any) => self.puuid === currentUser.puuid) || game.participants[0];

        if (participantsList) {
            // Initiate default rendering (Analyzing...)
            participantsList.innerHTML = game.participants.map((p: any) => {
                const isAlly = p.teamId === selfMatch.teamId;
                const champKeyString = String(p.championId);
                const champInfo = allChampions.find((c: any) => c.key === champKeyString);
                const champImage = champInfo ? champInfo.image.full : 'Unknown.png';

                return `
                    <div class="participant-row ${isAlly ? 'ally' : 'enemy'}" id="live-p-${p.summonerId || p.puuid}">
                        <div class="champ-img" style="background-image: url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${champImage}); width: 32px; height: 32px; background-size: cover; border-radius: 4px;"></div>
                        <span class="p-name">${p.summonerName || 'Hidden'}</span>
                        <span class="p-rank rank-placeholder">Analyzing...</span>
                        <span class="p-winrate wr-placeholder"></span>
                    </div>
                `;
            }).join('');

            // Fetch live ranks
            try {
                const ranks = await window.ipcRenderer.invoke('get-live-participants-ranks', {
                    participants: game.participants,
                    region: currentUser.region,
                    gameMode: game.gameMode
                });

                ranks.forEach((r: any) => {
                    const row = document.getElementById(`live-p-${r.summonerId || r.puuid}`);
                    if (row) {
                        const rankEl = row.querySelector('.rank-placeholder');
                        const wrEl = row.querySelector('.wr-placeholder');
                        if (rankEl) rankEl.textContent = r.rank;
                        if (wrEl && r.winrate !== '-') {
                            wrEl.textContent = `${r.winrate}% WR`;
                        }
                    }
                });
            } catch (err) {
                console.error("Failed to load live ranks", err);
            }
        }

        const overlayChampName = document.getElementById('overlay-champ-name');
        const overlayTeamList = document.getElementById('overlay-team-list');
        const liveMode = document.getElementById('overlay-game-mode');

        if (liveMode) liveMode.textContent = game.gameMode;

        if (selfMatch && overlayChampName) {
            overlayChampName.textContent = `Playing Active Match`;
            const champKeyString = String(selfMatch.championId);
            const champInfo = allChampions.find((c: any) => c.key === champKeyString);
            const champImage = champInfo ? champInfo.image.full : 'Unknown.png';

            const icon = document.getElementById('overlay-champ-icon');
            if (icon) icon.style.backgroundImage = `url(https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion/${champImage})`;
        }

        if (overlayTeamList && selfMatch) {
            overlayTeamList.innerHTML = game.participants.filter((p: any) => p.teamId === selfMatch.teamId).map((ally: any) => `
                <div class="mini-participant">
                    <span class="mp-name">${ally.summonerName || 'Ally'}</span>
                    <span class="mp-rank">READY</span>
                </div>
            `).join('');
        }
    }

    // Toggle Handlers
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            if (toggle.id === 'toggle-ingame-overlay') {
                isOverlayEnabled = toggle.classList.contains('active');
                if (!isOverlayEnabled) window.ipcRenderer.invoke('toggle-overlay', false);
                else checkActiveGame();
            }
        });
    });

    // Start detection
    detectAccount();
    loadStatistics();
});
