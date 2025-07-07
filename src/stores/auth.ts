// src/stores/auth.ts
import { defineStore } from 'pinia';
import { getTokens, clearTokens, saveTokens, updateAccessToken } from '@/utils/cookieUtils';
import { authService } from '@/services/authService';
import type { AuthState, LoginResponse } from '@/interfaces/auth';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: !!getTokens()?.access,
    loading: false,
  }),

  actions: {
    /**
     * login(username, password)
     * - Si succès : sauve tokens, met isAuthenticated à true, éventuel user.
     * - Si échec : relance l'exception (sans logger ici).
     */
    async login(username: string, password: string): Promise<boolean> {
      this.loading = true;
      try {
        const response: LoginResponse = await authService.login(username, password);
        if (response.access) {
          saveTokens({ access: response.access, refresh: response.refresh });
          this.isAuthenticated = true;
          if (response.user) {
            this.user = response.user;
          }
          return true;
        }
        return false;
      } catch (unknownError) {
        // On ne loggue pas ici, on relance l'erreur pour que le composant l'affiche
        if (unknownError instanceof Error) {
          throw unknownError;
        }
        throw new Error('Erreur imprévue lors de la connexion');
      } finally {
        this.loading = false;
      }
    },

    /**
     * logout()
     * - Appelle authService.logout(). Si l'API renvoie 400 ou autre, on l'ignore.
     * - Clear tokens, reset state, redirige vers /auth/login.
     */
    async logout(): Promise<void> {
      this.loading = true;
      try {
        // Important: Clear tokens locally BEFORE calling API logout
        // This prevents 401 errors if the token is already expired
        const hadTokens = !!getTokens()?.access;
        clearTokens();
        this.user = null;
        this.isAuthenticated = false;
        
        // Only call API logout if we had tokens
        if (hadTokens) {
          await authService.logout();
        }
      } catch (error) {
        // On ignore l'erreur (déjà gérée dans authService)
        console.log('Logout store error (ignored):', error);
      } finally {
        this.loading = false;
        router.push('/auth/login');
      }
    },

    /**
     * refreshAccessToken()
     * - Tente de rafraîchir l'access token. Si échec, clear tokens et isAuthenticated=false.
     */
    async refreshAccessToken(): Promise<boolean> {
      const tokens = getTokens();
      if (!tokens?.refresh) {
        clearTokens();
        this.isAuthenticated = false;
        return false;
      }

      try {
        const payload = await authService.refreshToken(tokens.refresh);
        if (payload.access) {
          updateAccessToken(payload.access);
          this.isAuthenticated = true;
          return true;
        }
        throw new Error('Aucun access token reçu');
      } catch (error) {
        clearTokens();
        this.isAuthenticated = false;
        return false;
      }
    },
  },
});