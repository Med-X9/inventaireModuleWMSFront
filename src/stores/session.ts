// src/stores/session.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SessoinService } from '@/services/SessionService';
import type { Session, SessionResponse } from '@/models/Session';
import { logger } from '@/services/loggerService';

export const useSessionStore = defineStore('session', () => {
    // State
    const sessions = ref<Session[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const isFetching = ref(false); // Protection contre les appels multiples simultanés

    // Getters
    const getAllSessions = computed(() => sessions.value);
    const getSessionsCount = computed(() => sessions.value.length);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    // ===== FONCTIONS UTILITAIRES =====

    const setLoading = (isLoading: boolean) => {
        loading.value = isLoading;
    };

    const setError = (errorMessage: string | null) => {
        error.value = errorMessage;
    };

    const clearError = () => {
        error.value = null;
    };

    // ===== ACTIONS =====

    /**
     * Récupère toutes les sessions depuis l'API
     */
    const fetchSessions = async (): Promise<void> => {
        // Éviter les appels multiples simultanés
        if (isFetching.value) {
            logger.debug('fetchSessions déjà en cours, abandon de la requête');
            return;
        }

        // Si les sessions sont déjà chargées, ne pas refaire la requête
        if (sessions.value.length > 0) {
            logger.debug('Sessions déjà chargées, pas besoin de recharger');
            return;
        }

        try {
            isFetching.value = true;
            setLoading(true);
            clearError();

            const response: SessionResponse = await SessoinService.getSession();

            if (response.status === 'success' && response.data) {
                sessions.value = response.data;
            } else {
                throw new Error(response.message || 'Erreur lors de la récupération des sessions');
            }
        } catch (err: any) {
            logger.error('Erreur dans le store session', err);
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            isFetching.value = false;
        }
    };

    /**
     * Efface toutes les sessions du store
     */
    const clearSessions = () => {
        sessions.value = [];
        error.value = null;
    };

    /**
     * Trouve une session par son ID
     */
    const getSessionById = (id: number): Session | undefined => {
        return sessions.value.find(session => session.id === id);
    };

    /**
     * Trouve des sessions par nom d'utilisateur
     */
    const getSessionsByUsername = (username: string): Session[] => {
        return sessions.value.filter(session =>
            session.username.toLowerCase().includes(username.toLowerCase())
        );
    };

    return {
        // State
        sessions,
        loading,
        error,
        isFetching,

        // Getters
        getAllSessions,
        getSessionsCount,
        isLoading,
        getError,

        // Actions
        setLoading,
        setError,
        clearError,
        fetchSessions,
        clearSessions,
        getSessionById,
        getSessionsByUsername
    };
});
