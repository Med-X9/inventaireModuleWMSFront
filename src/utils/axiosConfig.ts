import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getTokens } from './cookieUtils';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/authService';
import API from '@/api';
import { alertService } from '@/services/alertService';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const IS_PROD = import.meta.env.PROD;

const axiosInstance = axios.create({
    baseURL: API.baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    // ✅ Important pour les cookies CSRF / sessions : uniquement en prod
    withCredentials: IS_PROD,
    // ⚠️ À adapter selon la stack backend (exemple pour Django) :
    // xsrfCookieName: IS_PROD ? 'csrftoken' : undefined,
    // xsrfHeaderName: IS_PROD ? 'X-CSRFToken' : undefined,
});

// Intercepteur de requête pour ajouter le token d'authentification et bloquer reasonlabsapi.com
axiosInstance.interceptors.request.use(
    async (config: CustomAxiosRequestConfig) => {
        // 🔒 Bloquer les requêtes vers reasonlabsapi.com
        const url = config.url || '';
        const fullUrl = url.startsWith('http') ? url : `${config.baseURL || ''}${url}`;
        if (fullUrl.includes('reasonlabsapi.com')) {
            console.warn('🚫 Requête Axios bloquée vers reasonlabsapi.com:', fullUrl);
            return Promise.reject(new Error('Requête vers reasonlabsapi.com bloquée'));
        }

        const tokens = getTokens();
        if (tokens?.access) {
            config.headers['Authorization'] = `Bearer ${tokens.access}`;
        }
        return config;
    },
    (error) => {
        console.error('Erreur dans l\'intercepteur de requête:', error);
        return Promise.reject(error);
    }
);

// Intercepteur de réponse pour gérer les erreurs d'authentification
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Gérer les erreurs 401 (non autorisé)
        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/api/auth/login/')) {

            originalRequest._retry = true;

            try {
                const tokens = getTokens();
                if (!tokens?.refresh) {
                    throw new Error('Aucun token de rafraîchissement disponible');
                }

                // Utiliser authService pour rafraîchir le token
                const refreshResponse = await authService.refreshToken(tokens.refresh);

                if (refreshResponse?.access) {
                    // Mettre à jour le token dans les cookies
                    const authStore = useAuthStore();
                    // Utiliser la méthode refreshAccessToken du store
                    const refreshed = await authStore.refreshAccessToken();

                    if (refreshed) {
                        // Retenter la requête originale avec le nouveau token
                        const newTokens = getTokens();
                        if (newTokens?.access) {
                            originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
                            return axiosInstance(originalRequest);
                        }
                    }
                }
            } catch (refreshError) {
                console.error('Erreur lors du rafraîchissement du token:', refreshError);

                // Nettoyer les tokens et rediriger vers la page de connexion
                clearTokens();
                const authStore = useAuthStore();
                authStore.logout();

                alertService.error({
                    text: 'Session expirée. Veuillez vous reconnecter.'
                });

                // Rediriger vers la page de connexion
                if (router.currentRoute.value.path !== '/auth/login') {
                    router.push('/auth/login');
                }

                return Promise.reject(refreshError);
            }
        }

        // Gérer les autres erreurs HTTP
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data as any;

            switch (status) {
                case 400:
                    if (data?.message) {
                        alertService.error({ text: data.message });
                    } else {
                        alertService.error({ text: 'Requête invalide' });
                    }
                    break;

                case 403:
                    alertService.error({ text: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' });
                    break;

                case 404:
                    alertService.error({ text: 'Ressource non trouvée' });
                    break;

                case 500:
                    alertService.error({ text: 'Erreur serveur. Veuillez réessayer plus tard.' });
                    break;

                default:
                    if (data?.message) {
                        alertService.error({ text: data.message });
                    } else {
                        alertService.error({ text: 'Une erreur est survenue' });
                    }
            }
        } else if (error.request) {
            // Erreur de réseau - ignorer si c'est reasonlabsapi.com
            const requestUrl = error.request.responseURL || error.config?.url || '';
            if (requestUrl.includes('reasonlabsapi.com')) {
                console.warn('🚫 Erreur réseau ignorée pour reasonlabsapi.com:', requestUrl);
                return Promise.reject(error);
            }
            
            alertService.error({
                text: 'Erreur de connexion au serveur. Vérifiez votre connexion internet.'
            });
        } else {
            // Erreur de configuration - ignorer si c'est reasonlabsapi.com
            if (error.message && error.message.includes('reasonlabsapi.com')) {
                console.warn('🚫 Erreur de configuration ignorée pour reasonlabsapi.com:', error.message);
                return Promise.reject(error);
            }
            
            console.error('Erreur de configuration Axios:', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
