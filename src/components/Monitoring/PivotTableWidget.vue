<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ZoneMonitoringData, MonitoringStats } from '@/composables/useMonitoring'

// Type pour accepter readonly ou mutable (deep readonly)
type MonitoringStatsInput = MonitoringStats | {
  readonly zones: readonly ZoneMonitoringData[]
  readonly total: MonitoringStats['total']
} | null
import IconCheck from '@/components/icon/icon-check.vue'
import IconPlay from '@/components/icon/icon-play.vue'
import IconClock from '@/components/icon/icon-clock.vue'

interface Props {
  data: MonitoringStatsInput
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Configuration du pivot
const pivotConfig = ref({
  rows: ['zone'] as string[],
  columns: ['comptage'] as string[],
  values: ['termine', 'enCours', 'attente'] as string[]
})

// Options de pivot disponibles
const availableRows = ['zone', 'comptage']
const availableColumns = ['comptage', 'zone']
const availableValues = [
  { key: 'termine', label: 'Terminé' },
  { key: 'enCours', label: 'En Cours' },
  { key: 'attente', label: 'Attente' },
  { key: 'equipes', label: 'Équipes' },
  { key: 'jobs', label: 'JOB' },
  { key: 'emplacements', label: 'Emplacements' }
]

// Transformation des données en format pivot
const pivotData = computed(() => {
  if (!props.data || !props.data.zones.length) return []

  const result: any[] = []

  props.data.zones.forEach(zone => {
    // 1er Comptage
    result.push({
      zone: zone.zoneDescription,
      zoneId: zone.zoneId,
      comptage: '1er Comptage',
      equipes: zone.nombreEquipes,
      jobs: zone.totalJobs,
      emplacements: zone.totalEmplacements,
      termine: zone.premierComptage.cloture,
      terminePourcentage: zone.premierComptage.cloturePourcentage,
      enCours: zone.premierComptage.enCours,
      enCoursPourcentage: zone.premierComptage.enCoursPourcentage,
      attente: zone.premierComptage.nonEntame,
      attentePourcentage: zone.premierComptage.nonEntamePourcentage,
      statusLed: zone.statusLed
    })

    // 2ème Comptage
    result.push({
      zone: zone.zoneDescription,
      zoneId: zone.zoneId,
      comptage: '2ème Comptage',
      equipes: zone.nombreEquipes,
      jobs: zone.totalJobs,
      emplacements: zone.totalEmplacements,
      termine: zone.deuxiemeComptage.cloture,
      terminePourcentage: zone.deuxiemeComptage.cloturePourcentage,
      enCours: zone.deuxiemeComptage.enCours,
      enCoursPourcentage: zone.deuxiemeComptage.enCoursPourcentage,
      attente: zone.deuxiemeComptage.nonEntame,
      attentePourcentage: zone.deuxiemeComptage.nonEntamePourcentage,
      statusLed: zone.statusLed
    })

    // 3ème Comptage
    result.push({
      zone: zone.zoneDescription,
      zoneId: zone.zoneId,
      comptage: '3ème Comptage',
      equipes: zone.nombreEquipes,
      jobs: zone.troisiemeComptage.jobs,
      emplacements: zone.totalEmplacements,
      termine: zone.troisiemeComptage.termine,
      terminePourcentage: zone.troisiemeComptage.terminePourcentage,
      enCours: zone.troisiemeComptage.enCours,
      enCoursPourcentage: zone.troisiemeComptage.enCoursPourcentage,
      attente: zone.troisiemeComptage.nonEntame,
      attentePourcentage: zone.troisiemeComptage.nonEntamePourcentage,
      statusLed: zone.statusLed
    })
  })

  return result
})

// Construction du tableau croisé
const pivotTable = computed(() => {
  if (!pivotData.value.length) return { headers: [], rows: [] }

  const { rows: rowFields, columns: colFields, values: valueFields } = pivotConfig.value

  // Extraire les valeurs uniques pour les lignes
  const uniqueRows = new Map<string, any>()
  pivotData.value.forEach(item => {
    const rowKey = rowFields.map(field => item[field]).join('|')
    if (!uniqueRows.has(rowKey)) {
      uniqueRows.set(rowKey, rowFields.reduce((acc, field) => {
        acc[field] = item[field]
        return acc
      }, {} as any))
    }
  })

  // Extraire les valeurs uniques pour les colonnes
  const uniqueCols = new Map<string, any>()
  pivotData.value.forEach(item => {
    const colKey = colFields.map(field => item[field]).join('|')
    if (!uniqueCols.has(colKey)) {
      uniqueCols.set(colKey, colFields.reduce((acc, field) => {
        acc[field] = item[field]
        return acc
      }, {} as any))
    }
  })

  // Créer les en-têtes de colonnes
  const headers: any[] = [
    ...rowFields.map(field => ({ type: 'row', field, label: getFieldLabel(field) }))
  ]

  uniqueCols.forEach((colData, colKey) => {
    valueFields.forEach(valueField => {
      const colLabel = colFields.map(f => colData[f]).join(' - ')
      headers.push({
        type: 'value',
        field: valueField,
        colKey,
        label: `${colLabel} - ${getValueLabel(valueField)}`,
        colData
      })
    })
  })

  // Créer les lignes de données
  const tableRows: any[] = []
  uniqueRows.forEach((rowData, rowKey) => {
    const row: any = {
      ...rowData,
      cells: new Map()
    }

    // Pour chaque combinaison colonne/valeur, calculer la valeur
    uniqueCols.forEach((colData, colKey) => {
      valueFields.forEach(valueField => {
        // Trouver la valeur correspondante dans pivotData
        const matchingItem = pivotData.value.find(item => {
          const itemRowKey = rowFields.map(f => item[f]).join('|')
          const itemColKey = colFields.map(f => item[f]).join('|')
          return itemRowKey === rowKey && itemColKey === colKey
        })

        const cellKey = `${colKey}|${valueField}`
        if (matchingItem) {
          row.cells.set(cellKey, {
            value: matchingItem[valueField],
            percentage: matchingItem[`${valueField}Pourcentage`] || null,
            rawData: matchingItem
          })
        } else {
          row.cells.set(cellKey, { value: 0, percentage: null, rawData: null })
        }
      })
    })

    tableRows.push(row)
  })

  return { headers, rows: tableRows, uniqueCols: Array.from(uniqueCols.values()) }
})

// Computed pour accéder aux champs de colonnes dans le template
const colFields = computed(() => pivotConfig.value.columns)

// Fonction helper pour générer la clé de cellule
const getCellKey = (colData: any, value: string): string => {
  const colKey = colFields.value.map(f => colData[f]).join('|')
  return `${colKey}|${value}`
}

// Fonction helper pour obtenir le label de colonne
const getColLabel = (colData: any): string => {
  return colFields.value.map(f => colData[f]).join(' - ')
}

// Fonctions utilitaires
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    zone: 'Zone',
    comptage: 'Comptage'
  }
  return labels[field] || field
}

const getValueLabel = (value: string): string => {
  const item = availableValues.find(v => v.key === value)
  return item?.label || value
}

const formatValue = (value: number, percentage: number | null): string => {
  if (percentage !== null) {
    return `${value} (${percentage.toFixed(1)}%)`
  }
  return value.toString()
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-[#FECD1C]',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
  return colors[status] || colors.info
}

const getStatusBgColor = (status: string): string => {
  const colors: Record<string, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20'
  }
  return colors[status] || colors.info
}

// Fonctions pour changer la configuration du pivot
const setRowField = (field: string) => {
  pivotConfig.value.rows = [field]
}

const setColumnField = (field: string) => {
  pivotConfig.value.columns = [field]
}

const toggleValue = (value: string) => {
  const index = pivotConfig.value.values.indexOf(value)
  if (index > -1) {
    pivotConfig.value.values.splice(index, 1)
  } else {
    pivotConfig.value.values.push(value)
  }
}
</script>

<template>
  <div class="pivot-table-widget bg-white dark:bg-[#1b2e4b] h-full w-full flex flex-col overflow-hidden m-0 p-0">
    <!-- En-tête avec configuration -->
    <div class="flex-shrink-0 mb-1 px-2 py-1 flex items-center justify-between border-b border-slate-200 dark:border-gray-700">
      <h2 class="text-sm font-bold text-slate-900 dark:text-white">
        Tableau Croisé Dynamique
      </h2>
      
      <!-- Configuration du pivot -->
      <div class="flex gap-2 items-center flex-wrap">
        <!-- Lignes -->
        <div class="flex items-center gap-1">
          <span class="text-xs text-slate-600 dark:text-gray-400">Lignes:</span>
          <select
            v-model="pivotConfig.rows[0]"
            @change="setRowField(pivotConfig.rows[0])"
            class="px-2 py-0.5 text-xs border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
          >
            <option v-for="row in availableRows" :key="row" :value="row">
              {{ getFieldLabel(row) }}
            </option>
          </select>
        </div>

        <!-- Colonnes -->
        <div class="flex items-center gap-1">
          <span class="text-xs text-slate-600 dark:text-gray-400">Colonnes:</span>
          <select
            v-model="pivotConfig.columns[0]"
            @change="setColumnField(pivotConfig.columns[0])"
            class="px-2 py-0.5 text-xs border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
          >
            <option v-for="col in availableColumns" :key="col" :value="col">
              {{ getFieldLabel(col) }}
            </option>
          </select>
        </div>

        <!-- Valeurs -->
        <div class="flex items-center gap-1">
          <span class="text-xs text-slate-600 dark:text-gray-400">Valeurs:</span>
          <div class="flex gap-1">
            <button
              v-for="val in availableValues"
              :key="val.key"
              @click="toggleValue(val.key)"
              :class="[
                'px-1.5 py-0.5 text-xs rounded transition-all',
                pivotConfig.values.includes(val.key)
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
              ]"
            >
              {{ val.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau croisé -->
    <div v-if="!loading && pivotTable.headers.length > 0" class="flex-1 overflow-auto min-h-0">
      <table class="w-full border-collapse text-xs">
        <!-- En-têtes -->
        <thead class="sticky top-0 z-20 bg-white dark:bg-[#1b2e4b]">
          <tr>
            <!-- En-têtes de lignes -->
            <th
              v-for="(header, idx) in pivotTable.headers.filter(h => h.type === 'row')"
              :key="`row-${idx}`"
              class="sticky left-0 z-10 bg-white dark:bg-[#1b2e4b] border border-slate-300 dark:border-gray-600 px-1 py-1 text-left font-semibold text-slate-900 dark:text-white"
            >
              {{ header.label }}
            </th>
            
            <!-- En-têtes de valeurs (groupés par colonne) -->
            <template v-for="(colData, colIdx) in pivotTable.uniqueCols" :key="`col-${colIdx}`">
              <th
                v-for="value in pivotConfig.values"
                :key="`${colIdx}-${value}`"
                class="border border-slate-300 dark:border-gray-600 px-1 py-1 text-center font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-gray-800"
                :colspan="1"
              >
                <div class="flex flex-col">
                  <span class="text-[10px] text-slate-500 dark:text-gray-400">
                    {{ getColLabel(colData) }}
                  </span>
                  <span class="text-xs font-bold">
                    {{ getValueLabel(value) }}
                  </span>
                </div>
              </th>
            </template>
          </tr>
        </thead>

        <!-- Corps du tableau -->
        <tbody>
          <tr
            v-for="(row, rowIdx) in pivotTable.rows"
            :key="`row-${rowIdx}`"
            :class="[
              'hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors',
              rowIdx % 2 === 0 ? 'bg-white dark:bg-[#1b2e4b]' : 'bg-slate-50/50 dark:bg-gray-800/30'
            ]"
          >
            <!-- Cellules de lignes -->
            <td
              v-for="(header, idx) in pivotTable.headers.filter(h => h.type === 'row')"
              :key="`row-cell-${idx}`"
              class="sticky left-0 z-10 bg-white dark:bg-[#1b2e4b] border border-slate-300 dark:border-gray-600 px-1 py-1 font-medium text-slate-900 dark:text-white"
            >
              {{ row[header.field] }}
            </td>

            <!-- Cellules de valeurs -->
            <template v-for="(colData, colIdx) in pivotTable.uniqueCols" :key="`col-cell-${colIdx}`">
              <td
                v-for="value in pivotConfig.values"
                :key="`${colIdx}-${value}-cell`"
                class="border border-slate-300 dark:border-gray-600 px-1 py-1 text-center"
              >
                <template v-if="row.cells.get(getCellKey(colData, value))">
                  <div
                    v-if="value === 'termine'"
                    class="flex items-center justify-center gap-1"
                  >
                    <IconCheck class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {{ row.cells.get(getCellKey(colData, value))?.value }}
                    </span>
                    <span
                      v-if="row.cells.get(getCellKey(colData, value))?.percentage !== null && row.cells.get(getCellKey(colData, value))?.percentage !== undefined"
                      class="text-[10px] text-emerald-600 dark:text-emerald-400"
                    >
                      ({{ row.cells.get(getCellKey(colData, value))?.percentage?.toFixed(1) }}%)
                    </span>
                  </div>
                  <div
                    v-else-if="value === 'enCours'"
                    class="flex items-center justify-center gap-1"
                  >
                    <IconPlay class="w-3 h-3 text-[#FECD1C]" />
                    <span class="font-bold text-[#FECD1C] text-xs">
                      {{ row.cells.get(getCellKey(colData, value))?.value }}
                    </span>
                    <span
                      v-if="row.cells.get(getCellKey(colData, value))?.percentage !== null && row.cells.get(getCellKey(colData, value))?.percentage !== undefined"
                      class="text-[10px] text-[#FECD1C]"
                    >
                      ({{ row.cells.get(getCellKey(colData, value))?.percentage?.toFixed(1) }}%)
                    </span>
                  </div>
                  <div
                    v-else-if="value === 'attente'"
                    class="flex items-center justify-center gap-1"
                  >
                    <IconClock class="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span class="font-bold text-amber-600 dark:text-amber-400 text-xs">
                      {{ row.cells.get(getCellKey(colData, value))?.value }}
                    </span>
                    <span
                      v-if="row.cells.get(getCellKey(colData, value))?.percentage !== null && row.cells.get(getCellKey(colData, value))?.percentage !== undefined"
                      class="text-[10px] text-amber-600 dark:text-amber-400"
                    >
                      ({{ row.cells.get(getCellKey(colData, value))?.percentage?.toFixed(1) }}%)
                    </span>
                  </div>
                  <div v-else class="text-slate-900 dark:text-white font-medium text-xs">
                    {{ row.cells.get(getCellKey(colData, value))?.value }}
                  </div>
                </template>
                <div v-else class="text-slate-400 dark:text-gray-500">-</div>
              </td>
            </template>
          </tr>
        </tbody>

        <!-- Totaux -->
        <tfoot>
          <tr class="bg-slate-100 dark:bg-gray-800 font-bold">
            <td
              :colspan="pivotTable.headers.filter(h => h.type === 'row').length"
              class="border border-slate-300 dark:border-gray-600 px-1 py-1 text-left text-slate-900 dark:text-white"
            >
              Total
            </td>
            <template v-for="(colData, colIdx) in pivotTable.uniqueCols" :key="`total-col-${colIdx}`">
              <td
                v-for="value in pivotConfig.values"
                :key="`total-${colIdx}-${value}`"
                class="border border-slate-300 dark:border-gray-600 px-1 py-1 text-center text-slate-900 dark:text-white"
              >
                {{ pivotTable.rows.reduce((sum, row) => {
                  const cell = row.cells.get(getCellKey(colData, value))
                  return sum + (cell?.value || 0)
                }, 0) }}
              </td>
            </template>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- État de chargement -->
    <div v-else-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-pulse space-y-4 w-full">
        <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div class="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <p class="text-slate-500 dark:text-gray-400">Aucune donnée disponible</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pivot-table-widget {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  max-height: 100% !important;
}

table {
  min-width: 100%;
  font-size: 0.75rem;
}

thead.sticky {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: white;
}

.dark thead.sticky {
  background-color: #1b2e4b;
}

/* Assurer que le conteneur du tableau prend toute la hauteur disponible */
.pivot-table-widget > div:last-child {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  max-height: 100% !important;
  overflow: auto !important;
  height: 100% !important;
}

th.sticky,
td.sticky {
  position: sticky;
  left: 0;
  z-index: 10;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

.dark th.sticky,
.dark td.sticky {
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.3);
}

/* Optimisation des espacements */
th, td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

