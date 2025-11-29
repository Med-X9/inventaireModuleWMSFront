/**
 * Composable pour gérer le redimensionnement de colonnes (style AG-Grid)
 * Permet de redimensionner les colonnes par glisser-déposer
 */

import { ref, computed, type Ref } from 'vue'
import type { DataTableColumn } from '@/components/DataTable/types/dataTable'

export interface ColumnResizeConfig {
  /** Largeurs par défaut des colonnes */
  defaultWidths?: Record<string, number>
  /** Largeur minimale d'une colonne */
  minWidth?: number
  /** Largeur maximale d'une colonne */
  maxWidth?: number
  /** Activer le redimensionnement */
  enabled?: boolean
}

/**
 * Composable pour gérer le redimensionnement de colonnes
 */
export function useColumnResize(
  columns: Ref<DataTableColumn[]>,
  config: ColumnResizeConfig = {}
) {
  const { 
    defaultWidths = {}, 
    minWidth = 50, 
    maxWidth = 1000,
    enabled = true 
  } = config

  // Largeurs des colonnes
  const columnWidths = ref<Record<string, number>>({ ...defaultWidths })

  // État du redimensionnement en cours
  const isResizing = ref(false)
  const resizingColumn = ref<string | null>(null)
  const resizeStartX = ref(0)
  const resizeStartWidth = ref(0)

  /**
   * Démarre le redimensionnement d'une colonne
   */
  const startResize = (field: string, startX: number) => {
    if (!enabled) return

    isResizing.value = true
    resizingColumn.value = field
    resizeStartX.value = startX
    resizeStartWidth.value = columnWidths.value[field] || 150
  }

  /**
   * Met à jour la largeur pendant le redimensionnement
   */
  const updateResize = (currentX: number) => {
    if (!isResizing.value || !resizingColumn.value) return

    const deltaX = currentX - resizeStartX.value
    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, resizeStartWidth.value + deltaX)
    )

    columnWidths.value[resizingColumn.value] = newWidth
  }

  /**
   * Termine le redimensionnement
   */
  const endResize = () => {
    isResizing.value = false
    resizingColumn.value = null
    resizeStartX.value = 0
    resizeStartWidth.value = 0
  }

  /**
   * Définit la largeur d'une colonne
   */
  const setColumnWidth = (field: string, width: number) => {
    if (!enabled) return

    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width))
    columnWidths.value[field] = clampedWidth
  }

  /**
   * Obtient la largeur d'une colonne
   */
  const getColumnWidth = (field: string): number => {
    return columnWidths.value[field] || columns.value.find(col => col.field === field)?.width || 150
  }

  /**
   * Réinitialise toutes les largeurs
   */
  const resetAllWidths = () => {
    columnWidths.value = { ...defaultWidths }
  }

  /**
   * Auto-size toutes les colonnes selon leur contenu
   */
  const autoSizeAll = () => {
    // Cette fonction devrait être appelée après le rendu pour mesurer le contenu
    // Pour l'instant, on utilise les largeurs par défaut
    columns.value.forEach(col => {
      if (!columnWidths.value[col.field]) {
        columnWidths.value[col.field] = col.width || 150
      }
    })
  }

  /**
   * Colonnes avec leurs largeurs calculées
   */
  const columnsWithWidths = computed(() => {
    return columns.value.map(col => ({
      ...col,
      width: getColumnWidth(col.field)
    }))
  })

  return {
    // État
    columnWidths: computed(() => columnWidths.value),
    isResizing: computed(() => isResizing.value),
    resizingColumn: computed(() => resizingColumn.value),
    columnsWithWidths,
    
    // Méthodes
    startResize,
    updateResize,
    endResize,
    setColumnWidth,
    getColumnWidth,
    resetAllWidths,
    autoSizeAll
  }
}

