<template>
    <div class="nested-data-cell">
        <!-- Affichage principal avec bouton d'expansion -->
        <div class="nested-content" @click="toggleExpansion">
            <div class="nested-info">
                <span class="nested-count">
                    {{ itemCount }} {{ countSuffix }}
                </span>
                <span v-if="showCount" class="nested-indicator">
                    {{ isExpanded ? '▼' : '▶' }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    value: any
    column: any
    row: any
    isExpanded: boolean
    parentRow?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'toggle': []
}>()

// Configuration des données imbriquées
const config = computed(() => props.column.nestedData)

// Éléments imbriqués
const nestedItems = computed(() => {
    if (!props.value) return []

    // Si c'est un tableau, l'utiliser directement
    if (Array.isArray(props.value)) {
        return props.value
    }

    // Si c'est un objet, essayer d'extraire selon la clé
    if (typeof props.value === 'object' && props.value !== null) {
        const key = config.value?.key
        const items = props.value[key]

        if (Array.isArray(items)) {
            return items
        }
    }

    return []
})

// Nombre d'éléments
const itemCount = computed(() => nestedItems.value.length)

// Suffixe pour le compteur
const countSuffix = computed(() => config.value?.countSuffix || 'éléments')

// Afficher le compteur
const showCount = computed(() => config.value?.showCount !== false)

// Bascule l'expansion
const toggleExpansion = () => {
    emit('toggle')
}
</script>

<style scoped>
.nested-data-cell {
    width: 100%;
    cursor: pointer;
}

.nested-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
}

.nested-content:hover {
    background-color: #f0f9ff;
}

.dark .nested-content:hover {
    background-color: #1e3a8a;
}

.nested-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.nested-count {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
}

.dark .nested-count {
    color: #f3f4f6;
}

.nested-indicator {
    font-size: 0.75rem;
    color: #6b7280;
    transition: transform 0.2s ease;
}

.nested-content:hover .nested-indicator {
    color: #3b82f6;
}
</style>
