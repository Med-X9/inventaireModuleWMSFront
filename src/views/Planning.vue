<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Test Pagination</h1>

    <DataTable
      :columns="columns"
      :actions="actions"
      :rowDataProp="data"
      :onPaginationChanged="handlePaginationChanged"
      :pagination="true"
      :storageKey="'test-pagination'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import type { DataTableColumn, ActionConfig } from '@/interfaces/dataTable'

// Données de test
const data = ref([
  { id: 1, name: 'Item 1', status: 'Active', date: '2024-01-01' },
  { id: 2, name: 'Item 2', status: 'Inactive', date: '2024-01-02' },
  { id: 3, name: 'Item 3', status: 'Active', date: '2024-01-03' },
  { id: 4, name: 'Item 4', status: 'Active', date: '2024-01-04' },
  { id: 5, name: 'Item 5', status: 'Inactive', date: '2024-01-05' },
  { id: 6, name: 'Item 6', status: 'Active', date: '2024-01-06' },
  { id: 7, name: 'Item 7', status: 'Active', date: '2024-01-07' },
  { id: 8, name: 'Item 8', status: 'Inactive', date: '2024-01-08' },
  { id: 9, name: 'Item 9', status: 'Active', date: '2024-01-09' },
  { id: 10, name: 'Item 10', status: 'Active', date: '2024-01-10' },
  { id: 11, name: 'Item 11', status: 'Inactive', date: '2024-01-11' },
  { id: 12, name: 'Item 12', status: 'Active', date: '2024-01-12' },
])

const columns: DataTableColumn[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Nom', width: 200 },
  { field: 'status', headerName: 'Statut', width: 120 },
  { field: 'date', headerName: 'Date', width: 120 },
]

const actions: ActionConfig[] = [
  {
    label: 'Éditer',
    icon: 'edit',
    action: (row) => {
      console.log('Éditer:', row)
    }
  },
  {
    label: 'Supprimer',
    icon: 'delete',
    action: (row) => {
      console.log('Supprimer:', row)
    }
  }
]

const handlePaginationChanged = ({ page, pageSize }: { page: number, pageSize: number }) => {
  console.log('🔄 Pagination changée:', { page, pageSize })
  // Ici tu peux appeler ton API avec les nouveaux paramètres
  // loadData(page, pageSize)
}
</script>
