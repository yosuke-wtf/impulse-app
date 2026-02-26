

import { state } from '../main/state';

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';


let currentTierData: any = null;
let currentTierRole = 'all';



const ROLE_TAG_MAP: Record<string, string[]> = {
    all: [],
    top: ['Fighter', 'Tank'],
    jungle: ['Fighter', 'Tank', 'Assassin'],
    mid: ['Mage', 'Assassin'],
    bot: ['Marksman'],
    support: ['Support'],
};




export async function loadTierList(mode = 'Rangliste Solo'): Promise<void> {

    if (state.allChampions.length === 0) {
        state.allChampions = await window.ipcRenderer.invoke('get-champions');
    }

    const tierList = await window.ipcRenderer.invoke('get-tier-list', mode);
    currentTierData = tierList;
    renderTierList(tierList, currentTierRole);
}


export function renderTierList(tierData: any, role: string): void {
    if (!tierData) return;


    const champTags: Record<string, string[]> = {};
    state.allChampions.forEach((c: any) => { champTags[c.id] = c.tags ?? []; });

    const allowedTags = ROLE_TAG_MAP[role] ?? [];

    
    const shouldShow = (entry: { name: string } | string): boolean => {
        if (role === 'all') return true;
        const name = typeof entry === 'string' ? entry : entry.name;
        return allowedTags.some(tag => (champTags[name] ?? []).includes(tag));
    };

    
    const renderRow = (tier: string, entries: Array<{ name: string; winRate: number } | string>) => {
        const row = document.getElementById(`tier-${tier.toLowerCase()}-row`);
        if (!row) return;

        const filtered = entries.filter(shouldShow);
        row.innerHTML = filtered.map(entry => {
            const id = typeof entry === 'string' ? entry : entry.name;
            const wr = typeof entry === 'object' && (entry as any).winRate > 0
                ? `<span class="tt-rate">${(entry as any).winRate.toFixed(1)}% WR</span>`
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




export function initTierList(): void {

    document.querySelectorAll('#tier-role-filters .role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#tier-role-filters .role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTierRole = btn.getAttribute('data-tierrole') ?? 'all';
            if (currentTierData) renderTierList(currentTierData, currentTierRole);
        });
    });


    document.querySelectorAll('.view-submenu .submenu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.view-submenu .submenu-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');


            currentTierRole = 'all';
            document.querySelectorAll('#tier-role-filters .role-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('#tier-role-filters .role-btn[data-tierrole="all"]')?.classList.add('active');

            const modeName = link.textContent?.trim() ?? 'Rangliste Solo';
            loadTierList(modeName);
        });
    });
}
