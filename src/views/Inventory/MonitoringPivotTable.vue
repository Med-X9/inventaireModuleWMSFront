<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMonitoring } from '@/composables/useMonitoring'
import PivotTableWidget from '@/components/Monitoring/PivotTableWidget.vue'

// ===== PROPS =====
/**
 * Props reçus depuis la route
 */
interface Props {
  inventoryId: string
  warehouseId: string
}

const props = defineProps<Props>()

// ===== VALIDATION ET CONVERSION DES IDs =====
/**
 * Convertit et valide l'ID de l'inventaire
 */
const validatedInventoryId = computed(() => {
  const id = Number(props.inventoryId)
  if (isNaN(id) || id <= 0) {
    console.error('ID d\'inventaire invalide:', props.inventoryId)
    return undefined
  }
  return id
})

/**
 * Convertit et valide l'ID de l'entrepôt
 */
const validatedWarehouseId = computed(() => {
  const id = Number(props.warehouseId)
  if (isNaN(id) || id <= 0) {
    console.error('ID d\'entrepôt invalide:', props.warehouseId)
    return undefined
  }
  return id
})

// ===== COMPOSABLE =====
const {
  loading,
  monitoringData,
  autoRefreshEnabled,
  chargerDonnees,
  toggleAutoRefresh
} = useMonitoring({
  inventoryId: validatedInventoryId.value,
  warehouseId: validatedWarehouseId.value
})


// Charger les données au montage
onMounted(() => {
  chargerDonnees()
})
</script>

<template>
  <div class="monitoring-pivot-view h-full w-full flex flex-col bg-slate-500 dark:bg-slate-800 overflow-hidden">
    <!-- En-tête minimaliste (même que MonitoringDashboard) -->
    <div class="flex-shrink-0 flex justify-end items-center px-2 py-1 bg-white dark:bg-[#1b2e4b] border-b border-slate-200 dark:border-gray-700">
      <div class="flex gap-1">
        <button
          @click="chargerDonnees"
          :disabled="loading"
          class="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-40 rounded hover:bg-slate-100 dark:hover:bg-gray-700"
          title="Actualiser"
        >
          <span class="text-xs" :class="{ 'animate-spin': loading }">↻</span>
        </button>
        <button
          @click="toggleAutoRefresh"
          :class="[
            'w-6 h-6 flex items-center justify-center rounded transition-all',
            autoRefreshEnabled
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
          ]"
          title="Auto-actualisation"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="autoRefreshEnabled ? 'bg-emerald-500' : 'bg-slate-400'"
          />
        </button>
      </div>
    </div>

    <!-- Tableau croisé dynamique -->
    <div v-if="validatedInventoryId && validatedWarehouseId" class="flex-1 overflow-hidden">
      <PivotTableWidget
        :data="monitoringData"
        :loading="loading"
      />
    </div>

    <!-- Erreur si IDs invalides -->
    <div v-else class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="text-red-500 text-lg font-semibold mb-2">Erreur</div>
        <div class="text-slate-600 dark:text-slate-400">
          IDs d'inventaire ou d'entrepôt invalides
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitoring-pivot-view {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  min-height: 0 !important;
  max-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}
</style>

