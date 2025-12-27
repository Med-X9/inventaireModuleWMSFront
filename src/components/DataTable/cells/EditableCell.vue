<template>
    <div class="editable-cell" @dblclick="startEdit">
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
            <!-- Message d'erreur de validation -->
            <div v-if="validationError" class="validation-error-message" role="alert" aria-live="polite">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ validationError }}</span>
            </div>

            <!-- Input texte/number avec TextInput personnalisé -->
            <TextInput
                v-if="inputType === 'text' || inputType === 'number'"
                ref="inputRef"
                :field="textFieldConfig"
                :value="editValue"
                :error="!!validationError"
                :error-message="validationError"
                :disabled="!isEditable"
                class="w-full"
                :aria-invalid="!!validationError"
                :aria-describedby="validationError ? `error-${props.column.field}` : undefined"
                @update:value="handleTextValueUpdate"
                @change="handleTextChange"
                @keydown="handleKeydown"
                @blur="saveEdit"
            />

            <!-- Select simple -->
            <SelectField
                v-else-if="inputType === 'select'"
                ref="inputRef"
                v-model="editValue"
                :options="selectOptions"
                :multiple="isMultiple"
                :placeholder="selectPlaceholder"
                :clearable="!props.column.required"
                :disabled="!isEditable"
                :error="!!validationError"
                :error-message="validationError"
                class="w-full"
                compact
                :aria-invalid="!!validationError"
                :aria-describedby="validationError ? `error-${props.column.field}` : undefined"
                @keydown="handleKeydown"
                @close="handleSelectClose"
            />

            <!-- Input date -->
            <DateInput
                v-else-if="inputType === 'date'"
                ref="inputRef"
                :field="dateFieldConfig"
                :value="editValue"
                :error="!!validationError"
                :error-message="validationError"
                :disabled="!isEditable"
                class="w-full"
                :aria-invalid="!!validationError"
                :aria-describedby="validationError ? `error-${props.column.field}` : undefined"
                @update:value="handleDateValueUpdate"
                @change="handleDateChange"
                @keydown="handleKeydown"
                @blur="saveEdit"
            />

            <!-- Input datetime -->
            <input v-else-if="inputType === 'datetime'"
                   ref="inputRef"
                   type="datetime-local"
                   :value="datetimeValue"
                   @input="handleDatetimeInput"
                   @keydown="handleKeydown"
                   @blur="saveEdit"
                   class="edit-input"
                   :class="baseInputClasses" />

            <!-- Checkbox -->
            <input v-else-if="inputType === 'checkbox'"
                   ref="inputRef"
                   type="checkbox"
                   :checked="editValue"
                   @change="handleCheckboxChange"
                   @keydown="handleKeydown"
                   @blur="saveEdit"
                   class="edit-checkbox" />

            <!-- Textarea -->
            <textarea v-else-if="inputType === 'textarea'"
                      ref="inputRef"
                      :value="editValue"
                      @input="handleTextareaInput"
                      @keydown="handleKeydown"
                      @blur="saveEdit"
                      class="edit-textarea"
                      :class="baseInputClasses"
                      rows="3" />

            <!-- Fallback input texte avec TextInput -->
            <TextInput
                v-else
                ref="inputRef"
                :field="textFieldConfig"
                :value="editValue"
                :error="false"
                :disabled="!isEditable"
                class="w-full"
                @update:value="handleTextValueUpdate"
                @change="handleTextChange"
                @keydown="handleKeydown"
                @blur="saveEdit"
            />

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
import type { ComponentPublicInstance } from 'vue'
import SelectField from '@/components/Form/SelectField.vue'
import DateInput from '@/components/Form/fields/DateInput.vue'
import TextInput from '@/components/Form/fields/TextInput.vue'
import { logger } from '@/services/loggerService'
import type { FieldConfig } from '@/interfaces/form'

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
const inputRef = ref<HTMLElement | ComponentPublicInstance | null>(null)

// État local pour l'édition
const editValue = ref<any>(props.value)
const validationError = ref<string | null>(null)

// Classes Tailwind communes pour les champs d'édition
const baseInputClasses =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 ' +
    'disabled:bg-gray-100 disabled:text-gray-400 ' +
    'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400'

// Computed pour déterminer le type d'input
const inputType = computed(() => {
    const dataType = props.column.dataType || 'text'

    // Vérifier si c'est un select multiple
    if (dataType === 'select' && props.column.multiple) {
        return 'select'
    }

    return dataType
})

// Computed pour vérifier si la colonne est éditable
const isEditable = computed(() => {
    // Ne pas permettre l'édition des lignes enfants
    if (props.row.isChild) return false

    // Ne pas permettre l'édition des cellules avec données imbriquées
    if (props.column.nestedData) return false

    return props.column.editable !== false
})

const isMultiple = computed(() => {
    return props.column.dataType === 'select' && props.column.multiple
})

// Computed pour les options du select
const selectOptions = computed(() => {
    if (props.column.filterConfig?.options) {
        return props.column.filterConfig.options
    }

    // Options par défaut selon le type
    switch (props.column.field) {
        case 'team1':
        case 'team2':
            return [
                { value: 'Team A', label: 'Team A' },
                { value: 'Team B', label: 'Team B' },
                { value: 'Team C', label: 'Team C' },
                { value: 'Team D', label: 'Team D' },
                { value: 'Team E', label: 'Team E' }
            ]
        case 'status':
            return [
                { value: 'planifier', label: 'Planifier' },
                { value: 'affecter', label: 'Affecter' },
                { value: 'VALIDE', label: 'VALIDE' },
                { value: 'transfere', label: 'Transféré' }
            ]
        case 'resources':
            return [
                { value: 'Resource A', label: 'Resource A' },
                { value: 'Resource B', label: 'Resource B' },
                { value: 'Resource C', label: 'Resource C' },
                { value: 'Resource D', label: 'Resource D' },
                { value: 'Resource E', label: 'Resource E' }
            ]
        default:
            return []
    }
})

const selectPlaceholder = computed(() => {
    return props.column.editPlaceholder || 'Sélectionner...'
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

    // S'assurer que la valeur est toujours une string
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

const dateFieldConfig = computed<FieldConfig>(() => ({
    key: `datatable-date-${props.column.field || 'col'}`,
    label: props.column.headerName || props.column.field || 'Date',
    type: 'date',
    min: props.column.minDate || '1900-01-01',
    max: props.column.maxDate,
    props: {
        placeholder: props.column.editPlaceholder || 'Choisir une date',
        ...(props.column.dateProps || {})
    }
}))

const textFieldConfig = computed<FieldConfig>(() => ({
    key: `datatable-text-${props.column.field || 'col'}`,
    label: props.column.headerName || props.column.field || 'Texte',
    type: inputType.value === 'number' ? 'number' : 'text',
    props: {
        placeholder: props.column.editPlaceholder || 'Saisir une valeur',
        min: props.column.min,
        max: props.column.max,
        step: props.column.step,
        ...(props.column.inputProps || {})
    }
}))

const datetimeValue = computed(() => {
    if (!props.value) return ''

    try {
        const date = new Date(props.value)
        if (isNaN(date.getTime())) return ''
        return date.toISOString().slice(0, 16)
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
    if (!isEditable.value) return

    editValue.value = props.value
    if (inputType.value === 'date') {
        editValue.value = dateValue.value
    } else if (inputType.value === 'datetime') {
        editValue.value = datetimeValue.value
    }

    emit('start-edit')

    // Focus sur l'input après le rendu
    nextTick(() => {
        const element = inputRef.value
        if (!element) return

        if (element instanceof HTMLElement) {
            element.focus()
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                element.select()
            }
            return
        }

        const componentElement = (element as ComponentPublicInstance).$el as HTMLElement | undefined
        if (!componentElement) return
        const focusable = componentElement.querySelector('input, select, textarea, button')
        if (focusable instanceof HTMLElement) {
            focusable.focus()
            if (focusable instanceof HTMLInputElement || focusable instanceof HTMLTextAreaElement) {
                focusable.select()
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
    const finalValue = editValue.value

    // Validation complète avant sauvegarde
    const error = validateValue(finalValue)
    if (error) {
        validationError.value = error
        logger.warn('Validation échouée', { value: finalValue, error })
        return
    }

    // Validation basique pour nombre
    if (inputType.value === 'number' && isNaN(Number(finalValue))) {
        validationError.value = 'Veuillez entrer une valeur numérique valide'
        logger.warn('Valeur numérique invalide', finalValue)
        return
    }

    // Validation pour les dates
    if (inputType.value === 'date' && finalValue) {
        const date = new Date(finalValue)
        if (isNaN(date.getTime())) {
            validationError.value = 'Veuillez entrer une date valide'
            logger.warn('Date invalide', finalValue)
            return
        }
    }

    // Réinitialiser l'erreur si validation OK
    validationError.value = null

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
    validationError.value = null
    emit('cancel-edit')
}

// Fonction de validation
const validateValue = (value: any): string | null => {
    const validation = props.column.validation
    if (!validation) return null

    // Validation required
    if (validation.required && (value === null || value === undefined || value === '')) {
        return 'Ce champ est obligatoire'
    }

    // Validation min/max pour nombres
    if (inputType.value === 'number' && typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
            return `La valeur doit être supérieure ou égale à ${validation.min}`
        }
        if (validation.max !== undefined && value > validation.max) {
            return `La valeur doit être inférieure ou égale à ${validation.max}`
        }
    }

    // Validation pattern (regex)
    if (validation.pattern && typeof value === 'string') {
        const regex = new RegExp(validation.pattern)
        if (!regex.test(value)) {
            return 'Le format de la valeur est invalide'
        }
    }

    // Validation custom
    if (validation.custom) {
        const result = validation.custom(value)
        if (result !== true) {
            return typeof result === 'string' ? result : 'La valeur est invalide'
        }
    }

    return null
}

// Handlers pour les différents types d'inputs
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newValue = inputType.value === 'number' ? Number(target.value) : target.value
    editValue.value = newValue
    
    // Validation en temps réel
    validationError.value = validateValue(newValue)
}

const handleDateValueUpdate = (value: unknown) => {
    editValue.value = value
}

const handleDateChange = () => {
    saveEdit()
}

const handleTextValueUpdate = (value: unknown) => {
    const newValue = inputType.value === 'number' ? Number(value) : value
    editValue.value = newValue
    
    // Validation en temps réel
    validationError.value = validateValue(newValue)
}

const handleTextChange = () => {
    // Ne pas sauvegarder automatiquement sur change pour text/number
    // La sauvegarde se fait sur blur ou Enter
}

const handleDatetimeInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    editValue.value = target.value
}

const handleCheckboxChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    editValue.value = target.checked
}

const handleTextareaInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    editValue.value = target.value
}

const handleSelectClose = () => {
    if (props.isEditing) {
        saveEdit()
    }
}

// Watcher pour synchroniser la valeur d'édition avec les props
watch(() => props.value, (newValue) => {
    if (!props.isEditing) {
        editValue.value = newValue
        validationError.value = null
    }
})

// Watcher pour réinitialiser quand l'édition s'arrête
watch(() => props.isEditing, (isEditing) => {
    if (!isEditing) {
        editValue.value = props.value
        validationError.value = null
    }
})

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
</script>

<style scoped>
.editable-cell {
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

.cell-display.editable:hover::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(14, 165, 233, 0.05) 50%, transparent 70%);
    border-radius: 0.375rem;
    pointer-events: none;
}

.dark .cell-display:hover {
    background-color: #2d3748;
    border-color: #4a5568;
}

.dark .cell-display.editable:hover {
    background-color: #1e3a8a;
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.dark .cell-display.editable:hover::before {
    background: linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%);
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

.dark .edit-icon:hover {
    background-color: #4a5568;
    color: #f7fafc;
}

.cell-edit {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0.25rem;
}

.edit-input,
.edit-select,
.edit-textarea {
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

.dark .edit-input,
.dark .edit-select,
.dark .edit-textarea {
    background-color: #1a202c;
    border-color: #4a5568;
    color: #f7fafc;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.edit-input:focus,
.edit-select:focus,
.edit-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.dark .edit-input:focus,
.dark .edit-select:focus,
.dark .edit-textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2), 0 4px 6px rgba(0, 0, 0, 0.3);
}

.edit-input-number {
    text-align: right;
    font-family: 'Courier New', monospace;
    font-weight: 600;
}

.edit-checkbox {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: var(--color-primary);
    cursor: pointer;
    transform: scale(1.2);
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

.dark .selected-items {
    background-color: #2d3748;
    border-color: #4a5568;
}

.selected-item {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
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

.dark .selected-item {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: #111827;
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

.dark .edit-actions {
    background: linear-gradient(135deg, #1a202c, #2d3748);
    border-color: #4a5568;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
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

/* Animation d'entrée pour les actions */
.edit-actions {
    animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Styles pour les cellules non éditables */
.editable-cell:not(.editable) .cell-display {
    cursor: default;
}

.editable-cell:not(.editable) .cell-display:hover {
    background-color: transparent;
    border-color: transparent;
}

.editable-cell:not(.editable) .edit-icon {
    display: none;
}

/* Amélioration pour les selects */
.edit-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
}

.dark .edit-select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23f7fafc' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
}

/* Amélioration pour les textareas */
.edit-textarea {
    resize: vertical;
    min-height: 3rem;
    font-family: inherit;
    line-height: 1.5;
}

/* Indicateur de focus amélioré */
.edit-input:focus::placeholder,
.edit-textarea:focus::placeholder {
    color: #9ca3af;
    transition: color 0.2s ease;
}

/* Styles pour les messages d'erreur de validation */
.validation-error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    color: #dc2626;
    font-size: 0.875rem;
    animation: slideDown 0.2s ease-out;
}

.dark .validation-error-message {
    background-color: #7f1d1d;
    border-color: #991b1b;
    color: #fca5a5;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Animation pour les changements de valeur */
.cell-display {
    transition: all 0.3s ease;
}

.cell-display.updated {
    animation: highlightUpdate 0.6s ease-out;
}

@keyframes highlightUpdate {
    0% {
        background-color: var(--color-primary);
        transform: scale(1.02);
    }
    50% {
        background-color: var(--color-primary-light);
        transform: scale(1.01);
    }
    100% {
        background-color: transparent;
        transform: scale(1);
    }
}

/* Responsive design */
@media (max-width: 640px) {
    .edit-actions {
        position: fixed;
        top: auto;
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
        justify-content: center;
        z-index: 50;
    }

    .cell-display {
        padding: 0.375rem;
    }

    .edit-input,
    .edit-select,
    .edit-textarea {
        padding: 0.375rem 0.5rem;
        font-size: 1rem;
    }
}
</style>
