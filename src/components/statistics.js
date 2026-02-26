import { state } from '../main/state';
const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';
/** Lädt Champions (falls noch nicht geladen) und zeigt die Statisiken-Tabelle */
export async function loadStatistics() {
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }
    renderStatistics(state.allChampions);
}
/** Rendert die Statistiken-Tabelle mit den übergebenen Champions */
export function renderStatistics(champs) {
    const body = document.getElementById('stats-list-body');
    if (!body)
        return;
    body.innerHTML = champs.map((c, index) => {
        const winRate = (50 + Math.random() * 10).toFixed(1);
        const pickRate = (Math.random() * 5).toFixed(1);
        const banRate = (Math.random() * 10).toFixed(1);
        const tier = index < 10 ? 'S' : (index < 30 ? 'A' : 'B');
        return `
            <tr>
                <td><span class="rank-text">${index + 1}</span></td>
                <td>
                    <div class="tier-champ-cell">
                        <div class="tier-champ-icon" style="background-image:url('${DDR}/${c.image.full}')">
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
                <td>${pickRate}%</td>
                <td>${banRate}%</td>
            </tr>`;
    }).join('');
}
/** Registriert den Such-Handler für die Statistiken-Seite */
export function initStatisticsSearch() {
    document.getElementById('stats-search')?.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = state.allChampions.filter((c) => c.name.toLowerCase().includes(val) || c.id.toLowerCase().includes(val));
        renderStatistics(filtered);
    });
}
//# sourceMappingURL=statistics.js.map