/**
 * Builder pour créer des configurations DataTable simplifiées et standardisées
 * Unifie toutes les configurations répétées dans les composables
 *
 * @module dataTableConfigBuilder
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import type { DataTableColumn } from '@/types/dataTable'
import { 
    extractFiltersFromStandardParams,
    extractPageFromStandardParams,
    extractPageSizeFromStandardParams,
    extractSortFromStandardParams
} from './dataTableHelpers'
import { 
    createStandardDataTableProps,
    createStandardDataTableHandlers,
    type DataTableConfig,
    type StandardDataTableProps,
    type DataTableHandlers
} from './createDataTableConfig'

/**
 * Configuration pour créer un DataTable avec store Pinia
 */
export interface PiniaDataTableBuilderConfig<T = any> {
    /** Colonnes du DataTable */
    columns: DataTableColumn[] | ComputedRef<DataTableColumn[]>
    /** Store Pinia à utiliser */
    store: any
    /** ID du store (pour identifier l'action) */
    storeId: string
    /** Nom de l'action à appeler (optionnel, détecté automatiquement) */
    actionName?: string
    /** Paramètres personnalisés pour les appels API (peut être computed) */
    customParams?: Record<string, any> | ComputedRef<Record<string, any>>
    /** Titre pour l'export */
    exportTitle?: string
    /** Storage key pour la persistance */
    storageKey?: string
    /** Actions personnalisées */
    actions?: any[]
    /** Taille de page par défaut */
    defaultPageSize?: number
    /** Activer l'édition inline */
    enableEditing?: boolean
    /** Activer la sélection de lignes */
    enableSelection?: boolean
    /** Charger automatiquement au montage */
    autoLoad?: boolean
}

/**
 * Configuration complète d'un DataTable avec handlers unifiés
 */
export interface UnifiedDataTableConfig<T = any> {
    /** Props pour le composant DataTable */
    props: ComputedRef<StandardDataTableProps>
    /** Handlers d'événements */
    handlers: DataTableHandlers
    /** Référence au composant DataTable */
    ref?: Ref<any>
}

/**
 * Crée une configuration unifiée pour un DataTable avec store Pinia
 * Simplifie la création en combinant props, handlers et intégration avec le store
 *
 * @param config - Configuration du DataTable avec Pinia
 * @param loadData - Fonction qui charge les données (appelle le store)
 * @param updateFilters - Fonction pour mettre à jour les filtres dans useBackendDataTable (optionnel)
 * @param updateSort - Fonction pour mettre à jour le tri dans useBackendDataTable (optionnel)
 * @param updatePagination - Fonction pour mettre à jour la pagination dans useBackendDataTable (optionnel)
 * @returns Configuration complète prête à l'emploi
 */
export function createPiniaDataTableConfig<T = any>(
    config: PiniaDataTableBuilderConfig<T>,
    loadData: (params: StandardDataTableParams) => Promise<void>,
    options?: {
        updateFilters?: (filters: Record<string, any>) => void
        updateSort?: (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => void
        updatePagination?: (page: number, pageSize: number) => void
        extractAdditionalParams?: (params: StandardDataTableParams) => Record<string, any>
    }
): UnifiedDataTableConfig<T> {
    // Récupérer les colonnes (peuvent être computed ou statiques)
    const columns = computed(() => {
        return 'value' in config.columns ? config.columns.value : config.columns
    })

    // Récupérer les customParams (peuvent être computed ou statiques)
    const customParams = computed(() => {
        if (!config.customParams) return {}
        return 'value' in config.customParams ? config.customParams.value : config.customParams
    })

    // Configuration de base
    const baseConfig: DataTableConfig = {
        columns: columns.value,
        exportTitle: config.exportTitle,
        storageKey: config.storageKey,
        actions: config.actions,
        customParams,
        defaultPageSize: config.defaultPageSize || 20,
        enableEditing: config.enableEditing,
        enableSelection: config.enableSelection
    }

    // Créer les handlers unifiés
    const handlers: DataTableHandlers = {
        onPaginationChanged: async (params: StandardDataTableParams) => {
            // Mettre à jour la pagination dans useBackendDataTable si disponible
            if (options?.updatePagination) {
                const pageSize = extractPageSizeFromStandardParams(params, config.defaultPageSize || 20)
                const page = extractPageFromStandardParams(params, pageSize)
                options.updatePagination(page, pageSize)
            }
            await loadData(params)
        },
        onSortChanged: async (params: StandardDataTableParams) => {
            // Extraire et mettre à jour le tri dans useBackendDataTable si disponible
            if (options?.updateSort) {
                const sortModel = extractSortFromStandardParams(params, columns.value)
                options.updateSort(sortModel)
            }
            await loadData(params)
        },
        onFilterChanged: async (params: StandardDataTableParams) => {
            // Extraire et mettre à jour les filtres dans useBackendDataTable si disponible
            if (options?.updateFilters) {
                const filters = extractFiltersFromStandardParams(params, columns.value)
                options.updateFilters(filters)
            }
            await loadData(params)
        },
        onGlobalSearchChanged: async (params: StandardDataTableParams) => {
            await loadData(params)
        }
    }

    // Créer les props computed (réactifs aux changements de colonnes et customParams)
    const props = computed<StandardDataTableProps>(() => 
        createStandardDataTableProps(
            {
                ...baseConfig,
                columns: columns.value,
                customParams: customParams.value
            }
        )
    )

    return {
        props,
        handlers
    }
}

/**
 * Helper pour créer rapidement des handlers DataTable unifiés
 * Simplifie la création de handlers qui chargent simplement les données
 *
 * @param loadData - Fonction qui charge les données
 * @returns Handlers standardisés
 */
export function createUnifiedHandlers(
    loadData: (params: StandardDataTableParams) => Promise<void>
): DataTableHandlers {
    return {
        onPaginationChanged: loadData,
        onSortChanged: loadData,
        onFilterChanged: loadData,
        onGlobalSearchChanged: loadData
    }
}

