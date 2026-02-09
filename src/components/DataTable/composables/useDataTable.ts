/**
 * Composable pour la gestion des tables de données (SOLID - Refactored)
 *
 * Responsabilités séparées :
 * - Colonnes et visibilité → useDataTableCore
 * - Export → useDataTableExport
 * - Pagination → useBackendDataTable ou pagination côté client
 * - Sélection → useDataTableSelection
 *
 * @param props - Configuration de la table
 * @param emit - Fonction d'émission d'événements
 * @returns État et actions de la table
 */
import { ref, computed, watch, watchEffect, unref } from 'vue'
import type { DataTableProps } from '@/components/DataTable/types/dataTable'
import { useDataTableCore } from './useDataTableCore'
import { useDataTableExport } from './useDataTableExport'
import { useDataTableSelection } from './useDataTableSelection'

export function useDataTable(props: DataTableProps, emit: import('../types/composables').EmitFunction) {
    // Utiliser les composables spécialisés (SOLID - Single Responsibility)
    const core = useDataTableCore({
        columns: props.columns,
        rowSelection: props.rowSelection ?? false
    })

    const selection = useDataTableSelection({
        totalRows: props.rowDataProp?.length || 0
    })

    // États réactifs de base (KISS - Keep It Simple)
    const globalSearchTerm = ref('')
    const filterState = ref({})
    const advancedFilters = ref(props.advancedFilters || {})
    const columns = ref(props.columns || [])

    // Initialiser visibleColumns en tenant compte des propriétés hide et visible
    // hide: true = toujours masquée, ne peut pas être affichée
    // visible: false = masquée par défaut, mais peut être affichée via ColumnManager
    // defaultVisibleColumnsCount = nombre de colonnes visibles par défaut (défaut: 6, min: 4)
    const initializeVisibleColumns = () => {
        const allColumns = props.columns || []
        const defaultCount = (props as any).defaultVisibleColumnsCount ?? 6

        // Filtrer les colonnes selon leur visibilité
        const visibleCols = allColumns
            .filter(col => {
                // Si la colonne a la propriété hide = true, elle ne doit jamais être visible
                if (col.hide === true) {
                    return false
                }
                // Si la colonne a la propriété visible = false, elle est masquée par défaut
                // mais peut être affichée via ColumnManager, donc on l'exclut de l'initialisation
                if (col.visible === false) {
                    return false
                }
                // Par défaut, la colonne est visible
                return true
            })
            .map(col => col.field)

        // Limiter le nombre de colonnes visibles selon defaultVisibleColumnsCount seulement si < 50
        // Si defaultVisibleColumnsCount >= 50, afficher toutes les colonnes visibles
        let limitedCols: string[]
        if (defaultCount >= 50) {
            // Afficher toutes les colonnes visibles
            limitedCols = visibleCols
        } else {
            // Limiter le nombre de colonnes visibles selon defaultVisibleColumnsCount
            // Les autres seront dans le responsive (bouton "plus")
            const minCount = 4
            const maxCount = visibleCols.length
            const limitedCount = Math.max(minCount, Math.min(defaultCount, maxCount))
            limitedCols = visibleCols.slice(0, limitedCount)
        }

        // Ajouter la colonne de numéro de ligne en première position (si pas déjà présente)
        const columnsWithRowNumber = [
            '__rowNumber__', // Colonne de numéro de ligne (toujours visible)
            ...limitedCols
        ]

        return columnsWithRowNumber
    }

    // Fonction pour créer la colonne de numérotation
    const createRowNumberColumn = () => {
        return {
            field: '__rowNumber__',
            headerName: '#',
            sortable: false,
            filterable: false,
            width: 60,
            editable: false,
            visible: true,
            draggable: false,
            autoSize: false,
            hide: false,
            description: 'Numéro de ligne',
            dataType: 'text' as const,
            valueFormatter: (params: any) => {
                // Vérification de sécurité
                if (!params) return '1';

                // Calculer le numéro de ligne basé sur la pagination
                const currentPage = effectiveCurrentPage.value || 1;
                const pageSize = effectivePageSize.value || 10;
                const rowIndex = params.rowIndex || 0;
                const rowNumber = (currentPage - 1) * pageSize + rowIndex + 1;
                return rowNumber.toString();
            },
            cellRenderer: (params: any) => {
                // Vérification de sécurité
                if (!params) return '<span class="row-number">1</span>';

                // Calculer le numéro de ligne basé sur la pagination
                const currentPage = effectiveCurrentPage.value || 1;
                const pageSize = effectivePageSize.value || 10;
                const rowIndex = params.rowIndex || 0;
                const rowNumber = (currentPage - 1) * pageSize + rowIndex + 1;
                return `<span class="row-number">${rowNumber}</span>`;
            }
        };
    }

    const visibleColumns = ref(initializeVisibleColumns())

    // S'assurer que __rowNumber__ est toujours présent dans visibleColumns (OBLIGATOIRE)
    // ET filtrer UNIQUEMENT les colonnes avec hide: true (toujours masquées)
    // Les colonnes avec visible: false peuvent être affichées via ColumnManager
    watch(visibleColumns, (newCols) => {
        // Filtrer les colonnes pour exclure UNIQUEMENT celles avec hide: true
        const filteredCols = newCols.filter(col => {
            if (col === '__rowNumber__') return true // Toujours inclure __rowNumber__

            // Trouver la définition initiale de la colonne
            const columnDef = props.columns.find(c => c.field === col)
            if (!columnDef) return false

            // Exclure UNIQUEMENT si hide: true (toujours masquée)
            // visible: false est autorisé car l'utilisateur peut l'afficher via ColumnManager
            if (columnDef.hide === true) return false

            return true
        })

        // Réorganiser pour s'assurer que __rowNumber__ est toujours en première position
        if (!filteredCols.includes('__rowNumber__')) {
            const colsWithoutRowNumber = filteredCols.filter(col => col !== '__rowNumber__')
            visibleColumns.value = ['__rowNumber__', ...colsWithoutRowNumber]
        } else if (filteredCols[0] !== '__rowNumber__') {
            const colsWithoutRowNumber = filteredCols.filter(col => col !== '__rowNumber__')
            visibleColumns.value = ['__rowNumber__', ...colsWithoutRowNumber]
        } else if (filteredCols.length !== newCols.length) {
            // Si des colonnes ont été filtrées (hide: true), mettre à jour
            visibleColumns.value = filteredCols
        }
    }, { immediate: true })
    const columnWidths = ref({})
    const rowSelection = ref(props.rowSelection || false)
    const selectedRows = ref(new Set())
    const exportLoading = ref({})
    const paginatedData = ref<any[]>([])
    const effectiveCurrentPage = ref(1)
    const effectiveTotalPages = ref(1)
    const effectiveTotalItems = ref(0)
    // Initialiser effectivePageSize avec la prop si disponible, sinon 10
    const effectivePageSize = ref(props.pageSizeProp ?? 20)
    const start = ref(1)
    const end = ref(10)
    const actions = computed(() => props.actions || [])
    const isLoading = ref(props.loading || false)

    // Synchroniser advancedFilters avec props.advancedFilters quand il change
    watch(() => props.advancedFilters, (newAdvancedFilters) => {
        if (newAdvancedFilters !== undefined) {
            advancedFilters.value = newAdvancedFilters
        }
    }, { immediate: true })

    // ⚡ SERVER-SIDE ONLY : Synchroniser effectivePageSize avec pageSizeProp
    // En server-side, la pagination est gérée par le serveur, on synchronise juste la taille de page
    watch(() => props.pageSizeProp, (newPageSize) => {
        if (newPageSize !== undefined && newPageSize !== null && newPageSize !== effectivePageSize.value) {
            effectivePageSize.value = newPageSize
            // Réinitialiser à la page 1 si nécessaire
            if (effectiveCurrentPage.value > effectiveTotalPages.value) {
                effectiveCurrentPage.value = 1
            }
            updatePaginationInfo()
        }
    }, { immediate: true })

    // Fonction pour initialiser les données
    const initializeData = () => {
        // Déballer rowDataProp si c'est un ref/computed
        let rowData = props.rowDataProp
        if (rowData) {
            try {
                rowData = unref(rowData) || rowData
            } catch (e) {
                rowData = props.rowDataProp
            }
        }
        
        if (rowData && Array.isArray(rowData)) {
            paginatedData.value = [...rowData]

            // ⚡ SERVER-SIDE ONLY : Utiliser totalItemsProp depuis le serveur
            effectiveTotalItems.value = props.totalItemsProp ?? rowData.length

            // ⚡ SERVER-SIDE ONLY : Utiliser totalPagesProp depuis le serveur (ne pas calculer)
            // Le serveur fournit totalPagesProp dans la réponse
            if (props.totalPagesProp !== undefined) {
                effectiveTotalPages.value = props.totalPagesProp
            }
            updatePaginationInfo()
        }
    }

    // ⚡ SERVER-SIDE ONLY : Fonction pour mettre à jour les informations de pagination
    const updatePaginationInfo = () => {
        const startIndex = (effectiveCurrentPage.value - 1) * effectivePageSize.value

        // En pagination côté serveur, utiliser le nombre réel d'éléments dans rowDataProp
        // pour calculer l'end correct
        if (Array.isArray(props.rowDataProp) && props.rowDataProp.length > 0) {
            // Le nombre réel d'éléments sur la page actuelle
            const actualDataCount = props.rowDataProp.length
            // L'index de fin est l'index de début + le nombre réel d'éléments
            const endIndex = startIndex + actualDataCount
            start.value = startIndex + 1
            end.value = Math.min(endIndex, effectiveTotalItems.value)
        } else {
            // Si pas de données, utiliser pageSize
            start.value = startIndex + 1
            end.value = Math.min(startIndex + effectivePageSize.value, effectiveTotalItems.value)
        }
    }

    // Méthodes de base
    const clearAllFilters = () => {
        filterState.value = {}
        advancedFilters.value = {}
        globalSearchTerm.value = ''

        // Émettre l'événement pour déclencher le rafraîchissement de l'API
        emit('filter-changed', {})
        emit('global-search-changed', '')
    }

    // Méthode pour mettre à jour le filterState (utile pour la synchronisation en mode server-side)
    const setFilterState = (filters: Record<string, any>) => {
        // Filtrer les valeurs vides/nulles pour ne garder que les filtres actifs
        const activeFilters: Record<string, any> = {}
        Object.keys(filters || {}).forEach(key => {
            const filter = filters[key]
            // Vérifier si le filtre est actif avant de l'ajouter
            if (filter && typeof filter === 'object') {
                const hasValue = (filter.value !== undefined && filter.value !== null && filter.value !== '') ||
                                (filter.values !== undefined && Array.isArray(filter.values) && filter.values.length > 0) ||
                                (filter.value2 !== undefined && filter.value2 !== null) ||
                                (filter.filter !== undefined && filter.filter !== null && filter.filter !== '')
                if (hasValue) {
                    activeFilters[key] = filter
                }
            } else if (filter) {
                activeFilters[key] = filter
            }
        })
        filterState.value = activeFilters
    }

    const handleVisibleColumnsChanged = (newVisibleColumns: string[], newColumnWidths: Record<string, number>) => {
        // Filtrer UNIQUEMENT les colonnes avec hide: true (toujours masquées)
        // Les colonnes avec visible: false peuvent être affichées via ColumnManager
        const filteredColumns = newVisibleColumns.filter(col => {
            if (col === '__rowNumber__') return true // Toujours inclure __rowNumber__

            // Trouver la définition initiale de la colonne
            const columnDef = props.columns.find(c => c.field === col)
            if (!columnDef) return false

            // Exclure UNIQUEMENT si hide: true (toujours masquée)
            // visible: false est autorisé car l'utilisateur peut l'afficher via ColumnManager
            if (columnDef.hide === true) return false

            return true
        })

        // S'assurer que __rowNumber__ est toujours inclus en première position
        const columnsWithRowNumber = filteredColumns.includes('__rowNumber__')
            ? filteredColumns
            : ['__rowNumber__', ...filteredColumns]

        // Réorganiser pour s'assurer que __rowNumber__ est en première position
        if (columnsWithRowNumber[0] !== '__rowNumber__') {
            const colsWithoutRowNumber = columnsWithRowNumber.filter(col => col !== '__rowNumber__')
            visibleColumns.value = ['__rowNumber__', ...colsWithoutRowNumber]
        } else {
            visibleColumns.value = columnsWithRowNumber
        }

        columnWidths.value = { ...columnWidths.value, ...newColumnWidths }
    }

    // Fonction pour réordonner les colonnes
    const reorderColumns = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return
        
        const newVisibleColumns = [...visibleColumns.value]

        // Empêcher de déplacer __rowNumber__
        const fromField = newVisibleColumns[fromIndex]
        const toField = newVisibleColumns[toIndex]

        if (fromField === '__rowNumber__' || toField === '__rowNumber__') {
            // Ne pas permettre de déplacer __rowNumber__
            return
        }

        // Vérifier que les index sont valides
        if (fromIndex < 0 || fromIndex >= newVisibleColumns.length || 
            toIndex < 0 || toIndex >= newVisibleColumns.length) {
            return
        }

        // Réordonner les colonnes
        const [movedColumn] = newVisibleColumns.splice(fromIndex, 1)
        newVisibleColumns.splice(toIndex, 0, movedColumn)
        
        // S'assurer que __rowNumber__ reste en première position
        const rowNumberIndex = newVisibleColumns.indexOf('__rowNumber__')
        if (rowNumberIndex !== 0 && rowNumberIndex !== -1) {
            newVisibleColumns.splice(rowNumberIndex, 1)
            newVisibleColumns.unshift('__rowNumber__')
        }
        
        visibleColumns.value = newVisibleColumns
    }

    // Fonctions d'export (placeholders pour l'instant)
    const exportToCsv = () => {
        // Export CSV implementation
    }

    const exportToSpreadsheet = () => {
        // Export tableur implementation
    }

    const exportToPdf = () => {
        // Export PDF implementation
    }

    const exportSelectedToCsv = () => {
        // Export sélection CSV implementation
    }

    const exportSelectedToSpreadsheet = () => {
        // Export sélection tableur implementation
    }

    const deselectAll = () => {
        selection.deselectAllRows()
        // Mettre à jour aussi l'état local selectedRows
        selectedRows.value = new Set()
        emit('selection-changed', new Set<string>())
    }

    const setSelectedRows = (newSelection: Set<string>) => {
        selectedRows.value = new Set(newSelection)
    }

    const updateGlobalSearchTerm = (term: string) => {
        globalSearchTerm.value = term
    }

    const goToPage = (page: number) => {
        effectiveCurrentPage.value = page
        updatePaginationInfo()

        // Émettre l'événement de changement de page
        const paginationEvent = {
            page: page,
            pageSize: effectivePageSize.value,
            start: start.value,
            end: end.value
        }
        emit('pagination-changed', paginationEvent)
    }

    const changePageSize = (size: number) => {
        effectivePageSize.value = size
        // ⚠️ Pour pagination serveur : ne pas calculer totalPages, utiliser uniquement totalPagesProp
        if (!props.serverSidePagination && effectiveTotalItems.value > 0) {
            // Pagination côté client : calculer totalPages
        effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / size)
        }
        effectiveCurrentPage.value = 1
        updatePaginationInfo()

        // Émettre l'événement de changement de taille de page
        const paginationEvent = {
            page: 1,
            pageSize: size,
            start: start.value,
            end: end.value
        }
        emit('pagination-changed', paginationEvent)
    }

    // Initialisation immédiate
    initializeData()

    // S'assurer que les sélections sont vides à l'initialisation
    selectedRows.value = new Set()

    // ⚡ OPTIMISATION : Watcher unique optimisé pour toutes les props de pagination
    // Utilise watchEffect avec flush: 'post' pour batch les mises à jour et éviter les cascades
    watchEffect(() => {
        // Déballer rowDataProp si c'est un ref/computed
        let unwrappedData = props.rowDataProp
        if (unwrappedData) {
            try {
                unwrappedData = unref(unwrappedData) || unwrappedData
            } catch (e) {
                unwrappedData = props.rowDataProp
            }
        }

        // ⚡ SERVER-SIDE ONLY : Mettre à jour les totaux depuis les props du backend
        const newTotalItems = props.totalItemsProp
        const newTotalPages = props.totalPagesProp
        const newPage = props.currentPageProp
        const newPageSize = props.pageSizeProp

        // Mettre à jour effectiveTotalItems
        if (newTotalItems !== undefined && newTotalItems !== null) {
            effectiveTotalItems.value = newTotalItems
        } else if (Array.isArray(unwrappedData)) {
            effectiveTotalItems.value = unwrappedData.length
        } else {
            effectiveTotalItems.value = 0
        }

        // ⚡ SERVER-SIDE ONLY : Utiliser UNIQUEMENT totalPagesProp du backend
        if (newTotalPages !== undefined && newTotalPages !== null) {
            effectiveTotalPages.value = newTotalPages
        } else {
            // Fallback uniquement si totalPagesProp n'est pas fourni
            if (effectiveTotalItems.value > 0 && effectivePageSize.value > 0) {
                effectiveTotalPages.value = Math.max(1, Math.ceil(effectiveTotalItems.value / effectivePageSize.value))
            } else {
                effectiveTotalPages.value = 1
            }
        }

        // Mettre à jour la page actuelle
        if (newPage !== undefined && newPage !== null && newPage !== effectiveCurrentPage.value) {
            effectiveCurrentPage.value = newPage
        }

        // Mettre à jour la taille de page
        if (newPageSize !== undefined && newPageSize !== null && newPageSize !== effectivePageSize.value) {
            effectivePageSize.value = newPageSize
        }

        // Toujours mettre à jour les infos de pagination
        updatePaginationInfo()
    }, { flush: 'post' })

    // Watcher pour l'état de chargement
    watch(() => props.loading, (newLoading) => {
        isLoading.value = newLoading || false
    }, { immediate: true })

    // Watcher pour les changements de colonnes
    watch(() => props.columns, (newColumns) => {
        if (newColumns && newColumns.length > 0) {
            // Mettre à jour aussi le ref columns pour synchronisation
            columns.value = newColumns
            visibleColumns.value = initializeVisibleColumns()
        }
    }, { immediate: true, deep: true })

    return {
        // États - utiliser computed pour la réactivité standard Vue 3
        globalSearchTerm: computed(() => globalSearchTerm.value),
        filterState: computed(() => filterState.value),
        advancedFilters: computed(() => advancedFilters.value),
        columns: computed(() => columns.value),
        // Méthode pour mettre à jour le filterState
        setFilterState,
        visibleColumns: computed(() => visibleColumns.value),
        columnWidths: computed(() => columnWidths.value),
        rowSelection: computed(() => rowSelection.value),
        selectedRows: computed(() => selectedRows.value),
        exportLoading: computed(() => exportLoading.value),
        paginatedData: computed(() => paginatedData.value),
        effectiveCurrentPage: computed(() => effectiveCurrentPage.value),
        effectiveTotalPages: computed(() => effectiveTotalPages.value),
        effectiveTotalItems: computed(() => effectiveTotalItems.value),
        effectivePageSize: computed(() => effectivePageSize.value),
        start: computed(() => start.value),
        end: computed(() => end.value),
        actions: computed(() => actions.value),
        loading: computed(() => isLoading.value),

        // Méthodes
        clearAllFilters,
        handleVisibleColumnsChanged,
        reorderColumns,
        exportToCsv,
        exportToSpreadsheet,
        exportToPdf,
        exportSelectedToCsv,
        exportSelectedToSpreadsheet,
        deselectAll,
        setSelectedRows,
        updateGlobalSearchTerm,
        goToPage,
        changePageSize,
        createRowNumberColumn
    }
}

