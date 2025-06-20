<template>
  <div>
    <div>
      <!-- Section Jobs -->
      <section>
       
         <!-- Table 2: Jobs créés -->
        <div class="panel">
          <h3 class="text-lg font-semibold mb-2">Jobs créés</h3>
          <DataTable
            v-if="jobs.length"
            :key="jobsKey"
            :columns="jobColumns"
            :rowDataProp="displayJobsData"
            :rowSelection="true"
            @selection-changed="onJobSelectionChanged"
            :showColumnSelector="false"
            storageKey="planning_jobs"
          >
            <template #table-actions>
              <div class="flex items-center justify-between gap-4 mb-4">
                <button
                  @click="onReturnSelectedJobs"
                  class="btn btn-primary"
                >
                  ↩ Retourner ({{ selectedJobs.length }})
                </button>

                <button
                  @click="onBulkValidate"
                  class="btn btn-primary flex items-center"
                >
                  <span v-if="!isSubmitting">
                    ✓ Valider ({{ selectedJobs.length }})
                  </span>
                  <span v-else class="flex items-center">
                    <svg
                      class="animate-spin w-4 h-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none" viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Valider...
                  </span>
                </button>
              </div>
            </template>
          </DataTable>
          
          <div v-else class="text-center py-12 border-dashed border-2 rounded-lg">
            <p class="text-gray-500">Aucun job créé</p>
            <p class="text-sm text-gray-400 mt-2">Sélectionnez des emplacements dans la table ci-dessus pour créer un job</p>
          </div>
        </div>
        <!-- Table 2: Emplacements disponibles -->
        <div class="mt-6 panel">
           <h3 class="text-lg font-semibold mb-2">Emplacements disponibles</h3>
          <DataTable
            :key="availableLocationsKey"
            :columns="availableLocationColumns"
            :rowDataProp="availableLocationData"
            :pagination="true"
            :rowSelection="true"
            @selection-changed="onAvailableSelectionChanged"
            storageKey="available_locations"
            :showColumnSelector="false"
          >
            <template #table-actions>
              <div class="flex items-center gap-4 mb-4">
                <div class="flex gap-2 items-center">
                  <button
                    @click="createSingleJob"
                    class="btn btn-primary"
                  >
                    Créer Job ({{ selectedAvailable.length }})
                  </button>

                  <!-- Dropdown pour ajouter à un job existant -->
                  <div class="relative" v-if="availableJobsForLocation.length > 0">
                    <button
                      @click="showJobDropdown = !showJobDropdown"
                      class="btn btn-primary"
                    >
                      Ajouter à Job ({{ selectedAvailable.length }})
                      <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    
                    <!-- Dropdown menu -->
                    <div v-if="showJobDropdown" class="absolute z-50 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div class="py-1 max-h-60 overflow-y-auto">
                        <button
                          v-for="job in availableJobsForLocation"
                          :key="job.id"
                          @click="onSelectJobForLocation(job.id)"
                          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                        >
                          <span>{{ job.reference }}</span>
                          <span class="text-xs text-gray-500">({{ job.locations.length }} emp.)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #contenu>
              <div class="max-w-md">
                <input
                  v-model="locationSearchQuery"
                  type="search"
                  placeholder="Rechercher un emplacement..."
                  class="w-60 md:w-70 max-w-xl px-2 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10"
                />
              </div>
            </template>
          </DataTable>
        </div>

       
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePlanning } from '@/composables/usePlanning';
import { alertService } from '@/services/alertService';
import DataTable from '@/components/DataTable/DataTable.vue';

import type { ColDef, CellClassParams, ValueFormatterParams } from 'ag-grid-community';
import type { TableRow } from '@/interfaces/dataTable';

const {
  jobs,
  availableLocations,
  availableJobsForLocation,
  locationSearchQuery,
  selectedAvailable,
  selectedJobs,
  showJobDropdown,
  isSubmitting,
  createJob,
  addLocationToJob,
  returnSelectedJobs,
  validateJob
} = usePlanning();

// Keys pour forcer le re-render des tables
const availableLocationsKey = ref(0);
const jobsKey = ref(0);

// Watcher pour mettre à jour les keys quand les données changent
watch(() => availableLocations.value.length, () => {
  availableLocationsKey.value++;
}, { immediate: true });

watch(() => jobs.value.length, () => {
  jobsKey.value++;
}, { immediate: true });

// État pour gérer l'expansion des jobs
const expandedJobIds = ref<Set<string>>(new Set());

// Fermer le dropdown quand on clique ailleurs
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showJobDropdown.value = false;
  }
}
document.addEventListener('click', handleClickOutside);

// Colonnes pour la table des emplacements disponibles
const availableLocationColumns: ColDef[] = [
  { headerName: 'Emplacement', field: 'emplacement', flex: 2, sortable: true, filter: 'agTextColumnFilter' },
  { headerName: 'Zone',        field: 'zone',        width: 150, sortable: true, filter: 'agTextColumnFilter' },
  { headerName: 'Sous-zone',   field: 'sousZone',    flex: 1, sortable: true, filter: 'agTextColumnFilter' }
];

// Colonnes pour la table des jobs (sans "Actions")
const jobColumns: ColDef[] = [
  { 
    headerName: 'Job', 
    field: 'reference',
    flex: 2,
    sortable: true,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { paddingLeft: '35px', fontStyle: 'italic' };
      }
      return undefined;
    },
    cellRenderer: (params) => {
      if (!params.data) return '';
      if (!params.data.isChild) {
        const jobId = params.data.jobId;
        const isExpanded = expandedJobIds.value.has(jobId);
        const arrow = isExpanded 
          ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`
          : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`;
        return `<div style="display: flex; align-items: center; width: 100%;">
                  <span style="cursor: pointer; display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" data-expand-toggle="${jobId}">${arrow}</span>
                  <span>${params.value ?? ''}</span>
                </div>`;
      }
      return `${params.value ?? ''}`;
    },
    onCellClicked: (params) => {
      const target = params.event?.target as HTMLElement;
      const expandToggle = target.closest('[data-expand-toggle]');
      if (expandToggle && !params.data?.isChild) {
        const jobId = expandToggle.getAttribute('data-expand-toggle')!;
        if (expandedJobIds.value.has(jobId)) expandedJobIds.value.delete(jobId);
        else expandedJobIds.value.add(jobId);
      }
    }
  },
  { 
    headerName: 'Statut', 
    field: 'status',
    width: 120,
    sortable: true,
    cellRenderer: (params) => {
      if (!params.data || params.data.isChild) return '';
      return params.data.isValidated
        ? '<span style="padding:2px 8px;background-color:#10b981;color:white;font-size:11px;border-radius:12px;font-weight:500;">✓ VALIDÉ</span>'
        : '<span style="padding:2px 8px;background-color:#f59e0b;color:white;font-size:11px;border-radius:12px;font-weight:500;">EN ATTENTE</span>';
    }
  },
  { 
    headerName: 'Zone', 
    field: 'zone',
    width: 120,
    sortable: true,
    filter: 'agTextColumnFilter',
    valueFormatter: (params: ValueFormatterParams) => params.data?.isChild ? (params.value as string) : ''
  },
  { 
    headerName: 'Sous-zone', 
    field: 'sousZone',
    width: 150,
    sortable: true,
    filter: 'agSelectColumnFilter',
    valueFormatter: (params: ValueFormatterParams) => params.data?.isChild ? (params.value as string) : ''
  }
];

// Données formatées pour les tables
const availableLocationData = computed(() =>
  availableLocations.value.map(location => {
    const [emplacement, zone, sousZone] = location.split(' | ');
    return { id: location, emplacement, zone, sousZone };
  })
);

const displayJobsData = computed(() => {
  const rows: any[] = [];
  jobs.value.forEach((job, idx) => {
    rows.push({
      id: job.id,
      jobId: job.id,
      reference: job.reference,
      isChild: false,
      isValidated: job.isValidated,
      status: job.isValidated ? 'VALIDÉ' : 'EN ATTENTE'
    });
    if (expandedJobIds.value.has(job.id)) {
      job.locations.forEach((loc, i) => {
        const [emp, z, sz] = loc.split(' | ');
        rows.push({ id: `${job.id}-${i}`, jobId: job.id, reference: emp, zone: z, sousZone: sz, isChild: true });
      });
    }
  });
  return rows;
});

// Sélections
function onAvailableSelectionChanged(rows: TableRow[]) {
  selectedAvailable.value = rows.map(r => String(r.id));
}
function onJobSelectionChanged(rows: TableRow[]) {
  selectedJobs.value = rows.filter(r => !r.isChild).map(r => String(r.id));
}

// Création / ajout
async function createSingleJob() {
  if (!selectedAvailable.value.length) {
    return alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
  }
  const ok = await createJob(selectedAvailable.value);
  if (ok) { availableLocationsKey.value++; jobsKey.value++; }
}

// Fonction avec confirmation pour retourner les jobs sélectionnés
async function onReturnSelectedJobs() {
  if (!selectedJobs.value.length) {
    return alertService.error({ text: 'Veuillez sélectionner au moins un job.' });
  }
  
  const result = await alertService.confirm({ 
    text: `Êtes-vous sûr de vouloir retourner ${selectedJobs.value.length} job(s) ? Cette action ne peut pas être annulée.` 
  });
  
  if (!result.isConfirmed) {
    return alertService.info({ text: 'Retour annulé.' });
  }
  
  try {
    await returnSelectedJobs();
    availableLocationsKey.value++;
    jobsKey.value++;
  } catch (error) {
    console.error('Erreur lors du retour des jobs:', error);
    await alertService.error({ text: 'Erreur lors du retour des jobs.' });
  }
}

// Fonction avec confirmation pour ajouter à un job existant
async function onSelectJobForLocation(jobId: string) {
  if (!selectedAvailable.value.length) {
    await alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
    showJobDropdown.value = false;
    return;
  }
  
  // Trouver le job sélectionné pour afficher sa référence
  const selectedJob = availableJobsForLocation.value.find(job => job.id === jobId);
  const jobReference = selectedJob ? selectedJob.reference : 'ce job';
  
  const result = await alertService.confirm({ 
    text: `Ajouter ${selectedAvailable.value.length} emplacement(s) au job "${jobReference}" ?` 
  });
  
  if (!result.isConfirmed) {
    showJobDropdown.value = false;
    return alertService.info({ text: 'Ajout annulé.' });
  }
  
  try {
    await addLocationToJob(jobId, selectedAvailable.value);
    availableLocationsKey.value++;
    jobsKey.value++;
  } catch (error) {
    console.error('Erreur lors de l\'ajout au job:', error);
    await alertService.error({ text: 'Erreur lors de l\'ajout au job.' });
  } finally {
    showJobDropdown.value = false;
  }
}

// Fonction de validation en masse (déjà avec confirmation)
async function onBulkValidate() {
  if (!selectedJobs.value.length) {
    return alertService.error({ text: 'Veuillez sélectionner au moins un job.' });
  }
  
  const result = await alertService.confirm({ text: `Valider ${selectedJobs.value.length} job(s) ?` });
  if (!result.isConfirmed) {
    return alertService.info({ text: 'Validation annulée.' });
  }
  
  isSubmitting.value = true;
  try {
    selectedJobs.value.forEach(id => {
      const j = jobs.value.find(x => x.id === id);
      if (j && !j.isValidated) {
        j.isValidated = true;
        j.validatedAt = new Date().toISOString();
      }
    });
    await alertService.success({ text: `${selectedJobs.value.length} job(s) validé(s).` });
    selectedJobs.value = [];
  } catch {
    await alertService.error({ text: 'Erreur durant la validation en masse.' });
  } finally {
    isSubmitting.value = false;
    jobsKey.value++;
  }
}
</script>

<style scoped>

</style>