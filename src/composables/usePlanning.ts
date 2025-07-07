import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import type { Job } from '@/interfaces/planning';
import { useLocationStore } from '@/stores/location';
import { useJobStore } from '@/stores/job';
import { useInventoryStore } from '@/stores/inventory';
import { alertService } from '@/services/alertService';
import type { Location, LocationQueryParams } from '@/models/Location';
import type { JobTable, CreateJobRequest } from '@/models/Job';
import { useWarehouseStore } from '@/stores/warehouse';
import DataTableColumn from '@/interfaces/dataTable';

// Interface locale pour les jobs du planning (différente du store)
interface PlanningJob {
    id: string;
    reference: string;
    locations: string[];
    isValidated: boolean;
    createdAt: string;
    validatedAt?: string;
}

export function usePlanning() {
    const locationStore = useLocationStore();
    const jobStore = useJobStore();
    const inventoryStore = useInventoryStore();
    const warehouseStore = useWarehouseStore();
    const route = useRoute();

    // Récupérer les paramètres de route
    const storeId = route.query.storeId as string;
    const inventoryReference = route.query.inventoryReference as string;
    const warehouseReference = route.query.warehouseReference as string;

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
    const filters = ref<LocationQueryParams>({});

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
                status: job.isValidated ? 'VALIDÉ' : 'EN ATTENTE'
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

    // Computed pour les colonnes du dataTable
    const tableColumns = computed(() => [
        {
            key: 'reference',
            label: 'Référence',
            sortable: true,
            width: '120px'
        },
        {
            key: 'location_reference',
            label: 'Réf. Location',
            sortable: true,
            width: '130px'
        },
        {
            key: 'description',
            label: 'Description',
            sortable: true,
            width: '200px'
        },
        {
            key: 'sous_zone',
            label: 'Sous-zone',
            sortable: true,
            width: '120px'
        },
        {
            key: 'zone',
            label: 'Zone',
            sortable: true,
            width: '120px'
        },
        {
            key: 'warehouse',
            label: 'Entrepôt',
            sortable: true,
            width: '130px'
        },
        {
            key: 'status',
            label: 'Statut',
            sortable: true,
            width: '100px'
        }
    ]);

    // Colonnes pour la table des emplacements disponibles (AG Grid)
    const availableLocationColumns = [
        {
            headerName: 'ID',
            field: 'id',
            flex: 1,
            sortable: true,
            hide: true,
            filter: 'agTextColumnFilter'
        },
        {
            headerName: 'Référence',
            field: 'reference',
            flex: 1,
            sortable: true,
            filter: 'agTextColumnFilter'
        },
        {
            headerName: 'Réf. Location',
            field: 'location_reference',
            flex: 1,
            sortable: true,
            filter: 'agTextColumnFilter'
        },
        {
            headerName: 'Description',
            field: 'description',
            flex: 2,
            sortable: true,
            filter: 'agTextColumnFilter',
            cellRenderer: (params: any) => {
                const description = params.value;
                if (description && description.length > 50) {
                    return `<span title="${description}">${description.substring(0, 50)}...</span>`;
                }
                return description;
            }
        },
        {
            headerName: 'Sous-zone',
            field: 'sous_zone',
            flex: 1,
            sortable: true,
            filter: 'agTextColumnFilter'
        },
        {
            headerName: 'Zone',
            field: 'zone',
            flex: 1,
            sortable: true,
            filter: 'agTextColumnFilter'
        },
        {
            headerName: 'Entrepôt',
            field: 'warehouse',
            flex: 1,
            sortable: true,
            filter: 'agTextColumnFilter'
        },
        {
            headerName: 'Statut',
            field: 'status',
            width: 100,
            sortable: true,
            filter: 'agTextColumnFilter',
            cellRenderer: (params: any) => {
                const status = params.value;
                if (status === 'ACTIVE') {
                    return '<span class="bg-success-light text-success rounded-lg px-2 py-1 text-xs font-medium">ACTIF</span>';
                } else {
                    return '<span class="bg-warning-light text-warning rounded-lg px-2 py-1 text-xs font-medium">INACTIF</span>';
                }
            }
        }
    ];

    // Colonnes pour la table des jobs avec colonne Actions améliorée (AG Grid)
    const locationColumns = [
        {
            headerName: 'Job',
            field: 'reference',
            flex: 2,
            sortable: true,
            cellStyle: (params: any) => {
                if (!params.data) return undefined;
                if (params.data.isChild) {
                    return { paddingLeft: '35px', fontStyle: 'italic' };
                }
                return undefined;
            },
            cellRenderer: (params: any) => {
                if (!params.data) return '';
                if (!params.data.isChild) {
                    const jobId = params.data.jobId;
                    const isExpanded = expandedJobIds.value.has(jobId);
                    const arrow = isExpanded
                        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`
                        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`;
                    return `<div style="display: flex; align-items: center; width: 100%;">
                      <span style="cursor: pointer; display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" data-expand-toggle="${jobId}">${arrow}</span>
                      <span>${params.value ?? ''}</span>
                    </div>`;
                }
                return `${params.value ?? ''}`;
            },
            onCellClicked: (params: any) => {
                const target = params.event?.target as HTMLElement;
                const expandToggle = target.closest('[data-expand-toggle]');
                if (expandToggle && !params.data?.isChild) {
                    const jobId = expandToggle.getAttribute('data-expand-toggle')!;
                    if (expandedJobIds.value.has(jobId)) expandedJobIds.value.delete(jobId);
                    else expandedJobIds.value.add(jobId);
                }
            }
        },
        {
            headerName: 'Statut',
            field: 'status',
            width: 120,
            sortable: true,
            cellRenderer: (params: any) => {
                if (!params.data || params.data.isChild) return '';
                return params.data.isValidated
                    ? '<span class="bg-success-light text-success rounded-lg px-2 py-1 text-xs font-medium">VALIDÉ</span>'
                    : '<span class="bg-warning-light text-warning rounded-lg px-2 py-1 text-xs font-medium">EN ATTENTE</span>';
            }
        },
        {
            headerName: 'Zone',
            field: 'zone',
            width: 120,
            sortable: true,
            filter: 'agTextColumnFilter',
            valueFormatter: (params: any) => params.data?.isChild ? (params.value as string) : ''
        },
        {
            headerName: 'Sous-zone',
            field: 'sousZone',
            width: 150,
            sortable: true,
            filter: 'agSelectColumnFilter',
            valueFormatter: (params: any) => params.data?.isChild ? (params.value as string) : ''
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            sortable: false,
            cellRenderer: (params: any) => {
                // Afficher le bouton seulement si la ligne a un location_reference
                if (!params.data.location_reference) {
                    return '';
                }

                // Récupérer l'ID du job de plusieurs façons possibles
                const jobId = params.data.jobId || params.data.job_id || params.data.id || '';
                const locationReference = params.data.location_reference;

                return `<button class="btn-supprimer-emplacement" data-job-id="${jobId}" data-location-id="${locationReference}" style="color: #ef4444; border: none; background: none; cursor: pointer;" title="Supprimer cet emplacement">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>`;
            }
        }
    ];

    // Charger les locations depuis le store
    const loadLocations = async (params?: LocationQueryParams) => {
        try {
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
            console.error('Erreur lors du chargement des locations:', error);
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
    const handleLocationFilterChange = async (newFilters: LocationQueryParams) => {
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
                console.error('Erreur lors de la recherche:', error);
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
        // Initialiser les IDs depuis les références de l'URL
        await initializeIdsFromReferences();

        // Charger les locations et jobs
        await loadLocations();
        await loadJobsFromStore();
    });

    function generateJobReference(): string {
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const jobNumber = (planningJobs.value.length + 1).toString().padStart(3, '0');
        return `JOB-${year}${month}${day}-${jobNumber}`;
    }

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
                const location = locationStore.getLocations.find(loc => loc.id === locationId);
                if (location) {
                    locationIds.push(location.id);
                    locationDetails.push(location.id);
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
            if (warehouseId.value !== null) {
                await jobStore.fetchJobs(warehouseId.value, {
                    page: params?.page || 1,
                    pageSize: params?.pageSize || 20,
                    sort: params?.sort,
                    filter: params?.filter
                });
            } else {
                console.warn('⚠️ warehouseId non disponible, impossible de charger les jobs');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des jobs depuis le store:', error);
        }
    }

    async function createJob(selectedLocations: string[]) {
        if (!selectedLocations.length) {
            await alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
            return false;
        }

        const newJob: PlanningJob = {
            id: crypto.randomUUID(),
            reference: generateJobReference(),
            locations: [...selectedLocations],
            isValidated: false,
            createdAt: new Date().toISOString()
        };

        planningJobs.value.push(newJob);
        await nextTick();
        selectedAvailable.value = [];

        await alertService.success({
            text: `Job ${newJob.reference} créé avec ${newJob.locations.length} emplacement(s)`
        });

        return true;
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

    // Colonnes pour la table des jobs du store (AG Grid)
    const storeJobsColumns: DataTableColumn<Job>[] = [
        {
            headerName: 'ID',
            field: 'id',
            width: 80,
            sortable: true,
            hide: true,
            filter: 'agTextColumnFilter'
        },
        {
            headerName: 'Référence',
            field: 'reference',
            width: 200,
            sortable: true,
            filter: 'agTextColumnFilter',
        },
        {
            headerName: 'Statut',
            field: 'status',
            width: 120,
            sortable: true,
            filter: 'agTextColumnFilter',
            cellRenderer: (params: any) => {
                const status = params.value;
                if (status !== undefined) {
                    let badgeClass = '';
                    switch (status) {
                        case 'EN ATTENTE':
                            badgeClass = 'bg-yellow-100 text-yellow-800';
                            break;
                        case 'VALIDE':
                            badgeClass = 'bg-blue-100 text-blue-800';
                            break;
                        case 'TERMINE':
                            badgeClass = 'bg-green-100 text-green-800';
                            break;
                        default:
                            badgeClass = 'bg-gray-100 text-gray-800';
                    }
                    return `<span class="px-2 py-1 text-xs font-medium rounded-full ${badgeClass}">${status}</span>`;
                }
            }
        },
        {
            headerName: 'Réf. Locations',
            field: 'emplacements',
            width: 200,
            sortable: false,
            cellRenderer: (params: any) => {
                if (Array.isArray(params.value)) {
                    return params.value.map((loc: any) => loc.location_reference).join(', ');
                }
                return '';
            }
        },
        {
            headerName: 'Date création',
            field: 'created_at',
            width: 120,
            sortable: true,
            filter: 'agTextColumnFilter',
            cellRenderer: (params: any) => {
                const date = params.value;
                if (date !== undefined) {
                    return date ? new Date(date).toLocaleDateString() : '-';
                }
            }
        },
        {
            headerName: 'Emplacements',
            field: 'emplacements_count',
            width: 120,
            sortable: true,
            filter: 'agNumberColumnFilter',
            cellRenderer: (params: any) => {
                const count = params.value;
                return count ? `${count} emplacement(s)` : '0';
            },
            detailConfig: {
                key: 'emplacements',
                displayField: 'location_reference',
                labelField: 'location_reference',
                countSuffix: 'emplacement(s)',
                iconCollapsed: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`,
                iconExpanded: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
                columns: [
                    {
                        field: 'location_reference',
                        valueKey: 'location_reference',
                        formatter: (_: unknown, item: any) => {
                            // Récupérer l'ID du job de plusieurs façons possibles
                            const jobId = item.jobId || item.parentRow?.id || item.parent?.id || '';
                            const locationReference = item.location_reference;

                            return `
                                <span style="margin-right: 8px;">${item.location_reference}</span>
                                <button class="btn-supprimer-emplacement" data-job-id="${jobId}" data-location-id="${locationReference}" style="color: #ef4444; border: none; background: none; cursor: pointer;" title="Supprimer cet emplacement">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            `;
                        }
                    }
                ]
            }
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            sortable: false,
            cellRenderer: (params: any) => {
                // Afficher le bouton seulement si la ligne a un location_reference
                if (!params.data.location_reference) {
                    return '';
                }

                // Récupérer l'ID du job de plusieurs façons possibles
                const jobId = params.data.jobId || params.data.job_id || params.data.id || '';
                const locationReference = params.data.location_reference;

                return `<button class="btn-supprimer-emplacement" data-job-id="${jobId}" data-location-id="${locationReference}" style="color: #ef4444; border: none; background: none; cursor: pointer;" title="Supprimer cet emplacement">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>`;
            }
        }
    ];

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
        const params: LocationQueryParams = {
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
    function onAvailableSelectionChanged(rows: any[]) {
        const selectedIds = rows.map(r => String(r.id));
        selectedAvailable.value = selectedIds;
    }

    // Fonction pour gérer la sélection des jobs
    function onJobSelectionChanged(rows: any[]) {
        selectedJobs.value = rows.filter(r => !r.isChild).map(r => String(r.id));
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
        createJob,
        createJobFromSelectedLocations,
        addLocationToJob,
        removeLocationFromJob,
        returnSelectedJobs,
        validateJob,

        // DataTable des locations
        tableData,
        tableColumns,
        availableLocationColumns,
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
        storeJobsColumns,

        // Données des jobs avec expansion
        displayJobsData,
        locationColumns,

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
        refreshIdsFromReferences
    };
}
