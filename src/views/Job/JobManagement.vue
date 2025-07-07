<template>
    <div class="datatable panel py-7">
        <DataTable
            :columns="columns"
            :rowDataProp="jobs"
            :actions="actions"
            :pagination="true"
            :rowSelection="false"
            :enableFiltering="true"
            :storageKey="'job_management_table'"
            :showColumnSelector="true"
            :onPaginationChanged="handlePaginationChanged"
            @sort-changed="handleSortChanged"
            @filter-changed="handleFilterChanged"
        >
            <template #table-actions>
                <div class="flex items-center flex-wrap gap-2">
                    <button class="btn btn-primary p-2 px-4 mb-4 btn-sm" @click="redirectToAdd">
                        <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        Créer Job
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useJobManagement } from '@/composables/useJobManagement';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconPlus from '@/components/icon/icon-plus.vue';

const {
    jobs,
    loading,
    columns,
    actions,
    redirectToAdd,
    fetchJobs,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
} = useJobManagement();

// Charger les données une fois le composant monté
onMounted(async () => {
    console.log('🚀 Chargement initial des jobs...');
    await fetchJobs();
});

// Surveiller les changements dans le store
watch(jobs, (newJobs) => {
    console.log('📊 Jobs mis à jour:', newJobs.length, 'éléments');
}, { deep: true });
</script>
