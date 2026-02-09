<template>
    <!-- Header normal - toujours visible -->
        <div class="table-header">
            <div class="header-left">
                <slot name="header-left" />
            </div>
            <div class="header-center">
                <slot name="header-center" />
            </div>
            <div class="header-right">
                <slot name="header-right" />
            </div>
        </div>

        <!-- Barre d'outils améliorée -->
        <div class="toolbar flex justify-between items-center">
            <div class="search-container">
                <div class="search-wrapper">
                    <IconSearch class="search-icon" />
                    <input
                        ref="searchInputRef"
                        :value="globalSearchTerm"
                        type="text"
                        placeholder="Rechercher dans toutes les colonnes..."
                        class="search-input"
                        @input="onSearchInput" />
                    <button v-if="globalSearchTerm" @click="clearSearch" class="search-clear" title="Effacer la recherche">
                        <IconX class="w-3 h-3" />
                    </button>
                </div>
            </div>

            <button
                v-if="hasActiveFilters"
                @click="clearAllFilters"
                class="filter-reset-button"
                :title="`${activeFiltersCount} filtre(s) actif(s) - Cliquer pour réinitialiser`">
                <span class="filter-badge">{{ activeFiltersCount }}</span>
                <IconTrash class="filter-icon" />
                <span class="filter-text">Réinitialiser</span>
            </button>
        </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { computed, ref, nextTick, onMounted, watch } from 'vue'
import IconSearch from '../icon/icon-search.vue'
import IconX from '../icon/icon-x.vue'
import IconTrash from '../icon/icon-trash.vue'

interface Props {
    globalSearchTerm: string
    filterState: Record<string, any>
    advancedFilters: Record<string, any>
    loading?: boolean
}

interface Emits {
    (e: 'update:globalSearchTerm', value: string): void
    (e: 'clear-all-filters'): void
}

const props = withDefaults(defineProps<Props>(), {
    loading: false
})
const emit = defineEmits<Emits>()

// Référence à l'input de recherche pour préserver le focus
const searchInputRef = ref<HTMLInputElement | null>(null)
let lastFocusedElement: HTMLInputElement | null = null
let shouldRestoreFocus = false

// Préserver le focus lors des re-renders
watch(() => props.globalSearchTerm, async () => {
    if (shouldRestoreFocus && searchInputRef.value && document.activeElement === document.body) {
        await nextTick()
        searchInputRef.value.focus()
        // Restaurer la position du curseur si possible
        if (lastFocusedElement && searchInputRef.value === lastFocusedElement) {
            const cursorPosition = (lastFocusedElement as any).__cursorPosition || searchInputRef.value.value.length
            searchInputRef.value.setSelectionRange(cursorPosition, cursorPosition)
        }
        shouldRestoreFocus = false
    }
})

onMounted(() => {
    // Écouter les événements de focus pour sauvegarder la position du curseur
    if (searchInputRef.value) {
        searchInputRef.value.addEventListener('focus', () => {
            lastFocusedElement = searchInputRef.value
            shouldRestoreFocus = true
        })
        searchInputRef.value.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement
            if (target === searchInputRef.value) {
                (target as any).__cursorPosition = target.selectionStart || target.value.length
            }
        })
    }
})

// Fonction pour vérifier si un filtre est actif (a une valeur non vide)
const isFilterActive = (filter: any): boolean => {
    if (!filter) return false

    // Vérifier différents formats de filtres
    if (typeof filter === 'string') {
        return filter.trim() !== ''
    }

    if (typeof filter === 'object') {
        // Format émis par FilterDropdown : { field, operator, dataType, value, values, value2 }
        // Vérifier d'abord si c'est un objet filtre complet (émis par FilterDropdown)
        if (filter.field !== undefined || filter.operator !== undefined || filter.dataType !== undefined) {
            // Format FilterDropdown - vérifier les valeurs possibles
            // Vérifier d'abord filter.values (pour les filtres select multi-choix)
            if (filter.values !== undefined && Array.isArray(filter.values)) {
                return filter.values.length > 0
            }
            // Ensuite filter.value (pour les filtres texte/nombre/date simple)
            if (filter.value !== undefined && filter.value !== null) {
                if (typeof filter.value === 'string') {
                    return filter.value.trim() !== ''
                }
                if (Array.isArray(filter.value)) {
                    return filter.value.length > 0
                }
                return true
            }
            // Ensuite filter.value2 (pour les filtres de plage "entre")
            if (filter.value2 !== undefined && filter.value2 !== null) {
                // Si value2 existe, vérifier aussi que value existe pour un filtre "entre" valide
                return filter.value !== undefined && filter.value !== null
            }
            return false
        }

        // Format { filter: value }
        if (filter.filter !== undefined && filter.filter !== null) {
            if (typeof filter.filter === 'string') {
                return filter.filter.trim() !== ''
            }
            return true
        }

        // Format { value: value }
        if (filter.value !== undefined && filter.value !== null) {
            if (typeof filter.value === 'string') {
                return filter.value.trim() !== ''
            }
            if (Array.isArray(filter.value)) {
                return filter.value.length > 0
            }
            return true
        }

        // Format { values: [] }
        if (filter.values !== undefined && Array.isArray(filter.values)) {
            return filter.values.length > 0
        }

        // Format { value2: value } (pour les filtres de plage)
        if (filter.value2 !== undefined && filter.value2 !== null) {
            return true
        }
    }

    return false
}

const hasActiveFilters = computed(() => {
    // Compter les filtres actifs dans filterState
    const activeFilterStateCount = Object.keys(props.filterState || {}).filter(key =>
        isFilterActive(props.filterState[key])
    ).length

    // Compter les filtres actifs dans advancedFilters
    const activeAdvancedFiltersCount = Object.keys(props.advancedFilters || {}).filter(key =>
        isFilterActive(props.advancedFilters[key])
    ).length

    return activeFilterStateCount > 0 || activeAdvancedFiltersCount > 0
})

const activeFiltersCount = computed(() => {
    // Compter uniquement les filtres qui ont une valeur active
    const activeFilterStateCount = Object.keys(props.filterState || {}).filter(key =>
        isFilterActive(props.filterState[key])
    ).length

    const activeAdvancedFiltersCount = Object.keys(props.advancedFilters || {}).filter(key =>
        isFilterActive(props.advancedFilters[key])
    ).length

    return activeFilterStateCount + activeAdvancedFiltersCount
})

const onSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    // Sauvegarder la position du curseur
    if (target === searchInputRef.value) {
        (target as any).__cursorPosition = target.selectionStart || target.value.length
        shouldRestoreFocus = true
    }
    emit('update:globalSearchTerm', target.value)
}

const clearSearch = () => {
    emit('update:globalSearchTerm', '')
}

const clearAllFilters = () => {
    emit('clear-all-filters')
}
</script>

<style scoped>
/* Styles de base */
.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.dark .table-header {
    background-color: #2d3748;
    border-color: #4a5568;
}

/* Toolbar */
.toolbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #ffffff;
    border-bottom: 1px solid #e9ecef;
}

.dark .toolbar {
    background-color: #1a202c;
    border-color: #4a5568;
}

/* Recherche améliorée */
.search-container {
    position: relative;
    flex: 1;
    max-width: 400px;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

/* Style DataTables avec couleurs du thème pour la recherche */
.search-input {
    width: 100%;
    padding: 0.5rem 2.5rem 0.5rem 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-size: 0.875rem;
    background-color: var(--color-bg-card);
    color: var(--color-text);
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.dark .search-input {
    background-color: var(--color-bg-card);
    border-color: var(--color-border);
    color: var(--color-text);
}

/* Focus style avec couleurs du thème */
.search-input:focus {
    outline: 0;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0.2rem rgba(79, 70, 229, 0.25);
    background-color: var(--color-bg-card);
}

.dark .search-input:focus {
    border-color: var(--color-primary-light);
    box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.25);
    background-color: var(--color-bg-card);
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #6b7280;
    z-index: 1;
}

.search-clear {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: #6b7280;
    transition: all 0.2s;
}

.search-clear:hover {
    background-color: #f3f4f6;
    color: #374151;
}

.dark .search-clear:hover {
    background-color: #374151;
    color: #f9fafb;
}

/* Bouton de réinitialisation des filtres avec compteur */
.filter-reset-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #f59e0b;
    border-radius: 0.5rem;
    color: #92400e;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-left: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .filter-reset-button {
    background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
    border-color: #f59e0b;
    color: #fde68a;
}

.filter-reset-button:hover {
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
    border-color: #d97706;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.dark .filter-reset-button:hover {
    background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
    border-color: #fbbf24;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.filter-reset-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Badge avec le nombre de filtres */
.filter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.375rem;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.dark .filter-badge {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    box-shadow: 0 2px 4px rgba(248, 113, 113, 0.4);
}

/* Icône de réinitialisation */
.filter-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
}

/* Texte du bouton */
.filter-text {
    font-weight: 600;
    white-space: nowrap;
}

/* Animation du badge quand le compteur change */
.filter-badge {
    animation: pulse-badge 0.3s ease-in-out;
}

@keyframes pulse-badge {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .toolbar {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .search-container {
        max-width: none;
        width: 100%;
    }

    .filter-reset-button {
        margin-left: 0;
        margin-top: 0.5rem;
        width: 100%;
        justify-content: center;
    }
}

/* Skeleton pour le header */
.header-skeleton {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    overflow: hidden;
}

.dark .header-skeleton {
    background-color: #1a202c;
    border-color: #4a5568;
}

.skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.dark .skeleton-header {
    background-color: #2d3748;
    border-color: #4a5568;
}

.skeleton-search {
    flex: 1;
    max-width: 400px;
}

.skeleton-search-input {
    height: 2.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.5rem;
}

.dark .skeleton-search-input {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-actions {
    display: flex;
    gap: 0.5rem;
}

.skeleton-button {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.375rem;
}

.dark .skeleton-button {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

/* Animation shimmer */
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}
</style>
