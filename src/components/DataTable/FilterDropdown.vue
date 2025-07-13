<template>
    <div class="filter-dropdown" v-if="isVisible">
        <div class="filter-header">
            <span class="filter-title">Filtrer {{ column.headerName || column.field }}</span>
            <button @click="$emit('close')" class="close-btn" title="Fermer">
                <IconX class="w-4 h-4" />
            </button>
        </div>

        <!-- Sélection de l'opérateur -->
        <div class="filter-section">
            <label class="filter-label">Opérateur</label>
            <select v-model="selectedOperator" class="filter-select" @change="onOperatorChange">
                <option v-for="op in availableOperators" :key="op.value" :value="op.value">
                    {{ op.label }}
                </option>
            </select>
        </div>

        <!-- Champs de valeur selon l'opérateur -->
        <div class="filter-section">
            <label class="filter-label">Valeur</label>

            <!-- Filtre texte -->
            <div v-if="isTextFilter" class="filter-input-group">
                <input v-model="filterValue"
                       type="text"
                       class="filter-input"
                       :placeholder="getPlaceholder()"
                       @keyup.enter="applyFilter" />
            </div>

            <!-- Filtre nombre -->
            <div v-else-if="isNumberFilter" class="filter-input-group">
                <input v-model="filterValue"
                       type="number"
                       class="filter-input"
                       :placeholder="getPlaceholder()"
                       @keyup.enter="applyFilter" />
            </div>

            <!-- Filtre date -->
            <div v-else-if="isDateFilter" class="filter-input-group">
                <input v-model="filterValue"
                       type="date"
                       class="filter-input"
                       @change="applyFilter" />
            </div>

            <!-- Filtre entre deux valeurs -->
            <div v-else-if="isBetweenFilter" class="filter-input-group">
                <div class="between-inputs">
                    <input v-model="filterValue"
                           :type="getInputType()"
                           class="filter-input"
                           :placeholder="'Valeur min'"
                           @keyup.enter="applyFilter" />
                    <span class="between-separator">et</span>
                    <input v-model="filterValue2"
                           :type="getInputType()"
                           class="filter-input"
                           :placeholder="'Valeur max'"
                           @keyup.enter="applyFilter" />
                </div>
            </div>

            <!-- Filtre liste -->
            <div v-else-if="isListFilter" class="filter-input-group">
                <div class="list-input-container">
                    <div v-for="(item, index) in listValues" :key="index" class="list-item">
                        <input v-model="listValues[index]"
                               :type="getInputType()"
                               class="filter-input list-input"
                               :placeholder="`Valeur ${index + 1}`"
                               @keyup.enter="addListItem" />
                        <button @click="removeListItem(index)" class="remove-btn" title="Supprimer">
                            <IconX class="w-3 h-3" />
                        </button>
                    </div>
                    <button @click="addListItem" class="add-btn" title="Ajouter une valeur">
                        <IconPlus class="w-3 h-3" />
                    </button>
                </div>
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

        <!-- Actions -->
        <div class="filter-actions">
            <button @click="applyFilter" class="apply-btn">
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

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import IconX from '../icon/icon-x.vue'
import IconCheck from '../icon/icon-check.vue'
import IconPlus from '../icon/icon-plus.vue'
import IconInfoCircle from '../icon/icon-info-circle.vue'
import type { DataTableColumn, FilterOperator, ColumnDataType } from '@/types/dataTable'

interface Props {
    column: DataTableColumn
    isVisible: boolean
    currentFilter?: any
}

const props = defineProps<Props>()
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

// Opérateurs disponibles selon le type de colonne
const availableOperators = computed(() => {
    const dataType = props.column.dataType || 'text'

    const operatorsByType: Record<ColumnDataType, Array<{ value: FilterOperator; label: string }>> = {
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
            { value: 'in', label: 'Dans la liste' },
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
        file: [
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
        image: [
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
        color: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        json: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        array: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'in', label: 'Dans la liste' },
            { value: 'not_in', label: 'Pas dans la liste' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
            { value: 'is_null', label: 'Est null' },
            { value: 'is_not_null', label: 'N\'est pas null' }
        ],
        object: [
            { value: 'equals', label: 'Égal à' },
            { value: 'not_equals', label: 'Différent de' },
            { value: 'contains', label: 'Contient' },
            { value: 'is_empty', label: 'Est vide' },
            { value: 'is_not_empty', label: 'N\'est pas vide' },
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

// Computed pour déterminer le type de filtre à afficher
const isTextFilter = computed(() => {
    return ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'].includes(selectedOperator.value)
})

const isNumberFilter = computed(() => {
    return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'].includes(selectedOperator.value)
})

const isDateFilter = computed(() => {
    return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'].includes(selectedOperator.value)
})

const isBetweenFilter = computed(() => {
    return selectedOperator.value === 'between'
})

const isListFilter = computed(() => {
    return ['in', 'not_in'].includes(selectedOperator.value)
})

const isBooleanFilter = computed(() => {
    return selectedOperator.value === 'equals'
})

const isNullFilter = computed(() => {
    return ['is_null', 'is_not_null', 'is_empty', 'is_not_empty'].includes(selectedOperator.value)
})

// Fonctions utilitaires
const getInputType = (): string => {
    const dataType = props.column.dataType || 'text'
    if (dataType === 'number' || dataType === 'currency' || dataType === 'percentage') return 'number'
    if (dataType === 'date' || dataType === 'datetime') return 'date'
    return 'text'
}

const getPlaceholder = (): string => {
    const dataType = props.column.dataType || 'text'
    const fieldName = props.column.headerName || props.column.field

    switch (dataType) {
        case 'number':
        case 'currency':
        case 'percentage':
            return `Entrez un nombre...`
        case 'date':
        case 'datetime':
            return `Sélectionnez une date...`
        case 'email':
            return `Entrez un email...`
        case 'url':
            return `Entrez une URL...`
        case 'phone':
            return `Entrez un numéro...`
        default:
            return `Filtrer ${fieldName}...`
    }
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
    } else if (!isNullFilter.value) {
        filter.value = filterValue.value
    }

    console.log('🔍 Filtre appliqué:', filter)
    emit('apply', filter)
}

// Effacer le filtre
const clearFilter = () => {
    filterValue.value = ''
    filterValue2.value = ''
    listValues.value = ['']
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
            listValues.value = [...newFilter.values, '']
        }
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
    z-index: 50;
    padding: 1rem;
    margin-top: 0.25rem;
    min-width: 300px;
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
}

.dark .filter-header {
    border-color: #4a5568;
}

.filter-title {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
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

.filter-label {
    display: block;
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
}

.between-separator {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
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
    padding: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    color: #6b7280;
    font-size: 0.875rem;
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
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.apply-btn {
    background: #3b82f6;
    color: white;
    flex: 1;
}

.apply-btn:hover {
    background: #2563eb;
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
</style>
