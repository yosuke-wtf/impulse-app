/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Navigation
 *  Tab-Wechsel zwischen den Hauptseiten.
 *  Lädt bei Bedarf die jeweiligen Daten.
 * ─────────────────────────────────────────────
 */

import { loadStatistics } from './statistics';
import { loadChampions } from './champions';
import { loadTierList } from './tierlist';
import { loadAramData } from './aramData';
import { checkActiveGame } from './liveGame';

const navLinks = document.querySelectorAll('.nav-link');
const tabViews = document.querySelectorAll('.tab-view');

/** Registriert die Navigation (Tab-Umschalter) */
export function initNavigation(): void {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            if (!tabId) return;

            // Aktiven State setzen
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Ansichten umschalten
            tabViews.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${tabId}`) view.classList.add('active');
            });

            // Daten bei Bedarf laden
            switch (tabId) {
                case 'statistics': loadStatistics(); break;
                case 'champions': loadChampions(); break;
                case 'tierlist': loadTierList(); break;
                case 'aram': loadAramData(); break;
                case 'live': {
                    checkActiveGame();
                    const plist = document.querySelector('.participants-list');
                    if (plist && plist.innerHTML.trim() === '') {
                        plist.innerHTML = `
                            <div style="padding:20px; color:var(--text-muted); text-align:center;">
                                Warte auf aktives Spiel…
                            </div>`;
                    }
                    break;
                }
            }
        });
    });
}
