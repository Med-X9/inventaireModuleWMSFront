/**
 * Composable pour la logique du composant DataTable
 *
 * Ce composable encapsule toute la logique TypeScript du composant DataTable.vue
 * pour séparer la logique de la présentation (template).
 *
 * @module useDataTableComponent
 */

import { computed, ref, watch, watchEffect, onMounted, nextTick, unref, reactive, readonly, type Ref, markRaw } from 'vue'
import { useMemoize } from '@vueuse/core'
import type { DataTableProps, DataTableColumn } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import { logger } from '@/services/loggerService'
import { DATA_TABLE_CONSTANTS } from '../constants'
import type { EmitFunction, FilterState, RowDataArray, LoadedData, AutoDataTableInstance } from '../types/composables'

// Composables principaux
import { useDataTable } from './useDataTable'
import { useQueryModel } from './useQueryModel'
import { useDataTableServerSide } from './useDataTableServerSide'
import { useDataTableColumns } from './useDataTableColumns'
import { useDataTableFeatures } from './useDataTableFeatures'
import { useDataTableState } from './useDataTableState'
import { useDataTableModes } from './useDataTableModes'
import { useDataTableOptimizations } from './useDataTableOptimizations'

// Fonctionnalités avancées
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
    emit?: EmitFunction
}

/**
 * Composable principal pour la logique du composant DataTable
 */
export function useDataTableComponent(config: UseDataTableComponentConfig) {
    const { props, emit } = config

    // Fonction emit sécurisée avec typage strict
    const safeEmit: EmitFunction = (event, ...args) => {
        if (emit && typeof emit === 'function') {
            (emit as EmitFunction)(event, ...args)
        }
    }

    // S'assurer que les props critiques ont des valeurs par défaut sûres
    const safeProps = {
        ...props,
        actions: props.actions || [],
        rowSelection: props.rowSelection ?? false,
        rowDataProp: props.rowDataProp || [],
        advancedFilters: props.advancedFilters || {},
        defaultVisibleColumnsCount: props.defaultVisibleColumnsCount ?? 50
    }

    // ⚡ OPTIMISATION : Les fonctions wrapper d'émission sont maintenant dans useDataTableServerSide

    /**
     * ✅ NOUVELLE FONCTIONNALITÉ : Gestion automatique des modes d'usage
     * Détecte automatiquement le mode (simple/advanced/enterprise) et optimise la configuration
     */
    const modes = useDataTableModes(safeProps)

    /**
     * Sauvegarde de configuration dans localStorage
     * Restaure automatiquement l'état de la table (colonnes visibles, largeurs, etc.)
     */
    const tableConfig = safeProps.storageKey ? useDataTableConfig(
        safeProps.storageKey,
        {
            visibleColumns: [],
            columnOrder: [],
            columnWidths: {},
            pinnedColumns: [],
            stickyHeader: false,
            pageSize: safeProps.pageSizeProp || 20,
            page: 1,
            filters: {},
            sort: [],
            search: undefined
        }
    ) : null

    /**
     * Composable principal du DataTable
     * Gère l'état de base : colonnes, pagination, filtres, sélection
     */
    const dataTableComposable = useDataTable(props, safeEmit)


    /**
     * ⚡ OPTIMISATION : Wrapper dataTable simplifié
     * Expose directement les computed sans try/catch inutiles
     * Vue gère automatiquement la réactivité, pas besoin de wrapper complexe
     */
    const dataTable = {
        // ⚡ États de base : Exposer directement les computed (Vue gère la réactivité)
        globalSearchTerm: computed(() => unref(dataTableComposable.globalSearchTerm)),
        filterState: computed(() => unref(dataTableComposable.filterState)),
        advancedFilters: computed(() => props.advancedFilters || {}),
        columns: computed(() => props.columns || []),
        exportLoading: computed(() => false),
        actions: computed(() => props.actions || []),
        handleVisibleColumnsChanged: featuresHandleVisibleColumnsChanged || ((columns: string[]) => {
            visibleColumnNames.value = columns
        }),
        visibleColumns: computed(() => {
            const value = dataTableComposable.visibleColumns
            const unwrapped = unref(value)
            return Array.isArray(unwrapped) ? unwrapped : []
        }),
        columnWidths: computed(() => {
            const value = dataTableComposable.columnWidths
            return unref(value) || {}
        }),
        selectedRows: computed(() => {
            const value = dataTableComposable.selectedRows
            const unwrapped = unref(value)
            if (unwrapped instanceof Set) {
                return new Set<string>(Array.from(unwrapped).map(v => String(v)))
            }
            return new Set<string>()
        }),
        paginatedData: computed(() => {
            const value = dataTableComposable.paginatedData
            return unref(value) || []
        }),

        // Méthodes (références stables)
        setFilterState: dataTableComposable.setFilterState,
        updateGlobalSearchTerm: dataTableComposable.updateGlobalSearchTerm,
        goToPage: dataTableComposable.goToPage,
        changePageSize: (() => {
            // ⚡ OPTIMISATION : Fonction qui sera mise à jour après useDataTableServerSide
            let handler: ((size: number) => void) | null = null
            const fn = (size: number) => {
                if (handler) {
                    handler(size)
                } else {
                    // Fallback temporaire
                    dataTableComposable.changePageSize(size)
                }
            }
            // Exposer une méthode pour mettre à jour le handler
            ;(fn as any).__updateHandler = (newHandler: (size: number) => void) => {
                handler = newHandler
            }
            return fn
        })(),
        clearAllFilters: dataTableComposable.clearAllFilters,
        reorderColumns: featuresReorderColumns || ((fromIndex: number, toIndex: number) => {
            // Fallback simple si featuresReorderColumns n'est pas disponible
            const newOrder = [...visibleColumnNames.value]
            const [moved] = newOrder.splice(fromIndex, 1)
            newOrder.splice(toIndex, 0, moved)
            visibleColumnNames.value = newOrder
        }),
        exportToCsv: featuresExportToCsv || dataTableComposable.exportToCsv,
        exportToSpreadsheet: featuresExportToSpreadsheet || dataTableComposable.exportToSpreadsheet,
        exportToPdf: featuresExportToPdf || dataTableComposable.exportToPdf,
        exportSelectedToCsv: featuresExportSelectedToCsv || dataTableComposable.exportSelectedToCsv,
        exportSelectedToSpreadsheet: featuresExportSelectedToSpreadsheet || dataTableComposable.exportSelectedToSpreadsheet,
        setSelectedRows: dataTableComposable.setSelectedRows,
        deselectAll: dataTableComposable.deselectAll,
        createRowNumberColumn: dataTableComposable.createRowNumberColumn,

        // ⚡ Pagination : exposer des valeurs simples (pas de ComputedRef) pour simplifier l'utilisation dans le template
        get effectiveCurrentPage() {
            return unref(dataTableComposable.effectiveCurrentPage) || 1
        },
        get effectivePageSize() {
            return unref(dataTableComposable.effectivePageSize) || 20
        },
        get effectiveTotalPages() {
            return unref(dataTableComposable.effectiveTotalPages) || 1
        },
        get effectiveTotalItems() {
            return unref(dataTableComposable.effectiveTotalItems) || 0
        },
        get start() {
            return unref(dataTableComposable.start) || 0
        },
        get end() {
            return unref(dataTableComposable.end) || 0
        },
        get loading() {
            return unref(dataTableComposable.loading) || false
        },
        get rowSelection() {
            return unref(dataTableComposable.rowSelection) || false
        }
    }

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

    const autoDataTable: AutoDataTableInstance | undefined = undefined // shouldEnableAutoManagement ? useAutoDataTable({...}) : undefined

    /**
     * Détermine si les handlers automatiques doivent être utilisés
     */
    const shouldUseAutoHandlers = computed(() => !!autoDataTable)

    // === PAGINATION AUTOMATIQUE INTELLIGENTE ===
    const autoPaginationConfig = computed(() => {
        const dataLength = Array.isArray(safeProps.rowDataProp) ? safeProps.rowDataProp.length : 0

        // ⚡ SERVER-SIDE ONLY : Seuils intelligents pour la pagination automatique
        const thresholds = {
            enablePagination: 100,    // Activer pagination dès 100 lignes
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
            optimalPageSize,
            dataLength,
            thresholds
        }
    })

    /**
     * ⚡ SERVER-SIDE ONLY : Virtual scrolling supprimé
     * 
     * En mode server-side, le serveur gère la pagination et ne renvoie que les données de la page actuelle.
     * Le virtual scrolling n'est donc pas nécessaire car on n'a jamais plus de ~20-50 lignes à afficher.
     */

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
            // Edition annulée
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
    const multiSort = shouldEnableMultiSort ? useMultiSort() : undefined

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

    // État du sticky header (déclaré avant les watchers qui l'utilisent)
    const stickyHeaderState = ref(false)

    // État du nombre de colonnes visibles par défaut
    const defaultVisibleColumnsCountState = ref<number>(props.defaultVisibleColumnsCount ?? 50)

    // Référence au TableBody
    const tableBodyRef = ref()

    // État local pour le tri
    const currentSortField = ref<string>('')
    const currentSortDirection = ref<'asc' | 'desc'>('asc')
    const currentSortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([])

    // === HANDLERS SERVER-SIDE ===
    /**
     * ⚡ OPTIMISATION : Utiliser useDataTableServerSide pour centraliser toute la logique server-side
     * Remplace useDataTableHandlers avec sauvegarde automatique dans tableConfig
     */
    const {
        createQueryModelFromCurrentState,
        handleGlobalSearchUpdate,
        handlePaginationChanged,
        handlePageSizeChanged,
        handleSortChanged,
        handleClearAllFilters,
        handleFilterChanged,
        currentSortModel: serverSideSortModel,
        isSearching
    } = useDataTableServerSide({
        props,
        emit: safeEmit,
        dataTable: dataTable as unknown as import('../types/composables').DataTableInstance,
        queryModel: {
            ...queryModel,
            updateSort: updateQuerySort,
            updateFilter: updateQueryFilter,
            updatePagination: updateQueryPagination,
            updateGlobalSearch: updateQueryGlobalSearch
        } as any,
        autoDataTable,
        multiSort: multiSort as import('../types/composables').MultiSortInstance | undefined,
        tableConfig: tableConfig || undefined
    })

    // ⚡ OPTIMISATION : Synchroniser currentSortModel avec serverSideSortModel
    currentSortModel.value = serverSideSortModel.value
    watch(() => serverSideSortModel.value, (newValue) => {
        currentSortModel.value = newValue
    })

    // ⚡ OPTIMISATION : Wrappers pour intégration avec dataTableComposable
    // Note: handlePageSizeChanged vient de useDataTableServerSide (ligne 335)
    const handlePageSizeChangedWrapper = (size: number) => {
        dataTableComposable.changePageSize(size)
        handlePageSizeChanged(size)
    }
    
    // ⚡ OPTIMISATION : Mettre à jour dataTable.changePageSize avec le wrapper
    if (dataTable && typeof dataTable === 'object' && 'changePageSize' in dataTable) {
        const changePageSizeFn = (dataTable as any).changePageSize
        if (changePageSizeFn && typeof changePageSizeFn.__updateHandler === 'function') {
            changePageSizeFn.__updateHandler(handlePageSizeChangedWrapper)
        } else {
            (dataTable as any).changePageSize = handlePageSizeChangedWrapper
        }
    }

    const handleSortChangedWrapper = async (sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }) => {
        await handleSortChanged(sortData)
        
        // Mise à jour de l'état local du composant
        await nextTick()
        if (currentSortModel.value && currentSortModel.value.length > 0) {
            const firstSort = currentSortModel.value[0]
            currentSortField.value = firstSort.colId
            currentSortDirection.value = firstSort.sort
        } else {
            currentSortField.value = ''
            currentSortDirection.value = 'asc'
        }
    }

    // ⚡ OPTIMISATION : handleFilterChanged doit gérer QueryModel | FilterState
    const handleFilterChangedWrapper = async (queryModelOrFilters: QueryModel | FilterState) => {
        const queryModel = ('page' in queryModelOrFilters && 'pageSize' in queryModelOrFilters)
            ? queryModelOrFilters as QueryModel
            : (() => {
                const qm = createQueryModelFromCurrentState()
                qm.filters = queryModelOrFilters as FilterState
                return qm
            })()
        await handleFilterChanged(queryModel)
    }

    // ⚡ OPTIMISATION : handleGlobalSearchUpdate doit gérer string | QueryModel
    const handleGlobalSearchUpdateWrapper = async (searchTerm: string | QueryModel) => {
        const searchString = typeof searchTerm === 'string' ? searchTerm : searchTerm.search || ''
        await handleGlobalSearchUpdate(searchString)
    }

    // ⚡ OPTIMISATION : handleSelectionChanged depuis useDataTable
    const handleSelectionChanged = (selectedRows: Set<string>) => {
        dataTableComposable.setSelectedRows(selectedRows)
        safeEmit('selection-changed', selectedRows)
    }

    // ⚡ OPTIMISATION : handleClearAllFilters est déjà géré par useDataTableServerSide
    // Pas besoin de wrapper supplémentaire

    // === GESTION DES COLONNES - SIMPLIFIÉE ===

    /**
     * Système de clés stables pour optimiser le rendu des cellules
     * Évite les re-renders inutiles en générant des clés prévisibles
     */
    const getCellKey = (rowId: string | number, field: string): string => {
        return `${rowId}-${field}`
    }

    const getRowKey = (row: Record<string, unknown>, index: number): string => {
        const id = row?.id
        const reference = row?.reference
        if (id !== undefined && id !== null) {
            return String(id)
        }
        if (reference !== undefined && reference !== null) {
            return String(reference)
        }
        return `row-${index}`
    }

    /**
     * Cache pour les valeurs de cellules calculées (évite les recalculs coûteux)
     */
    // Cache des valeurs de cellules avec TTL
    const cellValueCache = new Map<string, { value: unknown; timestamp: number }>()
    const CELL_CACHE_TTL = 1000 // 1 seconde TTL pour les valeurs calculées
    const CELL_CACHE_MAX_SIZE = 1000 // Taille maximale du cache

    const getCachedCellValue = (row: Record<string, unknown>, column: DataTableColumn, key: string): unknown => {
        const now = Date.now()
        const cached = cellValueCache.get(key)

        if (cached && (now - cached.timestamp) < CELL_CACHE_TTL) {
            return cached.value
        }

        // Calculer la valeur (avec logique optimisée)
        let cellValue: unknown = row[column.field]

        // Appliquer les formatters seulement si nécessaire
        if (column.valueFormatter && typeof column.valueFormatter === 'function') {
            try {
                cellValue = column.valueFormatter({ value: cellValue, data: row, column })
            } catch (formatError) {
                // Erreur de formatage ignorée
            }
        }

        // Cache la valeur
        cellValueCache.set(key, { value: cellValue, timestamp: now })

        // Nettoyer le cache périodiquement (éviter la fuite mémoire)
        if (cellValueCache.size > CELL_CACHE_MAX_SIZE) {
            const cutoffTime = now - CELL_CACHE_TTL
            for (const [cacheKey, cacheItem] of cellValueCache) {
                if (cacheItem.timestamp < cutoffTime) {
                    cellValueCache.delete(cacheKey)
                }
            }
        }

        return cellValue
    }

    /**
     * Fonction utilitaire pour filtrer les colonnes selon les règles métier
     * Simplifie la logique complexe de filtrage des colonnes
     */
    const filterColumns = (allColumns: DataTableColumn[], visibleColumnNames: string[]): DataTableColumn[] => {
        return allColumns.filter(col => {
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
    // ⚡ OPTIMISATION : dataTable.visibleColumns est maintenant un computed, utiliser .value
    const getVisibleColumnsArray = (): string[] => {
        if (!dataTable) return []
        try {
            // ⚡ OPTIMISATION : dataTable.visibleColumns est un computed, utiliser .value
            const visibleColumnsValue = dataTable.visibleColumns.value
            return Array.isArray(visibleColumnsValue) ? visibleColumnsValue : []
        } catch (error) {
            return []
        }
    }
    const initialVisibleColumns = getVisibleColumnsArray().filter((col: string) => {
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

    // ⚡ OPTIMISATION : Watcher unique optimisé pour synchroniser visibleColumns
    // Fusionné avec le watcher de sauvegarde pour éviter les cascades


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

    // ⚡ OPTIMISATION : exportLoadingState vient maintenant de useDataTableFeatures

    // Convertir selectedRows en Set<string>
    const selectedRowsSet = computed(() => {
        if (autoDataTable && 'selectedRows' in autoDataTable) {
            const selectedRows = (autoDataTable as any).selectedRows
            if (selectedRows && typeof selectedRows.value !== 'undefined') {
                const value = selectedRows.value
                if (value instanceof Set) {
                    return new Set<string>(Array.from(value).map(v => String(v)))
                }
            }
        }
        try {
            // ⚡ OPTIMISATION : dataTable.selectedRows est un computed, utiliser .value
            const selectedRows = dataTable.selectedRows.value
            if (!selectedRows) return new Set<string>()
            // selectedRows est un Set, donc on peut directement l'utiliser
            if (selectedRows instanceof Set) {
                return new Set<string>(Array.from(selectedRows).map(row => String(row)))
            }
            return new Set<string>()
        } catch {
            return new Set<string>()
        }
    })

    // ⚡ OPTIMISATION : Utiliser useDataTableFeatures pour column management, export et persistence
    // Note: tableConfig est déjà initialisé plus haut, useDataTableFeatures le réutilisera si storageKey est fourni
    const {
        tableConfig: featuresTableConfig,
        persistence: featuresPersistence,
        handleVisibleColumnsChanged: featuresHandleVisibleColumnsChanged,
        reorderColumns: featuresReorderColumns,
        exportToCsv: featuresExportToCsv,
        exportToSpreadsheet: featuresExportToSpreadsheet,
        exportToPdf: featuresExportToPdf,
        exportSelectedToCsv: featuresExportSelectedToCsv,
        exportSelectedToSpreadsheet: featuresExportSelectedToSpreadsheet,
        exportLoadingState: featuresExportLoadingState
    } = useDataTableFeatures({
        props,
        emit: safeEmit,
        dataTable: dataTable as unknown as import('../types/composables').DataTableInstance,
        visibleColumnNames,
        updateVisibleColumns: (columns: string[]) => {
            visibleColumnNames.value = columns
        },
        formattedColumns: computed(() => formattedColumns.value)
    })

    // ⚡ OPTIMISATION : Utiliser tableConfig depuis features si disponible, sinon celui existant
    const effectiveTableConfig = featuresTableConfig || tableConfig

    // ⚡ OPTIMISATION : Watcher pour sauvegarder les colonnes épinglées
    watch(() => {
        if (!columnPinning) return null
        try {
            const pinnedMap = columnPinning.pinnedColumns.value
            return pinnedMap instanceof Map ? pinnedMap : null
        } catch {
            return null
        }
    }, (pinnedMap) => {
        if (pinnedMap && effectiveTableConfig) {
            try {
                const pinnedState = Array.from(pinnedMap.entries()).map(([field, pinned]) => ({
                    field,
                    pinned
                }))
                effectiveTableConfig.updatePinnedColumns(pinnedState)
            } catch (error) {
                // Ignorer les erreurs
            }
        }
    }, { deep: true })

    // ⚡ OPTIMISATION : Watcher pour sauvegarder le sticky header
    watch(() => stickyHeaderState.value, (newValue) => {
        if (effectiveTableConfig) {
            effectiveTableConfig.updateStickyHeader(newValue)
        }
    })

    // ⚡ SERVER-SIDE ONLY : Lazy loading supprimé (inutile en server-side)
    // Le serveur ne renvoie que les données de la page actuelle (~20-50 lignes)

    // ⚡ OPTIMISATION : Utiliser useDataTableState pour l'état global
    // Note: isSearching et masterDetail sont déclarés plus haut dans useDataTableServerSide
    const {
        isLoading: stateIsLoading,
        isSearching: stateIsSearching,
        hasActiveFilters: stateHasActiveFilters,
        hasActiveSearch: stateHasActiveSearch,
        errorState: stateErrorState,
        retryFunction: stateRetryFunction,
        setError: stateSetError,
        clearError: stateClearError,
        retryLastAction: stateRetryLastAction
    } = useDataTableState({
        props,
        emit: safeEmit,
        dataTable: dataTable as unknown as import('../types/composables').DataTableInstance,
        isSearching,
        masterDetail: masterDetail || undefined
    })

    // Handlers pour les fonctionnalités avancées

    // Charger la configuration au montage
    onMounted(async () => {

        if (tableConfig && props.storageKey) {
            // ⚡ VÉRIFICATION : Charger la configuration et vérifier si elle existe vraiment
            const configLoaded = await tableConfig.loadConfig()

            // Si aucune configuration valide n'a été trouvée, ne rien restaurer
            if (!configLoaded) {
                // Aucune configuration sauvegardée, utiliser les valeurs par défaut
                return
            }

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
                visibleColumnNames.value = columnsWithRowNumber
                tableConfig.updateVisibleColumns(columnsWithRowNumber)
            } else {
                const allVisibleColumns = props.columns
                    .filter(col => col.visible !== false && col.hide !== true)
                    .map(col => col.field)
                const columnsWithRowNumber = ['__rowNumber__', ...allVisibleColumns]
                visibleColumnNames.value = columnsWithRowNumber

                // S'assurer que toutes les colonnes visibles sont dans visibleColumnNames
                // (important pour les colonnes dynamiques)
                const currentVisibleFields = visibleColumnNames.value.filter(field => field !== '__rowNumber__')
                const newVisibleFields = allVisibleColumns

                // Si de nouvelles colonnes ont été ajoutées, les inclure
                const missingColumns = newVisibleFields.filter(field => !currentVisibleFields.includes(field))
                if (missingColumns.length > 0) {
                    const updatedVisibleColumns = ['__rowNumber__', ...newVisibleFields]
                    visibleColumnNames.value = updatedVisibleColumns
                }
            }

            if (Object.keys(tableConfig.columnWidths.value).length > 0) {
                Object.entries(tableConfig.columnWidths.value).forEach(([field, width]) => {
                    // ⚡ OPTIMISATION : Accéder directement au ref dans dataTableComposable
                    if (dataTableComposable.columnWidths && typeof dataTableComposable.columnWidths === 'object') {
                        const widths = unref(dataTableComposable.columnWidths)
                        if (widths && typeof widths === 'object') {
                            widths[field] = width as number
                        }
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

            // ⚡ VÉRIFICATION COMPLÈTE : Vérifier tous les états sauvegardés individuellement
            // ⚡ IMPORTANT : Après loadConfig(), les valeurs sont chargées dans les refs
            // On vérifie si les valeurs existent et sont valides (même si ce sont des valeurs "par défaut")

            // ⚡ DEBUG : Vérifier les valeurs chargées
            // console.log('[useDataTableComponent] Valeurs chargées:', {
            //     pageSize: tableConfig.pageSize.value,
            //     page: tableConfig.page.value,
            //     search: tableConfig.search.value,
            //     filters: tableConfig.filters.value
            // })

            const hasSavedFilters = tableConfig.filters.value !== undefined &&
                tableConfig.filters.value !== null &&
                typeof tableConfig.filters.value === 'object'
                // ⚡ NOTE : On accepte même un objet vide car cela signifie que l'utilisateur a explicitement effacé les filtres

            const hasSavedSort = tableConfig.sort.value !== undefined &&
                tableConfig.sort.value !== null &&
                Array.isArray(tableConfig.sort.value) &&
                tableConfig.sort.value.length > 0

            // ⚡ IMPORTANT : Vérifier si search existe dans la config (même si c'est une chaîne vide)
            // Car l'utilisateur peut avoir explicitement effacé la recherche
            const hasSavedSearch = tableConfig.search.value !== undefined &&
                tableConfig.search.value !== null &&
                typeof tableConfig.search.value === 'string'
                // ⚡ NOTE : On accepte même une chaîne vide car cela signifie que l'utilisateur a explicitement effacé la recherche

            // ⚡ IMPORTANT : Vérifier si pageSize existe dans la config (même si c'est la valeur par défaut)
            // Car l'utilisateur peut avoir explicitement choisi cette valeur
            // ⚡ CRITIQUE : Ne pas comparer avec defaultPageSize car l'utilisateur peut avoir choisi 20 explicitement
            const hasSavedPageSize = tableConfig.pageSize.value !== undefined &&
                tableConfig.pageSize.value !== null &&
                typeof tableConfig.pageSize.value === 'number' &&
                tableConfig.pageSize.value > 0

            // ⚡ IMPORTANT : Vérifier si page existe dans la config (même si c'est 1)
            // Car l'utilisateur peut être sur la page 1
            const hasSavedPage = tableConfig.page.value !== undefined &&
                tableConfig.page.value !== null &&
                typeof tableConfig.page.value === 'number' &&
                tableConfig.page.value > 0

            // ⚡ VÉRIFICATION : Vérifier si au moins un état est sauvegardé
            // ⚡ IMPORTANT : Inclure pageSize et page même si ce sont les valeurs par défaut
            // car elles ont été explicitement sauvegardées dans localStorage
            const hasSavedState = hasSavedFilters || hasSavedSort || hasSavedSearch || hasSavedPageSize || hasSavedPage

            // ⚡ DEBUG : Log pour vérifier les états détectés
            // console.log('[useDataTableComponent] États détectés:', {
            //     hasSavedFilters,
            //     hasSavedSort,
            //     hasSavedSearch,
            //     hasSavedPageSize,
            //     hasSavedPage,
            //     hasSavedState,
            //     pageSizeValue: tableConfig.pageSize.value,
            //     searchValue: tableConfig.search.value
            // })

            if (hasSavedState) {
                // ⚡ ORDRE CRITIQUE : Restaurer pageSize AVANT la page
                // car changePageSize() réinitialise la page à 1
                if (hasSavedPageSize && dataTable) {
                    // ⚡ SERVER-SIDE ONLY : Pour la pagination serveur, on ne modifie pas directement effectivePageSize
                    // car c'est un computed readonly qui se synchronise avec pageSizeProp
                    // On attend que le QueryModel soit émis et que le backend réponde avec la bonne pageSize
                    // Le watcher dans useDataTable.ts synchronisera effectivePageSize avec pageSizeProp
                    // Pas besoin de modifier directement ici
                }

                // Restaurer les filtres si sauvegardés
                if (hasSavedFilters && dataTable) {
                    if ('setFilterState' in dataTable && typeof dataTable.setFilterState === 'function') {
                        dataTable.setFilterState(tableConfig.filters.value)
                    }
                }

                // Restaurer le tri si sauvegardé
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
                }

                // ⚡ Restaurer la recherche si sauvegardée (même si c'est une chaîne vide)
                // Car cela signifie que l'utilisateur a explicitement effacé la recherche
                if (hasSavedSearch && dataTable) {
                    if ('updateGlobalSearchTerm' in dataTable && typeof dataTable.updateGlobalSearchTerm === 'function') {
                        // ⚡ IMPORTANT : Toujours restaurer la recherche, même si c'est une chaîne vide
                        dataTable.updateGlobalSearchTerm(typeof tableConfig.search.value === 'string' ? tableConfig.search.value : '')
                    }
                }

                // ⚡ SERVER-SIDE ONLY : Restaurer la page APRÈS la pageSize
                // Pour la pagination serveur, on ne modifie pas directement effectiveCurrentPage
                // car c'est un computed readonly qui se synchronise avec currentPageProp
                // On attend que le QueryModel soit émis et que le backend réponde avec la bonne page
                // Le watcher dans useDataTable.ts synchronisera effectiveCurrentPage avec currentPageProp
                // Pas besoin de modifier directement ici
                if (hasSavedPage && dataTable) {
                    // ⚡ SERVER-SIDE ONLY : La page sera restaurée via le QueryModel émis
                }

                await nextTick()

                // ⚡ CRITIQUE : Créer un QueryModel complet avec TOUS les états restaurés
                // Utiliser les valeurs EXACTES de la config sauvegardée (même si ce sont les valeurs par défaut)
                // ⚡ IMPORTANT : Toujours utiliser les valeurs de tableConfig car elles ont été chargées depuis localStorage
                // ⚡ CRITIQUE : Ne pas se fier uniquement aux flags hasSaved* car ils peuvent être false même si les valeurs existent
                // Utiliser directement les valeurs de tableConfig si elles existent

                // ⚡ DEBUG : Vérifier les valeurs avant de construire le QueryModel
                console.log('[useDataTableComponent] Valeurs de tableConfig avant construction QueryModel:', {
                    pageSize: tableConfig.pageSize.value,
                    page: tableConfig.page.value,
                    search: tableConfig.search.value,
                    filters: tableConfig.filters.value,
                    hasSavedPageSize,
                    hasSavedSearch,
                    hasSavedFilters
                })

                const restoredQueryModel: QueryModel = {
                    // ⚡ Utiliser la page sauvegardée si elle existe, sinon 1
                    page: (tableConfig.page.value !== undefined &&
                           tableConfig.page.value !== null &&
                           typeof tableConfig.page.value === 'number' &&
                           tableConfig.page.value > 0)
                        ? tableConfig.page.value
                        : 1,
                    // ⚡ CRITIQUE : Toujours utiliser tableConfig.pageSize.value si elle existe (chargée depuis localStorage)
                    // Ne pas utiliser props.pageSizeProp car cela pourrait être différent de la valeur sauvegardée
                    pageSize: (tableConfig.pageSize.value !== undefined &&
                               tableConfig.pageSize.value !== null &&
                               typeof tableConfig.pageSize.value === 'number' &&
                               tableConfig.pageSize.value > 0)
                        ? tableConfig.pageSize.value
                        : (props.pageSizeProp || 20),
                    // ⚡ IMPORTANT : Utiliser les filtres sauvegardés (même si c'est un objet vide)
                    filters: (tableConfig.filters.value !== undefined &&
                              tableConfig.filters.value !== null &&
                              typeof tableConfig.filters.value === 'object')
                        ? tableConfig.filters.value
                        : {},
                    // ⚡ CRITIQUE : Utiliser la recherche sauvegardée (même si c'est une chaîne vide)
                    // ⚡ IMPORTANT : Ne pas utiliser trim() car on veut préserver la valeur exacte
                    search: (tableConfig.search.value !== undefined &&
                             tableConfig.search.value !== null &&
                             typeof tableConfig.search.value === 'string')
                        ? tableConfig.search.value
                        : undefined,
                    customParams: props.customDataTableParams || {}
                }

                // ⚡ DEBUG : Log uniquement en développement
                if (process.env.NODE_ENV === 'development') {
                    logger.debug('[useDataTableComponent] QueryModel restauré qui sera émis', restoredQueryModel)
                }

                // Ajouter le tri si sauvegardé
                if (hasSavedSort) {
                    restoredQueryModel.sort = tableConfig.sort.value.map(s => ({
                        colId: s.field,
                        sort: s.direction
                    }))
                }

                // ⚡ IMPORTANT : Émettre query-model-changed pour que le parent soit informé de la restauration
                // C'est l'événement principal qui permet au parent (comme useInventoryResults) de charger les données
                safeEmit('query-model-changed', restoredQueryModel)

                // Émettre aussi les événements spécifiques pour compatibilité
                if (hasSavedFilters) {
                safeEmit('filter-changed', restoredQueryModel)
                }
                if (hasSavedSort) {
                    safeEmit('sort-changed', restoredQueryModel)
                }
                if (hasSavedSearch) {
                    safeEmit('global-search-changed', restoredQueryModel)
                }
                if (hasSavedPageSize) {
                    safeEmit('page-size-changed', restoredQueryModel)
                }
                if (hasSavedPage) {
                    safeEmit('pagination-changed', restoredQueryModel)
                }
            } else {
                // ⚡ SERVER-SIDE ONLY : Aucun état sauvegardé, mais on peut avoir une pageSize ou page sauvegardée
                // La restauration se fera via le QueryModel émis ci-dessous
                if (hasSavedPageSize || hasSavedPage) {
                    const defaultQueryModel: QueryModel = {
                        page: hasSavedPage && tableConfig.page.value ? tableConfig.page.value : 1,
                        pageSize: hasSavedPageSize && tableConfig.pageSize.value ? tableConfig.pageSize.value : (props.pageSizeProp || 20),
                        filters: {},
                        sort: [],
                        search: undefined,
                        customParams: props.customDataTableParams || {}
                    }
                    safeEmit('query-model-changed', defaultQueryModel)
                }

                await nextTick()

                // ⚡ IMPORTANT : Créer un QueryModel avec les valeurs sauvegardées (pageSize, page) si elles existent
                // Utiliser les valeurs EXACTES de la config sauvegardée
                const defaultQueryModel: QueryModel = {
                    page: hasSavedPage ? tableConfig.page.value : 1,
                    // ⚡ IMPORTANT : Utiliser la pageSize sauvegardée si elle existe, même si c'est la valeur par défaut
                    pageSize: hasSavedPageSize ? tableConfig.pageSize.value : (props.pageSizeProp || 20),
                    // ⚡ IMPORTANT : Utiliser les filtres sauvegardés s'ils existent (même si c'est un objet vide)
                    filters: tableConfig.filters.value && typeof tableConfig.filters.value === 'object'
                        ? tableConfig.filters.value
                        : {},
                    // ⚡ IMPORTANT : Utiliser la recherche sauvegardée si elle existe (même si c'est une chaîne vide)
                    search: tableConfig.search.value !== undefined && tableConfig.search.value !== null
                        ? (typeof tableConfig.search.value === 'string' ? tableConfig.search.value : undefined)
                        : undefined,
                    customParams: props.customDataTableParams || {}
                }

                // ⚡ VÉRIFICATION : Émettre query-model-changed seulement si on a au moins pageSize ou page sauvegardée
                // Sinon, ne rien émettre (le DataTable chargera avec les valeurs par défaut)
                if (hasSavedPageSize || hasSavedPage) {
                    // Émettre query-model-changed pour que le parent charge les données avec les valeurs sauvegardées
                    safeEmit('query-model-changed', defaultQueryModel)

                    // Émettre aussi les événements spécifiques si les valeurs sont sauvegardées
                    if (hasSavedPageSize) {
                        safeEmit('page-size-changed', defaultQueryModel)
                    }
                    if (hasSavedPage) {
                        safeEmit('pagination-changed', defaultQueryModel)
                    }
                }
                // Si aucune valeur n'est sauvegardée, ne rien émettre (le DataTable utilisera les valeurs par défaut)
            }
        }
    })

    // ⚡ SERVER-SIDE ONLY : Données finales simplifiées
    // Le serveur renvoie directement les données de la page actuelle
    const finalRowData = computed(() => {
        const rowData = unref(props.rowDataProp) || props.rowDataProp
        return Array.isArray(rowData) ? rowData : []
    })

    // Hash optimisé pour la key du TableBody
    const tableDataHash = computed(() => {
        const tableData = finalRowData.value
        if (!Array.isArray(tableData) || tableData.length === 0) {
            return 'empty'
        }
        const firstRowId = tableData[0]?.id || tableData[0]?.reference || '0'
        const lastRowId = tableData[tableData.length - 1]?.id || tableData[tableData.length - 1]?.reference || '0'
        return `${firstRowId}-${lastRowId}-${tableData.length}`
    })

    // ⚡ SERVER-SIDE ONLY : Watchers simplifiés (pas besoin de lazy loading ou virtual scrolling)

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

    // ⚡ OPTIMISATION : États calculés et chargement viennent maintenant de useDataTableState

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
        tableConfig: effectiveTableConfig,
        autoDataTable,

        // Fonctionnalités avancées
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
        handlePageSizeChanged: handlePageSizeChangedWrapper,
        handleSortChanged: handleSortChangedWrapper,
        handleFilterChanged: handleFilterChangedWrapper,
        handleGlobalSearchUpdate: handleGlobalSearchUpdateWrapper,
        handleClearAllFilters,
        handleSelectionChanged,
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
        isLoading: stateIsLoading,
        isSearching: stateIsSearching,
        exportLoadingState: featuresExportLoadingState,

        // États calculés
        hasActiveFilters: stateHasActiveFilters,
        hasActiveSearch: stateHasActiveSearch,
        stickyHeaderState,
        defaultVisibleColumnsCountState,

        // États d'erreur
        errorState: stateErrorState,
        retryFunction: stateRetryFunction,

        // Pagination automatique intelligente
        autoPaginationConfig,

        // ⚡ SERVER-SIDE ONLY : Lazy loading supprimé

        // Flags des fonctionnalités avancées
        shouldEnableColumnPinning,

        // Méthodes utilitaires
        clearAllSelections,
        setError: stateSetError,
        clearError: stateClearError,
        retryLastAction: stateRetryLastAction,

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

