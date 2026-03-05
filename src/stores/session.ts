// src/stores/session.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SessoinService } from '@/services/SessionService';
import type { Session, SessionResponse } from '@/models/Session';
import { logger } from '@/services/loggerService';

export interface MobileUser {
    id: number;
    username: string;
    name?: string;
}

export const useSessionStore = defineStore('session', () => {
    // State
    const sessions = ref<Session[]>([]);
    const mobileUsersByCountingOrder = ref<Map<number, MobileUser[]>>(new Map());
    const loading = ref(false);
    const error = ref<string | null>(null);
    const isFetching = ref(false); // Protection contre les appels multiples simultanés

    // Getters
    const getAllSessions = computed(() => sessions.value || []);
    const getSessionsCount = computed(() => sessions.value.length);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);
    const getMobileUsersForCountingOrder = (countingOrder: number) =>
        computed(() => mobileUsersByCountingOrder.value.get(countingOrder) || []);

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

    /**
     * Récupère les utilisateurs mobiles autorisés pour un comptage spécifique
     */
    const fetchMobileUsersForCountingOrder = async (countingOrder: number): Promise<Session[]> => {
        loading.value = true;
        error.value = null;

        try {
            const response = await SessoinService.getMobileUsersForCountingOrder(countingOrder);
            // Assurer que response est un tableau
            const sessionsData = Array.isArray(response) ? response : [];
            sessions.value = sessionsData;
            return sessionsData;
        } catch (err: any) {
            error.value = err.message || 'Erreur lors du chargement des sessions';
            logger.error('Erreur fetchMobileUsersForCountingOrder', err);
            sessions.value = []; // Reset en cas d'erreur
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Efface le cache des utilisateurs mobiles pour un comptage spécifique
     */
    const clearMobileUsersCache = (countingOrder?: number) => {
        if (countingOrder !== undefined) {
            mobileUsersByCountingOrder.value.delete(countingOrder);
        } else {
            mobileUsersByCountingOrder.value.clear();
        }
    };

    return {
        // State
        sessions,
        mobileUsersByCountingOrder,
        loading,
        error,
        isFetching,

        // Getters
        getAllSessions,
        getSessionsCount,
        getMobileUsersForCountingOrder,
        isLoading,
        getError,

        // Actions
        setLoading,
        setError,
        clearError,
        clearSessions,
        getSessionById,
        getSessionsByUsername,
        fetchMobileUsersForCountingOrder,
        clearMobileUsersCache
    };
});
