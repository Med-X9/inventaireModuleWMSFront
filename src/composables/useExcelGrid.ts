import { ref, computed, reactive } from 'vue'
import { alertService } from '@/services/alertService'

export interface GridRow {
  id: string
  emplacement: string
  codeBarre: string
  article: string
  referenceArticle: string
  designation: string
  quantite: number | null
  isValid: boolean
  errors: {
    emplacement?: string
    codeBarre?: string
    article?: string
    quantite?: string
  }
}

export interface CellPosition {
  row: number
  col: number
}

export interface ExcelGridOptions {
  autoSave?: boolean
  validateOnChange?: boolean
  allowDuplicates?: boolean
  customValidation?: (row: GridRow, field: keyof GridRow, value: any) => string | null
}

export function useExcelGrid(options: ExcelGridOptions = {}) {
  // État réactif
  const gridData = ref<GridRow[]>([])
  const selectedCell = reactive<CellPosition>({ row: -1, col: -1 })
  const editingCell = reactive<CellPosition>({ row: -1, col: -1 })
  const isDirty = ref(false)

  // Options avec valeurs par défaut
  const config = {
    autoSave: options.autoSave ?? false,
    validateOnChange: options.validateOnChange ?? true,
    allowDuplicates: options.allowDuplicates ?? false,
    customValidation: options.customValidation
  }

  // Computed properties
  const validRowsCount = computed(() =>
    gridData.value.filter(row => isRowValid(gridData.value.indexOf(row))).length
  )

  const invalidRowsCount = computed(() =>
    gridData.value.length - validRowsCount.value
  )

  const totalQuantity = computed(() =>
    gridData.value.reduce((sum, row) => sum + (row.quantite || 0), 0)
  )

  const hasValidData = computed(() => validRowsCount.value > 0)

  const canSave = computed(() => hasValidData.value && isDirty.value)

  // Méthodes de validation
  const validateCell = (rowIndex: number, field: keyof GridRow, value: any): boolean => {
    const row = gridData.value[rowIndex]
    if (!row) return false

    // Effacer l'erreur précédente
    delete row.errors[field as keyof typeof row.errors]

    // Validation personnalisée en premier
    if (config.customValidation) {
      const customError = config.customValidation(row, field, value)
      if (customError) {
        row.errors[field as keyof typeof row.errors] = customError
        row.isValid = false
        return false
      }
    }

    // Validations par défaut
    switch (field) {
      case 'emplacement':
        if (!value || value.trim() === '') {
          row.errors.emplacement = 'Emplacement requis'
        } else if (!/^[A-Z]{3}-\d{3}$/.test(value.trim())) {
          row.errors.emplacement = 'Format: EMP-001'
        } else if (!config.allowDuplicates) {
          // Vérifier les doublons
          const duplicate = gridData.value.find((r, i) =>
            i !== rowIndex && r.emplacement === value.trim()
          )
          if (duplicate) {
            row.errors.emplacement = 'Emplacement déjà utilisé'
          }
        }
        break

      case 'codeBarre':
        if (!value || value.trim() === '') {
          row.errors.codeBarre = 'Code barre requis'
        }
        break

      case 'article':
        // L'article est rempli automatiquement, pas besoin de validation stricte
        break

      case 'quantite':
        const qty = Number(value)
        if (value === '' || value === null || value === undefined) {
          row.errors.quantite = 'Quantité requise'
        } else if (isNaN(qty) || qty < 0) {
          row.errors.quantite = 'Quantité invalide'
        } else if (!Number.isInteger(qty)) {
          row.errors.quantite = 'Nombre entier requis'
        }
        break
    }

    // Mettre à jour la validité de la ligne
    row.isValid = isRowValid(rowIndex)

    // Marquer comme modifié
    isDirty.value = true

    return Object.keys(row.errors).length === 0
  }

  const validateAllCells = (): boolean => {
    let allValid = true

    gridData.value.forEach((row, index) => {
      const emplacementValid = validateCell(index, 'emplacement', row.emplacement)
      const articleValid = validateCell(index, 'article', row.article)
      const quantiteValid = validateCell(index, 'quantite', row.quantite)

      if (!emplacementValid || !articleValid || !quantiteValid) {
        allValid = false
      }
    })

    return allValid
  }

  const isRowValid = (rowIndex: number): boolean => {
    const row = gridData.value[rowIndex]
    if (!row) return false

    return Boolean(row.emplacement &&
           row.codeBarre &&
           row.article &&
           row.quantite !== null &&
           row.quantite !== undefined &&
           Object.keys(row.errors).length === 0)
  }

  // Méthodes de gestion des lignes
  const createNewRow = (): GridRow => ({
    id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    emplacement: '',
    codeBarre: '',
    article: '',
    referenceArticle: '',
    designation: '',
    quantite: null,
    isValid: false,
    errors: {}
  })

  const addRow = (data?: Partial<GridRow>): void => {
    const newRow = createNewRow()
    if (data) {
      Object.assign(newRow, data)
    }
    gridData.value.push(newRow)
    isDirty.value = true
  }

  const insertRow = (index: number, data?: Partial<GridRow>): void => {
    const newRow = createNewRow()
    if (data) {
      Object.assign(newRow, data)
    }
    gridData.value.splice(index, 0, newRow)
    isDirty.value = true
  }

  const deleteRow = (index: number): void => {
    if (gridData.value.length <= 1) {
      // Garder au moins une ligne vide
      gridData.value[0] = createNewRow()
    } else {
      gridData.value.splice(index, 1)
    }

    // Ajuster la sélection
    if (selectedCell.row >= gridData.value.length) {
      selectedCell.row = gridData.value.length - 1
    }

    isDirty.value = true
  }

  const duplicateRow = (index: number): void => {
    const originalRow = gridData.value[index]
    const newRow = createNewRow()

    newRow.emplacement = originalRow.emplacement
    newRow.article = originalRow.article
    newRow.quantite = originalRow.quantite

    gridData.value.splice(index + 1, 0, newRow)

    // Valider la nouvelle ligne si la validation automatique est activée
    if (config.validateOnChange) {
      validateCell(index + 1, 'emplacement', newRow.emplacement)
      validateCell(index + 1, 'article', newRow.article)
      validateCell(index + 1, 'quantite', newRow.quantite)
    }

    isDirty.value = true
  }

  const moveRow = (fromIndex: number, toIndex: number): void => {
    if (fromIndex === toIndex) return

    const row = gridData.value.splice(fromIndex, 1)[0]
    gridData.value.splice(toIndex, 0, row)
    isDirty.value = true
  }

  // Méthodes de gestion des cellules
  const selectCell = (row: number, col: number): void => {
    selectedCell.row = row
    selectedCell.col = col
  }

  const isEditing = (row: number, col: number): boolean => {
    return editingCell.row === row && editingCell.col === col
  }

  const startEdit = (row: number, col: number): void => {
    editingCell.row = row
    editingCell.col = col
    selectedCell.row = row
    selectedCell.col = col
  }

  const finishEdit = (): void => {
    editingCell.row = -1
    editingCell.col = -1
  }

  const cancelEdit = (): void => {
    finishEdit()
  }

  // Navigation
  const moveSelection = (direction: 'up' | 'down' | 'left' | 'right'): void => {
    const maxRow = gridData.value.length - 1
    const maxCol = 2 // 0: emplacement, 1: article, 2: quantité

    switch (direction) {
      case 'up':
        if (selectedCell.row > 0) {
          selectCell(selectedCell.row - 1, selectedCell.col)
        }
        break
      case 'down':
        if (selectedCell.row < maxRow) {
          selectCell(selectedCell.row + 1, selectedCell.col)
        } else {
          // Ajouter une nouvelle ligne si on est à la fin
          addRow()
          selectCell(selectedCell.row + 1, selectedCell.col)
        }
        break
      case 'left':
        if (selectedCell.col > 0) {
          selectCell(selectedCell.row, selectedCell.col - 1)
        }
        break
      case 'right':
        if (selectedCell.col < maxCol) {
          selectCell(selectedCell.row, selectedCell.col + 1)
        } else if (selectedCell.row < maxRow) {
          selectCell(selectedCell.row + 1, 0)
        }
        break
    }
  }

  const moveToNextCell = (): void => {
    const maxCol = 2
    const { row, col } = selectedCell

    if (col < maxCol) {
      selectCell(row, col + 1)
    } else if (row < gridData.value.length - 1) {
      selectCell(row + 1, 0)
    } else {
      addRow()
      selectCell(row + 1, 0)
    }
  }

  const moveToPreviousCell = (): void => {
    const { row, col } = selectedCell

    if (col > 0) {
      selectCell(row, col - 1)
    } else if (row > 0) {
      selectCell(row - 1, 2)
    }
  }

  // Méthodes de données
  const loadData = (data: Partial<GridRow>[]): void => {
    gridData.value = data.map(item => ({
      ...createNewRow(),
      ...item
    }))

    if (gridData.value.length === 0) {
      addRow()
    }

    // Sélectionner la première cellule
    selectCell(0, 0)
    isDirty.value = false
  }

  const getData = (): GridRow[] => {
    return gridData.value
  }

  const getValidData = (): GridRow[] => {
    return gridData.value.filter((_, index) => isRowValid(index))
  }

  const clearData = (): void => {
    gridData.value = [createNewRow()]
    selectCell(0, 0)
    isDirty.value = false
  }

  // Méthodes d'export/import
  const exportToCsv = (): string => {
    const headers = ['Emplacement', 'Article', 'Quantité']
    const rows = gridData.value.map(row => [
      row.emplacement || '',
      row.article || '',
      row.quantite?.toString() || '0'
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  }

  const exportToJson = (): string => {
    return JSON.stringify(gridData.value, null, 2)
  }

  const importFromCsv = (csvContent: string): void => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim())
      const data: Partial<GridRow>[] = []

      // Ignorer la première ligne (headers)
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.replace(/"/g, '').trim())
        if (values.length >= 3) {
          data.push({
            emplacement: values[0],
            article: values[1],
            quantite: values[2] ? parseInt(values[2]) : null
          })
        }
      }

      loadData(data)

      if (config.validateOnChange) {
        validateAllCells()
      }

    } catch (error) {
      alertService.error({ text: 'Erreur lors de l\'importation du fichier CSV' })
    }
  }

  // Auto-save
  const save = async (): Promise<boolean> => {
    if (!canSave.value) return false

    try {
      const validData = getValidData()
      if (validData.length === 0) {
        await alertService.warning({ text: 'Aucune donnée valide à sauvegarder' })
        return false
      }

      // Ici vous pouvez ajouter l'appel à votre API
      await alertService.success({ text: `${validData.length} ligne(s) sauvegardée(s)` })
      isDirty.value = false
      return true
    } catch (error) {
      await alertService.error({ text: 'Erreur lors de la sauvegarde' })
      return false
    }
  }

  // Initialisation
  const initialize = (initialData?: Partial<GridRow>[]): void => {
    if (initialData && initialData.length > 0) {
      loadData(initialData)
    } else {
      clearData()
    }
  }

  return {
    // État
    gridData,
    selectedCell,
    editingCell,
    isDirty,

    // Computed
    validRowsCount,
    invalidRowsCount,
    totalQuantity,
    hasValidData,
    canSave,

    // Validation
    validateCell,
    validateAllCells,
    isRowValid,

    // Gestion des lignes
    addRow,
    insertRow,
    deleteRow,
    duplicateRow,
    moveRow,

    // Gestion des cellules
    selectCell,
    isEditing,
    startEdit,
    finishEdit,
    cancelEdit,

    // Navigation
    moveSelection,
    moveToNextCell,
    moveToPreviousCell,

    // Données
    loadData,
    getData,
    getValidData,
    clearData,

    // Export/Import
    exportToCsv,
    exportToJson,
    importFromCsv,

    // Sauvegarde
    save,

    // Initialisation
    initialize
  }
}
