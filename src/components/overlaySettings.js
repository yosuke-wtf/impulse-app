/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Overlay Settings
 *  Verwaltet alle Overlay-Toggle-Zustände.
 *  Speichert/lädt per IPC in impulse-settings.json
 * ─────────────────────────────────────────────
 */
import { state } from '../main/state';
/** Alle bekannten Overlay-Toggle-IDs (müssen mit index.html übereinstimmen) */
export const OVERLAY_TOGGLE_IDS = [
    'toggle-arena-augments',
    'toggle-benchmarking',
    'toggle-aram-timers',
    'toggle-gold-diff',
    'toggle-jungle-path',
    'toggle-loading-screen',
    'toggle-minimap-timer',
    'toggle-skill-order',
    'toggle-ultimate-timer',
    'toggle-trinket',
];
/** Labels für das In-Game Overlay Badge-Display */
export const OVERLAY_BADGE_LABELS = {
    'toggle-arena-augments': 'Augmente',
    'toggle-benchmarking': 'Benchmark',
    'toggle-aram-timers': 'ARAM Timer',
    'toggle-gold-diff': 'Gold Diff',
    'toggle-jungle-path': 'Jungle',
    'toggle-loading-screen': 'Ladescreen',
    'toggle-minimap-timer': 'Minimap',
    'toggle-skill-order': 'Skills',
    'toggle-ultimate-timer': 'Ult Timer',
    'toggle-trinket': 'Trinket',
};
/** Gibt den aktuellen An/Aus-Status eines Toggles zurück */
export function isToggleActive(id) {
    return document.getElementById(id)?.classList.contains('active') ?? false;
}
/** Einen Toggle-Zustand im Backend persistieren */
function saveToggle(id, value) {
    window.ipcRenderer.invoke('save-settings', { [id]: value });
}
/**
 * Lädt gespeicherte Overlay-Einstellungen aus dem Backend
 * und setzt die Toggle-Elemente entsprechend.
 */
async function loadOverlaySettings() {
    const settings = await window.ipcRenderer.invoke('load-settings');
    OVERLAY_TOGGLE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el)
            return;
        if (id in settings) {
            // Gespeicherten Zustand wiederherstellen
            el.classList.toggle('active', settings[id] === true);
        }
        // Kein gespeicherter Wert → HTML-Default beibehalten
    });
}
/**
 * Registriert Klick-Handler für alle Toggle-Switches.
 * Klick → CSS-Klasse umschalten + Zustand speichern.
 */
function bindToggleHandlers() {
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            const id = toggle.id;
            const val = toggle.classList.contains('active');
            // Alle Overlay-Toggles automatisch speichern
            if (id && OVERLAY_TOGGLE_IDS.includes(id)) {
                saveToggle(id, val);
            }
            // Sonderfall: Haupt-Overlay-Toggle
            if (id === 'toggle-ingame-overlay') {
                state.isOverlayEnabled = val;
                if (!val) {
                    window.ipcRenderer.invoke('toggle-overlay', false);
                }
                else {
                    // checkActiveGame wird hier über liveGame aufgerufen
                    // (liveGame importiert nicht overlaySettings → kein Zirkel)
                    window.ipcRenderer.invoke('toggle-overlay', true);
                }
            }
        });
    });
}
/** Initialisiert das gesamte Overlay-Settings-System */
export async function initOverlaySettings() {
    await loadOverlaySettings();
    bindToggleHandlers();
}
//# sourceMappingURL=overlaySettings.js.map