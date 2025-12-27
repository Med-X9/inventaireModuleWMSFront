<script setup lang="ts">
import { computed } from 'vue'
import { useMonitoring, type ZoneMonitoringData } from '@/composables/useMonitoring'
import IconCheck from '@/components/icon/icon-check.vue'
import IconPlay from '@/components/icon/icon-play.vue'
import IconClock from '@/components/icon/icon-clock.vue'
import IconUsers from '@/components/icon/icon-users.vue'
import IconBox from '@/components/icon/icon-box.vue'

// ===== PROPS =====
/**
 * Props pour le monitoring dashboard
 */
interface Props {
  inventoryId?: number
  warehouseId?: number
}

const props = withDefaults(defineProps<Props>(), {
  inventoryId: undefined,
  warehouseId: undefined
})

// ===== COMPOSABLE =====
const {
  loading,
  monitoringData,
  autoRefreshEnabled,
  chargerDonnees,
  toggleAutoRefresh
} = useMonitoring({
  inventoryId: props.inventoryId,
  warehouseId: props.warehouseId
})

// Classes CSS pour les LEDs selon le statut
const getLedClass = (status: string) => {
  const baseClass = 'w-2 h-2 rounded-full inline-block'
  switch (status) {
    case 'success':
      return `${baseClass} bg-emerald-500`
    case 'warning':
      // Utilisation de la couleur primaire du projet pour le statut "warning"
      return `${baseClass} bg-[#FECD1C]`
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
    <div class="min-h-screen flex flex-col bg-slate-500 dark:bg-slate-800 overflow-auto">
    <!-- En-tête minimaliste -->
    <div class="flex-shrink-0 flex justify-end items-center px-4 py-2 bg-white dark:bg-[#1b2e4b] border-b border-slate-200 dark:border-gray-700">
      <div class="flex gap-2">
                <button @click="chargerDonnees" :disabled="loading"
                    class="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-40 rounded hover:bg-slate-100 dark:hover:bg-gray-700">
          <span class="text-sm" :class="{ 'animate-spin': loading }">↻</span>
        </button>
                <button @click="toggleAutoRefresh" :class="[
            'w-7 h-7 flex items-center justify-center rounded transition-all',
            autoRefreshEnabled
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                ]">
                    <span class="w-1.5 h-1.5 rounded-full"
                        :class="autoRefreshEnabled ? 'bg-emerald-500' : 'bg-slate-400'"></span>
        </button>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading && !monitoringData" class="monitoring-container bg-slate-500 dark:bg-slate-800 p-1">
      <div class="flex flex-col gap-1">
        <!-- Skeleton métriques globales -->
        <div class="grid grid-cols-5 gap-1">
          <div v-for="i in 5" :key="`metric-${i}`" class="bg-white dark:bg-[#1b2e4b] rounded-lg p-1 shadow-sm">
            <div class="flex items-center justify-center gap-1">
              <div class="w-4 h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
              <div class="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
              <div class="h-6 w-12 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <!-- Skeleton zones en grille -->
        <div class="grid grid-cols-3 grid-rows-3 gap-1">
          <div v-for="i in 9" :key="`zone-${i}`" class="bg-white dark:bg-[#1b2e4b] rounded-lg border border-slate-200/60 dark:border-gray-700 p-1 shadow-sm">
            <!-- Skeleton en-tête zone -->
            <div class="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-200 dark:border-gray-700">
              <div class="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
              <div class="flex-1 text-center">
                <div class="h-3 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mx-auto"></div>
              </div>
            </div>

            <!-- Skeleton métriques -->
            <div class="flex flex-col gap-0.5">
              <!-- Équipes et JOB -->
              <div class="flex gap-1">
                <div class="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                  <div class="flex items-center justify-center gap-1">
                    <div class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div class="h-2 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div class="h-3 w-8 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                </div>
                <div class="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                  <div class="flex items-center justify-center gap-1">
                    <div class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div class="h-2 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div class="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              <!-- 1er comptage -->
              <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                <div class="h-2 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mx-auto mb-0.5"></div>
                <div class="flex gap-0.5">
                  <div v-for="j in 3" :key="`count1-${j}`" class="flex-1 bg-white dark:bg-[#1b2e4b] rounded p-0.5 shadow-sm">
                    <div class="flex items-center justify-center gap-1">
                      <div class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      <div class="h-2 w-10 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      <div class="h-3 w-6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div class="h-2 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2ème comptage -->
              <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                <div class="h-2 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mx-auto mb-0.5"></div>
                <div class="flex gap-0.5">
                  <div v-for="j in 3" :key="`count2-${j}`" class="flex-1 bg-white dark:bg-[#1b2e4b] rounded p-0.5 shadow-sm">
                    <div class="flex items-center justify-center gap-1">
                      <div class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      <div class="h-2 w-10 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      <div class="h-3 w-6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div class="h-2 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3ème comptage -->
              <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                <div class="h-2 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mx-auto mb-0.5"></div>
                <div class="flex items-center justify-center gap-1 bg-white dark:bg-[#1b2e4b] rounded p-0.5 shadow-sm">
                  <div class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  <div class="h-2 w-10 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  <div class="h-3 w-12 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard de monitoring compact -->
    <div v-else-if="monitoringData" class="monitoring-container bg-slate-500 dark:bg-slate-800 p-1">
            <div class="flex flex-col gap-1">
        <!-- Métriques globales compactes -->
        <div class="grid grid-cols-5 gap-1">
                    <div
                        class="bg-white dark:bg-[#1b2e4b] rounded-lg p-1 shadow-sm hover:shadow-md transition-all duration-300">
                        <div class="flex items-center justify-center gap-1">
                            <IconUsers class="w-4 h-4 text-slate-500 dark:text-gray-400" />
                            <span class="text-xs text-slate-500 dark:text-gray-400">Total Équipe</span>
                            <span class="text-xl font-bold text-slate-900 dark:text-white-light">{{
                                formatNombre(monitoringData.total.nombreEquipes) }}</span>
                        </div>
                    </div>
                    <div
                        class="bg-white dark:bg-[#1b2e4b] rounded-lg p-1 shadow-sm hover:shadow-md transition-all duration-300">
                        <div class="flex items-center justify-center gap-1">
                            <IconBox class="w-4 h-4 text-slate-500 dark:text-gray-400" />
                            <span class="text-xs text-slate-500 dark:text-gray-400">Total JOB</span>
                            <span class="text-xl font-bold text-slate-900 dark:text-white-light">{{
                                formatNombre(monitoringData.total.totalJobs) }}</span>
                        </div>
                    </div>
                    <div
                        class="bg-white dark:bg-[#1b2e4b] rounded-lg p-1 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm hover:shadow-md transition-all duration-300">
                        <div class="flex items-center justify-center gap-1">
                            <IconCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span class="text-xs text-slate-500 dark:text-gray-400">1er Clôturé</span>
                            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{
                                formatNombre(monitoringData.total.premierComptage.cloture) }}</span>
                            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">({{
                                formatPourcentage(monitoringData.total.premierComptage.cloturePourcentage) }})</span>
                        </div>
          </div>
                    <div
                        class="bg-white dark:bg-[#1b2e4b] rounded-lg p-1 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm hover:shadow-md transition-all duration-300">
                        <div class="flex items-center justify-center gap-1">
                            <IconCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span class="text-xs text-slate-500 dark:text-gray-400">2ème Clôturé</span>
                            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{
                                formatNombre(monitoringData.total.deuxiemeComptage.cloture) }}</span>
                            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">({{
                                formatPourcentage(monitoringData.total.deuxiemeComptage.cloturePourcentage) }})</span>
          </div>
          </div>
                    <div
                        class="bg-white dark:bg-[#1b2e4b] rounded-lg p-1 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm hover:shadow-md transition-all duration-300">
                        <div class="flex items-center justify-center gap-1">
                            <IconCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span class="text-xs text-slate-500 dark:text-gray-400">3ème Terminé</span>
                            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{
                                formatNombre(monitoringData.total.troisiemeComptage.termine) }}</span>
                            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">({{
                                formatPourcentage(monitoringData.total.troisiemeComptage.terminePourcentage) }})</span>
          </div>
          </div>
        </div>

        <!-- Zones en grille compacte -->
                <div class="grid grid-cols-3 grid-rows-3 gap-1">
                    <div v-for="zone in monitoringData.zones" :key="zone.zoneId"
                        class="bg-white dark:bg-[#1b2e4b] rounded-lg border border-slate-200/60 dark:border-gray-700 p-1 hover:shadow-lg transition-all duration-300 shadow-sm">
                        <!-- En-tête zone horizontale -->
                        <div class="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-200 dark:border-gray-700">
              <span :class="getLedClass(zone.statusLed)" class="animate-pulse"></span>
                            <div class="flex-1 text-center">
                                <div class="text-xs font-semibold text-slate-900 dark:text-white-light">{{ zone.zoneDescription }}</div>
              </div>
            </div>

                        <!-- Métriques horizontales -->
                        <div class="flex flex-col gap-0.5">
                            <!-- Équipes et JOB - horizontale -->
                            <div class="flex gap-1">
                                <div class="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                    <div class="flex items-center justify-center gap-1">
                                        <IconUsers class="w-3 h-3 text-slate-500 dark:text-gray-400" />
                                        <span class="text-[10px] text-slate-500 dark:text-gray-400">Équipes</span>
                                        <span class="text-sm font-bold text-slate-900 dark:text-white-light">
                                            {{ formatNombre(zone.nombreEquipes) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                    <div class="flex items-center justify-center gap-1">
                                        <IconBox class="w-3 h-3 text-slate-500 dark:text-gray-400" />
                                        <span class="text-[10px] text-slate-500 dark:text-gray-400">JOB</span>
                                        <span class="text-sm font-bold text-slate-900 dark:text-white-light">
                                            {{ formatNombre(zone.totalJobs) }} ({{ formatNombre(zone.totalEmplacements) }})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- 1er comptage - horizontale -->
                            <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                <div class="text-[10px] text-slate-600 dark:text-gray-300 mb-0.5 text-center font-semibold">1er Comptage
                                </div>
                                <div class="flex gap-0.5">
                                    <div class="flex-1 bg-white dark:bg-[#0e1726] rounded p-0.5 shadow-sm">
                                        <div class="flex items-center justify-center gap-1">
                                            <IconCheck class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Terminé</span>
                                            <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{
                                                formatNombre(zone.premierComptage.cloture) }}</span>
                                            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{{
                                                formatPourcentage(zone.premierComptage.cloturePourcentage) }}</span>
                                        </div>
                                    </div>
                                    <div class="flex-1 bg-white dark:bg-[#0e1726] rounded p-0.5 shadow-sm">
                                        <div class="flex items-center justify-center gap-1">
                                            <IconPlay class="w-3 h-3 text-[#FECD1C]" />
                                            <span class="text-[10px] text-[#FECD1C] font-medium">Entamé</span>
                                            <span class="text-sm font-bold text-[#FECD1C]">{{
                                                formatNombre(zone.premierComptage.enCours) }}</span>
                                            <span class="text-[10px] text-[#FECD1C] font-medium">{{
                                                formatPourcentage(zone.premierComptage.enCoursPourcentage) }}</span>
                                        </div>
                  </div>
                                    <div class="flex-1 bg-white dark:bg-[#0e1726] rounded p-0.5 shadow-sm">
                                        <div class="flex items-center justify-center gap-1">
                                            <IconClock class="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                            <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Attente</span>
                                            <span class="text-sm font-bold text-amber-600 dark:text-amber-400">{{
                                                formatNombre(zone.premierComptage.nonEntame) }}</span>
                                            <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{{
                                                formatPourcentage(zone.premierComptage.nonEntamePourcentage) }}</span>
                  </div>
                  </div>
                </div>
              </div>

                            <!-- 2e comptage - horizontale -->
                            <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                <div class="text-[10px] text-slate-600 dark:text-gray-300 mb-0.5 text-center font-semibold">2ème Comptage
                                </div>
                                <div class="flex gap-0.5">
                                    <div class="flex-1 bg-white dark:bg-[#0e1726] rounded p-0.5 shadow-sm">
                                        <div class="flex items-center justify-center gap-1">
                                            <IconCheck class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Terminé</span>
                                            <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{
                                                formatNombre(zone.deuxiemeComptage.cloture) }}</span>
                                            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{{
                                                formatPourcentage(zone.deuxiemeComptage.cloturePourcentage) }}</span>
                                        </div>
                                    </div>
                                    <div class="flex-1 bg-white dark:bg-[#0e1726] rounded p-0.5 shadow-sm">
                                        <div class="flex items-center justify-center gap-1">
                                            <IconPlay class="w-3 h-3 text-[#FECD1C]" />
                                            <span class="text-[10px] text-[#FECD1C] font-medium">Entamé</span>
                                            <span class="text-sm font-bold text-[#FECD1C]">{{
                                                formatNombre(zone.deuxiemeComptage.enCours) }}</span>
                                            <span class="text-[10px] text-[#FECD1C] font-medium">{{
                                                formatPourcentage(zone.deuxiemeComptage.enCoursPourcentage) }}</span>
                                        </div>
                  </div>
                                    <div class="flex-1 bg-white dark:bg-[#0e1726] rounded p-0.5 shadow-sm">
                                        <div class="flex items-center justify-center gap-1">
                                            <IconClock class="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                            <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Attente</span>
                                            <span class="text-sm font-bold text-amber-600 dark:text-amber-400">{{
                                                formatNombre(zone.deuxiemeComptage.nonEntame) }}</span>
                                            <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{{
                                                formatPourcentage(zone.deuxiemeComptage.nonEntamePourcentage) }}</span>
                  </div>
                  </div>
                </div>
              </div>

                            <!-- 3e comptage - horizontale -->
                            <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                <div class="text-[10px] text-slate-600 dark:text-gray-300 mb-0.5 text-center font-semibold">
                                    3ème Comptage
                                </div>
                                <div class="flex items-center justify-center gap-1 bg-white dark:bg-[#0e1726] rounded p-0.5 shadow-sm">
                                    <IconBox class="w-3 h-3 text-slate-500 dark:text-gray-400" />
                                    <span class="text-[10px] text-slate-500 dark:text-gray-400">Total</span>
                                    <span class="text-sm font-bold text-slate-900 dark:text-white-light">
                                        {{ formatNombre(zone.troisiemeComptage.jobs) }} ({{ formatNombre(zone.totalEmplacements) }})
                                    </span>
                                </div>
                            </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
        <div v-else class="flex items-center justify-center bg-white dark:bg-[#1b2e4b] py-8">
      <div class="text-center">
                <button @click="chargerDonnees"
                    class="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-all rounded hover:bg-slate-100 dark:hover:bg-gray-700">
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

/* Animation shimmer pour le skeleton loading */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Amélioration du skeleton avec animation shimmer */
.monitoring-container .bg-slate-200,
.monitoring-container .bg-slate-300 {
  background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.dark .monitoring-container .bg-slate-200,
.dark .monitoring-container .bg-slate-300 {
  background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
  background-size: 200% 100%;
}

/* Variables CSS pour adaptation responsive - Base (mobile/tablette) */
.monitoring-container {
    --monitoring-padding: 0.25rem;
    --monitoring-gap: 0.25rem;
    --monitoring-text-xs: 0.75rem;
    --monitoring-text-sm: 0.875rem;
    --monitoring-text-xl: 1.25rem;
    --monitoring-text-10: 0.625rem;
    --monitoring-icon-sm: 0.75rem;
    --monitoring-icon-md: 1rem;
    --monitoring-icon-led: 0.5rem;
}

/* Laptop (1366px - 1919px) */
@media screen and (min-width: 1366px) and (max-width: 1919px) {
    .monitoring-container {
        --monitoring-padding: 0.5rem;
        --monitoring-gap: 0.5rem;
        --monitoring-text-xs: 0.875rem;
        --monitoring-text-sm: 1rem;
        --monitoring-text-xl: 1.5rem;
        --monitoring-text-10: 0.75rem;
        --monitoring-icon-sm: 1rem;
        --monitoring-icon-md: 1.25rem;
        --monitoring-icon-led: 0.625rem;
    }
}

/* Desktop (1920px - 2559px) */
@media screen and (min-width: 1920px) and (max-width: 2559px) {
    .monitoring-container {
        --monitoring-padding: 0.75rem;
        --monitoring-gap: 0.75rem;
        --monitoring-text-xs: 1rem;
        --monitoring-text-sm: 1.125rem;
        --monitoring-text-xl: 1.75rem;
        --monitoring-text-10: 0.875rem;
        --monitoring-icon-sm: 1.25rem;
        --monitoring-icon-md: 1.5rem;
        --monitoring-icon-led: 0.75rem;
    }
}

/* Tableau interactif / 4K (2560px - 3839px) */
@media screen and (min-width: 2560px) and (max-width: 3839px) {
    .monitoring-container {
        --monitoring-padding: 1rem;
        --monitoring-gap: 1rem;
        --monitoring-text-xs: 1.125rem;
        --monitoring-text-sm: 1.25rem;
        --monitoring-text-xl: 2rem;
        --monitoring-text-10: 1rem;
        --monitoring-icon-sm: 1.5rem;
        --monitoring-icon-md: 2rem;
        --monitoring-icon-led: 1rem;
    }
}

/* Optimisation spécifique pour 4K (3840x2160) */
@media screen and (min-width: 3840px) {
    .monitoring-container {
        --monitoring-padding: 1.5rem;
        --monitoring-gap: 1.5rem;
        --monitoring-text-xs: 1.25rem;
        --monitoring-text-sm: 1.5rem;
        --monitoring-text-xl: 2.5rem;
        --monitoring-text-10: 1.125rem;
        --monitoring-icon-sm: 2rem;
        --monitoring-icon-md: 2.5rem;
        --monitoring-icon-led: 1.25rem;
        max-width: 3840px;
        margin: 0 auto;
    }
}

/* Classes utilitaires pour utiliser les variables */
.monitoring-text-xs {
    font-size: var(--monitoring-text-xs);
}

.monitoring-text-sm {
    font-size: var(--monitoring-text-sm);
}

.monitoring-text-xl {
    font-size: var(--monitoring-text-xl);
}

.monitoring-text-10 {
    font-size: var(--monitoring-text-10);
}

.monitoring-icon-sm {
    width: var(--monitoring-icon-sm);
    height: var(--monitoring-icon-sm);
}

.monitoring-icon-md {
    width: var(--monitoring-icon-md);
    height: var(--monitoring-icon-md);
}

.monitoring-icon-led {
    width: var(--monitoring-icon-led);
    height: var(--monitoring-icon-led);
}

.monitoring-padding {
    padding: var(--monitoring-padding);
}

.monitoring-gap {
    gap: var(--monitoring-gap);
}
</style>
