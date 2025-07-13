<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDataTable } from '@/composables/useDataTable'
import type { DataTableProps } from '@/types/dataTable'
import { cellRenderersService } from '@/services/cellRenderers'
import DataTableHeader from './DataTableHeader.vue'
import DataTableToolbar from './DataTableToolbar.vue'
import DataTableBody from './DataTableBody.vue'
import DataTablePagination from './DataTablePagination.vue'
import DataTableSkeleton from './DataTableSkeleton.vue'

const props = defineProps<DataTableProps>()
const emit = defineEmits<{
    'pagination-changed': [params: { page: number; pageSize: number; start: number; end: number }]
    'sort-changed': [sortModel: any]
    'filter-changed': [filterModel: any]
    'global-search-changed': [searchTerm: string]
    'selection-changed': [selectedRows: Set<string>]
    'cell-value-changed': [event: { data: any; field: string; newValue: any; oldValue: any }]
}>()

const dataTable = useDataTable(props, emit)

// Référence au DataTableBody
const dataTableBodyRef = ref()

// État local pour le tri
const currentSortField = ref<string>('')
const currentSortDirection = ref<'asc' | 'desc'>('asc')

const handleGlobalSearchUpdate = (searchTerm: string) => {
    dataTable.updateGlobalSearchTerm(searchTerm)
}

// Handler pour les changements de tri
const handleSortChanged = (sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }) => {
    console.log('🔄 Tri changé dans DataTableNew:', sortData)

    // Mettre à jour l'état local
    if (sortData.isActive) {
        currentSortField.value = sortData.field
        currentSortDirection.value = sortData.direction
    } else {
        currentSortField.value = ''
        currentSortDirection.value = 'asc'
    }

    // Convertir le format pour correspondre à l'API
    const sortModel = sortData.isActive ? [{
        field: sortData.field,
        direction: sortData.direction
    }] : []

    emit('sort-changed', sortModel)
}

// Handler pour les changements de filtre
const handleFilterChanged = (filters: Record<string, any>) => {
    console.log('🔍 Filtre changé dans DataTableNew:', filters)
    emit('filter-changed', filters)
}

// Fonction de formatage pour les dates (date seulement, sans heure)
const formatDateOnly = (value: any): string => {
    if (!value) return ''

    try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return String(value)

        // Format français : DD/MM/YYYY
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    } catch (error) {
        return String(value)
    }
}

// Appliquer le formatage aux colonnes de type date
const formattedColumns = computed(() => {
    // Créer la colonne de numéro de ligne automatique
    const rowNumberColumn = dataTable?.createRowNumberColumn() || {
        field: '__rowNumber__',
        headerName: '#',
        sortable: false,
        filterable: false,
        width: 20,
        editable: false,
        visible: true,
        draggable: false,
        autoSize: false,
        hide: false,
        description: 'Numéro de ligne',
        dataType: 'text' as const
    };

    // Ajouter la colonne de numéro de ligne en première position
    const columnsWithRowNumber = [rowNumberColumn, ...props.columns];

    return columnsWithRowNumber.map(column => {
        // Utiliser le service cellRenderers pour détecter et appliquer les renderers appropriés
        const renderer = cellRenderersService.getRenderer(column);

        if (renderer) {
            return {
                ...column,
                valueFormatter: (params: any) => {
                    // Si la colonne a déjà un formateur personnalisé, l'utiliser
                    if (column.valueFormatter) {
                        return column.valueFormatter(params)
                    }
                    // Sinon, utiliser le renderer du service
                    return renderer(params.value, column, params.data, params.rowIndex)
                }
            }
        }

        // Fallback pour les colonnes de type date
        if (column.dataType === 'date' || column.dataType === 'datetime') {
            return {
                ...column,
                valueFormatter: (params: any) => {
                    // Si la colonne a déjà un formateur personnalisé, l'utiliser
                    if (column.valueFormatter) {
                        return column.valueFormatter(params)
                    }
                    // Sinon, appliquer le formatage de date
                    return formatDateOnly(params.value)
                }
            }
        }

        return column
    })
})

// Initialiser exportLoading avec les propriétés requises
const exportLoadingState = {
    csv: false,
    excel: false,
    pdf: false,
    csvSelection: false,
    excelSelection: false
}

// Extraire les noms des colonnes pour visibleColumns
const visibleColumnNames = computed(() => {
    if (!dataTable?.visibleColumns) return []

    // Utiliser directement les colonnes visibles du composable
    return dataTable.visibleColumns
})

// Filtrer les colonnes selon leur visibilité
const visibleColumns = computed(() => {
    if (!dataTable?.visibleColumns || !formattedColumns.value) return []

    const filtered = formattedColumns.value.filter(column =>
        dataTable.visibleColumns.includes(column.field)
    )

    return filtered
})

// Colonnes pour le gestionnaire (exclut les colonnes avec hide: true)
const columnsForManager = computed(() => {
    return formattedColumns.value.filter(column => column.hide !== true)
})

// Convertir selectedRows en Set<string>
const selectedRowsSet = computed(() => {
    if (!dataTable?.selectedRows) return new Set<string>()
    return new Set<string>(Array.from(dataTable.selectedRows).map(row => String(row)))
})

// Méthode pour vider toutes les sélections
const clearAllSelections = () => {
    // Utiliser la méthode de useDataTable
    dataTable?.deselectAll()

    // Et aussi la méthode de DataTableBody si disponible
    if (dataTableBodyRef.value) {
        dataTableBodyRef.value.clearAllSelections()
    }
}

// Exposer les méthodes
defineExpose({
    clearAllSelections
})
</script>

<template>
    <div class="data-table-native">
        <!-- Skeleton loader pendant le chargement -->
        <DataTableSkeleton v-if="dataTable?.loading" :columnsCount="formattedColumns?.length || 5"
            :rowsCount="pageSizeProp || 10" :showActions="dataTable?.actions?.length > 0" />

        <!-- Contenu normal quand pas de chargement -->
        <template v-else>
            <DataTableHeader :globalSearchTerm="dataTable?.globalSearchTerm" :filterState="dataTable?.filterState"
                :advancedFilters="dataTable?.advancedFilters" :loading="dataTable?.loading"
                @update:globalSearchTerm="handleGlobalSearchUpdate" @clear-all-filters="dataTable?.clearAllFilters()" />
            <DataTableToolbar :columns="columnsForManager" :visibleColumns="visibleColumnNames"
                :columnWidths="dataTable?.columnWidths" :rowSelection="dataTable?.rowSelection"
                :selectedRows="selectedRowsSet" :exportLoading="exportLoadingState"
                :loading="dataTable?.loading" @columns-changed="dataTable?.handleVisibleColumnsChanged"
                @reorder-columns="dataTable?.reorderColumns" @export-csv="dataTable?.exportToCsv()"
                @export-excel="dataTable?.exportToExcel()" @export-pdf="dataTable?.exportToPdf()"
                @export-selected-csv="dataTable?.exportSelectedToCsv()" @export-selected-excel="dataTable?.exportSelectedToExcel()"
                @deselect-all="dataTable?.deselectAll()" />
            <DataTableBody ref="dataTableBodyRef" :columns="visibleColumns" :paginatedData="dataTable?.paginatedData"
                :actions="dataTable?.actions" :loading="dataTable?.loading" :skeletonRowsCount="pageSizeProp || 10"
                :currentSortField="currentSortField" :currentSortDirection="currentSortDirection"
                :rowSelection="dataTable?.rowSelection" :selectedRows="selectedRowsSet"
                :inlineEditing="props.inlineEditing"
                @sort-changed="handleSortChanged" @filter-changed="handleFilterChanged"
                @selection-changed="(selectedRows) => emit('selection-changed', selectedRows)"
                @cell-value-changed="(event) => emit('cell-value-changed', event)" />
            <DataTablePagination :currentPage="dataTable?.effectiveCurrentPage"
                :totalPages="dataTable?.effectiveTotalPages" :total="dataTable?.effectiveTotalItems"
                :pageSize="dataTable?.effectivePageSize" :start="dataTable?.start" :end="dataTable?.end"
                @go-to-page="dataTable?.goToPage($event)" @change-page-size="dataTable?.changePageSize($event)" />
        </template>
    </div>
</template>

<style scoped>
/* Style pour la colonne de numéro de ligne */
.row-number {
    font-weight: 600;
    color: #6b7280;
    font-size: 0.875rem;
    text-align: center;
    display: inline-block;
    min-width: 2rem;
    padding: 0.25rem 0.5rem;
    background: linear-gradient(135deg, #f9fafb, #f3f4f6);
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
}

.row-number:hover {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .row-number {
    color: #9ca3af;
    background: linear-gradient(135deg, #374151, #4b5563);
    border-color: #4b5563;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.dark .row-number:hover {
    background: linear-gradient(135deg, #4b5563, #6b7280);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Amélioration générale du conteneur */
.data-table-native {
    background: linear-gradient(135deg, #ffffff, #f9fafb);
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;
}

.dark .data-table-native {
    background: linear-gradient(135deg, #1a202c, #2d3748);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.data-table-native:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.dark .data-table-native:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

/* Animation d'entrée pour le composant */
.data-table-native {
    animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Amélioration des transitions */
.data-table-native * {
    transition: all 0.2s ease;
}

/* Responsive design amélioré */
@media (max-width: 768px) {
    .data-table-native {
        border-radius: 0.75rem;
        margin: 0.5rem;
    }

    .row-number {
        min-width: 1.5rem;
        padding: 0.125rem 0.25rem;
        font-size: 0.75rem;
    }
}

@media (max-width: 640px) {
    .data-table-native {
        border-radius: 0.5rem;
        margin: 0.25rem;
    }

    .row-number {
        min-width: 1.25rem;
        padding: 0.125rem;
        font-size: 0.625rem;
    }
}

/* Amélioration pour les états de chargement */
.data-table-native.loading {
    opacity: 0.7;
    pointer-events: none;
}

.data-table-native.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(254, 205, 28, 0.1) 50%, transparent 70%);
    animation: shimmer 1.5s infinite;
    pointer-events: none;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

/* Amélioration pour les états d'erreur */
.data-table-native.error {
    border: 2px solid #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.dark .data-table-native.error {
    border-color: #f87171;
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
}

/* Amélioration pour les états de succès */
.data-table-native.success {
    border: 2px solid #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.dark .data-table-native.success {
    border-color: #34d399;
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.1);
}

/* Amélioration pour les états d'avertissement */
.data-table-native.warning {
    border: 2px solid #FECD1C;
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.1);
}

.dark .data-table-native.warning {
    border-color: #fbbf24;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}
</style>
