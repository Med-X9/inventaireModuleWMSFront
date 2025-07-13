<template>
    <!-- Skeleton loader pour le header pendant le chargement -->
    <div v-if="loading" class="header-skeleton">
        <div class="skeleton-header">
            <div class="skeleton-search">
                <div class="skeleton-search-input"></div>
            </div>
            <div class="skeleton-actions">
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
            </div>
        </div>
    </div>

    <!-- Header normal quand pas de chargement -->
    <template v-else>
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
                    <input :value="globalSearchTerm" type="text" placeholder="Rechercher dans toutes les colonnes..."
                        class="search-input" @input="onSearchInput" />
                    <button v-if="globalSearchTerm" @click="clearSearch" class="search-clear" title="Effacer la recherche">
                        <IconX class="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div v-if="hasActiveFilters" class="active-filters-simple">
                <div class="filters-counter">
                    <IconSearch class="w-4 h-4" />
                    <span class="filters-count-text">{{ activeFiltersCount }} filtre(s) actif(s)</span>
                </div>
                <button @click="clearAllFilters" class="clear-filters-btn-simple" title="Effacer tous les filtres">
                    <IconTrash class="w-4 h-4" />
                </button>
            </div>
        </div>
    </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const hasActiveFilters = computed(() => {
    const filterStateKeys = Object.keys(props.filterState || {})
    const advancedFiltersKeys = Object.keys(props.advancedFilters || {})
    return filterStateKeys.length > 0 || advancedFiltersKeys.length > 0
})

const activeFiltersCount = computed(() => {
    const filterStateKeys = Object.keys(props.filterState || {})
    const advancedFiltersKeys = Object.keys(props.advancedFilters || {})
    return filterStateKeys.length + advancedFiltersKeys.length
})

const onSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
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

.search-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 2.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background-color: #f9fafb;
    transition: all 0.2s ease;
}

.dark .search-input {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #f7fafc;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .search-input:focus {
    background-color: #1a202c;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
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

/* Styles pour les filtres actifs simplifiés */
.active-filters-simple {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 0.5rem;
    margin-left: 1rem;
}

.dark .active-filters-simple {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    border-color: #3b82f6;
}

.filters-counter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #0369a1;
    font-size: 0.875rem;
    font-weight: 500;
}

.dark .filters-counter {
    color: #93c5fd;
}

.filters-count-text {
    font-size: 0.875rem;
    font-weight: 500;
}

.clear-filters-btn-simple {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: none;
    border-radius: 0.375rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 32px;
    height: 32px;
}

.dark .clear-filters-btn-simple {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.clear-filters-btn-simple:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .clear-filters-btn-simple:hover {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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

    .active-filters-simple {
        margin-left: 0;
        margin-top: 0.5rem;
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
