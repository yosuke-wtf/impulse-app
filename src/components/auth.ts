

import { state } from '../main/state';
import { fetchMatchHistory } from './matchHistory';
import { startLiveTracking } from './liveGame';


const loginScreen = document.getElementById('login-screen');
const loginStatus = document.getElementById('login-status');
const retryBtn = document.getElementById('manual-login-btn');
const detectionView = document.getElementById('detection-view');
const manualView = document.getElementById('manual-login-view');




export async function detectAccount(): Promise<void> {
    if (loginStatus) loginStatus.textContent = 'Verbinde mit Riot Servern…';


    const savedSession = localStorage.getItem('impulse_session');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - session.timestamp < THIRTY_DAYS) {
            const ok = await _attemptAutoLogin(session.name, session.region);
            if (ok) return;
        } else {
            localStorage.removeItem('impulse_session');
        }
    }


    try {
        const res = await window.ipcRenderer.invoke('get-summoner-info');
        if (res?.success) {
            await _onLoginSuccess(res.data);
        } else if (res?.error === 'MISSING_CONFIG') {
            _showManualLogin();
        } else {
            if (loginStatus) loginStatus.textContent = 'Account nicht gefunden.';
            if (retryBtn) retryBtn.style.display = 'block';
        }
    } catch (err) {
        console.error('[Auth] Erkennungsfehler:', err);
        if (loginStatus) loginStatus.textContent = 'Verbindungsfehler.';
        if (retryBtn) retryBtn.style.display = 'block';
    }
}


export function updateSummonerUI(data: any): void {

    document.querySelectorAll('.summoner-name, #summoner-name-display, .current-acc-name, #welcome-name')
        .forEach(el => el.textContent = data.name);


    const rankField = document.getElementById('summoner-rank-display');
    if (rankField) rankField.textContent = data.rank;


    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/16.4.1/img/profileicon/${data.iconId}.png`;
    const summonerIcon = document.getElementById('summoner-icon');
    if (summonerIcon) {
        summonerIcon.style.backgroundImage = `url(${iconUrl})`;
        summonerIcon.style.backgroundSize = 'cover';
    }


    const dhAvatar = document.getElementById('dh-avatar-img');
    if (dhAvatar) dhAvatar.style.backgroundImage = `url(${iconUrl})`;

    const dhWinrate = document.getElementById('dh-winrate');
    if (dhWinrate) dhWinrate.textContent = `Level ${data.level}`;

    const dhRank = document.getElementById('dh-rank');
    if (dhRank) dhRank.textContent = data.rank;


    const settingsAvatar = document.getElementById('settings-p-avatar');
    if (settingsAvatar) {
        settingsAvatar.style.backgroundImage = `url(${iconUrl})`;
        settingsAvatar.style.backgroundSize = 'cover';
    }


    const summary = document.getElementById('dashboard-summary');
    if (summary) {
        if (data.allRanks?.length > 0) {
            const rows = data.allRanks.map((r: any) => {
                const qName = r.queueType.replace('RANKED_', '').replace('_5x5', '').replace('_SR', ' FLEX');
                const wrColor = r.winrate >= 50 ? 'var(--success)' : 'var(--warning)';
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center;
                        padding:12px 16px; background:rgba(0,0,0,0.3); border-radius:12px;
                        margin-bottom:8px; border:1px solid var(--border);">
                        <span style="font-weight:700; color:var(--text-muted); font-size:0.8rem;">${qName}</span>
                        <div style="text-align:right;">
                            <div style="color:var(--text-primary); font-weight:800; font-size:0.95rem;">
                                ${r.tier} ${r.rank}
                                <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:500;">(${r.lp} LP)</span>
                            </div>
                            <div style="color:${wrColor}; font-size:0.75rem; font-weight:700;">${r.winrate}% WR</div>
                        </div>
                    </div>`;
            });
            summary.innerHTML = `
                <div style="margin-bottom:12px; font-weight:700; color:var(--text-secondary);">Aktuelle Ränge</div>
                ${rows.join('')}`;
        } else {
            summary.innerHTML = `
                <div style="padding:20px; background:rgba(0,0,0,0.3); border-radius:12px;">
                    Keine Ranked-Daten verfügbar. Aktuell: ${data.rank}.
                </div>`;
        }
    }
}




export function initAuth(): void {
    detectAccount();


    document.getElementById('manual-login-trigger')?.addEventListener('click', _showManualLogin);


    document.getElementById('back-to-detection')?.addEventListener('click', () => {
        if (manualView) manualView.style.display = 'none';
        if (detectionView) detectionView.style.display = 'block';
    });


    const submitBtn = document.getElementById('login-submit-btn');
    const nameInput = document.getElementById('login-summoner-name') as HTMLInputElement;
    const regionSelect = document.getElementById('login-region') as HTMLSelectElement;

    submitBtn?.addEventListener('click', async () => {
        const name = nameInput?.value?.trim();
        const region = regionSelect?.value;
        if (!name) return;

        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> VERBINDE…';
        (submitBtn as HTMLButtonElement).disabled = true;

        try {
            const res = await window.ipcRenderer.invoke('get-summoner-info', { name, region });
            if (res?.success) {

                localStorage.setItem('impulse_session', JSON.stringify({
                    name, region, timestamp: Date.now()
                }));
                await _onLoginSuccess(res.data);
            } else {
                alert(res?.error === 'API_ERROR'
                    ? `API Fehler: ${res.status}`
                    : 'Spieler nicht gefunden!');
            }
        } catch {
            alert('Verbindung fehlgeschlagen.');
        } finally {
            submitBtn.innerHTML = 'READY TO PLAY';
            (submitBtn as HTMLButtonElement).disabled = false;
        }
    });


    document.querySelector('.logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('impulse_session');
        state.currentUser = null;
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
        }
        if (loginStatus) loginStatus.textContent = 'Verbinde mit Riot Servern…';
        detectAccount();
    });
}



async function _attemptAutoLogin(name: string, region: string): Promise<boolean> {
    try {
        const res = await window.ipcRenderer.invoke('get-summoner-info', { name, region });
        if (res?.success) {
            await _onLoginSuccess(res.data);
            return true;
        }
    } catch (err) {
        console.error('[Auth] Auto-Login fehlgeschlagen:', err);
    }
    return false;
}

async function _onLoginSuccess(data: any): Promise<void> {
    state.currentUser = data;
    updateSummonerUI(data);
    await fetchMatchHistory(data.puuid, data.region);
    startLiveTracking();
    _hideLogin();
}

function _showManualLogin(): void {
    if (detectionView) detectionView.style.display = 'none';
    if (manualView) manualView.style.display = 'block';
}

function _hideLogin(): void {
    setTimeout(() => {
        if (!loginScreen) return;
        loginScreen.style.opacity = '0';
        setTimeout(() => { loginScreen.style.display = 'none'; }, 500);
    }, 1000);
}
