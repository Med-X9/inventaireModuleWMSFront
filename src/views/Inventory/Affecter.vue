<template>
  <div class="container mx-auto ">
    <!-- Fil d’Ariane + Bouton Annuler -->
    <div class="flex flex-col mb-6">
      <ul class="flex space-x-2 rtl:space-x-reverse">
        <li>
          <router-link :to="{ name: 'inventory-list' }" class="text-primary hover:underline">
            Gestion d'inventaire
          </router-link>
        </li>
        <li>
          <router-link
            :to="{ name: 'planning-management' }"
            class="before:content-['/'] ltr:before:mr-2 text-primary hover:underline"
          >
            Gestion des plannings
          </router-link>
        </li>
        <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500">
          <span>Affectation des équipes</span>
        </li>
      </ul>
    </div>

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

    <!-- Modal d’affectation d’équipe -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import Modal from '@/components/Modal.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type {
  ColDef,
  CellClassParams,
  ValueFormatterParams,
  RowClickedEvent
} from 'ag-grid-community';
import type { ActionConfig } from '@/interfaces/dataTable';
import type { FieldConfig } from '@/interfaces/form';
import { useAffecter } from '@/composables/useAffecter';
import { alertService } from '@/services/alertService';

const router = useRouter();
const {
  rows,
  affecterAuPremierComptage,
  affecterAuDeuxiemeComptage,
  cancelAffecter,
  PLANNING_DATE
} = useAffecter();

// --- Interface explicite pour chaque ligne (row) de la grille ---
interface RowNode {
  id: string;
  job: string;
  team1: string;
  date1: string;
  team2: string;
  date2: string;
  locations?: string[];
  isChild: boolean;
  parentId: string | null;
}

// --- État pour garder les IDs des jobs “dépliés” ---
const expandedJobIds = ref<Set<string>>(new Set());

// --- Data “aplatie” qui sera envoyée à DataTable.vue ---
const displayData = ref<RowNode[]>([]);

/**
 * Reconstruit displayData à partir de rows.value (parent only).
 * Pour chaque parent, on l’ajoute. Puis si son ID est dans expandedJobIds,
 * on insère autant de lignes enfant qu’il y a d’emplacements.
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
      locations: parentRow.locations,
      isChild: false,
      parentId: null
    });

    // Si on doit déplier ce job, on ajoute ses enfants
    if (expandedJobIds.value.has(parentRow.id)) {
      const locs = parentRow.locations || [];
      locs.forEach((location) => {
        newData.push({
          id: `${parentRow.id}--${location}`,
          job: location,
          team1: parentRow.team1,
          date1: parentRow.date1,
          team2: parentRow.team2,
          date2: parentRow.date2,
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

// --- Définition des colonnes avec typage explicite ColDef<RowNode> ---
const columns: ColDef<RowNode>[] = [
  {
    headerName: 'Job',
    field: 'job',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 2,
    cellStyle: (params: CellClassParams<RowNode>) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { paddingLeft: '35px', color: '#555' };
      }
      return undefined;
    },
    cellRenderer: (params) => {
      if (!params.data) return '';
      if (!params.data.isChild) {
        const jobId = params.data.id;
        const isExpanded = expandedJobIds.value.has(jobId);
        const arrow = isExpanded
  ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
     </svg>`
  : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 6 15 12 9 18"/>
     </svg>`;
        return `
          <span style="cursor: pointer; display: inline-flex; align-items: center;">
            <span style="width: 1rem; display: inline-block;">${arrow}</span>
            <span>${params.value ?? ''}</span>
          </span>`;
      }
      // Ligne enfant : on n’affiche que le texte
      return `<span>${params.value ?? ''}</span>`;
    }
  },
  {
    headerName: 'Équipe Premier Comptage',
    field: 'team1',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1,
    cellStyle: (params: CellClassParams<RowNode>) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { color: '#999' };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams<RowNode>) => {
      if (!params.data) return '';
      return params.data.isChild ? '' : (params.value as string ?? '');
    }
  },
  {
    headerName: 'Date Premier Comptage',
    field: 'date1',
    sortable: true,
    filter: 'agDateColumnFilter',
    flex: 1,
    valueFormatter: (params: ValueFormatterParams<RowNode>) => {
      if (!params.data) return '';
      if (params.data.isChild) return '';
      return params.value
        ? new Date(params.value as string).toLocaleDateString()
        : '';
    }
  },
  {
    headerName: 'Équipe Deuxième Comptage',
    field: 'team2',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1,
    cellStyle: (params: CellClassParams<RowNode>) => {
      if (!params.data) return undefined;
      if (params.data.isChild) {
        return { color: '#999' };
      }
      return undefined;
    },
    valueFormatter: (params: ValueFormatterParams<RowNode>) => {
      if (!params.data) return '';
      return params.data.isChild ? '' : (params.value as string ?? '');
    }
  },
  {
    headerName: 'Date Deuxième Comptage',
    field: 'date2',
    sortable: true,
    filter: 'agDateColumnFilter',
    flex: 1,
    valueFormatter: (params: ValueFormatterParams<RowNode>) => {
      if (!params.data) return '';
      if (params.data.isChild) return '';
      return params.value
        ? new Date(params.value as string).toLocaleDateString()
        : '';
    }
  }
];

// --- Actions sur chaque ligne “parent” uniquement ---
const rowActions: ActionConfig[] = [
  {
    label: 'Réaffecter Premier Comptage',
    handler: (row: RowNode) => {
      selectedRows.value = [row];
      currentTeamType.value = 'premier';
      showTeamModal.value = true;
    }
  },
  {
    label: 'Réaffecter Deuxième Comptage',
    handler: (row: RowNode) => {
      if (!row.team1) {
        alertService.warning({ text: 'Le job doit d\'abord avoir un premier comptage.' });
        return;
      }
      selectedRows.value = [row];
      currentTeamType.value = 'deuxieme';
      showTeamModal.value = true;
    }
  }
];

const selectedRows = ref<RowNode[]>([]);

/** 
 * Lorsque l’utilisateur coche une checkbox, AG Grid renvoie un tableau complet
 * (parents + enfants). On ne garde ici que les parents (isChild=false).
 */
function onSelectionChanged(rowsData: RowNode[]) {
  selectedRows.value = rowsData.filter(r => !r.isChild);
}

/**
 * Gestion du clic sur une ligne (parent uniquement).
 * On bascule l’ID dans expandedJobIds puis on reconstruit displayData.
 */
function onRowClicked(event: RowClickedEvent<RowNode>) {
  if (!event.data) return;
  const data = event.data;
  if (data.isChild) {
    return;
  }
  const jobId = data.id;
  if (expandedJobIds.value.has(jobId)) {
    expandedJobIds.value.delete(jobId);
  } else {
    expandedJobIds.value.add(jobId);
  }
  rebuildDisplayData();
}

// --- Boutons « Affecter » (identique à votre logique initiale) ---
const showTeamModal = ref(false);
const currentTeamType = ref<'premier' | 'deuxieme'>('premier');
const modalTitle = computed(() =>
  `Affecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`
);
const teamForm = ref<Record<string, unknown>>({ team: '', date: '' });

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

function handleActionRessourceClick() {
  if (!selectedRows.value.length) {
    alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
    return;
  }
  alert('Action Ressource ');
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
}
</script>

<style scoped>
/* Optionnel : style de fond pour les lignes enfants */
.ag-theme-alpine .ag-row-child .ag-cell {
  background-color: #f9f9f9;
}
</style>
