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
        console.log('[Monitoring] Loading IDs for references:', {
            inventoryReference: props.inventoryReference,
            warehouseReference: props.warehouseReference
        })

        // Charger l'inventaire
        const inventory = await inventoryStore.fetchInventoryByReference(props.inventoryReference)
        if (inventory?.id) {
            validatedInventoryId.value = inventory.id
            console.log('[Monitoring] Inventory ID loaded:', inventory.id)
        } else {
            throw new Error(`Inventaire introuvable: ${props.inventoryReference}`)
        }

        // Charger l'entrepôt
        const warehouseId = await warehouseStore.fetchWarehouseByReference(props.warehouseReference)
        if (warehouseId) {
            validatedWarehouseId.value = warehouseId
            console.log('[Monitoring] Warehouse ID loaded:', warehouseId)
        } else {
            throw new Error(`Entrepôt introuvable: ${props.warehouseReference}`)
        }

        console.log('[Monitoring] IDs successfully loaded')
    } catch (err) {
        console.error('[Monitoring] Error loading IDs:', err)
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

// Recharger si les références changent
watch([() => props.inventoryReference, () => props.warehouseReference], () => {
    loadIdsFromReferences()
})
</script>

<template>
    <div class="monitoring-view">
        <!-- État de chargement -->
        <div v-if="isLoading" class="flex items-center justify-center h-screen">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div class="text-slate-600 dark:text-slate-400">
                    Chargement du monitoring...
                </div>
            </div>
        </div>

        <!-- État d'erreur -->
        <div v-else-if="error" class="flex items-center justify-center h-screen">
            <div class="text-center">
                <div class="text-red-500 text-lg font-semibold mb-2">Erreur</div>
                <div class="text-slate-600 dark:text-slate-400 mb-4">
                    {{ error }}
                </div>
                <button @click="loadIdsFromReferences"
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    Réessayer
                </button>
            </div>
        </div>

        <!-- Monitoring chargé -->
        <MonitoringDashboard v-else-if="validatedInventoryId && validatedWarehouseId"
            :inventory-id="validatedInventoryId" :warehouse-id="validatedWarehouseId" />

        <!-- État par défaut (erreur) -->
        <div v-else class="flex items-center justify-center h-screen">
            <div class="text-center">
                <div class="text-red-500 text-lg font-semibold mb-2">Erreur</div>
                <div class="text-slate-600 dark:text-slate-400">
                    Données manquantes pour afficher le monitoring
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.monitoring-view {
    width: 100%;
    height: 100%;
}
</style>
