<template>
    <tr role="row" class="empty-state-row">
        <td 
            :colspan="colspan" 
            class="empty-state-cell" 
            role="cell"
            :aria-live="ariaLive"
            :aria-atomic="true"
        >
            <div class="empty-state-container">
                <!-- Icône -->
                <div class="empty-state-icon" v-if="icon">
                    <component :is="icon" class="w-12 h-12" />
                </div>
                <div v-else class="empty-state-icon-default">
                    <!-- Icône selon le type -->
                    <svg v-if="props.type === 'forbidden'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <svg v-else class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                    </svg>
                </div>

                <!-- Titre -->
                <h3 class="empty-state-title">
                    {{ title }}
                </h3>

                <!-- Description -->
                <p v-if="description" class="empty-state-description">
                    {{ description }}
                </p>

                <!-- Message contextuel selon le type -->
                <p v-if="contextMessage" class="empty-state-context">
                    {{ contextMessage }}
                </p>

                <!-- Actions -->
                <div v-if="actions && actions.length > 0" class="empty-state-actions">
                    <button
                        v-for="(action, index) in actions"
                        :key="index"
                        @click="action.onClick"
                        :class="['empty-state-action', action.primary ? 'primary' : 'secondary']"
                        :aria-label="action.label"
                    >
                        <component v-if="action.icon" :is="action.icon" class="w-4 h-4 mr-2" />
                        {{ action.label }}
                    </button>
                </div>
            </div>
        </td>
    </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// Utiliser une icône simple ou créer un placeholder
// Pour l'instant, on utilise un SVG inline

interface EmptyStateAction {
    label: string
    onClick: () => void
    primary?: boolean
    icon?: any
}

interface Props {
    colspan: number
    title?: string
    description?: string
    icon?: any
    type?: 'no-data' | 'no-results' | 'error' | 'loading' | 'empty-filters' | 'forbidden'
    hasFilters?: boolean
    hasSearch?: boolean
    actions?: EmptyStateAction[]
    ariaLive?: 'polite' | 'assertive' | 'off'
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Aucune donnée',
    description: '',
    type: 'no-data',
    hasFilters: false,
    hasSearch: false,
    ariaLive: 'polite'
})

// Message contextuel selon le type et l'état
const contextMessage = computed(() => {
    if (props.type === 'no-results') {
        if (props.hasFilters && props.hasSearch) {
            return 'Aucun résultat ne correspond à vos critères de recherche et de filtrage.'
        } else if (props.hasFilters) {
            return 'Aucun résultat ne correspond à vos filtres. Essayez de modifier vos critères.'
        } else if (props.hasSearch) {
            return 'Aucun résultat ne correspond à votre recherche. Essayez d\'autres mots-clés.'
        }
        return 'Aucun résultat trouvé.'
    } else if (props.type === 'error') {
        return 'Une erreur est survenue lors du chargement des données.'
    } else if (props.type === 'empty-filters') {
        return 'Aucune donnée ne correspond aux filtres appliqués.'
    } else if (props.type === 'forbidden') {
        return 'Vous n\'avez pas les permissions nécessaires pour accéder à ces données. Contactez votre administrateur si vous pensez que c\'est une erreur.'
    }
    return 'Il n\'y a actuellement aucune donnée à afficher.'
})
</script>

<style scoped>
.empty-state-row {
    border: none;
}

.empty-state-cell {
    padding: 3rem 1.5rem !important;
    text-align: center;
    vertical-align: middle;
}

.empty-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    max-width: 500px;
    margin: 0 auto;
}

.empty-state-icon,
.empty-state-icon-default {
    color: #9ca3af;
    opacity: 0.5;
    margin-bottom: 0.5rem;
}

.dark .empty-state-icon,
.dark .empty-state-icon-default {
    color: #6b7280;
}

.empty-state-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.dark .empty-state-title {
    color: #e5e7eb;
}

.empty-state-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
}

.dark .empty-state-description {
    color: #9ca3af;
}

.empty-state-context {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    font-style: italic;
}

.dark .empty-state-context {
    color: #9ca3af;
}

.empty-state-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: wrap;
    justify-content: center;
}

.empty-state-action {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    transition: all 0.2s;
    cursor: pointer;
    border: 1px solid transparent;
}

.empty-state-action.primary {
    background-color: #FECD1C;
    color: #1f2937;
    border-color: #FECD1C;
}

.empty-state-action.primary:hover {
    background-color: #e6b800;
    border-color: #e6b800;
}

.empty-state-action.secondary {
    background-color: transparent;
    color: #6b7280;
    border-color: #d1d5db;
}

.empty-state-action.secondary:hover {
    background-color: #f9fafb;
    color: #374151;
    border-color: #9ca3af;
}

.dark .empty-state-action.secondary {
    color: #9ca3af;
    border-color: #4b5563;
}

.dark .empty-state-action.secondary:hover {
    background-color: #374151;
    color: #e5e7eb;
    border-color: #6b7280;
}
</style>

