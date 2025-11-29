/**
 * Composable core pour DataTable (SOLID - Single Responsibility)
 * 
 * Responsabilité unique : Gestion de l'état de base de la table
 * - Colonnes et visibilité
 * - Sélection des lignes
 * - État de chargement
 * 
 * KISS : Interface simple et claire
 * DRY : Pas de duplication avec les autres composables
 */

import { ref, computed, watch } from 'vue'
import type { DataTableColumn } from '../types/dataTable'

export interface UseDataTableCoreOptions {
    columns: DataTableColumn[]
    rowSelection?: boolean
}

/**
 * Composable core pour la gestion de base d'une DataTable
 */
export function useDataTableCore(options: UseDataTableCoreOptions) {
    const { columns: initialColumns, rowSelection = false } = options

    // ===== COLONNES =====
    const columns = ref<DataTableColumn[]>(initialColumns)
    
    const visibleColumns = computed(() => {
        return columns.value
            .filter(col => {
                if (col.hide === true) return false
                if (col.visible === false) return false
                return true
            })
            .map(col => col.field)
    })

    // ===== SÉLECTION =====
    const selectedRows = ref<Set<string>>(new Set())
    
    const toggleRowSelection = (rowId: string) => {
        const newSet = new Set(selectedRows.value)
        if (newSet.has(rowId)) {
            newSet.delete(rowId)
        } else {
            newSet.add(rowId)
        }
        selectedRows.value = newSet
    }

    const selectAllRows = (rowIds: string[]) => {
        selectedRows.value = new Set(rowIds)
    }

    const deselectAllRows = () => {
        selectedRows.value = new Set()
    }

    const isRowSelected = (rowId: string) => {
        return selectedRows.value.has(rowId)
    }

    const selectAllState = computed(() => {
        if (selectedRows.value.size === 0) return 'none'
        // Note: nécessite le nombre total de lignes pour déterminer 'all' vs 'partial'
        return 'partial'
    })

    // ===== CHARGEMENT =====
    const loading = ref(false)
    const setLoading = (value: boolean) => {
        loading.value = value
    }

    // ===== MÉTHODES DE COLONNES =====
    const updateColumns = (newColumns: DataTableColumn[]) => {
        columns.value = newColumns
    }

    const toggleColumnVisibility = (field: string) => {
        const column = columns.value.find(col => col.field === field)
        if (column) {
            column.visible = !column.visible
        }
    }

    return {
        // État
        columns: computed(() => columns.value),
        visibleColumns,
        selectedRows: computed(() => selectedRows.value),
        selectAllState,
        loading: computed(() => loading.value),

        // Actions
        toggleRowSelection,
        selectAllRows,
        deselectAllRows,
        isRowSelected,
        setLoading,
        updateColumns,
        toggleColumnVisibility
    }
}

