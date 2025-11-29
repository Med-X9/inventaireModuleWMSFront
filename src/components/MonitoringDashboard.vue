<script setup lang="ts">
import { computed } from 'vue'
import { useMonitoring, type ZoneMonitoringData } from '@/composables/useMonitoring'

const {
  loading,
  monitoringData,
  autoRefreshEnabled,
  chargerDonnees,
  toggleAutoRefresh
} = useMonitoring()

// Classes CSS pour les LEDs selon le statut
const getLedClass = (status: string) => {
  const baseClass = 'w-2.5 h-2.5 rounded-full inline-block'
  switch (status) {
    case 'success':
      return `${baseClass} bg-emerald-500`
    case 'warning':
      return `${baseClass} bg-amber-500`
    case 'danger':
      return `${baseClass} bg-red-500`
    case 'info':
      return `${baseClass} bg-blue-500`
    default:
      return `${baseClass} bg-slate-400`
  }
}

// Formatage des pourcentages
const formatPourcentage = (value: number) => {
  return `${value}%`
}

// Formatage des nombres
const formatNombre = (value: number) => {
  return value.toString()
}
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 overflow-hidden">
    <!-- En-tête minimaliste -->
    <div class="flex-shrink-0 flex justify-end items-center px-4 py-2 bg-white border-b border-slate-200">
      <div class="flex gap-2">
        <button
          @click="chargerDonnees"
          :disabled="loading"
          class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all disabled:opacity-40 rounded hover:bg-slate-100"
        >
          <span class="text-sm" :class="{ 'animate-spin': loading }">↻</span>
        </button>
        <button
          @click="toggleAutoRefresh"
          :class="[
            'w-7 h-7 flex items-center justify-center rounded transition-all',
            autoRefreshEnabled
              ? 'bg-emerald-100 text-emerald-600'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          ]"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="autoRefreshEnabled ? 'bg-emerald-500' : 'bg-slate-400'"></span>
        </button>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading && !monitoringData" class="flex-1 flex items-center justify-center bg-white">
      <div class="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>

    <!-- Dashboard de monitoring compact -->
    <div v-else-if="monitoringData" class="flex-1 overflow-hidden bg-white p-2">
      <div class="h-full grid grid-rows-[auto_1fr] gap-1">
        <!-- Métriques globales compactes -->
        <div class="grid grid-cols-5 gap-1">
          <div class="bg-slate-50 rounded p-1 border-2 border-slate-300 text-center">
            <div class="text-[9px] text-slate-500 mb-0.5">Total Équipe</div>
            <div class="text-xl font-bold text-slate-900">{{ formatNombre(monitoringData.total.nombreEquipes) }}</div>
          </div>
          <div class="bg-slate-50 rounded p-1 border-2 border-slate-300 text-center">
            <div class="text-[9px] text-slate-500 mb-0.5">JOB</div>
            <div class="text-xl font-bold text-slate-900">{{ formatNombre(monitoringData.total.totalJobs) }}</div>
          </div>
          <div class="bg-slate-50 rounded p-1 border-2 border-slate-300 text-center">
            <div class="text-[9px] text-slate-500 mb-0.5">1er Clôturé</div>
            <div class="text-xl font-bold text-emerald-600">{{ formatNombre(monitoringData.total.premierComptage.cloture) }}</div>
            <div class="text-[7px] text-slate-500">({{ formatPourcentage(monitoringData.total.premierComptage.cloturePourcentage) }})</div>
          </div>
          <div class="bg-slate-50 rounded p-1 border-2 border-slate-300 text-center">
            <div class="text-[9px] text-slate-500 mb-0.5">2ème Clôturé</div>
            <div class="text-xl font-bold text-emerald-600">{{ formatNombre(monitoringData.total.deuxiemeComptage.cloture) }}</div>
          </div>
          <div class="bg-slate-50 rounded p-1 border-2 border-slate-300 text-center">
            <div class="text-[9px] text-slate-500 mb-0.5">3ème Terminé</div>
            <div class="text-xl font-bold text-emerald-600">{{ formatNombre(monitoringData.total.troisiemeComptage.termine) }}</div>
          </div>
        </div>

        <!-- Zones en grille compacte -->
        <div class="grid grid-cols-3 grid-rows-3 gap-1 overflow-hidden">
          <div
            v-for="zone in monitoringData.zones"
            :key="zone.zoneId"
            class="bg-white rounded border-2 border-slate-300 p-1 hover:shadow-md transition-all"
          >
            <!-- En-tête zone centré -->
            <div class="flex flex-col items-center gap-0.5 mb-1 pb-1 border-b-2 border-slate-200">
              <span :class="getLedClass(zone.statusLed)" class="animate-pulse"></span>
              <div class="text-center">
                <div class="text-[9px] font-semibold text-slate-900">{{ zone.zoneName }}</div>
                <div class="text-[7px] text-slate-500">{{ zone.zoneDescription }}</div>
              </div>
            </div>

            <!-- Métriques compactes - une ligne par comptage -->
            <div class="space-y-1">
              <!-- Équipes et JOB -->
              <div class="grid grid-cols-2 gap-0.5">
                <div class="bg-slate-50 rounded p-0.5 border border-slate-200 text-center">
                  <div class="text-[8px] text-slate-500 mb-0.5">Éq</div>
                  <div class="text-lg font-bold text-slate-900">{{ formatNombre(zone.nombreEquipes) }}</div>
                </div>
                <div class="bg-slate-50 rounded p-0.5 border border-slate-200 text-center">
                  <div class="text-[8px] text-slate-500 mb-0.5">JOB</div>
                  <div class="text-lg font-bold text-slate-900">{{ formatNombre(zone.totalJobs) }}</div>
                </div>
              </div>

              <!-- 1er comptage - une ligne complète -->
              <div class="bg-slate-50 rounded p-1 border border-slate-200">
                <div class="text-[8px] text-slate-500 mb-0.5 text-center font-medium">1er</div>
                <div class="grid grid-cols-3 gap-0.5">
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">✓</div>
                    <div class="text-lg font-bold text-emerald-600">{{ formatNombre(zone.premierComptage.cloture) }}</div>
                    <div class="text-[7px] text-slate-500">({{ formatPourcentage(zone.premierComptage.cloturePourcentage) }})</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">→</div>
                    <div class="text-lg font-bold text-[#FECD1C]">{{ formatNombre(zone.premierComptage.enCours) }}</div>
                    <div class="text-[7px] text-slate-500">({{ formatPourcentage(zone.premierComptage.enCoursPourcentage) }})</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">○</div>
                    <div class="text-lg font-bold text-amber-600">{{ formatNombre(zone.premierComptage.nonEntame) }}</div>
                    <div class="text-[7px] text-slate-500">({{ formatPourcentage(zone.premierComptage.nonEntamePourcentage) }})</div>
                  </div>
                </div>
              </div>

              <!-- 2e comptage - une ligne complète -->
              <div class="bg-slate-50 rounded p-1 border border-slate-200">
                <div class="text-[8px] text-slate-500 mb-0.5 text-center font-medium">2ème</div>
                <div class="grid grid-cols-3 gap-0.5">
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">✓</div>
                    <div class="text-lg font-bold text-emerald-600">{{ formatNombre(zone.deuxiemeComptage.cloture) }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">→</div>
                    <div class="text-lg font-bold text-[#FECD1C]">{{ formatNombre(zone.deuxiemeComptage.enCours) }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">○</div>
                    <div class="text-lg font-bold text-amber-600">{{ formatNombre(zone.deuxiemeComptage.nonEntame) }}</div>
                  </div>
                </div>
              </div>

              <!-- 3e comptage - une ligne complète -->
              <div class="bg-slate-50 rounded p-1 border border-slate-200">
                <div class="text-[8px] text-slate-500 mb-0.5 text-center font-medium">3ème</div>
                <div class="grid grid-cols-3 gap-0.5">
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">✓</div>
                    <div class="text-lg font-bold text-emerald-600">{{ formatNombre(zone.troisiemeComptage.termine) }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">→</div>
                    <div class="text-lg font-bold text-[#FECD1C]">{{ formatNombre(zone.troisiemeComptage.enCours) }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[7px] text-slate-500 mb-0.5">○</div>
                    <div class="text-lg font-bold text-amber-600">{{ formatNombre(zone.troisiemeComptage.nonEntame) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="flex-1 flex items-center justify-center bg-white">
      <div class="text-center">
        <button
          @click="chargerDonnees"
          class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all rounded hover:bg-slate-100"
        >
          ↻
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animation pulse subtile pour les LEDs */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
</style>
