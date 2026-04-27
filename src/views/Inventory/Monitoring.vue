<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import MonitoringDashboard from '@/components/MonitoringDashboard.vue'

// ===== IMPORTS =====
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'

// ===== STORES =====
const inventoryStore = useInventoryStore()
const warehouseStore = useWarehouseStore()

// ===== PROPS =====
/**
 * Props reçus depuis la route
 */
interface Props {
    inventoryReference: string
    warehouseReference: string
}

const props = defineProps<Props>()

// ===== ÉTATS RÉACTIFS =====
const validatedInventoryId = ref<number | undefined>(undefined)
const validatedWarehouseId = ref<number | undefined>(undefined)
const isLoading = ref(true)
const error = ref<string | null>(null)

// ===== CONVERSION DES RÉFÉRENCES EN IDs =====
const loadIdsFromReferences = async () => {
    isLoading.value = true
    error.value = null

    try {
        const inventory = await inventoryStore.fetchInventoryByReference(props.inventoryReference)
        if (inventory?.id) {
            validatedInventoryId.value = inventory.id
        } else {
            throw new Error(`Inventaire introuvable : ${props.inventoryReference}`)
        }

        const warehouseId = await warehouseStore.fetchWarehouseByReference(props.warehouseReference)
        if (warehouseId) {
            validatedWarehouseId.value = warehouseId
        } else {
            throw new Error(`Entrepôt introuvable : ${props.warehouseReference}`)
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur inconnue'
        validatedInventoryId.value = undefined
        validatedWarehouseId.value = undefined
    } finally {
        isLoading.value = false
    }
}

// ===== LIFECYCLE =====
onMounted(() => {
    loadIdsFromReferences()
})

watch([() => props.inventoryReference, () => props.warehouseReference], () => {
    loadIdsFromReferences()
})
</script>

<template>
    <div class="monitoring-view h-full min-h-0 flex flex-col overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200/90 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <!-- Chargement -->
        <div
            v-if="isLoading"
            class="flex-1 flex items-center justify-center p-6 sm:p-10"
            aria-busy="true"
            aria-live="polite"
        >
            <div
                class="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700 shadow-xl px-8 py-10 text-center backdrop-blur-sm"
            >
                <div
                    class="animate-spin rounded-full h-14 w-14 border-2 border-slate-200 dark:border-slate-600 border-t-primary mx-auto mb-6"
                />
                <p class="text-lg font-semibold text-slate-900 dark:text-white m-0 mb-2">
                    Préparation du monitoring
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                    Chargement de l’inventaire et du magasin…
                </p>
            </div>
        </div>

        <!-- Erreur -->
        <div
            v-else-if="error"
            class="flex-1 flex items-center justify-center p-6 sm:p-10"
            role="alert"
        >
            <div
                class="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-red-200/80 dark:border-red-900/50 shadow-xl px-8 py-10 text-center"
            >
                <div
                    class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-4 text-2xl"
                    aria-hidden="true"
                >
                    !
                </div>
                <p class="text-lg font-semibold text-slate-900 dark:text-white m-0 mb-2">
                    Impossible d’ouvrir le monitoring
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400 m-0 mb-6 leading-relaxed">
                    {{ error }}
                </p>
                <button
                    type="button"
                    class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-md hover:brightness-105 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                    @click="loadIdsFromReferences"
                >
                    Réessayer
                </button>
            </div>
        </div>

        <!-- Dashboard : bandeau contexte + grille de zones (1 à N) -->
        <template v-else-if="validatedInventoryId && validatedWarehouseId">
            <header
                class="flex-shrink-0 z-10 px-4 py-3 sm:px-6 border-b border-slate-200/90 dark:border-slate-700/90 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-sm"
            >
                <div class="max-w-[1920px] mx-auto">
                    <div>
                        <h1 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">
                            Monitoring par zone
                        </h1>
                        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 m-0 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span>
                                <span class="text-slate-500 dark:text-slate-500">Inventaire</span>
                                <span class="font-semibold text-slate-800 dark:text-slate-200 ml-1">{{ inventoryReference }}</span>
                            </span>
                            <span class="hidden sm:inline text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                            <span>
                                <span class="text-slate-500 dark:text-slate-500">Magasin</span>
                                <span class="font-semibold text-slate-800 dark:text-slate-200 ml-1">{{ warehouseReference }}</span>
                            </span>
                        </p>
                    </div>
                </div>
            </header>
            <div class="flex-1 min-h-0 overflow-hidden">
                <MonitoringDashboard
                    :inventory-id="validatedInventoryId"
                    :warehouse-id="validatedWarehouseId"
                />
            </div>
        </template>

        <!-- Données manquantes -->
        <div v-else class="flex-1 flex items-center justify-center p-8">
            <p class="text-sm text-slate-600 dark:text-slate-400 text-center m-0">
                Données manquantes pour afficher le monitoring.
            </p>
        </div>
    </div>
</template>

<style scoped>
.monitoring-view {
    width: 100%;
}
</style>
