import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import { useResourceStore } from '@/stores/resource';
import { useAppStore } from '@/stores';
import { alertService } from '@/services/alertService';
import type { ViewModeType } from '@/interfaces/planningManagement';
import { generatePDF } from '@/utils/pdfGenerator';

export function useInventoryDetail(inventoryReference: string) {
    const router = useRouter();
    const appStore = useAppStore();
    const inventoryStore = useInventoryStore();
    const resourceStore = useResourceStore();

    // Récupérer l'ID de l'inventaire à partir de la référence
    const inventoryId = ref<number | null>(null);
    const inventoryLoading = ref(false);
    const inventoryError = ref<string | null>(null);

    // Fonction pour récupérer l'ID de l'inventaire par sa référence
    const fetchInventoryIdByReference = async (reference: string) => {
        inventoryLoading.value = true;
        inventoryError.value = null;

        try {
            // Charger la liste des inventaires pour trouver celui avec la bonne référence
            await inventoryStore.fetchInventories();
            const inventory = inventoryStore.inventories.find(inv => inv.reference === reference);

            if (inventory) {
                inventoryId.value = inventory.id;
            } else {
                inventoryError.value = `Aucun inventaire trouvé avec la référence: ${reference}`;
            }
        } catch (error) {
            inventoryError.value = 'Erreur lors de la récupération de l\'inventaire';
        } finally {
            inventoryLoading.value = false;
        }
    };

    const currentTab = computed<string>({
        get: () => appStore.inventoryCurrentTab,
        set: (tab: string) => appStore.setInventoryCurrentTab(tab)
    });

    const viewMode = computed<ViewModeType>({
        get: () => appStore.inventoryViewMode,
        set: (mode: ViewModeType) => appStore.setInventoryViewMode(mode)
    });

    // Utiliser les données du store
    const inventory = computed(() => inventoryStore.getCurrentInventoryDetail);
    const loading = computed(() => inventoryStore.isLoading);
    const error = computed(() => inventoryStore.getError);

    // Données des ressources
    const resources = computed(() => inventory.value?.ressources || []);
    const resourcesLoading = computed(() => resourceStore.isLoading);
    const resourcesError = computed(() => resourceStore.getError);

    const tabs = [
        { id: 'general', label: 'Informations générales' },
        { id: 'comptage1', label: 'Premier comptage' },
        { id: 'comptage2', label: 'Deuxième comptage' },
        { id: 'comptage3', label: 'Troisième comptage' },
    ];

    const jobColumns = [
        { headerName: 'Nom', field: 'name', sortable: true },
        {
            headerName: 'Statut',
            field: 'status',
            sortable: true,
            cellRenderer: (params: any) => {
                const statusClass = getStatusClass(params.data.status);
                return `<span class="px-3 py-1 rounded-full text-sm ${statusClass}">${params.data.status}</span>`;
            }
        },
        { headerName: 'Date', field: 'date', sortable: true },
        {
            headerName: 'Opérateur',
            field: 'operator',
            sortable: true,
            cellRenderer: (params: any) => {
                return params.data.status.toLowerCase() === 'terminé' ? params.data.operator : '';
            }
        }
    ];

    // Formatage des données pour GridView - Équipes
    const teamsGridData = computed(() => {
        return inventory.value?.equipe?.map(team => ({
            id: team.id,
            name: team.user.username,
            initial: team.user.username ? team.user.username.charAt(0) : '?',
            type: 'Équipe'
        })) || [];
    });

    // Formatage des données pour GridView - Magasins
    const magasinsGridData = computed(() => {
        return inventory.value?.magasins?.map((magasin, index) => ({
            id: index + 1,
            name: magasin.nom,
            type: 'Magasin',
            status: 'Actif',
            date: magasin.date
        })) || [];
    });

    // Formatage des données pour GridView - Ressources
    const resourcesGridData = computed(() => {
        return resources.value.map(resource => ({
            id: resource.id,
            name: resource.ressource_nom,
            reference: resource.reference,
            quantity: resource.quantity,
            type: 'Ressource'
        }));
    });

    // Actions pour les équipes
    const handleViewTeamDetails = (item: any) => {
        // Voir détails équipe
    };

    const teamActions = computed(() => [
        {
            label: 'Voir détails',
            handler: handleViewTeamDetails,
            variant: 'primary' as const
        }
    ]);

    // Actions pour les magasins
    const handleConfigureStore = (item: any) => {
        // Configurer magasin
    };

    const storeActions = computed(() => [
        {
            label: 'Configurer',
            handler: handleConfigureStore,
            variant: 'primary' as const
        }
    ]);

    // Actions pour les ressources
    const handleEditResourceQuantity = (item: any) => {
        // Modifier quantité ressource
    };

    const resourceActions = computed(() => [
        {
            label: 'Modifier quantité',
            handler: handleEditResourceQuantity,
            variant: 'primary' as const
        },
        {
            label: 'Retirer',
            handler: async (item: any) => {
                if (!inventoryId.value) {
                    console.error('ID d\'inventaire non disponible');
                    return;
                }

                try {
                    const confirmed = await alertService.confirm({
                        title: 'Retirer la ressource',
                        text: `Voulez-vous vraiment retirer la ressource "${item.name}" de cet inventaire ?`
                    });

                    if (confirmed.isConfirmed) {
                        await resourceStore.removeResourceFromInventory(inventoryId.value, item.id);
                        // Recharger les données de l'inventaire
                        await loadDetailData();
                    }
                } catch (error) {
                    console.error('Erreur lors du retrait de la ressource:', error);
                }
            },
            variant: 'danger' as const
        }
    ]);

    const getStatusClass = (status: string | undefined): string => {
        if (!status) return 'bg-secondary';

        switch (status) {
            case 'EN PREPARATION': return 'bg-warning-light text-warning';
            case 'EN REALISATION': return 'bg-info-light text-info';
            case 'TERMINEE': return 'bg-success-light text-success';
            case 'CLOTUREE': return 'bg-secondary-light text-secondary';
            default: return 'bg-secondary-light text-secondary';
        }
    };

    // Données de jobs statiques pour l'instant
    const jobsData = {
        comptage1: [
            { name: 'Préparation zone', status: 'Terminé', date: '2025-12-20', operator: 'Jean D.' },
            { name: 'Scan emplacements', status: 'En cours', date: '2025-12-20', operator: 'Marie L.' },
            { name: 'Vérification', status: 'En attente', date: '2025-12-20', operator: 'Pierre M.' }
        ],
        comptage2: [
            { name: 'Scan articles', status: 'En attente', date: '2025-12-21', operator: 'Sophie R.' },
            { name: 'Contrôle quantités', status: 'En attente', date: '2025-12-21', operator: 'Luc B.' }
        ],
        comptage3: [
            { name: 'Validation finale', status: 'En attente', date: '2025-12-22', operator: 'Anne C.' }
        ]
    };

    const getJobsForTab = (tabId: string) => {
        return jobsData[tabId as keyof typeof jobsData] || [];
    };

    const getCompletedJobsCount = (tabId: string) => {
        return getJobsForTab(tabId).filter(job => job.status.toLowerCase() === 'TERMINE').length;
    };

    const getInProgressJobsCount = (tabId: string) => {
        return getJobsForTab(tabId).filter(job => job.status.toLowerCase() === 'EN REALISATION').length;
    };

    const getRemainingJobsCount = (tabId: string) => {
        return getJobsForTab(tabId).filter(job => job.status.toLowerCase() === 'EN PREPARATION').length;
    };

    const getTotalJobsCount = (tabId: string) => {
        return getJobsForTab(tabId).length;
    };

    // Fonctions pour les ressources
    const assignResourceToInventory = async (resources: Array<{ resource_id: number; quantity: number }>) => {
        console.log(resources);
        if (!inventoryId.value) {
            console.error('ID d\'inventaire non disponible');
            return null;
        }

        try {
            const result = await resourceStore.assignResourceToInventory(inventoryId.value, resources);
            if (result) {
                // Recharger les données de l'inventaire pour avoir les ressources mises à jour
                await loadDetailData();
            }
            return result;
        } catch (error) {
            console.error('Erreur lors de l\'assignation de la ressource:', error);
            return null;
        }
    };

    const updateResourceQuantity = async (resourceId: number, quantity: number) => {
        if (!inventoryId.value) {
            console.error('ID d\'inventaire non disponible');
            return null;
        }

        try {
            const result = await resourceStore.updateAssignedResourceQuantity(inventoryId.value, resourceId, quantity);
            if (result) {
                // Recharger les données de l'inventaire
                await loadDetailData();
            }
            return result;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la quantité:', error);
            return null;
        }
    };

    const removeResourceFromInventory = async (resourceId: number) => {
        if (!inventoryId.value) {
            console.error('ID d\'inventaire non disponible');
            return false;
        }

        try {
            const result = await resourceStore.removeResourceFromInventory(inventoryId.value, resourceId);
            if (result) {
                // Recharger les données de l'inventaire
                await loadDetailData();
            }
            return result;
        } catch (error) {
            console.error('Erreur lors du retrait de la ressource:', error);
            return false;
        }
    };

    const getAvailableResources = async () => {
        try {
            return await resourceStore.fetchAvailableResources();
        } catch (error) {
            console.error('Erreur lors de la récupération des ressources disponibles:', error);
            return [];
        }
    };

    const launchInventory = async () => {
        if (!inventory.value) return false;

        try {
            const result = await alertService.confirm({
                title: 'Lancer l\'inventaire',
                text: `Voulez-vous vraiment lancer l'inventaire "${inventory.value.label}" ?`
            });

            if (result.isConfirmed) {
                // TODO: Implémenter l'appel API pour lancer l'inventaire
                await alertService.success({
                    text: 'L\'inventaire a été lancé avec succès'
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur lors du lancement:', error);
            await alertService.error({
                text: 'Une erreur est survenue lors du lancement de l\'inventaire'
            });
            return false;
        }
    };

    const editInventory = () => {
        router.push({ name: 'inventory-edit', params: { reference: inventoryReference } });
    };

    const cancelInventory = async () => {
        try {
            const result = await alertService.confirm({
                title: 'Annuler l\'inventaire',
                text: 'Êtes-vous sûr de vouloir annuler le lancement de l\'inventaire ?'
            });

            if (result.isConfirmed) {
                // TODO: Implémenter l'appel API pour annuler l'inventaire
                await alertService.success({
                    text: 'L\'inventaire a été annulé'
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur lors de l\'annulation:', error);
            await alertService.error({
                text: 'Une erreur est survenue lors de l\'annulation'
            });
            return false;
        }
    };

    const terminateInventory = async () => {
        if (!inventory.value) return false;

        try {
            const result = await alertService.confirm({
                title: 'Terminer l\'inventaire',
                text: `Voulez-vous vraiment terminer l'inventaire "${inventory.value.label}" ?`
            });

            if (result.isConfirmed) {
                // TODO: Implémenter l'appel API pour terminer l'inventaire
                await alertService.success({
                    text: 'L\'inventaire a été terminé avec succès'
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur lors de la terminaison:', error);
            await alertService.error({
                text: 'Une erreur est survenue lors de la fin de l\'inventaire'
            });
            return false;
        }
    };

    const closeInventory = async () => {
        if (!inventory.value) return false;

        try {
            const result = await alertService.confirm({
                title: 'Clôturer l\'inventaire',
                text: `Voulez-vous vraiment clôturer définitivement l'inventaire "${inventory.value.label}" ?`
            });

            if (result.isConfirmed) {
                // TODO: Implémenter l'appel API pour clôturer l'inventaire
                await alertService.success({
                    text: 'L\'inventaire a été clôturé avec succès'
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur lors de la clôture:', error);
            await alertService.error({
                text: 'Une erreur est survenue lors de la clôture de l\'inventaire'
            });
            return false;
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Non définie';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const loadDetailData = async () => {
        if (!inventoryId.value) {
            console.warn('ID d\'inventaire non disponible');
            return;
        }

        try {
            await inventoryStore.fetchInventoryDetail(inventoryId.value);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des détails:', error);
            await alertService.error({
                title: 'Erreur',
                text: 'Impossible de charger les détails de l\'inventaire'
            });
        }
    };

    const exportToPDF = async () => {
        if (!inventory.value) return;
        const data: any = {
            inventory: {
                label: inventory.value.label,
                reference: inventory.value.reference,
                inventory_date: inventory.value.date,
                statut: inventory.value.status,
                contages: inventory.value.comptages,
                teams: inventory.value.equipe
            },
            magasins: inventory.value.magasins || [],
            resources: inventory.value.ressources || [],
            jobsData: jobsData,
            stats: tabs.reduce((acc, tab) => {
                if (tab.id !== 'general') {
                    acc[tab.id] = {
                        completed: getCompletedJobsCount(tab.id),
                        inProgress: getInProgressJobsCount(tab.id),
                        remaining: getRemainingJobsCount(tab.id),
                        total: getTotalJobsCount(tab.id)
                    };
                }
                return acc;
            }, {} as Record<string, any>)
        };

        await generatePDF(data, `Inventaire_${inventory.value.reference}`);
    };

    // Charger les données au montage du composant
    onMounted(async () => {
        try {
            await fetchInventoryIdByReference(inventoryReference);

            if (inventoryId.value) {
                await loadDetailData();
            } else {
                console.error('Impossible de récupérer l\'ID de l\'inventaire');
                await alertService.error({
                    title: 'Erreur',
                    text: inventoryError.value || 'Impossible de charger l\'inventaire'
                });
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            await alertService.error({
                title: 'Erreur',
                text: 'Impossible d\'initialiser les données de l\'inventaire'
            });
        }
    });

    return {
        currentTab,
        viewMode,
        inventory,
        loading,
        error,
        inventoryId,
        inventoryLoading,
        inventoryError,
        magasins: computed(() => inventory.value?.magasins || []),
        teamsGridData,
        magasinsGridData,
        resourcesGridData,
        teamActions,
        storeActions,
        resourceActions,
        tabs,
        jobColumns,
        launchInventory,
        editInventory,
        cancelInventory,
        terminateInventory,
        closeInventory,
        formatDate,
        getStatusClass,
        getJobsForTab,
        loadDetailData,
        getCompletedJobsCount,
        getInProgressJobsCount,
        getRemainingJobsCount,
        getTotalJobsCount,
        exportToPDF,
        resources,
        resourcesLoading,
        resourcesError,
        assignResourceToInventory,
        updateResourceQuantity,
        removeResourceFromInventory,
        getAvailableResources
    };
}
