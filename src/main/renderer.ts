
import { initOverlayMode } from '../components/overlayUI';
import { initOverlaySettings } from '../components/overlaySettings';
import { initNavigation } from '../components/navigation';
import { initChampions } from '../components/champions';
import { initTierList } from '../components/tierlist';
import { initAdmin } from '../components/admin';
import { initAnnouncements } from '../components/announcements';
import { initAuth } from '../components/auth';
import { loadStatistics, initStatisticsSearch } from '../components/statistics';


document.addEventListener('DOMContentLoaded', () => {
    console.log('[Impulse] App gestartet');


    initOverlayMode();


    initOverlaySettings();


    initNavigation();


    initChampions();
    initTierList();
    initStatisticsSearch();
    initAdmin();
    initAnnouncements();


    initAuth();


    loadStatistics();
});
