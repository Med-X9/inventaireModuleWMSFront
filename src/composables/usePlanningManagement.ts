// src/composables/usePlanningManagement.ts
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { Store, PlanningAction, ViewModeType } from '@/interfaces/planningManagement';
import type { WarehouseStats } from '@/models/PlanningManagement';
import { useInventoryStore } from '@/stores/inventory';
import { useAppStore } from '@/stores';
import IconUser from '@/components/icon/icon-user.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';

export function usePlanningManagement() {
    const appStore = useAppStore();
    const inventoryStore = useInventoryStore();
    const router = useRouter();
    const route = useRoute();

    // Récupérer le statut d'inventaire depuis les paramètres de route ou un service
    const inventoryStatus = ref('En préparation'); // Cette valeur devrait venir d'un service

    // Référence de l'inventaire (à passer depuis la vue)
    const inventoryReference = ref<string>('');

    // viewMode dans Pinia (persisté en localStorage)
    const viewMode = computed<ViewModeType>({
        get: () => appStore.viewMode,
        set: (mode: ViewModeType) => appStore.setViewMode(mode),
    });

    const selectedStore = ref<Store | null>(null);
    const stores = ref<Store[]>([]);
    const loading = computed(() => inventoryStore.isLoading);

    const columns = [
        { headerName: 'Nom du magasin', field: 'store_name', sortable: true, filter: 'agTextColumnFilter' },
        { headerName: 'Équipes', field: 'teams_count', sortable: true, filter: 'agNumberColumnFilter', },
        { headerName: 'Jobs', field: 'jobs_count', sortable: true, filter: 'agNumberColumnFilter', },
    ];

    const actions = computed<PlanningAction[]>(() => {
        const baseActions: PlanningAction[] = [];

        if (inventoryStatus.value !== 'EN REALISATION') {
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
        }

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

    async function fetchStores(inventoryId: number) {
        try {
            const planningData = await inventoryStore.fetchPlanningManagement(inventoryId);

            // Convertir les WarehouseStats en Store pour la compatibilité
            stores.value = planningData.data.map((warehouse: WarehouseStats): Store => ({
                id: warehouse.warehouse_id,
                store_name: warehouse.warehouse_name,
                teams_count: warehouse.teams_count,
                jobs_count: warehouse.jobs_count,
                reference: warehouse.warehouse_reference
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des magasins:', error);
            throw error;
        }
    }

    function selectStore(store: Store) {
        selectedStore.value = store;
    }

    // Méthode pour mettre à jour le statut d'inventaire
    function setInventoryStatus(status: string) {
        inventoryStatus.value = status;
    }

    // Méthode pour définir la référence de l'inventaire
    function setInventoryReference(reference: string) {
        inventoryReference.value = reference;
    }

    return {
        viewMode,
        selectedStore,
        stores,
        loading,
        columns,
        actions,
        inventoryStatus,
        inventoryReference,
        fetchStores,
        selectStore,
        setInventoryStatus,
        setInventoryReference,
    };
}
