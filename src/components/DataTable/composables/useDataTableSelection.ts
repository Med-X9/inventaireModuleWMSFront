/**
 * Composable pour la sélection des lignes (SOLID - Single Responsibility)
 * 
 * Responsabilité unique : Gestion de la sélection des lignes
 * KISS : Interface simple
 * DRY : Réutilisable partout
 */

import { ref, computed } from 'vue'

export interface UseDataTableSelectionOptions {
    totalRows?: number
}

/**
 * Composable pour gérer la sélection des lignes
 */
export function useDataTableSelection(options: UseDataTableSelectionOptions = {}) {
    const { totalRows = 0 } = options

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
        if (totalRows === 0) return 'none'
        if (selectedRows.value.size === 0) return 'none'
        if (selectedRows.value.size === totalRows) return 'all'
        return 'partial'
    })

    const selectedCount = computed(() => selectedRows.value.size)

    return {
        selectedRows: computed(() => selectedRows.value),
        selectAllState,
        selectedCount,
        toggleRowSelection,
        selectAllRows,
        deselectAllRows,
        isRowSelected,
        clear: deselectAllRows
    }
}

