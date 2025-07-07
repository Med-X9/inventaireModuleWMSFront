<template>
  <div>
    <div>
      <!-- Section Jobs -->
      <div class="mb-3">
        <PageNavigationLinks 
          :inventoryId="currentInventoryId" 
          :actions="['detail', 'affectation', 'edit']" 
        />
      </div>
      <section>
        <!-- Table 2: Jobs créés -->
        <div class="panel">
          <h3 class="text-lg font-semibold mb-2">Jobs créés</h3>
          <DataTable
            v-if="jobs.length"
            :key="jobsKey"
            :columns="jobColumns"
            :rowDataProp="jobs"
            :rowSelection="true"
            :showDetails="true"
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
                  :disabled="isSubmitting"
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
            <p class="text-sm text-gray-400 mt-2">Sélectionnez des emplacements dans la table ci-dessous pour créer un job</p>
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

                  <!-- SelectField pour ajouter à un job existant avec v-if et key pour forcer re-render -->
                  <div v-if="hasAvailableJobs" class="min-w-[250px]">
                    <SelectField
                      :key="`job-select-${selectFieldKey}`"
                      v-model="selectedJobId"
                      :options="jobSelectOptions"
                      :searchable="true"
                      :clearable="true"
                      :compact="true"
                      placeholder="Ajouter à un job existant..."
                      no-options-text="Aucun job trouvé"
                      @update:modelValue="onSelectJobForLocation"
                    />
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
                  class="w-60 md:w-70 max-w-xl px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 transition-all duration-200"
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
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { usePlanning } from '@/composables/usePlanning';
import { alertService } from '@/services/alertService';
import DataTable from '@/components/DataTable/DataTable.vue';
import SelectField from '@/components/Form/SelectField.vue';
import PageNavigationLinks from '@/components/PageNavigationLinks.vue';

// Import CSS pour vue-select
import '@/assets/css/select2.css';

import type { ColDef, CellClassParams, ValueFormatterParams } from 'ag-grid-community';
import type { TableRow, DataTableColumn } from '@/interfaces/dataTable';
import type { SelectOption } from '@/interfaces/form';

const route = useRoute();

// Fonction utilitaire pour récupérer l'ID d'inventaire de manière robuste
const currentInventoryId = computed<string>(() => {
  const fromParam = route.params.id
  const fromQuery = route.query.inventoryId

  // Privilégier le param, sinon le query, sinon valeur par défaut
  const raw = typeof fromParam === 'string'
    ? fromParam
    : typeof fromQuery === 'string'
      ? fromQuery
      : '1'

  return raw.trim() || '1'
})

const {
  jobs,
  availableLocations,
  availableJobsForLocation,
  locationSearchQuery,
  selectedAvailable,
  selectedJobs,
  isSubmitting,
  createJob,
  addLocationToJob,
  removeLocationFromJob,
  returnSelectedJobs,
  validateJob
} = usePlanning();

// Keys pour forcer le re-render des tables
const availableLocationsKey = ref(0);
const jobsKey = ref(0);
const selectFieldKey = ref(0);

// État pour le SelectField
const selectedJobId = ref<string | null>(null);

// Computed pour vérifier si on a des jobs disponibles
const hasAvailableJobs = computed(() => {
  return availableJobsForLocation.value && availableJobsForLocation.value.length > 0;
});

// Options pour le SelectField avec protection renforcée
const jobSelectOptions = computed((): SelectOption[] => {
  console.log('Computing jobSelectOptions:', availableJobsForLocation.value);
  
  if (!availableJobsForLocation.value || !Array.isArray(availableJobsForLocation.value)) {
    return [];
  }
  
  return availableJobsForLocation.value
    .filter(job => job && typeof job === 'object' && job.id && job.reference)
    .map(job => ({
      value: job.id,
      label: job.reference || `Job ${job.id}`
    }));
});

// Watcher pour mettre à jour les keys quand les données changent
watch(() => availableLocations.value.length, () => {
  availableLocationsKey.value++;
}, { immediate: true });

watch(() => jobs.value.length, () => {
  jobsKey.value++;
}, { immediate: true });

// Watcher principal pour le SelectField - surveille les changements dans availableJobsForLocation
watch(
  () => availableJobsForLocation.value,
  (newJobs, oldJobs) => {
    console.log('availableJobsForLocation changed:', { newJobs, oldJobs });
    
    // Force le re-render du SelectField
    nextTick(() => {
      selectFieldKey.value++;
      // Reset la sélection quand les options changent
      selectedJobId.value = null;
    });
  },
  { 
    immediate: true,
    deep: true
  }
);

// Watcher supplémentaire pour surveiller les changements dans les options calculées
watch(
  () => jobSelectOptions.value,
  (newOptions, oldOptions) => {
    console.log('jobSelectOptions changed:', { newOptions, oldOptions });
    
    // Si les options ont vraiment changé, forcer le re-render
    if (JSON.stringify(newOptions) !== JSON.stringify(oldOptions)) {
      nextTick(() => {
        selectFieldKey.value++;
        selectedJobId.value = null;
      });
    }
  },
  { 
    immediate: true,
    deep: true
  }
);

// Fonction pour supprimer un emplacement d'un job - SIMPLIFIÉE
async function onRemoveLocationFromJob(jobId: string, location: string) {
  console.log('Tentative de suppression:', { jobId, location });
  
  try {
    const success = await removeLocationFromJob(jobId, location);
    if (success) {
      // Forcer le re-render des tables
      availableLocationsKey.value++;
      jobsKey.value++;
      
      // Réinitialiser les sélections
      selectedJobs.value = [];
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    await alertService.error({ text: 'Erreur lors de la suppression de l\'emplacement.' });
  }
}

// Colonnes pour la table des emplacements disponibles
const availableLocationColumns: ColDef[] = [
  { headerName: 'Emplacement', field: 'emplacement', flex: 2, sortable: true, filter: 'agTextColumnFilter' },
  { headerName: 'Zone',        field: 'zone',        width: 150, sortable: true, filter: 'agTextColumnFilter' },
  { headerName: 'Sous-zone',   field: 'sousZone',    flex: 1, sortable: true, filter: 'agTextColumnFilter' }
];

// Colonnes pour la table des jobs avec configuration des détails
const jobColumns: DataTableColumn[] = [
  { 
    headerName: 'Job', 
    field: 'reference',
    flex: 2,
    sortable: true,
    detailConfig: {
      key: 'locations',
      displayField: 'reference',
      countSuffix: 'emplacements',
      columns: [
        {
          field: 'reference',
          formatter: (value, item) => {
            const [emplacement] = String(item).split(' | ');
            return emplacement;
          }
        },
        {
          field: 'zone',
          formatter: (value, item) => {
            const [, zone] = String(item).split(' | ');
            return zone || '';
          }
        },
        {
          field: 'sousZone',
          formatter: (value, item) => {
            const [, , sousZone] = String(item).split(' | ');
            return sousZone || '';
          }
        }
      ]
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
        ? '<span class="bg-success-light text-success rounded-lg px-2 py-1 text-xs font-medium">VALIDÉ</span>'
        : '<span class="bg-warning-light text-warning rounded-lg px-2 py-1 text-xs font-medium">EN ATTENTE</span>';
    }
  },
  { 
    headerName: 'Zone', 
    field: 'zone',
    width: 120,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  { 
    headerName: 'Sous-zone', 
    field: 'sousZone',
    width: 150,
    sortable: true,
    filter: 'agSelectColumnFilter'
  },
  {
    headerName: 'Actions',
    field: 'actions',
    sortable: false,
        filter: false,
        editable: false,
        singleClickEdit: false,
        minWidth: 80,
        maxWidth: 120,
    cellStyle: { 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      height: '100%'
    },
    cellRenderer: (params) => {
      if (!params.data || !params.data.isChild || !params.data.originalItem) return '';
      
      const location = params.data.originalItem;
      const jobId = params.data.parentId;
      
      return `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <button 
            type="button"
            class="delete-location-btn"
            data-job-id="${jobId}"
            data-location="${location}"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              border: none;
              background: none;
              cursor: pointer;
              border-radius: 6px;
              transition: all 0.2s ease;
            "
            title="Supprimer cet emplacement du job"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;
    },
    onCellClicked: async (params) => {
      const target = params.event?.target as HTMLElement;
      const deleteButton = target.closest('.delete-location-btn') as HTMLButtonElement;
      
      if (deleteButton) {
        const jobId = deleteButton.getAttribute('data-job-id');
        const location = deleteButton.getAttribute('data-location');
        
        if (jobId && location) {
          console.log('Button clicked:', { jobId, location });
          await onRemoveLocationFromJob(jobId, location);
        }
      }
    }
  }
];

// Données formatées pour les tables
const availableLocationData = computed(() =>
  availableLocations.value.map(location => {
    const [emplacement, zone, sousZone] = location.split(' | ');
    return { id: location, emplacement, zone, sousZone };
  })
);

// Sélections
function onAvailableSelectionChanged(rows: TableRow[]) {
  selectedAvailable.value = rows.map(r => String(r.id));
}
function onJobSelectionChanged(rows: TableRow[]) {
  selectedJobs.value = rows.filter(r => !r.isChild).map(r => String(r.id));
}

// Création / ajout - PLUS DE VÉRIFICATION ICI, elle se fait dans la fonction
async function createSingleJob() {
  const ok = await createJob(selectedAvailable.value);
  if (ok) { 
    availableLocationsKey.value++; 
    jobsKey.value++; 
  }
}

// Fonction SANS vérification préalable - elle se fait dans returnSelectedJobs
async function onReturnSelectedJobs() {
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

// Function for adding locations to jobs with improved validation and debugging
async function onSelectJobForLocation(value: string | number | string[] | number[] | null) {
  console.log('onSelectJobForLocation called with:', value);
  console.log('Available jobs:', availableJobsForLocation.value);
  console.log('Selected available:', selectedAvailable.value);
  
  // Enhanced type guard with additional validation
  if (!value || typeof value !== 'string' || value.trim() === '') {
    console.log('Invalid value, resetting selection');
    selectedJobId.value = null;
    return;
  }
  
  const jobId = value as string;
  
  // Validate that the job still exists in the available jobs
  const selectedJob = availableJobsForLocation.value?.find(job => job && job.id === jobId);
  if (!selectedJob) {
    console.error('Selected job not found:', jobId);
    await alertService.error({ text: 'Job sélectionné introuvable. Veuillez actualiser la page.' });
    selectedJobId.value = null;
    return;
  }
  
  const jobReference = selectedJob.reference || `Job ${selectedJob.id}`;
  
  // Validate that we have locations selected
  if (!selectedAvailable.value || selectedAvailable.value.length === 0) {
    await alertService.warning({ text: 'Veuillez sélectionner des emplacements avant d\'ajouter au job.' });
    selectedJobId.value = null;
    return;
  }
  
  const result = await alertService.confirm({ 
    title: 'Confirmer l\'ajout',
    text: `Ajouter ${selectedAvailable.value.length} emplacement(s) au job "${jobReference}" ?`
  });
  
  if (!result.isConfirmed) {
    selectedJobId.value = null; // Reset the select
    return alertService.info({ text: 'Ajout annulé.' });
  }
  
  try {
    await addLocationToJob(jobId, selectedAvailable.value);
    availableLocationsKey.value++;
    jobsKey.value++;
    selectedJobId.value = null; // Reset the select
    
    await alertService.success({ 
      text: `${selectedAvailable.value.length} emplacement(s) ajouté(s) au job "${jobReference}" avec succès.` 
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout au job:', error);
    await alertService.error({ text: 'Erreur lors de l\'ajout au job.' });
    selectedJobId.value = null; // Reset the select on error
  }
}

// Fonction SANS vérification préalable - elle se fait dans la fonction
async function onBulkValidate() {
  const result = await alertService.confirm({ 
    title: 'Confirmer la validation',
    text: `Valider ${selectedJobs.value.length} job(s) ?`
  });
  
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
    await alertService.success({ text: `${selectedJobs.value.length} job(s) validé(s) avec succès.` });
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
.delete-location-btn:hover {
  background-color: #fee2e2 !important;
  transform: scale(1.05);
}

.delete-location-btn:active {
  transform: scale(0.95);
}

/* Enhanced search input styling */
input[type="search"] {
  background-image: none;
}

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
  display: none;
}
</style>