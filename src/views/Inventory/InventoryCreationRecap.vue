<template>
    <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <!-- En-tête du récapitulatif -->
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 border-b border-gray-200">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h2 class="text-lg font-semibold text-gray-800">Récapitulatif</h2>
            </div>
        </div>

        <div class="p-4">
            <!-- Informations générales compactes -->
            <div class="mb-4">
                <h3 class="text-sm font-semibold text-gray-700 mb-3">Informations générales</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <InfoCard
                        icon="document"
                        label="Libellé"
                        :value="header.libelle || 'Non défini'"
                    />

                    <InfoCard
                        icon="calendar"
                        label="Date"
                        :value="Formatters.formatDate(header.date)"
                        :badge="header.date ? Formatters.formatDateShort(header.date) : undefined"
                    />

                    <InfoCard
                        icon="type"
                        label="Type"
                        :value="Formatters.formatInventoryType(header.inventory_type)"
                    />

                    <InfoCard
                        icon="account"
                        label="Compte"
                        :value="Formatters.formatAccount(header.compte)"
                    />

                    <WarehousesCard
                        :warehouses="header.magasin"
                    />
                </div>
            </div>

            <!-- Comptages compacts -->
            <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-3">Configuration des comptages</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <ComptageCard
                        v-for="(comptage, index) in comptages"
                        :key="index"
                        :comptage="comptage"
                        :index="index"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Formatters } from '@/utils/formatters';
import type { InventoryHeader, Comptage } from '@/interfaces/inventoryCreation';
import InfoCard from './components/InfoCard.vue';
import WarehousesCard from './components/WarehousesCard.vue';
import ComptageCard from './components/ComptageCard.vue';

interface Props {
    header: InventoryHeader;
    comptages: Comptage[];
}

defineProps<Props>();
</script>
