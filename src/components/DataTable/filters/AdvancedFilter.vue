<template>
    <!--
        Composant de filtre avancé pour DataTable
        Permet de créer des filtres complexes avec différents types de données
        Supporte les opérateurs de comparaison, les plages, les listes, etc.
    -->
    <div class="advanced-filter">
        <!-- Header du filtre avec titre et bouton de fermeture -->
        <div class="filter-header">
            <h4 class="filter-title">Filtre avancé</h4>
            <button @click="$emit('close')" class="close-btn">
                <IconX class="w-4 h-4" />
            </button>
        </div>

        <!-- Sélecteur de type de données pour le filtre -->
        <div class="filter-section">
            <label class="filter-label">Type de données</label>
            <select v-model="currentFilter.dataType" @change="onFilterChange" class="filter-select">
                <option value="text">Texte</option>
                <option value="number">Nombre</option>
                <option value="date">Date</option>
                <option value="datetime">Date et heure</option>
                <option value="boolean">Booléen</option>
                <option value="select">Sélection</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="phone">Téléphone</option>
                <option value="currency">Devise</option>
                <option value="percentage">Pourcentage</option>
            </select>
        </div>

        <!-- Sélecteur d'opérateur selon le type de données -->
        <div class="filter-section">
            <label class="filter-label">Opérateur</label>
            <select v-model="currentFilter.operator" @change="onFilterChange" class="filter-select">
                <option v-for="operator in availableOperators" :key="operator.value" :value="operator.value">
                    {{ operator.label }}
                </option>
            </select>
        </div>

        <!-- Contrôles de filtre dynamiques selon le type et l'opérateur -->
        <div class="filter-controls">
            <!-- Filtres texte avec recherche simple -->
            <div v-if="isTextFilter" class="text-filter">
                <input
                    v-model="currentFilter.value"
                    type="text"
                    :placeholder="getPlaceholder()"
                    class="filter-input"
                    @input="onFilterChange"
                />
            </div>

            <!-- Filtres numériques avec support des plages -->
            <div v-else-if="isNumberFilter" class="number-filter">
                <input
                    v-model="currentFilter.value"
                    type="number"
                    :placeholder="getPlaceholder()"
                    class="filter-input"
                    @input="onFilterChange"
                />
                <!-- Deuxième input pour les plages (between) -->
                <input
                    v-if="currentFilter.operator === 'between'"
                    v-model="currentFilter.value2"
                    type="number"
                    placeholder="Valeur max"
                    class="filter-input"
                    @input="onFilterChange"
                />
            </div>

            <!-- Filtres date avec sélecteur de date -->
            <div v-else-if="isDateFilter" class="date-filter">
                <input
                    v-model="currentFilter.value"
                    :type="currentFilter.dataType === 'datetime' ? 'datetime-local' : 'date'"
                    class="filter-input"
                    @input="onFilterChange"
                />
                <!-- Deuxième input pour les plages de dates -->
                <input
                    v-if="currentFilter.operator === 'between'"
                    v-model="currentFilter.value2"
                    :type="currentFilter.dataType === 'datetime' ? 'datetime-local' : 'date'"
                    class="filter-input"
                    @input="onFilterChange"
                />
            </div>

            <!-- Filtres de sélection simple -->
            <div v-else-if="isSingleSelectFilter" class="select-filter">
                <select v-model="currentFilter.value" @change="onFilterChange" class="filter-select">
                    <option value="">Sélectionner...</option>
                    <option v-for="option in filterOptions" :key="option.value" :value="option.value" :disabled="option.disabled">
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <!-- Filtres de sélection multiple -->
            <div v-else-if="isMultiSelectFilter" class="select-multi-filter">
                <div class="multi-select-options">
                    <label
                        v-for="option in filterOptions"
                        :key="option.value"
                        class="multi-select-option"
                    >
                        <input
                            type="checkbox"
                            :value="option.value"
                            v-model="currentFilter.values"
                            :disabled="option.disabled"
                            @change="onFilterChange"
                        />
                        <span>{{ option.label }}</span>
                    </label>
                </div>
                <div v-if="currentFilter.values && currentFilter.values.length > 0" class="multi-select-summary">
                    {{ currentFilter.values.length }} sélection(s)
                </div>
            </div>

            <!-- Filtres booléens avec options Vrai/Faux -->
            <div v-else-if="isBooleanFilter" class="boolean-filter">
                <select v-model="currentFilter.value" @change="onFilterChange" class="filter-select">
                    <option value="">Tous</option>
                    <option :value="true">Vrai</option>
                    <option :value="false">Faux</option>
                </select>
            </div>

            <!-- Filtres de liste avec ajout dynamique d'éléments -->
            <div v-else-if="isListFilter" class="list-filter">
                <div class="list-inputs">
                    <input
                        v-model="listInput"
                        type="text"
                        placeholder="Ajouter une valeur"
                        class="filter-input"
                        @keyup.enter="addToList"
                    />
                    <button @click="addToList" class="add-btn">
                        <IconPlus class="w-4 h-4" />
                    </button>
                </div>
                <!-- Affichage des valeurs ajoutées avec possibilité de suppression -->
                <div v-if="currentFilter.values && currentFilter.values.length > 0" class="list-values">
                    <span
                        v-for="(value, index) in currentFilter.values"
                        :key="index"
                        class="list-tag"
                    >
                        {{ value }}
                        <button @click="removeFromList(index)" class="remove-btn">
                            <IconX class="w-3 h-3" />
                        </button>
                    </span>
                </div>
            </div>

            <!-- Filtres null/empty avec bouton d'action -->
            <div v-else-if="isNullFilter" class="null-filter">
                <button @click="onFilterChange" class="null-btn">
                    {{ getNullButtonText() }}
                </button>
            </div>

            <!-- Filtres regex avec aide contextuelle -->
            <div v-else-if="isRegexFilter" class="regex-filter">
                <input
                    v-model="currentFilter.regex"
                    type="text"
                    placeholder="Expression régulière..."
                    class="filter-input"
                    @input="onFilterChange"
                />
                <div class="regex-help">
                    <small>Ex: ^[A-Z] pour commencer par une majuscule</small>
                </div>
            </div>
        </div>

        <!-- Section de validation avec contraintes -->
        <div v-if="currentFilter.validation" class="validation-section">
            <h5 class="validation-title">Validation</h5>
            <div class="validation-inputs">
                <!-- Validation min/max pour les nombres -->
                <input
                    v-if="currentFilter.validation.min !== undefined"
                    v-model.number="currentFilter.validation.min"
                    type="number"
                    placeholder="Min"
                    class="validation-input"
                />
                <input
                    v-if="currentFilter.validation.max !== undefined"
                    v-model.number="currentFilter.validation.max"
                    type="number"
                    placeholder="Max"
                    class="validation-input"
                />
                <!-- Validation pattern pour les chaînes -->
                <input
                    v-if="currentFilter.validation.pattern"
                    v-model="currentFilter.validation.pattern"
                    type="text"
                    placeholder="Pattern"
                    class="validation-input"
                />
            </div>
        </div>

        <!-- Boutons d'action pour appliquer ou effacer le filtre -->
        <div class="filter-actions">
            <button @click="clearFilter" class="clear-btn">
                <IconTrash class="w-4 h-4 mr-1" />
                Effacer
            </button>
            <button @click="applyFilter" class="apply-btn">
                <IconCheck class="w-4 h-4 mr-1" />
                Appliquer
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FilterConfig, ColumnDataType, FilterOperator } from '@/components/DataTable/types/dataTable'
import IconX from '../../icon/icon-x.vue'
import IconPlus from '../../icon/icon-plus.vue'
import IconTrash from '../../icon/icon-trash.vue'
import IconCheck from '../../icon/icon-check.vue'

/**
 * Props du composant AdvancedFilter
 *
 * @param field - Champ de données à filtrer
 * @param filterConfig - Configuration initiale du filtre (optionnel)
 * @param options - Options pour les filtres de type select (optionnel)
 */
const props = defineProps<{
    field: string
    filterConfig?: FilterConfig
    options?: Array<{ label: string; value: any; disabled?: boolean }>
}>()

/**
 * Émissions du composant
 *
 * @param filter-changed - Émis quand le filtre change
 * @param close - Émis pour fermer le composant
 */
const emit = defineEmits<{
    'filter-changed': [field: string, filter: FilterConfig | null]
    'close': []
}>()

// ===== ÉTAT LOCAL =====

/**
 * Configuration du filtre actuel
 * Contient tous les paramètres du filtre en cours d'édition
 */
const currentFilter = ref<FilterConfig>({
    dataType: 'text',
    operator: 'contains',
    value: '',
    value2: '',
    values: []
})

/**
 * Input temporaire pour les filtres de liste
 */
const listInput = ref('')

// ===== CONFIGURATION DES OPÉRATEURS =====

/**
 * Opérateurs disponibles par type de données
 * Définit les opérateurs de filtrage supportés pour chaque type
 */
const operatorsByDataType: Partial<Record<ColumnDataType, Array<{ value: FilterOperator; label: string }>>> = {
    text: [
        { value: 'equals', label: 'Égal à' },
        { value: 'not_equals', label: 'Différent de' },
        { value: 'contains', label: 'Contient' },
        { value: 'not_contains', label: 'Ne contient pas' },
        { value: 'starts_with', label: 'Commence par' },
        { value: 'ends_with', label: 'Termine par' },
        { value: 'is_empty', label: 'Est vide' },
        { value: 'is_not_empty', label: 'N\'est pas vide' },
        { value: 'regex', label: 'Expression régulière' }
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
        { value: 'between', label: 'Entre' },
        { value: 'is_null', label: 'Est null' },
        { value: 'is_not_null', label: 'N\'est pas null' }
    ],
    datetime: [
        { value: 'equals', label: 'Égal à' },
        { value: 'not_equals', label: 'Différent de' },
        { value: 'greater_than', label: 'Après' },
        { value: 'less_than', label: 'Avant' },
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
        { value: 'contains', label: 'Contient' },
        { value: 'starts_with', label: 'Commence par' },
        { value: 'ends_with', label: 'Termine par' },
        { value: 'regex', label: 'Expression régulière' }
    ],
    url: [
        { value: 'equals', label: 'Égal à' },
        { value: 'contains', label: 'Contient' },
        { value: 'starts_with', label: 'Commence par' },
        { value: 'ends_with', label: 'Termine par' },
        { value: 'regex', label: 'Expression régulière' }
    ],
    phone: [
        { value: 'equals', label: 'Égal à' },
        { value: 'contains', label: 'Contient' },
        { value: 'starts_with', label: 'Commence par' },
        { value: 'ends_with', label: 'Termine par' },
        { value: 'regex', label: 'Expression régulière' }
    ],
    currency: [
        { value: 'equals', label: 'Égal à' },
        { value: 'not_equals', label: 'Différent de' },
        { value: 'greater_than', label: 'Supérieur à' },
        { value: 'less_than', label: 'Inférieur à' },
        { value: 'between', label: 'Entre' }
    ],
    percentage: [
        { value: 'equals', label: 'Égal à' },
        { value: 'not_equals', label: 'Différent de' },
        { value: 'greater_than', label: 'Supérieur à' },
        { value: 'less_than', label: 'Inférieur à' },
        { value: 'between', label: 'Entre' }
    ]
}

// ===== COMPUTED PROPERTIES =====

/**
 * Opérateurs disponibles selon le type de données sélectionné
 */
const availableOperators = computed(() => {
    return operatorsByDataType[currentFilter.value.dataType] || operatorsByDataType.text
})

/**
 * Détermine si le filtre actuel est un filtre texte
 */
const isTextFilter = computed(() =>
    ['text', 'email', 'url', 'phone'].includes(currentFilter.value.dataType) &&
    ['contains', 'not_contains', 'starts_with', 'ends_with', 'equals', 'not_equals'].includes(currentFilter.value.operator)
)

/**
 * Détermine si le filtre actuel est un filtre numérique
 */
const isNumberFilter = computed(() =>
    ['number', 'currency', 'percentage'].includes(currentFilter.value.dataType) &&
    ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between'].includes(currentFilter.value.operator)
)

/**
 * Détermine si le filtre actuel est un filtre de date
 */
const isDateFilter = computed(() =>
    ['date', 'datetime'].includes(currentFilter.value.dataType) &&
    ['equals', 'not_equals', 'greater_than', 'less_than', 'between'].includes(currentFilter.value.operator)
)

/**
 * Détermine si le filtre actuel est un filtre de sélection
 */
const isSingleSelectFilter = computed(() =>
    currentFilter.value.dataType === 'select' &&
    ['equals', 'not_equals'].includes(currentFilter.value.operator)
)

/**
 * Détermine si le filtre actuel est une sélection multiple
 */
const isMultiSelectFilter = computed(() =>
    currentFilter.value.dataType === 'select' &&
    ['in', 'not_in'].includes(currentFilter.value.operator)
)

/**
 * Détermine si le filtre actuel est un filtre booléen
 */
const isBooleanFilter = computed(() =>
    currentFilter.value.dataType === 'boolean' &&
    ['equals'].includes(currentFilter.value.operator)
)

/**
 * Détermine si le filtre actuel est un filtre de liste
 */
const isListFilter = computed(() =>
    ['in', 'not_in'].includes(currentFilter.value.operator) &&
    currentFilter.value.dataType !== 'select'
)

/**
 * Détermine si le filtre actuel est un filtre null/empty
 */
const isNullFilter = computed(() =>
    ['is_null', 'is_not_null', 'is_empty', 'is_not_empty'].includes(currentFilter.value.operator)
)

/**
 * Détermine si le filtre actuel est un filtre regex
 */
const isRegexFilter = computed(() =>
    currentFilter.value.operator === 'regex'
)

/**
 * Options disponibles pour les filtres de type select
 */
const filterOptions = computed(() => props.options || [])

// ===== MÉTHODES UTILITAIRES =====

/**
 * Retourne le placeholder approprié selon l'opérateur
 *
 * @returns Placeholder pour l'input
 */
const getPlaceholder = () => {
    const placeholders: Record<FilterOperator, string> = {
        equals: 'Valeur exacte...',
        not_equals: 'Valeur différente de...',
        contains: 'Contient...',
        not_contains: 'Ne contient pas...',
        starts_with: 'Commence par...',
        ends_with: 'Termine par...',
        greater_than: 'Supérieur à...',
        less_than: 'Inférieur à...',
        greater_equal: 'Supérieur ou égal à...',
        less_equal: 'Inférieur ou égal à...',
        between: 'Entre...',
        in: 'Dans la liste...',
        not_in: 'Pas dans la liste...',
        is_null: 'Est null',
        is_not_null: 'N\'est pas null',
        is_empty: 'Est vide',
        is_not_empty: 'N\'est pas vide',
        regex: 'Expression régulière...',
        custom: 'Filtre personnalisé...'
    }
    return placeholders[currentFilter.value.operator] || 'Valeur...'
}

/**
 * Retourne le texte du bouton pour les filtres null/empty
 *
 * @returns Texte du bouton
 */
const getNullButtonText = () => {
    const texts: Partial<Record<FilterOperator, string>> = {
        is_null: 'Est null',
        is_not_null: 'N\'est pas null',
        is_empty: 'Est vide',
        is_not_empty: 'N\'est pas vide'
    }
    return texts[currentFilter.value.operator] || 'Action'
}

// ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

/**
 * Gère les changements de filtre
 * Émet l'événement de changement vers le parent
 */
const onFilterChange = () => {
    emit('filter-changed', props.field, currentFilter.value)
}

/**
 * Efface le filtre actuel
 * Remet à zéro tous les champs et émet l'événement
 */
const clearFilter = () => {
    currentFilter.value = {
        dataType: 'text',
        operator: 'contains',
        value: '',
        value2: '',
        values: []
    }
    listInput.value = ''
    emit('filter-changed', props.field, null)
}

/**
 * Applique le filtre actuel
 * Émet l'événement avec la configuration du filtre
 */
const applyFilter = () => {
    emit('filter-changed', props.field, currentFilter.value)
}

/**
 * Ajoute une valeur à la liste des filtres
 * Utilisé pour les filtres de type 'in' et 'not_in'
 */
const addToList = () => {
    if (listInput.value.trim()) {
        if (!currentFilter.value.values) {
            currentFilter.value.values = []
        }
        currentFilter.value.values.push(listInput.value.trim())
        listInput.value = ''
        onFilterChange()
    }
}

/**
 * Supprime une valeur de la liste des filtres
 *
 * @param index - Index de la valeur à supprimer
 */
const removeFromList = (index: number) => {
    if (currentFilter.value.values) {
        currentFilter.value.values.splice(index, 1)
        onFilterChange()
    }
}

// ===== WATCHERS =====

/**
 * Initialise le filtre avec la configuration fournie
 */
watch(() => props.filterConfig, (newConfig) => {
    if (newConfig) {
        currentFilter.value = { ...newConfig }
    }
}, { immediate: true })

/**
 * Met à jour les opérateurs disponibles quand le type de données change
 * Sélectionne automatiquement le premier opérateur disponible
 */
watch(() => currentFilter.value.dataType, (newDataType) => {
    const operators = operatorsByDataType[newDataType]
    if (operators && operators.length > 0) {
        currentFilter.value.operator = operators[0].value
    }
    if (newDataType === 'select') {
        currentFilter.value.values = Array.isArray(currentFilter.value.values) ? currentFilter.value.values : []
    } else {
        currentFilter.value.values = []
    }
})

/**
 * Réinitialise les valeurs selon l'opérateur sélectionné
 */
watch(() => currentFilter.value.operator, (newOperator) => {
    if (['in', 'not_in'].includes(newOperator)) {
        currentFilter.value.values = Array.isArray(currentFilter.value.values) ? currentFilter.value.values : []
        currentFilter.value.value = ''
    } else if (['equals', 'not_equals'].includes(newOperator)) {
        if (Array.isArray(currentFilter.value.values)) {
            currentFilter.value.values = []
        }
    }
})
</script>

<style scoped>
/*
    Styles pour le composant AdvancedFilter
    Design moderne avec gradients et animations
*/

.advanced-filter {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
    min-width: 320px;
    max-width: 400px;
    overflow: hidden;
}

/* Header avec gradient coloré */
.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.filter-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
}

.close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 0.375rem;
    padding: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

/* Sections de configuration */
.filter-section {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f3f4f6;
}

.filter-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
}

.filter-select,
.filter-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    transition: all 0.2s;
}

.filter-select:focus,
.filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Contrôles de filtre */
.filter-controls {
    padding: 1rem 1.25rem;
}

.number-filter,
.date-filter {
    display: flex;
    gap: 0.75rem;
}

.list-filter {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.select-multi-filter {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.multi-select-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 220px;
    overflow-y: auto;
    padding-right: 0.25rem;
}

.multi-select-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: all 0.2s;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
    background: white;
}

.multi-select-option:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.multi-select-option input {
    width: 1rem;
    height: 1rem;
    accent-color: #3b82f6;
}

.multi-select-summary {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: right;
}

.list-inputs {
    display: flex;
    gap: 0.5rem;
}

.add-btn {
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
}

.add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.list-values {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.list-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    border: 1px solid #d1d5db;
}

.remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 0.125rem;
    border-radius: 0.25rem;
    transition: all 0.2s;
}

.remove-btn:hover {
    background: #fee2e2;
    color: #dc2626;
}

.null-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
}

.null-btn:hover {
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
    border-color: #9ca3af;
}

.regex-help {
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 0.75rem;
}

/* Section de validation */
.validation-section {
    padding: 1rem 1.25rem;
    border-top: 1px solid #f3f4f6;
    background: #f9fafb;
}

.validation-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.75rem 0;
}

.validation-inputs {
    display: flex;
    gap: 0.5rem;
}

.validation-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.75rem;
}

/* Boutons d'action */
.filter-actions {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

.clear-btn,
.apply-btn {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-btn {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    color: #374151;
    border: 1px solid #d1d5db;
}

.clear-btn:hover {
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
    transform: translateY(-1px);
}

.apply-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.apply-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* Dark mode */
.dark .advanced-filter {
    background: #1f2937;
    border-color: #374151;
}

.dark .filter-section {
    border-color: #374151;
}

.dark .filter-label {
    color: #d1d5db;
}

.dark .filter-select,
.dark .filter-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

.dark .filter-select:focus,
.dark .filter-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.dark .list-tag {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border-color: #6b7280;
    color: #f9fafb;
}

.dark .multi-select-option {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

.dark .multi-select-option:hover {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.dark .multi-select-summary {
    color: #9ca3af;
}

.dark .null-btn {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border-color: #6b7280;
    color: #f9fafb;
}

.dark .null-btn:hover {
    background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
}

.dark .validation-section {
    background: #111827;
    border-color: #374151;
}

.dark .validation-title {
    color: #d1d5db;
}

.dark .validation-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

.dark .filter-actions {
    background: #111827;
    border-color: #374151;
}

.dark .clear-btn {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    color: #f9fafb;
    border-color: #6b7280;
}

.dark .clear-btn:hover {
    background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
}

/* Responsive */
@media (max-width: 640px) {
    .advanced-filter {
        min-width: 280px;
        max-width: 90vw;
    }

    .number-filter,
    .date-filter {
        flex-direction: column;
    }

    .validation-inputs {
        flex-direction: column;
    }
}
</style>
