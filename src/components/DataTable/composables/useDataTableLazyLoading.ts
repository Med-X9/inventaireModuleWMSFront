import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { logger } from '@/services/loggerService'

export interface LazyLoadingConfig {
    /** Nombre d'éléments à charger par page */
    pageSize: number
    /** Délai de debounce pour les requêtes */
    debounceDelay?: number
    /** Seuil de déclenchement (en pourcentage) */
    threshold?: number
    /** Fonction de chargement des données */
    loadData: (page: number, pageSize: number, filters?: any) => Promise<{
        data: any[]
        total: number
        hasMore: boolean
    }>
    /** Callback appelé quand de nouvelles données sont chargées */
    onDataLoaded?: (data: any[], page: number) => void
    /** Callback appelé en cas d'erreur */
    onError?: (error: any) => void
}

export interface LazyLoadingState {
    /** Données chargées */
    data: any[]
    /** Page courante */
    currentPage: number
    /** Nombre total d'éléments */
    total: number
    /** Indique s'il y a plus de données */
    hasMore: boolean
    /** État de chargement */
    isLoading: boolean
    /** État de chargement de la page suivante */
    isLoadingMore: boolean
    /** Erreur de chargement */
    error: string | null
    /** Filtres actifs */
    activeFilters: any
}

/**
 * Composable pour le lazy loading des données
 * Optimisé pour les grandes datasets avec chargement progressif
 */
export function useDataTableLazyLoading(config: LazyLoadingConfig) {
    const state = ref<LazyLoadingState>({
        data: [],
        currentPage: 1,
        total: 0,
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        activeFilters: {}
    })

    // Debounce pour éviter les requêtes multiples
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const debounceDelay = config.debounceDelay || 300

    // Intersection Observer pour détecter quand charger plus
    let intersectionObserver: IntersectionObserver | null = null
    const threshold = config.threshold || 0.8

    /**
     * Charge les données de la page spécifiée
     */
    const loadPage = async (page: number, filters?: any) => {
        if (state.value.isLoading) return

        state.value.isLoading = page === 1
        state.value.isLoadingMore = page > 1
        state.value.error = null

        try {
            logger.debug('Chargement lazy loading', { page, filters })

            const result = await config.loadData(page, config.pageSize, filters)

            if (page === 1) {
                // Première page - remplacer toutes les données
                state.value.data = result.data
                state.value.currentPage = 1
            } else {
                // Pages suivantes - ajouter aux données existantes
                state.value.data = [...state.value.data, ...result.data]
                state.value.currentPage = page
            }

            state.value.total = result.total
            state.value.hasMore = result.hasMore
            state.value.activeFilters = filters || {}

            config.onDataLoaded?.(result.data, page)

            logger.debug('Données chargées avec succès', {
                page,
                loadedCount: result.data.length,
                total: result.total,
                hasMore: result.hasMore
            })
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : 'Erreur de chargement'
            config.onError?.(error)
            logger.error('Erreur lors du chargement lazy', error)
        } finally {
            state.value.isLoading = false
            state.value.isLoadingMore = false
        }
    }

    /**
     * Charge la page suivante
     */
    const loadNextPage = async () => {
        if (!state.value.hasMore || state.value.isLoadingMore) return

        const nextPage = state.value.currentPage + 1
        await loadPage(nextPage, state.value.activeFilters)
    }

    /**
     * Recharge toutes les données (reset)
     */
    const refresh = async (filters?: any) => {
        state.value.data = []
        state.value.currentPage = 1
        state.value.hasMore = true
        await loadPage(1, filters)
    }

    /**
     * Met à jour les filtres et recharge
     */
    const updateFilters = async (filters: any) => {
        // Debounce pour éviter les requêtes multiples
        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
            refresh(filters)
        }, debounceDelay)
    }

    /**
     * Initialise l'Intersection Observer pour le chargement automatique
     */
    const initIntersectionObserver = (targetElement: HTMLElement) => {
        if (intersectionObserver) {
            intersectionObserver.disconnect()
        }

        intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && state.value.hasMore && !state.value.isLoadingMore) {
                        loadNextPage()
                    }
                })
            },
            {
                threshold,
                rootMargin: '100px'
            }
        )

        intersectionObserver.observe(targetElement)
    }

    /**
     * Nettoie l'Intersection Observer
     */
    const cleanupIntersectionObserver = () => {
        if (intersectionObserver) {
            intersectionObserver.disconnect()
            intersectionObserver = null
        }
    }

    // Computed pour les propriétés dérivées
    const isInitialLoading = computed(() => state.value.isLoading && state.value.currentPage === 1)
    const isEmpty = computed(() => !state.value.isLoading && state.value.data.length === 0)
    const canLoadMore = computed(() => state.value.hasMore && !state.value.isLoadingMore)

    // Nettoyage à la destruction
    onUnmounted(() => {
        cleanupIntersectionObserver()
        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }
    })

    return {
        // État réactif
        state: computed(() => state.value),

        // Computed
        isInitialLoading,
        isEmpty,
        canLoadMore,

        // Méthodes
        loadPage,
        loadNextPage,
        refresh,
        updateFilters,
        initIntersectionObserver,
        cleanupIntersectionObserver
    }
}
