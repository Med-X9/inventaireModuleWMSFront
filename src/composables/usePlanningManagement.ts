/**
 * Composable pour la gestion du planning d'inventaire
 *
 * Utilise les paramètres DataTable pour les requêtes backend:
 * - start: Offset de pagination
 * - length: Taille de page
 * - order[0][column]: Index de colonne pour le tri
 * - order[0][dir]: Direction du tri (asc/desc)
 * - search[value]: Recherche globale
 * - draw: Compteur DataTable
 * - export: Format d'export (excel/csv)
 *
 * @example
 * // Utilisation basique
 * const { fetchStores, dataTableParams, setPagination, setSearch } = usePlanningManagement();
 *
 * // Charger les magasins avec pagination
 * await fetchStores(inventoryId);
 *
 * // Changer de page
 * setPagination(25, 25); // Page 2, 25 éléments
 *
 * // Rechercher
 * setSearch('magasin');
 *
 * // Trier
 * setSorting(0, 'asc');
 *
 * // Exporter
 * const exportParams = buildExportParams('excel');
 */
// src/composables/usePlanningManagement.ts
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { logger } from '@/services/loggerService';
import type { Store, PlanningAction, ViewModeType } from '@/interfaces/planningManagement';
import type { WarehouseStats } from '@/models/PlanningManagement';
import { useInventoryStore } from '@/stores/inventory';
import { useAppStore } from '@/stores';
import { useGenericDataTable } from './useInventoryDataTable';
import IconUser from '@/components/icon/icon-user.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';

// Types migrés depuis le composant Vue
interface Props {
    reference: string;
}

interface AdaptedAction {
    label: string;
    icon: any;
    onClick: (row: Record<string, unknown>) => void;
    color: 'primary' | 'secondary' | 'danger';
}

interface AdaptedGridAction {
    label: string;
    icon: any;
    handler: (item: any) => void;
    variant?: 'primary' | 'secondary';
}

interface ViewOption {
    value: 'table' | 'grid';
    icon: any;
}

interface InventoryData {
    id: number;
    reference: string;
    status: string;
}

export function usePlanningManagement() {
    const appStore = useAppStore();
    const inventoryStore = useInventoryStore();
    const router = useRouter();

    // Récupérer le statut d'inventaire depuis les paramètres de route ou un service
    const inventoryStatus = ref('EN REALISATION'); // Cette valeur devrait venir d'un service

    // Référence de l'inventaire (à passer depuis la vue)
    const inventoryReference = ref<string>('');

    // États pour la gestion de l'inventaire
    const inventoryId = ref<number | null>(null);
    const inventoryLoading = ref(false);
    const inventoryError = ref<string | null>(null);

    // viewMode dans Pinia (persisté en localStorage)
    const viewMode = computed<ViewModeType>({
        get: () => appStore.viewMode,
        set: (mode: ViewModeType) => appStore.setViewMode(mode),
    });

    const selectedStore = ref<Store | null>(null);

    // Initialiser le composable générique DataTable avec additionalParams
    const {
        data: planningData,
        loading,
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        refresh
    } = useGenericDataTable<Store>({
        store: inventoryStore,
        fetchAction: 'fetchPlanningManagement',
        defaultPageSize: 25,
        additionalParams: computed(() => inventoryId.value ? { id: inventoryId.value } : {})
    });

    const actions = computed<PlanningAction[]>(() => {
        const baseActions: PlanningAction[] = [];

        baseActions.push({
            label: 'Planifier',
            icon: IconCalendar,
            handler: (store: Store) => {
                router.push({
                    name: 'inventory-planning',
                    params: {
                        reference: inventoryReference.value || '',
                        warehouse: (store.reference as string) || ''
                    }
                });
            },
        });

        baseActions.push({
            label: inventoryStatus.value === 'EN REALISATION' ? 'Transférer' : 'Affecter',
            icon: IconUser,
            handler: (store: Store) => {
                router.push({
                    name: 'inventory-affecter',
                    params: {
                        reference: inventoryReference.value || '',
                        warehouse: (store.reference as string) || ''
                    }
                });
            },
        });

        return baseActions;
    });

    // Fonction pour récupérer l'ID de l'inventaire par sa référence
    const fetchInventoryIdByReference = async (reference: string): Promise<void> => {
        inventoryLoading.value = true;
        inventoryError.value = null;
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(reference);
            if (inventory) {
                inventoryId.value = inventory.id;
            } else {
                inventoryError.value = `Aucun inventaire trouvé avec la référence: ${reference}`;
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'inventaire', error);
            inventoryError.value = 'Erreur lors de la récupération de l\'inventaire';
        } finally {
            inventoryLoading.value = false;
        }
    };

    // Convertir les données en Stores
    const stores = computed(() => {
        const data = planningData.value || [];
        return data.map((item: any): Store => ({
            id: item.warehouse_id || item.id,
            store_name: item.warehouse_name || item.store_name,
            teams_count: item.teams_count || 0,
            jobs_count: item.jobs_count || 0,
            reference: item.warehouse_reference || item.reference
        }));
    });

    async function fetchStores(inventoryId: number): Promise<void> {
        // Utiliser le composable générique pour charger les données
        if (inventoryId) {
            await refresh();
        }
    }

    function selectStore(store: Store): void {
        selectedStore.value = store;
    }

    // Méthode pour mettre à jour le statut d'inventaire
    function setInventoryStatus(status: string): void {
        inventoryStatus.value = status;
    }

    // Méthode pour définir la référence de l'inventaire
    function setInventoryReference(reference: string): void {
        inventoryReference.value = reference;
    }

    // Adapter les colonnes pour supprimer les propriétés non reconnues
    const adaptedColumns = computed(() => [
        {
            field: 'store_name',
            headerName: 'Nom du magasin',
            sortable: true,
            width: 200,
            editable: false
        },
        {
            field: 'teams_count',
            headerName: 'Équipes',
            sortable: true,
            width: 100,
            editable: false
        },
        {
            field: 'jobs_count',
            headerName: 'Jobs',
            sortable: true,
            width: 100,
            editable: false
        },
        {
            field: 'reference',
            headerName: 'Référence',
            sortable: true,
            width: 150,
            editable: false
        }
    ]);

    // Adapter les actions pour DataTableNew
    const adaptedActions = computed<AdaptedAction[]>(() =>
        actions.value.map(action => ({
            label: action.label,
            icon: action.icon,
            onClick: (row: Record<string, unknown>) => action.handler(row as unknown as Store),
            color: 'primary' as const
        }))
    );

    // Adapter les actions pour GridView
    const adaptedGridActions = computed<AdaptedGridAction[]>(() =>
        actions.value.map(action => ({
            label: action.label,
            icon: action.icon,
            handler: (item: any) => action.handler(item),
            variant: 'primary' as const
        }))
    );

    // Adapter le handler pour GridView
    const adaptedHandleItemClick = (item: any): void => {
        // This function is not directly used in the new usePlanningManagement,
        // but keeping it for now as it might be used elsewhere or for future compatibility.
        // The actual item click handling is now part of the actions.
    };

    const adaptedHandleActionsClick = (item: any, e: MouseEvent): void => {
        // This function is not directly used in the new usePlanningManagement,
        // but keeping it for now as it might be used elsewhere or for future compatibility.
        // The actual actions click handling is now part of the actions.
    };

    // Fonction pour naviguer vers le détail de l'inventaire
    const goToInventoryDetail = (reference: string): void => {
        router.push({ name: 'inventory-detail', params: { reference } });
    };

    // Fonction pour naviguer vers l'affectation
    const goToAffectation = (reference: string): void => {
        router.push({
            name: 'inventory-affecter',
            params: { reference }
        });
    };

    return {
        // États du planning management
        stores,
        selectedStore,
        loading,
        inventoryStatus,
        inventoryReference,
        inventoryId,
        inventoryLoading,
        inventoryError,

        // Colonnes et actions
        actions,
        adaptedColumns,
        adaptedActions,
        adaptedGridActions,
        adaptedHandleItemClick,
        adaptedHandleActionsClick,

        // Fonctions
        fetchStores,
        selectStore,
        setInventoryStatus,
        setInventoryReference,
        fetchInventoryIdByReference,
        goToInventoryDetail,
        goToAffectation,

        // Handlers DataTable
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
    };
}
