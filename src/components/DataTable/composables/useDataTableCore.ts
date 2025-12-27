/**
 * Composable core pour DataTable (SOLID - Single Responsibility)
 * 
 * Responsabilité unique : Gestion de l'état de base de la table
 * - Colonnes et visibilité uniquement
 * - État de chargement
 * 
 * Note : La sélection est gérée par `useDataTableSelection` pour éviter la duplication.
 * 
 * @module useDataTableCore
 * 
 * @example
 * ```typescript
 * const core = useDataTableCore({
 *   columns: myColumns,
 *   rowSelection: true
 * })
 * 
 * // Utiliser pour gérer les colonnes
 * core.updateColumns(newColumns)
 * core.toggleColumnVisibility('fieldName')
 * 
 * // Utiliser pour l'état de chargement
 * core.setLoading(true)
 * ```
 */

import { ref, computed } from 'vue'
import type { DataTableColumn } from '../types/dataTable'

/**
 * Options pour useDataTableCore
 */
export interface UseDataTableCoreOptions {
    /** Colonnes de la table */
    columns: DataTableColumn[]
    /** Activer la sélection de lignes (informational, la sélection est gérée par useDataTableSelection) */
    rowSelection?: boolean
}

/**
 * Composable core pour la gestion de base d'une DataTable
 * 
 * Gère uniquement :
 * - L'état des colonnes et leur visibilité
 * - L'état de chargement
 * 
 * La sélection est déléguée à `useDataTableSelection` pour éviter la duplication.
 * 
 * @param options - Configuration du composable
 * @returns État et méthodes pour gérer les colonnes et le chargement
 */
export function useDataTableCore(options: UseDataTableCoreOptions) {
    const { columns: initialColumns } = options

    // ===== COLONNES =====
    const columns = ref<DataTableColumn[]>(initialColumns)
    
    /**
     * Colonnes visibles (filtre selon hide et visible)
     */
    const visibleColumns = computed(() => {
        return columns.value
            .filter(col => {
                if (col.hide === true) return false
                if (col.visible === false) return false
                return true
            })
            .map(col => col.field)
    })

    // ===== CHARGEMENT =====
    const loading = ref(false)
    
    /**
     * Met à jour l'état de chargement
     * 
     * @param value - Nouvel état de chargement
     */
    const setLoading = (value: boolean) => {
        loading.value = value
    }

    // ===== MÉTHODES DE COLONNES =====
    
    /**
     * Met à jour les colonnes
     * 
     * @param newColumns - Nouvelles colonnes
     */
    const updateColumns = (newColumns: DataTableColumn[]) => {
        columns.value = newColumns
    }

    /**
     * Bascule la visibilité d'une colonne
     * 
     * @param field - Nom du champ de la colonne
     */
    const toggleColumnVisibility = (field: string) => {
        const column = columns.value.find(col => col.field === field)
        if (column) {
            column.visible = !column.visible
        }
    }

    return {
        // État
        /** Colonnes de la table */
        columns: computed(() => columns.value),
        /** Colonnes visibles (filtre selon hide et visible) */
        visibleColumns,
        /** État de chargement */
        loading: computed(() => loading.value),

        // Actions
        /** Met à jour l'état de chargement */
        setLoading,
        /** Met à jour les colonnes */
        updateColumns,
        /** Bascule la visibilité d'une colonne */
        toggleColumnVisibility
    }
}

