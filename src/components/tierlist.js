/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Tier List Page
 *  Lädt Tier-Daten vom Backend, rendert die
 *  Tier-Zeilen und unterstützt Rollen- & Modus-
 *  Filter.
 * ─────────────────────────────────────────────
 */
import { state } from '../main/state';
const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';
// ── Lokaler Zustand ──────────────────────────────────────────────────────────
let currentTierData = null;
let currentTierRole = 'all';
// ── DDragon-Tags → Lane Mapping ──────────────────────────────────────────────
// Hinweis: Dies ist eine Annäherung, da DDragon keine exakten Lane-Daten enthält.
const ROLE_TAG_MAP = {
    all: [],
    top: ['Fighter', 'Tank'],
    jungle: ['Fighter', 'Tank', 'Assassin'],
    mid: ['Mage', 'Assassin'],
    bot: ['Marksman'],
    support: ['Support'],
};
// ── Public API ───────────────────────────────────────────────────────────────
/**
 * Holt die Tier List vom Backend für den angegebenen Spielmodus
 * und rendert sie mit dem aktuellen Rollenfilter.
 */
export async function loadTierList(mode = 'Rangliste Solo') {
    // Champions laden, damit Rollen-Filtering möglich ist
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }
    const tierList = await window.ipcRenderer.invoke('get-tier-list', mode);
    currentTierData = tierList;
    renderTierList(tierList, currentTierRole);
}
/**
 * Rendert alle Tier-Zeilen.
 * Filtert Champions nach Rolle wenn role !== 'all'.
 */
export function renderTierList(tierData, role) {
    if (!tierData)
        return;
    // Champion-Name → Tags Lookup aus bereits geladenen Champions erstellen
    const champTags = {};
    state.allChampions.forEach((c) => { champTags[c.id] = c.tags ?? []; });
    const allowedTags = ROLE_TAG_MAP[role] ?? [];
    /** Gibt true zurück wenn der Champion für die gewählte Rolle relevant ist */
    const shouldShow = (entry) => {
        if (role === 'all')
            return true;
        const name = typeof entry === 'string' ? entry : entry.name;
        return allowedTags.some(tag => (champTags[name] ?? []).includes(tag));
    };
    /** Rendert eine einzelne Tier-Zeile */
    const renderRow = (tier, entries) => {
        const row = document.getElementById(`tier-${tier.toLowerCase()}-row`);
        if (!row)
            return;
        const filtered = entries.filter(shouldShow);
        row.innerHTML = filtered.map(entry => {
            const id = typeof entry === 'string' ? entry : entry.name;
            const wr = typeof entry === 'object' && entry.winRate > 0
                ? `<span class="tt-rate">${entry.winRate.toFixed(1)}% WR</span>`
                : '';
            return `
                <div class="tier-item" style="background-image:url('${DDR}/${id}.png')">
                    <div class="tier-tooltip">
                        <span class="tt-name">${id}</span>
                        ${wr}
                    </div>
                </div>`;
        }).join('');
    };
    renderRow('SP', tierData.SP ?? []);
    renderRow('S', tierData.S ?? []);
    renderRow('A', tierData.A ?? []);
    renderRow('B', tierData.B ?? []);
    renderRow('C', tierData.C ?? []);
    renderRow('D', tierData.D ?? []);
}
// ── Event Listener ───────────────────────────────────────────────────────────
/** Registriert Rollen-Filter-Buttons und Spielmodus-Tabs */
export function initTierList() {
    // Rollen-Filter Buttons (Tier List)
    document.querySelectorAll('#tier-role-filters .role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#tier-role-filters .role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTierRole = btn.getAttribute('data-tierrole') ?? 'all';
            if (currentTierData)
                renderTierList(currentTierData, currentTierRole);
        });
    });
    // Spielmodus-Tabs (Solo/Duo, ARAM, URF, Arena …)
    document.querySelectorAll('.view-submenu .submenu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.view-submenu .submenu-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            // Rollenfilter beim Moduswechsel zurücksetzen
            currentTierRole = 'all';
            document.querySelectorAll('#tier-role-filters .role-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('#tier-role-filters .role-btn[data-tierrole="all"]')?.classList.add('active');
            const modeName = link.textContent?.trim() ?? 'Rangliste Solo';
            loadTierList(modeName);
        });
    });
}
//# sourceMappingURL=tierlist.js.map