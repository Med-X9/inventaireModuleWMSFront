<template>
    <div class="advanced-editable-cell">
        <!-- Mode affichage -->
        <div v-if="!isEditing" class="cell-display" :class="{ 'editable': isEditable }" @click="handleClick">
            <span v-if="containsHTML(displayValue)" v-html="displayValue"></span>
            <span v-else>{{ displayValue }}</span>
            <button v-if="isEditable" class="edit-icon" @click.stop="startEdit" title="Double-clic pour éditer">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
        </div>

        <!-- Mode édition -->
        <div v-else class="cell-edit">
            <!-- Select simple -->
            <select v-if="inputType === 'select' && !isMultiple"
                    ref="inputRef"
                    :value="editValue"
                    @change="handleSelectChange"
                    @keydown="handleKeydown"
                    @blur="saveEdit"
                    class="edit-select">
                <option value="">Sélectionner...</option>
                <option v-for="option in selectOptions"
                        :key="option.value"
                        :value="option.value">
                    {{ option.label }}
                </option>
            </select>

            <!-- Select multiple -->
            <div v-else-if="inputType === 'select' && isMultiple" class="edit-multiple-select">
                <div class="selected-items">
                    <span v-for="item in selectedItems" :key="item.value" class="selected-item">
                        {{ item.label }}
                        <button @click="removeItem(item)" class="remove-item">×</button>
                    </span>
                </div>
                <select ref="inputRef" @change="handleMultipleSelectChange" @keydown="handleKeydown" @blur="saveEdit" class="edit-select">
                    <option value="">Ajouter...</option>
                    <option v-for="option in availableOptions"
                            :key="option.value"
                            :value="option.value">
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <!-- Input date -->
            <input v-else-if="inputType === 'date'"
                   ref="inputRef"
                   type="date"
                   :value="dateValue"
                   @input="handleDateInput"
                   @keydown="handleKeydown"
                   @blur="saveEdit"
                   class="edit-input" />

            <!-- Input texte par défaut -->
            <input v-else
                   ref="inputRef"
                   type="text"
                   :value="editValue"
                   @input="handleInput"
                   @keydown="handleKeydown"
                   @blur="saveEdit"
                   class="edit-input" />

            <!-- Boutons d'action -->
            <div class="edit-actions">
                <button @click="saveEdit" class="save-btn" title="Sauvegarder (Entrée)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                <button @click="cancelEdit" class="cancel-btn" title="Annuler (Échap)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { logger } from '@/services/loggerService'

interface Props {
    value: any
    column: any
    row: any
    isEditing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'start-edit': []
    'save-edit': [value: any]
    'cancel-edit': []
}>()

// Références
const inputRef = ref<HTMLElement>()

// État local pour l'édition
const editValue = ref<any>(props.value)
const selectedItems = ref<any[]>([])

// Computed pour déterminer le type d'input
const inputType = computed(() => {
    const dataType = props.column.dataType || 'text'
    return dataType
})

// Computed pour vérifier si la colonne est éditable
const isEditable = computed(() => {
    // Vérifications de sécurité
    if (props.row.isChild) return false
    if (props.column.field === 'id') return false
    if (props.column.field === 'created_at') return false
    if (props.column.field === 'updated_at') return false

    return props.column.editable === true
})

// Computed pour vérifier si c'est un select multiple
const isMultiple = computed(() => {
    return props.column.dataType === 'select' && props.column.multiple;
})

// Computed pour les options du select
const selectOptions = computed(() => {
    if (props.column.filterConfig?.options) {
        return props.column.filterConfig.options
    }
    return []
})

// Computed pour les options disponibles dans le select multiple
const availableOptions = computed(() => {
    const selectedValues = selectedItems.value.map(item => item.value)
    return selectOptions.value.filter(option => !selectedValues.includes(option.value))
})

// Computed pour la valeur d'affichage
const displayValue = computed(() => {
    let value: any

    if (props.column.valueFormatter) {
        value = props.column.valueFormatter({ value: props.value, data: props.row })
    } else if (props.column.editValueFormatter) {
        value = props.column.editValueFormatter(props.value, props.row)
    } else if (isMultiple.value && Array.isArray(props.value)) {
        value = props.value.join(', ')
    } else {
        value = props.value
    }

    return String(value || '')
})

// Computed pour les valeurs de date
const dateValue = computed(() => {
    if (!props.value) return ''

    try {
        const date = new Date(props.value)
        if (isNaN(date.getTime())) return ''
        return date.toISOString().split('T')[0]
    } catch {
        return ''
    }
})

// Fonction pour vérifier si le contenu contient du HTML
const containsHTML = (content: any): boolean => {
    if (typeof content !== 'string') {
        return false
    }
    return content.includes('<') && content.includes('>')
}

// Fonction pour démarrer l'édition
const startEdit = () => {
    if (!isEditable.value) {
        return
    }

    editValue.value = props.value

    // Initialiser les éléments sélectionnés pour le select multiple
    if (isMultiple.value && Array.isArray(props.value)) {
        selectedItems.value = props.value.map(value => {
            const option = selectOptions.value.find(opt => opt.value === value)
            return option || { value, label: value }
        })
    }

    emit('start-edit')

    // Focus sur l'input après le rendu
    nextTick(() => {
        if (inputRef.value) {
            inputRef.value.focus()
            if (inputRef.value instanceof HTMLInputElement || inputRef.value instanceof HTMLSelectElement) {
                if (inputRef.value instanceof HTMLInputElement) {
                    inputRef.value.select()
                }
            }
        }
    })
}

// Fonction pour gérer le clic sur la cellule
const handleClick = () => {
    if (isEditable.value) {
        startEdit()
    }
}

// Fonction pour sauvegarder l'édition
const saveEdit = () => {
    let finalValue = editValue.value

    // Traitement spécial pour le select multiple
    if (isMultiple.value) {
        finalValue = selectedItems.value.map(item => item.value)
    }

    // Validation basique
    if (inputType.value === 'number' && isNaN(Number(finalValue))) {
        logger.warn('Valeur numérique invalide', finalValue)
        return
    }

    // Validation pour les dates
    if (inputType.value === 'date' && finalValue) {
        const date = new Date(finalValue)
        if (isNaN(date.getTime())) {
            logger.warn('Date invalide', finalValue)
            return
        }
    }

    // Ne pas sauvegarder si la valeur n'a pas changé
    if (finalValue === props.value) {
        emit('cancel-edit')
        return
    }

    emit('save-edit', finalValue)
}

// Fonction pour annuler l'édition
const cancelEdit = () => {
    editValue.value = props.value
    selectedItems.value = []
    emit('cancel-edit')
}

// Handlers pour les différents types d'inputs
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    editValue.value = target.value
}

const handleSelectChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    editValue.value = target.value
}

const handleMultipleSelectChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const selectedValue = target.value

    if (selectedValue) {
        const option = selectOptions.value.find(opt => opt.value === selectedValue)
        if (option && !selectedItems.value.find(item => item.value === selectedValue)) {
            selectedItems.value.push(option)
        }
        target.value = '' // Reset le select
    }
}

const handleDateInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    editValue.value = target.value
}

// Fonction pour supprimer un élément du select multiple
const removeItem = (item: any) => {
    selectedItems.value = selectedItems.value.filter(i => i.value !== item.value)
}

// Gestion des raccourcis clavier
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        saveEdit()
    } else if (event.key === 'Escape') {
        event.preventDefault()
        cancelEdit()
    }
}

// Watcher pour synchroniser la valeur d'édition avec les props
watch(() => props.value, (newValue) => {
    if (!props.isEditing) {
        editValue.value = newValue
    }
})

// Watcher pour réinitialiser quand l'édition s'arrête
watch(() => props.isEditing, (isEditing) => {
    if (!isEditing) {
        editValue.value = props.value
        selectedItems.value = []
    }
})
</script>

<style scoped>
.advanced-editable-cell {
    position: relative;
    width: 100%;
    height: 100%;
}

.cell-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0.375rem;
    border: 1px solid transparent;
}

.cell-display:hover {
    background-color: #f8fafc;
    border-color: #e5e7eb;
}

.cell-display.editable {
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    position: relative;
}

.cell-display.editable:hover {
    background-color: #f0f9ff;
    border-color: #0ea5e9;
    box-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);
}

.edit-icon {
    opacity: 0;
    transition: all 0.2s ease;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    min-height: 1.5rem;
}

.cell-display:hover .edit-icon {
    opacity: 1;
    transform: scale(1.05);
}

.cell-display.editable .edit-icon {
    opacity: 0.4;
}

.cell-display.editable:hover .edit-icon {
    opacity: 1;
    transform: scale(1.1);
}

.edit-icon:hover {
    background-color: #e5e7eb;
    color: #374151;
    transform: scale(1.15);
}

.cell-edit {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0.25rem;
}

.edit-input,
.edit-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background-color: white;
    color: #374151;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.edit-input:focus,
.edit-select:focus {
    outline: none;
    border-color: #FECD1C;
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.edit-multiple-select {
    width: 100%;
}

.selected-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
    padding: 0.25rem;
    background-color: #f9fafb;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
}

.selected-item {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background: linear-gradient(135deg, #FECD1C, #fbbf24);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    color: #1f2937;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.selected-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.remove-item {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.remove-item:hover {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
    transform: scale(1.2);
}

.edit-actions {
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    display: flex;
    gap: 0.375rem;
    padding: 0.375rem;
    background: linear-gradient(135deg, #ffffff, #f9fafb);
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
    z-index: 10;
}

.save-btn,
.cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.save-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}

.save-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.cancel-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
}

.cancel-btn:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

/* Styles pour les cellules non éditables */
.advanced-editable-cell:not(.editable) .cell-display {
    cursor: default;
}

.advanced-editable-cell:not(.editable) .cell-display:hover {
    background-color: transparent;
    border-color: transparent;
}

.advanced-editable-cell:not(.editable) .edit-icon {
    display: none;
}

/* Dark mode */
.dark .cell-display:hover {
    background-color: #2d3748;
    border-color: #4a5568;
}

.dark .cell-display.editable:hover {
    background-color: #1e3a8a;
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.dark .edit-icon:hover {
    background-color: #4a5568;
    color: #f7fafc;
}

.dark .edit-input,
.dark .edit-select {
    background-color: #1a202c;
    border-color: #4a5568;
    color: #f7fafc;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .edit-actions {
    background: linear-gradient(135deg, #1a202c, #2d3748);
    border-color: #4a5568;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.dark .selected-items {
    background-color: #2d3748;
    border-color: #4a5568;
}

.dark .selected-item {
    background: linear-gradient(135deg, #FECD1C, #f59e0b);
    color: #111827;
}
</style>
