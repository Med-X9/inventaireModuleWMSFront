<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Carte unifiée : Titre page + sélection magasin + actions -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl">
            <div class="flex flex-col gap-6">
                <!-- Titre de la page + select magasin dans le header -->
                <div class="flex justify-between items-start flex-wrap gap-6">
                <div class="flex-1">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 m-0 mb-2 leading-tight">
                                Résultats d'inventaire
                                <span v-if="inventoryReference" class="text-xl font-semibold text-primary ml-3">
                                    {{ inventoryReference }}
                                </span>
                            </h1>
                                <p class="text-base text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                                    Consultez et validez les résultats des comptages par magasin
                                </p>
                            </div>
                        </div>
                    </div>
                    <!-- Le magasin est maintenant déterminé par la référence dans l'URL (?warehouse=...) -->
                </div>

                <!-- Boutons d'action : regroupés avec ButtonGroup -->
                <div class="flex justify-end">
                    <ButtonGroup :buttons="actionButtons" justify="end" />
                </div>
            </div>
        </div>

        <!-- DataTable (package) - même pattern que InventoryManagement.vue -->
        <div v-if="selectedStore" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <DataTable
                :key="resultsTableKey"
                :columns="columns"
                :rowDataProp="results"
                :actions="actions as any"
                :enableVirtualScrolling="undefined"
                :currentPageProp="pagination.current_page"
                :totalPagesProp="pagination.total_pages"
                :totalItemsProp="pagination.total"
                :pageSizeProp="pagination.page_size"
                :customDataTableParams="resultsCustomParams"
                @query-model-changed="(queryModel) => onResultsTableEvent('query-model-changed', queryModel)"
                storageKey="inventory_results_table"
                ref="resultsTableRef"
                :loading="loading"
                :enableDynamicColumns="false"
                :debounceFilter="300"
                :debounceSearch="300"
                :pagination="true"
                :enableFiltering="true"
                :enableGlobalSearch="true"
            />
        </div>

        <!-- Message si aucun magasin sélectionné -->
        <div v-else class="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100 m-0 mb-2">Sélectionnez un magasin</h3>
            <p class="text-base text-slate-600 dark:text-slate-400 m-0">Veuillez sélectionner un magasin pour afficher les résultats d'inventaire</p>
        </div>

        <!-- Modal d'export des résultats -->
        <Modal
            v-model="showExportResultsModal"
            size="sm"
            :hide-close-button="true"
        >
            <template #header>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Export en cours
                </h3>
            </template>

            <template #body>
                <div class="flex flex-col items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                    <p class="text-slate-600 dark:text-slate-400 text-center">
                        {{ exportResultsModalMessage }}
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-500 mt-2">
                        Veuillez patienter, cette opération peut prendre quelques instants...
                    </p>
                </div>
            </template>
        </Modal>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue InventoryResults - Résultats d'inventaire
 *
 * Cette vue affiche et permet de gérer les résultats d'inventaire par magasin.
 *
 * ## Fonctionnalités
 * - **Visualisation** : Affichage des résultats avec colonnes dynamiques (comptages, écarts, statuts)
 * - **Pagination, tri et filtrage** : Gestion côté serveur harmonisée avec Affecter.vue
 * - **Actions sur les résultats** :
 *   - Modifier le résultat final avec justification optionnelle
 *   - Valider les écarts de comptage
 * - **Actions globales** :
 *   - Sélectionner un magasin pour filtrer les résultats
 *   - Lancer des comptages suivants (3ème, 4ème, etc.)
 *   - Exporter les articles consolidés en Excel
 *
 * ## Architecture
 * - Utilise `useInventoryResults` composable pour toute la logique métier
 * - DataTable harmonisée avec `useAffecter` et `Affecter.vue`
 * - Store Pinia `useResultsStore` pour stocker les données
 *
 * ## Route
 * - Path : `/inventory/:reference/results`
 * - Paramètre : `reference` - Référence de l'inventaire
 *
 * @component InventoryResults
 * @example
 * ```vue
 * <InventoryResults />
 * <!-- Accède automatiquement à route.params.reference -->
 * ```
 */

// ===== IMPORTS VUE =====
import { computed, watch, onMounted } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'

// ===== IMPORTS COMPOSANTS =====
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import Modal from '@/components/Modal.vue'

// ===== IMPORTS COMPOSABLES =====
import { useInventoryResults } from '@/composables/useInventoryResults'

// ===== ROUTE =====
const route = useRoute()
const router = useRouter()

// ===== COMPUTED =====
/**
 * Référence de l'inventaire depuis l'URL
 */
const inventoryReference = computed(() => route.params.reference as string)

/**
 * Référence du warehouse depuis l'URL (?warehouse=...)
 */
const warehouseRefFromUrl = computed(() => route.query.warehouse as string | undefined)

// ===== COMPOSABLE =====
/**
 * Initialisation du composable useInventoryResults
 *
 * Gère toute la logique métier de la page :
 * - Chargement des données (inventaire, magasins, résultats)
 * - Configuration du DataTable (colonnes, actions, pagination)
 * - Actions sur les résultats (validation, modification, lancement de comptage)
 * - Gestion des boutons d'action et handlers
 *
 * Le DataTable utilise maintenant l'approche harmonisée avec useAffecter.ts
 */
const {
    loading,
    stores,
    results,
    columns,
    actions,
    selectedStore,
    inventoryId,
    pagination,
    resultsStore,
    handleStoreSelect,
    initialize,
    reinitialize,
    reloadResults,
    showLaunchCountingModal,
    resultsCustomParams,
    onResultsTableEvent,
    // Pour la vue
    actionButtons,
    exportLoading,
    exportResultsLoading,
    showExportResultsModal,
    exportResultsModalMessage,
    onStoreChanged,
    resultsKey,
    resultsTableKey,
    resultsTableRef,
    resultsQueryModel
} = useInventoryResults({
    inventoryReference: inventoryReference.value,
    initialWarehouseReference: warehouseRefFromUrl.value,
    route,
    router
})

// ===== BOUTONS D'ACTION =====
// Les boutons sont maintenant gérés par le composable useInventoryResults

// ===== HANDLERS =====
// Tous les handlers sont maintenant gérés par le composable useInventoryResults

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(async () => {
    try {
        logger.debug('Initialisation de la page résultats', { reference: inventoryReference.value })
        await initialize(inventoryReference.value)
    } catch (error) {
        logger.error('Erreur lors de l\'initialisation', error)
    }
})

/**
 * Watch pour surveiller les changements de référence dans l'URL
 */
watch(inventoryReference, async (newReference, oldReference) => {
    if (!newReference || newReference === oldReference) return

    try {
        logger.debug('Changement de référence détecté', { old: oldReference, new: newReference })
        await reinitialize(newReference)
    } catch (error) {
        logger.error('Erreur lors du changement de référence', error)
    }
})
</script>

<style scoped>
</style>
