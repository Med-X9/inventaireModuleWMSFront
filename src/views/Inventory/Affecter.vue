<template>
  <div class="container mx-auto">

    <!-- DataTable (master) -->
    <div class="panel datatable">
      <DataTable
        :columns="columns"
        :rowDataProp="displayData"
        :actions="rowActions"
        :pagination="true"
        :enableFiltering="true"
        :rowSelection="true"
        @selection-changed="onSelectionChanged"
        @row-clicked="onRowClicked"
        storageKey="affecter_table"
      >
        <template #table-actions>
          <div class="flex gap-3 mb-4">
            <button
              @click="handleAffecterPremierComptageClick"
              class="btn px-6 py-2.5 btn-outline-primary btn-sm"
            >
              Affecter Premier Comptage
            </button>
            <button
              @click="handleAffecterDeuxiemeComptageClick"
              class="btn px-6 py-2.5 btn-outline-secondary btn-sm"
            >
              Affecter Deuxième Comptage
            </button>
            <button
              @click="handleActionRessourceClick"
              class="btn px-6 py-2.5 btn-outline-primary btn-sm"
            >
              Ressource
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Modal d'affectation d'équipe -->
    <Modal v-model="showTeamModal" :title="modalTitle">
      <div class="mt-4">
        <FormBuilder
          v-model="teamForm"
          :fields="teamFields"
          @submit="handleTeamSubmit"
          submitLabel="Affecter"
        />
      </div>
    </Modal>
      <!-- Modal d'affectation de ressources -->
    <Modal v-model="showResourceModal" title="Affecter Ressources">
      <div class="mt-4">
        <FormBuilder
          v-model="resourceForm"
          :fields="resourceFields"
          @submit="handleResourceSubmit"
          submitLabel="Affecter"
        />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import Modal from '@/components/Modal.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { ColDef, CellClassParams, ValueFormatterParams, RowClickedEvent } from 'ag-grid-community';
import type { ActionConfig, TableRow } from '@/interfaces/dataTable';
import type { FieldConfig } from '@/interfaces/form';
import { useAffecter } from '@/composables/useAffecter';
import { alertService } from '@/services/alertService';

const router = useRouter();
const { rows, affecterAuPremierComptage, affecterAuDeuxiemeComptage, affecterRessources, cancelAffecter, PLANNING_DATE } = useAffecter();

// --- Interface explicite pour chaque ligne (row) de la grille ---
interface RowNode extends TableRow {
  id: string;
  job: string;
  team1: string;
  date1: string;
  team2: string;
  date2: string;
  resources: string;
  locations?: string[];
}


// --- État pour garder les IDs des jobs "dépliés" ---
const expandedJobIds = ref<Set<string>>(new Set());

// --- Data "aplatie" qui sera envoyée à DataTable.vue ---
const displayData = ref<RowNode[]>([]);

/**
 * Reconstruit displayData à partir de rows.value (parent only).
 * Pour chaque parent, on l'ajoute. Puis si son ID est dans expandedJobIds,
 * on insère autant de lignes enfant qu'il y a d'emplacements.
 */
function rebuildDisplayData() {
  const newData: RowNode[] = [];
  
  rows.value.forEach((parentRow) => {
    // Ligne parent
    newData.push({
      id: parentRow.id,
      job: parentRow.job,
      team1: parentRow.team1,
      date1: parentRow.date1,
      team2: parentRow.team2,
      date2: parentRow.date2,
      resources: parentRow.resources,
      locations: parentRow.locations,
      isChild: false,
      parentId: null
    });

    // Si on doit déplier ce job, on ajoute ses enfants
    if (expandedJobIds.value.has(parentRow.id)) {
      const locs = parentRow.locations || [];
      locs.forEach((location, index) => {
        newData.push({
          id: `${parentRow.id}--${location}`,
          job: `└─ ${location}`, // Affichage indenté pour les emplacements
          team1: '',
          date1: '',
          team2: '',
          date2: '',
          resources: '',
          isChild: true,
          parentId: parentRow.id
        });
      });
    }
  });
  
  displayData.value = newData;
}

// Exécution initiale pour remplir displayData
rebuildDisplayData();

// --- Définition des colonnes avec typage explicite ColDef ---
const columns: ColDef[] = [
  {
    headerName: 'Job',
    field: 'job',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 2,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { 
          paddingLeft: '20px', 
          color: '#666',
          fontStyle: 'italic',
          fontSize: '12px'
        };
      }
      return undefined;
    },
    cellRenderer: (params) => {
      if (!params.data) return '';
      
      if (!params.data.isChild) {
        const jobId = params.data.id;
        const isExpanded = expandedJobIds.value.has(jobId);
        const hasLocations = params.data.locations && params.data.locations.length > 0;
        
        if (!hasLocations) {
          return `<span style="font-weight: 500;">${params.value ?? ''}</span>`;
        }
        
        const arrow = isExpanded 
          ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="6 9 12 15 18 9"/>
             </svg>`
          : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="9 6 15 12 9 18"/>
             </svg>`;
        
        return `
          <div style="display: flex; align-items: center; width: 100%;">
            <span 
              style="cursor: pointer; display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" 
              data-expand-toggle="${jobId}"
              title="Cliquer pour afficher/masquer les emplacements"
            >
              ${arrow}
            </span>
            <span style="font-weight: 500;">${params.value ?? ''}</span>
            <span style="color: #666; font-size: 11px; margin-left: 8px;">(${params.data.locations.length} emplacements)</span>
          </div>`;
      }
      
      // Ligne enfant : affichage avec style différent
      return `<span style="color: #666; font-size: 12px;">${params.value ?? ''}</span>`;
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
          rebuildDisplayData();
        }
      }
    }
  },
  {
    headerName: 'Ressources',
    field: 'resources',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1.5,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { 
          color: '#ccc', 
          fontSize: '11px' 
        };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.data) return '';
      if (params.data.isChild) return '';
      return params.value || '';
    }
  },
  {
    headerName: 'Équipe Premier Comptage',
    field: 'team1',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1.2,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { 
          color: '#ccc', 
          fontSize: '11px' 
        };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.data) return '';
      if (params.data.isChild) return '';
      return (params.value as string) || '';
    }
  },
  {
    headerName: 'Date Premier Comptage',
    field: 'date1',
    sortable: true,
    filter: 'agDateColumnFilter',
    flex: 1,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { 
          color: '#ccc', 
          fontSize: '11px' 
        };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.data) return '';
      if (params.data.isChild) return '';
      return params.value ? new Date(params.value as string).toLocaleDateString('fr-FR') : '';
    }
  },
  {
    headerName: 'Équipe Deuxième Comptage',
    field: 'team2',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1.2,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { 
          color: '#ccc', 
          fontSize: '11px' 
        };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.data) return '';
      if (params.data.isChild) return '';
      return (params.value as string) || '';
    }
  },
  {
    headerName: 'Date Deuxième Comptage',
    field: 'date2',
    sortable: true,
    filter: 'agDateColumnFilter',
    flex: 1,
    cellStyle: (params: CellClassParams) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { 
          color: '#ccc', 
          fontSize: '11px' 
        };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.data) return '';
      if (params.data.isChild) return '';
      return params.value ? new Date(params.value as string).toLocaleDateString('fr-FR') : '';
    }
  }
];

// --- Actions sur chaque ligne "parent" uniquement ---
const rowActions: ActionConfig[] = [
  {
    label: 'Affecter Ressources',
    handler: (row: TableRow) => {
      const rowNode = row as RowNode;
      if (rowNode.isChild) return;
      selectedRows.value = [rowNode];
      showResourceModal.value = true;
    }
  },
  {
    label: 'Réaffecter Premier Comptage',
    handler: (row: TableRow) => {
      const rowNode = row as RowNode;
      if (rowNode.isChild) return;
      selectedRows.value = [rowNode];
      currentTeamType.value = 'premier';
      showTeamModal.value = true;
    }
  },
  {
    label: 'Réaffecter Deuxième Comptage',
    handler: (row: TableRow) => {
      const rowNode = row as RowNode;
      if (rowNode.isChild) return;
      if (!rowNode.team1) {
        alertService.warning({ text: 'Le job doit d\'abord avoir un premier comptage.' });
        return;
      }
      selectedRows.value = [rowNode];
      currentTeamType.value = 'deuxieme';
      showTeamModal.value = true;
    }
  }
];

const selectedRows = ref<RowNode[]>([]);

/**
 * Lorsque l'utilisateur coche une checkbox, AG Grid renvoie un tableau complet
 * (parents + enfants). On ne garde ici que les parents (isChild=false).
 */
function onSelectionChanged(rowsData: TableRow[]) {
  selectedRows.value = rowsData.filter((r): r is RowNode => !r.isChild) as RowNode[];
}

/**
 * Gestion du clic sur une ligne - désactivée car on gère maintenant via onCellClicked
 */
function onRowClicked(event: RowClickedEvent) {
  // Ne rien faire ici, la logique est dans onCellClicked de la colonne job
}

// --- Boutons « Affecter » (identique à votre logique initiale) ---
const showTeamModal = ref(false);
const currentTeamType = ref<'premier' | 'deuxieme'>('premier');

const modalTitle = computed(() =>
  `Affecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`
);

const teamForm = ref<Record<string, unknown>>({
  team: '',
  date: ''
});

const teamFields: FieldConfig[] = [
  {
    key: 'team',
    label: 'Équipe',
    type: 'select',
    searchable: true,
    options: [
      { label: 'Équipe A', value: 'Équipe A' },
      { label: 'Équipe B', value: 'Équipe B' },
      { label: 'Équipe C', value: 'Équipe C' }
    ],
    validators: [{ key: 'required', fn: v => !!v, msg: 'Équipe requise' }]
  },
  {
    key: 'date',
    label: 'Date',
    type: 'date',
    min: PLANNING_DATE,
    validators: [{ key: 'required', fn: v => !!v, msg: 'Date requise' }]
  }
];

function handleAffecterPremierComptageClick() {
  if (!selectedRows.value.length) {
    alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
    return;
  }
  currentTeamType.value = 'premier';
  showTeamModal.value = true;
}

function handleAffecterDeuxiemeComptageClick() {
  if (!selectedRows.value.length) {
    alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
    return;
  }
  currentTeamType.value = 'deuxieme';
  showTeamModal.value = true;
}

// État modal ressources
const showResourceModal = ref(false);
const resourceForm = ref({ resources: [] });
const resourceFields: FieldConfig[] = [
  {
    key: 'resources',
    label: 'Ressources',
    type: 'select',
    options: [
      { label: 'Scanner Zebra MC9300', value: 'Scanner Zebra MC9300' },
      { label: 'Terminal Honeywell CT60', value: 'Terminal Honeywell CT60' },
      { label: 'Imprimante Mobile Zebra ZQ630', value: 'Imprimante Mobile Zebra ZQ630' },
      { label: 'Tablette Samsung Galaxy Tab A8', value: 'Tablette Samsung Galaxy Tab A8' },
      { label: 'Pistolet de Comptage Datalogic', value: 'Pistolet de Comptage Datalogic' }
    ],
    multiple: true,
    searchable: true,
    clearable: true,
    props: { placeholder: 'Sélectionnez une ou plusieurs ressources' },
    validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Sélectionnez au moins une ressource' }]
  }
];

function handleActionRessourceClick() {
  if (!selectedRows.value.length) {
    alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
    return;
  }
  showResourceModal.value = true;
}

async function handleResourceSubmit(data: Record<string, unknown>) {
  const { resources } = data as { resources: string[] };
  const jobIds = selectedRows.value.map(r => r.id);
  
  await affecterRessources(jobIds, resources);
  
  showResourceModal.value = false;
  resourceForm.value = { resources: [] };
  rebuildDisplayData();
}

async function handleTeamSubmit(data: Record<string, unknown>) {
  const { team, date } = data as { team: string; date: string };
  const jobIds = selectedRows.value.map(r => r.id);

  if (currentTeamType.value === 'premier') {
    await affecterAuPremierComptage(team, jobIds, date);
  } else {
    await affecterAuDeuxiemeComptage(team, jobIds, date);
  }

  showTeamModal.value = false;
  teamForm.value = { team: '', date: '' };
  rebuildDisplayData(); // Reconstruire les données après modification
}
</script>

<style scoped>
/* Style pour les lignes enfants */
</style>