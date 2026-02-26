/**
 * ═══════════════════════════════════════════════════════════════
 *  IMPULSE – renderer.ts (Einstiegspunkt)
 *
 *  Dieser Datei initialisiert nur Komponenten –
 *  keine Logik direkt hier.
 *
 *  Struktur:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  src/state.ts                 ← Globaler Zustand        │
 *  │  src/components/              ← Alle UI-Komponenten     │
 *  │  ├── auth.ts                  Login & Account-Detect    │
 *  │  ├── navigation.ts            Tab-Wechsel               │
 *  │  ├── champions.ts             Champions-Seite           │
 *  │  ├── statistics.ts            Statistiken-Seite         │
 *  │  ├── tierlist.ts              Tier List                 │
 *  │  ├── matchHistory.ts          Match-History             │
 *  │  ├── liveGame.ts              Live Game Tracking        │
 *  │  ├── overlaySettings.ts       Overlay Toggle-States     │
 *  │  ├── overlayUI.ts             In-Game Overlay Fenster   │
 *  │  ├── aramData.ts              ARAM-Seite                │
 *  │  ├── admin.ts                 Admin Panel               │
 *  │  └── announcements.ts         Benachrichtigungen        │
 *  └─────────────────────────────────────────────────────────┘
 * ═══════════════════════════════════════════════════════════════
 */

export { };

declare global {
    interface Window { ipcRenderer: any; }
}

// ── Komponenten-Imports ──────────────────────────────────────────────────────
import { initOverlayMode } from './components/overlayUI';
import { initOverlaySettings } from './components/overlaySettings';
import { initNavigation } from './components/navigation';
import { initChampions } from './components/champions';
import { initTierList } from './components/tierlist';
import { initAdmin } from './components/admin';
import { initAnnouncements } from './components/announcements';
import { initAuth } from './components/auth';
import { loadStatistics, initStatisticsSearch } from './components/statistics';

// ── App Start ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Impulse] App gestartet');

    // 1. Overlay-Modus erkennen (transparentes Fenster vs. Haupt-App)
    initOverlayMode();

    // 2. Overlay-Einstellungen laden + Toggle-Handler registrieren
    initOverlaySettings();

    // 3. Navigation (Tab-Wechsel)
    initNavigation();

    // 4. Seiten-Komponenten registrieren
    initChampions();       // Champions-Seite: Suche + Rollenfilter
    initTierList();        // Tier List: Modus-Tabs + Rollenfilter
    initStatisticsSearch(); // Statistiken: Suchfeld
    initAdmin();           // Admin Panel: Verifikation + Announce
    initAnnouncements();   // Benachrichtigungen: Polling + Flyout

    // 5. Auth starten → lädt User → startet Live-Tracking automatisch
    initAuth();

    // 6. Statistiken initial laden (erste sichtbare Seite)
    loadStatistics();
});
