<template>
  <div class="panel py-7 datatable">
    <DataTable
      :columns="columns"
      :rowDataProp="jobs"
      :actions="actions"
      :pagination="true"
      :enableFiltering="true"
      :rowSelection="rowSelection"
      @selection-changed="onSelectionChanged"
      storageKey="jobs_management_table"
    >
      <template #table-actions>
        <button
          class="text-white btn btn-primary mb-4"
          @click="launchSelected"
          :disabled="!selectedJobs.length"
        >
          Lancer sélection
        </button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable/DataTable.vue'
import { planningManagementService } from '@/services/planningManagementService'

import IconReassign from '@/components/icon/icon-refresh.vue'
import type { ActionConfig } from '@/interfaces/dataTable'

type Job = { id: number; name: string; status: string }

const route = useRoute()
const storeId = Number(route.query.storeId || route.params.storeId)

const jobs = ref<Job[]>([])
const selectedJobs = ref<Job[]>([])

const rowSelection = { mode: 'multiple' }

async function fetchJobs() {
  if (!storeId) return
  // utilise la méthode existante pour récupérer les jobs d’un magasin
  jobs.value = await planningManagementService.getJobsByStore(storeId)
}

onMounted(fetchJobs)

const columns = [
  { headerName: 'Nom', field: 'name', sortable: true, filter: 'agTextColumnFilter' },
  { headerName: 'Statut', field: 'status', sortable: true, filter: 'agTextColumnFilter' }
]

const actions: ActionConfig[] = [
 
]

let gridApi: any = null

function onGridReady(params: any) {
  gridApi = params.api
}

function onSelectionChanged(rows: Job[]) {
  selectedJobs.value = rows
}

async function launchSelected() {
  const ids = selectedJobs.value.map(j => j.id)
  if (!storeId || !ids.length) return
  await planningManagementService.launchJobsForStore(storeId, ids)
  await fetchJobs()
}
</script>
