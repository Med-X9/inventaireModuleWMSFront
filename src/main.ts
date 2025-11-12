import { createApp } from 'vue';
import App from '@/App.vue';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import axios from 'axios'
// main.ts ou équivalent

// Import du gestionnaire d'erreur DOM
// import { setupGlobalDOMErrorHandler } from '@/utils/domUtils';

// Configuration du gestionnaire d'erreur global
// setupGlobalDOMErrorHandler();

// Gestionnaire d'erreur global supplémentaire pour Vue
const app = createApp(App);

// Gestionnaire d'erreur global pour Vue
app.config.errorHandler = (error, instance, info) => {
    console.warn('🚨 Erreur Vue détectée:', error);

    // Vérifier si c'est une erreur DOM avec vérification de type
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && (
        error.message.includes('Node.insertBefore') ||
        error.message.includes('nextSibling') ||
        error.message.includes('can\'t access property') ||
        error.message.includes('z is null') ||
        error.message.includes('Child to insert before is not a child of this node')
    )) {
        console.warn('🚨 Erreur DOM détectée et ignorée:', error);
        return; // Ignorer l'erreur
    }

    // Pour les autres erreurs, les laisser se propager
    console.error('Erreur Vue non gérée:', error);
};

// pinia store
import { createPinia } from 'pinia';
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)
app.use(pinia);

// router
import router from '@/router';
app.use(router);

// global CSS
import '@/assets/css/app.css';

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

// --- AG Grid modules ---
import {
    ModuleRegistry,
    ClientSideRowModelModule,
    ClientSideRowModelApiModule,
    RowSelectionModule,
    TextFilterModule,
    NumberFilterModule,
    DateFilterModule,
    PaginationModule,
    ValidationModule,
    EventApiModule,
    CellStyleModule,
    CsvExportModule,
    TooltipModule,
    TextEditorModule,
    SelectEditorModule,
    NumberEditorModule,
    DateEditorModule,
    CustomEditorModule,
} from 'ag-grid-community'

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ClientSideRowModelApiModule,
    RowSelectionModule,
    TextFilterModule,
    NumberFilterModule,
    DateFilterModule,
    PaginationModule,
    ValidationModule,
    EventApiModule,
    CellStyleModule,
    CsvExportModule,
    TooltipModule,
    TextEditorModule,
    SelectEditorModule,
    NumberEditorModule,
    DateEditorModule,
    CustomEditorModule
])

// Fonction pour initialiser le token CSRF
async function initializeCSRF() {
    try {
        // Récupérer le token CSRF de Django
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/csrf-token/`, {
            withCredentials: true
        });
    } catch (error) {
        console.warn('⚠️ Erreur lors de l\'initialisation CSRF:', error);
        // Continuer même en cas d'erreur CSRF
    }
}

// Initialiser CSRF puis monter l'app
async function initializeApp() {
    // await initializeCSRF();
    app.mount('#app');
}

// Démarrer l'application
initializeApp();
