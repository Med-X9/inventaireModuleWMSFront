<template>
    <Card class="max-h-[600px] overflow-y-auto">
        <template #header>
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Récapitulatif</h2>
            </div>
        </template>

        <div>
            <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Informations générales
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                <div class="flex flex-col gap-1 p-2 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Libellé</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {{ header.libelle || 'Non défini' }}
                    </span>
                </div>

                <div class="flex flex-col gap-1 p-2 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Date</span>
                    <div class="flex items-center gap-1">
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ Formatters.formatDate(header.date) || 'Non définie' }}
                        </span>
                        <Badge v-if="header.date" variant="warning" size="sm">
                            {{ Formatters.formatDateShort(header.date) }}
                        </Badge>
                    </div>
                </div>

                <div class="flex flex-col gap-1 p-2 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Type</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ Formatters.formatInventoryType(header.inventory_type) || 'Non défini' }}
                    </span>
                </div>

                <div class="flex flex-col gap-1 p-2 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Compte</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {{ Formatters.formatAccount(header.compte) || 'Non défini' }}
                    </span>
                </div>

                <div class="flex flex-col gap-1 p-2 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Magasins</span>
                    <div class="flex flex-wrap gap-1">
                        <Badge v-if="!header.magasin || header.magasin.length === 0" variant="info" size="sm">
                            Aucun
                        </Badge>
                        <template v-else>
                            <Badge
                                v-for="(warehouse, idx) in header.magasin.slice(0, 2)"
                                :key="idx"
                                variant="success"
                                size="sm"
                            >
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
    </Card>
</template>

<script setup lang="ts">
import { Card, Badge } from '@SMATCH-Digital-dev/vue-system-design'
import { Formatters } from '@/utils/formatters'
import type { InventoryHeader } from '@/interfaces/inventoryCreation'

interface Props {
    header: InventoryHeader
}

defineProps<Props>()
</script>
