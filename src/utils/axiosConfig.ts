import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getTokens } from './cookieUtils';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import API from '@/api';
import { alertService } from '@/services/alertService';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const axiosInstance = axios.create({
    baseURL: API.baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
});

axiosInstance.interceptors.request.use(
    async (config: CustomAxiosRequestConfig) => {
        const tokens = getTokens();
        if (tokens?.access) {
            config.headers['Authorization'] = `Bearer ${tokens.access}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/api/auth/login/')) {

            originalRequest._retry = true;

            try {
                const authStore = useAuthStore();
                const refreshed = await authStore.refreshAccessToken();

                if (refreshed) {
                    const tokens = getTokens();
                    if (tokens?.access) {
                        originalRequest.headers['Authorization'] = `Bearer ${tokens.access}`;
                        return axiosInstance(originalRequest);
                    }
                }
            } catch (refreshError) {
                clearTokens();
                alertService.error({ text: 'Session expirée. Veuillez vous reconnecter.' });
                router.push('/auth/login');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
