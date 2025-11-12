<template>
    <div class="nested-data-expander">
        <!-- Ligne parent avec bouton d'expansion -->
        <div class="parent-row" @click="toggleExpansion">
            <div class="expand-button" :class="{ 'expanded': isExpanded }">
                <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
            </div>
            <div class="parent-content">
                <slot name="parent-content" :row="row" :column="column" :value="value" />
            </div>
        </div>

        <!-- Lignes enfants (quand expandé) -->
        <transition name="nested-expand">
            <div v-if="isExpanded" class="nested-rows">
                <slot name="nested-rows" :nestedItems="nestedItems" :parentRow="row" :column="column" :nestedLevel="nestedLevel" />
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    row: any
    column: any
    value: any
    isExpanded: boolean
    nestedLevel?: number
}

interface Emits {
    (e: 'toggle'): void
}

const props = withDefaults(defineProps<Props>(), {
    nestedLevel: 0
})

const emit = defineEmits<Emits>()

// Extraire les éléments imbriqués selon la configuration
const nestedItems = computed(() => {
    const config = props.column.nestedData
    if (!config) return []

    const data = props.value
    if (!data) return []

    // Si c'est un tableau, l'utiliser directement
    if (Array.isArray(data)) {
        return data
    }

    // Si c'est un objet, essayer d'extraire selon la clé
    if (typeof data === 'object' && data !== null) {
        const key = config.key
        const items = data[key]

        if (Array.isArray(items)) {
            return items
        }
    }

    return []
})

// Fonction pour basculer l'expansion
const toggleExpansion = () => {
    emit('toggle')
}
</script>

<style scoped>
.nested-data-expander {
    width: 100%;
}

.parent-row {
    display: flex;
    align-items: center;
    width: 100%;
    cursor: pointer;
    padding: 4px 0;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.parent-row:hover {
    background-color: #f9fafb;
}

.dark .parent-row:hover {
    background-color: #374151;
}

.expand-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-right: 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.expand-button:hover {
    background-color: #e5e7eb;
}

.dark .expand-button:hover {
    background-color: #4b5563;
}

.expand-icon {
    font-size: 12px;
    color: #6b7280;
    transition: all 0.2s ease;
    user-select: none;
}

.expand-button:hover .expand-icon {
    color: #3b82f6;
}

.dark .expand-icon {
    color: #9ca3af;
}

.dark .expand-button:hover .expand-icon {
    color: #60a5fa;
}

.parent-content {
    flex: 1;
}

.nested-rows {
    margin-top: 4px;
}

/* Animation pour l'expansion */
.nested-expand-enter-active,
.nested-expand-leave-active {
    transition: all 0.3s ease;
}

.nested-expand-enter-from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
}

.nested-expand-leave-to {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
}

.nested-expand-enter-to,
.nested-expand-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
}

/* Responsive */
@media (max-width: 768px) {
    .parent-row {
        padding: 6px 0;
    }

    .expand-button {
        width: 20px;
        height: 20px;
        margin-right: 6px;
    }

    .expand-icon {
        font-size: 10px;
    }
}
</style>
