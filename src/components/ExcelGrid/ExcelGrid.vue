<template>
  <div class="w-full">
    <!-- Grille -->
    <div class="border border-gray-300 rounded-b-lg overflow-auto max-h-[70vh] bg-white shadow-sm" ref="gridWrapper">
      <table class="w-full border-collapse min-w-[800px] table-fixed" @keydown="handleKeyNavigation">
        <thead>
          <tr class="bg-gradient-to-b from-gray-50 to-gray-100">
            <th class="border-r border-b border-gray-300 p-2 text-center font-semibold text-gray-800 sticky top-0 z-10 w-16 bg-gray-100 shadow-sm h-12 align-middle">
              <span class="text-xs text-gray-600">#</span>
            </th>
            <th class="border-r border-b border-gray-300 p-2 text-left font-semibold text-gray-800 sticky top-0 z-10 bg-gray-100 shadow-sm h-12 align-middle" style="width: 30%;">
              <div class="flex items-center gap-2">
                <span class="text-sm">Emplacement</span>
                <span v-if="loadingLocations" class="text-xs text-primary font-normal animate-pulse">(Chargement...)</span>
              </div>
            </th>
            <th class="border-r border-b border-gray-300 p-2 text-left font-semibold text-gray-800 sticky top-0 z-10 bg-gray-100 shadow-sm h-12 align-middle" style="width: 30%;">
              <div class="flex items-center gap-2">
                <span class="text-sm">Article</span>
                <span v-if="loadingArticles" class="text-xs text-primary font-normal animate-pulse">(Chargement...)</span>
              </div>
            </th>
            <th class="border-r border-b border-gray-300 p-2 text-left font-semibold text-gray-800 sticky top-0 z-10 bg-gray-100 shadow-sm h-12 align-middle" style="width: 20%;">Quantité</th>
            <th class="border-b border-gray-300 p-2 text-center font-semibold text-gray-800 sticky top-0 z-10 w-28 bg-gray-100 shadow-sm h-12 align-middle">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, rowIndex) in gridData"
            :key="row.id"
            :class="[
              'transition-all duration-150 border-b border-gray-200',
              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
              selectedCell.row === rowIndex && 'bg-blue-100 border-blue-300 shadow-sm',
              'hover:bg-blue-50 hover:shadow-sm'
            ]"
          >
            <td class="border-r border-gray-200 p-2 bg-gray-50 text-center font-medium text-gray-600 w-16 h-12 align-middle text-sm">
              {{ rowIndex + 1 }}
            </td>

            <!-- Emplacement -->
            <td
              class="border-r border-gray-200 p-2 relative h-12 transition-all duration-150 align-middle"
              :class="[
                selectedCell.row === rowIndex && selectedCell.col === 0 && 'ring-2 ring-primary ring-offset-1 bg-primary-50',
                isEditing(rowIndex, 0) && 'ring-2 ring-success ring-offset-1 bg-success-50'
              ]"
              @click="selectCell(rowIndex, 0)"
            >
              <div v-if="isEditing(rowIndex, 0)" class="w-full h-full flex items-center">
                <SelectField
                  v-if="locationOptions && locationOptions.length > 0"
                  :model-value="row.emplacement"
                  :options="locationOptions"
                  :searchable="true"
                  :clearable="true"
                  :loading="loadingLocations"
                  placeholder="Sélectionner un emplacement"
                  @update:model-value="(val) => handleEmplacementChange(rowIndex, val)"
                  @blur="finishEdit"
                  class="text-sm w-full"
                  :class="{ 'border-error': row.errors.emplacement }"
                />
                <input
                  v-else
                  ref="cellInputs"
                  v-model="row.emplacement"
                  @blur="finishEdit"
                  @keydown="handleCellKeydown($event, rowIndex, 0)"
                  @input="validateCell(rowIndex, 'emplacement', ($event.target as HTMLInputElement)?.value)"
                  class="w-full h-full border-none outline-none bg-transparent px-2 text-sm rounded focus:bg-white focus:ring-1 focus:ring-primary"
                  :class="{ 'bg-error-50 text-error': row.errors.emplacement }"
                  placeholder="EMP-001"
                />
              </div>
              <span
                v-else
                @dblclick="startEdit(rowIndex, 0)"
                class="block w-full h-full px-2 cursor-pointer text-sm rounded transition-colors duration-150 flex items-center whitespace-nowrap overflow-hidden text-ellipsis"
                :class="[
                  !row.emplacement && 'text-gray-400 italic',
                  row.errors.emplacement && 'text-error bg-error-50',
                  !row.errors.emplacement && 'hover:bg-gray-100'
                ]"
                :title="getLocationLabel(row.emplacement) || 'Cliquez pour sélectionner'"
              >
                {{ getLocationLabel(row.emplacement) || 'Cliquez pour sélectionner' }}
              </span>
              <div 
                v-if="row.errors.emplacement" 
                class="absolute top-full left-0 z-20 bg-error text-white text-xs p-2 rounded-md shadow-xl min-w-[180px] mt-1 border border-error-dark"
              >
                <div class="flex items-center gap-1">
                  <span class="font-semibold">⚠</span>
                  <span>{{ row.errors.emplacement }}</span>
                </div>
              </div>
            </td>

            <!-- Article -->
            <td
              class="border-r border-gray-200 p-2 relative h-12 transition-all duration-150 align-middle"
              :class="[
                selectedCell.row === rowIndex && selectedCell.col === 1 && 'ring-2 ring-primary ring-offset-1 bg-primary-50',
                isEditing(rowIndex, 1) && 'ring-2 ring-success ring-offset-1 bg-success-50'
              ]"
              @click="selectCell(rowIndex, 1)"
            >
              <div v-if="isEditing(rowIndex, 1)" class="w-full h-full flex items-center">
                <SelectField
                  :model-value="row.article"
                  :options="articleOptions"
                  :searchable="true"
                  :clearable="true"
                  :loading="loadingArticles"
                  placeholder="Rechercher un article"
                  @update:model-value="(val) => handleArticleChange(rowIndex, val)"
                  @blur="finishEdit"
                  class="text-sm w-full"
                  :class="{ 'border-error': row.errors.article }"
                />
              </div>
              <span
                v-else
                @dblclick="startEdit(rowIndex, 1)"
                class="block w-full h-full px-2 cursor-pointer text-sm rounded transition-colors duration-150 flex items-center whitespace-nowrap overflow-hidden text-ellipsis"
                :class="[
                  !row.article && 'text-gray-400 italic',
                  row.errors.article && 'text-error bg-error-50',
                  !row.errors.article && 'hover:bg-gray-100'
                ]"
                :title="getArticleLabel(row.article) || 'Cliquez pour rechercher'"
              >
                {{ getArticleLabel(row.article) || 'Cliquez pour rechercher' }}
              </span>
              <div 
                v-if="row.errors.article" 
                class="absolute top-full left-0 z-20 bg-error text-white text-xs p-2 rounded-md shadow-xl min-w-[180px] mt-1 border border-error-dark"
              >
                <div class="flex items-center gap-1">
                  <span class="font-semibold">⚠</span>
                  <span>{{ row.errors.article }}</span>
                </div>
              </div>
            </td>

            <!-- Quantité -->
            <td
              class="border-r border-gray-200 p-2 relative h-12 transition-all duration-150 align-middle"
              :class="[
                selectedCell.row === rowIndex && selectedCell.col === 2 && 'ring-2 ring-primary ring-offset-1 bg-primary-50',
                isEditing(rowIndex, 2) && 'ring-2 ring-success ring-offset-1 bg-success-50'
              ]"
              @click="selectCell(rowIndex, 2)"
            >
              <input
                v-if="isEditing(rowIndex, 2)"
                ref="cellInputs"
                v-model.number="row.quantite"
                @blur="finishEdit"
                @keydown="handleCellKeydown($event, rowIndex, 2)"
                @input="validateCell(rowIndex, 'quantite', ($event.target as HTMLInputElement)?.value)"
                class="w-full h-full border-none outline-none bg-transparent px-2 text-sm rounded focus:bg-white focus:ring-1 focus:ring-primary text-right font-medium"
                :class="{ 'bg-error-50 text-error': row.errors.quantite }"
                type="number"
                min="0"
                step="1"
                placeholder="0"
              />
              <span
                v-else
                @dblclick="startEdit(rowIndex, 2)"
                class="block w-full h-full px-2 cursor-pointer text-sm rounded transition-colors duration-150 text-right font-medium flex items-center justify-end whitespace-nowrap"
                :class="[
                  (row.quantite === null || row.quantite === undefined) && 'text-gray-400 italic',
                  row.errors.quantite && 'text-error bg-error-50',
                  !row.errors.quantite && row.quantite !== null && row.quantite !== undefined && 'text-gray-900',
                  !row.errors.quantite && 'hover:bg-gray-100'
                ]"
              >
                {{ row.quantite ?? 'Cliquez pour saisir' }}
              </span>
              <div 
                v-if="row.errors.quantite" 
                class="absolute top-full left-0 z-20 bg-error text-white text-xs p-2 rounded-md shadow-xl min-w-[180px] mt-1 border border-error-dark"
              >
                <div class="flex items-center gap-1">
                  <span class="font-semibold">⚠</span>
                  <span>{{ row.errors.quantite }}</span>
                </div>
              </div>
            </td>

            <!-- Actions -->
            <td class="border-gray-200 p-2 w-28 h-12 align-middle">
              <div class="flex justify-center gap-1.5 items-center h-full">
                <button
                  @click="duplicateRow(rowIndex)"
                  class="p-1.5 bg-primary hover:bg-primary-dark text-white rounded-md transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105"
                  title="Dupliquer la ligne"
                >
                  <IconCopy class="w-4 h-4" />
                </button>
                <button
                  @click="deleteRow(rowIndex)"
                  class="p-1.5 bg-error hover:bg-error-dark text-white rounded-md transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105"
                  title="Supprimer la ligne"
                >
                  <IconTrash class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="flex justify-around items-center p-3 bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-300 rounded-b-lg text-sm">
      <div class="flex items-center gap-2">
        <span class="text-gray-600">Lignes:</span>
        <span class="font-semibold text-gray-900">{{ gridData.length }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">Valides:</span>
        <span class="font-semibold text-success">{{ validRowsCount }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">Erreurs:</span>
        <span class="font-semibold text-error">{{ invalidRowsCount }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">Total:</span>
        <span class="font-semibold text-primary">{{ totalQuantity }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import SelectField from '@/components/Form/SelectField.vue'
import IconCopy from '@/components/icon/icon-copy.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import type { SelectOption } from '@/interfaces/form'

// Types
interface GridRow {
  id: string
  emplacement: string
  article: string
  quantite: number | null
  isValid: boolean
  errors: {
    emplacement?: string
    article?: string
    quantite?: string
  }
}

interface CellPosition {
  row: number
  col: number
}

// Props
interface Props {
  initialData?: Partial<GridRow>[]
  readonly?: boolean
  locationOptions?: SelectOption[]
  articleOptions?: SelectOption[]
  loadingLocations?: boolean
  loadingArticles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => [],
  readonly: false,
  locationOptions: () => [],
  articleOptions: () => [],
  loadingLocations: false,
  loadingArticles: false
})

// Emits
const emit = defineEmits<{
  'data-changed': [data: GridRow[]]
  'export-requested': [data: GridRow[]]
}>()

// État réactif
const gridData = ref<GridRow[]>([])
const selectedCell = reactive<CellPosition>({ row: -1, col: -1 })
const editingCell = reactive<CellPosition>({ row: -1, col: -1 })
const cellInputs = ref<HTMLInputElement[]>([])
const gridWrapper = ref<HTMLElement>()

// Computed
const validRowsCount = computed(() =>
  gridData.value.filter(row => isRowValid(gridData.value.indexOf(row))).length
)

const invalidRowsCount = computed(() =>
  gridData.value.length - validRowsCount.value
)

const totalQuantity = computed(() =>
  gridData.value.reduce((sum, row) => sum + (row.quantite || 0), 0)
)

// Méthodes de validation
const validateCell = (rowIndex: number, field: keyof GridRow, value: any) => {
  const row = gridData.value[rowIndex]
  if (!row) return

  // Effacer l'erreur précédente
  delete row.errors[field as keyof typeof row.errors]

  switch (field) {
    case 'emplacement':
      if (!value || value.trim() === '') {
        row.errors.emplacement = 'Emplacement requis'
      } else if (!/^[A-Z]{3}-\d{3}$/.test(value.trim())) {
        row.errors.emplacement = 'Format: EMP-001'
      } else {
        // Vérifier les doublons
        const duplicate = gridData.value.find((r, i) =>
          i !== rowIndex && r.emplacement === value.trim()
        )
        if (duplicate) {
          row.errors.emplacement = 'Emplacement déjà utilisé'
        }
      }
      break

    case 'article':
      if (!value || value.trim() === '') {
        row.errors.article = 'Article requis'
      } else if (!/^[A-Z]{3}-\d{3}$/.test(value.trim())) {
        row.errors.article = 'Format: ART-001'
      }
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
}

const isRowValid = (rowIndex: number): boolean => {
  const row = gridData.value[rowIndex]
  if (!row) return false

  return Boolean(row.emplacement &&
         row.article &&
         row.quantite !== null &&
         row.quantite !== undefined &&
         Object.keys(row.errors).length === 0)
}

// Méthodes de gestion des cellules
const selectCell = (row: number, col: number) => {
  selectedCell.row = row
  selectedCell.col = col
}

const isEditing = (row: number, col: number): boolean => {
  return editingCell.row === row && editingCell.col === col
}

const startEdit = (row: number, col: number) => {
  if (props.readonly) return

  editingCell.row = row
  editingCell.col = col
  selectedCell.row = row
  selectedCell.col = col

  nextTick(() => {
    const input = cellInputs.value.find(el => el && (el.closest('td')?.parentElement as HTMLTableRowElement)?.rowIndex === row + 1)
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const finishEdit = () => {
  editingCell.row = -1
  editingCell.col = -1
}

const getCellClass = (row: number, col: number): string => {
  // Les classes sont maintenant gérées directement dans le template avec Tailwind
  return ''
}

// Navigation au clavier
const handleKeyNavigation = (event: KeyboardEvent) => {
  if (editingCell.row !== -1) return // Ne pas naviguer en mode édition

  const maxRow = gridData.value.length - 1
  const maxCol = 2 // 0: emplacement, 1: article, 2: quantité

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      if (selectedCell.row > 0) {
        selectCell(selectedCell.row - 1, selectedCell.col)
      }
      break

    case 'ArrowDown':
      event.preventDefault()
      if (selectedCell.row < maxRow) {
        selectCell(selectedCell.row + 1, selectedCell.col)
      } else {
        // Ajouter une nouvelle ligne si on est à la fin
        addRow()
        selectCell(selectedCell.row + 1, selectedCell.col)
      }
      break

    case 'ArrowLeft':
      event.preventDefault()
      if (selectedCell.col > 0) {
        selectCell(selectedCell.row, selectedCell.col - 1)
      }
      break

    case 'ArrowRight':
    case 'Tab':
      event.preventDefault()
      if (selectedCell.col < maxCol) {
        selectCell(selectedCell.row, selectedCell.col + 1)
      } else if (selectedCell.row < maxRow) {
        selectCell(selectedCell.row + 1, 0)
      }
      break

    case 'Enter':
      event.preventDefault()
      if (selectedCell.row !== -1 && selectedCell.col !== -1) {
        startEdit(selectedCell.row, selectedCell.col)
      }
      break

    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      if (selectedCell.row !== -1) {
        deleteRow(selectedCell.row)
      }
      break

    case 'F2':
      event.preventDefault()
      if (selectedCell.row !== -1 && selectedCell.col !== -1) {
        startEdit(selectedCell.row, selectedCell.col)
      }
      break
  }
}

const handleCellKeydown = (event: KeyboardEvent, row: number, col: number) => {
  const maxCol = 2

  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      finishEdit()
      // Aller à la ligne suivante
      if (row < gridData.value.length - 1) {
        nextTick(() => selectCell(row + 1, col))
      } else {
        addRow()
        nextTick(() => selectCell(row + 1, col))
      }
      break

    case 'Tab':
      event.preventDefault()
      finishEdit()
      // Aller à la cellule suivante
      if (col < maxCol) {
        nextTick(() => startEdit(row, col + 1))
      } else if (row < gridData.value.length - 1) {
        nextTick(() => startEdit(row + 1, 0))
      } else {
        addRow()
        nextTick(() => startEdit(row + 1, 0))
      }
      break

    case 'Escape':
      event.preventDefault()
      finishEdit()
      selectCell(row, col)
      break
  }
}

// Méthodes de gestion des lignes
const createNewRow = (): GridRow => ({
  id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  emplacement: '',
  article: '',
  quantite: null,
  isValid: false,
  errors: {}
})

const addRow = () => {
  gridData.value.push(createNewRow())
  emit('data-changed', gridData.value)
}

const deleteRow = (index: number) => {
  if (gridData.value.length <= 1) {
    // Garder au moins une ligne
    gridData.value[0] = createNewRow()
  } else {
    gridData.value.splice(index, 1)
  }

  // Ajuster la sélection
  if (selectedCell.row >= gridData.value.length) {
    selectedCell.row = gridData.value.length - 1
  }

  emit('data-changed', gridData.value)
}

const duplicateRow = (index: number) => {
  const originalRow = gridData.value[index]
  const newRow = createNewRow()

  newRow.emplacement = originalRow.emplacement
  newRow.article = originalRow.article
  newRow.quantite = originalRow.quantite

  gridData.value.splice(index + 1, 0, newRow)

  // Valider la nouvelle ligne
  validateCell(index + 1, 'emplacement', newRow.emplacement)
  validateCell(index + 1, 'article', newRow.article)
  validateCell(index + 1, 'quantite', newRow.quantite)

  emit('data-changed', gridData.value)
}


// Gestion des changements pour emplacement et article
const handleEmplacementChange = (rowIndex: number, value: string | number | null) => {
  const row = gridData.value[rowIndex]
  if (row) {
    row.emplacement = value ? String(value) : ''
    validateCell(rowIndex, 'emplacement', row.emplacement)
    emit('data-changed', gridData.value)
  }
}

const handleArticleChange = (rowIndex: number, value: string | number | null) => {
  const row = gridData.value[rowIndex]
  if (row) {
    row.article = value ? String(value) : ''
    validateCell(rowIndex, 'article', row.article)
    emit('data-changed', gridData.value)
  }
}

// Obtenir le label pour affichage
const getLocationLabel = (value: string | null | undefined): string => {
  if (!value) return ''
  const option = props.locationOptions?.find(opt => opt.value === value || opt.value === String(value))
  return option ? option.label : value
}

const getArticleLabel = (value: string | null | undefined): string => {
  if (!value) return ''
  const option = props.articleOptions?.find(opt => opt.value === value || opt.value === String(value))
  return option ? option.label : value
}

const validateAll = () => {
  gridData.value.forEach((row, index) => {
    validateCell(index, 'emplacement', row.emplacement)
    validateCell(index, 'article', row.article)
    validateCell(index, 'quantite', row.quantite)
  })

  const validRows = gridData.value.filter((_, index) => isRowValid(index))
}

const exportData = () => {
  emit('export-requested', gridData.value)
}

// Initialisation
const initializeGrid = () => {
  if (props.initialData.length > 0) {
    gridData.value = props.initialData.map(data => ({
      ...createNewRow(),
      ...data
    }))
  } else {
    gridData.value = [createNewRow()]
  }

  // Sélectionner la première cellule
  selectCell(0, 0)
}

// Watchers
watch(() => props.initialData, initializeGrid, { immediate: true })

// Exposer les méthodes publiques
defineExpose({
  addRow,
  validateAll,
  exportData,
  getData: () => gridData.value,
  setData: (data: GridRow[]) => {
    gridData.value = data
  }
})
</script>

