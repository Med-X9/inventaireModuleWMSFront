<template>
    <div class="flex flex-col bg-gray-50 p-3 rounded border border-gray-200 hover:shadow-sm transition-all duration-200 hover:border-gray-300">
        <div class="flex items-center gap-2 mb-2">
            <IconComponent icon="warehouse" class="w-3 h-3 text-primary" />
            <span class="text-xs font-medium text-gray-600 uppercase tracking-wide">Magasins</span>
        </div>
        <div class="space-y-1">
            <span v-if="!warehouses || warehouses.length === 0" class="text-xs font-semibold text-gray-500">
                Aucun magasin sélectionné
            </span>
            <div v-else class="space-y-1">
                <div v-for="(warehouse, index) in warehouses" :key="index" class="flex items-center justify-between bg-white p-1.5 rounded border border-gray-100">
                    <span class="text-xs font-semibold text-gray-900 truncate">
                        {{ Formatters.formatWarehouseName(warehouse) }}
                    </span>
                    <span v-if="warehouse.date" class="text-xs px-1.5 py-0.5 bg-warning-100 text-warning-700 rounded-full border border-warning-200 font-medium">
                        {{ Formatters.formatDateShort(warehouse.date) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Formatters } from '@/utils/formatters';
import type { Warehouse } from '@/interfaces/inventoryCreation';
import IconComponent from './IconComponent.vue';

interface Props {
    warehouses?: Warehouse[];
}

defineProps<Props>();
</script>
