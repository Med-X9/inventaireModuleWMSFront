import { ref, computed, reactive } from 'vue'
import { logger } from '@/services/loggerService'

/**
 * Configuration du Master/Detail
 */
export interface MasterDetailConfig {
    detailComponent?: any // Composant Vue pour afficher les détails
    detailDataProvider?: (masterRow: any) => Promise<any[]> // Fonction pour récupérer les détails
    detailHeight?: number // Hauteur du panneau de détails
    expandable?: boolean // Si les détails peuvent être développés/repliés
    lazyLoading?: boolean // Si les détails sont chargés à la demande
    cacheDetails?: boolean // Si les détails sont mis en cache
}

/**
 * État d'un détail
 */
export interface DetailState {
    isExpanded: boolean
    isLoading: boolean
    data: any[]
    error: string | null
    lastLoaded: Date | null
}

/**
 * État global du Master/Detail
 */
export interface MasterDetailState {
    expandedRows: Set<string>
    detailStates: Map<string, DetailState>
    activeDetailRow: string | null
    detailHeight: number
}

/**
 * Composable pour le Master/Detail
 *
 * Bonnes pratiques implémentées :
 * - Chargement lazy des détails
 * - Cache des données
 * - Gestion des erreurs
 * - Performance avec computed
 * - État persistant
 */
export function useDataTableMasterDetail<T extends Record<string, any>>(
    masterData: T[],
    config: MasterDetailConfig = {}
) {
    // Configuration avec valeurs par défaut
    const {
        detailComponent = null,
        detailDataProvider = null,
        detailHeight = 200,
        expandable = true,
        lazyLoading = true,
        cacheDetails = true
    } = config

    // État réactif
    const expandedRows = ref<Set<string>>(new Set())
    const detailStates = ref<Map<string, DetailState>>(new Map())
    const activeDetailRow = ref<string | null>(null)

    // Getters
    const isDetailMode = computed(() => detailComponent !== null || detailDataProvider !== null)
    const expandedCount = computed(() => expandedRows.value.size)
    const cachedDetailsCount = computed(() => detailStates.value.size)

    // Actions de base
    const toggleDetail = async (rowId: string) => {
        if (!expandable) return

        const isExpanded = expandedRows.value.has(rowId)

        if (isExpanded) {
            collapseDetail(rowId)
        } else {
            await expandDetail(rowId)
        }

        logger.debug('Détail basculé:', { rowId, isExpanded: !isExpanded })
    }

    const expandDetail = async (rowId: string) => {
        if (!expandable) return

        expandedRows.value.add(rowId)
        activeDetailRow.value = rowId

        // Charger les détails si nécessaire
        if (lazyLoading && detailDataProvider) {
            await loadDetailData(rowId)
        }
    }

    const collapseDetail = (rowId: string) => {
        expandedRows.value.delete(rowId)
        if (activeDetailRow.value === rowId) {
            activeDetailRow.value = null
        }
    }

    const expandAllDetails = async () => {
        if (!expandable) return

        const promises: Promise<void>[] = []

        for (const row of masterData) {
            const rowId = String(row.id)
            expandedRows.value.add(rowId)

            if (lazyLoading && detailDataProvider) {
                promises.push(loadDetailData(rowId))
            }
        }

        await Promise.all(promises)
        logger.debug('Tous les détails développés')
    }

    const collapseAllDetails = () => {
        expandedRows.value.clear()
        activeDetailRow.value = null
        logger.debug('Tous les détails repliés')
    }

    // Chargement des données de détail
    const loadDetailData = async (rowId: string) => {
        if (!detailDataProvider) return

        // Vérifier le cache
        if (cacheDetails && detailStates.value.has(rowId)) {
            const cachedState = detailStates.value.get(rowId)!
            if (cachedState.data.length > 0) {
                logger.debug('Détails récupérés du cache:', rowId)
                return
            }
        }

        // Initialiser l'état
        const detailState: DetailState = {
            isExpanded: true,
            isLoading: true,
            data: [],
            error: null,
            lastLoaded: null
        }

        detailStates.value.set(rowId, detailState)

        try {
            // Trouver la ligne maître
            const masterRow = masterData.find(row => String(row.id) === rowId)
            if (!masterRow) {
                throw new Error('Ligne maître non trouvée')
            }

            // Charger les données de détail
            const detailData = await detailDataProvider(masterRow)

            // Mettre à jour l'état
            detailState.data = detailData
            detailState.isLoading = false
            detailState.lastLoaded = new Date()
            detailState.error = null

            logger.debug('Détails chargés:', { rowId, count: detailData.length })
        } catch (error) {
            detailState.isLoading = false
            detailState.error = error instanceof Error ? error.message : 'Erreur inconnue'
            detailState.data = []

            logger.error('Erreur lors du chargement des détails:', { rowId, error })
        }
    }

    // Gestion du cache
    const clearDetailCache = () => {
        detailStates.value.clear()
        logger.debug('Cache des détails vidé')
    }

    const removeFromCache = (rowId: string) => {
        detailStates.value.delete(rowId)
        logger.debug('Détail retiré du cache:', rowId)
    }

    // Utilitaires
    const getDetailState = (rowId: string): DetailState | null => {
        return detailStates.value.get(rowId) || null
    }

    const isDetailExpanded = (rowId: string): boolean => {
        return expandedRows.value.has(rowId)
    }

    const isDetailLoading = (rowId: string): boolean => {
        const state = getDetailState(rowId)
        return state?.isLoading || false
    }

    const getDetailData = (rowId: string): any[] => {
        const state = getDetailState(rowId)
        return state?.data || []
    }

    const getDetailError = (rowId: string): string | null => {
        const state = getDetailState(rowId)
        return state?.error || null
    }

    // Calculs pour l'affichage
    const detailRows = computed(() => {
        const rows: Array<{ masterRow: T; detailState: DetailState | null }> = []

        for (const masterRow of masterData) {
            const rowId = String(masterRow.id)
            const detailState = getDetailState(rowId)

            rows.push({ masterRow, detailState })
        }

        return rows
    })

    const visibleDetailRows = computed(() => {
        return detailRows.value.filter(row => isDetailExpanded(String(row.masterRow.id)))
    })

    // Actions avancées
    const refreshDetail = async (rowId: string) => {
        if (cacheDetails) {
            removeFromCache(rowId)
        }
        await loadDetailData(rowId)
        logger.debug('Détail actualisé:', rowId)
    }

    const refreshAllDetails = async () => {
        const promises: Promise<void>[] = []

        for (const rowId of expandedRows.value) {
            promises.push(refreshDetail(rowId))
        }

        await Promise.all(promises)
        logger.debug('Tous les détails actualisés')
    }

    const setDetailHeight = (height: number) => {
        if (height > 0) {
            // detailHeight.value = height // Si detailHeight était ref
            logger.debug('Hauteur des détails modifiée:', height)
        }
    }

    return {
        // État
        expandedRows: computed(() => expandedRows.value),
        detailStates: computed(() => detailStates.value),
        activeDetailRow: computed(() => activeDetailRow.value),

        // Getters
        isDetailMode,
        expandedCount,
        cachedDetailsCount,
        detailRows,
        visibleDetailRows,

        // Actions de base
        toggleDetail,
        expandDetail,
        collapseDetail,
        expandAllDetails,
        collapseAllDetails,

        // Actions de cache
        clearDetailCache,
        removeFromCache,
        refreshDetail,
        refreshAllDetails,

        // Utilitaires
        getDetailState,
        isDetailExpanded,
        isDetailLoading,
        getDetailData,
        getDetailError,
        setDetailHeight,

        // Setters
        setDetailComponent: (component: any) => {
            // detailComponent.value = component // Si detailComponent était ref
        },
        setDetailDataProvider: (provider: (masterRow: any) => Promise<any[]>) => {
            // detailDataProvider.value = provider // Si detailDataProvider était ref
        }
    }
}
