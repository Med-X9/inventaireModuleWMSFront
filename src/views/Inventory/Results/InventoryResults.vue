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
                    <!-- Select magasin déplacé dans le header -->
                    <div class="w-full md:w-80 lg:w-96">
                        <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Magasin
                    </label>
                    <SelectField
                        v-model="selectedStore"
                        :options="stores"
                        :clearable="false"
                        :searchable="true"
                        placeholder="Rechercher un magasin..."
                        :disabled="loading || stores.length === 0"
                            class="w-full"
                        searchPlaceholder="Tapez pour rechercher..."
                        @update:modelValue="onStoreChanged"
                    />
                    </div>
                </div>

                <!-- Boutons d'action : regroupés avec ButtonGroup -->
                <div class="flex justify-end">
                    <ButtonGroup :buttons="actionButtons" justify="end" />
                </div>
            </div>
        </div>

        <!-- DataTable harmonisée avec Affecter.vue -->
        <div v-if="selectedStore" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <DataTable
                :columns="columns"
                :rowDataProp="results"
                :actions="actions as any"
                :enableVirtualScrolling="false"
                :totalPagesProp="pagination.total_pages"
                :totalItemsProp="pagination.total"
                :rowSelection="false"
                @pagination-changed="(queryModel) => onResultsTableEvent('pagination', queryModel)"
                @sort-changed="(queryModel) => onResultsTableEvent('sort', queryModel)"
                @filter-changed="(queryModel) => onResultsTableEvent('filter', queryModel)"
                @global-search-changed="(queryModel) => onResultsTableEvent('search', queryModel)"
                storageKey="inventory_results_table"
                :loading="loading">
            </DataTable>
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
import { ref, computed, watch, onMounted } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'
import { InventoryResultsService } from '@/services/inventoryResultsService'
import { alertService } from '@/services/alertService'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'
import ButtonGroup, { type ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'

// ===== IMPORTS COMPOSABLES =====
import { useInventoryResults } from '@/composables/useInventoryResults'

// ===== IMPORTS TYPES =====
import type { InventoryResult } from '@/interfaces/inventoryResults'

// ===== IMPORTS ICÔNES =====
import IconPlay from '@/components/icon/icon-play.vue'
import IconDownload from '@/components/icon/icon-download.vue'
import IconListCheck from '@/components/icon/icon-list-check.vue'
import Swal from 'sweetalert2'

// ===== ROUTE =====
const route = useRoute()
const router = useRouter()

// ===== COMPUTED =====
/**
 * Référence de l'inventaire depuis l'URL
 */
const inventoryReference = computed(() => route.params.reference as string)


// ===== COMPOSABLE =====
/**
 * Initialisation du composable useInventoryResults
 *
 * Gère toute la logique métier de la page :
 * - Chargement des données (inventaire, magasins, résultats)
 * - Configuration du DataTable (colonnes, actions, pagination)
 * - Actions sur les résultats (validation, modification, lancement de comptage)
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
    handleStoreSelect,
    initialize,
    reinitialize,
    showLaunchCountingModal,
    onResultsTableEvent
} = useInventoryResults({ inventoryReference: inventoryReference.value })

// ===== ÉTAT EXPORT =====
const exportLoading = ref(false)

// Style commun pour les boutons d'action (fond blanc + bordure primary)
const ACTION_BUTTON_CLASS =
    'bg-white text-primary border border-primary hover:bg-primary hover:text-white ' +
    'dark:bg-slate-900 dark:text-primary dark:border-primary dark:hover:bg-primary ' +
    'dark:hover:text-white';

// ===== BOUTONS D'ACTION (pour le ButtonGroup) =====
const actionButtons = computed<ButtonGroupButton[]>(() => {
    const buttons: ButtonGroupButton[] = []

    buttons.push({
        id: 'jobs',
        label: 'Suivi des jobs',
        icon: IconListCheck,
        variant: 'default',
        class: ACTION_BUTTON_CLASS,
        disabled: !inventoryReference.value,
        visible: !!inventoryReference.value,
        onClick: () => {
            if (inventoryReference.value) {
                void router.push({ name: 'inventory-job-tracking', params: { reference: inventoryReference.value } })
            }
        }
    })

    buttons.push({
        id: 'launch-counting',
        label: 'Lancer comptage',
        icon: IconPlay,
        variant: 'default',
        class: ACTION_BUTTON_CLASS,
        disabled: !selectedStore.value,
        visible: !!selectedStore.value,
        onClick: () => { void handleLaunchCounting() }
    })

    buttons.push({
        id: 'export-consolidated',
        label: exportLoading.value ? 'Export...' : 'Exporter consolidé',
        icon: IconDownload,
        variant: 'default',
        class: ACTION_BUTTON_CLASS,
        disabled: !inventoryId.value || !selectedStore.value || exportLoading.value,
        visible: !!inventoryId.value && !!selectedStore.value,
        onClick: () => { void handleExportConsolidatedArticles() }
    })

    return buttons.filter(b => b.visible !== false)
})

// ===== HANDLERS =====

/**
 * Handler pour le changement de magasin dans le SelectField
 *
 * Appelé quand l'utilisateur sélectionne un nouveau magasin.
 * Le DataTable détecte automatiquement le changement via customDataTableParams
 * et recharge les résultats du nouveau magasin.
 *
 * @param {string | number | string[] | number[] | null} value - ID du magasin sélectionné
 * @async
 * @returns {Promise<void>}
 */
const onStoreChanged = async (value: string | number | string[] | number[] | null) => {
    if (!value) {
        return
    }

    const storeId = Array.isArray(value) ? value[0] : value
    await handleStoreSelectWrapper(String(storeId))
}

/**
 * Wrapper pour le handler de sélection de magasin
 *
 * Convertit la valeur du SelectField (qui peut être un tableau) en string simple.
 *
 * @param {string | null} storeId - ID du magasin
 * @async
 * @returns {Promise<void>}
 */
const handleStoreSelectWrapper = async (storeId: string | null) => {
    if (!storeId) return
    await handleStoreSelect(storeId)
}

/**
 * Handler pour lancer le comptage suivant
 *
 * Affiche la modal permettant de sélectionner les jobs nécessitant un comptage suivant
 * (3ème, 4ème, etc.) et de sélectionner une session pour le comptage.
 *
 * @async
 * @returns {Promise<void>}
 */
const handleLaunchCounting = async () => {
    await showLaunchCountingModal()
}

/**
 * Handler pour l'export des articles consolidés en Excel
 *
 * Exporte tous les articles consolidés de l'inventaire actuel dans un fichier Excel.
 * Affiche un loader pendant l'export et télécharge automatiquement le fichier.
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Si l'inventaire n'est pas sélectionné ou si l'export échoue
 */
const handleExportConsolidatedArticles = async () => {
    if (!inventoryId.value) {
        await alertService.warning({ text: 'Aucun inventaire sélectionné' })
            return
        }

    exportLoading.value = true

    try {
        // Afficher un loader
        const loadingSwal = Swal.fire({
            title: 'Export en cours...',
            text: 'Le fichier Excel est en cours de préparation. Veuillez patienter.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        // Appeler le service d'export
        const response = await InventoryResultsService.exportConsolidatedArticles(inventoryId.value)

        // Vérifier que la réponse contient un blob
        if (!response.data || !(response.data instanceof Blob)) {
            throw new Error('Aucune donnée reçue du backend')
        }

        // response.data est déjà un Blob quand responseType: 'blob' est utilisé
        const blob = response.data as Blob

        // Récupérer le type MIME depuis les headers ou utiliser un type par défaut
        const contentType = response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        // Générer le nom du fichier
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `Articles_Consolides_${inventoryReference.value || inventoryId.value}_${timestamp}.xlsx`

        // Télécharger le fichier
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)

        // Fermer le loader et afficher le succès
        await Swal.close()
        await alertService.success({
            text: 'Export Excel réussi'
        })

        logger.debug('Export des articles consolidés réussi', { filename })
    } catch (error: any) {
        logger.error('Erreur lors de l\'export des articles consolidés', error)

        // Extraire le message d'erreur
        const errorMessage = error?.response?.data?.message ||
                            error?.message ||
                            'Erreur lors de l\'export Excel'

        await Swal.close()
        await alertService.error({ text: errorMessage })
    } finally {
        exportLoading.value = false
    }
}

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
