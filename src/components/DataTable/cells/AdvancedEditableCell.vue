<template>
    <div class="advanced-editable-cell" :class="{ 'is-editing': isEditing }">
        <!-- Mode affichage -->
        <div v-if="!isEditing" class="cell-display" :class="{ 'editable': isEditable }" @dblclick.stop="handleDoubleClick">
            <span v-if="containsHTML(displayValue)" v-html="displayValue"></span>
            <span v-else>{{ displayValue }}</span>
            <button v-if="isEditable" class="edit-icon" @click.stop="startEdit" title="Double-clic pour éditer">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
        </div>

        <!-- Mode édition -->
        <div v-else class="cell-edit" @click.stop @mousedown.stop>
            <!-- Select simple avec recherche -->
            <SelectField
                v-if="inputType === 'select'"
                    ref="inputRef"
                :model-value="editValue"
                :options="selectOptions"
                :searchable="true"
                :clearable="true"
                :placeholder="getSelectPlaceholder()"
                @update:model-value="handleSelectFieldChange"
                    @keydown="handleKeydown"
                @blur="handleSelectBlur"
                @mousedown.stop="handleSelectMouseDown"
                @click.stop="handleSelectClick"
                @open="handleSelectOpen"
                @close="handleSelectClose"
                class="edit-select-field"
            />

            <!-- Input date avec composant DateInput -->
            <DateInput
                v-else-if="inputType === 'date'"
                   ref="inputRef"
                :field="{ key: props.column.field, label: props.column.headerName || props.column.field, type: 'date', props: {} }"
                   :value="dateValue"
                :error="false"
                :disabled="false"
                @update:value="handleDateInputChange"
                @change="handleDateChange"
                   @keydown="handleKeydown"
                   @blur="saveEdit"
                class="edit-date-input"
            />

            <!-- Input texte par défaut -->
            <input
                v-else
                ref="inputRef"
                type="text"
                :value="editValue"
                @input="handleInput"
                @keydown="handleKeydown"
                @blur="saveEdit"
                @click.stop
                @mousedown.stop
                class="edit-input" />

            <!-- Boutons d'action -->
            <div class="edit-actions">
                <button @click="saveEdit" class="save-btn" title="Sauvegarder (Entrée)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                <button @click.stop="cancelEdit" class="cancel-btn" title="Annuler (Échap)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { logger } from '@/services/loggerService'
import SelectField from '@/components/Form/SelectField.vue'
import DateInput from '@/components/Form/fields/DateInput.vue'
import type { SelectOption } from '@/interfaces/form'

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

// Délai pour gérer le blur sur les selects (évite la fermeture prématurée)
const blurTimeout = ref<number | null>(null)

// État pour savoir si le dropdown est ouvert
const isDropdownOpen = ref(false)

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

// Computed pour les options du select (format SelectOption[])
const selectOptions = computed((): SelectOption[] => {
    if (props.column.filterConfig?.options) {
        return props.column.filterConfig.options.map((opt: any) => {
            if (typeof opt === 'string') {
                return { label: opt, value: opt }
            }
            return opt
        })
    }
    return []
})

// Computed pour la valeur d'affichage
const displayValue = computed(() => {
    let value: any

    // Priorité 1 : Utiliser cellRenderer si disponible (pour les badges, etc.)
    if (props.column.cellRenderer && typeof props.column.cellRenderer === 'function') {
        try {
            value = props.column.cellRenderer(props.value, props.column, props.row)
            // Si le cellRenderer retourne du HTML, le retourner tel quel
            if (typeof value === 'string' && value.includes('<')) {
                return value
            }
        } catch (error) {
            logger.warn('Erreur dans cellRenderer', error)
        }
    }

    // Priorité 2 : Utiliser valueFormatter si disponible
    if (props.column.valueFormatter) {
        value = props.column.valueFormatter({ value: props.value, data: props.row })
    } else if (props.column.editValueFormatter) {
        value = props.column.editValueFormatter(props.value, props.row)
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

// Fonction pour gérer le clic simple sur la cellule (ne fait rien pour éviter les conflits)
const handleClick = () => {
    // Ne rien faire sur un simple clic pour éviter les conflits avec la sélection de ligne
}

// Fonction pour gérer le double-clic sur la cellule
const handleDoubleClick = () => {
    if (isEditable.value) {
        startEdit()
    }
}

// Fonction pour sauvegarder l'édition
const saveEdit = () => {
    const finalValue = editValue.value

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
    emit('cancel-edit')
}

// Fonction pour obtenir le placeholder du select
const getSelectPlaceholder = () => {
    if (props.column.editValueFormatter) {
        return props.column.editValueFormatter(editValue.value, props.row)
    }
    if (!editValue.value || editValue.value === '') {
        return 'Sélectionner...'
    }
    return String(editValue.value)
}

// Handlers pour les différents types d'inputs
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    editValue.value = target.value
}

// Handler pour SelectField (select simple)
const handleSelectFieldChange = (value: string | number | string[] | number[] | null) => {
    editValue.value = value
    // Annuler le blur timeout s'il existe
    if (blurTimeout.value !== null) {
        clearTimeout(blurTimeout.value)
        blurTimeout.value = null
    }
    // Sauvegarder après un court délai pour permettre au dropdown de se fermer
    setTimeout(() => {
        saveEdit()
    }, 150)
}

// Handler pour DateInput
const handleDateInputChange = (value: unknown) => {
    editValue.value = value
}

const handleDateChange = () => {
    // Sauvegarder après le changement de date
    setTimeout(() => {
        saveEdit()
    }, 100)
}

// handleSelectChange est remplacé par handleSelectFieldChange pour utiliser SelectField

// Gérer le mousedown sur le select pour éviter la fermeture prématurée
const handleSelectMouseDown = (event?: Event) => {
    // Empêcher la propagation de l'événement vers le parent
    if (event) {
        event.stopPropagation()
    }
    // Annuler le blur timeout si l'utilisateur clique sur le select
    if (blurTimeout.value !== null) {
        clearTimeout(blurTimeout.value)
        blurTimeout.value = null
    }
}

// Gérer le blur sur le select avec un délai pour permettre la sélection
const handleSelectBlur = () => {
    // Ne pas sauvegarder si le dropdown est ouvert
    if (isDropdownOpen.value) {
        return
    }
    // Pour les selects, attendre un peu avant de sauvegarder pour permettre la sélection
    if (blurTimeout.value !== null) {
        clearTimeout(blurTimeout.value)
    }
    blurTimeout.value = window.setTimeout(() => {
        // Vérifier à nouveau si le dropdown est ouvert avant de sauvegarder
        if (!isDropdownOpen.value) {
        saveEdit()
        }
        blurTimeout.value = null
    }, 200)
}

// Gérer l'ouverture du dropdown
const handleSelectOpen = () => {
    isDropdownOpen.value = true
    // Annuler le blur timeout si le dropdown s'ouvre
    if (blurTimeout.value !== null) {
        clearTimeout(blurTimeout.value)
        blurTimeout.value = null
    }
    
    // Attendre un peu puis déplacer le dropdown dans le body
    setTimeout(() => {
        moveDropdownToBody()
        // Vérifier périodiquement pendant 2 secondes
        let attempts = 0
        const checkInterval = setInterval(() => {
            attempts++
            moveDropdownToBody()
            if (attempts >= 20 || dropdownMenuElement) {
                clearInterval(checkInterval)
            }
        }, 100)
    }, 50)
}

// Gérer la fermeture du dropdown
const handleSelectClose = () => {
    isDropdownOpen.value = false
    // Remettre le dropdown à sa place originale
    restoreDropdown()
    // Sauvegarder après la fermeture du dropdown
    setTimeout(() => {
        if (!isDropdownOpen.value) {
            saveEdit()
        }
    }, 100)
}

// Gérer le clic sur le select pour éviter la fermeture prématurée
const handleSelectClick = (event?: Event) => {
    if (event) {
        event.stopPropagation()
    }
    // Annuler le blur timeout si l'utilisateur clique sur le select
    if (blurTimeout.value !== null) {
        clearTimeout(blurTimeout.value)
        blurTimeout.value = null
    }
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
        isDropdownOpen.value = false
        // Remettre le dropdown à sa place originale
        restoreDropdown()
        // Annuler le blur timeout si l'édition s'arrête
        if (blurTimeout.value !== null) {
            clearTimeout(blurTimeout.value)
            blurTimeout.value = null
        }
        // Arrêter l'observer
        if (dropdownObserver) {
            dropdownObserver.disconnect()
            dropdownObserver = null
        }
        // Arrêter l'interval de vérification
        if (dropdownCheckInterval) {
            clearInterval(dropdownCheckInterval)
            dropdownCheckInterval = null
        }
        window.removeEventListener('scroll', repositionDropdown)
        window.removeEventListener('resize', repositionDropdown)
    } else {
        // Quand l'édition commence, observer le DOM pour détecter le dropdown
        nextTick(() => {
            observeDropdown()
            // Repositionner périodiquement pour s'assurer que le dropdown est bien positionné
            const intervalId = setInterval(() => {
                if (props.isEditing && isDropdownOpen.value) {
                    repositionDropdown()
                } else {
                    clearInterval(intervalId)
                }
            }, 100)
            
            // Nettoyer l'interval après 5 secondes
            setTimeout(() => {
                clearInterval(intervalId)
            }, 5000)
        })
    }
})

// MutationObserver pour détecter l'ajout du dropdown au DOM
let dropdownObserver: MutationObserver | null = null
let dropdownMenuElement: HTMLElement | null = null
let originalParent: HTMLElement | null = null

// Fonction pour déplacer le dropdown dans le body
const moveDropdownToBody = () => {
    if (!inputRef.value) return
    
    const selectElement = inputRef.value as HTMLElement
    
    // Chercher le dropdown dans le selectElement et tous ses parents
    let dropdownMenu = selectElement.querySelector('.vs__dropdown-menu') as HTMLElement
    
    // Si pas trouvé, chercher dans le document entier (y compris dans les conteneurs avec overflow)
    if (!dropdownMenu) {
        // Chercher tous les dropdowns visibles
        const allDropdowns = document.querySelectorAll('.vs__dropdown-menu:not([data-moved-to-body])') as NodeListOf<HTMLElement>
        for (const dropdown of allDropdowns) {
            // Vérifier si ce dropdown est lié à notre select (en vérifiant la position)
            const rect = selectElement.getBoundingClientRect()
            const dropdownRect = dropdown.getBoundingClientRect()
            // Si le dropdown est proche du select, c'est probablement le nôtre
            if (Math.abs(dropdownRect.left - rect.left) < 50 && dropdownRect.top > rect.top) {
                dropdownMenu = dropdown
                break
            }
        }
    }
    
    // Si toujours pas trouvé, prendre le premier dropdown visible
    if (!dropdownMenu) {
        dropdownMenu = document.querySelector('.vs__dropdown-menu:not([data-moved-to-body])') as HTMLElement
    }
    
    if (dropdownMenu && !dropdownMenu.hasAttribute('data-moved-to-body')) {
        // Sauvegarder le parent original
        originalParent = dropdownMenu.parentElement
        
        // Obtenir la position du select par rapport au viewport
        const rect = selectElement.getBoundingClientRect()
        
        // Déplacer le dropdown dans le body
        document.body.appendChild(dropdownMenu)
        dropdownMenu.setAttribute('data-moved-to-body', 'true')
        dropdownMenuElement = dropdownMenu
        
        // Positionner le dropdown en position fixed par rapport au viewport
        dropdownMenu.style.cssText = `
            position: fixed !important;
            top: ${rect.bottom}px !important;
            left: ${rect.left}px !important;
            width: ${rect.width}px !important;
            z-index: 99999 !important;
            transform: translateZ(0) !important;
            max-height: calc(3 * 2.5rem + 1rem) !important;
            overflow-y: auto !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: block !important;
            background-color: white !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            padding: 0.5rem 0 !important;
        `
        
        logger.debug('Dropdown déplacé dans le body', {
            top: dropdownMenu.style.top,
            left: dropdownMenu.style.left,
            zIndex: dropdownMenu.style.zIndex
        })
    }
}

// Fonction pour remettre le dropdown à sa place originale
const restoreDropdown = () => {
    if (dropdownMenuElement && originalParent) {
        originalParent.appendChild(dropdownMenuElement)
        dropdownMenuElement.removeAttribute('data-moved-to-body')
        dropdownMenuElement = null
        originalParent = null
    }
}

// Fonction pour repositionner le dropdown avec position fixed
const repositionDropdown = () => {
    if (!inputRef.value) return
    
    const selectElement = inputRef.value as HTMLElement
    
    // Si le dropdown est déjà dans le body, juste le repositionner
    if (dropdownMenuElement) {
        const rect = selectElement.getBoundingClientRect()
        dropdownMenuElement.style.top = `${rect.bottom}px`
        dropdownMenuElement.style.left = `${rect.left}px`
        dropdownMenuElement.style.width = `${rect.width}px`
        return
    }
    
    // Sinon, essayer de le déplacer dans le body
    moveDropdownToBody()
}

// Interval pour vérifier périodiquement le dropdown
let dropdownCheckInterval: number | null = null

// Fonction pour observer les changements du DOM et déplacer le dropdown dans le body
const observeDropdown = () => {
    if (!inputRef.value) return
    
    const selectElement = inputRef.value as HTMLElement
    
    // Arrêter l'observer existant s'il y en a un
    if (dropdownObserver) {
        dropdownObserver.disconnect()
    }
    
    // Arrêter l'interval existant s'il y en a un
    if (dropdownCheckInterval) {
        clearInterval(dropdownCheckInterval)
    }
    
    // Créer un nouvel observer pour détecter l'ajout du dropdown
    dropdownObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                // Vérifier si un dropdown a été ajouté
                const hasDropdown = Array.from(mutation.addedNodes).some((node) => {
                    if (node instanceof HTMLElement) {
                        return node.classList.contains('vs__dropdown-menu') || 
                               node.querySelector('.vs__dropdown-menu') !== null
                    }
                    return false
                })
                
                if (hasDropdown) {
                    nextTick(() => {
                        moveDropdownToBody()
                    })
                }
            }
        })
    })
    
    // Observer les changements dans le conteneur du select et dans le body
    dropdownObserver.observe(selectElement, {
        childList: true,
        subtree: true
    })
    
    // Observer aussi le body car vue-select peut porter le dropdown
    dropdownObserver.observe(document.body, {
        childList: true,
        subtree: true
    })
    
    // Vérifier périodiquement toutes les 50ms pendant 2 secondes
    let attempts = 0
    dropdownCheckInterval = window.setInterval(() => {
        attempts++
        if (!dropdownMenuElement) {
            moveDropdownToBody()
        }
        if (attempts >= 40 || dropdownMenuElement) {
            if (dropdownCheckInterval) {
                clearInterval(dropdownCheckInterval)
                dropdownCheckInterval = null
            }
        }
    }, 50)
}

// Watcher pour repositionner le dropdown quand il s'ouvre
watch(() => isDropdownOpen.value, (isOpen) => {
    if (isOpen) {
        nextTick(() => {
            repositionDropdown()
            // Repositionner aussi lors du scroll ou resize
            window.addEventListener('scroll', repositionDropdown, { passive: true })
            window.addEventListener('resize', repositionDropdown, { passive: true })
        })
    } else {
        window.removeEventListener('scroll', repositionDropdown)
        window.removeEventListener('resize', repositionDropdown)
    }
})

// Nettoyer les event listeners au démontage
onUnmounted(() => {
    window.removeEventListener('scroll', repositionDropdown)
    window.removeEventListener('resize', repositionDropdown)
    if (dropdownObserver) {
        dropdownObserver.disconnect()
        dropdownObserver = null
    }
    if (dropdownCheckInterval) {
        clearInterval(dropdownCheckInterval)
        dropdownCheckInterval = null
    }
    // Remettre le dropdown à sa place originale avant le démontage
    restoreDropdown()
})
</script>

<style scoped>
.advanced-editable-cell {
    position: relative;
    width: 100%;
    height: 100%;
}

.advanced-editable-cell.is-editing {
    z-index: 10000;
    position: relative;
    overflow: visible !important;
    /* Créer un nouveau contexte de stacking pour le dropdown */
    isolation: isolate;
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
    z-index: 10000;
    isolation: isolate;
    /* Permettre au dropdown de dépasser les limites de la cellule */
    overflow: visible !important;
}

.edit-input,
.edit-select-field,
.edit-date-input {
    width: 100%;
    font-size: 0.875rem;
    position: relative;
    z-index: 10000;
}

.edit-select-field {
    position: relative;
    z-index: 10000;
}

.edit-select-field :deep(.vs__dropdown-toggle) {
    min-height: 2.5rem;
    padding: 0.5rem 0.75rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    background-color: white;
    color: #374151;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10000;
}

/* Dropdown menu avec position fixed pour être au-dessus de tout */
/* Utiliser un portal ou position fixed par rapport au viewport */
/* Limiter à 3 options visibles avec scroll */
.edit-select-field :deep(.vs__dropdown-menu),
body .vs__dropdown-menu[data-moved-to-body] {
    z-index: 99999 !important;
    position: fixed !important;
    /* Calculer la hauteur pour exactement 3 options : 
       - Chaque option fait environ 2.5rem (40px) avec padding
       - 3 options = 7.5rem (120px)
       - Padding du menu : 0.5rem top + 0.5rem bottom = 1rem (16px)
       - Total : ~8.5rem (136px) */
    max-height: calc(3 * 2.5rem + 1rem) !important;
    overflow-y: auto !important;
    /* S'assurer que le dropdown n'est pas coupé par les conteneurs parents */
    transform: translateZ(0) !important;
    will-change: transform !important;
    /* Forcer l'affichage même si le parent a overflow */
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
    /* Forcer le background et les styles */
    background-color: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 0.5rem !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

.edit-select-field :deep(.vs__dropdown) {
    z-index: 99999 !important;
    position: fixed !important;
    /* S'assurer que le dropdown n'est pas coupé par les conteneurs parents */
    transform: translateZ(0) !important;
    will-change: transform !important;
    /* Forcer l'affichage même si le parent a overflow */
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
}

/* S'assurer que le conteneur parent du dropdown n'a pas d'overflow qui le coupe */
.edit-select-field :deep(.v-select) {
    overflow: visible !important;
}

.edit-select-field :deep(.vs__dropdown-toggle) {
    overflow: visible !important;
}

/* Assurer que le SelectField ouvert a un z-index élevé */
.edit-select-field :deep(.vs--open) {
    z-index: 10000 !important;
    position: relative !important;
    /* Permettre au dropdown de dépasser les limites */
    overflow: visible !important;
}

/* Assurer que le conteneur du SelectField a un z-index élevé */
.edit-select-field :deep(.v-select) {
    position: relative;
    z-index: 10000;
    /* Permettre au dropdown de dépasser les limites */
    overflow: visible !important;
}

.edit-select-field :deep(.v-select.vs--open) {
    z-index: 10000 !important;
    /* Permettre au dropdown de dépasser les limites */
    overflow: visible !important;
}

/* S'assurer que le conteneur du dropdown est visible quand ouvert */
.edit-select-field :deep(.v-select.vs--open .vs__dropdown-menu) {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    /* Limiter à 3 options visibles avec scroll */
    max-height: calc(3 * 2.5rem + 1rem) !important;
    overflow-y: auto !important;
}

/* Style pour les options du dropdown - assurer une hauteur cohérente */
.edit-select-field :deep(.vs__dropdown-option) {
    padding: 0.5rem 1rem;
    min-height: 2.5rem;
    display: flex;
    align-items: center;
}

/* Style pour le champ de recherche dans le dropdown */
.edit-select-field :deep(.vs__search) {
    padding: 0.5rem 0.75rem;
    margin: 0;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
}

/* Assurer que le scroll fonctionne correctement */
.edit-select-field :deep(.vs__dropdown-menu) {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
}

.edit-select-field :deep(.vs__dropdown-menu::-webkit-scrollbar) {
    width: 6px;
}

.edit-select-field :deep(.vs__dropdown-menu::-webkit-scrollbar-track) {
    background: #f1f5f9;
    border-radius: 3px;
}

.edit-select-field :deep(.vs__dropdown-menu::-webkit-scrollbar-thumb) {
    background: #cbd5e1;
    border-radius: 3px;
}

.edit-select-field :deep(.vs__dropdown-menu::-webkit-scrollbar-thumb:hover) {
    background: #94a3b8;
}

.edit-select-field :deep(.vs__dropdown-toggle):focus-within {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.edit-date-input :deep(input) {
    padding: 0.5rem 0.75rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    background-color: white;
    color: #374151;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.edit-date-input :deep(input):focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.edit-input {
    padding: 0.5rem 0.75rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    background-color: white;
    color: #374151;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.edit-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

/* Styles pour SelectField */

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
    z-index: 10001;
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
.dark .edit-select-field :deep(.vs__dropdown-toggle),
.dark .edit-date-input :deep(input) {
    background-color: #1a202c;
    border-color: #4a5568;
    color: #f7fafc;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .edit-select-field :deep(.vs__dropdown-toggle):focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 4px 6px rgba(0, 0, 0, 0.3);
}

.dark .edit-date-input :deep(input):focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 4px 6px rgba(0, 0, 0, 0.3);
}

.dark .edit-actions {
    background: linear-gradient(135deg, #1a202c, #2d3748);
    border-color: #4a5568;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

</style>
