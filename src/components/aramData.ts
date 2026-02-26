

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.4.1/img/champion';


export async function loadAramData(): Promise<void> {
    const aramData = await window.ipcRenderer.invoke('get-aram-data');
    const grid = document.getElementById('aram-grid');
    if (!grid || !Array.isArray(aramData)) return;

    grid.innerHTML = aramData.map(_buildAramCard).join('');
}



function _buildAramCard(item: any): string {
    const bonusesHtml = item.bonuses?.map((b: any) => `
        <div style="display:flex; gap:10px; margin-bottom:8px;">
            <div style="
                background:rgba(255,255,255,0.1); width:24px; height:24px;
                display:flex; align-items:center; justify-content:center;
                border-radius:4px; font-weight:800; font-size:0.8rem;">
                ${b.count}
            </div>
            <p style="margin:0; font-size:0.85rem; color:var(--text-muted); line-height:1.4; flex:1;">${b.text}</p>
        </div>`).join('') ?? '';

    const augmentsHtml = item.augments?.map(() => `
        <div style="
            width:24px; height:24px; background:rgba(255,255,255,0.1);
            border-radius:50%; display:flex; align-items:center; justify-content:center;
            border:1px solid rgba(255,255,255,0.2);">
            <i class="fa-solid fa-puzzle-piece" style="font-size:0.6rem; color:var(--accent);"></i>
        </div>`).join('') ?? '';

    const champsHtml = item.champions?.length > 0 ? `
        <div style="display:flex; gap:4px; margin-top:16px;">
            ${item.champions.map((c: string) => `
                <div style="
                    width:24px; height:24px;
                    background-image:url('${DDR}/${c}.png');
                    background-size:cover; border-radius:4px;
                    border:1px solid rgba(255,255,255,0.1);">
                </div>`).join('')}
        </div>` : '';

    const tierColor = item.tier === 'S' ? '#fbbf24' : '#818cf8';
    const tierShadow = item.tier === 'S' ? 'rgba(251,191,36,0.3)' : 'rgba(129,140,248,0.3)';
    const tierBadge = item.tier ? `
        <div style="
            position:absolute; right:16px; top:16px;
            background:${tierColor}; color:#000;
            font-weight:900; padding:2px 8px; border-radius:4px;
            font-size:0.8rem; box-shadow:0 0 10px ${tierShadow};">
            ${item.tier}
        </div>` : '';

    return `
        <div class="widget-card augment-card" style="
            position:relative; padding:24px;
            background:rgba(15,23,42,0.6);
            border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
            ${tierBadge}
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <i class="fa-solid ${item.iconClass}" style="font-size:1.5rem; color:var(--text-primary);"></i>
                <span style="font-size:1.1rem; font-weight:800;">${item.name}</span>
            </div>
            <p style="color:var(--text-muted); font-size:0.8rem; font-weight:600; margin-bottom:12px;">
                ${item.desc?.replace('Set-Bonus', '<strong style="color:var(--text-primary);">Set-Bonus</strong>') ?? ''}
            </p>
            ${bonusesHtml}
            <div style="display:flex; gap:8px; margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05);">
                ${augmentsHtml}
            </div>
            ${champsHtml}
        </div>`;
}
