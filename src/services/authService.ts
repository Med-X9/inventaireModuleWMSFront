import axios, { AxiosError } from 'axios';
import API from '@/api';
import type { LoginResponse } from '@/interfaces/auth';
import { getTokens } from '@/utils/cookieUtils';

class AuthService {
    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await axios.post<LoginResponse>(
                `${API.baseURL}${API.endpoints.auth.login}`,
                { username, password }
            );
            return response.data;
        } catch (unknownError) {
            if (axios.isAxiosError(unknownError)) {
                const error = unknownError as AxiosError;

                // Handle 401 Unauthorized with a clear message
                if (error.response?.status === 401) {
                    throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
                }

                // Handle API error messages
                if (error.response?.data && typeof error.response.data === 'object') {
                    const responseData = error.response.data as Record<string, unknown>;

                    if (typeof responseData.message === 'string') {
                        throw new Error(responseData.message);
                    }

                    if (typeof responseData.detail === 'string') {
                        throw new Error(responseData.detail);
                    }
                }
            }

            throw new Error('Erreur de connexion au serveur. Veuillez réessayer.');
        }
    }

    async refreshToken(refresh: string): Promise<{ access: string }> {
        try {
            const response = await axios.post<{ access: string }>(
                `${API.baseURL}${API.endpoints.auth.refresh}`,
                { refresh }
            );
            return response.data;
        } catch (error) {
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
    }

    async logout(): Promise<void> {
        try {
            const tokens = getTokens();
            if (!tokens?.refresh) {
                return;
            }

            await axios.post(
                `${API.baseURL}${API.endpoints.auth.logout}`,
                { refresh: tokens.refresh }
            );
        } catch (error) {
            // Erreur de logout ignorée
        }
    }

    async verifyToken(token: string): Promise<void> {
        try {
            const response = await axios.post(
                `${API.baseURL}${API.endpoints.auth.verify}`,
                { token }
            );
            return response.data;
        } catch (error) {
            throw new Error('Token invalide. Veuillez vous reconnecter.');
        }
    }
}

export const authService = new AuthService();
