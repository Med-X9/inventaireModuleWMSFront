<template>
    <div class="flex flex-col bg-gray-50 p-3 rounded border border-gray-200 hover:shadow-sm transition-all duration-200 hover:border-gray-300">
        <div class="flex items-center gap-2 mb-2">
            <IconComponent :icon="icon" class="w-3 h-3" style="color: #FECD1C;" />
            <span class="text-xs font-medium text-gray-600 uppercase tracking-wide">{{ label }}</span>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-gray-900 truncate">{{ value }}</span>
            <span v-if="badge" class="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200 font-medium">
                {{ badge }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import IconComponent from './IconComponent.vue';

interface Props {
    icon: string;
    label: string;
    value: string;
    badge?: string;
}

defineProps<Props>();
</script>
