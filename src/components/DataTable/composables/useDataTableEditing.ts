/**
 * Composable pour gérer l'édition inline du DataTable
 *
 * Implémentation simple pour l'édition de cellules individuelles
 *
 * @module useDataTableEditing
 */

import { ref, computed } from 'vue'
import type { DataTableColumn } from '../types/dataTable'
import type { UseDataTableEditingConfig as BaseUseDataTableEditingConfig, EditingCellState } from '../types/composables'

/**
 * Configuration pour useDataTableEditing
 */
export type UseDataTableEditingConfig = BaseUseDataTableEditingConfig

/**
 * État d'édition d'une cellule
 */
export type EditingCell = EditingCellState

/**
 * Composable pour l'édition inline
 */
export function useDataTableEditing(config: UseDataTableEditingConfig) {
  const { columns, rowData, onSave, onCancel } = config

  // État des cellules en cours d'édition
  const editingCells = ref<Map<string, EditingCell>>(new Map())

  // Cellule actuellement en focus
  const focusedCell = ref<string | null>(null)

  /**
   * Génère une clé unique pour une cellule
   */
  const getCellKey = (rowId: string | number, field: string): string => {
    return `${rowId}-${field}`
  }

  /**
   * Vérifie si une cellule est en cours d'édition
   */
  const isEditing = (rowId: string | number, field: string): boolean => {
    const key = getCellKey(rowId, field)
    return editingCells.value.has(key)
  }

  /**
   * Démarre l'édition d'une cellule
   */
  const startEditing = (rowId: string | number, field: string, initialValue?: unknown) => {
    const row = rowData.find(r => r.id === rowId || r.reference === rowId)
    if (!row) return

    const originalValue = initialValue !== undefined ? initialValue : row[field]
    const key = getCellKey(rowId, field)

    editingCells.value.set(key, {
      rowId,
      field,
      value: originalValue,
      originalValue
    })

    focusedCell.value = key
  }

  /**
   * Met à jour la valeur d'une cellule en cours d'édition
   */
  const updateEditingValue = (rowId: string | number, field: string, value: unknown) => {
    const key = getCellKey(rowId, field)
    const cell = editingCells.value.get(key)
    if (cell) {
      cell.value = value
    }
  }

  /**
   * Sauvegarde les changements d'une cellule
   */
  const saveEditing = async (rowId: string | number, field: string) => {
    const key = getCellKey(rowId, field)
    const cell = editingCells.value.get(key)
    if (!cell) return

    try {
      // Appeler le callback de sauvegarde si fourni
      if (onSave) {
        const row = rowData.find(r => r.id === rowId || r.reference === rowId)
        if (row) {
          await onSave(row, field, cell.value)
        }
      }

      // Mettre à jour les données locales
      const row = rowData.find(r => r.id === rowId || r.reference === rowId)
      if (row) {
        row[field] = cell.value
      }

      // Supprimer de l'état d'édition
      editingCells.value.delete(key)
      focusedCell.value = null
    } catch (error) {
      // En cas d'erreur, restaurer la valeur originale
      cancelEditing(rowId, field)
    }
  }

  /**
   * Annule l'édition d'une cellule
   */
  const cancelEditing = (rowId: string | number, field: string) => {
    const key = getCellKey(rowId, field)
    const cell = editingCells.value.get(key)

    if (cell && onCancel) {
      const row = rowData.find(r => r.id === rowId || r.reference === rowId)
      if (row) {
        onCancel(row, field)
      }
    }

    editingCells.value.delete(key)
    if (focusedCell.value === key) {
      focusedCell.value = null
    }
  }

  /**
   * Obtient la valeur actuelle d'une cellule (éditée ou originale)
   */
  const getCellValue = (rowId: string | number, field: string): unknown => {
    const key = getCellKey(rowId, field)
    const cell = editingCells.value.get(key)

    if (cell) {
      return cell.value
    }

    const row = rowData.find(r => r.id === rowId || r.reference === rowId)
    return row ? row[field] : undefined
  }

  /**
   * Vérifie si une colonne est éditable
   */
  const isColumnEditable = (field: string): boolean => {
    const column = columns.find(col => col.field === field)
    return column?.editable === true
  }

  /**
   * Gère les événements clavier pour l'édition
   */
  const handleKeyDown = (event: KeyboardEvent, rowId: string | number, field: string) => {
    if (!isEditing(rowId, field)) return

    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        saveEditing(rowId, field)
        break
      case 'Escape':
        event.preventDefault()
        cancelEditing(rowId, field)
        break
      case 'Tab':
        event.preventDefault()
        saveEditing(rowId, field)
        // TODO: Navigation vers la cellule suivante
        break
    }
  }

  return {
    // État
    editingCells: computed(() => editingCells.value),
    focusedCell: computed(() => focusedCell.value),

    // Méthodes
    isEditing,
    isColumnEditable,
    startEditing,
    updateEditingValue,
    saveEditing,
    cancelEditing,
    getCellValue,
    handleKeyDown
  }
}
