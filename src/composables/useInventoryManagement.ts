import { ref, markRaw, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { InventoryTable } from '@/models/Inventory'
import type { DataTableColumn, ActionConfig } from '@/types/dataTable'
import { alertService } from '@/services/alertService'
import { useInventoryStore } from '@/stores/inventory'
import { useGenericDataTable } from '@/composables/useGenericDataTable'
import type { DataTableParams } from '@/composables/useDataTableFilters'

// Import des icônes pour les actions
import IconEye from '@/components/icon/icon-eye.vue'
import IconEdit from '@/components/icon/icon-edit.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import IconUpload from '@/components/icon/icon-upload.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconCheck from '@/components/icon/icon-check.vue'

export function useInventoryManagement() {
    const router = useRouter()
    const inventoryStore = useInventoryStore()

    // Fonction de fetch spécifique pour les inventaires
    const fetchInventories = async (params: DataTableParams): Promise<InventoryTable[]> => {
        await inventoryStore.fetchInventories(params)
        return inventoryStore.inventories
    }

    // Utiliser le composable générique
    const dataTable = useGenericDataTable(fetchInventories, {
        initialPageSize: 10,
        initialPage: 1
    })

    // ✅ Utilise un computed pour surveiller le store
    const inventories = computed(() => inventoryStore.inventories)
    const loading = computed(() => inventoryStore.isLoading)

    // États pour la pagination côté serveur - utiliser les valeurs du store
    const currentPage = computed(() => inventoryStore.currentPage)
    const totalPages = computed(() => inventoryStore.totalPages)
    const totalItems = computed(() => inventoryStore.totalItems)

    const columns: DataTableColumn<InventoryTable>[] = [
        {
            headerName: 'ID',
            field: 'id',
            sortable: true,
            dataType: 'number',
            filterable: true,
            width: 80,
            hide: true,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-info',
            description: 'Identifiant'
        },
        {
            headerName: 'Référence',
            field: 'reference',
            sortable: true,
            dataType: 'text',
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            hide: true,
            icon: 'icon-search',
            description: 'Référence unique'
        },
        {
            headerName: 'Libellé',
            field: 'label',
            sortable: true,
            dataType: 'text',
            filterable: true,
            width: 200,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-edit',
            description: 'Libellé'
        },
        {
            headerName: 'Date',
            field: 'date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 100,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-calendar',
            description: 'Date inventaire'
        },
        {
            headerName: 'Statut',
            field: 'status',
            badgeStyles: [
                {
                    value: 'EN PREPARATION',
                    class: 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset'
                },
                {
                    value: 'EN REALISATION',
                    class: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset'
                },
                {
                    value: 'TERMINE',
                    class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset'
                },
                {
                    value: 'CLOTURE',
                    class: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
                }
            ],
            badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
            sortable: true,
            dataType: 'select',
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-check',
            description: 'État',
            filterConfig: {
                dataType: 'select',
                operator: 'equals',
                options: [
                    { label: 'EN PREPARATION', value: 'EN PREPARATION' },
                    { label: 'EN REALISATION', value: 'EN REALISATION' },
                    { label: 'TERMINE', value: 'TERMINE' },
                    { label: 'CLOTURE', value: 'CLOTURE' }
                ]
            },

        },
        {
            headerName: 'Type',
            field: 'inventory_type',
            sortable: true,
            dataType: 'text',
            filterable: true,
            width: 90,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-settings',
            description: 'Type'
        },
        {
            headerName: 'Date préparation',
            field: 'en_preparation_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage en préparation'
        },
        {
            headerName: 'Date réalisation',
            field: 'en_realisation_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage en réalisation'
        },
        {
            headerName: 'Date terminé',
            field: 'termine_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage terminé'
        },
        {
            headerName: 'Date clôture',
            field: 'cloture_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage clôturé'
        },
        {
            headerName: 'Compte',
            field: 'account_name',
            sortable: true,
            dataType: 'text',
            filterable: true,
            width: 100,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-user',
            description: 'Compte'
        },
    ]

    const handleDelete = async (inv: InventoryTable) => {
        try {
            const r = await alertService.confirm({
                title: 'Confirmation',
                text: 'Supprimer cet inventaire ?'
            })
            if (r.isConfirmed) {
                if (typeof inv.id === 'number') {
                    await inventoryStore.deleteInventory(inv.id)
                    await alertService.success({ text: "Supprimé avec succès" })
                    await dataTable.refresh() // Reset pagination after deletion
                } else {
                    await alertService.error({ text: "ID d'inventaire invalide" })
                }
            }
        } catch {
            await alertService.error({ text: "Erreur lors de la suppression" })
        }
    }

    const fileInputRefs = ref<Record<number, HTMLInputElement | null>>({});

    // Action d'import Excel par ligne
    const handleImportExcel = async (inv: InventoryTable) => {
        // Crée dynamiquement un input file si besoin
        if (!fileInputRefs.value[inv.id]) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            input.style.display = 'none';
            input.addEventListener('change', async (event: Event) => {
                const target = event.target as HTMLInputElement;
                if (!target.files || target.files.length === 0) return;
                const file = target.files[0];
                const formData = new FormData();
                formData.append('file', file);
                try {
                    await importStockImage(inv.id, formData);
                    await alertService.success({ text: 'Import Excel réussi !' });
                    await dataTable.refresh(); // Reset pagination after import
                } catch (e) {
                    // L'alerte d'erreur est déjà gérée
                }
                target.value = '';
            });
            document.body.appendChild(input);
            fileInputRefs.value[inv.id] = input;
        }
        fileInputRefs.value[inv.id]?.click();
    };

    const actions: ActionConfig<InventoryTable>[] = [
        {
            label: 'Détail',
            icon: markRaw(IconEye),
            color: 'primary',
            onClick: inv => { void router.push({ name: 'inventory-detail', params: { reference: inv.reference } }) },
            show: () => true,
        },
        {
            label: 'Importer image de stock',
            icon: markRaw(IconUpload),
            color: 'secondary',
            onClick: handleImportExcel,
            show: inv => inv.status === 'EN PREPARATION',
        },
        {
            label: inv => inv.status === 'EN REALISATION' ? 'Transférer' : 'Préparer',
            icon: markRaw(IconCalendar),
            color: 'warning',
            onClick: inv => { void router.push({ name: 'planning-management', params: { reference: inv.reference } }) },
            show: inv => ['EN PREPARATION', 'EN REALISATION'].includes(inv.status),
        },
        {
            label: 'Modifier',
            icon: markRaw(IconEdit),
            color: 'success',
            onClick: inv => { void router.push({ name: 'inventory-edit', params: { reference: inv.reference } }) },
            show: inv => inv.status === 'EN PREPARATION',
        },
        {
            label: 'Résultats',
            icon: markRaw(IconCheck),
            color: 'info',
            onClick: inv => { void router.push({ name: 'inventory-results', params: { reference: inv.reference } }) },
            show: inv => ['EN REALISATION', 'TERMINE', 'CLOTURE'].includes(inv.status),
        },
        {
            label: 'Supprimer',
            icon: markRaw(IconTrash),
            color: 'danger',
            onClick: handleDelete,
            show: inv => inv.status === 'EN PREPARATION',
        },
    ]

    const redirectToAdd = () => { void router.push({ name: 'inventory-create' }) }

    // --- Import d'image de stock (Excel) via le store Pinia ---
    const importStockImage = async (id: number, formData: FormData) => {
        try {
            return await inventoryStore.importStockImage(id, formData);
        } catch (error) {
            await alertService.error({
                title: 'Erreur import',
                text: 'Erreur lors de l\'import du fichier Excel.'
            });
            throw error;
        }
    };

    // Nouvelle fonction pour gestion modale/loader/erreur
    const importStockImageWithModal = async (id: number, formData: FormData, { onStart, onSuccess, onError }: { onStart?: () => void, onSuccess?: () => void, onError?: (msg: string) => void }) => {
        try {
            onStart && onStart();
            await inventoryStore.importStockImage(id, formData);
            onSuccess && onSuccess();
        } catch (error) {
            let message = "Erreur lors de l'import.";
            const e = error as any;
            if (e && e.response && e.response.data) {
                if (typeof e.response.data === 'string') message = e.response.data;
                else if (e.response.data.message) message = e.response.data.message;
                else if (e.response.data.detail) message = e.response.data.detail;
                else message = JSON.stringify(e.response.data, null, 2);
            } else if (e && e.message) {
                message = e.message;
            }
            onError && onError(message);
        }
    };

    return {
        inventories,
        loading,
        columns,
        actions,
        redirectToAdd,
        dataTable,
        importStockImage,
        importStockImageWithModal,
        alertService,
        currentPage,
        totalPages,
        totalItems,
    }
}
