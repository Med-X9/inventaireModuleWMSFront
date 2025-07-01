<template>
    <div class="datatable panel py-7">

        <DataTable :columns="columns" :rowDataProp="inventories" :actions="actions" :pagination="true"
            :enableRowSelection="true" :enableFiltering="true" storageKey="inventory_management_table" inlineEditing>
            <template #table-actions>
                <div class="flex items-center flex-wrap gap-2">
                    <button class=" btn btn-primary p-2 px-4 mb-4 btn-sm " @click="redirectToAdd">
                        <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2 " />
                        Créer
                    </button>

                </div>
            </template>
        </DataTable>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import { useInventory } from '@/composables/useInventory';
import IconPlus from '@/components/icon/icon-plus.vue';
import type { ColDef } from 'ag-grid-community';
import type { ActionConfig } from '@/interfaces/dataTable';

export default defineComponent({
    name: 'InventoryManagement',
    components: { DataTable, IconPlus },

    setup() {
        const router = useRouter();
        const {
            inventories,
            isLoading,
            error,
            fetchInventories,
            deleteInventory
        } = useInventory();

        // Debug: Afficher les données dans la console
        console.log('🔍 Debug InventoryManagement - État initial:', {
            inventories: inventories.value,
            isLoading: isLoading.value,
            error: error.value
        });

        // Watcher pour surveiller les changements de données
        watch(inventories, (newInventories) => {
            console.log('📊 Inventaires mis à jour dans le composant:', newInventories);
            console.log('📈 Nombre d\'inventaires:', newInventories?.length || 0);
        }, { immediate: true });

        // Configuration des colonnes
        const columns: ColDef[] = [
            {
                field: 'id',
                headerName: 'ID',
                width: 80,
                sortable: true,
                filter: true
            },
            {
                field: 'label',
                headerName: 'Libellé',
                width: 200,
                sortable: true,
                filter: true
            },
            {
                field: 'date',
                headerName: 'Date',
                width: 120,
                sortable: true,
                filter: true,
                valueFormatter: (params) => {
                    return new Date(params.value).toLocaleDateString('fr-FR');
                }
            },
            {
                field: 'status',
                headerName: 'Statut',
                width: 150,
                sortable: true,
                filter: true,
                cellRenderer: (params: any) => {
                    const status = params.value;
                    const statusClasses = {
                        'EN PREPARATION': 'bg-yellow-100 text-yellow-800',
                        'EN REALISATION': 'bg-blue-100 text-blue-800',
                        'TERMINE': 'bg-green-100 text-green-800',
                        'CLOTURE': 'bg-gray-100 text-gray-800'
                    };
                    const className = statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
                    return `<span class="px-2 py-1 rounded-full text-xs font-medium ${className}">${status}</span>`;
                }
            },
            {
                field: 'account_name',
                headerName: 'Compte',
                width: 150,
                sortable: true,
                filter: true
            },
            {
                field: 'warehouse',
                headerName: 'Entrepôts',
                width: 200,
                sortable: false,
                filter: false,
                valueFormatter: (params) => {
                    if (Array.isArray(params.value)) {
                        return params.value.map((w: any) => w.warehouse_name || w.name).join(', ');
                    }
                    return params.value;
                }
            },
            {
                field: 'comptages',
                headerName: 'Comptages',
                width: 100,
                sortable: false,
                filter: false,
                valueFormatter: (params) => {
                    return Array.isArray(params.value) ? params.value.length : 0;
                }
            }
        ];

        // Configuration des actions
        const actions: ActionConfig[] = [
            {
                label: 'Voir',
                icon: 'eye',
                handler: (row: any) => {
                    router.push(`/inventory/${row.id}`);
                },
                class: 'btn-info btn-sm'
            },
            {
                label: 'Modifier',
                icon: 'edit',
                handler: (row: any) => {
                    router.push(`/inventory/${row.id}/edit`);
                },
                class: 'btn-warning btn-sm'
            },
            {
                label: 'Supprimer',
                icon: 'trash',
                handler: async (row: any) => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cet inventaire ?')) {
                        await deleteInventory(row.id);
                        await fetchInventories(); // Recharger les données
                    }
                },
                class: 'btn-danger btn-sm'
            }
        ];

        // Navigation
        const redirectToAdd = () => {
            router.push('/inventory/create');
        };

        // Charger les données au montage
        onMounted(async () => {
            console.log('🚀 Composant monté - Chargement des données...');
            try {
                await fetchInventories();
                console.log('✅ Données chargées avec succès');
                console.log('📊 Données finales pour DataTable:', inventories.value);
            } catch (err) {
                console.error('❌ Erreur lors du chargement:', err);
            }
        });

        return {
            inventories,
            isLoading,
            error,
            columns,
            actions,
            redirectToAdd
        };
    }
});
</script>
