/**
 * Composable pour gérer le tri multi-colonnes
 * Permet de trier par plusieurs colonnes simultanément
 */

import { ref, computed, type Ref } from 'vue'

export interface SortModelItem {
    field: string
    direction: 'asc' | 'desc'
    priority?: number // Ordre de priorité du tri (1 = premier tri)
}

export interface MultiSortConfig {
    /** Nombre maximum de colonnes triables simultanément */
    maxSortColumns?: number
    /** Activer le tri multi-colonnes */
    enabled?: boolean
}

/**
 * Composable pour gérer le tri multi-colonnes
 */
export function useMultiSort(
    initialSortModel: SortModelItem[] = [],
    config: MultiSortConfig = {}
) {
    const { maxSortColumns = 3, enabled = true } = config

    // Modèle de tri (liste des colonnes triées)
    const sortModel = ref<SortModelItem[]>(initialSortModel)

    /**
     * Ajoute ou met à jour le tri d'une colonne
     * @param field - Nom du champ à trier
     * @param direction - Direction du tri
     */
    const addSort = (field: string, direction: 'asc' | 'desc' = 'asc') => {
        if (!enabled) {
            // Mode simple : un seul tri
            sortModel.value = [{ field, direction }]
            return
        }

        // Chercher si la colonne est déjà dans le modèle
        const existingIndex = sortModel.value.findIndex(item => item.field === field)

        if (existingIndex >= 0) {
            // Colonne déjà triée : changer la direction ou supprimer
            if (sortModel.value[existingIndex].direction === direction) {
                // Même direction : supprimer le tri
                sortModel.value.splice(existingIndex, 1)
                // Réorganiser les priorités
                updatePriorities()
            } else {
                // Changer la direction
                sortModel.value[existingIndex].direction = direction
            }
        } else {
            // Nouvelle colonne : ajouter si on n'a pas atteint la limite
            if (sortModel.value.length < maxSortColumns) {
                sortModel.value.push({ field, direction, priority: sortModel.value.length + 1 })
            } else {
                // Remplacer le dernier tri
                sortModel.value[maxSortColumns - 1] = { field, direction, priority: maxSortColumns }
            }
            updatePriorities()
        }
    }

    /**
     * Supprime le tri d'une colonne
     */
    const removeSort = (field: string) => {
        const index = sortModel.value.findIndex(item => item.field === field)
        if (index >= 0) {
            sortModel.value.splice(index, 1)
            updatePriorities()
        }
    }

    /**
     * Réinitialise tous les tris
     */
    const clearSort = () => {
        sortModel.value = []
    }

    /**
     * Met à jour les priorités des tris
     */
    const updatePriorities = () => {
        sortModel.value.forEach((item, index) => {
            item.priority = index + 1
        })
    }

    /**
     * Obtient la direction actuelle du tri pour une colonne
     */
    const getSortDirection = (field: string): 'asc' | 'desc' | null => {
        const item = sortModel.value.find(item => item.field === field)
        return item ? item.direction : null
    }

    /**
     * Obtient la priorité du tri pour une colonne
     */
    const getSortPriority = (field: string): number | null => {
        const item = sortModel.value.find(item => item.field === field)
        return item ? item.priority || null : null
    }

    /**
     * Vérifie si une colonne est triée
     */
    const isSorted = (field: string): boolean => {
        return sortModel.value.some(item => item.field === field)
    }

    /**
     * Obtient le modèle de tri formaté pour l'API backend
     */
    const getFormattedSortModel = computed(() => {
        return sortModel.value.map(item => ({
            field: item.field,
            direction: item.direction,
            priority: item.priority
        }))
    })

    /**
     * Obtient le modèle de tri pour DataTables.js
     */
    const getDataTablesSortModel = computed(() => {
        return sortModel.value.map((item, index) => ({
            colId: item.field,
            sort: item.direction
        }))
    })

    /**
     * Toggle le tri d'une colonne (asc -> desc -> aucun)
     */
    const toggleSort = (field: string) => {
        const currentDirection = getSortDirection(field)
        if (currentDirection === 'asc') {
            addSort(field, 'desc')
        } else if (currentDirection === 'desc') {
            removeSort(field)
        } else {
            addSort(field, 'asc')
        }
    }

    return {
        // État
        sortModel: computed(() => sortModel.value),

        // Méthodes
        addSort,
        removeSort,
        clearSort,
        toggleSort,
        getSortDirection,
        getSortPriority,
        isSorted,

        // Modèles formatés
        formattedSortModel: getFormattedSortModel,
        dataTablesSortModel: getDataTablesSortModel
    }
}

