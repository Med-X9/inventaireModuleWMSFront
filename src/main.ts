import { createApp } from 'vue';
import App from '@/App.vue';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import axios from 'axios'
import { useAppStore } from '@/stores/index'
// ⚠️ Workaround: Le package @SMATCH-Digital-dev/vue-system-design utilise useAppStore
// sans l'importer. On le fournit via globalThis pour DarkModeSwitch et autres composants.
;(globalThis as any).useAppStore = useAppStore


// main.ts ou équivalent

// Import du gestionnaire d'erreur DOM
// import { setupGlobalDOMErrorHandler } from '@/utils/domUtils';

// Configuration du gestionnaire d'erreur global
// setupGlobalDOMErrorHandler();

// Gestionnaire d'erreur global supplémentaire pour Vue
const app = createApp(App);

// pinia store
import { createPinia } from 'pinia';
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)
app.use(pinia);

// router
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
app.use(router);

// Déconnexion appelée par AppLayout (@SMATCH-Digital-dev/vue-system-design) — patch vite-plugin
;(globalThis as typeof globalThis & { __appLogout?: () => void }).__appLogout = () => {
    void useAuthStore().logout();
};

// global CSS
import '@/assets/css/app.css';

// Styles / thème SMATCH + Material Design Icons (@mdi/font)
import '@SMATCH-Digital-dev/vue-system-design/styles'
import '@mdi/font/css/materialdesignicons.min.css'

// perfect scrollbar
import PerfectScrollbar from 'vue3-perfect-scrollbar';
app.use(PerfectScrollbar);

// vue-meta
import { createHead } from '@vueuse/head';
const head = createHead();
app.use(head);

// default app settings
import appSetting from '@/app-setting';
appSetting.init();

// i18n
import i18n from '@/i18n';
app.use(i18n);

// tooltips, masks, markdown, popper...
import { TippyPlugin } from 'tippy.vue';
import Maska from 'maska';
import VueEasymde from 'vue3-easymde';
import 'easymde/dist/easymde.min.css';
import Popper from 'vue3-popper';
import vue3JsonExcel from 'vue3-json-excel';

app.use(TippyPlugin);
app.use(Maska);
app.use(VueEasymde);
app.component('Popper', Popper);
app.use(vue3JsonExcel);


// Initialiser CSRF puis monter l'app
async function initializeApp() {
    // await initializeCSRF();

    const { initSentry } = await import('@/services/sentryService')
    await initSentry()

    // Le thème est automatiquement appliqué via l'import des styles CSS du package
    // Les variables CSS du thème (spacings, typography, colors, borders, etc.) sont incluses

    app.mount('#app');
}

// Démarrer l'application
initializeApp();
