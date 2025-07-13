import { ref, computed, watch, onMounted, nextTick, onUnmounted, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLocationStore } from '@/stores/location';
import { useJobStore } from '@/stores/job';
import { useInventoryStore } from '@/stores/inventory';
import { alertService } from '@/services/alertService';
import { useWarehouseStore } from '@/stores/warehouse';
import { useDataTableFilters, type DataTableParams } from '@/composables/useDataTableFilters';

// Import des icônes pour les actions
import IconEye from '@/components/icon/icon-eye.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconUser from '@/components/icon/icon-user.vue';

// Interfaces pour la migration depuis PlanningManagement.vue
interface Store {
    id: number;
    store_name: string;
    teams_count: number;
    jobs_count: number;
    reference: string;
}

interface PlanningAction {
    label: string;
    icon: any;
    handler: (store: Store) => void;
}

type ViewModeType = 'table' | 'grid';

interface GridDataItem {
    id: number;
    store_name: string;
    teams_count: number;
    jobs_count: number;
    reference: string;
}

interface Action<T> {
    label: string;
    icon: any;
    handler: (item: T) => void;
    variant?: 'primary' | 'secondary' | 'danger';
}

interface ActionConfig {
    label: string;
    icon: any;
    onClick: (row: Record<string, unknown>) => void;
    color: 'primary' | 'secondary' | 'danger';
}

// Interface locale pour les jobs du planning (différente du store)
interface PlanningJob {
    id: string;
    reference: string;
    locations: string[];
    isValidated: boolean;
    createdAt: string;
    validatedAt?: string;
}

export function usePlanning(options?: { inventoryReference?: string, warehouseReference?: string }) {
    const locationStore = useLocationStore();
    const jobStore = useJobStore();
    const inventoryStore = useInventoryStore();
    const warehouseStore = useWarehouseStore();
    const route = useRoute();
    const router = useRouter();

    // Utiliser le composable générique pour les jobs
    const jobDataTableFilters = useDataTableFilters();

    // Priorité aux options, sinon fallback sur la route
    const inventoryReference = options?.inventoryReference ?? (route.params.reference as string);
    const warehouseReference = options?.warehouseReference ?? (route.params.warehouse as string);

    // Récupérer les paramètres de route
    const storeId = route.query.storeId as string;

    // IDs récupérés depuis les références
    const inventoryId = ref<number | null>(null);
    const warehouseId = ref<number | null>(null);

    // Jobs locaux pour le planning (différents des jobs du store)
    const planningJobs = ref<PlanningJob[]>([]);
    const locationSearchQuery = ref('');
    const isSubmitting = ref(false);
    const selectedAvailable = ref<string[]>([]);
    const selectedJobs = ref<string[]>([]);
    const selectedJobToAddLocation = ref<string>('');
    const showJobDropdown = ref(false);

    // Paramètres pour le dataTable des locations
    const currentPage = ref(1);
    const pageSize = ref(20);
    const sortBy = ref('reference');
    const sortOrder = ref<'asc' | 'desc'>('asc');
    const filters = ref<any>({}); // Assuming LocationQueryParams is no longer needed or replaced

    // États pour les paramètres de tri et filtre
    const sortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([]);
    const filterModel = ref<Record<string, { filter: string }>>({});

    // État pour gérer l'expansion des jobs
    const expandedJobIds = ref<Set<string>>(new Set());

    // Computed pour les locations disponibles (non assignées)
    const availableLocations = computed(() => {
        const allLocations = locationStore.getLocations;
        const query = locationSearchQuery.value.toLowerCase().trim();

        let filtered = allLocations;

        // Filtrage par recherche
        if (query) {
            filtered = filtered.filter(loc =>
                loc.reference.toLowerCase().includes(query) ||
                loc.location_reference.toLowerCase().includes(query) ||
                loc.description.toLowerCase().includes(query) ||
                loc.sous_zone.sous_zone_name.toLowerCase().includes(query) ||
                loc.zone.zone_name.toLowerCase().includes(query) ||
                loc.warehouse.warehouse_name.toLowerCase().includes(query)
            );
        }

        // Exclure les locations déjà utilisées dans les jobs
        const currentJobs = Array.isArray(planningJobs.value) ? planningJobs.value : [];
        const usedLocationIds = new Set(currentJobs.flatMap(job => job.locations || []));
        return filtered.filter(loc => !usedLocationIds.has(loc.reference));
    });

    // Computed pour les jobs non validés disponibles pour ajouter des emplacements
    const availableJobsForLocation = computed(() => {
        // Utiliser les jobs du store backend qui ne sont pas terminés
        return jobStore.jobs.filter(job => job.status !== 'TERMINE');
    });

    // Computed pour vérifier si on a des jobs disponibles
    const hasAvailableJobs = computed(() => {
        return availableJobsForLocation.value && availableJobsForLocation.value.length > 0;
    });

    // Computed pour les options de sélection de jobs
    const jobSelectOptions = computed(() => {
        return availableJobsForLocation.value.map(job => ({
            value: job.id.toString(),
            label: job.reference || `Job ${job.id}`
        }));
    });

    // Computed pour les données du dataTable
    const tableData = computed(() => {
        return locationStore.getLocations.map(location => ({
            id: location.id,
            reference: location.reference,
            location_reference: location.location_reference,
            description: location.description,
            sous_zone: location.sous_zone.sous_zone_name,
            zone: location.zone.zone_name,
            warehouse: location.warehouse.warehouse_name,
            status: location.sous_zone.sous_zone_status,
            created_at: location.created_at
        }));
    });

    // Computed pour les données des jobs avec expansion
    const displayJobsData = computed(() => {
        const rows: any[] = [];
        planningJobs.value.forEach((job, idx) => {
            rows.push({
                id: job.id,
                jobId: job.id,
                reference: job.reference,
                isChild: false,
                isValidated: job.isValidated,
                status: job.isValidated ? 'VALIDE' : 'EN ATTENTE'
            });
            if (expandedJobIds.value.has(job.id)) {
                job.locations.forEach((loc, i) => {
                    // Maintenant loc est une référence de location, on peut la chercher dans availableLocations
                    const locationData = availableLocations.value.find(l => l.reference === loc);
                    if (locationData) {
                        rows.push({
                            id: `${job.id}-${i}`,
                            jobId: job.id,
                            reference: locationData.reference,
                            zone: locationData.zone.zone_name,
                            sousZone: locationData.sous_zone.sous_zone_name,
                            isChild: true,
                            originalLocation: loc,
                            parentJobValidated: job.isValidated
                        });
                    } else {
                        // Fallback si la location n'est pas trouvée
                        rows.push({
                            id: `${job.id}-${i}`,
                            jobId: job.id,
                            reference: loc,
                            zone: 'N/A',
                            sousZone: 'N/A',
                            isChild: true,
                            originalLocation: loc,
                            parentJobValidated: job.isValidated
                        });
                    }
                });
            }
        });
        return rows;
    });

    const loading = ref(false);

    // Charger les locations depuis le store
    const loadLocations = async (params?: any) => {
        try {
            loading.value = true;
            if (warehouseId.value !== null) {
                await locationStore.fetchUnassignedLocations(warehouseId.value, {
                    page: currentPage.value,
                    page_size: pageSize.value,
                    ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value,
                    ...filters.value,
                    ...params
                });
            }
        } catch (error) {
            // Erreur déjà gérée
        } finally {
            loading.value = false;
        }
    };

    // Gestion du tri des locations
    const handleLocationSort = async (column: string, order: 'asc' | 'desc') => {
        sortBy.value = column;
        sortOrder.value = order;
        await loadLocations();
    };

    // Gestion de la pagination des locations
    const handleLocationPageChange = async (page: number) => {
        currentPage.value = page;
        await loadLocations();
    };

    // Gestion du changement de taille de page des locations
    const handleLocationPageSizeChange = async (size: number) => {
        pageSize.value = size;
        currentPage.value = 1;
        await loadLocations();
    };

    // Gestion des filtres des locations
    const handleLocationFilterChange = async (newFilters: any) => { // Assuming LocationQueryParams is no longer needed or replaced
        filters.value = { ...filters.value, ...newFilters };
        currentPage.value = 1;
        await loadLocations();
    };

    // Recherche de locations
    const searchLocations = async (query: string) => {
        locationSearchQuery.value = query;
        if (query.trim()) {
            try {
                await locationStore.searchLocations(query, {
                    page: currentPage.value,
                    page_size: pageSize.value,
                    ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value,
                    ...filters.value
                });
            } catch (error) {
                // Erreur déjà gérée
            }
        } else {
            await loadLocations();
        }
    };

    // Watcher pour s'assurer que les computed se mettent à jour
    watch(() => jobStore.jobs, (newJobs) => {
        // Les computed se mettent à jour automatiquement
    }, { deep: true });

    onMounted(async () => {
        await initializeIdsFromReferences();
        await loadLocations();
        await loadJobsFromStore();
    });


    // Fonction utilitaire pour recharger les deux tables
    const reloadBothTables = async () => {
        await Promise.all([
            loadLocations(),
            loadJobsFromStore({
                page: 1,
                pageSize: 20
            })
        ]);
    };

    // Fonction pour créer un job directement depuis les emplacements sélectionnés
    async function createJobFromSelectedLocations() {
        try {
            if (selectedAvailable.value.length === 0) {
                await alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
                return false;
            }

            // Vérifier que nous avons les IDs nécessaires, sinon réessayer de les récupérer
            if (!inventoryId.value) {
                if (inventoryReference) {
                    inventoryId.value = await fetchInventoryIdByReference(inventoryReference);
                }
            }

            if (!warehouseId.value) {
                if (warehouseReference) {
                    warehouseId.value = await fetchWarehouseIdByReference(warehouseReference);
                }
            }

            // Vérifications finales
            if (!inventoryId.value) {
                await alertService.error({ text: 'ID d\'inventaire non disponible. Veuillez actualiser la page.' });
                return false;
            }

            if (!warehouseId.value) {
                await alertService.error({ text: 'ID d\'entrepôt non disponible. Veuillez actualiser la page.' });
                return false;
            }

            // Convertir les IDs strings en numbers et récupérer les informations des locations
            const locationIds: number[] = [];
            const locationDetails: number[] = [];

            for (const locationIdStr of selectedAvailable.value) {
                const locationId = parseInt(locationIdStr);
                if (isNaN(locationId)) {
                    continue;
                }

                const location = locationStore.getLocations.find(loc => loc.id === locationId);
                if (location) {
                    locationIds.push(location.id);
                    locationDetails.push(location.id);
                } else {
                    console.warn(`Location with ID ${locationId} not found in store.`);
                }
            }

            if (locationIds.length === 0) {
                await alertService.error({ text: 'Aucune location valide trouvée pour créer le job' });
                return false;
            }

            // Créer le job dans le store backend avec les IDs récupérés
            const jobData = {
                emplacements: locationIds
            };

            const response = await jobStore.createJob(
                inventoryId.value,
                warehouseId.value,
                jobData
            );

            // Vider la sélection après création
            selectedAvailable.value = [];

            // Recharger les deux tables
            await reloadBothTables();

            await alertService.success({
                text: `Job créé avec succès avec ${locationIds.length} emplacement(s)`
            });

            return true;
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la création du job.' });
            return false;
        }
    }

    // Fonction pour créer un job dans le store backend
    async function createJobInStore(planningJob: PlanningJob) {
        try {
            // Utiliser les emplacements sélectionnés dans la table au lieu des emplacements du job local
            if (selectedAvailable.value.length === 0) {
                throw new Error('Aucun emplacement sélectionné pour créer le job');
            }

            // Récupérer les informations de l'entrepôt et de l'inventaire depuis les locations
            const firstLocation = locationStore.getLocations.find(loc => loc.reference === selectedAvailable.value[0]);
            if (!firstLocation) {
                throw new Error('Location introuvable pour créer le job');
            }

            // Convertir les références de locations sélectionnées en IDs
            const locationIds: number[] = [];
            for (const locationRef of selectedAvailable.value) {
                const location = locationStore.getLocations.find(loc => loc.reference === locationRef);
                if (location) {
                    locationIds.push(location.id);
                }
            }

            if (locationIds.length === 0) {
                throw new Error('Aucune location valide trouvée pour créer le job');
            }

            // Créer le job dans le store backend
            const jobData = {
                emplacements: locationIds
            };

            await jobStore.createJob(
                1,
                firstLocation.warehouse.id,
                jobData
            );
        } catch (error) {
            throw error;
        }
    }

    // Handler pour la pagination des jobs
    const onJobPaginationChanged = async ({ page, pageSize, sort, filter }: {
        page: number,
        pageSize: number,
        sort?: any,
        filter?: any
    }) => {
        await loadJobsFromStore({ page, pageSize, sort, filter });
    };

    // Handler pour les changements de tri des jobs
    const onJobSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
        await loadJobsFromStore({ sort: sortModel });
    };

    // Handler pour les changements de filtre des jobs
    const onJobFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
        await loadJobsFromStore({ filter: filterModel });
    };

    // Fonction pour charger les jobs du store backend
    async function loadJobsFromStore(params?: {
        page?: number;
        pageSize?: number;
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>;
        filter?: Record<string, { filter: string }>;
    }) {
        try {
            loading.value = true;
            if (warehouseId.value !== null && inventoryId.value !== null) {
                await jobStore.fetchJobs(inventoryId.value, warehouseId.value, {
                    page: params?.page || 1,
                    pageSize: params?.pageSize || 20,
                    sort: params?.sort,
                    filter: params?.filter
                });
            }
        } catch (error) {
            // Erreur déjà gérée
        } finally {
            loading.value = false;
        }
    }


    // Fonction améliorée pour supprimer un emplacement d'un job
    async function removeLocationFromJob(jobId: string, location: string) {
        try {
            // Convertir le jobId en nombre pour la comparaison avec les jobs du store
            const numericJobId = parseInt(jobId);

            // Vérifier si c'est un job du store backend ou un job local
            const storeJob = jobStore.jobs.find(job => job.id === numericJobId);

            if (storeJob) {
                // C'est un job du store backend - utiliser la méthode du store
                const locationToRemove = storeJob.locations?.find(loc =>
                    loc.location_reference === location
                );

                if (!locationToRemove) {
                    await alertService.error({ text: 'Emplacement introuvable dans ce job.' });
                    return;
                }

                // Demander confirmation avant suppression
                const result = await alertService.confirm({
                    title: 'Confirmer la suppression',
                    text: `Voulez-vous vraiment supprimer l'emplacement "${locationToRemove.location_reference}" du job "${storeJob.reference}" ?`
                });

                if (!result.isConfirmed) {
                    await alertService.info({ text: 'Suppression annulée.' });
                    return;
                }

                // Utiliser location_id au lieu de id
                const locationId = locationToRemove.location_id;
                if (!locationId) {
                    await alertService.error({ text: 'ID d\'emplacement invalide.' });
                    return;
                }

                // Appeler la méthode du store pour supprimer l'emplacement
                const response = await jobStore.deleteLocationFromJob(
                    storeJob.id,
                    locationId
                );

                // Recharger les données des deux tables
                await reloadBothTables();

                // Afficher le message du backend dans l'alerte de succès
                const successMessage = response.message || `Emplacement "${locationToRemove.location_reference}" supprimé du job "${storeJob.reference}" avec succès.`;
                await alertService.success({
                    text: successMessage
                });
            } else {
                // C'est un job local du planning - logique existante
                const jobIndex = planningJobs.value.findIndex(job => job.id === jobId);
                if (jobIndex === -1) {
                    await alertService.error({ text: 'Job introuvable.' });
                    return;
                }

                const job = planningJobs.value[jobIndex];
                if (job.isValidated) {
                    await alertService.error({
                        text: 'Impossible de supprimer un emplacement d\'un job validé.'
                    });
                    return;
                }

                const locationIndex = job.locations.findIndex(loc => loc === location);
                if (locationIndex === -1) {
                    await alertService.error({ text: 'Emplacement introuvable dans ce job.' });
                    return;
                }

                // Demander confirmation avant suppression
                const result = await alertService.confirm({
                    title: 'Confirmer la suppression',
                    text: `Voulez-vous vraiment supprimer l'emplacement "${location}" du job "${job.reference}" ?`
                });

                if (!result.isConfirmed) {
                    await alertService.info({ text: 'Suppression annulée.' });
                    return;
                }

                job.locations.splice(locationIndex, 1);

                // Si le job n'a plus d'emplacements, le supprimer
                if (job.locations.length === 0) {
                    planningJobs.value.splice(jobIndex, 1);
                }

                await alertService.success({
                    text: `Emplacement "${location}" supprimé du job "${job.reference}" avec succès.`
                });
            }
        } catch (error) {
            // Récupérer le message d'erreur du backend si disponible
            let errorMessage = 'Erreur lors de la suppression de l\'emplacement du job.';

            if (error && typeof error === 'object') {
                // Essayer de récupérer le message d'erreur du backend
                const backendError = (error as any).response?.data;
                if (backendError) {
                    if (backendError.message) {
                        errorMessage = backendError.message;
                    } else if (backendError.detail) {
                        errorMessage = backendError.detail;
                    } else if (backendError.error) {
                        errorMessage = backendError.error;
                    } else if (typeof backendError === 'string') {
                        errorMessage = backendError;
                    }
                }
            }

            await alertService.error({
                text: errorMessage
            });
        }
    }

    // Fonction pour retourner les jobs sélectionnés
    async function returnSelectedJobs() {
        if (!selectedJobs.value.length) {
            await alertService.error({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }

        const selectedJobIds = new Set(selectedJobs.value);
        const hasValidated = planningJobs.value.some(job => selectedJobIds.has(job.id) && job.isValidated);

        if (hasValidated) {
            await alertService.error({
                title: 'Jobs validés',
                text: 'Impossible de retourner un job validé. Vous avez besoin de permission pour cette action dans l\'affectation.'
            });
            return;
        }

        const locationsToRestore: string[] = [];
        planningJobs.value.forEach(job => {
            if (selectedJobIds.has(job.id)) {
                locationsToRestore.push(...job.locations);
            }
        });

        planningJobs.value = planningJobs.value.filter(job => !selectedJobIds.has(job.id));
        selectedJobs.value = [];

        await nextTick();

        await alertService.success({
            text: `${selectedJobIds.size} job(s) retourné(s). ${locationsToRestore.length} emplacement(s) remis en disponible.`
        });
    }

    async function validateJob(jobId: string) {
        const job = planningJobs.value.find(j => j.id === jobId);
        if (!job) {
            await alertService.error({ text: 'Job introuvable.' });
            return;
        }

        if (job.isValidated) {
            await alertService.info({ text: 'Ce job est déjà validé.' });
            return;
        }

        const result = await alertService.confirm({
            text: `Voulez-vous vraiment valider le job ${job.reference} ?`
        });

        if (!result.isConfirmed) {
            await alertService.info({ text: 'Validation annulée.' });
            return;
        }

        isSubmitting.value = true;
        try {
            job.isValidated = true;
            job.validatedAt = new Date().toISOString();

            // Créer le job dans le store backend
            await createJobInStore(job);

            await alertService.success({
                title: 'Succès',
                text: `Job ${job.reference} validé avec succès.`
            });
        } catch (error) {
            job.isValidated = false;
            delete job.validatedAt;
            await alertService.error({ text: 'Erreur lors de la validation du job' });
        } finally {
            isSubmitting.value = false;
        }
    }

    // Computed pour les jobs du store (pour le premier DataTable)
    const storeJobs = computed(() => {
        const jobs = jobStore.jobs;
        // On mappe directement les champs attendus pour la table AG Grid
        return jobs.map(job => ({
            id: job.id,
            reference: job.reference,
            status: job.status,
            warehouse_name: (job as any).warehouse_name, // optionnel si présent
            inventory_reference: (job as any).inventory_reference, // optionnel si présent
            created_at: job.created_at,
            emplacements_count: job.locations?.length || 0,
            assignments_count: (job as any).assignments_count || 0,
            // Pour la nested table, on mappe les vrais emplacements avec l'ID du job parent
            emplacements: (job.locations || []).map(loc => ({
                id: loc.id,
                reference: loc.reference,
                location_reference: loc.location_reference,
                zone: loc.zone?.zone_name || '',
                sous_zone: loc.sous_zone?.sous_zone_name || '',
                description: '', // Ajoutez ici un champ si besoin
                status: loc.status,
                jobId: job.id, // Ajouter l'ID du job parent
                parentRow: { id: job.id } // Ajouter la référence parentRow pour compatibilité
            }))
        }));
    });

    // Handler pour les changements de taille de page
    const onPageSizeChanged = async (size: number) => {
        pageSize.value = size;
        currentPage.value = 1; // Retour à la première page
        await loadLocations({
            page: 1,
            page_size: size,
            ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value,
            ...filters.value
        });
    };

    // Handler pagination AG Grid pour les locations
    const onLocationPaginationChanged = async ({ page, pageSize, sort, filter }: {
        page: number,
        pageSize: number,
        sort?: any,
        filter?: any
    }) => {
        // Mettre à jour les modèles de tri et filtre si fournis
        if (sort) {
            sortModel.value = sort;
        }
        if (filter) {
            filterModel.value = filter;
        }
        // Recharge les données côté backend avec la bonne page et taille
        await loadLocations({
            page,
            page_size: pageSize,
            ordering: sort && sort.length > 0
                ? (sort[0].sort === 'desc' ? `-${sort[0].colId}` : sort[0].colId)
                : undefined,
            ...filter
        });
    };

    // Handler pour les changements de filtre des locations
    const onLocationFilterChanged = async (model: Record<string, { filter: string }>) => {
        filterModel.value = model;

        // Convertir le modèle de filtre en paramètres pour le store
        const newFilters: any = {};
        Object.entries(model).forEach(([key, value]) => {
            if (value.filter) {
                newFilters[key] = value.filter;
            }
        });

        await loadLocations({
            ...newFilters,
            ordering: sortModel.value.length > 0
                ? (sortModel.value[0].sort === 'desc' ? `-${sortModel.value[0].colId}` : sortModel.value[0].colId)
                : undefined
        });
    };

    // Fonction pour gérer la pagination côté serveur des locations
    const handleLocationServerPagination = async (newPage: number, newPageSize?: number) => {
        if (newPageSize && newPageSize !== pageSize.value) {
            pageSize.value = newPageSize;
            currentPage.value = 1;
        } else {
            currentPage.value = newPage;
        }

        // Préparer les paramètres de requête
        const params: any = { // Assuming LocationQueryParams is no longer needed or replaced
            page: currentPage.value,
            page_size: pageSize.value,
            ...filters.value
        };

        // Ajouter l'ordering si un tri est défini
        if (sortModel.value.length > 0) {
            const sortItem = sortModel.value[0];
            params.ordering = sortItem.sort === 'desc' ? `-${sortItem.colId}` : sortItem.colId;
        } else if (sortBy.value) {
            params.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value;
        }

        await loadLocations(params);
    };

    // Fonction pour gérer la sélection des emplacements disponibles
    function onAvailableSelectionChanged(selectedRows: Set<string>) {
        console.log('🔍 Sélection des emplacements disponibles:', selectedRows);

        // Convertir le Set en tableau de strings
        const selectedIds = Array.from(selectedRows).map(id => String(id));

        selectedAvailable.value = selectedIds;
    }

    // Fonction pour gérer la sélection des jobs
    function onJobSelectionChanged(selectedRows: Set<string>) {
        console.log('🔍 Sélection des jobs:', selectedRows);

        // Convertir le Set en tableau de strings
        const selectedIds = Array.from(selectedRows).map(id => String(id));

        selectedJobs.value = selectedIds;
    }

    // Fonction pour sélectionner un job pour ajouter des emplacements
    async function onSelectJobForLocation(value: string | number | string[] | number[] | null) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            selectedJobToAddLocation.value = '';
            return;
        }

        const jobId = value as string;

        const selectedJob = availableJobsForLocation.value?.find(job => job && job.id.toString() === jobId);
        if (!selectedJob) {
            await alertService.error({ text: 'Job sélectionné introuvable. Veuillez actualiser la page.' });
            selectedJobToAddLocation.value = '';
            return;
        }

        const jobReference = selectedJob.reference || `Job ${selectedJob.id}`;

        if (!selectedAvailable.value || selectedAvailable.value.length === 0) {
            await alertService.warning({ text: 'Veuillez sélectionner des emplacements avant d\'ajouter au job.' });
            selectedJobToAddLocation.value = '';
            return;
        }

        const result = await alertService.confirm({
            title: 'Confirmer l\'ajout',
            text: `Ajouter ${selectedAvailable.value.length} emplacement(s) au job "${jobReference}" ?`
        });

        if (!result.isConfirmed) {
            selectedJobToAddLocation.value = '';
            return alertService.info({ text: 'Ajout annulé.' });
        }

        try {
            // Utiliser la nouvelle fonction pour ajouter des emplacements aux jobs du store
            await addLocationToStoreJob(jobId, selectedAvailable.value);
            selectedJobToAddLocation.value = '';

            await alertService.success({
                text: `${selectedAvailable.value.length} emplacement(s) ajouté(s) au job "${jobReference}" avec succès.`
            });
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de l\'ajout au job.' });
            selectedJobToAddLocation.value = '';
        }
    }

    // Nouvelle fonction pour ajouter des emplacements aux jobs du store backend
    async function addLocationToStoreJob(jobId: string, selectedLocations: string[]) {
        if (!selectedLocations.length) {
            await alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
            return false;
        }

        if (!jobId) {
            await alertService.error({ text: 'Veuillez sélectionner un job.' });
            return false;
        }

        try {
            // Convertir les IDs de locations en numbers
            const locationIds: number[] = [];
            const foundLocations: any[] = [];

            for (const locationIdStr of selectedLocations) {
                const locationId = parseInt(locationIdStr);
                if (isNaN(locationId)) {
                    continue;
                }

                // Vérifier que la location existe dans le store
                const location = locationStore.getLocations.find(loc => loc.id === locationId);
                if (location) {
                    locationIds.push(locationId);
                    foundLocations.push(location);
                }
            }

            if (locationIds.length === 0) {
                await alertService.error({
                    text: `Aucune location valide trouvée parmi les sélections: ${selectedLocations.join(', ')}`
                });
                return false;
            }

            // Convertir jobId en number
            const numericJobId = parseInt(jobId);
            if (isNaN(numericJobId)) {
                await alertService.error({ text: 'ID de job invalide.' });
                return false;
            }

            // Appeler la méthode du store pour ajouter des emplacements au job
            const response = await jobStore.addLocationToJob(numericJobId, locationIds);

            // Recharger les données des deux tables
            await reloadBothTables();

            // Afficher le message du backend dans l'alerte de succès
            const successMessage = response.message || `${locationIds.length} emplacement(s) ajouté(s) au job avec succès.`;
            await alertService.success({
                text: successMessage
            });

            // Vider la sélection
            selectedAvailable.value = [];
            selectedJobToAddLocation.value = '';

            return true;
        } catch (error) {
            // Récupérer le message d'erreur du backend si disponible
            let errorMessage = 'Erreur lors de l\'ajout d\'emplacements au job.';

            if (error && typeof error === 'object') {
                // Essayer de récupérer le message d'erreur du backend
                const backendError = (error as any).response?.data;
                if (backendError) {
                    if (backendError.message) {
                        errorMessage = backendError.message;
                    } else if (backendError.detail) {
                        errorMessage = backendError.detail;
                    } else if (backendError.error) {
                        errorMessage = backendError.error;
                    } else if (typeof backendError === 'string') {
                        errorMessage = backendError;
                    }
                }
            }

            await alertService.error({
                text: errorMessage
            });

            throw error;
        }
    }

    // Fonction pour valider les jobs en masse
    async function onBulkValidate() {
        const result = await alertService.confirm({
            title: 'Confirmer la validation',
            text: `Valider ${selectedJobs.value.length} job(s) ?`
        });

        if (!result.isConfirmed) {
            return alertService.info({ text: 'Validation annulée.' });
        }

        isSubmitting.value = true;
        try {
            selectedJobs.value.forEach(id => {
                const j = planningJobs.value.find(x => x.id === id);
                if (j && !j.isValidated) {
                    j.isValidated = true;
                    j.validatedAt = new Date().toISOString();
                }
            });
            await alertService.success({ text: `${selectedJobs.value.length} job(s) validé(s) avec succès.` });
            selectedJobs.value = [];
        } catch {
            await alertService.error({ text: 'Erreur durant la validation en masse.' });
        } finally {
            isSubmitting.value = false;
        }
    }

    // Fonction pour retourner les jobs sélectionnés avec confirmation
    async function onReturnSelectedJobs() {
        const result = await alertService.confirm({
            text: `Êtes-vous sûr de vouloir retourner ${selectedJobs.value.length} job(s) ? Cette action ne peut pas être annulée.`
        });

        if (!result.isConfirmed) {
            return alertService.info({ text: 'Retour annulé.' });
        }

        try {
            await returnSelectedJobs();
        } catch (error) {
            await alertService.error({ text: 'Erreur lors du retour des jobs.' });
        }
    }

    // Fonction pour actualiser les locations
    const onRefreshLocations = async () => {
        await loadLocations();
    };

    // Fonction pour récupérer l'ID de l'inventaire par sa référence
    const fetchInventoryIdByReference = async (reference: string): Promise<number | null> => {
        try {
            // Charger la liste des inventaires si pas déjà fait
            if (inventoryStore.inventories.length === 0) {
                await inventoryStore.fetchInventories();
            }

            const inventory = inventoryStore.inventories.find(inv => inv.reference === reference);

            if (inventory) {
                return inventory.id;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    };

    // Fonction pour récupérer l'ID de l'entrepôt par sa référence
    const fetchWarehouseIdByReference = async (reference: string): Promise<number | null> => {
        try {
            // Utiliser directement l'API warehouse par référence
            const warehouseId = await warehouseStore.fetchWarehouseByReference(reference);

            if (warehouseId) {
                return warehouseId;
            }

            // Fallback avec le storeId si disponible
            if (storeId) {
                return parseInt(storeId);
            }

            return null;
        } catch (error) {
            return null;
        }
    };

    // Fonction pour initialiser les IDs depuis les références
    const initializeIdsFromReferences = async () => {
        if (inventoryReference) {
            inventoryId.value = await fetchInventoryIdByReference(inventoryReference);
        }
        if (warehouseReference) {
            warehouseId.value = await fetchWarehouseIdByReference(warehouseReference);
        }
    };

    // Fonction pour forcer la réinitialisation des IDs
    const refreshIdsFromReferences = async () => {
        // Réinitialiser les IDs
        inventoryId.value = null;
        warehouseId.value = null;

        // Réinitialiser depuis les références
        await initializeIdsFromReferences();
    };

    // Ajout d'un gestionnaire d'événement global pour le bouton supprimer emplacement
    if (typeof window !== 'undefined') {
        window.addEventListener('click', async (event: Event) => {
            const target = event.target as HTMLElement;
            const button = target.closest('.btn-supprimer-emplacement') as HTMLElement;

            if (button) {
                const jobId = button.getAttribute('data-job-id');
                const locationId = button.getAttribute('data-location-id');

                if (jobId && locationId) {
                    try {
                        await removeLocationFromJob(jobId, locationId);
                    } catch (error) {
                        await alertService.error({ text: 'Erreur lors de la suppression de l\'emplacement.' });
                    }
                }
            }
        });
    }

    // Fonction pour ajouter des emplacements aux jobs locaux (pour compatibilité)
    async function addLocationToJob(jobId: string, selectedLocations: string[]) {
        if (!selectedLocations.length) {
            await alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
            return false;
        }

        if (!jobId) {
            await alertService.error({ text: 'Veuillez sélectionner un job.' });
            return false;
        }

        const job = planningJobs.value.find(j => j.id === jobId);
        if (!job) {
            await alertService.error({ text: 'Job introuvable.' });
            return false;
        }

        if (job.isValidated) {
            await alertService.error({
                title: 'Job validé',
                text: 'Impossible d\'ajouter des emplacements à un job validé.'
            });
            return false;
        }

        // Ajouter les nouveaux emplacements
        job.locations.push(...selectedLocations);

        await nextTick();
        selectedAvailable.value = [];
        selectedJobToAddLocation.value = '';
        showJobDropdown.value = false;

        await alertService.success({
            text: `${selectedLocations.length} emplacement(s) ajouté(s) au job ${job.reference}`
        });

        return true;
    }

    // Fonction pour supprimer les jobs sélectionnés via le store
    async function onReturnSelectedJobsFromStore() {
        if (!selectedJobs.value.length) {
            await alertService.error({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        try {
            // Convertir les IDs en nombres
            const jobIds = selectedJobs.value.map(id => Number(id));
            await jobStore.deleteJob(jobIds);
            await alertService.success({ text: `${jobIds.length} job(s) supprimé(s) avec succès.` });
            selectedJobs.value = [];
            await loadJobsFromStore();
        } catch (error) {
            let errorMessage = 'Erreur lors de la suppression des jobs.';
            if (error && typeof error === 'object') {
                const backendError = (error as any).response?.data;
                if (backendError) {
                    if (backendError.message) errorMessage = backendError.message;
                    else if (backendError.detail) errorMessage = backendError.detail;
                    else if (backendError.error) errorMessage = backendError.error;
                    else if (typeof backendError === 'string') errorMessage = backendError;
                }
            }
            await alertService.error({ text: errorMessage });
        }
    }

    async function validateJobs(jobIds: (string | number)[]) {
        if (!jobIds.length) {
            await alertService.error({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }

        // Si jobIds est un Proxy (ref ou reactive), on le convertit en tableau natif
        const rawJobIds = Array.isArray(jobIds) ? jobIds : toRaw(jobIds);

        // Améliorer la conversion des IDs avec validation
        const jobIdsNum = rawJobIds.map(id => {
            // Si c'est un objet, essayer d'extraire l'ID
            if (typeof id === 'object' && id !== null) {
                const extractedId = (id as any).id || (id as any).jobId || (id as any).job_id;
                if (extractedId !== undefined) {
                    const numId = Number(extractedId);
                    return isNaN(numId) ? null : numId;
                }
            }

            // Conversion directe
            const numId = Number(id);
            return isNaN(numId) ? null : numId;
        }).filter(id => id !== null) as number[];

        // Utiliser les jobs du store comme source de vérité
        const storeJobsSelected = storeJobs.value.filter(sj => jobIdsNum.includes(Number(sj.id)));

        // Vérifier le statut de chaque job - accepter plusieurs statuts valides
        const validStatuses = ['EN ATTENTE'];
        const jobsPending = storeJobsSelected.filter(j => validStatuses.includes(j.status));
        const notPending = storeJobsSelected.filter(j => !validStatuses.includes(j.status));

        if (notPending.length > 0) {
            const jobRefs = notPending.map(j => j.reference || j.id).join(', ');
            await alertService.error({
                title: 'Validation impossible',
                text: `Les jobs suivants ne sont pas au statut approprié : ${jobRefs}`
            });
            // return; // décommente si tu veux bloquer la validation si au moins un n'est pas EN ATTENTE
        }

        if (!jobsPending.length) {
            await alertService.info({ text: 'Aucun job à valider.' });
            return;
        }

        const result = await alertService.confirm({
            title: 'Confirmer la validation',
            text: `Valider ${jobsPending.length} job(s) ?`
        });

        if (!result.isConfirmed) {
            await alertService.info({ text: 'Validation annulée.' });
            return;
        }

        isSubmitting.value = true;
        try {
            for (const job of jobsPending) {
                // Appel backend pour chaque job du store
                // Remplace createJobInStore par la méthode de validation réelle si besoin
                if (jobStore && typeof jobStore.validateJob === 'function') {
                    await jobStore.validateJob([job.id]);
                } else {
                    // Fallback : log ou autre action
                    console.warn('Aucune méthode de validation backend définie pour le job', job);
                }
            }
            await alertService.success({
                title: 'Succès',
                text: `${jobsPending.length} job(s) validé(s) avec succès.`
            });
            await loadJobsFromStore();
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la validation des jobs.' });
        } finally {
            isSubmitting.value = false;
        }
    }

    // ===== FONCTIONS POUR PLANNING MANAGEMENT =====

    // États pour le planning management
    const planningStores = ref<Store[]>([]);
    const selectedPlanningStore = ref<Store | null>(null);
    const planningLoading = ref(false);
    const planningInventoryStatus = ref('En préparation');
    const planningInventoryReference = ref<string>('');





    // Fonction pour charger les magasins


    // Fonction pour sélectionner un magasin
    function selectPlanningStore(store: Store) {
        selectedPlanningStore.value = store;
    }

    // Fonction pour définir le statut d'inventaire
    function setPlanningInventoryStatus(status: string) {
        planningInventoryStatus.value = status;
    }

    // Fonction pour définir la référence d'inventaire
    function setPlanningInventoryReference(reference: string) {
        planningInventoryReference.value = reference;
    }

    // Fonction pour vérifier si un item est un Store
    function isStore(item: GridDataItem): item is Store {
        return (
            typeof item.id === 'number' &&
            typeof item.store_name === 'string'
        );
    }

    // Handlers pour les actions
    const handlePlanningItemClick = (item: GridDataItem) => {
        if (isStore(item)) selectPlanningStore(item);
    };


    const handleActionsClick = (item: GridDataItem, e: MouseEvent) => {
        if (!isStore(item)) return;
        selectedPlanningStore.value = item;
        // Logique pour afficher le menu contextuel
        console.log('Menu contextuel pour:', item);
    };

    const handleEditItem = (item: Store | null) => {
        if (item) {
            console.log('Édition de:', item);
        }
    };

    const handleDeleteItem = (item: Store | null) => {
        if (item) {
            console.log('Suppression de:', item);
        }
    };

    return {
        // Jobs
        planningJobs,
        availableJobsForLocation,
        hasAvailableJobs,
        jobSelectOptions,
        selectedAvailable,
        selectedJobs,
        selectedJobToAddLocation,
        showJobDropdown,
        isSubmitting,
        expandedJobIds,
        createJobFromSelectedLocations,
        addLocationToJob,
        removeLocationFromJob,
        returnSelectedJobs,
        validateJob,
        validateJobs, // <-- nouveau

        // DataTable des locations
        tableData,
        currentPage,
        pageSize,
        sortBy,
        sortOrder,
        filters,
        sortModel,
        filterModel,
        locationSearchQuery,
        availableLocations,

        // Actions du dataTable
        loadLocations,
        handleLocationSort,
        handleLocationPageChange,
        handleLocationPageSizeChange,
        handleLocationFilterChange,
        searchLocations,
        handleLocationServerPagination,

        // Store
        locationStore,

        // Jobs du store
        storeJobs,

        // Données des jobs avec expansion
        displayJobsData,

        // Handlers pour les sélections et actions
        onAvailableSelectionChanged,
        onJobSelectionChanged,
        onSelectJobForLocation,
        onBulkValidate,
        onReturnSelectedJobs,
        onRefreshLocations,
        onLocationPaginationChanged,
        onJobPaginationChanged,
        onJobSortChanged,
        onJobFilterChanged,
        onLocationFilterChanged,

        // Paramètres de route et IDs
        storeId,
        inventoryReference,
        warehouseReference,
        inventoryId,
        warehouseId,
        initializeIdsFromReferences,
        refreshIdsFromReferences,
        onReturnSelectedJobsFromStore,

        // ===== PLANNING MANAGEMENT =====
        // États
        planningStores,
        selectedPlanningStore,
        planningLoading,
        planningInventoryStatus,
        planningInventoryReference,



        // Fonctions
        selectPlanningStore,
        setPlanningInventoryStatus,
        setPlanningInventoryReference,
        isStore,
        handlePlanningItemClick,
        handleActionsClick,
        handleEditItem,
        handleDeleteItem,
        loading
    };
}
