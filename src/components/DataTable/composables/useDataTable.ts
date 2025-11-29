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
import { ref, computed, watch } from 'vue'
import type { DataTableProps } from '@/components/DataTable/types/dataTable'
import { useDataTableCore } from './useDataTableCore'
import { useDataTableExport } from './useDataTableExport'
import { useDataTableSelection } from './useDataTableSelection'

export function useDataTable(props: DataTableProps, emit: any) {
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
    const advancedFilters = ref({})
    const columns = ref(props.columns || [])

    // Initialiser visibleColumns en tenant compte des propriétés hide et visible
    const initializeVisibleColumns = () => {
        const allColumns = props.columns || []

        // Filtrer les colonnes selon leur visibilité
        const visibleCols = allColumns
            .filter(col => {
                // Si la colonne a la propriété hide = true, elle ne doit pas être visible par défaut
                if (col.hide === true) {
                    return false
                }
                // Si la colonne a la propriété visible = false, elle ne doit pas être visible par défaut
                if (col.visible === false) {
                    return false
                }
                // Par défaut, la colonne est visible
                return true
            })
            .map(col => col.field)

        // Ajouter la colonne de numéro de ligne en première position (si pas déjà présente)
        const columnsWithRowNumber = [
            '__rowNumber__', // Colonne de numéro de ligne (toujours visible)
            ...visibleCols
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
    const columnWidths = ref({})
    const rowSelection = ref(props.rowSelection || false)
    const selectedRows = ref(new Set())
    const exportLoading = ref({})
    const paginatedData = ref<any[]>([])
    const effectiveCurrentPage = ref(1)
    const effectiveTotalPages = ref(1)
    const effectiveTotalItems = ref(0)
    const effectivePageSize = ref(props.pageSizeProp || 10)
    const start = ref(1)
    const end = ref(10)
    const actions = computed(() => props.actions || [])
    const isLoading = ref(props.loading || false)

    // Synchroniser effectivePageSize avec pageSizeProp quand il change
    watch(() => props.pageSizeProp, (newPageSize) => {
        if (newPageSize !== undefined && newPageSize !== null && newPageSize !== effectivePageSize.value) {
            effectivePageSize.value = newPageSize
            // Recalculer les pages totales
            effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / effectivePageSize.value)
            // Réinitialiser à la page 1 si nécessaire
            if (effectiveCurrentPage.value > effectiveTotalPages.value) {
                effectiveCurrentPage.value = 1
            }
            updatePaginationInfo()
        }
    }, { immediate: true })

    // Fonction pour initialiser les données
    const initializeData = () => {
        if (props.rowDataProp && Array.isArray(props.rowDataProp)) {
            paginatedData.value = [...props.rowDataProp]

            // Utiliser totalItemsProp si disponible, sinon la longueur des données
            effectiveTotalItems.value = props.totalItemsProp ?? props.rowDataProp.length

            effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / effectivePageSize.value)
            updatePaginationInfo()
        }
    }

    // Fonction pour mettre à jour les informations de pagination
    const updatePaginationInfo = () => {
        const startIndex = (effectiveCurrentPage.value - 1) * effectivePageSize.value
        // Pour le calcul de end, utiliser le minimum entre :
        // - Le nombre d'éléments sur la page actuelle
        // - Le nombre total d'éléments
        // - Le nombre réel d'éléments dans rowDataProp (si pagination côté serveur)
        let maxEnd = effectiveTotalItems.value
        if (props.serverSidePagination && Array.isArray(props.rowDataProp)) {
            // En pagination côté serveur, on peut avoir moins d'éléments que pageSize sur la dernière page
            const actualDataCount = props.rowDataProp.length
            const calculatedEnd = startIndex + actualDataCount
            maxEnd = Math.min(calculatedEnd, effectiveTotalItems.value)
        }
        const endIndex = Math.min(startIndex + effectivePageSize.value, maxEnd)
        start.value = startIndex + 1
        end.value = endIndex
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
        // S'assurer que __rowNumber__ est toujours inclus en première position
        const columnsWithRowNumber = newVisibleColumns.includes('__rowNumber__')
            ? newVisibleColumns
            : ['__rowNumber__', ...newVisibleColumns]
        
        visibleColumns.value = columnsWithRowNumber
        columnWidths.value = { ...columnWidths.value, ...newColumnWidths }
    }

    // Fonction pour réordonner les colonnes
    const reorderColumns = (fromIndex: number, toIndex: number) => {
        const newVisibleColumns = [...visibleColumns.value]
        
        // Empêcher de déplacer __rowNumber__
        const fromField = newVisibleColumns[fromIndex]
        const toField = newVisibleColumns[toIndex]
        
        if (fromField === '__rowNumber__' || toField === '__rowNumber__') {
            // Ne pas permettre de déplacer __rowNumber__
            return
        }
        
        const [movedColumn] = newVisibleColumns.splice(fromIndex, 1)
        newVisibleColumns.splice(toIndex, 0, movedColumn)
        visibleColumns.value = newVisibleColumns
    }

    // Fonctions d'export (placeholders pour l'instant)
    const exportToCsv = () => {
        // Export CSV implementation
    }

    const exportToExcel = () => {
        // Export Excel implementation
    }

    const exportToPdf = () => {
        // Export PDF implementation
    }

    const exportSelectedToCsv = () => {
        // Export sélection CSV implementation
    }

    const exportSelectedToExcel = () => {
        // Export sélection Excel implementation
    }

    const deselectAll = () => {
        selection.deselectAllRows()
        // Mettre à jour aussi l'état local selectedRows
        selectedRows.value = new Set()
        emit('selection-changed', new Set())
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
        effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / size)
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

    // Watcher pour les changements de données
    watch([() => props.rowDataProp, () => props.totalItemsProp, () => props.totalPagesProp], ([newData, newTotalItems, newTotalPages]) => {
        // Pour la pagination côté serveur, ne pas modifier paginatedData
        // Les données viennent directement du serveur via rowDataProp
        if (props.serverSidePagination) {
            // Mettre à jour seulement les totaux pour la pagination
            // Utiliser totalItemsProp si fourni, sinon calculer depuis les données
            if (newTotalItems !== undefined && newTotalItems !== null) {
                effectiveTotalItems.value = newTotalItems
            } else if (Array.isArray(newData)) {
                effectiveTotalItems.value = newData.length
            } else {
                effectiveTotalItems.value = 0
            }
            
            // Utiliser totalPagesProp si fourni, sinon calculer
            if (newTotalPages !== undefined && newTotalPages !== null) {
                effectiveTotalPages.value = newTotalPages
            } else {
                effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / effectivePageSize.value)
            }
            
            updatePaginationInfo()
            return
        }

        // Pour la pagination côté client, mettre à jour paginatedData
        if (newData && Array.isArray(newData) && newData.length > 0) {
            // Créer une nouvelle référence pour forcer la mise à jour
            paginatedData.value = [...newData]

            // Utiliser totalItemsProp si disponible, sinon la longueur des données
            effectiveTotalItems.value = newTotalItems ?? newData.length

            effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / effectivePageSize.value)
            updatePaginationInfo()
            
            // S'assurer que les sélections restent vides lors du chargement de nouvelles données
            // Ne pas sélectionner automatiquement toutes les lignes
        } else {
            // Si les données sont vides ou non définies, vider aussi paginatedData
            paginatedData.value = []
            effectiveTotalItems.value = newTotalItems ?? 0
            effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / effectivePageSize.value)
            updatePaginationInfo()
        }
    }, { immediate: true, deep: true, flush: 'post' })

    // Watcher spécifique pour totalItemsProp et totalPagesProp (pagination côté serveur)
    watch([() => props.totalItemsProp, () => props.totalPagesProp], ([newTotalItems, newTotalPages]) => {
        if (props.serverSidePagination) {
            if (newTotalItems !== undefined && newTotalItems !== null) {
                effectiveTotalItems.value = newTotalItems
            }
            if (newTotalPages !== undefined && newTotalPages !== null) {
                effectiveTotalPages.value = newTotalPages
            } else if (newTotalItems !== undefined && newTotalItems !== null) {
                // Recalculer si totalPagesProp n'est pas fourni
                effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / effectivePageSize.value)
            }
            updatePaginationInfo()
        }
    }, { immediate: true })

    // Watcher pour les props de pagination côté serveur
    watch([() => props.currentPageProp, () => props.pageSizeProp], ([newPage, newPageSize]) => {
        if (newPage !== undefined) {
            effectiveCurrentPage.value = newPage
        }
        if (newPageSize !== undefined) {
            effectivePageSize.value = newPageSize
        }
        updatePaginationInfo()
    }, { immediate: true })

    // Watcher pour l'état de chargement
    watch(() => props.loading, (newLoading) => {
        isLoading.value = newLoading || false
    }, { immediate: true })

    // Watcher pour les changements de colonnes
    watch(() => props.columns, (newColumns) => {
        if (newColumns && newColumns.length > 0) {
            visibleColumns.value = initializeVisibleColumns()
        }
    }, { immediate: true, deep: true })

    return {
        // États - retourner les valeurs au lieu des refs
        get globalSearchTerm() { return globalSearchTerm.value },
        get filterState() { return filterState.value },
        get advancedFilters() { return advancedFilters.value },
        get columns() { return columns.value },
        // Méthode pour mettre à jour le filterState
        setFilterState,
        get visibleColumns() { return visibleColumns.value },
        get columnWidths() { return columnWidths.value },
        get rowSelection() { return rowSelection.value },
        get selectedRows() { return selectedRows.value },
        get exportLoading() { return exportLoading.value },
        get paginatedData() { return paginatedData.value },
        get effectiveCurrentPage() { return effectiveCurrentPage.value },
        get effectiveTotalPages() { return effectiveTotalPages.value },
        get effectiveTotalItems() { return effectiveTotalItems.value },
        get effectivePageSize() { return effectivePageSize.value },
        get start() { return start.value },
        get end() { return end.value },
        get actions() { return actions.value },
        get loading() { return isLoading.value },

        // Méthodes
        clearAllFilters,
        handleVisibleColumnsChanged,
        reorderColumns,
        exportToCsv,
        exportToExcel,
        exportToPdf,
        exportSelectedToCsv,
        exportSelectedToExcel,
        deselectAll,
        setSelectedRows,
        updateGlobalSearchTerm,
        goToPage,
        changePageSize,
        createRowNumberColumn
    }
}
