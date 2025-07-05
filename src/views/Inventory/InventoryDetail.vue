<template>
    <div class="space-y-2">
        <!-- En-tête -->
        <div class="flex flex-wrap gap-2 mb-4 justify-end">
            <!-- Buttons for "En préparation" status -->
            <template v-if="inventory?.status?.toLowerCase() === 'en préparation'">
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="launchInventory">
                    <IconPlay class="w-4 h-4" />
                    Lancer
                </button>
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="editInventory">
                    <IconEdit class="w-4 h-4" />
                    Modifier
                </button>
            </template>

            <!-- Buttons for "En réalisation" status -->
            <template v-else-if="inventory?.status?.toLowerCase() === 'en réalisation'">
                <button class="btn btn-danger p-2 px-4 flex items-center gap-2" @click="cancelInventory">
                    <IconCancel class="w-4 h-4" />
                    Annuler
                </button>
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="terminateInventory">
                    <IconCheck class="w-4 h-4" />
                    Terminer
                </button>
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="closeInventory">
                    <IconLock class="w-4 h-4" />
                    Clôturer
                </button>
            </template>

            <!-- Buttons for "Terminé" status -->
            <template v-else-if="inventory?.status?.toLowerCase() === 'terminé'">
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="closeInventory">
                    <IconLock class="w-4 h-4" />
                    Clôturer
                </button>
            </template>

            <!-- PDF button - always visible except for "Clôturé" status where it's the only button -->
            <button type="button" @click="exportToPDF" v-tippy:button
                class="btn btn-primary p-2 px-4 flex items-center gap-2">
                <IconDownload class="w-4 h-4" />
                PDF
            </button>
            <tippy target="button" placement="bottom">Exporter en PDF</tippy>
        </div>

        <!-- Container principal -->
        <div v-if="inventory" class="panel">
            <!-- Onglets -->
            <div class="border-b border-gray-200 overflow-x-auto md:overflow-hidden">
                <nav class="flex py-3 gap-6 sm:gap-12 -mb-px min-w-max">
                    <button v-for="tab in tabs" :key="tab.id" @click="currentTab = tab.id" :class="[
                        'font-medium whitespace-nowrap pb-2',
                        currentTab === tab.id
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-secondary dark:text-white-dark hover:text-secondary-600 hover:border-secondary-light'
                    ]">
                        {{ tab.label }}
                    </button>
                </nav>
            </div>

            <div>
                <!-- Informations générales -->
                <div v-if="currentTab === 'general'" class="space-y-6 py-8">
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div
                            class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 dark:border-gray-700">
                            <h2 class="text-lg text-gray-800 dark:text-white-light mb-2 sm:mb-0">Informations générales
                            </h2>
                            <span :class="[
                                'px-3 py-1 rounded-full text-sm font-semibold',
                                getStatusClass(inventory?.status)
                            ]">
                                {{ inventory.status }}
                            </span>
                        </div>
                        <div class="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            <!-- Référence -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Référence</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.reference || 'Non défini' }}
                                </span>
                            </div>
                            <!-- Libellé -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Libellé</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.label || 'Non défini' }}
                                </span>
                            </div>
                            <!-- Date d'inventaire -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Date d'inventaire</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ formatDate(inventory.date) }}
                                </span>
                            </div>
                            <!-- Type -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Type</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.inventory_type || 'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Card : Paramètres de comptage -->
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div
                            class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                            <div class="flex items-center gap-3">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-white-light">Paramètres de
                                    comptage
                                </h3>
                            </div>
                        </div>
                        <div class="px-4 sm:px-4 py-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <div v-for="(comptage, i) in inventory.comptages" :key="i"
                                    class="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-1 group">
                                    <!-- Numéro de comptage avec badge -->
                                    <div class="flex items-center justify-between mb-4">
                                        <div class="flex items-center gap-3">
                                            <h4 class="font-normal dark:text-gray-100 text-base">
                                                {{ i + 1 }}{{ i === 0 ? 'er' : 'ème' }} comptage
                                            </h4>
                                        </div>
                                    </div>

                                    <!-- Mode de comptage avec style amélioré -->
                                    <div class="mb-4">
                                        <div
                                            class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div class="flex items-center gap-3">
                                                <span
                                                    class="text-sm font-semibold text-gray-700 dark:text-gray-200">Mode
                                                    de
                                                    comptage</span>
                                            </div>
                                            <span class="text-sm bg-gray/10  px-3 py-1 rounded-full">
                                                {{ comptage.count_mode || 'Non défini' }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Options avec badges colorés -->
                                    <div class="space-y-2">
                                        <div class="flex flex-wrap gap-2">
                                            <span v-if="comptage.is_variant"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                Variantes
                                            </span>

                                            <span v-if="comptage.show_product"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                Guide Article
                                            </span>

                                            <span v-if="comptage.quantity_show"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                Guide Quantité
                                            </span>

                                            <span v-if="comptage.entry_quantity"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                Scanner unitaire
                                            </span>

                                            <span v-if="comptage.entry_quantity"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                Saisie quantité
                                            </span>

                                            <span v-if="comptage.dlc"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                DLC
                                            </span>

                                            <span v-if="comptage.n_serie"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                N° Série
                                            </span>

                                            <span v-if="comptage.n_lot"
                                                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs  text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                N° Lot
                                            </span>
                                        </div>

                                        <!-- Indicateur si aucune option -->
                                        <div v-if="!hasAnyOption(comptage)"
                                            class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clip-rule="evenodd" />
                                            </svg>
                                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                                Configuration de base
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card : Magasins associés -->
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg text-gray-800 dark:text-white-light">Magasins associés</h3>
                                <span class="text-sm text-gray-500 dark:text-gray-400">{{ magasinsGridData.length }}
                                    magasin(s)</span>
                            </div>
                        </div>
                        <div>
                            <GridView class="p-4" :data="magasinsGridData" titleField="" :columns="3"
                                :enableStats="false" :enableActions="true" :actions="magasinActions" :itemsPerPage="6"
                                :enablePagination="true" :selectedItem="null">
                                <template #content="{ item }">
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <div class="w-2 h-2 bg-primary rounded-full"></div>
                                            <span
                                                class="font-semibold text-md dark:text-white-dark text-secondary group-hover:text-primary transition-colors duration-300">{{
                                                item.name }}</span>
                                        </div>
                                    </div>
                                </template>
                            </GridView>
                        </div>
                    </div>

                    <!-- Card : Équipes assignées -->
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg text-gray-800 dark:text-white-light">Équipes assignées</h3>
                                <span class="text-sm text-gray-500 dark:text-gray-400">{{ teamsGridData.length }}
                                    équipe(s)</span>
                            </div>
                        </div>
                        <div class="p-4">
                            <GridView :data="teamsGridData" titleField="" :columns="3" :enableStats="false"
                                :enableActions="true" :actions="teamActions" :itemsPerPage="6" :enablePagination="true"
                                :selectedItem="null">
                                <template #content="{ item }">
                                    <div class="space-y-3">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span class="text-primary font-semibold text-sm">{{ item.initial
                                                    }}</span>
                                            </div>
                                            <div class="flex-1">
                                                <div
                                                    class="font-semibold text-md dark:text-white-dark text-secondary group-hover:text-primary transition-colors duration-300">
                                                    {{ item.type }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </GridView>
                        </div>
                    </div>
                </div>

                <!-- Comptages détaillés -->
                <div v-else class="py-5">
                    <template v-for="tab in tabs.filter(t => t.id !== 'general')" :key="tab.id">
                        <div v-if="currentTab === tab.id">
                            <div class="space-y-1">
                                <!-- Table view -->
                                <div class="overflow-hidden">
                                    <DataTable :columns="jobColumns" :rowDataProp="getJobsForTab(tab.id)"
                                        :pagination="true" :showColumnSelector="true"
                                        :storageKey="'inventory_jobs_' + tab.id">
                                        <template #contenu>
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                                <!-- En attente -->
                                                <div
                                                    class="flex items-center justify-between bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg px-4  hover:shadow-md transition-all duration-300 hover:-translate-y-0.3 h-9.5">
                                                    <div class="flex items-center">
                                                        <div class="flex items-center space-x-1">
                                                            <div class="w-2 h-2 bg-primary rounded-full animate-pulse">
                                                            </div>
                                                            <div class="w-1 h-1 bg-primary rounded-full opacity-60">
                                                            </div>
                                                            <div class="w-1 h-1 bg-primary rounded-full opacity-30">
                                                            </div>
                                                        </div>
                                                        <span class="text-sm font-medium text-gray-600 ml-3">En
                                                            attente</span>
                                                    </div>
                                                    <div class="flex items-center">
                                                        <span class="text-lg font-medium text-gray-800 mr-2">{{
                                                            getRemainingJobsCount(tab.id) }}</span>
                                                    </div>
                                                </div>

                                                <!-- En cours -->
                                                <div
                                                    class="flex items-center justify-between bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg px-4  hover:shadow-md transition-all duration-300 hover:-translate-y-0.3 h-9.5">
                                                    <div class="flex items-center">
                                                        <div class="flex items-center space-x-1">
                                                            <div
                                                                class="w-1.5 h-1.5 bg-info rounded-full animate-bounce">
                                                            </div>
                                                            <div class="w-1.5 h-1.5 bg-info rounded-full animate-bounce"
                                                                style="animation-delay: 0.1s"></div>
                                                            <div class="w-1.5 h-1.5 bg-info rounded-full animate-bounce"
                                                                style="animation-delay: 0.2s"></div>
                                                        </div>
                                                        <span class="text-sm font-medium text-gray-600 ml-3">En
                                                            cours</span>
                                                    </div>
                                                    <div class="flex items-center">
                                                        <span class="text-lg font-medium text-gray-800 mr-2">{{
                                                            getInProgressJobsCount(tab.id) }}</span>
                                                    </div>
                                                </div>

                                                <!-- Terminés -->
                                                <div
                                                    class="flex items-center justify-between bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg px-4 h-9.5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.3">
                                                    <div class="flex items-center">
                                                        <div class="flex items-center">
                                                            <div class="w-2 h-2 bg-success rounded-full relative">
                                                                <div
                                                                    class="absolute inset-0 w-2 h-2 bg-success rounded-full animate-ping opacity-40">
                                                                </div>
                                                            </div>
                                                            <div class="w-2 h-0.5 bg-success ml-1"></div>
                                                        </div>
                                                        <span
                                                            class="text-sm font-medium text-gray-600 ml-3">Terminés</span>
                                                    </div>
                                                    <div class="flex items-center">
                                                        <span class="text-lg  font-medium  text-gray-800 mr-2">{{
                                                            getCompletedJobsCount(tab.id) }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </DataTable>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import GridView from '@/components/GridView/GridView.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import IconPlay from '@/components/icon/icon-play.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconCancel from '@/components/icon/icon-cancel.vue';
import IconCheck from '@/components/icon/icon-check.vue';
import IconLock from '@/components/icon/icon-lock.vue';
import { useInventoryDetail } from '@/composables/useInventoryDetail';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';

const route = useRoute();
const inventoryId = Number(route.params.id);

const {
    currentTab,
    inventory,
    tabs,
    jobColumns,
    magasins,
    teamsGridData,
    magasinsGridData,
    teamActions,
    magasinActions,
    launchInventory,
    editInventory,
    cancelInventory,
    terminateInventory,
    closeInventory,
    formatDate,
    getStatusClass,
    getJobsForTab,
    loadDetailData,
    getCompletedJobsCount,
    getInProgressJobsCount,
    getRemainingJobsCount,
    getTotalJobsCount,
    exportToPDF,
} = useInventoryDetail(inventoryId);

// Helper function to check if comptage has any option enabled
const hasAnyOption = (comptage: ComptageConfig): boolean => {
    return comptage.isVariante ||
        comptage.guideArticle ||
        comptage.guideQuantite ||
        comptage.dlc ||
        comptage.numeroSerie ||
        comptage.numeroLot ||
        comptage.inputMethod === 'scanner' ||
        comptage.inputMethod === 'saisie' ||
        comptage.scannerUnitaire ||
        comptage.saisieQuantite;
};

onMounted(() => {
    loadDetailData();
});
</script>