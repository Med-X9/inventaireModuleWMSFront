import { ref, computed } from 'vue'
import { logger } from '@/services/loggerService'

export interface PaginationConfig {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    showFirstLast?: boolean
    showPageNumbers?: boolean
    maxPageNumbers?: number
}

export interface PaginationState {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    loading: boolean
}

/**
 * Composable pour la gestion de la pagination
 * Supporte la pagination côté client et serveur
 */
export function usePagination(initialConfig?: Partial<PaginationConfig>) {
    const state = ref<PaginationState>({
        currentPage: initialConfig?.page || 1,
        pageSize: initialConfig?.pageSize || 10,
        totalItems: initialConfig?.totalItems || 0,
        totalPages: initialConfig?.totalPages || 0,
        loading: false
    })

    const config = ref({
        showFirstLast: initialConfig?.showFirstLast ?? true,
        showPageNumbers: initialConfig?.showPageNumbers ?? true,
        maxPageNumbers: initialConfig?.maxPageNumbers ?? 5
    })

    /**
     * Met à jour la page courante
     */
    const setPage = (page: number) => {
        if (page >= 1 && page <= state.value.totalPages) {
            state.value.currentPage = page
            logger.debug('Page changée', { page })
        }
    }

    /**
     * Met à jour la taille de page
     */
    const setPageSize = (pageSize: number) => {
        if (pageSize > 0) {
            state.value.pageSize = pageSize
            // Recalculer le nombre total de pages
            state.value.totalPages = Math.ceil(state.value.totalItems / pageSize)
            // Ajuster la page courante si nécessaire
            if (state.value.currentPage > state.value.totalPages) {
                state.value.currentPage = state.value.totalPages || 1
            }
            logger.debug('Taille de page changée', { pageSize })
        }
    }

    /**
     * Met à jour le nombre total d'éléments
     */
    const setTotalItems = (totalItems: number) => {
        state.value.totalItems = totalItems
        state.value.totalPages = Math.ceil(totalItems / state.value.pageSize)
        // Ajuster la page courante si nécessaire
        if (state.value.currentPage > state.value.totalPages) {
            state.value.currentPage = state.value.totalPages || 1
        }
        logger.debug('Nombre total d\'éléments mis à jour', { totalItems })
    }

    /**
     * Met à jour l'état de chargement
     */
    const setLoading = (loading: boolean) => {
        state.value.loading = loading
    }

    /**
     * Va à la première page
     */
    const goToFirstPage = () => {
        setPage(1)
    }

    /**
     * Va à la dernière page
     */
    const goToLastPage = () => {
        setPage(state.value.totalPages)
    }

    /**
     * Va à la page précédente
     */
    const goToPreviousPage = () => {
        if (state.value.currentPage > 1) {
            setPage(state.value.currentPage - 1)
        }
    }

    /**
     * Va à la page suivante
     */
    const goToNextPage = () => {
        if (state.value.currentPage < state.value.totalPages) {
            setPage(state.value.currentPage + 1)
        }
    }

    /**
     * Va à une page spécifique
     */
    const goToPage = (page: number) => {
        setPage(page)
    }

    /**
     * Réinitialise la pagination
     */
    const reset = () => {
        state.value.currentPage = 1
        state.value.pageSize = initialConfig?.pageSize || 10
        state.value.totalItems = 0
        state.value.totalPages = 0
        state.value.loading = false
        logger.debug('Pagination réinitialisée')
    }

    /**
     * Calcule l'index de début pour la pagination
     */
    const getStartIndex = computed(() => {
        return (state.value.currentPage - 1) * state.value.pageSize
    })

    /**
     * Calcule l'index de fin pour la pagination
     */
    const getEndIndex = computed(() => {
        return Math.min(state.value.currentPage * state.value.pageSize, state.value.totalItems)
    })

    /**
     * Vérifie s'il y a une page précédente
     */
    const hasPreviousPage = computed(() => {
        return state.value.currentPage > 1
    })

    /**
     * Vérifie s'il y a une page suivante
     */
    const hasNextPage = computed(() => {
        return state.value.currentPage < state.value.totalPages
    })

    /**
     * Obtient les numéros de pages à afficher
     */
    const getPageNumbers = computed(() => {
        const pages: number[] = []
        const maxPages = config.value.maxPageNumbers
        const totalPages = state.value.totalPages
        const currentPage = state.value.currentPage

        if (totalPages <= maxPages) {
            // Afficher toutes les pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Calculer la plage de pages à afficher
            let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
            let endPage = Math.min(totalPages, startPage + maxPages - 1)

            // Ajuster si on dépasse la fin
            if (endPage - startPage + 1 < maxPages) {
                startPage = Math.max(1, endPage - maxPages + 1)
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i)
            }
        }

        return pages
    })

    /**
     * Obtient les informations de pagination pour l'API
     */
    const getPaginationParams = computed(() => {
        return {
            page: state.value.currentPage,
            pageSize: state.value.pageSize,
            start: getStartIndex.value,
            end: getEndIndex.value
        }
    })

    /**
     * Obtient les informations d'affichage
     */
    const getDisplayInfo = computed(() => {
        const start = getStartIndex.value + 1
        const end = getEndIndex.value
        const total = state.value.totalItems

        return {
            start,
            end,
            total,
            showing: `${start}-${end} sur ${total}`
        }
    })

    /**
     * Exporte la pagination pour l'API
     */
    const exportForAPI = () => {
        return {
            page: state.value.currentPage,
            page_size: state.value.pageSize
        }
    }

    /**
     * Importe la pagination depuis l'API
     */
    const importFromAPI = (apiData: { page?: number; page_size?: number; total?: number }) => {
        if (apiData.page !== undefined) {
            state.value.currentPage = apiData.page
        }
        if (apiData.page_size !== undefined) {
            state.value.pageSize = apiData.page_size
        }
        if (apiData.total !== undefined) {
            state.value.totalItems = apiData.total
            state.value.totalPages = Math.ceil(apiData.total / state.value.pageSize)
        }
        logger.debug('Pagination importée depuis API', apiData)
    }

    return {
        // État
        state: computed(() => state.value),
        config: computed(() => config.value),

        // Getters
        getStartIndex,
        getEndIndex,
        hasPreviousPage,
        hasNextPage,
        getPageNumbers,
        getPaginationParams,
        getDisplayInfo,

        // Méthodes
        setPage,
        setPageSize,
        setTotalItems,
        setLoading,
        goToFirstPage,
        goToLastPage,
        goToPreviousPage,
        goToNextPage,
        goToPage,
        reset,
        exportForAPI,
        importFromAPI
    }
}
