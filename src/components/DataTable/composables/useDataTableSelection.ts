/**
 * Composable pour la sélection des lignes (SOLID - Single Responsibility)
 * 
 * Responsabilité unique : Gestion de la sélection des lignes dans le DataTable.
 * 
 * Principes :
 * - KISS : Interface simple et claire
 * - DRY : Réutilisable partout (utilisé par useDataTable, useAutoDataTable, etc.)
 * - Single Source of Truth : Une seule source pour la logique de sélection
 * 
 * @module useDataTableSelection
 * 
 * @example
 * ```typescript
 * const selection = useDataTableSelection({ totalRows: 100 })
 * 
 * // Toggle une ligne
 * selection.toggleRowSelection('row-1')
 * 
 * // Sélectionner toutes les lignes
 * selection.selectAllRows(['row-1', 'row-2', 'row-3'])
 * 
 * // Vérifier l'état de sélection
 * const state = selection.selectAllState // 'none' | 'partial' | 'all'
 * ```
 */

import { ref, computed } from 'vue'

/**
 * Options pour useDataTableSelection
 */
export interface UseDataTableSelectionOptions {
    /** Nombre total de lignes (utilisé pour calculer selectAllState) */
    totalRows?: number
}

/**
 * Composable pour gérer la sélection des lignes dans le DataTable
 * 
 * Fournit une interface unifiée pour gérer la sélection de lignes :
 * - Toggle de sélection individuelle
 * - Sélection/désélection de toutes les lignes
 * - État de sélection (none, partial, all)
 * - Compteur de lignes sélectionnées
 * 
 * @param options - Configuration du composable
 * @param options.totalRows - Nombre total de lignes (optionnel, pour calculer selectAllState)
 * @returns État et méthodes pour gérer la sélection
 */
export function useDataTableSelection(options: UseDataTableSelectionOptions = {}) {
    const { totalRows = 0 } = options

    /** Ensemble des IDs de lignes sélectionnées */
    const selectedRows = ref<Set<string>>(new Set())
    
    /**
     * Bascule la sélection d'une ligne
     * 
     * @param rowId - ID de la ligne à basculer
     */
    const toggleRowSelection = (rowId: string) => {
        const newSet = new Set(selectedRows.value)
        if (newSet.has(rowId)) {
            newSet.delete(rowId)
        } else {
            newSet.add(rowId)
        }
        selectedRows.value = newSet
    }

    /**
     * Sélectionne toutes les lignes fournies
     * 
     * @param rowIds - Tableau des IDs de lignes à sélectionner
     */
    const selectAllRows = (rowIds: string[]) => {
        selectedRows.value = new Set(rowIds)
    }

    /**
     * Désélectionne toutes les lignes
     */
    const deselectAllRows = () => {
        selectedRows.value = new Set()
    }

    /**
     * Vérifie si une ligne est sélectionnée
     * 
     * @param rowId - ID de la ligne à vérifier
     * @returns true si la ligne est sélectionnée, false sinon
     */
    const isRowSelected = (rowId: string) => {
        return selectedRows.value.has(rowId)
    }

    /**
     * État de sélection global
     * 
     * - 'none' : Aucune ligne sélectionnée
     * - 'partial' : Certaines lignes sélectionnées
     * - 'all' : Toutes les lignes sélectionnées
     */
    const selectAllState = computed(() => {
        if (totalRows === 0) return 'none'
        if (selectedRows.value.size === 0) return 'none'
        if (selectedRows.value.size === totalRows) return 'all'
        return 'partial'
    })

    /**
     * Nombre de lignes sélectionnées
     */
    const selectedCount = computed(() => selectedRows.value.size)

    return {
        /** Ensemble des IDs de lignes sélectionnées (computed) */
        selectedRows: computed(() => selectedRows.value),
        /** État de sélection global ('none' | 'partial' | 'all') */
        selectAllState,
        /** Nombre de lignes sélectionnées */
        selectedCount,
        /** Bascule la sélection d'une ligne */
        toggleRowSelection,
        /** Sélectionne toutes les lignes fournies */
        selectAllRows,
        /** Désélectionne toutes les lignes */
        deselectAllRows,
        /** Vérifie si une ligne est sélectionnée */
        isRowSelected,
        /** Alias pour deselectAllRows */
        clear: deselectAllRows
    }
}

