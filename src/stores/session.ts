// src/stores/session.ts
import { defineStore } from 'pinia';
import { SessoinService } from '@/services/SessionService';
import type { Session, SessionResponse } from '@/models/Session';

interface SessionState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    sessions: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Retourne toutes les sessions
     */
    getAllSessions: (state): Session[] => {
      return state.sessions;
    },

    /**
     * Retourne le nombre total de sessions
     */
    getSessionsCount: (state): number => {
      return state.sessions.length;
    },

    /**
     * Retourne si le store est en cours de chargement
     */
    isLoading: (state): boolean => {
      return state.loading;
    },

    /**
     * Retourne l'erreur actuelle
     */
    getError: (state): string | null => {
      return state.error;
    },
  },

  actions: {
    /**
     * Récupère toutes les sessions depuis l'API
     */
    async fetchSessions(): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const response: SessionResponse = await SessoinService.getSession();

        if (response.status === 'success' && response.data) {
          this.sessions = response.data;
        } else {
          throw new Error(response.message || 'Erreur lors de la récupération des sessions');
        }
      } catch (error) {
        console.error('❌ Erreur dans le store session:', error);
        this.error = error instanceof Error ? error.message : 'Erreur inconnue';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Efface l'erreur actuelle
     */
    clearError(): void {
      this.error = null;
    },

    /**
     * Efface toutes les sessions du store
     */
    clearSessions(): void {
      this.sessions = [];
      this.error = null;
    },

    /**
     * Trouve une session par son ID
     */
    getSessionById(id: number): Session | undefined {
      return this.sessions.find(session => session.id === id);
    },

    /**
     * Trouve des sessions par nom d'utilisateur
     */
    getSessionsByUsername(username: string): Session[] {
      return this.sessions.filter(session =>
        session.username.toLowerCase().includes(username.toLowerCase())
      );
    },
  },
});
