<template>
  <div class="excel-grid-container">
    <!-- Header simple -->
    <div class="excel-grid-header">
      <h3>Grille de saisie</h3>
      <div class="header-buttons">
        <button @click="addRow" class="header-btn">+ Ligne</button>
        <button @click="validateAll" class="header-btn">Valider</button>
        <button @click="exportData" class="header-btn">Exporter</button>
      </div>
    </div>

    <!-- Grille -->
    <div class="excel-grid-wrapper" ref="gridWrapper">
      <table class="excel-grid-table" @keydown="handleKeyNavigation">
        <thead>
          <tr>
            <th class="excel-header-cell row-number">#</th>
            <th class="excel-header-cell">Emplacement</th>
            <th class="excel-header-cell">Article</th>
            <th class="excel-header-cell">Quantité</th>
            <th class="excel-header-cell">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, rowIndex) in gridData"
            :key="row.id"
            :class="{ 'row-selected': selectedCell.row === rowIndex }"
          >
            <td class="excel-cell row-number">{{ rowIndex + 1 }}</td>

            <!-- Emplacement -->
            <td
              class="excel-cell"
              :class="getCellClass(rowIndex, 0)"
              @click="selectCell(rowIndex, 0)"
            >
              <input
                v-if="isEditing(rowIndex, 0)"
                ref="cellInputs"
                v-model="row.emplacement"
                @blur="finishEdit"
                @keydown="handleCellKeydown($event, rowIndex, 0)"
                @input="validateCell(rowIndex, 'emplacement', ($event.target as HTMLInputElement)?.value)"
                class="cell-input"
                :class="{ 'invalid': row.errors.emplacement }"
                placeholder="EMP-001"
              />
              <span
                v-else
                @dblclick="startEdit(rowIndex, 0)"
                class="cell-display"
                :class="{ 'invalid': row.errors.emplacement, 'empty': !row.emplacement }"
              >
                {{ row.emplacement || 'Cliquez pour saisir' }}
              </span>
              <div v-if="row.errors.emplacement" class="cell-error">
                {{ row.errors.emplacement }}
              </div>
            </td>

            <!-- Article -->
            <td
              class="excel-cell"
              :class="getCellClass(rowIndex, 1)"
              @click="selectCell(rowIndex, 1)"
            >
              <input
                v-if="isEditing(rowIndex, 1)"
                ref="cellInputs"
                v-model="row.article"
                @blur="finishEdit"
                @keydown="handleCellKeydown($event, rowIndex, 1)"
                @input="validateCell(rowIndex, 'article', ($event.target as HTMLInputElement)?.value)"
                class="cell-input"
                :class="{ 'invalid': row.errors.article }"
                placeholder="ART-001"
              />
              <span
                v-else
                @dblclick="startEdit(rowIndex, 1)"
                class="cell-display"
                :class="{ 'invalid': row.errors.article, 'empty': !row.article }"
              >
                {{ row.article || 'Cliquez pour saisir' }}
              </span>
              <div v-if="row.errors.article" class="cell-error">
                {{ row.errors.article }}
              </div>
            </td>

            <!-- Quantité -->
            <td
              class="excel-cell"
              :class="getCellClass(rowIndex, 2)"
              @click="selectCell(rowIndex, 2)"
            >
              <input
                v-if="isEditing(rowIndex, 2)"
                ref="cellInputs"
                v-model.number="row.quantite"
                @blur="finishEdit"
                @keydown="handleCellKeydown($event, rowIndex, 2)"
                @input="validateCell(rowIndex, 'quantite', ($event.target as HTMLInputElement)?.value)"
                class="cell-input"
                :class="{ 'invalid': row.errors.quantite }"
                type="number"
                min="0"
                step="1"
                placeholder="0"
              />
              <span
                v-else
                @dblclick="startEdit(rowIndex, 2)"
                class="cell-display"
                :class="{ 'invalid': row.errors.quantite, 'empty': row.quantite === null || row.quantite === undefined }"
              >
                {{ row.quantite ?? 'Cliquez pour saisir' }}
              </span>
              <div v-if="row.errors.quantite" class="cell-error">
                {{ row.errors.quantite }}
              </div>
            </td>

            <!-- Actions -->
            <td class="excel-cell actions-cell">
              <div class="actions">
                <button
                  @click="validateRow(rowIndex)"
                  class="action-btn validate"
                  :disabled="!isRowValid(rowIndex)"
                >
                  ✓
                </button>
                <button
                  @click="duplicateRow(rowIndex)"
                  class="action-btn duplicate"
                >
                  ⧉
                </button>
                <button
                  @click="deleteRow(rowIndex)"
                  class="action-btn delete"
                >
                  ✕
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer simple -->
    <div class="excel-grid-footer">
      <span>{{ gridData.length }} lignes</span>
      <span>{{ validRowsCount }} valides</span>
      <span>{{ invalidRowsCount }} erreurs</span>
      <span>Total: {{ totalQuantity }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import IconPlus from '@/components/icon/icon-plus.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconDownload from '@/components/icon/icon-download.vue'
import IconCopy from '@/components/icon/icon-copy.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import IconBox from '@/components/icon/icon-box.vue'
import IconInfoCircle from '@/components/icon/icon-info-circle.vue'

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
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => [],
  readonly: false
})

// Emits
const emit = defineEmits<{
  'row-validated': [row: GridRow]
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
  const classes: string[] = []

  if (selectedCell.row === row && selectedCell.col === col) {
    classes.push('selected')
  }

  if (isEditing(row, col)) {
    classes.push('editing')
  }

  return classes.join(' ')
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

const validateRow = (index: number) => {
  const row = gridData.value[index]
  if (isRowValid(index)) {
    emit('row-validated', row)
  }
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

<style scoped>
.excel-grid-container {
  width: 100%;
}

.excel-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.excel-grid-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.header-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #FECD1C;
  background-color: #FECD1C;
  color: #1f2937;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.header-btn:hover {
  background-color: #f59e0b;
}

.excel-grid-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: auto;
  max-height: 70vh;
}

.excel-grid-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.excel-header-cell {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-header-cell.row-number {
  width: 60px;
  text-align: center;
  background-color: #f3f4f6;
  color: #374151;
}

.excel-cell {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  position: relative;
  min-height: 45px;
  vertical-align: top;
  background-color: white;
}

.excel-cell.row-number {
  background-color: #f3f4f6;
  text-align: center;
  font-weight: 600;
  color: #374151;
  width: 60px;
}

.excel-cell.selected {
  box-shadow: 0 0 0 2px #3b82f6;
  background-color: #eff6ff;
}

.excel-cell.editing {
  box-shadow: 0 0 0 2px #10b981;
  background-color: #ecfdf5;
}

.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.25rem;
  font-size: 0.875rem;
}

.cell-input.invalid {
  background-color: #fef2f2;
  color: #dc2626;
}

.cell-display {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
  cursor: pointer;
  min-height: 24px;
}

.cell-display.empty {
  color: #9ca3af;
  font-style: italic;
}

.cell-display.invalid {
  color: #dc2626;
  background-color: #fef2f2;
}

.cell-error {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  background-color: #dc2626;
  color: white;
  font-size: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 150px;
}

.actions-cell {
  width: 120px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  background-color: white;
}

.action-btn.validate {
  border: 1px solid #FECD1C;
  background-color: #FECD1C;
  color: #1f2937;
}

.action-btn.validate:hover {
  background-color: #f59e0b;
}

.action-btn.validate:disabled {
  border-color: #d1d5db;
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.action-btn.duplicate {
  border: 1px solid #FECD1C;
  background-color: #FECD1C;
  color: #1f2937;
}

.action-btn.duplicate:hover {
  background-color: #f59e0b;
}

.action-btn.delete {
  border-color: #dc2626;
  color: #dc2626;
}

.action-btn.delete:hover {
  background-color: #fef2f2;
}

.row-selected {
  background-color: #f8fafc;
}

.excel-grid-footer {
  display: flex;
  justify-content: space-around;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .excel-grid-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .excel-grid-footer {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
