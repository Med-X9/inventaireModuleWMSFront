<template>
    <div class="filter-dropdown" v-if="isVisible">
        <!-- Header avec icône et titre -->
        <div class="filter-header">
            <div class="filter-title-section">
                <div class="filter-icon">
                    <IconFilter class="w-4 h-4" />
                </div>
                <span class="filter-title">Filtrer {{ column.headerName || column.field }}</span>
            </div>
            <button @click="$emit('close')" class="close-btn" title="Fermer">
                <IconX class="w-4 h-4" />
            </button>
        </div>

        <!-- Filtre select avec checkboxes (comportement Excel) - Affiché en premier si c'est un filtre select -->
        <div v-if="isSelectFilter" class="filter-section">
            <label class="filter-label">
                <IconSearch class="w-3 h-3" />
                Sélectionner les valeurs
            </label>
            <div class="filter-input-group">
                <div class="select-filter-list">
                    <div v-if="columnOptions.length === 0" class="no-options-message">
                        <IconInfoCircle class="w-4 h-4" />
                        <span>Aucune option disponible</span>
                    </div>
                    <div v-else class="options-checkbox-list">
                        <label
                            v-for="option in columnOptions"
                            :key="option.value"
                            class="option-checkbox-item"
                        >
                            <input
                                type="checkbox"
                                :value="option.value"
                                :checked="isValueSelected(option.value)"
                                @change="toggleSelectValue(option.value)"
                                class="option-checkbox"
                            />
                            <span class="option-label">{{ option.label }}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sélection de l'opérateur avec icônes (masqué pour les filtres select) -->
        <div v-if="!isSelectFilter" class="filter-section">
            <label class="filter-label">
                <IconSettings class="w-3 h-3" />
                Opérateur
            </label>
            <select v-model="selectedOperator" class="filter-select" @change="onOperatorChange">
                <option v-for="op in availableOperators" :key="op.value" :value="op.value">
                    {{ op.label }}
                </option>
            </select>
        </div>

        <!-- Champs de valeur selon l'opérateur -->
        <div v-if="!isSelectFilter" class="filter-section">
            <label class="filter-label">
                <IconSearch class="w-3 h-3" />
                Valeur
            </label>

            <!-- Filtre entre deux valeurs (doit être en premier) -->
            <div v-if="isBetweenFilter" class="filter-input-group">
                <div class="between-inputs">
                    <input
                        v-model="filterValue"
                        :type="props.column.dataType === 'date' || props.column.dataType === 'datetime' ? 'date' : getInputType()"
                        class="filter-input"
                        :placeholder="'Valeur min'"
                        @keyup.enter="applyFilter"
                    />
                    <span class="between-separator">
                        <IconPlus class="w-3 h-3" />
                    </span>
                    <input
                        v-model="filterValue2"
                        :type="props.column.dataType === 'date' || props.column.dataType === 'datetime' ? 'date' : getInputType()"
                        class="filter-input"
                        :placeholder="'Valeur max'"
                        @keyup.enter="applyFilter"
                    />
                </div>
            </div>

            <!-- Filtre texte -->
            <div v-else-if="isTextFilter" class="filter-input-group">
                <input
                    v-model="filterValue"
                    :type="getInputType()"
                    class="filter-input"
                    :placeholder="getPlaceholder()"
                    @keyup.enter="applyFilter"
                />
            </div>

            <!-- Filtre nombre -->
            <div v-else-if="isNumberFilter" class="filter-input-group">
                <input
                    v-model="filterValue"
                    :type="getInputType()"
                    class="filter-input"
                    :placeholder="getPlaceholder()"
                    @keyup.enter="applyFilter"
                />
            </div>

            <!-- Filtre date -->
            <div v-else-if="isDateFilter" class="filter-input-group">
                <input
                    v-model="filterValue"
                    :type="getInputType()"
                    class="filter-input"
                    @change="applyFilter"
                />
            </div>

            <!-- Filtre liste -->
            <div v-else-if="isListFilter" class="filter-input-group">
                <div class="list-input-container">
                    <div v-for="(item, index) in listValues" :key="index" class="list-item">
                        <input
                            v-model="listValues[index]"
                            :type="getInputType()"
                            class="filter-input list-input"
                            :placeholder="`Valeur ${index + 1}`"
                            @keyup.enter="addListItem"
                        />
                        <button @click="removeListItem(index)" class="remove-btn" title="Supprimer">
                            <IconX class="w-3 h-3" />
                        </button>
                    </div>
                    <button @click="addListItem" class="add-btn" title="Ajouter une valeur">
                        <IconPlus class="w-3 h-3" />
                        Ajouter
                    </button>
                </div>
            </div>

            <!-- Filtre email -->
            <div v-else-if="isEmailFilter" class="filter-input-group">
                <input
                    v-model="filterValue"
                    :type="getInputType()"
                    class="filter-input"
                    :placeholder="getPlaceholder()"
                    @keyup.enter="applyFilter"
                />
            </div>

            <!-- Filtre URL -->
            <div v-else-if="isUrlFilter" class="filter-input-group">
                <input
                    v-model="filterValue"
                    :type="getInputType()"
                    class="filter-input"
                    :placeholder="getPlaceholder()"
                    @keyup.enter="applyFilter"
                />
            </div>

            <!-- Filtre téléphone -->
            <div v-else-if="isPhoneFilter" class="filter-input-group">
                <input
                    v-model="filterValue"
                    :type="getInputType()"
                    class="filter-input"
                    :placeholder="getPlaceholder()"
                    @keyup.enter="applyFilter"
                />
            </div>

            <!-- Filtre booléen -->
            <div v-else-if="isBooleanFilter" class="filter-input-group">
                <select v-model="filterValue" class="filter-select" @change="applyFilter">
                    <option value="">Sélectionner</option>
                    <option value="true">Vrai</option>
                    <option value="false">Faux</option>
                </select>
            </div>

            <!-- Filtre null/vide -->
            <div v-else-if="isNullFilter" class="filter-input-group">
                <div class="null-filter-info">
                    <IconInfoCircle class="w-4 h-4" />
                    <span>Ce filtre ne nécessite pas de valeur</span>
                </div>
            </div>
        </div>

        <!-- Actions avec animations -->
        <div class="filter-actions">
            <button @click="applyFilter" class="apply-btn" :disabled="!canApplyFilter">
                <IconCheck class="w-4 h-4" />
                Appliquer
            </button>
            <button @click="clearFilter" class="clear-btn">
                <IconX class="w-4 h-4" />
                Effacer
            </button>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    inheritAttrs: false
}
</script>

<script setup lang="ts">
import { ref, computed, watch, inject, toRef, type ComputedRef } from 'vue'
import IconX from '../icon/icon-x.vue'
import IconCheck from '../icon/icon-check.vue'
import IconPlus from '../icon/icon-plus.vue'
import IconInfoCircle from '../icon/icon-info-circle.vue'
import IconFilter from '../icon/icon-filter.vue'
import IconSettings from '../icon/icon-settings.vue'
import IconSearch from '../icon/icon-search.vue'
import type { DataTableColumn, FilterOperator, ColumnDataType } from '@/types/dataTable'

interface Props {
    column: DataTableColumn
    isVisible: boolean
    currentFilter?: any
}

const props = defineProps<Props>()

// Injecter les données de la table depuis le parent (évite le rendu comme attribut HTML)
const tableDataComputed = inject<ComputedRef<any[]>>('tableData', computed(() => []))
const tableData = computed(() => {
    const data = tableDataComputed.value
    return Array.isArray(data) ? data : []
})
const emit = defineEmits<{
    close: []
    apply: [filter: any]
    clear: []
}>()

// État local
const selectedOperator = ref<FilterOperator>('equals')
const filterValue = ref('')
const filterValue2 = ref('')
const listValues = ref<string[]>([''])
const selectedSelectValues = ref<Set<any>>(new Set()) // Pour les filtres select avec checkboxes

// Computed pour les options booléennes
const booleanOptions = computed(() => [
    { value: 'true', label: 'Vrai' },
    { value: 'false', label: 'Faux' }
])

// Opérateurs disponibles selon le type de colonne
const availableOperators = computed(() => {
    const dataType = props.column.dataType || 'text'

    const operatorsByType: Record<string, Array<{ value: FilterOperator; label: string }>> = {
        text: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'not_contains', label: 'Ne contient pas' },
            { value: 'starts_with', label: 'Commence par' },
            { value: 'ends_with', label: 'Termine par' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        number: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'greater_than', label: 'Supérieur à' },
            { value: 'less_than', label: 'Inférieur à' },
            { value: 'greater_equal', label: 'Supérieur ou égal' },
            { value: 'less_equal', label: 'Inférieur ou égal' },
            { value: 'between', label: 'Entre' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        date: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'greater_than', label: 'Après' },
            { value: 'less_than', label: 'Avant' },
            { value: 'greater_equal', label: 'À partir de' },
            { value: 'less_equal', label: 'Jusqu\'à' },
            { value: 'between', label: 'Entre' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        datetime: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'greater_than', label: 'Après' },
            { value: 'less_than', label: 'Avant' },
            { value: 'greater_equal', label: 'À partir de' },
            { value: 'less_equal', label: 'Jusqu\'à' },
            { value: 'between', label: 'Entre' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        boolean: [
            { value: 'equals', label: 'Égal à' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        select: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'in', label: 'Dans la liste' },
            { value: 'not_in', label: 'Pas dans la liste' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        email: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'starts_with', label: 'Commence par' },
            { value: 'ends_with', label: 'Termine par' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        url: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'starts_with', label: 'Commence par' },
            { value: 'ends_with', label: 'Termine par' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        phone: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'starts_with', label: 'Commence par' },
            { value: 'ends_with', label: 'Termine par' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        currency: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'greater_than', label: 'Supérieur à' },
            { value: 'less_than', label: 'Inférieur à' },
            { value: 'greater_equal', label: 'Supérieur ou égal' },
            { value: 'less_equal', label: 'Inférieur ou égal' },
            { value: 'between', label: 'Entre' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        percentage: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'greater_than', label: 'Supérieur à' },
            { value: 'less_than', label: 'Inférieur à' },
            { value: 'greater_equal', label: 'Supérieur ou égal' },
            { value: 'less_equal', label: 'Inférieur ou égal' },
            { value: 'between', label: 'Entre' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        textarea: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'not_contains', label: 'Ne contient pas' },
            { value: 'starts_with', label: 'Commence par' },
            { value: 'ends_with', label: 'Termine par' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ]
    }

    return operatorsByType[dataType] || operatorsByType.text
})

// Computed pour récupérer les options des colonnes select
// Si filterConfig.options est défini, on l'utilise
// Sinon, on extrait les valeurs uniques des données (comportement Excel)
const columnOptions = computed(() => {
    // Si des options sont définies dans filterConfig, on les utilise
    if (props.column.dataType === 'select' && props.column.filterConfig?.options) {
        return props.column.filterConfig.options
    }
    
    // Sinon, extraire les valeurs uniques des données (comportement Excel)
    const data = tableData.value
    if (props.column.dataType === 'select' && data && data.length > 0) {
        const uniqueValuesMap = new Map<string, { original: any; label: string }>() // Map: clé -> {original, label}
        
        // Fonction pour obtenir une clé unique d'une valeur
        const getValueKey = (value: any): string => {
            if (value === null || value === undefined) return ''
            if (typeof value === 'object') {
                // Pour les objets, utiliser JSON.stringify pour créer une clé unique
                try {
                    return JSON.stringify(value)
                } catch {
                    return String(value)
                }
            }
            return String(value)
        }
        
        // Fonction pour obtenir le label d'affichage d'une valeur
        const getDisplayLabel = (value: any, row: any): string => {
            // 1. Utiliser le valueFormatter si disponible
            if (props.column.valueFormatter) {
                try {
                    const formatted = props.column.valueFormatter({ value, data: row })
                    if (formatted && formatted !== '[object Object]') {
                        return String(formatted)
                    }
                } catch (e) {
                    // Ignorer les erreurs de formatter
                }
            }
            
            // 2. Si c'est un objet, essayer d'extraire une propriété utile
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Essayer les propriétés communes : name, label, title, libelle, nom
                const commonProps = ['name', 'label', 'title', 'libelle', 'nom', 'description', 'code']
                for (const prop of commonProps) {
                    if (value[prop] !== undefined && value[prop] !== null) {
                        return String(value[prop])
                    }
                }
                // Si l'objet a un id, utiliser id
                if (value.id !== undefined) {
                    return `ID: ${value.id}`
                }
                // Sinon, essayer JSON.stringify (limité à 100 caractères)
                try {
                    const json = JSON.stringify(value)
                    return json.length > 100 ? json.substring(0, 100) + '...' : json
                } catch {
                    return 'Objet'
                }
            }
            
            // 3. Si c'est un tableau, afficher le nombre d'éléments
            if (Array.isArray(value)) {
                return `[${value.length} élément${value.length > 1 ? 's' : ''}]`
            }
            
            // 4. Sinon, convertir en string
            return String(value)
        }
        
        data.forEach(row => {
            const originalValue = row[props.column.field]
            if (originalValue !== null && originalValue !== undefined && originalValue !== '') {
                const key = getValueKey(originalValue)
                if (key) {
                    const label = getDisplayLabel(originalValue, row)
                    // Stocker la valeur originale avec son label formaté
                    uniqueValuesMap.set(key, { original: originalValue, label })
                }
            }
        })
        
        // Convertir en tableau d'options avec label formaté et value originale
        return Array.from(uniqueValuesMap.values())
            .sort((a, b) => {
                // Trier par label pour l'affichage
                return a.label.localeCompare(b.label, 'fr', { numeric: true, sensitivity: 'base' })
            })
            .map(({ original, label }) => ({
                value: original, // Valeur originale pour le filtrage
                label: label    // Label formaté pour l'affichage
            }))
    }
    
    return []
})

// Computed pour déterminer le type de filtre à afficher selon le type de colonne
const isTextFilter = computed(() => {
    const dataType = props.column.dataType || 'text'
    const isTextType = ['text', 'textarea'].includes(dataType)
    const isTextOperator = ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'].includes(selectedOperator.value)

    return isTextType || isTextOperator
})

const isNumberFilter = computed(() => {
    const dataType = props.column.dataType || 'text'
    const isNumberType = ['number', 'currency', 'percentage'].includes(dataType)
    const isNumberOperator = ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'].includes(selectedOperator.value)

    return isNumberType || isNumberOperator
})

const isDateFilter = computed(() => {
    const dataType = props.column.dataType || 'text'
    const isDateType = ['date', 'datetime'].includes(dataType)
    const isDateOperator = ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'].includes(selectedOperator.value)

    return isDateType || isDateOperator
})

const isBetweenFilter = computed(() => {
    return selectedOperator.value === 'between'
})

const isListFilter = computed(() => {
    const dataType = props.column.dataType || 'text'
    const isListOperator = ['in', 'not_in'].includes(selectedOperator.value)
    const isSelectType = dataType === 'select'

    return isListOperator || isSelectType
})

const isBooleanFilter = computed(() => {
    const dataType = props.column.dataType || 'text'
    return dataType === 'boolean' || selectedOperator.value === 'equals'
})

const isSelectFilter = computed(() => {
    return props.column.dataType === 'select'
})

const isEmailFilter = computed(() => {
    return props.column.dataType === 'email'
})

const isUrlFilter = computed(() => {
    return props.column.dataType === 'url'
})

const isPhoneFilter = computed(() => {
    return props.column.dataType === 'phone'
})

const isNullFilter = computed(() => {
    return ['is_null', 'is_not_null', 'is_empty', 'is_not_empty'].includes(selectedOperator.value)
})

// Fonction pour déterminer le type d'input selon le type de colonne
const getInputType = (): string => {
    const dataType = props.column.dataType || 'text'

    switch (dataType) {
        case 'number':
        case 'currency':
        case 'percentage':
            return 'number'
        case 'date':
        case 'datetime':
            return 'date'
        case 'email':
            return 'email'
        case 'url':
            return 'url'
        case 'phone':
            return 'tel'
        case 'boolean':
            return 'checkbox'
        default:
            return 'text'
    }
}

// Fonction pour obtenir le placeholder selon le type de colonne
const getPlaceholder = (): string => {
    const dataType = props.column.dataType || 'text'
    const fieldName = props.column.headerName || props.column.field

    switch (dataType) {
        case 'number':
            return `Entrez un nombre...`
        case 'currency':
            return `Entrez un montant...`
        case 'percentage':
            return `Entrez un pourcentage...`
        case 'date':
        case 'datetime':
            return `Sélectionnez une date...`
        case 'email':
            return `Entrez un email...`
        case 'url':
            return `Entrez une URL...`
        case 'phone':
            return `Entrez un numéro...`
        case 'boolean':
            return `Sélectionnez une valeur...`
        case 'select':
            return `Sélectionnez une option...`
        default:
            return `Filtrer ${fieldName}...`
    }
}

// Computed pour vérifier si le filtre peut être appliqué
const canApplyFilter = computed(() => {
    if (isNullFilter.value) return true
    if (isBetweenFilter.value) return filterValue.value && filterValue2.value
    if (isListFilter.value) return listValues.value.some(v => v.trim() !== '')
    if (isSelectFilter.value) return selectedSelectValues.value.size > 0
    return filterValue.value.trim() !== ''
})

// Fonction pour comparer deux valeurs (gère les objets)
const areValuesEqual = (val1: any, val2: any): boolean => {
    if (val1 === val2) return true
    if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) return false
    if (typeof val1 === 'object' && typeof val2 === 'object') {
        try {
            return JSON.stringify(val1) === JSON.stringify(val2)
        } catch {
            return false
        }
    }
    return false
}

// Toggle une valeur dans le filtre select
const toggleSelectValue = (value: any) => {
    // Chercher si la valeur existe déjà (avec comparaison robuste)
    let found = false
    let foundValue: any = null
    
    for (const existingValue of selectedSelectValues.value) {
        if (areValuesEqual(existingValue, value)) {
            found = true
            foundValue = existingValue
            break
        }
    }
    
    if (found && foundValue !== null) {
        selectedSelectValues.value.delete(foundValue)
    } else {
        selectedSelectValues.value.add(value)
    }
}

// Vérifier si une valeur est sélectionnée (pour les checkboxes)
const isValueSelected = (value: any): boolean => {
    for (const selectedValue of selectedSelectValues.value) {
        if (areValuesEqual(selectedValue, value)) {
            return true
        }
    }
    return false
}

// Gestion des listes
const addListItem = () => {
    listValues.value.push('')
}

const removeListItem = (index: number) => {
    if (listValues.value.length > 1) {
        listValues.value.splice(index, 1)
    }
}

// Changement d'opérateur
const onOperatorChange = () => {
    // Réinitialiser les valeurs lors du changement d'opérateur
    filterValue.value = ''
    filterValue2.value = ''
    listValues.value = ['']
    selectedSelectValues.value.clear()

    // Réinitialiser l'opérateur par défaut selon le type de colonne si nécessaire
    const dataType = props.column.dataType || 'text'
    if (dataType === 'select' && !['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'].includes(selectedOperator.value)) {
        selectedOperator.value = 'equals'
    }
}

// Application du filtre
const applyFilter = () => {
    const filter: any = {
        field: props.column.field,
        operator: selectedOperator.value,
        dataType: props.column.dataType || 'text'
    }

    // Ajouter les valeurs selon l'opérateur
    if (isBetweenFilter.value) {
        filter.value = filterValue.value
        filter.value2 = filterValue2.value
    } else if (isListFilter.value) {
        filter.values = listValues.value.filter(v => v.trim() !== '')
    } else if (isSelectFilter.value) {
        // Pour les filtres select, utiliser l'opérateur 'in' avec les valeurs sélectionnées
        if (selectedSelectValues.value.size > 0) {
            filter.operator = 'in'
            filter.values = Array.from(selectedSelectValues.value)
        } else {
            return // Ne pas appliquer si aucune valeur sélectionnée
        }
    } else if (!isNullFilter.value) {
        filter.value = filterValue.value
    }

    emit('apply', filter)
}

// Effacer le filtre
const clearFilter = () => {
    filterValue.value = ''
    filterValue2.value = ''
    listValues.value = ['']
    selectedSelectValues.value.clear()
    selectedOperator.value = 'equals'
    emit('clear')
}

// Initialisation avec le filtre existant
watch(() => props.currentFilter, (newFilter) => {
    if (newFilter) {
        selectedOperator.value = newFilter.operator || 'equals'
        filterValue.value = newFilter.value || ''
        filterValue2.value = newFilter.value2 || ''
        if (newFilter.values) {
            if (isSelectFilter.value) {
                // Pour les filtres select, utiliser les valeurs pour les checkboxes
                selectedSelectValues.value = new Set(newFilter.values)
            } else {
                listValues.value = [...newFilter.values, '']
            }
        }
    } else {
        // Réinitialiser si le filtre est effacé
        selectedSelectValues.value.clear()
    }
}, { immediate: true })
</script>

<style scoped>
.filter-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999 !important;
    padding: 1rem;
    margin-top: 0.25rem;
    min-width: 280px;
    max-width: 350px;
    width: 100%;
}

.dark .filter-dropdown {
    background: #2d3748;
    border-color: #4a5568;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
    gap: 0.5rem;
}

.dark .filter-header {
    border-color: #4a5568;
}

.filter-title-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background: #e0e7ff;
    border-radius: 0.375rem;
    color: #4f46e5;
}

.dark .filter-icon {
    background: #4f46e5;
    color: white;
}

.filter-title {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dark .filter-title {
    color: #f7fafc;
}

.close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: none;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
    flex-shrink: 0;
}

.close-btn:hover {
    background-color: #f3f4f6;
    color: #374151;
}

.dark .close-btn:hover {
    background-color: #4a5568;
    color: #f9fafb;
}

.filter-section {
    margin-bottom: 1rem;
}

.filter-section:last-child {
    margin-bottom: 0;
}

.filter-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.5rem;
}

.dark .filter-label {
    color: #9ca3af;
}

.filter-select,
.filter-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    background: white;
    color: #374151;
    transition: all 0.2s;
    box-sizing: border-box;
}

.dark .filter-select,
.dark .filter-input {
    background: #1a202c;
    border-color: #4a5568;
    color: #f7fafc;
}

.filter-select:focus,
.filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .filter-select:focus,
.dark .filter-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.filter-input-group {
    margin-bottom: 0.5rem;
}

.between-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.between-separator {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dark .between-separator {
    color: #9ca3af;
}

.list-input-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.list-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.list-input {
    flex: 1;
    min-width: 0;
}

.remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: #ef4444;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    color: white;
    transition: all 0.2s;
    flex-shrink: 0;
}

.remove-btn:hover {
    background: #dc2626;
}

.add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 2rem;
    padding: 0;
    background: #10b981;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    color: white;
    transition: all 0.2s;
    font-size: 0.75rem;
}

.add-btn:hover {
    background: #059669;
}

.null-filter-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    color: #6b7280;
    font-size: 0.875rem;
    text-align: center;
}

.dark .null-filter-info {
    background: #374151;
    color: #9ca3af;
}

.filter-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
}

.dark .filter-actions {
    border-color: #4a5568;
}

.apply-btn,
.clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    min-width: 0;
}

.apply-btn {
    background: #3b82f6;
    color: white;
}

.apply-btn:hover:not(:disabled) {
    background: #2563eb;
}

.apply-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.clear-btn {
    background: #f3f4f6;
    color: #374151;
}

.clear-btn:hover {
    background: #e5e7eb;
}

.dark .clear-btn {
    background: #374151;
    color: #f7fafc;
}

.dark .clear-btn:hover {
    background: #4a5568;
}

/* Styles pour le filtre select avec checkboxes */
.select-filter-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    padding: 0.5rem;
    background: #f9fafb;
}

.dark .select-filter-list {
    background: #1a202c;
    border-color: #4a5568;
}

.no-options-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    color: #6b7280;
    font-size: 0.875rem;
    text-align: center;
    justify-content: center;
}

.dark .no-options-message {
    color: #9ca3af;
}

.options-checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.option-checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
    user-select: none;
}

.option-checkbox-item:hover {
    background-color: #f3f4f6;
}

.dark .option-checkbox-item:hover {
    background-color: #374151;
}

.option-checkbox {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: #3b82f6;
    flex-shrink: 0;
}

.option-label {
    font-size: 0.875rem;
    color: #374151;
    flex: 1;
}

.dark .option-label {
    color: #f7fafc;
}

.option-checkbox-item:has(.option-checkbox:checked) {
    background-color: #eff6ff;
    font-weight: 500;
}

.dark .option-checkbox-item:has(.option-checkbox:checked) {
    background-color: #1e3a8a;
}
</style>
