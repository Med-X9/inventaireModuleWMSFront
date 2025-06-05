<template>
    <ul class="flex space-x-2 mb-4">
        <li>
            <router-link :to="{ name: 'inventory-list' }" class="text-primary hover:underline"> Gestion d'inventaire </router-link>
        </li>
        <li>
            <router-link :to="{ name: 'planning-management' }" class="before:content-['/'] ltr:before:mr-2 text-primary hover:underline"
                >Gestion des plannings</router-link
            >
        </li>
        <li class="before:content-['/'] ltr:before:mr-2"><span>Lancer</span></li>
    </ul>
    <div class="panel py-7 datatable">
        <DataTable
            :columns="columns"
            :rowDataProp="jobs"
            :actions="actions"
            :pagination="true"
            :enableFiltering="true"
            :rowSelection="true"
            @selection-changed="onSelectionChanged"
            storageKey="jobs_management_table"
        >
            <template #table-actions>
                <button class="btn btn-primary mb-4" @click="launchSelected">Lancer</button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { useRoute } from 'vue-router';
    import DataTable from '@/components/DataTable/DataTable.vue';
    import type { ActionConfig } from '@/interfaces/dataTable';

    interface Job {
        id: number;
        name: string;
        status: string;
    }

    // Static data for jobs
    const jobs = ref<Job[]>([
        { id: 1, name: 'Job 1', status: 'En attente' },
        { id: 2, name: 'Job 2', status: 'En cours' },
        { id: 3, name: 'Job 3', status: 'Terminé' },
        { id: 4, name: 'Job 4', status: 'En attente' },
    ]);

    const selectedJobs = ref<Job[]>([]);

    const columns = [
        {
            headerName: 'Job',
            field: 'name',
            sortable: true,
            filter: 'agTextColumnFilter',
        },
        {
            headerName: 'Statut',
            field: 'status',
            sortable: true,
            filter: 'agTextColumnFilter',
            cellRenderer: (params: any) => {
                const statusClass = getStatusClass(params.value);
                return `<span class="px-3 py-1 rounded-full text-sm ${statusClass}">${params.value}</span>`;
            },
        },
    ];

    const getStatusClass = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'en attente':
                return 'bg-warning-light text-warning';
            case 'en cours':
                return 'bg-info-light text-info';
            case 'terminé':
                return 'bg-success-light text-success';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const actions: ActionConfig[] = [];

    function onSelectionChanged(rows: Job[]): void {
        selectedJobs.value = rows;
    }

    function launchSelected(): void {
        console.log('Launching selected jobs:', selectedJobs.value);
    }
</script>

<style scoped>
    .datatable :deep(.ag-cell) {
        display: flex;
        align-items: center;
    }
</style>
