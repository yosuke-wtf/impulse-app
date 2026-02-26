/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Champions Page
 *  Champion-Kacheln, Suche und Rollenfilter.
 * ─────────────────────────────────────────────
 */
import { state } from '../main/state';
const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';
// ── Lokaler Zustand ──────────────────────────────────────────────────────────
let currentRole = 'all';
let currentChampSearch = '';
// ── Public API ───────────────────────────────────────────────────────────────
/** Lädt Champions (einmalig) und zeigt das gefilterte Raster */
export async function loadChampions() {
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }
    filterAndRenderChampions();
}
/** Wendet aktuelle Such- und Rollenfilter an und rendert das Raster */
export function filterAndRenderChampions() {
    const filtered = state.allChampions.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(currentChampSearch) ||
            c.id.toLowerCase().includes(currentChampSearch);
        const matchesRole = currentRole === 'all' || c.tags.includes(currentRole);
        return matchesSearch && matchesRole;
    });
    renderChampions(filtered);
}
/** Rendert Champion-Kacheln in das Champions-Grid */
export function renderChampions(champs) {
    const grid = document.getElementById('champions-grid');
    if (!grid)
        return;
    grid.innerHTML = champs.map(c => {
        const winRate = (48 + Math.random() * 10).toFixed(1);
        return `
            <div class="champ-card">
                <div class="avatar" style="background-image:url('${DDR}/${c.image.full}')">
                    <div class="tier-tooltip">
                        <span class="tt-name">${c.name}</span>
                        <span class="tt-rate">${winRate}% WR</span>
                    </div>
                </div>
                <span class="name">${c.name}</span>
            </div>`;
    }).join('');
}
// ── Event Listener ───────────────────────────────────────────────────────────
/** Registriert Suche + Rollenfilter für die Champions-Seite */
export function initChampions() {
    // Suchfeld
    document.getElementById('champ-search')?.addEventListener('input', (e) => {
        currentChampSearch = e.target.value.toLowerCase();
        filterAndRenderChampions();
    });
    // Rollen-Buttons (nur innerhalb #view-champions, nicht Tier List)
    document.querySelectorAll('#view-champions .role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#view-champions .role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.getAttribute('data-role') ?? 'all';
            filterAndRenderChampions();
        });
    });
}
//# sourceMappingURL=champions.js.map