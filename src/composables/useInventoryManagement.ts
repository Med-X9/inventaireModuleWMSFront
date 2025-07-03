import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import type { InventoryManagement, InventoryAction } from '../interfaces/inventoryManagement';
import type { DataTableColumn } from '@/interfaces/dataTable';
import { alertService } from '@/services/alertService';

import IconEdit from '@/components/icon/icon-edit.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconSquareCheck from '@/components/icon/icon-square-check.vue';

export function useInventoryManagement() {
    const router = useRouter();
    const inventoryStore = useInventoryStore();

    // Utilisation des données du store
    const inventories = computed(() => inventoryStore.inventories);
    const loading = computed(() => inventoryStore.loading);

    const columns: DataTableColumn[] = [
        { headerName: 'Référence', field: 'reference', sortable: true, filter: 'agTextColumnFilter', description: 'Référence unique', editable: false },
        { headerName: 'Libellé', field: 'label', sortable: true, filter: 'agTextColumnFilter', description: 'Libellé', editable: false },
        { headerName: 'Type', field: 'inventory_type', sortable: true, filter: 'agTextColumnFilter', description: 'Type', editable: true },
        {
            headerName: 'Statut',
            field: 'status',
            sortable: true,
            filter: 'agTextColumnFilter',
            description: 'État',
            cellRenderer: params => {
                const val = (params.value || '').toString();
                const s = val.toLowerCase();
                let cls = '';
                switch (s) {
                    case 'EN PREPARATION': cls = 'bg-warning-light text-warning'; break;
                    case 'EN REALISATION': cls = 'bg-info-light text-info'; break;
                    case 'TERMINE': cls = 'bg-success-light text-success'; break;
                    case 'CLOTURE': cls = 'bg-secondary-light text-secondary'; break;
                    default: cls = 'bg-secondary-light text-secondary';
                }
                return `<span class="${cls} px-3 py-1 rounded-full">${val}</span>`;
            }
        },
        { headerName: "Date d'inventaire", field: 'date', sortable: true, filter: 'agDateColumnFilter', description: "Date d'inventaire" },
        { headerName: 'Date de création', field: 'created_at', sortable: true, filter: 'agDateColumnFilter', description: 'Date de création' },
        { headerName: 'Date de lancement', field: 'en_realisation_status_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date de lancement' },
        { headerName: "Date de fin", field: 'termine_status_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date de fin' },
        { headerName: 'Date de clôture', field: 'cloture_status_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date de clôture' },
    ];


    const fetchInventories = async () => {
        await inventoryStore.fetchInventories();
    };

    const handleDelete = async (inv: InventoryManagement) => {
        try {
            const r = await alertService.confirm({
                title: 'Confirmation',
                text: 'Supprimer cet inventaire ?'
            });
            if (r.isConfirmed) {
                await inventoryStore.deleteInventory(inv.id);
                await alertService.success({ text: "Supprimé avec succès" });
                await fetchInventories();
            }
        } catch {
            await alertService.error({ text: "Erreur lors de la suppression" });
        }
    };

    const actions = [
        {
            label: 'Détail',
            icon: IconEye,
            class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
            handler: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; void router.push({ name: 'inventory-detail', params: { id: inv.id } }); },
            showWhen: () => true,
        },
        {
            label: 'Importer stock',
            icon: IconSquareCheck,
            class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
            handler: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; void router.push({ name: 'stock-import', params: { id: inv.id } }); },
            showWhen: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; return inv.statut === 'En préparation'; },
        },
        {
            label: (row: Record<string, unknown>) => {
                const inv = row as unknown as InventoryManagement;
                return inv.statut === 'En réalisation' ? 'Transférer' : 'Préparer';
            },
            icon: IconCalendar,
            class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
            handler: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; void router.push({ name: 'planning-management', params: { id: inv.id } }); },
            showWhen: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; return ['En préparation', 'En réalisation'].includes(inv.statut); },
        },
        {
            label: 'Modifier',
            icon: IconEdit,
            class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
            handler: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; void router.push({ name: 'inventory-edit', params: { id: inv.id } }); },
            showWhen: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; return inv.statut === 'En préparation'; },
        },
        {
            label: 'Résultats',
            icon: IconSquareCheck,
            class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
            handler: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; void router.push({ name: 'inventory-results', params: { reference: inv.reference } }); },
            showWhen: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; return ['En réalisation', 'Terminé', 'Clôturé'].includes(inv.statut); },
        },
        {
            label: 'Supprimer',
            icon: IconTrashLines,
            class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
            handler: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; handleDelete(inv); },
            showWhen: (row: Record<string, unknown>) => { const inv = row as unknown as InventoryManagement; return inv.statut === 'En préparation'; },
        },
    ];

    const redirectToAdd = () => { void router.push({ name: 'inventory-create' }); };

    return {
        inventories,
        loading,
        columns,
        actions,
        redirectToAdd,
        fetchInventories,
    };
}
