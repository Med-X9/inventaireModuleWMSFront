<template>
  <div class="md:p-6 animate-fade-in">
    <!-- Onglets -->
    <TabGroup as="div" class="w-full px-4">
      <TabList class="flex px-4 space-x-8 bg-gray-100 p-3 py-5 mb-10 rounded-lg">
        <Tab as="template" v-slot="{ selected }">
          <button
            class="px-14 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-0"
            :class="selected
              ? 'bg-primary text-white shadow-lg transform scale-105'
              : 'text-gray-700 hover:bg-primary/10'"
          >
            Date
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button
            class="px-10 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-0"
            :class="selected
              ? 'bg-primary text-white shadow-lg transform scale-105'
              : 'text-gray-700 hover:bg-primary/10'"
          >
            Équipe
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button
            class="px-10 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-0"
            :class="selected
              ? 'bg-primary text-white shadow-lg transform scale-105'
              : 'text-gray-700 hover:bg-primary/10'"
          >
            Jobs
          </button>
        </Tab>
      </TabList>

      <!-- Contenus des panneaux -->
      <TabPanels class="mt-6 transition duration-300 space-y-8">
        <!-- Panneau Date -->
        <TabPanel>
          <div class="space-y-6">
            <!-- Formulaire de création de date -->
            <FormBuilder
              :fields="dateFormFields"
              title="Sélectionner une date"
              submitLabel="Valider"
              @submit="onDateSubmit"
              class="bg-white p-6 rounded-lg shadow-lg"
            />
          </div>
        </TabPanel>

        <!-- Panneau Équipe -->
        <TabPanel>
          <div class="space-y-6">
            <!-- Formulaire de création d'équipe -->
            <FormBuilder
              :fields="teamFormFields"
              title="Créer une équipe"
              submitLabel="Ajouter"
              @submit="onTeamSubmit"
              class="bg-white p-6 rounded-lg shadow-lg"
            />

            <!-- Tableau des équipes -->
            <DataTable
              :columns="teamColumns"
              :rowDataProp="teamRows"
              :actions="teamActions"
              actionsHeaderName="Actions"
              :pagination="true"
              :enableFiltering="true"
              class="bg-white rounded-lg shadow-md"
            />
          </div>
        </TabPanel>

        <!-- Panneau Jobs -->
        <TabPanel>
          <div class="space-y-6">
            <!-- Formulaire de création de job -->
            <FormBuilder
              :fields="jobFormFields"
              title="Créer un job"
              submitLabel="Ajouter"
              @submit="onJobSubmit"
              class="bg-white p-6 rounded-lg shadow-lg"
            />

            <!-- Tableau des jobs -->
            <DataTable
              :columns="jobColumns"
              :rowDataProp="jobRows"
              :actions="jobActions"
              actionsHeaderName="Actions"
              :pagination="true"
              :enableFiltering="true"
              class="bg-white rounded-lg shadow-md"
            />
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import FormBuilder, { FieldConfig } from '@/components/Form/FormBuilder.vue';
import IconEdit from '@/components/icon/icon-edit.vue';

// --- Date ---
const dateFormFields: FieldConfig[] = [
  { key: 'date', label: 'Date', type: 'date' }
];

function onDateSubmit(data: Record<string, any>) {
  console.log("Date sélectionnée:", data.date);
}

// --- Équipe ---
const teamFormFields: FieldConfig[] = [
  { key: 'nom', label: 'Nom', type: 'text' },
  { key: 'prenom', label: 'Prénom', type: 'text' }
];

const teamColumns = [
  { headerName: 'Nom', field: 'nom' },
  { headerName: 'Prénom', field: 'prenom' }
];

const teamRows = ref<Array<Record<string, any>>>([
  { nom: 'Jean', prenom: 'Dupont' },
  { nom: 'Sophie', prenom: 'Martin' }
]);

const teamActions = [
  {
    label: '',
    icon: IconEdit,
    class: 'flex items-center gap-1 px-2 py-1 text-yellow-500 text-xs',
    handler: (row: Record<string, unknown>) => {
      console.log('Modifier la ligne équipe', row);
    },
  },
];

function onTeamSubmit(data: Record<string, any>) {
  teamRows.value.push({ ...data });
}

// --- Jobs ---
// Supprimer "Référence" du formulaire Job
const jobFormFields: FieldConfig[] = [
  { key: 'start_date', label: 'Date début', type: 'date' },
  { key: 'end_date', label: 'Date fin', type: 'date' },
  { key: 'status', label: 'Statut', type: 'select', options: ['Actif', 'Inactif']},
  { key: 'warehouse', label: 'Entrepôt', type: 'text' },
  { key: 'date_status', label: 'Date statut', type: 'date' },
  { key: 'length', label: 'Longueur', type: 'text' },
  { key: 'is_lench', label: 'Est Lenché', type: 'checkbox' }
]


import { ColDef } from 'ag-grid-community';
const jobColumns: ColDef[] = [
  { headerName: 'Référence', field: 'reference' },
  { headerName: 'Date début', field: 'start_date' },
  { headerName: 'Date fin', field: 'end_date' },
  { headerName: 'Statut', field: 'status' },
  { headerName: 'Entrepôt', field: 'warehouse' },
  { headerName: 'Est Lenché', field: 'is_lench' },
  { headerName: 'Date statut', field: 'date_status' },
  { headerName: 'Longueur', field: 'length' }
];

const jobRows = ref<Array<Record<string, any>>>([
  {
    reference: 'JOB-001',
    start_date: '2025-04-01',
    end_date: '2025-04-03',
    status: 'Actif',
    warehouse: 'Entrepôt A',
    is_lench: true,
    date_status: '2025-04-01',
    length: '2 jours'
  }
]);

const jobActions = [
  {
    label: '',
    icon: IconEdit,
    class: 'flex items-center gap-1 px-2 py-1 text-yellow-500 text-xs',
    handler: (row: Record<string, unknown>) => {
      console.log('Modifier la ligne job', row);
    },
  },
];

function onJobSubmit(data: Record<string, any>) {
  jobRows.value.push({ ...data });
}

</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}


button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
