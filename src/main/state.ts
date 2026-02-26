/**
 * ─────────────────────────────────────────────
 *  IMPULSE – Shared Application State
 *  Wird von allen Komponenten importiert und
 *  direkt mutiert (ES-Module teilen Instanzen).
 * ─────────────────────────────────────────────
 */

export const state = {
    /** Eingeloggter Benutzer (null = nicht eingeloggt) */
    currentUser: null as any,

    /** Alle Champions aus Data Dragon */
    allChampions: [] as any[],

    /** Interval-Handle für den Live-Game-Polling-Timer */
    liveTrackingInterval: null as ReturnType<typeof setInterval> | null,

    /** Ist das In-Game Overlay aktiviert? */
    isOverlayEnabled: true,
};
