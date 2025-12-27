<template>
    <button
        type="button"
        class="responsive-expander"
        :class="{ 'expanded': isExpanded }"
        @click="toggleExpansion"
        :aria-label="isExpanded ? 'Masquer les colonnes supplémentaires' : 'Afficher les colonnes supplémentaires'"
        :aria-expanded="isExpanded"
    >
        <svg
            v-if="!isExpanded"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
    </button>
</template>

<script setup lang="ts">
interface Props {
    isExpanded: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'toggle': []
}>()

const toggleExpansion = () => {
    emit('toggle')
}
</script>

<style scoped>
.responsive-expander {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: #ffffff;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
}

.responsive-expander:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
    color: #374151;
}

.responsive-expander.expanded {
    background-color: #eff6ff;
    border-color: #3b82f6;
    color: #3b82f6;
}

.dark .responsive-expander {
    background-color: #1f2937;
    border-color: #4b5563;
    color: #9ca3af;
}

.dark .responsive-expander:hover {
    background-color: #374151;
    border-color: #6b7280;
    color: #d1d5db;
}

.dark .responsive-expander.expanded {
    background-color: #1e3a8a;
    border-color: #60a5fa;
    color: #60a5fa;
}
</style>

