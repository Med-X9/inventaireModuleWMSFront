/**
 * Composable pour sauvegarder et charger la configuration du DataTable
 * Persiste les préférences utilisateur dans localStorage
 */

import { ref, watch, computed, type Ref } from 'vue'
import { useLocalStorage } from '@/utils/storage'
import type { ColumnPinState } from './useColumnPinning'

export interface DataTableConfig {
    /** Colonnes visibles (noms des champs) */
    visibleColumns: string[]
    /** Ordre des colonnes */
    columnOrder: string[]
    /** Largeurs des colonnes (en pixels) */
    columnWidths: Record<string, number>
    /** Colonnes épinglées */
    pinnedColumns: ColumnPinState[]
    /** Header sticky activé */
    stickyHeader: boolean
    /** Taille de page */
    pageSize?: number
    /** Filtres actifs (optionnel) */
    filters?: Record<string, any>
    /** Tri actif (optionnel) */
    sort?: { field: string; direction: 'asc' | 'desc' }[]
    /** Recherche globale (optionnel) */
    search?: string
}

/**
 * Composable pour gérer la configuration persistante d'un DataTable
 *
 * @param storageKey - Clé unique pour identifier cette configuration dans localStorage
 * @param defaultConfig - Configuration par défaut
 * @returns Objet avec la configuration réactive et les méthodes de sauvegarde/chargement
 */
export function useDataTableConfig(
    storageKey: string,
    defaultConfig: Partial<DataTableConfig> = {}
) {
    // Configuration par défaut
    const defaultConfigValue: DataTableConfig = {
        visibleColumns: defaultConfig.visibleColumns || [],
        columnOrder: defaultConfig.columnOrder || [],
        columnWidths: defaultConfig.columnWidths || {},
        pinnedColumns: defaultConfig.pinnedColumns || [],
        stickyHeader: defaultConfig.stickyHeader ?? false,
        pageSize: defaultConfig.pageSize || 20,
        filters: defaultConfig.filters || {},
        sort: defaultConfig.sort || [],
        search: defaultConfig.search || undefined
    }

    // Charger la configuration depuis localStorage
    const storedConfig = useLocalStorage<DataTableConfig>(
        `datatable_config_${storageKey}`,
        defaultConfigValue
    )

    // Références réactives pour la configuration
    const visibleColumns = ref<string[]>(storedConfig.value.visibleColumns)
    const columnOrder = ref<string[]>(storedConfig.value.columnOrder)
    const columnWidths = ref<Record<string, number>>(storedConfig.value.columnWidths)
    const pinnedColumns = ref<ColumnPinState[]>(storedConfig.value.pinnedColumns)
    const stickyHeader = ref<boolean>(storedConfig.value.stickyHeader)
    const pageSize = ref<number>(storedConfig.value.pageSize || 20)
    const filters = ref<Record<string, any>>(storedConfig.value.filters || {})
    const sort = ref<{ field: string; direction: 'asc' | 'desc' }[]>(storedConfig.value.sort || [])
    const search = ref<string | undefined>(storedConfig.value.search || undefined)

    /**
     * Sauvegarde la configuration complète
     */
    const saveConfig = () => {
        const config: DataTableConfig = {
            visibleColumns: visibleColumns.value,
            columnOrder: columnOrder.value,
            columnWidths: columnWidths.value,
            pinnedColumns: pinnedColumns.value,
            stickyHeader: stickyHeader.value,
            pageSize: pageSize.value,
            filters: filters.value,
            sort: sort.value,
            search: search.value
        }
        storedConfig.value = config
    }

    /**
     * Charge la configuration depuis localStorage
     */
    const loadConfig = () => {
        const config = storedConfig.value
        visibleColumns.value = config.visibleColumns || []
        columnOrder.value = config.columnOrder || []
        columnWidths.value = config.columnWidths || {}
        pinnedColumns.value = config.pinnedColumns || []
        stickyHeader.value = config.stickyHeader ?? false
        pageSize.value = config.pageSize || 20
        filters.value = config.filters || {}
        sort.value = config.sort || []
        search.value = config.search || undefined
    }

    /**
     * Réinitialise la configuration aux valeurs par défaut
     */
    const resetConfig = () => {
        visibleColumns.value = defaultConfigValue.visibleColumns
        columnOrder.value = defaultConfigValue.columnOrder
        columnWidths.value = defaultConfigValue.columnWidths
        pinnedColumns.value = defaultConfigValue.pinnedColumns
        stickyHeader.value = defaultConfigValue.stickyHeader
        pageSize.value = defaultConfigValue.pageSize || 20
        filters.value = defaultConfigValue.filters || {}
        sort.value = defaultConfigValue.sort || []
        search.value = defaultConfigValue.search || undefined
        saveConfig()
    }

    /**
     * Met à jour les colonnes visibles
     */
    const updateVisibleColumns = (columns: string[]) => {
        visibleColumns.value = columns
        saveConfig()
    }

    /**
     * Met à jour l'ordre des colonnes
     */
    const updateColumnOrder = (order: string[]) => {
        columnOrder.value = order
        saveConfig()
    }

    /**
     * Met à jour la largeur d'une colonne
     */
    const updateColumnWidth = (field: string, width: number) => {
        columnWidths.value[field] = width
        saveConfig()
    }

    /**
     * Met à jour toutes les largeurs des colonnes
     */
    const updateColumnWidths = (widths: Record<string, number>) => {
        columnWidths.value = { ...widths }
        saveConfig()
    }

    /**
     * Met à jour les colonnes épinglées
     */
    const updatePinnedColumns = (pinned: ColumnPinState[]) => {
        pinnedColumns.value = pinned
        saveConfig()
    }

    /**
     * Met à jour l'état du sticky header
     */
    const updateStickyHeader = (enabled: boolean) => {
        stickyHeader.value = enabled
        saveConfig()
    }

    /**
     * Met à jour la taille de page
     */
    const updatePageSize = (size: number) => {
        pageSize.value = size
        saveConfig()
    }

    /**
     * Met à jour les filtres
     */
    const updateFilters = (newFilters: Record<string, any>) => {
        // Créer une copie profonde pour s'assurer que la réactivité fonctionne
        const filtersCopy = JSON.parse(JSON.stringify(newFilters || {}))
        filters.value = filtersCopy
        saveConfig()
    }

    /**
     * Met à jour le tri
     */
    const updateSort = (newSort: { field: string; direction: 'asc' | 'desc' }[]) => {
        sort.value = [...newSort]
        saveConfig()
    }

    /**
     * Met à jour la recherche globale
     */
    const updateSearch = (newSearch: string | undefined) => {
        search.value = newSearch
        saveConfig()
    }

    // Sauvegarder automatiquement lors des changements
    watch([visibleColumns, columnOrder, columnWidths, pinnedColumns, stickyHeader, pageSize, filters, sort, search], () => {
        saveConfig()
    }, { deep: true })

    return {
        // État réactif
        visibleColumns,
        columnOrder,
        columnWidths,
        pinnedColumns,
        stickyHeader,
        pageSize,
        filters,
        sort,
        search,

        // Configuration complète (computed)
        config: computed(() => ({
            visibleColumns: visibleColumns.value,
            columnOrder: columnOrder.value,
            columnWidths: columnWidths.value,
            pinnedColumns: pinnedColumns.value,
            stickyHeader: stickyHeader.value,
            pageSize: pageSize.value,
            filters: filters.value,
            sort: sort.value,
            search: search.value
        })),

        // Méthodes
        saveConfig,
        loadConfig,
        resetConfig,
        updateVisibleColumns,
        updateColumnOrder,
        updateColumnWidth,
        updateColumnWidths,
        updatePinnedColumns,
        updateStickyHeader,
        updatePageSize,
        updateFilters,
        updateSort,
        updateSearch
    }
}

