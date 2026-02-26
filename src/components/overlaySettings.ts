

import { state } from '../main/state';


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
] as const;


export const OVERLAY_BADGE_LABELS: Record<string, string> = {
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


export function isToggleActive(id: string): boolean {
    return document.getElementById(id)?.classList.contains('active') ?? false;
}


function saveToggle(id: string, value: boolean): void {
    window.ipcRenderer.invoke('save-settings', { [id]: value });
}


async function loadOverlaySettings(): Promise<void> {
    const settings: Record<string, boolean> = await window.ipcRenderer.invoke('load-settings');
    OVERLAY_TOGGLE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id in settings) {

            el.classList.toggle('active', settings[id] === true);
        }

    });
}


function bindToggleHandlers(): void {
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            const id = toggle.id;
            const val = toggle.classList.contains('active');


            if (id && (OVERLAY_TOGGLE_IDS as readonly string[]).includes(id)) {
                saveToggle(id, val);
            }


            if (id === 'toggle-ingame-overlay') {
                state.isOverlayEnabled = val;
                if (!val) {
                    window.ipcRenderer.invoke('toggle-overlay', false);
                } else {
                    window.ipcRenderer.invoke('toggle-overlay', true);
                }
            }
        });
    });
}


export async function initOverlaySettings(): Promise<void> {
    await loadOverlaySettings();
    bindToggleHandlers();
}
