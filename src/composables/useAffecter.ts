import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useJobStore } from '@/stores/job';
import { useResourceStore } from '@/stores/resource';
import { useWarehouseStore } from '@/stores/warehouse';
import { useInventoryStore } from '@/stores/inventory';
import { useSessionStore } from '@/stores/session';
import { alertService } from '@/services/alertService';
import { useDataTableFilters, type DataTableParams } from '@/composables/useDataTableFilters';
import type { FieldConfig } from '@/interfaces/form';

const jobStore = useJobStore();
const resourceStore = useResourceStore();
const warehouseStore = useWarehouseStore();
const inventoryStore = useInventoryStore();
const sessionStore = useSessionStore();
const route = useRoute();
const router = useRouter();

export interface RowNode {
    id: string;
    job: string;
    team1: string;
    date1: string;
    team2: string;
    date2: string;
    resources: string;
    resourcesList: string[];
    nbResources: number;
    locations?: string[];
    status: 'AFFECTE' | 'VALIDE' | 'TRANSFER';
    isChild?: boolean;
    parentId?: string | null;
    childType?: 'location' | 'resource';
}

export interface DataTableColumn {
    field: string;
    headerName: string;
    sortable?: boolean;
    filterable?: boolean;
    width?: number;
    flex?: number;
    editable?: boolean;
    dataType?: string;
    cellRenderer?: (params: any) => string;
    filterConfig?: any;
}

export interface RowAction {
    label: string;
    onClick: (row: Record<string, unknown>) => void;
}

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

        return null;
    } catch (error) {
        return null;
    }
};

export function useAffecter(options?: { inventoryReference?: string, warehouseReference?: string }) {
    // Priorité aux options, sinon fallback sur la route
    const inventoryReference = options?.inventoryReference ?? (route.params.reference as string);
    const warehouseReference = options?.warehouseReference ?? (route.params.warehouse as string);

    // IDs récupérés depuis les références
    const inventoryId = ref<number | null>(null);
    const warehouseId = ref<number | null>(null);

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

    const selectedRows = ref<RowNode[]>([]);
    const pendingChanges = ref<Map<string, Map<string, any>>>(new Map());
    const hasUnsavedChanges = computed(() => pendingChanges.value.size > 0);
    const showTeamModal = ref(false);
    const showResourceModal = ref(false);
    const showTransferModal = ref(false);
    const currentTeamType = ref<'premier' | 'deuxieme'>('premier');
    const teamForm = ref<Record<string, unknown>>({ team: '', date: '' });
    const resourceForm = ref({ resources: [] });
    const transferForm = ref({ premierComptage: false, deuxiemeComptage: false });
    const modalTitle = computed(() => `Affecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`);

    const dataTableRef = ref<any>(null);
    const dropdownRef = ref<HTMLElement | null>(null);
    const showDropdown = ref(false);

    const dataTableFilters = useDataTableFilters();

    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalItems = ref(0);
    const totalPages = ref(1);

    const fetchJobsValidated = async (params: DataTableParams) => {
        if (!inventoryId.value || !warehouseId.value) {
            return;
        }

        try {
            dataTableFilters.setLoading(true);

            await jobStore.fetchJobsValidated(inventoryId.value, warehouseId.value, {
                page: params.page || currentPage.value,
                pageSize: params.pageSize || pageSize.value,
                sort: params.sort,
                filter: params.filter
            });

            totalItems.value = jobStore.totalCount;
            totalPages.value = Math.ceil(totalItems.value / pageSize.value);
            currentPage.value = params.page || 1;
            pageSize.value = params.pageSize || pageSize.value;

        } catch (error) {
            console.error('Erreur lors du chargement des jobs:', error);
        } finally {
            dataTableFilters.setLoading(false);
        }
    };

    const handlePaginationChanged = async ({ page, pageSize: newPageSize }: { page: number, pageSize: number }) => {
        await fetchJobsValidated({
            page,
            pageSize: newPageSize,
            sort: dataTableFilters.currentSortModel.value,
            filter: dataTableFilters.currentFilterModel.value,
            globalSearch: dataTableFilters.currentGlobalSearch.value
        });
    };

    const handleSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => {
        await dataTableFilters.handleSortChanged(sortModel, fetchJobsValidated);
    };

    const handleFilterChanged = async (filterModel: Record<string, any>) => {
        await dataTableFilters.handleFilterChanged(filterModel, fetchJobsValidated);
    };

    const handleGlobalSearchChanged = async (searchTerm: string) => {
        await dataTableFilters.handleGlobalSearchChanged(searchTerm, fetchJobsValidated);
    };

    const teamOptions = computed(() => {
        const sessions = sessionStore.getAllSessions;
        return sessions.map(session => ({
            value: session.id.toString(),
            label: session.username
        }));
    });

    const resourceOptions = computed(() => {
        const resources = resourceStore.getResources;
        const options = resources.map(resource => ({
            value: resource.id?.toString() || resource.reference,
            label: resource.libelle || resource.reference || `Ressource ${resource.reference}`
        }));
        console.log('🔍 Options des ressources:', options);
        return options;
    });


    const teamFields = computed((): FieldConfig[] => [
        {
            key: 'team',
            label: 'Équipe',
            type: 'select',
            searchable: true,
            options: teamOptions.value,
            validators: [{ fn: v => !!v, msg: 'Équipe requise' }]
        },
        {
            key: 'date',
            label: 'Date',
            type: 'date',
            validators: [{ fn: v => !!v, msg: 'Date requise' }]
        }
    ]);

    const resourceFields = computed((): FieldConfig[] => [
        {
            key: 'resources',
            label: 'Ressources',
            type: 'select',
            options: resourceOptions.value,
            multiple: true,
            searchable: true,
            clearable: true,
            props: {
                placeholder: 'Sélectionnez une ou plusieurs ressources'
            },
            validators: [{
                fn: v => {
                    console.log('🔍 Validation des ressources:', v, typeof v, Array.isArray(v));
                    return Array.isArray(v) && v.length > 0;
                },
                msg: 'Sélectionnez au moins une ressource'
            }]
        }
    ]);

    const transferFields: FieldConfig[] = [
        {
            key: 'premierComptage',
            label: 'Premier Comptage',
            type: 'checkbox'
        },
        {
            key: 'deuxiemeComptage',
            label: 'Deuxième Comptage',
            type: 'checkbox'
        }
    ];

    const displayData = computed(() => {
        const jobs = jobStore.jobsValidated;
        const newData: RowNode[] = [];

        jobs.forEach((parentRow) => {
            // Trouver les assignments pour premier et deuxième comptage
            const premierAssignment = parentRow.assignments?.find(a => a.counting_order === 1);
            const deuxiemeAssignment = parentRow.assignments?.find(a => a.counting_order === 2);

            // Formater les ressources
            const ressourcesList = (parentRow.ressources || []).map(r => r.reference);
            const ressourcesString = ressourcesList.length > 0 ? ressourcesList.join(', ') : '';

            // Formater les équipes - session est un objet avec username et id
            const team1Name = premierAssignment?.session?.username || premierAssignment?.session?.id?.toString() || '';
            const team2Name = deuxiemeAssignment?.session?.username || deuxiemeAssignment?.session?.id?.toString() || '';

            newData.push({
                id: String(parentRow.id),
                job: parentRow.reference || `Job ${parentRow.id}`,
                locations: parentRow.emplacements ? parentRow.emplacements.map(l => l.reference) : [],
                team1: team1Name,
                date1: premierAssignment?.date_start || '',
                team2: team2Name,
                date2: deuxiemeAssignment?.date_start || '',
                resourcesList: ressourcesList,
                resources: ressourcesString,
                nbResources: ressourcesList.length,
                status: (['AFFECTE', 'VALIDE', 'TRANSFER'].includes(String(parentRow.status)) ? String(parentRow.status) : 'AFFECTE') as 'AFFECTE' | 'VALIDE' | 'TRANSFER',
                isChild: false,
                parentId: null
            });
        });

        return newData;
    });

    function addPendingChange(jobId: string, field: string, value: any) {
        if (!pendingChanges.value.has(jobId)) {
            pendingChanges.value.set(jobId, new Map());
        }
        pendingChanges.value.get(jobId)!.set(field, value);
    }

    async function saveToDatabase(jobId: string, field: string, value: any): Promise<void> {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alertService.error({
                title: 'Erreur de sauvegarde',
                text: 'Les modifications n\'ont pas pu être sauvegardées en base de données.'
            });
            throw error;
        }
    }

    async function saveAllChanges() {
        if (pendingChanges.value.size === 0) {
            alertService.info({ text: 'Aucune modification à sauvegarder.' });
            return;
        }

        try {
            alertService.info({ text: 'Sauvegarde en cours...' });

            // Préparer les données pour assignJobsManual
            const manualAssignments: any[] = [];

            for (const [jobId, changes] of pendingChanges.value.entries()) {
                const jobData: any = {
                    job_id: parseInt(jobId),
                    team1: null,
                    date1: null,
                    team2: null,
                    date2: null,
                    resources: null
                };

                // Traiter chaque changement
                for (const [field, value] of changes.entries()) {
                    switch (field) {
                        case 'team1':
                            // Trouver l'ID de session par username
                            const team1Session = sessionStore.getAllSessions.find(s => s.username === value);
                            jobData.team1 = team1Session ? team1Session.id : null;
                            break;
                        case 'team2':
                            // Trouver l'ID de session par username
                            const team2Session = sessionStore.getAllSessions.find(s => s.username === value);
                            jobData.team2 = team2Session ? team2Session.id : null;
                            break;
                        case 'date1':
                            jobData.date1 = value;
                            break;
                        case 'date2':
                            jobData.date2 = value;
                            break;
                        case 'resources':
                            // Les ressources sont maintenant des IDs directement
                            if (Array.isArray(value)) {
                                const resourceIds = value.map(id => parseInt(id)).filter(id => !isNaN(id));
                                jobData.resources = resourceIds;
                            }
                            break;
                    }
                }

                manualAssignments.push(jobData);
            }

            // Envoyer les modifications via assignJobsManual
            for (const assignment of manualAssignments) {
                await jobStore.assignJobsManual(assignment);
            }

            pendingChanges.value.clear();

            alertService.success({
                text: `${manualAssignments.length} modification(s) sauvegardée(s) avec succès !`
            });

            await fetchJobsValidated({
                page: currentPage.value,
                pageSize: pageSize.value,
                sort: dataTableFilters.currentSortModel.value,
                filter: dataTableFilters.currentFilterModel.value,
                globalSearch: dataTableFilters.currentGlobalSearch.value
            });

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alertService.error({
                title: 'Erreur de sauvegarde',
                text: 'Certaines modifications n\'ont pas pu être sauvegardées. Veuillez réessayer.'
            });
        }
    }

    function onCellValueChanged(event: any) {
        const { data, field, newValue } = event;
        if (!data || data.isChild || !field) return;

        let isValid = true;
        let errorMessage = '';

        switch (field) {
            case 'team1':
            case 'team2':
                const validTeams = sessionStore.getAllSessions.map(session => session.username);
                if (newValue && !validTeams.includes(newValue)) {
                    isValid = false;
                    errorMessage = 'Équipe invalide';
                }
                break;

            case 'status':
                if (newValue && ![ 'AFFECTE', 'VALIDE', 'PRET'].includes(newValue)) {
                    isValid = false;
                    errorMessage = 'Statut invalide';
                }
                break;

            case 'date1':
            case 'date2':
                if (newValue) {
                    const date = new Date(newValue);
                    if (isNaN(date.getTime())) {
                        isValid = false;
                        errorMessage = 'Date invalide';
                    }
                }
                break;

            case 'resources':
                if (newValue && Array.isArray(newValue)) {
                    const validResourceIds = resourceStore.getResources
                        .filter(resource => resource && resource.id !== undefined && resource.id !== null)
                        .map(r => r.id!.toString());
                    const invalidResources = newValue.filter(resource => !validResourceIds.includes(resource));
                    if (invalidResources.length > 0) {
                        isValid = false;
                        errorMessage = `Ressources invalides: ${invalidResources.join(', ')}`;
                    }
                }
                break;
        }

        if (!isValid) {
            alertService.error({
                title: 'Erreur de validation',
                text: errorMessage
            });
            return;
        }

        addPendingChange(data.id, field, newValue);
    }

    function onSelectionChanged(selectedRowsSet: Set<string>) {
        const selectedRowNodes = displayData.value.filter(row =>
            selectedRowsSet.has(row.id) && !row.isChild
        );
        selectedRows.value = selectedRowNodes;
    }

    function onRowClicked(event: any) {
        // Logique de clic sur ligne
    }

    const toggleDropdown = () => {
        showDropdown.value = !showDropdown.value;
    };

    const focusFirstItem = () => {
        if (dropdownRef.value) {
            const firstItem = dropdownRef.value.querySelector('button');
            if (firstItem) {
                (firstItem as HTMLElement).focus();
            }
        }
    };

    const closeDropdown = () => {
        showDropdown.value = false;
    };

    const focusNextItem = () => {
        if (dropdownRef.value) {
            const currentActive = dropdownRef.value.querySelector('.focus-visible');
            const nextButton = currentActive?.nextElementSibling?.querySelector('button');
            if (nextButton) {
                (nextButton as HTMLElement).focus();
            }
        }
    };

    const focusPrevItem = () => {
        if (dropdownRef.value) {
            const currentActive = dropdownRef.value.querySelector('.focus-visible');
            const prevButton = currentActive?.previousElementSibling?.querySelector('button');
            if (prevButton) {
                (prevButton as HTMLElement).focus();
            }
        }
    };

    const dropdownItems = ref([
        { label: 'Affecter 1er Comptage', icon: 'premier', action: handleAffecterPremierComptageClick },
        { label: 'Affecter 2e Comptage', icon: 'deuxieme', action: handleAffecterDeuxiemeComptageClick },
        { label: 'Affecter Ressources', icon: 'ressources', action: handleActionRessourceClick },
    ]);

    const setDropdownItemRef = (el: HTMLElement, index: number) => {
        // Fonction pour les références du dropdown
    };

    async function initializeStores() {
        try {
            if (resourceStore.getResources.length === 0) {
                await resourceStore.fetchResources();
            }

            if (warehouseStore.warehouses.length === 0) {
                await warehouseStore.fetchWarehouses();
            }

            if (sessionStore.getAllSessions.length === 0) {
                await sessionStore.fetchSessions();
            }

        } catch (error) {
            console.error('Erreur lors de l\'initialisation des stores:', error);
            alertService.error({
                text: 'Erreur lors du chargement des données. Veuillez rafraîchir la page.'
            });
        }
    }

    async function loadSessionsIfNeeded() {
        if (sessionStore.getAllSessions.length === 0) {
            try {
                await sessionStore.fetchSessions();
            } catch (error) {
                console.error('Erreur lors du chargement des sessions:', error);
                alertService.error({
                    text: 'Erreur lors du chargement des sessions'
                });
            }
        }
    }

    function handleAffecterPremierComptageClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        currentTeamType.value = 'premier';
        showTeamModal.value = true;
        showDropdown.value = false;
    }

    function handleAffecterDeuxiemeComptageClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        currentTeamType.value = 'deuxieme';
        showTeamModal.value = true;
        showDropdown.value = false;
    }

    function handleActionRessourceClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        showResourceModal.value = true;
        showDropdown.value = false;
    }

    function handleValiderClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        alertService.info({ text: 'La fonction de validation est désactivée pour l\'instant.' });

        selectedRows.value = [];

        fetchJobsValidated({
            page: currentPage.value,
            pageSize: pageSize.value,
            sort: dataTableFilters.currentSortModel.value,
            filter: dataTableFilters.currentFilterModel.value,
            globalSearch: dataTableFilters.currentGlobalSearch.value
        });
    }

    function handleTransfererClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        showTransferModal.value = true;
    }

    function clearAllSelections() {
        selectedRows.value = [];
    }

    async function handleResourceSubmit(data: Record<string, unknown>) {
        const { resources } = data as { resources: string[] };
        console.log('🔍 Données reçues dans handleResourceSubmit:', data);
        console.log('🔍 Ressources sélectionnées:', resources);

        const jobIds = selectedRows.value.map(r => r.id);

        try {
            // Les ressources sont maintenant des IDs directement
            const resourceIds = resources.map(id => parseInt(id)).filter(id => !isNaN(id));

            console.log('🔍 IDs de ressources convertis:', resourceIds);

            if (resourceIds.length === 0) {
                alertService.error({
                    text: 'Aucune ressource valide sélectionnée'
                });
                return;
            }

            await jobStore.assignResourcesToJobs(inventoryId.value!, {
                job_ids: jobIds.map(id => parseInt(id)),
                resource_assignments: resourceIds
            });

            alertService.success({
                text: `${resourceIds.length} ressource(s) affectée(s) à ${jobIds.length} job(s)`
            });

            showResourceModal.value = false;
            resourceForm.value = { resources: [] };
            await fetchJobsValidated({
                page: currentPage.value,
                pageSize: pageSize.value,
                sort: dataTableFilters.currentSortModel.value,
                filter: dataTableFilters.currentFilterModel.value,
                globalSearch: dataTableFilters.currentGlobalSearch.value
            });

        } catch (error) {
            console.error('Erreur lors de l\'affectation des ressources:', error);
            alertService.error({
                text: 'Erreur lors de l\'affectation des ressources'
            });
        }
    }

    async function handleTeamSubmit(data: Record<string, unknown>) {
        const { team, date } = data as { team: string; date: string };
        const jobIds = selectedRows.value.map(r => r.id);

        try {
            await jobStore.assignTeamsToJobs(inventoryId.value!, {
                job_ids: jobIds.map(id => parseInt(id)),
                counting_order: currentTeamType.value === 'premier' ? 1 : 2,
                session_id: parseInt(team), // Maintenant team contient l'ID de session
                date_start: date
            });

            // Trouver le username pour l'affichage
            const session = sessionStore.getAllSessions.find(s => s.id.toString() === team);
            const teamName = session ? session.username : team;

            alertService.success({
                text: `Équipe ${teamName} affectée au ${currentTeamType.value} comptage pour ${jobIds.length} job(s)`
            });

            showTeamModal.value = false;
            teamForm.value = { team: '', date: '' };
            await fetchJobsValidated({
                page: currentPage.value,
                pageSize: pageSize.value,
                sort: dataTableFilters.currentSortModel.value,
                filter: dataTableFilters.currentFilterModel.value,
                globalSearch: dataTableFilters.currentGlobalSearch.value
            });

        } catch (error) {
            console.error('Erreur lors de l\'affectation de l\'équipe:', error);
            alertService.error({
                text: 'Erreur lors de l\'affectation de l\'équipe'
            });
        }
    }

    onMounted(async () => {
        await initializeStores();

        await initializeIdsFromReferences();

        await fetchJobsValidated({
            page: 1,
            pageSize: 10
        });
    });

    onUnmounted(() => {
        // Nettoyage si nécessaire
    });

    return {
        displayData,
        selectedRows,
        pendingChanges,
        hasUnsavedChanges,
        dataTableRef,
        dropdownRef,
        showDropdown,
        showTeamModal,
        showResourceModal,
        showTransferModal,
        modalTitle,
        teamForm,
        teamFields,
        resourceForm,
        resourceFields,
        transferForm,
        transferFields,
        dropdownItems,
        saveAllChanges,
        clearAllSelections,
        onCellValueChanged,
        onSelectionChanged,
        onRowClicked,
        toggleDropdown,
        focusFirstItem,
        closeDropdown,
        focusNextItem,
        focusPrevItem,
        handleValiderClick,
        handleTransfererClick,
        handleResourceSubmit,
        handleTeamSubmit,
        loadSessionsIfNeeded,
        currentPage: computed(() => currentPage.value),
        totalPages: computed(() => totalPages.value),
        totalItems: computed(() => totalItems.value),
        loading: computed(() => dataTableFilters.loading.value),
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,
        // Nouvelles fonctions pour la gestion des IDs
        initializeIdsFromReferences,
        refreshIdsFromReferences,
        inventoryId: computed(() => inventoryId.value),
        warehouseId: computed(() => warehouseId.value),
        inventoryReference: computed(() => inventoryReference),
        warehouseReference: computed(() => warehouseReference)
    };
}
