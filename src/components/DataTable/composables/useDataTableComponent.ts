/**
 * Composable pour la logique du composant DataTable
 *
 * Ce composable encapsule toute la logique TypeScript du composant DataTable.vue
 * pour séparer la logique de la présentation (template).
 *
 * @module useDataTableComponent
 */

import { computed, ref, watch, onMounted, nextTick, unref, reactive, readonly, type Ref, markRaw } from 'vue'
import { useMemoize } from '@vueuse/core'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import { logger } from '@/services/loggerService'

// Composables principaux
import { useDataTable } from './useDataTable'
import { useQueryModel } from './useQueryModel'
import { useDataTableHandlers } from './useDataTableHandlers'
import { useDataTableColumns } from './useDataTableColumns'
import { useDataTableConfig } from './useDataTableConfig'
import { useDataTableModes } from './useDataTableModes'
import { useDataTablePersistence } from './useDataTablePersistence'

// Fonctionnalités avancées
import { useVirtualScrolling } from './useVirtualScrolling'
// import { useDataTableGrouping } from './useDataTableGrouping'
import { useDataTableEditing } from './useDataTableEditing'
import { useDataTableMasterDetail } from './useDataTableMasterDetail'
import { useMultiSort } from './useMultiSort'
import { useColumnPinning } from './useColumnPinning'
import { useColumnResize } from './useColumnResize'

/**
 * Configuration pour useDataTableComponent
 */
export interface UseDataTableComponentConfig {
    props: DataTableProps
    emit?: (...args: any[]) => void
}

/**
 * Composable principal pour la logique du composant DataTable
 */
export function useDataTableComponent(config: UseDataTableComponentConfig) {
    const { props, emit } = config

    // Fonction emit sécurisée
    const safeEmit = (...args: any[]) => {
        if (emit && typeof emit === 'function') {
            emit(...args)
        }
    }

    // S'assurer que les props critiques ont des valeurs par défaut sûres
    const safeProps = {
        ...props,
        actions: props.actions || [],
        advancedFilters: props.advancedFilters || {},
        rowSelection: props.rowSelection ?? false,
        rowDataProp: props.rowDataProp || []
    }

    /**
     * ✅ CACHE POUR ÉVITER LES ÉMISSIONS D'ÉVÉNEMENTS RÉPÉTÉS
     * Stocke le dernier QueryModel émis pour chaque type d'événement
     */
    let lastEmittedPaginationQueryModel: QueryModel | null = null
    let lastEmittedSortQueryModel: QueryModel | null = null
    let lastEmittedFilterQueryModel: QueryModel | null = null
    let lastEmittedSearchQueryModel: QueryModel | null = null

    /**
     * ✅ FONCTIONS WRAPPER POUR ÉVITER LES ÉMISSIONS RÉPÉTÉES
     * Vérifie si le QueryModel a changé avant d'émettre l'événement
     */
    const emitPaginationChanged = (queryModel: QueryModel) => {
        const currentStr = JSON.stringify(queryModel)
        const lastStr = lastEmittedPaginationQueryModel ? JSON.stringify(lastEmittedPaginationQueryModel) : null

        if (currentStr !== lastStr) {
            lastEmittedPaginationQueryModel = { ...queryModel }
            safeEmit('pagination-changed', queryModel)
        }
    }

    const emitSortChanged = (queryModel: QueryModel) => {
        const currentStr = JSON.stringify(queryModel)
        const lastStr = lastEmittedSortQueryModel ? JSON.stringify(lastEmittedSortQueryModel) : null

        if (currentStr !== lastStr) {
            lastEmittedSortQueryModel = { ...queryModel }
            safeEmit('sort-changed', queryModel)
        }
    }

    const emitFilterChanged = (queryModel: QueryModel) => {
        const currentStr = JSON.stringify(queryModel)
        const lastStr = lastEmittedFilterQueryModel ? JSON.stringify(lastEmittedFilterQueryModel) : null

        if (currentStr !== lastStr) {
            lastEmittedFilterQueryModel = { ...queryModel }
            safeEmit('filter-changed', queryModel)
        }
    }

    const emitGlobalSearchChanged = (queryModel: QueryModel) => {
        const currentStr = JSON.stringify(queryModel)
        const lastStr = lastEmittedSearchQueryModel ? JSON.stringify(lastEmittedSearchQueryModel) : null

        if (currentStr !== lastStr) {
            lastEmittedSearchQueryModel = { ...queryModel }
            safeEmit('global-search-changed', queryModel)
        }
    }

    /**
     * ✅ NOUVELLE FONCTIONNALITÉ : Gestion automatique des modes d'usage
     * Détecte automatiquement le mode (simple/advanced/enterprise) et optimise la configuration
     */
    const modes = useDataTableModes(safeProps)

    /**
     * ✅ NOUVELLE FONCTIONNALITÉ : Persistance automatique des préférences utilisateur
     */
    const persistence = safeProps.storageKey ? useDataTablePersistence({
        storageKey: safeProps.storageKey,
        onRestore: (config) => {
            // Restaurer les préférences utilisateur depuis le stockage
            console.log('[DataTable] Configuration restaurée:', config)
        },
        onSave: (config) => {
            console.log('[DataTable] Configuration sauvegardée:', config)
        }
    }) : null

    /**
     * Composable principal du DataTable
     * Gère l'état de base : colonnes, pagination, filtres, sélection
     */
    const dataTableComposable = useDataTable(props, safeEmit)

    // Pré-déclaration de handlePageSizeChanged pour éviter les erreurs de référence
    let handlePageSizeChanged: (size: number) => void = () => {}


    /**
     * Objet dataTable pour compatibilité avec le code existant
     * Pas de markRaw pour éviter les problèmes de réactivité
     */
    const dataTable = {
        // États de base (références directes au composable)
        get globalSearchTerm() { return dataTableComposable.globalSearchTerm },
        get filterState() { return dataTableComposable.filterState },
        get visibleColumns() { return dataTableComposable.visibleColumns },
        get columnWidths() { return dataTableComposable.columnWidths },
        get selectedRows() { return dataTableComposable.selectedRows },
        get paginatedData() { return dataTableComposable.paginatedData },

        // Méthodes (références stables)
        setFilterState: dataTableComposable.setFilterState,
        handleVisibleColumnsChanged: dataTableComposable.handleVisibleColumnsChanged,
        updateGlobalSearchTerm: dataTableComposable.updateGlobalSearchTerm,
        goToPage: dataTableComposable.goToPage,
        changePageSize: handlePageSizeChanged,
        clearAllFilters: dataTableComposable.clearAllFilters,
        reorderColumns: dataTableComposable.reorderColumns,
        exportToCsv: dataTableComposable.exportToCsv,
        exportToSpreadsheet: dataTableComposable.exportToSpreadsheet,
        exportToPdf: dataTableComposable.exportToPdf,
        exportSelectedToCsv: dataTableComposable.exportSelectedToCsv,
        exportSelectedToSpreadsheet: dataTableComposable.exportSelectedToSpreadsheet,
        setSelectedRows: dataTableComposable.setSelectedRows,
        deselectAll: dataTableComposable.deselectAll,
        createRowNumberColumn: dataTableComposable.createRowNumberColumn,

        // Pagination properties
        get effectiveCurrentPage() { return dataTableComposable.effectiveCurrentPage },
        get effectivePageSize() { return dataTableComposable.effectivePageSize },
        get effectiveTotalPages() { return dataTableComposable.effectiveTotalPages },
        get effectiveTotalItems() { return dataTableComposable.effectiveTotalItems },
        get start() { return dataTableComposable.start },
        get end() { return dataTableComposable.end },
        get loading() { return dataTableComposable.loading }
    }

    /**
     * Sauvegarde de configuration dans localStorage
     * Restaure automatiquement l'état de la table (colonnes visibles, largeurs, etc.)
     */
    const tableConfig = safeProps.storageKey ? useDataTableConfig(
        safeProps.storageKey,
        {
            visibleColumns: dataTable?.visibleColumns || [],
            columnOrder: dataTable?.visibleColumns || [],
            columnWidths: dataTable?.columnWidths || {},
            pinnedColumns: [],
            stickyHeader: false,
            pageSize: safeProps.pageSizeProp || 20
        }
    ) : null

    /**
     * QueryModel - Format de communication unifié
     */
    const {
        queryModel,
        updatePagination: updateQueryPagination,
        updateSort: updateQuerySort,
        updateFilter: updateQueryFilter,
        updateGlobalSearch: updateQueryGlobalSearch,
        fromDataTableParams
    } = useQueryModel({
        columns: safeProps.columns
    })

    /**
     * Gestion automatique des données
     */
    const shouldEnableAutoManagement = safeProps.enableAutoManagement !== false &&
        (safeProps.autoManagementConfig?.piniaStore && safeProps.autoManagementConfig?.storeAction)

    const autoDataTable = null as any // shouldEnableAutoManagement ? useAutoDataTable({...}) : null

    /**
     * Détermine si les handlers automatiques doivent être utilisés
     */
    const shouldUseAutoHandlers = computed(() => !!autoDataTable)

    // === PAGINATION AUTOMATIQUE INTELLIGENTE ===
    const autoPaginationConfig = computed(() => {
        const dataLength = Array.isArray(safeProps.rowDataProp) ? safeProps.rowDataProp.length : 0

        // Seuils intelligents pour la pagination automatique
        const thresholds = {
            enablePagination: 100,    // Activer pagination dès 100 lignes
            enableVirtualScrolling: 50, // Activer virtual scrolling dès 50 lignes (évite les plants)
            forceServerSide: 500,     // Forcer côté serveur dès 500 lignes
            recommendedPageSize: 50   // Taille de page recommandée
        }

        // Calculer la taille de page optimale
        const optimalPageSize = computed(() => {
            if (dataLength >= 10000) return 200  // Très gros volumes
            if (dataLength >= 5000) return 100   // Gros volumes
            if (dataLength >= 2000) return 75    // Volumes moyens
            if (dataLength >= 1000) return 50    // Volumes importants
            if (dataLength >= 500) return 25     // Volumes modérés
            if (dataLength >= 100) return 20     // Petits volumes
            return 10 // Très petits volumes
        })

        return {
            shouldEnablePagination: dataLength >= thresholds.enablePagination,
            shouldEnableVirtualScrolling: dataLength >= thresholds.enableVirtualScrolling,
            shouldForceServerSide: dataLength >= thresholds.forceServerSide,
            optimalPageSize,
            dataLength,
            thresholds
        }
    })

    /**
     * Initialisation des fonctionnalités avancées - OPTIMISÉ AVEC PAGINATION INTELLIGENTE
     *
     * 🚀 VIRTUAL SCROLLING AUTOMATIQUE :
     * - S'active automatiquement dès 50+ lignes pour éviter les plants
     * - Peut être forcé via props.enableVirtualScrolling
     * - Hauteur du conteneur ajustée automatiquement selon le volume
     */
    const shouldEnableVirtualScrolling = computed(() => {
        // Si configuré explicitement à false, forcer la désactivation
        if (safeProps.enableVirtualScrolling === false) {
            return false
        }
        // Si configuré explicitement à true, forcer l'activation
        if (safeProps.enableVirtualScrolling === true) {
            return true
        }
        // Sinon, activation automatique intelligente pour éviter les plants
        return autoPaginationConfig.value.shouldEnableVirtualScrolling
    })

    // Indicateur pour savoir si le virtual scrolling est activé automatiquement
    const isVirtualScrollingAutoEnabled = computed(() => {
        return safeProps.enableVirtualScrolling === undefined &&
               autoPaginationConfig.value.shouldEnableVirtualScrolling
    })

    // Configuration effective du virtual scrolling avec optimisation automatique
    const effectiveVirtualScrollingConfig = computed(() => {
        const dataLength = Array.isArray(safeProps.rowDataProp) ? safeProps.rowDataProp.length : 0

        // Calculer automatiquement la hauteur optimale du conteneur
        const calculateOptimalHeight = () => {
            if (dataLength >= 10000) return 800  // Très gros volumes
            if (dataLength >= 5000) return 600   // Gros volumes
            if (dataLength >= 2000) return 500   // Volumes moyens
            if (dataLength >= 1000) return 450   // Volumes importants
            if (dataLength >= 500) return 400    // Volumes modérés
            return 350 // Petits volumes
        }

        const baseConfig = safeProps.virtualScrollingConfig || {
            itemHeight: 50,
            containerHeight: calculateOptimalHeight(),
            overscan: 5,
            threshold: 100
        }

        // Optimisations automatiques selon la taille des données
        if (dataLength >= 1000) {
            return {
                ...baseConfig,
                overscan: Math.max(baseConfig.overscan || 5, 15),
                containerHeight: baseConfig.containerHeight || 600,
                threshold: Math.max(baseConfig.threshold || 100, 200)
            }
        } else if (dataLength >= 500) {
            return {
                ...baseConfig,
                overscan: Math.max(baseConfig.overscan || 5, 10),
                containerHeight: baseConfig.containerHeight || 500
            }
        }

        return baseConfig
    })

    const virtualScrolling = shouldEnableVirtualScrolling ? useVirtualScrolling(
        computed(() => {
            const data = unref(props.rowDataProp)
            return Array.isArray(data) ? data : []
        }),
        effectiveVirtualScrollingConfig
    ) : null

    const shouldEnableGrouping = props.enableGrouping !== false
    const grouping = null // shouldEnableGrouping ? useDataTableGrouping(...) : null

    const shouldEnableEditing = props.inlineEditing !== false
    const editing = shouldEnableEditing ? useDataTableEditing({
        columns: props.columns,
        rowData: props.rowDataProp || [],
        onSave: async (row, field, value) => {
            // Émettre l'événement de changement de valeur de cellule
            safeEmit('cell-value-changed', {
                data: row,
                field,
                oldValue: row[field],
                newValue: value
            })
        },
        onCancel: (row, field) => {
            console.log('Edition annulée:', { row, field })
        }
    }) : null

    const shouldEnablePivot = props.enablePivot !== false
    const pivot = null // shouldEnablePivot ? useDataTablePivot(...) : null

    const shouldEnableMasterDetail = props.enableMasterDetail !== false
    const masterDetail = shouldEnableMasterDetail ? useDataTableMasterDetail(
        props.rowDataProp || [],
        props.masterDetailConfig || {}
    ) : null

    const shouldEnableMultiSort = props.enableMultiSort !== false
    const multiSort = shouldEnableMultiSort ? useMultiSort() : null

    const shouldEnableColumnPinning = props.enableColumnPinning !== false
    const columnPinning = shouldEnableColumnPinning ? useColumnPinning(
        computed(() => props.columns || []),
        props.columnPinningConfig || {}
    ) : null

    const shouldEnableColumnResize = props.enableColumnResize !== false
    const columnResize = shouldEnableColumnResize ? useColumnResize(
        computed(() => props.columns || []),
        props.columnResizeConfig || {}
    ) : null


    // Référence au TableBody
    const tableBodyRef = ref()

    // État local pour le tri
    const currentSortField = ref<string>('')
    const currentSortDirection = ref<'asc' | 'desc'>('asc')
    const currentSortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([])

    // === HANDLERS ===
    /**
     * Composable pour gérer tous les handlers du DataTable
     */
    const {
        createQueryModelFromCurrentState,
        handleGlobalSearchUpdate: originalHandleGlobalSearchUpdate,
        handlePaginationChanged,
        handlePageSizeChanged: originalHandlePageSizeChanged,
        handleSortChanged: originalHandleSortChanged,
        handleClearAllFilters: originalHandleClearAllFilters,
        handleFilterChanged: originalHandleFilterChanged,
        handleSelectionChanged,
        isSearching
    } = useDataTableHandlers({
        props,
        emit: {
            'pagination-changed': emitPaginationChanged,
            'sort-changed': emitSortChanged,
            'filter-changed': emitFilterChanged,
            'global-search-changed': emitGlobalSearchChanged,
            'selection-changed': (selectedRows: Set<string>) => {
                safeEmit('selection-changed', selectedRows)
            }
        },
        dataTable,
        queryModel: queryModel as any,
        autoDataTable,
        currentSortModel,
        multiSort,
        debounceDelay: props.debounceFilter || 500
    })

    // Assignation de la fonction handlePageSizeChanged
    handlePageSizeChanged = (size: number) => {
        dataTableComposable.changePageSize(size)
        if (tableConfig) {
            savePageSizeToConfig(size)
        }

        // ✅ NOUVELLE FONCTIONNALITÉ : Émettre QueryModel obligatoire
        const queryModel = createQueryModelFromCurrentState()
        safeEmit('query-model-changed', queryModel)
    }

    // Fonction helper pour sauvegarder les filtres
    const saveFiltersToConfig = (filters: Record<string, any>) => {
        if (tableConfig && filters !== undefined && filters !== null) {
            tableConfig.updateFilters(filters)
        }
    }

    // Fonction helper pour sauvegarder la taille de page
    const savePageSizeToConfig = (pageSize: number) => {
        if (tableConfig && pageSize !== undefined && pageSize !== null && pageSize > 0) {
            tableConfig.updatePageSize(pageSize)
        }
    }

    // Fonction helper pour sauvegarder la recherche
    const saveSearchToConfig = (search: string | undefined) => {
        if (tableConfig) {
            tableConfig.updateSearch(search || undefined)
        }
    }

    // Fonction helper pour sauvegarder le tri
    const saveSortToConfig = (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
        if (tableConfig && sortModel !== undefined && sortModel !== null && Array.isArray(sortModel)) {
            const sortToSave = sortModel.map(s => ({
                field: s.colId,
                direction: s.sort
            }))
            tableConfig.updateSort(sortToSave)
        }
    }

    // Wrappers des handlers avec sauvegarde automatique dans tableConfig
    const handleFilterChanged = async (filters: Record<string, any>) => {
        // En mode côté serveur, utiliser les handlers QueryModel
        if (props.serverSideFiltering) {
            await originalHandleFilterChanged(filters)
        }
        if (tableConfig) {
            saveFiltersToConfig(filters)
        }

        // ✅ NOUVELLE FONCTIONNALITÉ : Émettre QueryModel obligatoire
        const queryModel = createQueryModelFromCurrentState()
        safeEmit('query-model-changed', queryModel)
    }

    const handleSortChanged = async (sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }) => {
        // En mode côté serveur, utiliser les handlers QueryModel
        if (props.serverSideSorting) {
            await originalHandleSortChanged(sortData)
        }

        // Mise à jour de l'état local du composant (toujours nécessaire)
        await nextTick()
        if (currentSortModel.value && currentSortModel.value.length > 0) {
            const firstSort = currentSortModel.value[0]
            currentSortField.value = firstSort.colId
            currentSortDirection.value = firstSort.sort
        } else {
            currentSortField.value = ''
            currentSortDirection.value = 'asc'
        }

        if (tableConfig && currentSortModel.value) {
            saveSortToConfig(currentSortModel.value)
        }

        // ✅ NOUVELLE FONCTIONNALITÉ : Émettre QueryModel obligatoire
        const queryModel = createQueryModelFromCurrentState()
        safeEmit('query-model-changed', queryModel)
    }

    const handleGlobalSearchUpdate = async (searchTerm: string | QueryModel) => {
        const searchString = typeof searchTerm === 'string' ? searchTerm : searchTerm.search || ''
        await originalHandleGlobalSearchUpdate(searchString)
        if (tableConfig && dataTable) {
            saveSearchToConfig(searchString || undefined)
        }

        // ✅ NOUVELLE FONCTIONNALITÉ : Émettre QueryModel obligatoire
        const queryModel = createQueryModelFromCurrentState()
        safeEmit('query-model-changed', queryModel)
    }

    const handleClearAllFilters = () => {
        originalHandleClearAllFilters()
        if (tableConfig) {
            // Effacer les filtres de la config
            tableConfig.updateFilters({})
        }

        // ✅ NOUVELLE FONCTIONNALITÉ : Émettre QueryModel obligatoire
        const queryModel = createQueryModelFromCurrentState()
        safeEmit('query-model-changed', queryModel)
    }

    // === GESTION DES COLONNES - SIMPLIFIÉE ===

    /**
     * Système de clés stables pour optimiser le rendu des cellules
     * Évite les re-renders inutiles en générant des clés prévisibles
     */
    const getCellKey = (rowId: string | number, field: string): string => {
        return `${rowId}-${field}`
    }

    const getRowKey = (row: any, index: number): string => {
        return row?.id || row?.reference || `row-${index}`
    }

    /**
     * Cache pour les valeurs de cellules calculées (évite les recalculs coûteux)
     */
    const cellValueCache = new Map<string, { value: any; timestamp: number }>()
    const CELL_CACHE_TTL = 1000 // 1 seconde TTL pour les valeurs calculées

    const getCachedCellValue = (row: any, column: any, key: string): any => {
        const now = Date.now()
        const cached = cellValueCache.get(key)

        if (cached && (now - cached.timestamp) < CELL_CACHE_TTL) {
            return cached.value
        }

        // Calculer la valeur (avec logique optimisée)
        let value: any = row[column.field]

        // Appliquer les formatters seulement si nécessaire
        if (column.valueFormatter && typeof column.valueFormatter === 'function') {
            try {
                value = column.valueFormatter({ value, data: row, column })
            } catch (error) {
                console.warn(`Error formatting cell value for ${column.field}:`, error)
            }
        }

        // Cache la valeur
        cellValueCache.set(key, { value, timestamp: now })

        // Nettoyer le cache périodiquement (éviter la fuite mémoire)
        if (cellValueCache.size > 1000) {
            const cutoff = now - CELL_CACHE_TTL
            for (const [cacheKey, cacheItem] of cellValueCache) {
                if (cacheItem.timestamp < cutoff) {
                    cellValueCache.delete(cacheKey)
                }
            }
        }

        return value
    }

    /**
     * Fonction utilitaire pour filtrer les colonnes selon les règles métier
     * Simplifie la logique complexe de filtrage des colonnes
     */
    const filterColumns = (columns: any[], visibleColumnNames: string[]): any[] => {
        return columns.filter(col => {
            if (col.field === '__rowNumber__') return true

            const columnDef = props.columns.find(c => c.field === col.field)
            if (!columnDef) return false

            // Règles simples et claires :
            // 1. Masquer si hide: true
            if (columnDef.hide === true) return false

            // 2. Masquer si visible: false ET pas dans visibleColumnNames
            if (columnDef.visible === false && !visibleColumnNames.includes(col.field)) {
                return false
            }

            return true
        })
    }

    // Initialiser visibleColumnNames avec les colonnes visibles (exclut visible: false)
    // Filtrer les colonnes avec visible: false lors de l'initialisation
    const initialVisibleColumns = (dataTable?.visibleColumns || []).filter(col => {
        if (col === '__rowNumber__') return true
        const columnDef = props.columns.find(c => c.field === col)
        // Exclure les colonnes avec visible: false lors de l'initialisation
        // (elles peuvent être ajoutées via ColumnManager plus tard)
        if (columnDef && columnDef.visible === false) {
            return false
        }
        return true
    })
    const visibleColumnNames = ref<string[]>(initialVisibleColumns)

    // Flag pour éviter les boucles infinies entre watch et wrapper
    let isUpdatingFromWrapper = false

    // Watch pour synchroniser depuis dataTable.visibleColumns (uniquement si pas de mise à jour depuis wrapper)
    watch(() => dataTable?.visibleColumns, (newCols) => {
        if (newCols && !isUpdatingFromWrapper) {
            // Filtrer les colonnes avec visible: false qui ne sont pas dans newCols
            // (pour éviter d'afficher des colonnes avec visible: false par défaut)
            const filtered = newCols.filter(col => {
                if (col === '__rowNumber__') return true
                const columnDef = props.columns.find(c => c.field === col)
                if (columnDef && columnDef.visible === false) {
                    // Si visible: false, ne l'inclure que si elle est déjà dans visibleColumnNames
                    // (c'est-à-dire qu'elle a été explicitement ajoutée)
                    const shouldInclude = visibleColumnNames.value.includes(col)
                    return shouldInclude
                }
                return true
            })

            if (filtered.length !== visibleColumnNames.value.length ||
                filtered.some((v, i) => v !== visibleColumnNames.value[i])) {
                visibleColumnNames.value = filtered
            }
        }
        isUpdatingFromWrapper = false
    }, { immediate: true, deep: true })

    // Wrapper pour handleVisibleColumnsChanged qui met à jour visibleColumnNames immédiatement
    const handleVisibleColumnsChangedWrapper = (newVisibleColumns: string[], newColumnWidths: Record<string, number>) => {
        // Filtrer les colonnes avec hide: true avant de mettre à jour
        const filteredColumns = newVisibleColumns.filter(col => {
            if (col === '__rowNumber__') return true

            const columnDef = props.columns.find(c => c.field === col)
            if (columnDef && columnDef.hide === true) {
                return false
            }

            return true
        })

        // Marquer qu'on met à jour depuis le wrapper pour éviter que le watch écrase
        isUpdatingFromWrapper = true

        // Mettre à jour visibleColumnNames immédiatement pour que finalColumns se mette à jour
        visibleColumnNames.value = filteredColumns

        // Appeler la fonction originale avec les colonnes filtrées
        dataTable?.handleVisibleColumnsChanged(filteredColumns, newColumnWidths)
    }

    /**
     * Composable pour gérer les colonnes formatées
     */
    const {
        formattedColumns,
        visibleColumns,
        columnsForManager,
        createRowNumberColumn
    } = useDataTableColumns({
        props,
        dataTable,
        visibleColumnNames
    })

    // Initialiser exportLoading avec les propriétés requises
    const exportLoadingState = {
        csv: false,
        spreadsheet: false,
        pdf: false,
        csvSelection: false,
        spreadsheetSelection: false
    }

    // Convertir selectedRows en Set<string>
    const selectedRowsSet = computed(() => {
        if (autoDataTable) {
            return autoDataTable.selectedRows.value
        }
        if (!dataTable?.selectedRows) return new Set<string>()
        return new Set<string>(Array.from(dataTable.selectedRows).map(row => String(row)))
    })

    // Watcher optimisé pour les changements de colonnes visibles (avec batching)
    let columnChangeTimeout: number | null = null
    watch(() => {
        const cols = dataTable?.visibleColumns
        return cols ? cols.join(',') : ''
    }, (newKey, oldKey) => {
        if (newKey !== oldKey && dataTable?.visibleColumns) {
            // Batch les changements pour éviter les appels répétés
            if (columnChangeTimeout) {
                clearTimeout(columnChangeTimeout)
            }

            columnChangeTimeout = window.setTimeout(() => {
                const newVisibleColumns = dataTable.visibleColumns

                if (!newVisibleColumns.includes('__rowNumber__')) {
                    dataTable?.handleVisibleColumnsChanged(
                        ['__rowNumber__', ...newVisibleColumns],
                        dataTable.columnWidths || {}
                    )
                    return
                }

                if (columnPinning && columnPinning.getPinDirection('__rowNumber__') !== 'left') {
                    columnPinning.pinColumn('__rowNumber__', 'left')
                }

                if (tableConfig) {
                    tableConfig.updateVisibleColumns(newVisibleColumns)
                    tableConfig.updateColumnOrder(newVisibleColumns)
                }
            }, 16) // ~60fps
        }
    }, { immediate: false }) // Ne pas déclencher au montage

    // Watcher optimisé pour les changements de largeurs de colonnes (avec shallow watch)
    let widthChangeTimeout: number | null = null
    watch(() => dataTable?.columnWidths, (newWidths) => {
        if (newWidths && tableConfig) {
            // Batch les changements de largeur
            if (widthChangeTimeout) {
                clearTimeout(widthChangeTimeout)
            }

            widthChangeTimeout = window.setTimeout(() => {
                tableConfig.updateColumnWidths(newWidths)
            }, 100) // Debounce pour éviter les sauvegardes trop fréquentes
        }
    }, { deep: false }) // Shallow watch pour éviter les triggers inutiles

    // État du sticky header
    const stickyHeaderState = ref(false)

    // État du nombre de colonnes visibles par défaut
    const defaultVisibleColumnsCountState = ref<number>(props.defaultVisibleColumnsCount ?? 50)


    // === LAZY LOADING POUR GROS DATASETS ===
    const lazyLoadingState = reactive({
        isEnabled: false,
        isLoading: false,
        loadedChunks: new Set<number>(),
        totalChunks: 0,
        chunkSize: 100,
        loadedData: [] as any[]
    })

    // Fonction pour activer le lazy loading automatiquement
    const shouldEnableLazyLoading = computed(() => {
        const dataLength = Array.isArray(safeProps.rowDataProp) ? safeProps.rowDataProp.length : 0
        return dataLength > 2000 // Activer dès 2000 lignes
    })

    // Initialiser le lazy loading si nécessaire
    const initializeLazyLoading = () => {
        if (!shouldEnableLazyLoading.value) return

        const fullData = Array.isArray(props.rowDataProp) ? props.rowDataProp : []
        lazyLoadingState.isEnabled = true
        lazyLoadingState.totalChunks = Math.ceil(fullData.length / lazyLoadingState.chunkSize)
        lazyLoadingState.loadedData = []
        lazyLoadingState.loadedChunks.clear()

        // Charger le premier chunk immédiatement
        loadChunk(0)
    }

    // Charger un chunk spécifique
    const loadChunk = async (chunkIndex: number) => {
        if (lazyLoadingState.loadedChunks.has(chunkIndex)) return

        lazyLoadingState.isLoading = true
        try {
            const fullData = Array.isArray(props.rowDataProp) ? props.rowDataProp : []
            const start = chunkIndex * lazyLoadingState.chunkSize
            const end = Math.min(start + lazyLoadingState.chunkSize, fullData.length)
            const chunk = fullData.slice(start, end)

            // Simuler un délai pour les gros chunks (optionnel)
            if (chunk.length > 50) {
                await new Promise(resolve => setTimeout(resolve, 10))
            }

            lazyLoadingState.loadedData.splice(start, 0, ...chunk)
            lazyLoadingState.loadedChunks.add(chunkIndex)
        } finally {
            lazyLoadingState.isLoading = false
        }
    }

    // Charger les chunks visibles (prédictif)
    const loadVisibleChunks = (startIndex: number, endIndex: number) => {
        if (!lazyLoadingState.isEnabled) return

        const startChunk = Math.floor(startIndex / lazyLoadingState.chunkSize)
        const endChunk = Math.floor(endIndex / lazyLoadingState.chunkSize)

        // Charger le chunk actuel et les adjacents
        const chunksToLoad = [startChunk, startChunk + 1, endChunk - 1, endChunk].filter(
            chunk => chunk >= 0 && chunk < lazyLoadingState.totalChunks
        )

        chunksToLoad.forEach(chunk => {
            if (!lazyLoadingState.loadedChunks.has(chunk)) {
                loadChunk(chunk)
            }
        })
    }

    // Données finales avec lazy loading
    const lazyLoadedData = computed(() => {
        if (lazyLoadingState.isEnabled) {
            return lazyLoadingState.loadedData
        }
        return props.rowDataProp || []
    })

    // === GESTION DES ERREURS ET ÉTATS ===
    const errorState = ref<string | null>(null)
    const retryFunction = ref<(() => void) | null>(null)

    /**
     * Définit un état d'erreur avec une fonction de retry
     */
    const setError = (message: string, retryFn?: () => void) => {
        errorState.value = message
        retryFunction.value = retryFn || null
    }

    /**
     * Efface l'état d'erreur
     */
    const clearError = () => {
        errorState.value = null
        retryFunction.value = null
    }

    /**
     * Retry la dernière action qui a échoué
     */
    const retryLastAction = () => {
        if (retryFunction.value) {
            retryFunction.value()
            clearError()
        }
    }

    // Handlers pour les fonctionnalités avancées
    const handlePinColumn = (field: string, direction: 'left' | 'right' | null) => {
        if (columnPinning) {
            columnPinning.pinColumn(field, direction)
            if (tableConfig) {
                const pinnedColumnsArray = Array.from(columnPinning.pinnedColumns.value.entries()).map(([field, direction]) => ({
                    field,
                    pinned: direction
                }))
                tableConfig.updatePinnedColumns(pinnedColumnsArray)
            }
        }
    }

    const handleStickyHeaderChanged = (enabled: boolean) => {
        stickyHeaderState.value = enabled
        if (tableConfig) {
            tableConfig.updateStickyHeader(enabled)
        }
    }

    // Handler pour le changement du nombre de colonnes visibles par défaut
    const handleDefaultVisibleColumnsCountChanged = (count: number) => {
        // Valider les limites
        const currentVisibleWithoutRowNumber = visibleColumnNames.value.filter(field => field !== '__rowNumber__')
        const minCount = 4
        const maxCount = currentVisibleWithoutRowNumber.length
        const clampedCount = Math.max(minCount, Math.min(count, maxCount))

        // IMPORTANT : Ne PAS limiter visibleColumnNames ici !
        // On doit garder TOUTES les colonnes visibles dans visibleColumnNames
        // La limitation sera faite par responsiveColumns et hiddenColumns dans TableBody
        // selon defaultVisibleColumnsCountState

        // Mettre à jour uniquement defaultVisibleColumnsCountState
        // Cela déclenchera automatiquement la mise à jour de responsiveColumns et hiddenColumns
        defaultVisibleColumnsCountState.value = clampedCount

        // Les colonnes déplacées vers le responsive seront automatiquement gérées par hiddenColumns dans TableBody
        // car responsiveColumns et hiddenColumns sont des computed qui dépendent de defaultVisibleColumnsCount
    }

    // Charger la configuration au montage
    onMounted(async () => {

        if (tableConfig && props.storageKey) {
            tableConfig.loadConfig()

            if (tableConfig.visibleColumns.value.length > 0) {
                const savedColumns = tableConfig.visibleColumns.value.filter(col => {
                    if (col === '__rowNumber__') return false
                    const columnDef = props.columns.find(c => c.field === col)
                    if (!columnDef) return false
                    if (columnDef.hide === true) {
                        return false
                    }
                    // Filtrer les colonnes avec visible: false sauf si elles sont explicitement dans la config sauvegardée
                    // (c'est-à-dire qu'elles ont été activées par l'utilisateur)
                    // On les garde car elles sont dans la config sauvegardée
                    return true
                })

                const columnsWithRowNumber = ['__rowNumber__', ...savedColumns]

                // Utiliser le wrapper pour mettre à jour visibleColumnNames
                isUpdatingFromWrapper = true
                visibleColumnNames.value = columnsWithRowNumber

                dataTable?.handleVisibleColumnsChanged(
                    columnsWithRowNumber,
                    tableConfig.columnWidths.value
                )

                tableConfig.updateVisibleColumns(columnsWithRowNumber)
            } else {
                const allVisibleColumns = props.columns
                    .filter(col => col.visible !== false && col.hide !== true)
                    .map(col => col.field)
                const columnsWithRowNumber = ['__rowNumber__', ...allVisibleColumns]

                // Utiliser le wrapper pour mettre à jour visibleColumnNames
                isUpdatingFromWrapper = true
                visibleColumnNames.value = columnsWithRowNumber

                dataTable?.handleVisibleColumnsChanged(
                    columnsWithRowNumber,
                    {}
                )
            }

            if (Object.keys(tableConfig.columnWidths.value).length > 0) {
                Object.entries(tableConfig.columnWidths.value).forEach(([field, width]) => {
                    if (dataTable) {
                        dataTable.columnWidths[field] = width
                    }
                })
            }

            if (columnPinning) {
                columnPinning.pinColumn('__rowNumber__', 'left')

                if (tableConfig.pinnedColumns.value.length > 0) {
                    tableConfig.pinnedColumns.value.forEach(({ field, pinned }) => {
                        if (pinned && field !== '__rowNumber__') {
                            columnPinning.pinColumn(field, pinned)
                        }
                    })
                }
            }

            stickyHeaderState.value = tableConfig.stickyHeader.value

            const hasSavedFilters = tableConfig.filters.value && Object.keys(tableConfig.filters.value).length > 0
            const hasSavedSort = tableConfig.sort.value && tableConfig.sort.value.length > 0
            const hasSavedSearch = tableConfig.search.value && tableConfig.search.value.trim() !== ''
            const defaultPageSize = props.pageSizeProp || 20
            const hasSavedPageSize = tableConfig.pageSize.value && tableConfig.pageSize.value !== defaultPageSize
            const hasSavedState = hasSavedFilters || hasSavedSort || hasSavedSearch || hasSavedPageSize

            if (hasSavedState) {
                if (hasSavedPageSize && dataTable) {
                    // Appel direct pour éviter les problèmes avec handlePageSizeChanged dans onMounted
                    dataTableComposable.changePageSize(tableConfig.pageSize.value)
                }

                if (hasSavedFilters && dataTable) {
                    if ('setFilterState' in dataTable && typeof dataTable.setFilterState === 'function') {
                        dataTable.setFilterState(tableConfig.filters.value)
                    }
                }

                if (hasSavedSort) {
                    const savedSort = tableConfig.sort.value.map(s => ({
                        colId: s.field,
                        sort: s.direction
                    }))

                    currentSortModel.value = savedSort

                    if (savedSort.length > 0) {
                        const firstSort = savedSort[0]
                        currentSortField.value = firstSort.colId
                        currentSortDirection.value = firstSort.sort
                    } else {
                        currentSortField.value = ''
                        currentSortDirection.value = 'asc'
                    }

                    // if (queryModel && queryModel.value && queryModel.value.updateSort) {
                    //     const sortModels = savedSort.map((s, index) => ({
                    //         field: s.colId,
                    //         direction: s.sort,
                    //         priority: index + 1
                    //     }))
                    //     queryModel.value.updateSort(sortModels)
                    // }
                }

                if (hasSavedSearch && dataTable) {
                    if ('updateGlobalSearchTerm' in dataTable && typeof dataTable.updateGlobalSearchTerm === 'function') {
                        dataTable.updateGlobalSearchTerm(tableConfig.search.value || '')
                    }
                }

                await nextTick()

                const restoredQueryModel: QueryModel = {
                    page: 1,
                    pageSize: tableConfig.pageSize.value || props.pageSizeProp || 20,
                    filters: tableConfig.filters.value || {},
                    search: tableConfig.search.value || undefined,
                    customParams: props.customDataTableParams || {}
                }

                if (hasSavedSort) {
                    restoredQueryModel.sort = tableConfig.sort.value.map(s => ({
                        colId: s.field,
                        sort: s.direction
                    }))
                }

                safeEmit('filter-changed', restoredQueryModel)
            } else {
                if (hasSavedPageSize && dataTable) {
                    dataTable.changePageSize(tableConfig.pageSize.value)
                }

                await nextTick()
                const defaultQueryModel: QueryModel = {
                    page: 1,
                    pageSize: tableConfig.pageSize.value || props.pageSizeProp || 20,
                    filters: {},
                    search: undefined,
                    customParams: props.customDataTableParams || {}
                }
                safeEmit('filter-changed', defaultQueryModel)
            }
        }
    })

    // === OPTIMISATIONS DE PERFORMANCE ===

    // Cache des données pour éviter les recalculs coûteux
    const memoizedRowData = (rowDataProp: any[]) => {
        if (!Array.isArray(rowDataProp)) return []
        return rowDataProp.slice() // Créer une copie pour éviter les mutations
    }

    // Données finales à afficher - OPTIMISÉ AVEC LAZY LOADING
    const finalRowData = computed(() => {
        let data: any[] = []

        // Utiliser lazy loading si activé, sinon le cache normal
        let rowData = lazyLoadingState.isEnabled ? lazyLoadedData.value : memoizedRowData(props.rowDataProp || [])

        // Vérifier que c'est bien un tableau (après cache)
        if (!Array.isArray(rowData)) {
            logger.debug('finalRowData - rowDataProp n\'est pas un tableau', {
                type: typeof rowData,
                isArray: Array.isArray(rowData),
                value: rowData
            })
            rowData = []
        }

        // Si pagination est désactivée OU serverSidePagination est activé, utiliser directement rowDataProp
        // Sinon, utiliser paginatedData pour la pagination côté client
        if (!props.pagination || props.serverSidePagination) {
            // Pas de pagination ou pagination serveur : utiliser directement rowDataProp
            data = rowData.length > 0 ? rowData : []
            // Mode server-side : données utilisées directement depuis rowDataProp
        } else {
            // Pagination côté client : utiliser paginatedData si disponible, sinon rowDataProp
            if (Array.isArray(dataTable?.paginatedData) && dataTable.paginatedData.length > 0) {
                data = dataTable.paginatedData
            } else {
                data = rowData.length > 0 ? rowData : []
            }
        }

        // if (grouping && grouping.groupedData.value) {
        //     data = grouping.groupedData.value
        // }

        // if (pivot && pivot.pivotData.value) {
        //     data = pivot.pivotData.value
        // }

        if (shouldEnableVirtualScrolling.value && virtualScrolling && virtualScrolling.visibleItems.value) {
            data = virtualScrolling.visibleItems.value
        }

        // Pagination serveur : utiliser directement rowDataProp


        return data
    })

    // Hash optimisé pour la key du TableBody
    const tableDataHash = computed(() => {
        const data = finalRowData.value
        if (!Array.isArray(data) || data.length === 0) {
            return 'empty'
        }
        const firstId = data[0]?.id || data[0]?.reference || '0'
        const lastId = data[data.length - 1]?.id || data[data.length - 1]?.reference || '0'
        return `${firstId}-${lastId}-${data.length}`
    })

    // Watcher optimisé pour les changements de données (hash efficace pour gros datasets)
    const dataHashCache = new Map<string, string>()
    const getDataHash = (data: any[]): string => {
        if (!Array.isArray(data) || data.length === 0) return 'empty'

        // Pour les gros datasets (>1000), utiliser un échantillonnage
        const sampleSize = data.length > 1000 ? Math.min(10, Math.floor(data.length / 100)) : 5
        const step = Math.max(1, Math.floor(data.length / sampleSize))

        const sampledIds: string[] = []
        for (let i = 0; i < data.length && sampledIds.length < sampleSize; i += step) {
            const item = data[i]
            sampledIds.push(item?.id || item?.reference || `item-${i}`)
        }

        const hash = `${data.length}-${sampledIds.join(',')}`
        return hash
    }

    watch(() => {
        const data = unref(props.rowDataProp) || props.rowDataProp
        if (!Array.isArray(data)) return 'not-array'
        return getDataHash(data)
    }, (newHash, oldHash) => {
        if (newHash !== oldHash && newHash !== 'not-array') {
            // Log optimisé pour éviter la surcharge en production
            if (process.env.NODE_ENV === 'development') {
                logger.debug('DataTable - rowDataProp changed', { hash: newHash })
            }
        }
    }, { immediate: true, deep: false }) // Deep: false pour les gros tableaux

    // Watcher pour initialiser le lazy loading
    watch(shouldEnableLazyLoading, (shouldEnable) => {
        if (shouldEnable && !lazyLoadingState.isEnabled) {
            initializeLazyLoading()
        }
    }, { immediate: true })

    // Watcher pour charger les chunks visibles dans le virtual scrolling
    watch([() => virtualScrolling?.startIndex?.value, () => virtualScrolling?.endIndex?.value], ([startIndex, endIndex]) => {
        if (startIndex !== undefined && endIndex !== undefined) {
            loadVisibleChunks(startIndex, endIndex)
        }
    }, { immediate: false })

    // Colonnes finales (avec colonnes de groupement si nécessaire) - SIMPLIFIÉ
    const finalColumns = computed(() => {
        let columns = filterColumns(visibleColumns.value, visibleColumnNames.value)

        // S'assurer que __rowNumber__ est toujours en première position
        let rowNumberCol = columns.find(col => col.field === '__rowNumber__')

        if (!rowNumberCol) {
            rowNumberCol = createRowNumberColumn()
        }

        const otherColumns = columns.filter(col => col.field !== '__rowNumber__')
        columns = [rowNumberCol, ...otherColumns]

        if (!columns.some(col => col.field === '__rowNumber__')) {
            columns = [rowNumberCol, ...columns]
        }

        // Ajouter les colonnes de groupement si activé
        // if (grouping && grouping.isGrouped.value) {
        //     const groupColumns = grouping.activeGroupings.value.map(config => ({
        //         field: config.field,
        //         headerName: config.label,
        //         sortable: config.sortable || false,
        //         filterable: false,
        //         width: 200,
        //         editable: false,
        //         visible: true,
        //         draggable: false,
        //         autoSize: true,
        //         dataType: 'text' as const,
        //         _isGroupColumn: true
        //     }))
        //     columns = [...groupColumns, ...columns]
        // }

        // Appliquer l'ordre des colonnes avec pinning si activé
        if (columnPinning && props.enableColumnPinning) {
            if (rowNumberCol && columnPinning.getPinDirection('__rowNumber__') !== 'left') {
                columnPinning.pinColumn('__rowNumber__', 'left')
            }

            const ordered = columnPinning.orderedColumns.value

            // Filtrer ordered pour ne garder que les colonnes qui sont dans columns (déjà filtrées)
            const columnsFields = new Set(columns.map(c => c.field))
            const filteredOrdered = ordered.filter(col => columnsFields.has(col.field))

            const rowNumberInOrdered = filteredOrdered.find(col => col.field === '__rowNumber__')
            const otherColsInOrdered = filteredOrdered.filter(col => col.field !== '__rowNumber__')

            if (rowNumberInOrdered) {
                const result = [rowNumberInOrdered, ...otherColsInOrdered]
                return result
            }

            return filteredOrdered
        }

        return columns
    })

    // État de chargement combiné - UTILISE isLoadingCombined OPTIMISÉ

    // États calculés optimisés - MEMOIZÉS
    const hasActiveFilters = computed(() => {
        const filterState = dataTable?.filterState || {}
        const keyCount = Object.keys(filterState).length
        return keyCount > 0
    })

    const hasActiveSearch = computed(() => {
        const searchTerm = dataTable?.globalSearchTerm || ''
        return searchTerm.trim().length > 0
    })

    // État de chargement combiné - OPTIMISÉ
    const isLoadingCombined = computed(() => {
        return props.loading ||
            (isSearching?.value || false) ||
            (virtualScrolling?.isLoadingMore?.value || false) ||
            (masterDetail?.detailStates?.value &&
                masterDetail.detailStates.value.size > 0 &&
                Array.from(masterDetail.detailStates.value.values()).some(state => state.isLoading))
    })

    // Méthode pour vider toutes les sélections
    const clearAllSelections = () => {
        if (tableBodyRef.value && typeof tableBodyRef.value.clearAllSelections === 'function') {
            tableBodyRef.value.clearAllSelections()
        } else {
            dataTable?.deselectAll()
        }
    }

    return {
        // État de base
        dataTable,
        queryModel,
        tableConfig,
        autoDataTable,

        // Fonctionnalités avancées
        virtualScrolling,
        effectiveVirtualScrollingConfig,
        grouping: grouping || null,
        editing,
        pivot: pivot || null,
        masterDetail,
        shouldEnableEditing,
        multiSort,
        columnPinning,
        columnResize,

        // Références
        tableBodyRef,

        // État du tri
        currentSortField,
        currentSortDirection,
        currentSortModel,

        // Handlers
        handlePaginationChanged,
        handlePageSizeChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchUpdate,
        handleClearAllFilters,
        handleSelectionChanged,
        handlePinColumn,
        handleStickyHeaderChanged,
        handleDefaultVisibleColumnsCountChanged,
        handleVisibleColumnsChanged: handleVisibleColumnsChangedWrapper,
        createQueryModelFromCurrentState,

        // Colonnes
        visibleColumnNames,
        formattedColumns,
        visibleColumns,
        columnsForManager,
        finalColumns,
        createRowNumberColumn,

        // Données
        finalRowData,
        tableDataHash,
        selectedRowsSet,

        // État de chargement
        isLoading: isLoadingCombined,
        isSearching,
        exportLoadingState,

        // États calculés
        hasActiveFilters,
        hasActiveSearch,
        stickyHeaderState,
        defaultVisibleColumnsCountState,

        // États d'erreur
        errorState,
        retryFunction,

        // Pagination automatique intelligente
        autoPaginationConfig,

        // Lazy loading
        lazyLoadingState: readonly(lazyLoadingState),

        // Flags des fonctionnalités avancées
        shouldEnableColumnPinning,

        // Méthodes utilitaires
        clearAllSelections,
        setError,
        clearError,
        retryLastAction,

        // Utilitaires d'optimisation du rendu
        getCellKey,
        getRowKey,
        getCachedCellValue,

        // Props calculées
        pageSizeProp: computed(() => props.pageSizeProp || 20),

        // Actions
        actions: safeProps.actions,
        advancedFilters: safeProps.advancedFilters,


        // ✅ NOUVELLES FONCTIONNALITÉS : Modes et persistance
        modes,
        persistence,

        // Pour compatibilité
        detectedMode: modes.mode,
        optimizedConfig: modes.optimizedConfig,
        persistenceState: persistence?.state,
        persistenceActions: persistence?.actions
    }
}

