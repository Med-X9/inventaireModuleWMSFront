import { ref, markRaw, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { InventoryTable } from '@/models/Inventory'
import type { DataTableColumn, ActionConfig } from '@/interfaces/dataTable'
import { inventoryManagementService } from '../services/inventoryManagementService'
import { alertService } from '@/services/alertService'
import { useInventoryStore } from '@/stores/inventory'

import IconEdit from '@/components/icon/icon-edit.vue'
import IconTrashLines from '@/components/icon/icon-trash-lines.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconSquareCheck from '@/components/icon/icon-square-check.vue'
import IconUpload from '@/components/icon/icon-upload.vue'

export function useInventoryManagement() {
    const router = useRouter()
    const inventoryStore = useInventoryStore();

    // ✅ Utilise un computed pour surveiller le store
    const inventories = computed(() => inventoryStore.inventories);
    const loading = inventoryStore.isLoading;

    // Charger les inventaires via store avec paramètres
    const fetchInventories = async (params?: {
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>;
        filter?: Record<string, { filter: string }>;
        page?: number;
        pageSize?: number;
    }) => {
        try {
            await inventoryStore.fetchInventories(params);
        } catch (err) {
            console.error('Erreur chargement inventaires:', err);
        }
    };

    const columns: DataTableColumn<InventoryTable>[] = [
        { headerName: 'ID', field: 'id', sortable: true, filter: 'agNumberColumnFilter', description: 'Identifiant' },
        { headerName: 'Référence', field: 'reference', sortable: true, filter: 'agTextColumnFilter', description: 'Référence unique' },
        { headerName: 'Libellé', field: 'label', sortable: true, filter: 'agTextColumnFilter', description: 'Libellé' },
        { headerName: 'Date', field: 'date', sortable: true, filter: 'agDateColumnFilter', description: 'Date inventaire' },
        {
            headerName: 'Status',
            field: 'status',
            sortable: true,
            filter: 'agTextColumnFilter',
            description: 'État',
            cellRenderer: (params: any) => {
                let status = params.value;
                // Mettre en majuscules et supprimer les accents/diacritiques
                let badgeClass = '';

                switch(status) {
                    case 'EN PREPARATION':
                        badgeClass = 'bg-blue-100 text-blue-800';
                        break;
                    case 'EN REALISATION':
                        badgeClass = 'bg-yellow-100 text-yellow-800';
                        break;
                    case 'TERMINE':
                        badgeClass = 'bg-green-100 text-green-800';
                        break;
                    case 'CLOTURE':
                        badgeClass = 'bg-gray-100 text-gray-800';
                        break;
                    default:
                        badgeClass = 'bg-gray-100 text-gray-800';
                }

                return `<span class="px-2 py-1 text-xs font-medium rounded-full ${badgeClass}">${status}</span>`;
            }
        },
        { headerName: 'Type', field: 'inventory_type', sortable: true, filter: 'agTextColumnFilter', description: 'Type' },
        { headerName: 'Date préparation', field: 'en_preparation_status_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date passage en préparation' },
        { headerName: 'Date réalisation', field: 'en_realisation_status_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date passage en réalisation' },
        { headerName: 'Date terminé', field: 'termine_status_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date passage terminé' },
        { headerName: 'Date clôture', field: 'cloture_status_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date passage clôturé' },
        { headerName: 'Compte', field: 'account_name', sortable: true, filter: 'agTextColumnFilter', description: 'Compte' },
        // Tu peux ajouter warehouse, comptages, etc. selon besoin
    ]

    const handleDelete = async (inv: InventoryTable) => {
        try {
            const r = await alertService.confirm({
                title: 'Confirmation',
                text: 'Supprimer cet inventaire ?'
            })
            if (r.isConfirmed) {
                if (typeof inv.id === 'number') {
                    await inventoryManagementService.deleteInventory(inv.id)
                    await alertService.success({ text: "Supprimé avec succès" })
                    await fetchInventories()
                } else {
                    await alertService.error({ text: "ID d'inventaire invalide" })
                }
            }
        } catch {
            await alertService.error({ text: "Erreur lors de la suppression" })
        }
    }

    const actions: ActionConfig<InventoryTable>[] = [
        {
            label: 'Détail',
            icon: markRaw(IconEye),
            class: 'flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 text-md',
            handler: inv => { void router.push({ name: 'inventory-detail', params: { id: inv.id } }) },
            visible: () => true,
        },
        {
            label: 'Importer stock',
            icon: markRaw(IconUpload),
            class: 'flex items-center gap-1 px-2 py-1 text-purple-600 hover:text-purple-800 text-md',
            handler: inv => { void router.push({ name: 'stock-import', params: { id: inv.id } }) },
            visible: inv => inv.status === 'EN PREPARATION',
        },
        {
            label: inv => inv.status === 'EN REALISATION' ? 'Transférer' : 'Préparer',
            icon: markRaw(IconCalendar),
            class: 'flex items-center gap-1 px-2 py-1 text-orange-600 hover:text-orange-800 text-md',
            handler: inv => { void router.push({ name: 'planning-management', params: { id: inv.id } }) },
            visible: inv => ['EN PREPARATION', 'EN REALISATION'].includes(inv.status),
        },
        {
            label: 'Modifier',
            icon: markRaw(IconEdit),
            class: 'flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-800 text-md',
            handler: inv => { void router.push({ name: 'inventory-edit', params: { id: inv.id } }) },
            visible: inv => inv.status === 'EN PREPARATION',
        },
        {
            label: 'Résultats',
            icon: markRaw(IconSquareCheck),
            class: 'flex items-center gap-1 px-2 py-1 text-emerald-600 hover:text-emerald-800 text-md',
            handler: inv => { void router.push({ name: 'inventory-results', params: { reference: inv.reference } }) },
            visible: inv => ['EN REALISATION', 'TERMINE', 'CLOTURE'].includes(inv.status),
        },
        {
            label: 'Supprimer',
            icon: markRaw(IconTrashLines),
            class: 'flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 text-md',
            handler: handleDelete,
            visible: inv => inv.status === 'EN PREPARATION',
        },
    ]

    const redirectToAdd = () => { void router.push({ name: 'inventory-create' }) }

    return {
        inventories,
        loading,
        columns,
        actions,
        redirectToAdd,
        fetchInventories,
    }
}
