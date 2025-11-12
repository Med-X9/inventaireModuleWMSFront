<template>
    <!--
        Corps de la DataTable avec gestion complète des données
        Inclut le skeleton loader, la table principale, les contrôles d'en-tête
        et la gestion des actions par ligne
    -->
    <div class="table-container">
        <!-- Skeleton loader pendant le chargement -->
        <div v-if="loading" class="table-skeleton">
            <!-- Header skeleton avec animation de shimmer -->
            <div class="skeleton-header-row">
                <div v-for="col in columns" :key="`header-${col.field}`" class="skeleton-header-cell"></div>
                <div v-if="actions.length > 0" class="skeleton-header-cell skeleton-actions-header"></div>
            </div>

            <!-- Data rows skeleton avec nombre configurable de lignes -->
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
                    <!-- Colonne de sélection multiple si activée -->
                    <th v-if="rowSelection" class="selection-header">
                        <input type="checkbox" :checked="selectAllState === 'all'" @change="toggleAllSelection"
                            class="select-all-checkbox-input" />
                    </th>
                    <!-- En-têtes de colonnes avec contrôles de tri et filtrage -->
                    <th v-for="col in columns" :key="col.field" class="column-header">
                        <div class="header-content">
                            <span class="header-title">{{ col.headerName || col.field }}</span>

                            <!-- Contrôles de tri et filtrage dans l'en-tête -->
                            <div class="header-controls">
                                <!-- Bouton de tri avec icônes à trois états -->
                                <button v-if="col.sortable !== false" @click="handleSort(col.field)" class="sort-btn"
                                    :class="{
                                        'active': currentSortField === col.field,
                                        'sort-asc': currentSortField === col.field && currentSortDirection === 'asc',
                                        'sort-desc': currentSortField === col.field && currentSortDirection === 'desc'
                                    }" :title="getSortTooltip(col.field)">

                                    <IconSortBoth v-if="currentSortField !== col.field" class="w-3 h-3" />
                                    <!-- Icône ascendant -->
                                    <IconSortAsc v-else-if="currentSortDirection === 'asc'" class="w-3 h-3" />
                                    <!-- Icône descendant -->
                                    <IconSortDesc v-else class="w-3 h-3" />
                                </button>

                                <!-- Bouton de filtre avec dropdown -->
                                <button v-if="col.filterable !== false" @click="toggleFilter(col.field)"
                                    class="filter-btn" :class="{ 'active': showFilter === col.field }" title="Filtrer">
                                    <IconFilter class="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <!-- Filtre inline avec positionnement relatif -->
                        <div v-if="showFilter === col.field" class="filter-dropdown-container">
                            <FilterDropdown :column="col"
                                :isVisible="showFilter === col.field" :currentFilter="activeFilters[col.field]"
                                @apply="applyFilter" @clear="() => clearFilter(col.field)"
                                @close="() => closeFilter(col.field)" />
                        </div>
                    </th>
                    <!-- En-tête des actions -->
                    <th v-if="actions.length > 0" class="actions-header">Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Message si aucune donnée -->
                <tr v-if="paginatedData.length === 0">
                    <td :colspan="columns.length + (actions.length > 0 ? 1 : 0)" class="no-data">
                        Aucune donnée à afficher
                    </td>
                </tr>
                <!-- Lignes de données avec gestion des actions -->
                <template v-else v-for="(row, rowIndex) in paginatedData" :key="getRowId(row, rowIndex)">
                    <!-- Ligne principale -->
                    <tr>
                        <!-- Cellule de sélection -->
                        <td v-if="rowSelection" class="selection-cell">
                            <input type="checkbox" :checked="isRowSelected(getRowId(row, rowIndex))"
                                @change="toggleRowSelection(getRowId(row, rowIndex))" />
                        </td>
                        <!-- Cellules de données avec support des slots personnalisés -->
                        <td v-for="col in columns" :key="col.field" class="data-cell">
                            <!-- Correction pour la colonne de numérotation -->
                            <template v-if="col.field === '__rowNumber__'">
                                <span class="row-number">
                                    {{ globalStartIndex + rowIndex + 1 }}
                                </span>
                            </template>
                            <template v-else>
                                <!-- Rendu conditionnel selon le type de cellule -->
                                <!-- Cellule avec données imbriquées -->
                                <NestedDataCell
                                    v-if="col.nestedData && hasNestedData(row[col.field], col)"
                                    :value="row[col.field]"
                                    :column="col"
                                    :row="row"
                                    :is-expanded="isRowExpanded(getRowId(row, rowIndex))"
                                    @toggle="toggleRowExpansion(getRowId(row, rowIndex))" />

                                <!-- Cellule éditables avancées pour types complexes (select, date, multi-select) -->
                                <AdvancedEditableCell
                                    v-else-if="inlineEditing && col.editable"
                                    :value="row[col.field]"
                                    :column="col"
                                    :row="row"
                                    :is-editing="isEditing(getRowId(row, rowIndex), col.field)"
                                    @start-edit="startEditCell(getRowId(row, rowIndex), col.field)"
                                    @save-edit="saveEditCell($event)"
                                    @cancel-edit="cancelEditCell()" />



                                <!-- Affichage normal -->
                                <span v-else v-html="renderCell(row[col.field], col, row)"></span>
                            </template>
                        </td>
                        <!-- Cellule des actions avec menu déroulant -->
                        <td v-if="actions.length > 0" class="actions-cell">
                            <ActionMenu :actions="actions" :row="row" />
                        </td>
                    </tr>

                    <!-- Lignes de nested tables (affichées seulement si expandées) -->
                    <template v-for="col in columns" :key="`nested-${getRowId(row, rowIndex)}-${col.field}`">
                        <tr v-if="col.nestedData && hasNestedData(row[col.field], col) && isRowExpanded(getRowId(row, rowIndex))" class="nested-table-row">
                            <!-- Cellule de sélection vide pour aligner -->
                            <td v-if="rowSelection" class="nested-selection-cell"></td>

                            <!-- Cellule de nested table qui s'étend sur toutes les colonnes -->
                            <td :colspan="columns.length + (actions.length > 0 ? 1 : 0)" class="nested-table-cell">
                                <div class="nested-table-container">
                                    <!-- En-tête de la nested table -->
                                    <div class="nested-table-header">
                                        <h4 class="nested-table-title">{{ col.nestedData.title || `${col.headerName || col.field} - Détails` }}</h4>
                                        <span class="nested-table-count">{{ getNestedItems(row[col.field], col).length }} éléments</span>
                                    </div>

                                    <!-- Contenu de la nested table -->
                                    <div class="nested-table-content">
                                        <table class="nested-table">
                                            <thead>
                                                <tr>
                                                    <th v-for="nestedCol in col.nestedData.columns || []" :key="nestedCol.field" class="nested-table-header-cell">
                                                        {{ nestedCol.headerName || nestedCol.field }}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(item, index) in getNestedItems(row[col.field], col)" :key="`nested-item-${index}`" class="nested-table-data-row">
                                                    <td v-for="nestedCol in col.nestedData.columns || []" :key="nestedCol.field" class="nested-table-data-cell">
                                                        <span v-html="renderNestedCell(item[nestedCol.field], nestedCol, item)"></span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </template>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import ActionMenu from './ActionMenu.vue'
import NestedDataExpander from './cells/NestedDataExpander.vue'
import NestedDataCell from './cells/NestedDataCell.vue'
import SafeEditableCell from './cells/SafeEditableCell.vue'
import AdvancedEditableCell from './cells/AdvancedEditableCell.vue'
import FilterDropdown from './filters/FilterDropdown.vue'
import { cellRenderersService } from '@/services/cellRenderers'
import { logger } from '@/services/loggerService'
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import IconSortBoth from '../icon/icon-sort-both.vue'
import IconSortAsc from '../icon/icon-sort-asc.vue'
import IconSortDesc from '../icon/icon-sort-desc.vue'
import IconFilter from '../icon/icon-filter.vue'

/**
 * Interface des props du composant DataTableBody
 * Définit toutes les propriétés nécessaires pour le fonctionnement
 */
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
    // Ajout des props pour la pagination :
    currentPage: number
    pageSize: number
    // Ajout de la prop pour l'indexation globale
    globalStartIndex: number
}

/**
 * Props avec valeurs par défaut
 */
const props = withDefaults(defineProps<Props>(), {
    loading: false,
    skeletonRowsCount: 10,
    currentSortField: '',
    currentSortDirection: 'asc',
    rowSelection: false,
    selectedRows: () => new Set<string>(),
    inlineEditing: false,
    // Ajout des props pour la pagination :
    currentPage: 1,
    pageSize: 10,
    // Ajout de la prop pour l'indexation globale
    globalStartIndex: 0
})


// ===== ÉTAT LOCAL =====

/**
 * État d'édition d'une cellule
 */
const editingCell = ref<{ rowId: string; field: string } | null>(null)

/**
 * Valeur en cours d'édition
 */
const editingValue = ref<any>(null)

/**
 * État d'expansion des lignes avec données imbriquées
 */
const expandedRows = ref<Set<string>>(new Set())

/**
 * État de sélection des lignes
 */
const selectedRows = ref<Set<string>>(new Set())

// Obtient tous les IDs de lignes pour la sélection multiple
const allRowIds = computed(() => {
    return props.paginatedData.map((row, index) => getRowId(row, index))
})

// État de sélection "tout sélectionner"
const selectAllState = ref<'all' | 'partial' | 'none'>('none')

// États pour le tri et le filtrage (utiliser les props comme source de vérité)
const currentSortField = computed(() => props.currentSortField)
const currentSortDirection = computed(() => props.currentSortDirection)

/**
 * Champ actuellement en cours de filtrage
 */
const showFilter = ref<string>('')

/**
 * Filtres actifs par champ
 */
const activeFilters = ref<Record<string, any>>({})

// ===== MÉTHODES D'ÉDITION DE CELLULE =====

/**
 * Vérifie si une cellule est en cours d'édition
 *
 * @param rowId - ID de la ligne
 * @param field - Champ de la cellule
 * @returns true si la cellule est en cours d'édition
 */
const isEditing = (rowId: string, field: string): boolean => {
    return editingCell.value?.rowId === rowId && editingCell.value?.field === field
}

/**
 * Démarre l'édition d'une cellule
 *
 * @param rowId - ID de la ligne
 * @param field - Champ de la cellule
 */
const startEditCell = (rowId: string, field: string) => {
    if (!props.inlineEditing) {
        return
    }

    const normalizedId = String(rowId)
    const row = props.paginatedData.find((r, index) => {
        const rowIdentifier = String(r.id || r.reference || index)
        return rowIdentifier === normalizedId
    })

    if (!row) {
        logger.error('Ligne non trouvée pour l\'édition', {
            rowId: normalizedId,
            field,
            availableIds: props.paginatedData.map((r, i) => String(r.id || r.reference || i))
        })
        return
    }

    // Empêcher l'édition des lignes enfants (nested data)
    if (row.isChild) {
        logger.warn('Édition non autorisée pour les lignes enfants', { rowId: normalizedId, field })
        return
    }

    editingCell.value = { rowId: normalizedId, field }
    editingValue.value = row[field]
}

/**
 * Sauvegarde l'édition d'une cellule
 *
 * @param newValue - Nouvelle valeur
 */
const saveEditCell = (newValue: any) => {
    if (!editingCell.value) return

    const { rowId, field } = editingCell.value
    const row = props.paginatedData.find((r, index) => {
        const rowIdentifier = String(r.id || r.reference || index)
        return rowId === rowIdentifier
    })

    if (!row) {
        logger.error('Ligne non trouvée pour la sauvegarde', {
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
}

/**
 * Annule l'édition d'une cellule
 */
const cancelEditCell = () => {
    editingCell.value = null
    editingValue.value = null
}

// ===== MÉTHODES DE SÉLECTION =====

/**
 * Vérifie si une ligne est sélectionnée
 *
 * @param rowId - ID de la ligne
 * @returns true si la ligne est sélectionnée
 */
const isRowSelected = (rowId: string | number): boolean => {
    const normalizedId = String(rowId)
    return selectedRows.value.has(normalizedId)
}

/**
 * Bascule la sélection d'une ligne
 *
 * @param rowId - ID de la ligne
 */
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
}

/**
 * Met à jour l'état "sélectionner tout"
 * Calcule si toutes les lignes sont sélectionnées
 */
const updateSelectAllState = () => {
    const selectedCount = props.selectedRows.size
    const totalCount = allRowIds.value.length

    if (selectedCount === 0) {
        selectAllState.value = 'none'
    } else if (selectedCount === totalCount) {
        selectAllState.value = 'all'
    } else {
        selectAllState.value = 'partial'
    }
}

/**
 * Bascule la sélection de toutes les lignes
 */
const toggleAllSelection = () => {
    // Vérifier si toutes les lignes sont actuellement sélectionnées
    const allSelected = allRowIds.value.length > 0 && allRowIds.value.every(id => selectedRows.value.has(id))

    if (allSelected) {
        // Si toutes sont sélectionnées, les désélectionner toutes
        selectedRows.value.clear()
        selectAllState.value = 'none'
    } else {
        // Sinon, sélectionner toutes les lignes
        allRowIds.value.forEach(id => selectedRows.value.add(id))
        selectAllState.value = 'all'
    }

    // Mettre à jour l'état "sélectionner tout"
    updateSelectAllState()

    // Émettre l'événement de changement de sélection
    emit('selection-changed', new Set(selectedRows.value))
}

/**
 * Vide toutes les sélections
 */
const clearAllSelections = () => {
    selectedRows.value.clear()
    selectAllState.value = 'none'

    // Forcer la mise à jour visuelle
    nextTick(() => {
        // Émettre l'événement de changement de sélection
        emit('selection-changed', new Set(selectedRows.value))
    })
}

// ===== MÉTHODES DE TRI =====

/**
 * Gère le tri d'une colonne
 * Cycle: asc -> desc -> neutre (pas de tri)
 *
 * @param field - Champ à trier
 */
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

    // Émettre l'événement de tri vers le parent
    emit('sort-changed', {
        field,
        direction: newDirection,
        isActive
    })
}

/**
 * Retourne le tooltip de tri approprié
 *
 * @param field - Champ de la colonne
 * @returns Texte du tooltip
 */
const getSortTooltip = (field: string): string => {
    if (currentSortField.value !== field) return 'Trier par ordre croissant'
    if (currentSortDirection.value === 'asc') return 'Trier par ordre décroissant'
    return 'Annuler le tri'
}

// ===== MÉTHODES DE FILTRAGE =====

/**
 * Bascule l'affichage du filtre pour une colonne
 *
 * @param field - Champ de la colonne
 */
const toggleFilter = (field: string) => {
    if (showFilter.value === field) {
        showFilter.value = ''
    } else {
        showFilter.value = field
    }
}

/**
 * Applique un filtre reçu du composant FilterDropdown
 *
 * @param filter - Configuration du filtre
 */
const applyFilter = (filter: any) => {
    // S'assurer que le filtre a la bonne structure
    if (filter && filter.field) {
        activeFilters.value[filter.field] = filter
        showFilter.value = ''

        // Émettre l'événement de filtre vers le parent
        emit('filter-changed', activeFilters.value)
    } else {
        logger.error('Format de filtre invalide', filter)
    }
}

/**
 * Efface un filtre pour un champ spécifique
 *
 * @param field - Champ du filtre à effacer
 */
const clearFilter = (field: string) => {
    delete activeFilters.value[field]

    // Émettre l'événement de filtre vers le parent
    emit('filter-changed', activeFilters.value)
}

/**
 * Ferme le dropdown de filtre pour un champ
 *
 * @param field - Champ du filtre à fermer
 */
const closeFilter = (field: string) => {
    showFilter.value = ''
}

// ===== MÉTHODES DE RENDU =====

/**
 * Rend une cellule avec le renderer approprié
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @param row - Données de la ligne
 * @returns Contenu rendu de la cellule
 */
const renderCell = (value: any, column: any, row: any) => {
    const renderer = cellRenderersService.getRenderer(column)

    if (renderer) {
        const result = renderer(value, column, row)
        return result
    }

    // Fallback : affichage simple
    if (value === null || value === undefined) return '-'
    return String(value)
}

/**
 * Vérifie si le contenu contient du HTML
 *
 * @param content - Contenu à vérifier
 * @returns true si le contenu contient du HTML
 */
const containsHTML = (content: string): boolean => {
    return content.includes('<') && content.includes('>')
}

// ===== MÉTHODES DE GESTION DES DONNÉES IMBRIQUÉES =====

/**
 * Vérifie si une cellule a des données imbriquées
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @returns true si la cellule a des données imbriquées
 */
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

/**
 * Obtient les éléments imbriqués pour une colonne donnée
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @returns Tableau d'éléments imbriqués
 */
const getNestedItems = (value: any, column: any): any[] => {
    const config = column.nestedData
    if (!config) return []

    const key = config.key
    if (Array.isArray(value)) {
        return value
    }

    if (typeof value === 'object' && value !== null) {
        const items = value[key]
        return Array.isArray(items) ? items : []
    }

    return []
}

/**
 * Rend une cellule imbriquée avec le renderer approprié
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @param row - Données de la ligne
 * @returns Contenu rendu de la cellule
 */
const renderNestedCell = (value: any, column: any, row: any) => {
    const renderer = cellRenderersService.getRenderer(column)

    if (renderer) {
        const result = renderer(value, column, row)
        return result
    }

    // Fallback : affichage simple
    if (value === null || value === undefined) return '-'
    return String(value)
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Obtient l'ID unique d'une ligne
 *
 * @param row - Ligne de données
 * @param rowIndex - Index de la ligne
 * @returns ID unique de la ligne
 */
const getRowId = (row: any, rowIndex: number): string => {
    return row.id || row.reference || row.job || rowIndex.toString()
}

/**
 * Bascule l'expansion d'une ligne
 *
 * @param rowId - ID de la ligne
 */
const toggleRowExpansion = (rowId: string) => {
    if (expandedRows.value.has(rowId)) {
        expandedRows.value.delete(rowId)
    } else {
        expandedRows.value.add(rowId)
    }
}

/**
 * Vérifie si une ligne est expandée
 *
 * @param rowId - ID de la ligne
 * @returns true si la ligne est expandée
 */
const isRowExpanded = (rowId: string): boolean => {
    return expandedRows.value.has(rowId)
}

// ===== MÉTHODES UTILITAIRES =====

/**
 * Formate une date pour l'affichage
 *
 * @param value - Valeur de date
 * @returns Date formatée ou valeur originale
 */
function formatDate(value: any) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('fr-FR');
}

// ===== ÉMISSIONS =====

/**
 * Définit les émissions du composant
 */
const emit = defineEmits<{
    'sort-changed': [sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }]
    'filter-changed': [filters: Record<string, any>]
    'selection-changed': [selectedRows: Set<string>]
    'clear-selections': []
    'cell-value-changed': [event: { data: any; field: string; newValue: any; oldValue: any }]
}>()

// ===== EXPOSITION DE MÉTHODES =====

/**
 * Expose la méthode clearAllSelections pour utilisation externe
 */
defineExpose({
    clearAllSelections
})

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(() => {
    // Initialiser l'état de sélection
    updateSelectAllState()
})

// ===== WATCHERS =====

/**
 * Synchronise l'état de sélection avec les props
 */
watch(() => props.selectedRows, (newSelectedRows) => {
    selectedRows.value = new Set(newSelectedRows)
    updateSelectAllState()
}, { deep: true, immediate: true })

/**
 * Force la mise à jour quand les props selectedRows sont vidées
 */
watch(() => props.selectedRows.size, (newSize) => {
    if (newSize === 0) {
        selectedRows.value.clear()
        selectAllState.value = 'none'
    }
}, { immediate: true })

/**
 * Met à jour l'état "sélectionner tout" quand les données changent
 */
watch(() => props.paginatedData, () => {
    updateSelectAllState()
}, { deep: true })
</script>

<style scoped>
/*
    Styles pour le composant DataTableBody
    Inclut les styles pour la table, le skeleton loader et les contrôles
*/

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

/* Skeleton styles avec animation de shimmer */
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
    position: relative;
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
.filter-dropdown-container {
    position: relative;
    z-index: 1000;
    width: 100%;
}

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
    min-width: 280px;
    max-width: 350px;
    margin-top: 0.25rem;
}

.dark .filter-dropdown {
    background: #1a202c;
    border-color: #4a5568;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

/* Styles pour la colonne de numérotation */
.row-number {
    font-weight: 600;
    color: #374151;
    min-width: 50px; /* Assurer une largeur minimale pour le numéro */
    text-align: center;
}

.dark .row-number {
    color: #f7fafc;
}

/* Styles pour les nested tables */
.nested-table-row {
    background-color: #f8fafc;
}

.dark .nested-table-row {
    background-color: #2d3748;
}

.nested-table-cell {
    padding: 0; /* Supprimer le padding pour que la cellule s'étende */
}

.nested-table-container {
    padding: 0.75rem;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    background-color: #ffffff;
}

.dark .nested-table-container {
    background-color: #1a202c;
    border-color: #4a5568;
}

.nested-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e9ecef;
}

.dark .nested-table-header {
    border-color: #4a5568;
}

.nested-table-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.dark .nested-table-title {
    color: #f7fafc;
}

.nested-table-count {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.dark .nested-table-count {
    color: #a0aec0;
}

.nested-table-content {
    overflow-x: auto;
}

.nested-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.nested-table th,
.nested-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    text-align: left;
}

.dark .nested-table th,
.dark .nested-table td {
    border-color: #4a5568;
}

.nested-table th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #374151;
}

.dark .nested-table th {
    background-color: #2d3748;
    color: #f7fafc;
}

.nested-table-header-cell {
    font-weight: 600;
    color: #374151;
}

.dark .nested-table-header-cell {
    color: #f7fafc;
}

.nested-table-data-row:last-child td {
    border-bottom: none;
}

.nested-table-data-cell {
    padding: 0.5rem 0.75rem;
}

.dark .nested-table-data-cell {
    color: #f7fafc;
}
</style>
