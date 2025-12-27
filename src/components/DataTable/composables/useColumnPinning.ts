/**
 * Composable pour gérer l'épinglage de colonnes
 * Permet d'épingler des colonnes à gauche ou à droite
 */

import { ref, computed, type Ref } from 'vue'
import type { DataTableColumn } from '@/components/DataTable/types/dataTable'

export type PinDirection = 'left' | 'right' | null

export interface ColumnPinState {
  field: string
  pinned: PinDirection
}

export interface ColumnPinningConfig {
  /** Colonnes épinglées par défaut */
  defaultPinnedColumns?: ColumnPinState[]
  /** Activer l'épinglage */
  enabled?: boolean
}

/**
 * Composable pour gérer l'épinglage de colonnes
 */
export function useColumnPinning(
  columns: Ref<DataTableColumn[]>,
  config: ColumnPinningConfig = {}
) {
  const { defaultPinnedColumns = [], enabled = true } = config

  // État des colonnes épinglées
  const pinnedColumns = ref<Map<string, PinDirection>>(
    new Map(defaultPinnedColumns.map(col => [col.field, col.pinned]))
  )

  /**
   * Épingle une colonne
   * @param field - Nom du champ
   * @param direction - Direction de l'épinglage ('left' ou 'right')
   */
  const pinColumn = (field: string, direction: PinDirection) => {
    if (!enabled) return

    if (direction === null) {
      // Désépingler
      pinnedColumns.value.delete(field)
    } else {
      pinnedColumns.value.set(field, direction)
    }
  }

  /**
   * Désépingle une colonne
   */
  const unpinColumn = (field: string) => {
    pinnedColumns.value.delete(field)
  }

  /**
   * Vérifie si une colonne est épinglée
   */
  const isPinned = (field: string): boolean => {
    return pinnedColumns.value.has(field)
  }

  /**
   * Obtient la direction d'épinglage d'une colonne
   */
  const getPinDirection = (field: string): PinDirection => {
    return pinnedColumns.value.get(field) || null
  }

  /**
   * Colonnes épinglées à gauche
   */
  const leftPinnedColumns = computed(() => {
    return columns.value.filter(col => 
      pinnedColumns.value.get(col.field) === 'left'
    )
  })

  /**
   * Colonnes épinglées à droite
   */
  const rightPinnedColumns = computed(() => {
    return columns.value.filter(col => 
      pinnedColumns.value.get(col.field) === 'right'
    )
  })

  /**
   * Colonnes non épinglées (au centre)
   */
  const unpinnedColumns = computed(() => {
    return columns.value.filter(col => 
      !pinnedColumns.value.has(col.field)
    )
  })

  /**
   * Colonnes ordonnées : gauche -> centre -> droite
   */
  const orderedColumns = computed(() => {
    const left = leftPinnedColumns.value
    const center = unpinnedColumns.value
    const right = rightPinnedColumns.value

    return [...left, ...center, ...right]
  })

  /**
   * Réinitialise tous les épinglages
   */
  const clearAllPins = () => {
    pinnedColumns.value.clear()
  }

  return {
    // État
    pinnedColumns: computed(() => pinnedColumns.value),
    leftPinnedColumns,
    rightPinnedColumns,
    unpinnedColumns,
    orderedColumns,
    
    // Méthodes
    pinColumn,
    unpinColumn,
    isPinned,
    getPinDirection,
    clearAllPins
  }
}

