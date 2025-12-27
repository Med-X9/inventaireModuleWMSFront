<template>
    <div class="datatable panel py-7">
        <DataTable
            :columns="columns as any"
            :rowDataProp="jobs"
            :actions="actions as any"
            :pagination="true"
            :rowSelection="false"
            :enableFiltering="true"
            :serverSidePagination="true"
            :serverSideFiltering="true"
            :serverSideSorting="true"
            :storageKey="'job_management_table'"
            :showColumnSelector="true"
            :loading="loading"
            @pagination-changed="handlePaginationChanged"
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
import { onMounted } from 'vue';
import { useJobManagement } from '@/composables/useJobManagement';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconPlus from '@/components/icon/icon-plus.vue';

const {
    jobs,
    loading,
    columns,
    actions,
    redirectToAdd,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    loadData
} = useJobManagement();

// Charger les données une fois le composant monté
onMounted(async () => {
    await loadData();
});
</script>
