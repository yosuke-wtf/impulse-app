

import { state } from '../main/state';

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';


let currentRole = 'all';
let currentChampSearch = '';




export async function loadChampions(): Promise<void> {
    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }
    filterAndRenderChampions();
}


export function filterAndRenderChampions(): void {
    const filtered = state.allChampions.filter((c: any) => {
        const matchesSearch =
            c.name.toLowerCase().includes(currentChampSearch) ||
            c.id.toLowerCase().includes(currentChampSearch);
        const matchesRole = currentRole === 'all' || c.tags.includes(currentRole);
        return matchesSearch && matchesRole;
    });
    renderChampions(filtered);
}


export function renderChampions(champs: any[]): void {
    const grid = document.getElementById('champions-grid');
    if (!grid) return;

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




export function initChampions(): void {

    document.getElementById('champ-search')?.addEventListener('input', (e) => {
        currentChampSearch = (e.target as HTMLInputElement).value.toLowerCase();
        filterAndRenderChampions();
    });


    document.querySelectorAll('#view-champions .role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#view-champions .role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.getAttribute('data-role') ?? 'all';
            filterAndRenderChampions();
        });
    });
}
