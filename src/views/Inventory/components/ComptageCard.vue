<template>
    <div class="flex flex-col bg-gray-50 p-3 rounded border border-gray-200 hover:shadow-sm transition-all duration-200 hover:border-gray-300">
        <div class="flex items-center gap-2 mb-2">
            <IconComponent icon="comptage" class="w-4 h-4 text-primary" />
            <span class="text-xs font-semibold text-gray-700">Comptage {{ index + 1 }}</span>
        </div>

        <div class="mb-2">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Mode :</span>
            <span class="text-xs font-semibold text-primary ml-1">{{ Formatters.formatMode(comptage.mode) }}</span>
        </div>

        <div v-if="comptage.mode === 'en vrac'" class="space-y-1">
            <div v-if="comptage.inputMethod" class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 bg-warning-100 text-warning-700 rounded-full border border-warning-200 shadow-sm font-medium">
                    {{ Formatters.formatInputMethod(comptage.inputMethod) }}
                </span>
            </div>
            <div v-if="comptage.saisieQuantite" class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 shadow-sm font-medium">
                    ✓ Saisie quantité
                </span>
            </div>
            <div v-if="comptage.scannerUnitaire" class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200 shadow-sm font-medium">
                    ✓ Scanner unitaire
                </span>
            </div>
        </div>

        <div v-if="comptage.mode === 'par article'" class="space-y-1">
            <div v-if="comptage.numeroSerie" class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200 shadow-sm font-medium">
                    ✓ Numéro de série
                </span>
            </div>
            <div v-if="comptage.numeroLot" class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 shadow-sm font-medium">
                    ✓ Numéro de lot
                </span>
            </div>
            <div v-if="comptage.dlc" class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 shadow-sm font-medium">
                    ✓ Date limite de consommation
                </span>
            </div>
            <div v-if="comptage.isVariante" class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full border border-orange-200 shadow-sm font-medium">
                    ✓ Variante
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Formatters } from '@/utils/formatters';
import type { Comptage } from '@/interfaces/inventoryCreation';
import IconComponent from './IconComponent.vue';

interface Props {
    comptage: Comptage;
    index: number;
}

defineProps<Props>();
</script>
