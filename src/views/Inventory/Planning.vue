<template>
  <div>
    <div>
      <!-- Section Jobs -->
      <section class="panel">
        <h2 class="text-xl font-semibold mb-6">Création de jobs</h2>
        
        <!-- Table 1: Emplacements disponibles -->
        <div>
          <DataTable
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
                <div class="flex gap-2">
                  <button
                    @click="createSingleJob"
                    class="btn btn-primary"
                    :disabled="selectedAvailable.length === 0"
                  >
                    Créer Job ({{ selectedAvailable.length }})
                  </button>
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

        <!-- Table 2: Jobs créés -->
        <div class="mt-8">
          <h3 class="text-lg font-semibold mb-4">
            Jobs créés
            <span v-if="isValidated" class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              ✓ Validés
            </span>
            <span v-else-if="jobs.length > 0" class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              ⏳ En attente de validation
            </span>
          </h3>
          <DataTable
            v-if="jobs.length"
            :columns="jobColumns"
            :rowDataProp="displayJobsData"
            :rowSelection="true"
            @selection-changed="onJobSelectionChanged"
            :showColumnSelector="false"
            storageKey="planning_jobs"
          >
            <template #table-actions>
              <div class="flex items-center justify-between gap-4 mb-4">
                <div class="flex gap-2">
                  <button
                    @click="deleteSelectedJobs"
                    class="btn btn-danger"
                    :disabled="selectedJobs.length === 0"
                  >
                    ✕ Annuler ({{ selectedJobs.length }})
                  </button>
                  <button
                    @click="cancelPlanning"
                    class="btn btn-outline-danger"
                    :disabled="jobs.length === 0"
                  >
                    ✕ Annuler tout
                  </button>
                </div>
              </div>
            </template>
          </DataTable>
          
          <!-- Bouton valider en dessous de la table -->
          <div v-if="jobs.length" class="mt-4 flex justify-end">
            <button
              @click="validateJobs"
              :disabled="isSubmitting || isValidated"
              class="btn btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': isSubmitting || isValidated }"
            >
              <span v-if="!isSubmitting && !isValidated">✓ Valider tous les jobs</span>
              <span v-else-if="isValidated">✓ Jobs déjà validés</span>
              <span v-else class="flex items-center">
                <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validation en cours...
              </span>
            </button>
          </div>
          
          <div v-else class="text-center py-12 border-dashed border-2 rounded-lg">
            <p class="text-gray-500">Aucun job créé</p>
            <p class="text-sm text-gray-400 mt-2">Sélectionnez des emplacements dans la table ci-dessus pour créer un job</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlanning } from '@/composables/usePlanning';
import { alertService } from '@/services/alertService';
import DataTable from '@/components/DataTable/DataTable.vue';

import type { ColDef, CellClassParams, ValueFormatterParams } from 'ag-grid-community';
import type { TableRow } from '@/interfaces/dataTable';

const {
  jobs,
  availableLocations,
  locationSearchQuery,
  selectedAvailable,
  selectedJobs,
  isSubmitting,
  isValidated,
  createJob,
  deleteSelectedJobs,
  validateJobs,
  cancelPlanning,
  clearSelections
} = usePlanning();

// État pour gérer l'expansion des jobs
const expandedJobIds = ref<Set<string>>(new Set());

// Colonnes pour la table des emplacements disponibles (sans colonne emplacement)
const availableLocationColumns: ColDef[] = [
  { 
    headerName: 'Zone', 
    field: 'zone',
    width: 150,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  { 
    headerName: 'Sous-zone', 
    field: 'sousZone',
    flex: 1,
    sortable: true,
    filter: 'agTextColumnFilter'
  }
];

// Colonnes pour la table des jobs avec expansion (sans colonne emplacement)
const jobColumns: ColDef[] = [
  { 
    headerName: 'Référence Job', 
    field: 'reference',
    flex: 2,
    sortable: true,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { 
          paddingLeft: '35px', 
          color: '#666',
          fontStyle: 'italic'
        };
      }
      return undefined;
    },
    cellRenderer: (params) => {
      if (!params.data) return '';
      
      if (!params.data.isChild) {
        const jobId = params.data.jobId;
        const isExpanded = expandedJobIds.value.has(jobId);
        const locationsCount = params.data.locationsCount || 0;
        const isJobValidated = params.data.isValidated;
        
        const arrow = isExpanded 
          ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="6 9 12 15 18 9"/>
             </svg>`
          : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="9 6 15 12 9 18"/>
             </svg>`;
        
        const statusBadge = isJobValidated 
          ? '<span style="margin-left: 8px; padding: 2px 6px; background-color: #10b981; color: white; font-size: 10px; border-radius: 4px;">✓ VALIDÉ</span>'
          : '<span style="margin-left: 8px; padding: 2px 6px; background-color: #f59e0b; color: white; font-size: 10px; border-radius: 4px;">⏳ EN ATTENTE</span>';
        
        return `
          <div style="display: flex; align-items: center; width: 100%;">
            <span 
              style="cursor: pointer; display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" 
              data-expand-toggle="${jobId}"
            >
              ${arrow}
            </span>
            <span><strong>${params.value ?? ''}</strong></span>
          </div>`;
      }
      
      // Ligne enfant : affichage de l'emplacement complet
      return `<span style="color: #666;">${params.value ?? ''}</span>`;
    },
    onCellClicked: (params) => {
      const target = params.event?.target as HTMLElement;
      const expandToggle = target.closest('[data-expand-toggle]');
      
      if (expandToggle && !params.data?.isChild) {
        const jobId = expandToggle.getAttribute('data-expand-toggle');
        if (jobId) {
          if (expandedJobIds.value.has(jobId)) {
            expandedJobIds.value.delete(jobId);
          } else {
            expandedJobIds.value.add(jobId);
          }
        }
      }
    }
  },
  { 
    headerName: 'Zone', 
    field: 'zone',
    width: 120,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { color: '#666' };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.data) return '';
      return params.data.isChild ? (params.value as string ?? '') : '';
    }
  },
  { 
    headerName: 'Sous-zone', 
    field: 'sousZone',
    width: 150,
    sortable: true,
    filter: 'agSelectColumnFilter',
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { color: '#666' };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.data) return '';
      return params.data.isChild ? (params.value as string ?? '') : '';
    }
  }
];

// Données formatées pour les tables
const availableLocationData = computed(() => {
  return availableLocations.value.map(location => {
    const parsed = parseLocation(location);
    return {
      id: location,
      zone: parsed.zone,
      sousZone: parsed.sousZone,
      emplacement: parsed.emplacement
    };
  });
});

// Données des jobs avec support pour l'expansion
const displayJobsData = computed(() => {
  const result: any[] = [];
  
  jobs.value.forEach((job, jobIndex) => {
    // Ligne parent (job principal)
    result.push({
      id: job.id,
      jobId: job.id,
      reference: job.reference || `JOB-${job.id.substring(0, 8)}`,
      locationsCount: job.locations.length,
      isChild: false,
      parentId: null,
      isValidated: job.isValidated || false
    });

    // Si ce job est étendu, ajouter ses emplacements
    if (expandedJobIds.value.has(job.id)) {
      job.locations.forEach((location, locationIndex) => {
        const parsed = parseLocation(location);
        result.push({
          id: `${job.id}-${locationIndex}`,
          jobId: job.id,
          reference: parsed.emplacement,
          zone: parsed.zone,
          sousZone: parsed.sousZone,
          isChild: true,
          parentId: job.id
        });
      });
    }
  });
  
  return result;
});

// Fonction utilitaire pour parser les emplacements
function parseLocation(location: string) {
  const [emplacement, zone, sousZone] = location.split(' | ');
  return { emplacement, zone, sousZone };
}

// Gestion des sélections avec typage correct
function onAvailableSelectionChanged(selectedRows: TableRow[]) {
  selectedAvailable.value = selectedRows.map(row => String(row.id));
}

function onJobSelectionChanged(selectedRows: TableRow[]) {
  // Filtrer pour ne garder que les lignes parent (jobs principaux)
  const parentRows = selectedRows.filter(row => !row.isChild);
  selectedJobs.value = parentRows.map(row => String(row.id));
}

// Create a single job with all selected locations
async function createSingleJob() {
  if (selectedAvailable.value.length === 0) {
    await alertService.error({
      text: 'Attention ! Vous n\'avez rien sélectionné.'
    });
    return;
  }
  
  await createJob(selectedAvailable.value);
}
</script>

<style scoped>
/* Style pour les lignes enfants */
:deep(.ag-row[data-is-child="true"]) {
  background-color: #f8f9fa;
}

:deep(.ag-row[data-is-child="true"] .ag-cell) {
  border-bottom: 1px solid #e9ecef;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>