<template>
    <div class="datatable panel py-7">
        <DataTable :columns="columns" :rowDataProp="inventories" :actions="actions" :pagination="true"
            :rowSelection="false" :enableFiltering="true" storageKey="inventory_management_table" :showColumnSelector="true"
            :onPaginationChanged="handlePaginationChanged" @sort-changed="handleSortChanged" @filter-changed="handleFilterChanged">
            <template #table-actions>
                <div class="flex items-center justify-end flex-wrap gap-2">
                    <button class=" btn btn-primary p-2 px-4 mb-4 btn-sm " @click="redirectToAdd">
                        <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2 " />
                        Créer
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from 'vue';
import { useInventoryManagement } from '@/composables/useInventoryManagement';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconUpload from '@/components/icon/icon-upload.vue';
import { alertService } from '@/services/alertService';

const {
    inventories,
    loading,
    columns,
    actions,
    redirectToAdd,
    fetchInventories,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    importStockImage,
} = useInventoryManagement();

const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
    fileInput.value?.click();
}

async function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    // Demander à l'utilisateur l'ID de l'inventaire cible
    const idStr = prompt('ID de l\'inventaire pour l\'import ?');
    const id = idStr ? parseInt(idStr, 10) : null;
    if (!id) {
        await alertService.error({ text: "ID d'inventaire invalide ou annulé." });
        input.value = '';
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
        await importStockImage(id, formData);
        await alertService.success({ text: 'Import Excel réussi !' });
        await fetchInventories();
    } catch (e) {
        // L'alerte d'erreur est déjà gérée dans le composable
    }
    input.value = '';
}

// Charger les données une fois le composant monté
onMounted(async () => {
    console.log('🚀 Chargement initial des inventaires...');
    await fetchInventories();
});

// Surveiller les changements dans le store
watch(inventories, (newInventories) => {
    console.log('📊 Inventaires mis à jour:', newInventories.length, 'éléments');
}, { deep: true });
</script>
