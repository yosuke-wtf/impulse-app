/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Authentication & Account Detection
 *  Verwaltet den Login-Screen, Auto-Detect via
 *  LCU, manuellen Login und Session-Persistenz.
 * ─────────────────────────────────────────────
 */
import { state } from '../main/state';
import { fetchMatchHistory } from './matchHistory';
import { startLiveTracking } from './liveGame';
// ── DOM-Elemente ─────────────────────────────────────────────────────────────
const loginScreen = document.getElementById('login-screen');
const loginStatus = document.getElementById('login-status');
const retryBtn = document.getElementById('manual-login-btn');
const detectionView = document.getElementById('detection-view');
const manualView = document.getElementById('manual-login-view');
// ── Public API ───────────────────────────────────────────────────────────────
/**
 * Startet den Account-Erkennungsfluss:
 * 1. Session aus localStorage versuchen
 * 2. LCU (League-Client) abfragen
 * 3. Manuellen Login anbieten
 */
export async function detectAccount() {
    if (loginStatus)
        loginStatus.textContent = 'Verbinde mit Riot Servern…';
    // ── Schritt 1: Gespeicherte Session (30 Tage) ────────────────────────────
    const savedSession = localStorage.getItem('impulse_session');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - session.timestamp < THIRTY_DAYS) {
            const ok = await _attemptAutoLogin(session.name, session.region);
            if (ok)
                return;
        }
        else {
            localStorage.removeItem('impulse_session');
        }
    }
    // ── Schritt 2: LCU (League Client Unlock) ───────────────────────────────
    try {
        const res = await window.ipcRenderer.invoke('get-summoner-info');
        if (res?.success) {
            await _onLoginSuccess(res.data);
        }
        else if (res?.error === 'MISSING_CONFIG') {
            _showManualLogin();
        }
        else {
            if (loginStatus)
                loginStatus.textContent = 'Account nicht gefunden.';
            if (retryBtn)
                retryBtn.style.display = 'block';
        }
    }
    catch (err) {
        console.error('[Auth] Erkennungsfehler:', err);
        if (loginStatus)
            loginStatus.textContent = 'Verbindungsfehler.';
        if (retryBtn)
            retryBtn.style.display = 'block';
    }
}
/** Aktualisiert alle UI-Elemente die den Spieler anzeigen */
export function updateSummonerUI(data) {
    // Name überall aktualisieren
    document.querySelectorAll('.summoner-name, #summoner-name-display, .current-acc-name, #welcome-name')
        .forEach(el => el.textContent = data.name);
    // Rang
    const rankField = document.getElementById('summoner-rank-display');
    if (rankField)
        rankField.textContent = data.rank;
    // Profilbild
    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/14.4.1/img/profileicon/${data.iconId}.png`;
    const summonerIcon = document.getElementById('summoner-icon');
    if (summonerIcon) {
        summonerIcon.style.backgroundImage = `url(${iconUrl})`;
        summonerIcon.style.backgroundSize = 'cover';
    }
    // Dashboard-Widgets
    const dhAvatar = document.getElementById('dh-avatar-img');
    if (dhAvatar)
        dhAvatar.style.backgroundImage = `url(${iconUrl})`;
    const dhWinrate = document.getElementById('dh-winrate');
    if (dhWinrate)
        dhWinrate.textContent = `Level ${data.level}`;
    const dhRank = document.getElementById('dh-rank');
    if (dhRank)
        dhRank.textContent = data.rank;
    // Settings Avatar
    const settingsAvatar = document.getElementById('settings-p-avatar');
    if (settingsAvatar) {
        settingsAvatar.style.backgroundImage = `url(${iconUrl})`;
        settingsAvatar.style.backgroundSize = 'cover';
    }
    // Ranked Summary
    const summary = document.getElementById('dashboard-summary');
    if (summary) {
        if (data.allRanks?.length > 0) {
            const rows = data.allRanks.map((r) => {
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
        }
        else {
            summary.innerHTML = `
                <div style="padding:20px; background:rgba(0,0,0,0.3); border-radius:12px;">
                    Keine Ranked-Daten verfügbar. Aktuell: ${data.rank}.
                </div>`;
        }
    }
}
// ── Event Listener ───────────────────────────────────────────────────────────
/** Registriert alle Login-UI-Handler */
export function initAuth() {
    detectAccount();
    // Manueller Login öffnen
    document.getElementById('manual-login-trigger')?.addEventListener('click', _showManualLogin);
    // Zurück zur Auto-Erkennung
    document.getElementById('back-to-detection')?.addEventListener('click', () => {
        if (manualView)
            manualView.style.display = 'none';
        if (detectionView)
            detectionView.style.display = 'block';
    });
    // Login-Formular absenden
    const submitBtn = document.getElementById('login-submit-btn');
    const nameInput = document.getElementById('login-summoner-name');
    const regionSelect = document.getElementById('login-region');
    submitBtn?.addEventListener('click', async () => {
        const name = nameInput?.value?.trim();
        const region = regionSelect?.value;
        if (!name)
            return;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> VERBINDE…';
        submitBtn.disabled = true;
        try {
            const res = await window.ipcRenderer.invoke('get-summoner-info', { name, region });
            if (res?.success) {
                // Session für 30 Tage speichern
                localStorage.setItem('impulse_session', JSON.stringify({
                    name, region, timestamp: Date.now()
                }));
                await _onLoginSuccess(res.data);
            }
            else {
                alert(res?.error === 'API_ERROR'
                    ? `API Fehler: ${res.status}`
                    : 'Spieler nicht gefunden!');
            }
        }
        catch {
            alert('Verbindung fehlgeschlagen.');
        }
        finally {
            submitBtn.innerHTML = 'READY TO PLAY';
            submitBtn.disabled = false;
        }
    });
    // Logout
    document.querySelector('.logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('impulse_session');
        state.currentUser = null;
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
        }
        if (loginStatus)
            loginStatus.textContent = 'Verbinde mit Riot Servern…';
        detectAccount();
    });
}
// ── Private Hilfsfunktionen ──────────────────────────────────────────────────
async function _attemptAutoLogin(name, region) {
    try {
        const res = await window.ipcRenderer.invoke('get-summoner-info', { name, region });
        if (res?.success) {
            await _onLoginSuccess(res.data);
            return true;
        }
    }
    catch (err) {
        console.error('[Auth] Auto-Login fehlgeschlagen:', err);
    }
    return false;
}
async function _onLoginSuccess(data) {
    state.currentUser = data;
    updateSummonerUI(data);
    await fetchMatchHistory(data.puuid, data.region);
    startLiveTracking();
    _hideLogin();
}
function _showManualLogin() {
    if (detectionView)
        detectionView.style.display = 'none';
    if (manualView)
        manualView.style.display = 'block';
}
function _hideLogin() {
    setTimeout(() => {
        if (!loginScreen)
            return;
        loginScreen.style.opacity = '0';
        setTimeout(() => { loginScreen.style.display = 'none'; }, 500);
    }, 1000);
}
//# sourceMappingURL=auth.js.map