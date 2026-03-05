<template>
    <Card class="max-h-[600px] overflow-y-auto">
        <template #header>
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h2 class="text-lg font-semibold text-gray-800">Récapitulatif</h2>
            </div>
        </template>

        <div class="space-y-4">
            <!-- Informations générales compactes -->
            <div>
                <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Informations générales</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    <div class="flex flex-col gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span class="text-xs text-gray-500">Libellé</span>
                        <span class="text-sm font-semibold text-gray-900 truncate">{{ header.libelle || 'Non défini' }}</span>
                    </div>

                    <div class="flex flex-col gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span class="text-xs text-gray-500">Date</span>
                        <div class="flex items-center gap-1">
                            <span class="text-sm font-semibold text-gray-900">{{ Formatters.formatDate(header.date) || 'Non définie' }}</span>
                            <Badge v-if="header.date" variant="warning" size="sm">
                                {{ Formatters.formatDateShort(header.date) }}
                            </Badge>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span class="text-xs text-gray-500">Type</span>
                        <span class="text-sm font-semibold text-gray-900">{{ Formatters.formatInventoryType(header.inventory_type) || 'Non défini' }}</span>
                    </div>

                    <div class="flex flex-col gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span class="text-xs text-gray-500">Compte</span>
                        <span class="text-sm font-semibold text-gray-900 truncate">{{ Formatters.formatAccount(header.compte) || 'Non défini' }}</span>
                    </div>

                    <div class="flex flex-col gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span class="text-xs text-gray-500">Magasins</span>
                        <div class="flex flex-wrap gap-1">
                            <Badge v-if="!header.magasin || header.magasin.length === 0" variant="info" size="sm">
                                Aucun
                            </Badge>
                            <template v-else>
                                <Badge v-for="(warehouse, idx) in header.magasin.slice(0, 2)" :key="idx" variant="success" size="sm">
                                    {{ Formatters.formatWarehouseName(warehouse) }}
                                </Badge>
                                <Badge v-if="header.magasin.length > 2" variant="info" size="sm">
                                    +{{ header.magasin.length - 2 }}
                                </Badge>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comptages compacts -->
            <div>
                <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Configuration des comptages</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div
                        v-for="(comptage, index) in comptages"
                        :key="index"
                        class="flex flex-col gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                    >
                        <div class="flex items-center gap-2">
                            <Badge variant="primary" size="sm">Comptage {{ index + 1 }}</Badge>
                            <Badge v-if="comptage.mode" variant="info" size="sm">
                                {{ Formatters.formatMode(comptage.mode) }}
                            </Badge>
                        </div>

                        <div v-if="comptage.mode === 'en vrac'" class="flex flex-wrap gap-1">
                            <Badge v-if="comptage.inputMethod" variant="warning" size="sm">
                                {{ Formatters.formatInputMethod(comptage.inputMethod) }}
                            </Badge>
                            <Badge v-if="comptage.saisieQuantite" variant="success" size="sm">Saisie quantité</Badge>
                            <Badge v-if="comptage.scannerUnitaire" variant="info" size="sm">Scanner unitaire</Badge>
                        </div>

                        <div v-if="comptage.mode === 'par article'" class="flex flex-wrap gap-1">
                            <Badge v-if="comptage.numeroSerie" variant="success" size="sm">Numéro de série</Badge>
                            <Badge v-if="comptage.numeroLot" variant="info" size="sm">Numéro de lot</Badge>
                            <Badge v-if="comptage.dlc" variant="warning" size="sm">DLC</Badge>
                            <Badge v-if="comptage.isVariante" variant="info" size="sm">Variante</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { Card, Badge } from '@SMATCH-Digital-dev/vue-system-design';
import { Formatters } from '@/utils/formatters';
import type { InventoryHeader, Comptage } from '@/interfaces/inventoryCreation';

interface Props {
    header: InventoryHeader;
    comptages: Comptage[];
}

defineProps<Props>();
</script>
