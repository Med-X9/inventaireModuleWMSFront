/**
 * Composable pour gérer les filtres avec valeurs uniques (Set Filters - style AG-Grid)
 * Affiche une liste de toutes les valeurs uniques disponibles pour sélection
 */

import { ref, computed, type Ref } from 'vue'
import type { DataTableColumn } from '@/components/DataTable/types/dataTable'

export interface SetFilterOption {
  value: any
  label: string
  count?: number // Nombre d'occurrences
  selected?: boolean
}

export interface SetFilterConfig {
  /** Activer les filtres Set */
  enabled?: boolean
  /** Fonction pour extraire les valeurs uniques depuis les données */
  extractUniqueValues?: (field: string, data: any[]) => any[]
  /** Fonction pour formater les valeurs pour l'affichage */
  formatValue?: (value: any) => string
}

/**
 * Composable pour gérer les filtres Set
 */
export function useSetFilters(
  columns: Ref<DataTableColumn[]>,
  data: Ref<any[]>,
  config: SetFilterConfig = {}
) {
  const { 
    enabled = true,
    extractUniqueValues = defaultExtractUniqueValues,
    formatValue = defaultFormatValue
  } = config

  // Options de filtre par colonne
  const filterOptions = ref<Record<string, SetFilterOption[]>>({})

  // Valeurs sélectionnées par colonne
  const selectedValues = ref<Record<string, Set<any>>>({})

  /**
   * Extrait les valeurs uniques par défaut
   */
  function defaultExtractUniqueValues(field: string, data: any[]): any[] {
    const values = new Set<any>()
    data.forEach(row => {
      const value = row[field]
      if (value !== null && value !== undefined && value !== '') {
        values.add(value)
      }
    })
    return Array.from(values).sort()
  }

  /**
   * Formate une valeur par défaut
   */
  function defaultFormatValue(value: any): string {
    if (value === null || value === undefined) return '(Vide)'
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
    return String(value)
  }

  /**
   * Initialise les options de filtre pour une colonne
   */
  const initializeFilterOptions = (field: string) => {
    if (!enabled) return

    const uniqueValues = extractUniqueValues(field, data.value)
    const options: SetFilterOption[] = uniqueValues.map(value => ({
      value,
      label: formatValue(value),
      count: data.value.filter(row => row[field] === value).length,
      selected: isValueSelected(field, value)
    }))

    filterOptions.value[field] = options
  }

  /**
   * Initialise toutes les options de filtre
   */
  const initializeAllFilterOptions = () => {
    columns.value.forEach(col => {
      if (col.filterable && col.dataType === 'select') {
        initializeFilterOptions(col.field)
      }
    })
  }

  /**
   * Vérifie si une valeur est sélectionnée
   */
  const isValueSelected = (field: string, value: any): boolean => {
    if (!selectedValues.value[field]) {
      return false
    }
    return selectedValues.value[field].has(value)
  }

  /**
   * Bascule la sélection d'une valeur
   */
  const toggleValue = (field: string, value: any) => {
    if (!enabled) return

    if (!selectedValues.value[field]) {
      selectedValues.value[field] = new Set()
    }

    if (selectedValues.value[field].has(value)) {
      selectedValues.value[field].delete(value)
    } else {
      selectedValues.value[field].add(value)
    }

    // Mettre à jour l'option correspondante
    const option = filterOptions.value[field]?.find(opt => opt.value === value)
    if (option) {
      option.selected = selectedValues.value[field].has(value)
    }
  }

  /**
   * Sélectionne toutes les valeurs d'une colonne
   */
  const selectAll = (field: string) => {
    if (!enabled || !filterOptions.value[field]) return

    if (!selectedValues.value[field]) {
      selectedValues.value[field] = new Set()
    }

    filterOptions.value[field].forEach(option => {
      selectedValues.value[field].add(option.value)
      option.selected = true
    })
  }

  /**
   * Désélectionne toutes les valeurs d'une colonne
   */
  const deselectAll = (field: string) => {
    if (!enabled || !selectedValues.value[field]) return

    selectedValues.value[field].clear()
    
    if (filterOptions.value[field]) {
      filterOptions.value[field].forEach(option => {
        option.selected = false
      })
    }
  }

  /**
   * Obtient les valeurs sélectionnées pour une colonne
   */
  const getSelectedValues = (field: string): any[] => {
    if (!selectedValues.value[field]) {
      return []
    }
    return Array.from(selectedValues.value[field])
  }

  /**
   * Applique le filtre Set à une colonne
   */
  const applyFilter = (field: string): any => {
    const selected = getSelectedValues(field)
    
    if (selected.length === 0) {
      return null // Pas de filtre
    }

    return {
      field,
      operator: 'in',
      dataType: 'select',
      values: selected
    }
  }

  /**
   * Réinitialise le filtre d'une colonne
   */
  const clearFilter = (field: string) => {
    if (selectedValues.value[field]) {
      selectedValues.value[field].clear()
    }
    
    if (filterOptions.value[field]) {
      filterOptions.value[field].forEach(option => {
        option.selected = false
      })
    }
  }

  /**
   * Réinitialise tous les filtres
   */
  const clearAllFilters = () => {
    selectedValues.value = {}
    Object.keys(filterOptions.value).forEach(field => {
      clearFilter(field)
    })
  }

  /**
   * Obtient les options de filtre pour une colonne
   */
  const getFilterOptions = (field: string): SetFilterOption[] => {
    return filterOptions.value[field] || []
  }

  return {
    // État
    filterOptions: computed(() => filterOptions.value),
    selectedValues: computed(() => selectedValues.value),
    
    // Méthodes
    initializeFilterOptions,
    initializeAllFilterOptions,
    isValueSelected,
    toggleValue,
    selectAll,
    deselectAll,
    getSelectedValues,
    applyFilter,
    clearFilter,
    clearAllFilters,
    getFilterOptions
  }
}

