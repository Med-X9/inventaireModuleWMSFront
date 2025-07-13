<template>
    <div class="table-container">
        <!-- Skeleton loader pendant le chargement -->
        <div v-if="loading" class="table-skeleton">
            <!-- Header skeleton -->
            <div class="skeleton-header-row">
                <div v-for="col in columns" :key="`header-${col.field}`" class="skeleton-header-cell"></div>
                <div v-if="actions.length > 0" class="skeleton-header-cell skeleton-actions-header"></div>
            </div>

            <!-- Data rows skeleton -->
            <div v-for="rowIndex in skeletonRowsCount" :key="`row-${rowIndex}`" class="skeleton-data-row">
                <div v-for="col in columns" :key="`cell-${rowIndex}-${col.field}`" class="skeleton-data-cell">
                    <div class="skeleton-text"></div>
                </div>
                <div v-if="actions.length > 0" class="skeleton-data-cell skeleton-actions-cell">
                    <div class="skeleton-action-button"></div>
                </div>
            </div>
        </div>

        <!-- Table normale quand pas de chargement -->
        <table v-else class="data-table">
            <thead>
                <tr>
                    <th v-if="rowSelection" class="selection-header">
                        <input type="checkbox"
                               :checked="selectAll"
                               @change="toggleAllSelection"
                               class="select-all-checkbox-input" />
                    </th>
                    <th v-for="col in columns" :key="col.field" class="column-header">
                        <div class="header-content">
                            <span class="header-title">{{ col.headerName || col.field }}</span>

                            <!-- Contrôles de tri et filtrage -->
                            <div class="header-controls">
                                <!-- Bouton de tri avec icônes à trois états -->
                                <button v-if="col.sortable !== false"
                                        @click="handleSort(col.field)"
                                        class="sort-btn"
                                        :class="{
                                            'active': currentSortField === col.field,
                                            'sort-asc': currentSortField === col.field && currentSortDirection === 'asc',
                                            'sort-desc': currentSortField === col.field && currentSortDirection === 'desc'
                                        }"
                                        :title="getSortTooltip(col.field)">

                                    <IconSortBoth v-if="currentSortField !== col.field" class="w-3 h-3" />
                                    <!-- Icône ascendant -->
                                    <IconSortAsc v-else-if="currentSortDirection === 'asc'" class="w-3 h-3" />
                                    <!-- Icône descendant -->
                                    <IconSortDesc v-else class="w-3 h-3" />
                                </button>

                                <!-- Bouton de filtre -->
                                <button v-if="col.filterable !== false"
                                        @click="toggleFilter(col.field)"
                                        class="filter-btn"
                                        :class="{ 'active': showFilter === col.field }"
                                        title="Filtrer">
                                    <IconFilter class="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <!-- Filtre inline -->
                        <FilterDropdown
                            v-if="showFilter === col.field"
                            :column="col"
                            :isVisible="showFilter === col.field"
                            :currentFilter="activeFilters[col.field]"
                            @apply="applyFilter"
                            @clear="() => clearFilter(col.field)"
                            @close="() => closeFilter(col.field)" />
                    </th>
                    <th v-if="actions.length > 0" class="actions-header">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="paginatedData.length === 0">
                    <td :colspan="columns.length + (actions.length > 0 ? 1 : 0)" class="no-data">
                        Aucune donnée à afficher
                    </td>
                </tr>
                <template v-else v-for="(row, rowIndex) in paginatedData" :key="row.id || row.reference || rowIndex">
                    <!-- Ligne principale -->
                    <tr>
                        <td v-if="rowSelection" class="selection-cell">
                            <input type="checkbox"
                                   :checked="isRowSelected(row.id || row.reference || rowIndex)"
                                   @change="toggleRowSelection(row.id || row.reference || rowIndex)" />
                        </td>
                        <td v-for="col in columns" :key="col.field" class="data-cell">
                            <!-- Utilisation du composant NestedDataExpander pour les colonnes avec données imbriquées -->
                            <NestedDataExpander
                                v-if="hasNestedData(row[col.field], col)"
                                :row="row"
                                :column="col"
                                :value="row[col.field]"
                                :isExpanded="isRowExpanded(row.id || row.reference || rowIndex)"
                                :nestedLevel="0"
                                @toggle="toggleExpansion(row.id || row.reference || rowIndex)">

                                <template #parent-content="{ row, column, value }">
                                    <EditableCell
                                        :value="value"
                                        :column="column"
                                        :row="row"
                                        :isEditing="isEditingCell(row.id || row.reference || rowIndex, column.field)"
                                        @start-edit="startEditCell(row.id || row.reference || rowIndex, column.field)"
                                        @save-edit="saveEditCell"
                                        @cancel-edit="cancelEditCell" />
                                </template>

                                <template #nested-rows="{ nestedItems, parentRow, column, nestedLevel }">
                                    <tr v-for="(item, index) in nestedItems"
                                        :key="`nested-${parentRow.id}-${column.field}-${index}`"
                                        class="nested-row">
                                        <td v-for="otherCol in columns" :key="otherCol.field"
                                            :class="{ 'nested-cell': otherCol.field === column.field }">
                                            <div v-if="otherCol.field === column.field" class="nested-item-content">
                                                <span class="nested-indicator">└─</span>
                                                <span>{{ getNestedItemDisplay(item, column) }}</span>
                                            </div>
                                            <span v-else class="nested-empty">-</span>
                                        </td>
                                        <td v-if="actions.length > 0" class="actions-cell">
                                            <!-- Actions pour les lignes imbriquées si nécessaire -->
                                        </td>
                                    </tr>
                                </template>
                            </NestedDataExpander>

                            <!-- Affichage normal pour les colonnes sans données imbriquées -->
                            <EditableCell
                                v-else
                                :value="row[col.field]"
                                :column="col"
                                :row="row"
                                :isEditing="isEditingCell(row.id || row.reference || rowIndex, col.field)"
                                @start-edit="startEditCell(row.id || row.reference || rowIndex, col.field)"
                                @save-edit="saveEditCell"
                                @cancel-edit="cancelEditCell" />
                        </td>
                        <td v-if="actions.length > 0" class="actions-cell">
                            <ActionMenu :actions="actions" :row="row" />
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import ActionMenu from './ActionMenu.vue'
import NestedDataExpander from './NestedDataExpander.vue'
import FilterDropdown from './FilterDropdown.vue'
import EditableCell from './EditableCell.vue'
import { cellRenderersService } from '@/services/cellRenderers'
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import IconSortBoth from '../icon/icon-sort-both.vue'
import IconSortAsc from '../icon/icon-sort-asc.vue'
import IconSortDesc from '../icon/icon-sort-desc.vue'
import IconFilter from '../icon/icon-filter.vue'

interface Props {
    columns: any[]
    paginatedData: any[]
    actions: any[]
    loading?: boolean
    skeletonRowsCount?: number
    currentSortField?: string
    currentSortDirection?: 'asc' | 'desc'
    rowSelection?: boolean
    selectedRows?: Set<string>
    inlineEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    skeletonRowsCount: 10,
    currentSortField: '',
    currentSortDirection: 'asc',
    rowSelection: false,
    selectedRows: () => new Set<string>(),
    inlineEditing: false
})

// État pour les lignes expandées
const expandedRows = ref(new Set<string>())

// États pour le tri et le filtrage (utiliser les props comme source de vérité)
const currentSortField = computed(() => props.currentSortField)
const currentSortDirection = computed(() => props.currentSortDirection)
const showFilter = ref<string>('')
const activeFilters = ref<Record<string, any>>({})

// État pour la sélection de ligne
const selectedRows = ref<Set<string>>(props.selectedRows)
const selectAll = ref(false)

// État pour l'édition de cellule
const editingCell = ref<{ rowId: string; field: string } | null>(null)
const editingValue = ref<any>(null)

// Fonction pour vérifier si une cellule est en cours d'édition
const isEditingCell = (rowId: string | number, field: string): boolean => {
    const normalizedId = String(rowId)
    return editingCell.value?.rowId === normalizedId && editingCell.value?.field === field
}

// Fonction pour démarrer l'édition d'une cellule
const startEditCell = (rowId: string | number, field: string) => {
    if (!props.inlineEditing) return

    const normalizedId = String(rowId)
    // Utiliser rowIndex pour la recherche au lieu de r.index
    const row = props.paginatedData.find((r, index) => {
        const rowIdentifier = String(r.id || r.reference || index)
        return rowIdentifier === normalizedId
    })
    if (!row) {
        console.error('❌ Ligne non trouvée pour l\'édition:', {
            rowId: normalizedId,
            field,
            availableIds: props.paginatedData.map((r, i) => String(r.id || r.reference || i))
        })
        return
    }

    editingCell.value = { rowId: normalizedId, field }
    editingValue.value = row[field]

    console.log('🔄 Début édition cellule:', {
        rowId: normalizedId,
        field,
        value: editingValue.value,
        foundRow: row
    })
}

// Fonction pour sauvegarder l'édition d'une cellule
const saveEditCell = (newValue: any) => {
    if (!editingCell.value) return

    const { rowId, field } = editingCell.value
    // Utiliser rowIndex pour la recherche au lieu de r.index
    const row = props.paginatedData.find((r, index) => {
        const rowIdentifier = String(r.id || r.reference || index)
        return rowIdentifier === rowId
    })
    if (!row) {
        console.error('❌ Ligne non trouvée pour la sauvegarde:', {
            rowId,
            field,
            availableIds: props.paginatedData.map((r, i) => String(r.id || r.reference || i))
        })
        return
    }

    const oldValue = row[field]
    row[field] = newValue

    // Émettre l'événement de changement de valeur
    emit('cell-value-changed', {
        data: row,
        field,
        newValue,
        oldValue
    })

    // Arrêter l'édition
    editingCell.value = null
    editingValue.value = null

    console.log('💾 Sauvegarde édition cellule:', {
        rowId,
        field,
        oldValue,
        newValue,
        foundRow: row
    })
}

// Fonction pour annuler l'édition d'une cellule
const cancelEditCell = () => {
    editingCell.value = null
    editingValue.value = null
    console.log('❌ Annulation édition cellule')
}

// Fonction pour vérifier si une ligne est sélectionnée
const isRowSelected = (rowId: string | number): boolean => {
    const normalizedId = String(rowId)
    return selectedRows.value.has(normalizedId)
}

// Fonction pour basculer la sélection d'une ligne
const toggleRowSelection = (rowId: string | number) => {
    const normalizedId = String(rowId)
    if (selectedRows.value.has(normalizedId)) {
        selectedRows.value.delete(normalizedId)
    } else {
        selectedRows.value.add(normalizedId)
    }

    // Mettre à jour l'état "sélectionner tout"
    updateSelectAllState()

    // Émettre l'événement de changement de sélection
    emit('selection-changed', new Set(selectedRows.value))

    console.log('Selected rows:', Array.from(selectedRows.value))
}

// Fonction pour mettre à jour l'état "sélectionner tout"
const updateSelectAllState = () => {
    const allRowIds = props.paginatedData.map((row, index) => String(row.id || row.reference || index))

    // Si pas de données, selectAll doit être false
    if (allRowIds.length === 0) {
        selectAll.value = false
        return
    }

    // Vérifier si toutes les lignes sont sélectionnées
    selectAll.value = allRowIds.every(id => selectedRows.value.has(id))

    console.log('Update select all state:', {
        totalRows: allRowIds.length,
        selectedRows: selectedRows.value.size,
        selectAll: selectAll.value
    })
}

// Fonction pour basculer la sélection de toutes les lignes
const toggleAllSelection = () => {
    const allRowIds = props.paginatedData.map((row, index) => String(row.id || row.reference || index))

    // Vérifier si toutes les lignes sont actuellement sélectionnées
    const allSelected = allRowIds.length > 0 && allRowIds.every(id => selectedRows.value.has(id))

    if (allSelected) {
        // Si toutes sont sélectionnées, les désélectionner toutes
        selectedRows.value.clear()
    } else {
        // Sinon, sélectionner toutes les lignes
        allRowIds.forEach(id => selectedRows.value.add(id))
    }

    // Mettre à jour l'état "sélectionner tout"
    updateSelectAllState()

    // Émettre l'événement de changement de sélection
    emit('selection-changed', new Set(selectedRows.value))

    console.log('Toggle all selection:', {
        allSelected,
        newState: !allSelected,
        selectedRows: Array.from(selectedRows.value)
    })
}

// Fonction pour vider toutes les sélections
const clearAllSelections = () => {
    selectedRows.value.clear()
    selectAll.value = false

    // Forcer la mise à jour visuelle
    nextTick(() => {
        // Émettre l'événement de changement de sélection
        emit('selection-changed', new Set(selectedRows.value))

        console.log('All selections cleared from DataTableBody')
    })
}

// Fonction pour gérer le tri
const handleSort = (field: string) => {
    let newDirection: 'asc' | 'desc' = 'asc'
    let isActive = true

    if (currentSortField.value === field) {
        // Cycle: asc -> desc -> neutre (pas de tri)
        if (currentSortDirection.value === 'asc') {
            newDirection = 'desc'
        } else {
            // Retour à l'état neutre (pas de tri)
            isActive = false
        }
    } else {
        // Nouveau champ, commencer par ascendant
        newDirection = 'asc'
    }

    console.log('🔍 Tri:', {
        field,
        direction: newDirection,
        isActive
    })

    // Émettre l'événement de tri vers le parent
    emit('sort-changed', {
        field,
        direction: newDirection,
        isActive
    })
}

// Fonction pour obtenir le tooltip de tri
const getSortTooltip = (field: string): string => {
    if (currentSortField.value !== field) return 'Trier par ordre croissant'
    if (currentSortDirection.value === 'asc') return 'Trier par ordre décroissant'
    return 'Annuler le tri'
}

// Fonction pour basculer le filtre
const toggleFilter = (field: string) => {
    if (showFilter.value === field) {
        showFilter.value = ''
    } else {
        showFilter.value = field
    }
}

// Fonction pour appliquer un filtre
const applyFilter = (filter: any) => {
    activeFilters.value[filter.field] = filter
    showFilter.value = ''
    console.log('🔍 Filtre appliqué:', filter)

    // Émettre l'événement de filtre vers le parent
    emit('filter-changed', activeFilters.value)
}

// Fonction pour effacer un filtre
const clearFilter = (field: string) => {
    delete activeFilters.value[field]
    console.log('🔍 Filtre effacé:', field)

    // Émettre l'événement de filtre vers le parent
    emit('filter-changed', activeFilters.value)
}

// Fonction pour fermer un filtre
const closeFilter = (field: string) => {
    showFilter.value = ''
}

// Fonction pour rendre une cellule avec le renderer approprié
const renderCell = (value: any, column: any, row: any) => {
    const renderer = cellRenderersService.getRenderer(column)

    if (renderer) {
        return renderer(value, column, row)
    }

    // Fallback : affichage simple
    if (value === null || value === undefined) return '-'
    return String(value)
}

// Fonction pour vérifier si le contenu contient du HTML
const containsHTML = (content: string): boolean => {
    return content.includes('<') && content.includes('>')
}

// Fonction pour vérifier si une ligne est expandée
const isRowExpanded = (rowId: string | number): boolean => {
    const normalizedId = String(rowId)
    return expandedRows.value.has(normalizedId)
}

// Fonction pour basculer l'expansion d'une ligne
const toggleExpansion = (rowId: string | number): void => {
    const normalizedId = String(rowId)
    if (expandedRows.value.has(normalizedId)) {
        expandedRows.value.delete(normalizedId)
    } else {
        expandedRows.value.add(normalizedId)
    }
    console.log('Expanded rows:', Array.from(expandedRows.value))
}

// Fonction pour vérifier si une cellule a des données imbriquées
const hasNestedData = (value: any, column: any): boolean => {
    if (!value) return false
    const config = column.nestedData
    if (!config) return false

    if (Array.isArray(value)) {
        return value.length > 0
    }

    if (typeof value === 'object' && value !== null) {
        const key = config.key
        const items = value[key]
        return Array.isArray(items) && items.length > 0
    }

    return false
}

// Fonction pour afficher un élément imbriqué
const getNestedItemDisplay = (item: any, column: any): string => {
    const config = column.nestedData
    if (!config) return String(item)

    const displayKey = config.displayKey || config.key
    if (typeof item === 'object' && item !== null) {
        return String(item[displayKey] || item[config.key] || item)
    }

    return String(item)
}

// Définir les émissions
const emit = defineEmits<{
    'sort-changed': [sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }]
    'filter-changed': [filters: Record<string, any>]
    'selection-changed': [selectedRows: Set<string>]
    'clear-selections': []
    'cell-value-changed': [event: { data: any; field: string; newValue: any; oldValue: any }]
}>()

// Exposer la méthode clearAllSelections
defineExpose({
    clearAllSelections
})

// Appeler la fonction au montage
onMounted(() => {
    // Debug: afficher les IDs des lignes
    console.log('🔍 PaginatedData:', props.paginatedData.map((row, index) => ({
        index,
        rowId: row.id,
        rowRef: row.reference,
        row
    })))

    // Initialiser l'état de sélection
    updateSelectAllState()
})

// Watcher pour synchroniser l'état de sélection avec les props
watch(() => props.selectedRows, (newSelectedRows) => {
    selectedRows.value = new Set(newSelectedRows)
    updateSelectAllState()
}, { deep: true, immediate: true })

// Watcher pour forcer la mise à jour quand les props selectedRows sont vidées
watch(() => props.selectedRows.size, (newSize) => {
    if (newSize === 0) {
        selectedRows.value.clear()
        selectAll.value = false
        console.log('Forced clear of selections in DataTableBody')
    }
}, { immediate: true })

// Watcher pour mettre à jour l'état "sélectionner tout" quand les données changent
watch(() => props.paginatedData, () => {
    updateSelectAllState()
}, { deep: true })
</script>

<style scoped>
.table-container {
    overflow-x: auto;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    background-color: #ffffff;
}

.dark .table-container {
    background-color: #1a202c;
    border-color: #4a5568;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

th,
td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    text-align: left;
}

.dark th,
.dark td {
    border-color: #4a5568;
}

th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #374151;
}

.dark th {
    background-color: #2d3748;
    color: #f7fafc;
}

.no-data {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 2rem;
}

.dark .no-data {
    color: #a0aec0;
}

tbody tr:hover {
    background-color: #f9fafb;
}

.dark tbody tr:hover {
    background-color: #2d3748;
}

/* Styles pour les actions */
.actions-header {
    width: 120px;
    text-align: center;
}

.actions-cell {
    text-align: center;
    padding: 0.5rem;
    width: 120px;
}

/* Styles pour les cellules de données */
.data-cell {
    position: relative;
}

.data-cell:hover {
    background-color: #f8fafc;
}

.dark .data-cell:hover {
    background-color: #2d3748;
}

/* Skeleton styles */
.table-skeleton {
    width: 100%;
}

.skeleton-header-row {
    display: flex;
    background-color: #f9fafb;
    border-bottom: 1px solid #f3f4f6;
}

.dark .skeleton-header-row {
    background-color: #2d3748;
    border-color: #4a5568;
}

.skeleton-header-cell {
    flex: 1;
    padding: 0.75rem;
    min-width: 120px;
}

.skeleton-header-cell::before {
    content: '';
    display: block;
    height: 1rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-header-cell::before {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-actions-header {
    flex: 0 0 120px;
    min-width: 120px;
}

.skeleton-data-row {
    display: flex;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;
}

.dark .skeleton-data-row {
    border-color: #4a5568;
}

.skeleton-data-row:hover {
    background-color: #f9fafb;
}

.dark .skeleton-data-row:hover {
    background-color: #374151;
}

.skeleton-data-cell {
    flex: 1;
    padding: 0.75rem;
    min-width: 120px;
    display: flex;
    align-items: center;
}

.skeleton-text {
    height: 1rem;
    width: 80%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-text {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-actions-cell {
    flex: 0 0 120px;
    min-width: 120px;
}

.skeleton-action-button {
    height: 1rem;
    width: 60%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-action-button {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}

/* Styles pour les contrôles d'en-tête */
.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.header-title {
    font-weight: 600;
    color: #374151;
    flex: 1;
}

.dark .header-title {
    color: #f7fafc;
}

.header-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.sort-btn,
.filter-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
}

.sort-btn:hover,
.filter-btn:hover {
    background-color: #f3f4f6;
    color: #374151;
}

.dark .sort-btn:hover,
.dark .filter-btn:hover {
    background-color: #4a5568;
    color: #f7fafc;
}

.sort-btn.active,
.filter-btn.active {
    background-color: #e5e7eb;
    color: #374151;
}

.dark .sort-btn.active,
.dark .filter-btn.active {
    background-color: #4a5568;
    color: #f7fafc;
}

/* Styles pour la sélection */
.selection-header,
.selection-cell {
    width: 40px;
    text-align: center;
    padding: 0.5rem;
}

.select-all-checkbox-input {
    width: 1rem;
    height: 1rem;
    accent-color: #FECD1C;
}

/* Styles pour les lignes imbriquées */
.nested-row {
    background-color: #f8fafc;
}

.dark .nested-row {
    background-color: #2d3748;
}

.nested-cell {
    padding-left: 2rem;
}

.nested-item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.nested-indicator {
    color: #6b7280;
    font-weight: 600;
}

.nested-empty {
    color: #9ca3af;
    font-style: italic;
}

/* Styles pour les filtres */
.filter-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 50;
    padding: 0.75rem;
}

.dark .filter-dropdown {
    background: #1a202c;
    border-color: #4a5568;
}
</style>
