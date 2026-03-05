import { createApp } from 'vue';
import App from '@/App.vue';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import axios from 'axios'
import { useAppStore } from '@/stores/index'

// ⚠️ Workaround: Le package @SMATCH-Digital-dev/vue-system-design utilise useAppStore
// sans l'importer. On le fournit via globalThis pour DarkModeSwitch et autres composants.
;(globalThis as any).useAppStore = useAppStore

// 🔒 Bloquer les requêtes vers reasonlabsapi.com AVANT qu'elles ne soient envoyées
// Intercepteur Axios pour bloquer reasonlabsapi.com
axios.interceptors.request.use(
    (config) => {
        const url = config.url || '';
        if (url.includes('reasonlabsapi.com')) {
            console.warn('🚫 Requête bloquée vers reasonlabsapi.com:', url);
            return Promise.reject(new Error('Requête vers reasonlabsapi.com bloquée'));
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Bloquer les requêtes fetch vers reasonlabsapi.com
const originalFetch = window.fetch;
window.fetch = function(...args: [RequestInfo | URL, RequestInit?]) {
    let url = '';
    if (typeof args[0] === 'string') {
        url = args[0];
    } else if (args[0] instanceof Request) {
        url = args[0].url;
    } else if (args[0] instanceof URL) {
        url = args[0].toString();
    } else if (args[0] && typeof args[0] === 'object' && 'url' in args[0]) {
        url = (args[0] as Request).url;
    }
    if (url.includes('reasonlabsapi.com')) {
        console.warn('🚫 Requête fetch bloquée vers reasonlabsapi.com:', url);
        // Retourner une promesse rejetée silencieusement pour éviter les erreurs HTTP2
        return Promise.reject(new Error('Requête fetch vers reasonlabsapi.com bloquée'));
    }
    try {
        return originalFetch.apply(this, args);
    } catch (error: any) {
        // Intercepter les erreurs HTTP2 pour reasonlabsapi.com
        if (error?.message?.includes('reasonlabsapi.com') || url.includes('reasonlabsapi.com')) {
            console.warn('🚫 Erreur HTTP2 interceptée pour reasonlabsapi.com:', error);
            return Promise.reject(new Error('Requête fetch vers reasonlabsapi.com bloquée'));
        }
        throw error;
    }
};

// Bloquer les requêtes XMLHttpRequest vers reasonlabsapi.com
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
    const urlString = typeof url === 'string' ? url : url.toString();
    if (urlString.includes('reasonlabsapi.com')) {
        console.warn('🚫 Requête XHR bloquée vers reasonlabsapi.com:', urlString);
        throw new Error('Requête XHR vers reasonlabsapi.com bloquée');
    }
    return originalXHROpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
};

// Bloquer les erreurs HTTP2 et autres erreurs pour reasonlabsapi.com
window.addEventListener('error', (event) => {
    const errorMessage = event.message || (event.error as Error)?.message || '';
    const errorTarget = event.target as HTMLScriptElement | HTMLImageElement | HTMLLinkElement | null;
    const errorSource = event.filename || (errorTarget && ('src' in errorTarget || 'href' in errorTarget) ? ((errorTarget as HTMLScriptElement).src || (errorTarget as HTMLImageElement).src || (errorTarget as HTMLLinkElement).href) : '') || '';
    const errorUrl = errorSource || errorMessage;

    if (errorUrl.includes('reasonlabsapi.com') || errorMessage.includes('reasonlabsapi.com')) {
        console.warn('🚫 Erreur bloquée pour reasonlabsapi.com:', {
            message: errorMessage,
            source: errorSource,
            type: event.type
        });
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
    }
}, true);

// Bloquer aussi les erreurs de ressources (images, scripts, etc.)
window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'IMG' || target.tagName === 'LINK')) {
        const src = (target as HTMLScriptElement).src || (target as HTMLImageElement).src || (target as HTMLLinkElement).href || '';
        if (src.includes('reasonlabsapi.com')) {
            console.warn('🚫 Chargement de ressource bloqué pour reasonlabsapi.com:', src);
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }
}, true);

// Bloquer les erreurs de réseau et rejets de promesses pour reasonlabsapi.com
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    let shouldBlock = false;

    if (reason && typeof reason === 'object') {
        const message = String(reason.message || '');
        const stack = String(reason.stack || '');
        const url = String(reason.url || reason.config?.url || '');

        if (message.includes('reasonlabsapi.com') ||
            stack.includes('reasonlabsapi.com') ||
            url.includes('reasonlabsapi.com')) {
            shouldBlock = true;
        }
    } else if (typeof reason === 'string' && reason.includes('reasonlabsapi.com')) {
        shouldBlock = true;
    }

    if (shouldBlock) {
        console.warn('🚫 Rejet de promesse bloqué pour reasonlabsapi.com:', reason);
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
}, true);

// main.ts ou équivalent

// Import du gestionnaire d'erreur DOM
// import { setupGlobalDOMErrorHandler } from '@/utils/domUtils';

// Configuration du gestionnaire d'erreur global
// setupGlobalDOMErrorHandler();

// Gestionnaire d'erreur global supplémentaire pour Vue
const app = createApp(App);

// Gestionnaire d'erreur global pour Vue
app.config.errorHandler = (error, instance, info) => {
    // Ignorer les erreurs liées à reasonlabsapi.com
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        if (error.message.includes('reasonlabsapi.com')) {
            console.warn('🚫 Erreur Vue bloquée pour reasonlabsapi.com:', error.message);
            return; // Ignorer l'erreur
        }
    }

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

// Styles / thème du système de design
// Les styles incluent automatiquement le thème (spacings, typography, colors, borders, etc.)
// Le thème est automatiquement appliqué via les styles CSS importés
import '@SMATCH-Digital-dev/vue-system-design/styles';

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

    // Le thème est automatiquement appliqué via l'import des styles CSS du package
    // Les variables CSS du thème (spacings, typography, colors, borders, etc.) sont incluses

    app.mount('#app');
}

// Démarrer l'application
initializeApp();
