/**
 * Composable pour DataTable avec gestion automatique complète
 * 
 * Gère automatiquement :
 * - Sélection des lignes
 * - Filtres
 * - Tri (simple et multi-colonnes)
 * - Recherche globale
 * - Pagination (côté client et serveur)
 * - QueryModel
 * 
 * Aucune configuration nécessaire - tout est géré automatiquement
 */

import { ref, computed, watch, type Ref } from 'vue'
import type { DataTableColumn } from '@/components/DataTable/types/dataTable'
import { useQueryModel } from './useQueryModel'
import { useMultiSort } from './useMultiSort'
import { convertQueryModelToStandardParams } from '../utils/queryModelConverter'
import type { SortModel, FilterModel } from '../types/QueryModel'
// Utilitaires DRY
import { calculatePagination, normalizePagination } from '../utils/paginationUtils'
import { filterAndSortData } from '../utils/dataTableHelpers'
import { type FilterValue } from '../utils/filterUtils'
import { type SortRule } from '../utils/sortUtils'
import { useDataTableSelection } from './useDataTableSelection'

export interface AutoDataTableConfig {
    /** Colonnes de la table */
    columns: Ref<DataTableColumn[]>
    /** Données de la table */
    data: Ref<any[]>
    /** Endpoint API pour charger les données (optionnel - si fourni, pagination côté serveur) */
    endpoint?: string
    /** Store Pinia pour charger les données (optionnel) */
    piniaStore?: any
    /** Action du store pour charger les données */
    storeAction?: string
    /** Taille de page par défaut */
    defaultPageSize?: number
    /** Activer la sélection multiple */
    enableRowSelection?: boolean
    /** Activer le tri multi-colonnes */
    enableMultiSort?: boolean
    /** Activer les filtres Set */
    enableSetFilters?: boolean
    /** Charger automatiquement au montage */
    autoLoad?: boolean
}

/**
 * Composable pour DataTable avec gestion automatique
 */
export function useAutoDataTable(config: AutoDataTableConfig) {
    const {
        columns,
        data,
        endpoint,
        piniaStore,
        storeAction,
        defaultPageSize = 20,
        enableRowSelection = false,
        enableMultiSort = true,
        enableSetFilters = false,
        autoLoad = true
    } = config

    // ===== QUERYMODEL =====
    const {
        queryModel,
        updateSort,
        updateFilter,
        updatePagination,
        updateGlobalSearch,
        toStandardParams,
        fromDataTableParams,
        reset: resetQueryModel
    } = useQueryModel({
        columns,
        enabled: true
    })

    // ===== TRI MULTI-COLONNES =====
    const multiSort = enableMultiSort ? useMultiSort([], { maxSortColumns: 3 }) : null

    // Synchroniser multiSort avec QueryModel
    if (multiSort) {
        watch(() => multiSort.sortModel.value, (newSort) => {
            if (newSort && newSort.length > 0) {
                const sortModels: SortModel[] = newSort.map(s => ({
                    field: s.field,
                    direction: s.direction,
                    priority: s.priority
                }))
                updateSort(sortModels)
            }
        }, { deep: true })
    }

    // ===== SÉLECTION DES LIGNES =====
    // Utiliser le composable spécialisé (DRY)
    const selection = useDataTableSelection({
        totalRows: data.value.length
    })

    // ===== ÉTAT DE CHARGEMENT =====
    const loading = ref(false)

    // ===== HANDLERS AUTOMATIQUES =====

    /**
     * Handler automatique pour le tri
     */
    const handleSortChanged = async (params: any) => {
        if (multiSort && enableMultiSort) {
            // Format multi-sort
            if (Array.isArray(params) && params.every((p: any) => p.field && p.direction)) {
                params.forEach((p: any) => {
                    multiSort.addSort(p.field, p.direction)
                })
            } else if (typeof params === 'object' && 'field' in params) {
                multiSort.addSort(params.field, params.direction)
            }
        } else {
            // Tri simple
            if (Array.isArray(params)) {
                const sortModels: SortModel[] = params.map((p, index) => ({
                    field: p.field || p.colId,
                    direction: p.direction || p.sort,
                    priority: index + 1
                }))
                updateSort(sortModels)
            } else if (typeof params === 'object' && 'field' in params) {
                updateSort([{
                    field: params.field,
                    direction: params.direction,
                    priority: 1
                }])
            }
        }
        await loadData()
    }

    /**
     * Handler automatique pour les filtres
     */
    const handleFilterChanged = async (params: any) => {
        if (typeof params === 'object' && params.filters) {
            // Format QueryModel
            Object.entries(params.filters).forEach(([field, filter]: [string, any]) => {
                updateFilter(field, {
                    field,
                    dataType: filter.dataType || 'text',
                    operator: filter.operator || 'contains',
                    value: filter.value,
                    value2: filter.value2,
                    values: filter.values
                })
            })
        } else if (typeof params === 'object') {
            // Format simple
            Object.entries(params).forEach(([field, filter]: [string, any]) => {
                updateFilter(field, {
                    field,
                    dataType: 'text',
                    operator: filter.operator || 'contains',
                    value: filter.filter || filter.value
                })
            })
        }
        await loadData()
    }

    /**
     * Handler automatique pour la pagination
     */
    const handlePaginationChanged = async (params: any) => {
        let page = 1
        let pageSize = defaultPageSize

        if (typeof params === 'object' && 'page' in params && 'pageSize' in params) {
            page = params.page
            pageSize = params.pageSize
        } else if (typeof params === 'object' && 'draw' in params) {
            // Format StandardDataTableParams
            page = Math.floor((params.start || 0) / (params.length || defaultPageSize)) + 1
            pageSize = params.length || defaultPageSize
        }

        updatePagination(page, pageSize)
        await loadData()
    }

    /**
     * Handler automatique pour la recherche globale
     */
    const handleGlobalSearchChanged = async (params: any) => {
        let search = ''

        if (typeof params === 'string') {
            search = params
        } else if (typeof params === 'object' && 'draw' in params) {
            // Format StandardDataTableParams
            search = params['search[value]'] || ''
        }

        updateGlobalSearch(search)
        await loadData()
    }

    /**
     * Handler automatique pour la sélection
     */
    const handleSelectionChanged = (selected: Set<string>) => {
        selection.selectAllRows(Array.from(selected))
    }

    // ===== CHARGEMENT DES DONNÉES =====

    /**
     * Charge les données automatiquement
     */
    const loadData = async () => {
        if (!endpoint && !piniaStore) {
            // Pagination côté client - pas besoin de charger
            return
        }

        loading.value = true
        try {
            const standardParams = toStandardParams.value

            if (piniaStore && storeAction) {
                // Utiliser Pinia store
                await piniaStore[storeAction](standardParams)
            } else if (endpoint) {
                // Utiliser endpoint direct
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(standardParams)
                })
                const result = await response.json()
                // Mettre à jour les données (à adapter selon votre API)
                // data.value = result.data
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données', error)
        } finally {
            loading.value = false
        }
    }

    // ===== PAGINATION =====
    const currentPage = computed(() => queryModel.value.pagination?.page || 1)
    const pageSize = computed(() => queryModel.value.pagination?.pageSize || defaultPageSize)
    const totalItems = computed(() => data.value.length)
    const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

    // Données paginées (côté client si pas d'endpoint)
    const paginatedData = computed(() => {
        if (endpoint || piniaStore) {
            // Pagination côté serveur - utiliser data tel quel
            return data.value
        }

        // Pagination côté client
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return data.value.slice(start, end)
    })

    // ===== FILTRAGE ET TRI (côté client si pas d'endpoint) =====
    // Utiliser les utilitaires DRY (Don't Repeat Yourself)
    const filteredAndSortedData = computed(() => {
        if (endpoint || piniaStore) {
            // Filtrage/tri côté serveur - utiliser data tel quel
            return paginatedData.value
        }

        // Convertir QueryModel vers format utilisable par les utilitaires
        const filters: Record<string, FilterValue> = {}
        if (queryModel.value.filters) {
            Object.entries(queryModel.value.filters).forEach(([field, filter]) => {
                filters[field] = {
                    operator: filter.operator || 'contains',
                    value: filter.value,
                    value2: filter.value2,
                    values: filter.values
                }
            })
        }

        // Convertir SortModel vers SortRule
        const sortRules = queryModel.value.sort 
            ? queryModel.value.sort.map((s, index) => ({
                field: s.field,
                direction: s.direction,
                priority: s.priority ?? index + 1
            }))
            : []

        // Utiliser les utilitaires DRY
        return filterAndSortData(
            data.value,
            filters,
            sortRules,
            queryModel.value.globalSearch || ''
        )
    })

    // ===== RÉINITIALISATION =====
    const reset = async () => {
        selection.clear()
        resetQueryModel()
        if (multiSort) {
            multiSort.clearSort()
        }
        await loadData()
    }

    // Charger automatiquement au montage
    if (autoLoad) {
        loadData()
    }

    return {
        // État
        data: filteredAndSortedData,
        loading: computed(() => loading.value),
        selectedRows: selection.selectedRows,
        selectAllState: selection.selectAllState,
        currentPage,
        pageSize,
        totalItems,
        totalPages,
        queryModel: computed(() => queryModel.value),

        // Handlers automatiques
        handleSortChanged,
        handleFilterChanged,
        handlePaginationChanged,
        handleGlobalSearchChanged,
        handleSelectionChanged,

        // Sélection (utiliser le composable)
        toggleRowSelection: selection.toggleRowSelection,
        selectAllRows: () => {
            const allIds = data.value.map((row, index) => row.id || row.reference || `row-${index}`)
            selection.selectAllRows(allIds)
        },
        deselectAllRows: selection.deselectAllRows,
        isRowSelected: selection.isRowSelected,

        // Tri multi-colonnes
        multiSort: multiSort ? {
            sortModel: multiSort.sortModel,
            addSort: multiSort.addSort,
            clearSort: multiSort.clearSort
        } : null,

        // Méthodes
        loadData,
        reset
    }
}

