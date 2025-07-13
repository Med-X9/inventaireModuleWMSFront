/**
 * Composable pour la gestion des tables de données
 *
 * Ce composable fournit la logique métier pour :
 * - Gestion des colonnes et visibilité
 * - Export (CSV, Excel, PDF)
 * - Pagination et état
 * - Gestion des sélections
 *
 * @param props - Configuration de la table
 * @param emit - Fonction d'émission d'événements
 * @returns État et actions de la table
 */
import { ref, computed, watch, nextTick } from 'vue'
import type { DataTableProps } from '@/types/dataTable'

export function useDataTable(props: DataTableProps, emit: any) {
    // États réactifs de base
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
    const effectivePageSize = ref(10)
    const start = ref(1)
    const end = ref(10)
    const actions = ref(props.actions || [])
    const isLoading = ref(props.loading || false)

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
        const endIndex = Math.min(startIndex + effectivePageSize.value, effectiveTotalItems.value)
        start.value = startIndex + 1
        end.value = endIndex
    }

    // Méthodes de base
    const clearAllFilters = () => {
        filterState.value = {}
        advancedFilters.value = {}
        globalSearchTerm.value = ''
    }

    const handleVisibleColumnsChanged = (newVisibleColumns: string[], newColumnWidths: Record<string, number>) => {
        visibleColumns.value = newVisibleColumns
        columnWidths.value = { ...columnWidths.value, ...newColumnWidths }
    }

    // Fonction pour réordonner les colonnes
    const reorderColumns = (fromIndex: number, toIndex: number) => {
        console.log('🔍 Réordonnancement des colonnes:', { fromIndex, toIndex, currentOrder: visibleColumns.value })

        const newVisibleColumns = [...visibleColumns.value]
        const [movedColumn] = newVisibleColumns.splice(fromIndex, 1)
        newVisibleColumns.splice(toIndex, 0, movedColumn)
        visibleColumns.value = newVisibleColumns

        console.log('🔍 Nouvel ordre des colonnes:', newVisibleColumns)
    }

    // Fonctions d'export (placeholders pour l'instant)
    const exportToCsv = () => {
        console.log('Export CSV')
    }

    const exportToExcel = () => {
        console.log('Export Excel')
    }

    const exportToPdf = () => {
        console.log('Export PDF')
    }

    const exportSelectedToCsv = () => {
        console.log('Export sélection CSV')
    }

    const exportSelectedToExcel = () => {
        console.log('Export sélection Excel')
    }

    const deselectAll = () => {
        selectedRows.value.clear()

        // Émettre l'événement de changement de sélection vers le parent
        emit('selection-changed', new Set())

        // Forcer la mise à jour de l'état
        nextTick(() => {
            console.log('All selections cleared from useDataTable, current state:', selectedRows.value)
        })
    }

    const updateGlobalSearchTerm = (term: string) => {
        globalSearchTerm.value = term
    }

    const goToPage = (page: number) => {
        effectiveCurrentPage.value = page
        updatePaginationInfo()

        // Émettre l'événement de changement de page
        emit('pagination-changed', {
            page: page,
            pageSize: effectivePageSize.value,
            start: start.value,
            end: end.value
        })
    }

    const changePageSize = (size: number) => {
        effectivePageSize.value = size
        effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / size)
        effectiveCurrentPage.value = 1
        updatePaginationInfo()

        // Émettre l'événement de changement de taille de page
        emit('pagination-changed', {
            page: 1,
            pageSize: size,
            start: start.value,
            end: end.value
        })
    }

    // Initialisation immédiate
    initializeData()

    // Watcher pour les changements de données
    watch([() => props.rowDataProp, () => props.totalItemsProp], ([newData, newTotalItems]) => {
        if (newData && Array.isArray(newData)) {
            paginatedData.value = [...newData]

            // Utiliser totalItemsProp si disponible, sinon la longueur des données
            effectiveTotalItems.value = newTotalItems ?? newData.length

            effectiveTotalPages.value = Math.ceil(effectiveTotalItems.value / effectivePageSize.value)
            updatePaginationInfo()
        }
    }, { immediate: true, deep: true })

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
        updateGlobalSearchTerm,
        goToPage,
        changePageSize,
        createRowNumberColumn
    }
}
