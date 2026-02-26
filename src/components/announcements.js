/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Announcements
 *  Pollt alle 5 Sekunden auf neue Ankündigungen
 *  und zeigt sie im Notification-Flyout und im
 *  Dashboard an.
 * ─────────────────────────────────────────────
 */
// ── Lokaler Zustand ──────────────────────────────────────────────────────────
let lastSeenAnnounceTime = 0;
// ── DOM-Elemente ─────────────────────────────────────────────────────────────
const notifBtn = document.getElementById('notif-btn');
const notifFlyout = document.getElementById('notif-flyout');
const notifDot = document.getElementById('notif-dot');
const notifText = document.getElementById('notif-text');
// ── Public API ───────────────────────────────────────────────────────────────
/** Registriert den Notification-Button und startet das Polling */
export function initAnnouncements() {
    // Notification-Button: Flyout öffnen/schließen
    notifBtn?.addEventListener('click', () => {
        if (!notifFlyout)
            return;
        const isVisible = notifFlyout.style.display === 'block';
        notifFlyout.style.display = isVisible ? 'none' : 'block';
        // Roter Punkt beim Öffnen entfernen
        if (!isVisible && notifDot)
            notifDot.style.display = 'none';
    });
    // Alle 5 Sekunden auf neue Ankündigungen prüfen
    setInterval(_pollAnnouncements, 5_000);
    _pollAnnouncements(); // sofort beim Start einmal aufrufen
}
// ── Privat ───────────────────────────────────────────────────────────────────
async function _pollAnnouncements() {
    try {
        const announce = await window.ipcRenderer.invoke('get-announcement');
        if (!announce?.text || announce.time <= lastSeenAnnounceTime)
            return;
        const dateObj = new Date(announce.time);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString();
        // Notification Flyout aktualisieren
        if (notifText) {
            notifText.innerHTML = `
                <strong>${announce.author}:</strong> ${announce.text}
                <br><span style="font-size:0.75rem; color:var(--text-muted);">${timeStr}</span>`;
        }
        // Dashboard-Ankündigung aktualisieren
        const dhAnnounce = document.getElementById('dh-announcement-content');
        if (dhAnnounce) {
            dhAnnounce.innerHTML = `
                <div style="padding:24px; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="
                                width:32px; height:32px; border-radius:50%;
                                background:#5865F2; display:flex; align-items:center;
                                justify-content:center; color:white;">
                                <i class="fa-brands fa-discord"></i>
                            </div>
                            <span style="font-weight:700; color:var(--accent); font-size:1.1rem;">${announce.author}</span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px; font-weight:600;">
                            <i class="fa-regular fa-clock"></i> ${dateStr} – ${timeStr}
                        </div>
                    </div>
                    <div style="
                        color:var(--text-primary); font-size:1.05rem; line-height:1.6;
                        background:rgba(0,0,0,0.2); padding:20px; border-radius:12px;
                        border-left:3px solid var(--accent);">
                        ${announce.text}
                    </div>
                </div>`;
        }
        // Roter Punkt anzeigen (nicht beim ersten Laden)
        if (lastSeenAnnounceTime !== 0 && notifDot) {
            notifDot.style.display = 'block';
        }
        lastSeenAnnounceTime = announce.time;
    }
    catch { /* Fehler still ignorieren */ }
}
//# sourceMappingURL=announcements.js.map