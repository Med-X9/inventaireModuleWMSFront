<template>
    <div class="safe-editable-cell">
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
            <input ref="inputRef"
                   :type="inputType"
                   :value="editValue"
                   @input="handleInput"
                   @keydown="handleKeydown"
                   @blur="saveEdit"
                   class="edit-input"
                   :class="inputClass" />

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

// Computed pour déterminer le type d'input
const inputType = computed(() => {
    const dataType = props.column.dataType || 'text'
    return dataType === 'number' ? 'number' : 'text'
})

// Computed pour vérifier si la colonne est éditable
const isEditable = computed(() => {
    // Vérifications de sécurité
    if (props.row.isChild) return false
    if (props.column.nestedData) return false
    if (props.column.field === 'id') return false
    if (props.column.field === 'created_at') return false
    if (props.column.field === 'updated_at') return false

    return props.column.editable !== false
})

// Computed pour la valeur d'affichage
const displayValue = computed(() => {
    let value: any

    if (props.column.valueFormatter) {
        value = props.column.valueFormatter({ value: props.value, data: props.row })
    } else {
        value = props.value
    }

    return String(value || '')
})

// Computed pour les classes CSS de l'input
const inputClass = computed(() => {
    const classes = ['edit-input']

    if (inputType.value === 'number') {
        classes.push('edit-input-number')
    }

    return classes.join(' ')
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
    emit('start-edit')

    // Focus sur l'input après le rendu
    nextTick(() => {
        if (inputRef.value) {
            inputRef.value.focus()
            if (inputRef.value instanceof HTMLInputElement) {
                inputRef.value.select()
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

    // Validation basique
    if (inputType.value === 'number' && isNaN(Number(finalValue))) {
        logger.warn('Valeur numérique invalide', finalValue)
        return
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
    emit('cancel-edit')
}

// Handlers pour les inputs
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    editValue.value = inputType.value === 'number' ? Number(target.value) : target.value
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
    }
})
</script>

<style scoped>
.safe-editable-cell {
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

.edit-input {
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

.edit-input:focus {
    outline: none;
    border-color: #FECD1C;
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.edit-input-number {
    text-align: right;
    font-family: 'Courier New', monospace;
    font-weight: 600;
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
.safe-editable-cell:not(.editable) .cell-display {
    cursor: default;
}

.safe-editable-cell:not(.editable) .cell-display:hover {
    background-color: transparent;
    border-color: transparent;
}

.safe-editable-cell:not(.editable) .edit-icon {
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

.dark .edit-input {
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
</style>
