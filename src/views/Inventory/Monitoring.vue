<script setup lang="ts">
import { computed } from 'vue'
import MonitoringDashboard from '@/components/MonitoringDashboard.vue'

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
</script>

<template>
  <div class="monitoring-view">
    <MonitoringDashboard 
      v-if="validatedInventoryId && validatedWarehouseId"
      :inventory-id="validatedInventoryId"
      :warehouse-id="validatedWarehouseId" />
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
.monitoring-view {
  width: 100%;
  height: 100%;
}
</style>

