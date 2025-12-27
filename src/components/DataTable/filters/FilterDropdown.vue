<template>
    <div class="filter-dropdown" :class="{ 'hidden': !isVisible, 'block': isVisible }">
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

        <!-- Filtre select avec checkboxes style Excel - Affiché en premier si c'est un filtre select -->
        <div v-if="isSelectFilter" class="filter-section excel-filter-section">
            <!-- Barre de recherche -->
            <div class="filter-search-box">
                <div class="relative">
                    <IconSearch class="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        v-model="searchText"
                        type="text"
                        class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Rechercher dans la liste..."
                        @input="onSearchInput"
                    />
                </div>
            </div>

            <!-- Compteur de sélection -->
            <div class="flex items-center justify-between px-2 py-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>{{ filteredOptions.length }} valeur(s)</span>
                    </div>
                    <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
                    <div class="flex items-center gap-1.5 text-xs font-medium text-primary dark:text-primary-light">
                        <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>{{ selectedSelectValues.size }} sélectionnée(s)</span>
                    </div>
                </div>
            </div>

            <!-- Zone scrollable avec checkboxes -->
            <div class="relative">
                <div class="select-filter-list max-h-[250px] overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <!-- Message vide -->
                    <div v-if="filteredOptions.length === 0" class="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                            <IconInfoCircle class="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {{ searchText ? 'Aucun résultat trouvé' : 'Aucune option disponible' }}
                        </p>
                        <p v-if="searchText" class="text-xs text-gray-500 dark:text-gray-500">
                            Essayez de modifier votre recherche
                        </p>
                    </div>

                    <!-- Liste des options -->
                    <div v-else class="p-2">
                        <!-- Checkbox "Sélectionner tout" -->
                        <label
                            v-if="filteredOptions.length > 0"
                            class="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/30 group"
                        >
                            <div class="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    :checked="isAllFilteredSelected"
                                    :indeterminate="isSomeFilteredSelected && !isAllFilteredSelected"
                                    @change="toggleSelectAllFiltered"
                                    class="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer transition-all duration-200 checked:bg-primary checked:border-primary dark:checked:bg-primary dark:checked:border-primary group-hover:border-primary dark:group-hover:border-primary"
                                />
                                <svg v-if="isAllFilteredSelected" class="absolute w-3 h-3 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <svg v-else-if="isSomeFilteredSelected && !isAllFilteredSelected" class="absolute w-3 h-3 text-primary pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                                </svg>
                            </div>
                            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                (Sélectionner tout)
                            </span>
                        </label>

                        <!-- Liste des options avec checkboxes -->
                        <div class="space-y-1">
                            <label
                                v-for="option in filteredOptions"
                                :key="option.value"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
                                :class="{
                                    'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800': isValueSelected(option.value),
                                    'bg-transparent': !isValueSelected(option.value)
                                }"
                            >
                                <div class="relative flex items-center justify-center flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        :value="option.value"
                                        :checked="isValueSelected(option.value)"
                                        @change="toggleSelectValue(option.value)"
                                        class="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer transition-all duration-200 checked:bg-primary checked:border-primary dark:checked:bg-primary dark:checked:border-primary group-hover:border-primary dark:group-hover:border-primary"
                                    />
                                    <svg v-if="isValueSelected(option.value)" class="absolute w-3 h-3 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <span class="text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-1" 
                                      :class="{
                                          'font-medium': isValueSelected(option.value),
                                          'font-normal': !isValueSelected(option.value)
                                      }">
                                    {{ option.label }}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>

        <!-- Sélection de l'opérateur avec icônes (masqué pour les filtres select) -->
        <div v-if="!isSelectFilter" class="filter-section">
            <label class="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                <IconSettings class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span>Opérateur</span>
            </label>
            <div class="relative">
                <select 
                    v-model="selectedOperator" 
                    @change="onOperatorChange"
                    class="w-full px-4 py-2.5 pr-10 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 cursor-pointer appearance-none transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 focus:border-primary shadow-sm hover:shadow-md"
                >
                    <option 
                        v-for="op in availableOperators" 
                        :key="op.value" 
                        :value="op.value"
                        class="py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    >
                        {{ op.label }}
                    </option>
                </select>
                <!-- Icône de chevron personnalisée -->
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>

        <!-- Champs de valeur selon l'opérateur (masqués pour les filtres select) -->
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
                <div class="relative">
                    <select 
                        v-model="filterValue" 
                        @change="applyFilter"
                        class="w-full px-4 py-2.5 pr-10 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 cursor-pointer appearance-none transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 focus:border-primary shadow-sm hover:shadow-md"
                    >
                        <option value="" class="py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">Sélectionner</option>
                        <option value="true" class="py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">Vrai</option>
                        <option value="false" class="py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">Faux</option>
                    </select>
                    <!-- Icône de chevron personnalisée -->
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
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

<script setup lang="ts">
/* eslint-disable */
import { ref, computed, watch } from 'vue'
import IconX from '../../icon/icon-x.vue'
import IconCheck from '../../icon/icon-check.vue'
import IconPlus from '../../icon/icon-plus.vue'
import IconInfoCircle from '../../icon/icon-info-circle.vue'
import IconFilter from '../../icon/icon-filter.vue'
import IconSettings from '../../icon/icon-settings.vue'
import IconSearch from '../../icon/icon-search.vue'
import type { DataTableColumn, FilterOperator, ColumnDataType } from '@/components/DataTable/types/dataTable'

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
const selectedSelectValues = ref<Set<any>>(new Set()) // Pour les filtres select avec checkboxes
const searchText = ref('') // Recherche dans les options pour filtres select style Excel

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
const columnOptions = computed(() => {
    // Si des options sont définies dans filterConfig, on les utilise (priorité)
    if (props.column.filterConfig?.options && Array.isArray(props.column.filterConfig.options) && props.column.filterConfig.options.length > 0) {
        return props.column.filterConfig.options
    }
    
    // Sinon, si c'est un type select, retourner un tableau vide
    if (props.column.dataType === 'select') {
        return []
    }
    
    return []
})

// Computed pour filtrer les options selon la recherche (style Excel)
const filteredOptions = computed(() => {
    if (!searchText.value.trim()) {
        return columnOptions.value
    }
    
    const searchLower = searchText.value.toLowerCase().trim()
    return columnOptions.value.filter(option => {
        const label = String(option.label || option.value || '').toLowerCase()
        const value = String(option.value || '').toLowerCase()
        return label.includes(searchLower) || value.includes(searchLower)
    })
})

// Computed pour vérifier si toutes les options filtrées sont sélectionnées
const isAllFilteredSelected = computed(() => {
    if (filteredOptions.value.length === 0) return false
    return filteredOptions.value.every(option => isValueSelected(option.value))
})

// Computed pour vérifier si certaines options filtrées sont sélectionnées (état intermédiaire)
const isSomeFilteredSelected = computed(() => {
    if (filteredOptions.value.length === 0) return false
    return filteredOptions.value.some(option => isValueSelected(option.value))
})

// Fonction pour sélectionner/désélectionner toutes les options filtrées
const toggleSelectAllFiltered = () => {
    const newSet = new Set(selectedSelectValues.value)
    
    if (isAllFilteredSelected.value) {
        // Désélectionner toutes les options filtrées
        filteredOptions.value.forEach(option => {
            // Trouver la valeur exacte dans le Set pour la supprimer
            for (const existingValue of newSet) {
                if (areValuesEqual(existingValue, option.value)) {
                    newSet.delete(existingValue)
                    break
                }
            }
        })
    } else {
        // Sélectionner toutes les options filtrées
        filteredOptions.value.forEach(option => {
            newSet.add(option.value)
        })
    }
    
    selectedSelectValues.value = newSet
}

// Handler pour la recherche
const onSearchInput = () => {
    // La recherche est déjà gérée par le computed filteredOptions
}

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
    // Ne pas utiliser isListFilter pour les filtres select (ils ont leur propre interface)
    if (isSelectFilter.value) {
        return false
    }
    const dataType = props.column.dataType || 'text'
    const isListOperator = ['in', 'not_in'].includes(selectedOperator.value)

    return isListOperator
})

const isBooleanFilter = computed(() => {
    const dataType = props.column.dataType || 'text'
    return dataType === 'boolean' || selectedOperator.value === 'equals'
})

const isSelectFilter = computed(() => {
    // Vérifier si c'est un filtre select basé sur le dataType OU si filterConfig.options est défini
    const column = props.column
    if (!column) return false
    
    const hasSelectDataType = column.dataType === 'select'
    const hasFilterConfigOptions = column.filterConfig?.options && Array.isArray(column.filterConfig.options) && column.filterConfig.options.length > 0
    
    return hasSelectDataType || hasFilterConfigOptions
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
    
    // Créer un nouveau Set pour forcer la réactivité Vue
    const newSet = new Set(selectedSelectValues.value)
    
    if (found && foundValue !== null) {
        newSet.delete(foundValue)
    } else {
        newSet.add(value)
    }
    
    selectedSelectValues.value = newSet
    
    // Debug temporaire
    console.log('toggleSelectValue - Nouvelle taille:', selectedSelectValues.value.size, 'canApply:', canApplyFilter.value)
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

// Computed pour vérifier si le filtre peut être appliqué
const canApplyFilter = computed(() => {
    // Pour les filtres select, vérifier si au moins une valeur est sélectionnée
    if (isSelectFilter.value) {
        // Accéder explicitement à la taille pour forcer le tracking de réactivité
        const size = selectedSelectValues.value.size
        return size > 0
    }
    
    if (isNullFilter.value) return true
    if (isBetweenFilter.value) return filterValue.value && filterValue2.value
    if (isListFilter.value) return listValues.value.some(v => v.trim() !== '')
    return filterValue.value.trim() !== ''
})

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
    if (isSelectFilter.value) {
        // Pour les filtres select, utiliser le format array simple selon FORMAT_ACTUEL.md
        if (selectedSelectValues.value.size > 0) {
            filter.values = Array.from(selectedSelectValues.value)
        } else {
            return // Ne pas appliquer si aucune valeur sélectionnée
        }
    } else if (isBetweenFilter.value) {
        filter.value = filterValue.value
        filter.value2 = filterValue2.value
    } else if (isListFilter.value) {
        filter.values = listValues.value.filter(v => v.trim() !== '')
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
    searchText.value = '' // Réinitialiser aussi la recherche
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
    position: relative;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 50;
    padding: 1rem;
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

/* Styles pour les inputs (select maintenant géré par Tailwind) */
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

.dark .filter-input {
    background: #1a202c;
    border-color: #4a5568;
    color: #f7fafc;
}

.filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

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

/* Styles pour le filtre select avec checkboxes - maintenant gérés par Tailwind */

/* Styles spécifiques pour le filtre style Excel */
.excel-filter-section {
    max-height: 400px;
    display: flex;
    flex-direction: column;
}

.filter-search-box {
    margin-bottom: 0.75rem;
}

/* Scrollbar personnalisée pour la liste des options */
.select-filter-list::-webkit-scrollbar {
    width: 6px;
}

.select-filter-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.select-filter-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.select-filter-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.dark .select-filter-list::-webkit-scrollbar-track {
    background: #1e293b;
}

.dark .select-filter-list::-webkit-scrollbar-thumb {
    background: #475569;
}

.dark .select-filter-list::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>
