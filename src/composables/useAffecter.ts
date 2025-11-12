import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useJobStore } from '@/stores/job';
import { useResourceStore } from '@/stores/resource';
import { useWarehouseStore } from '@/stores/warehouse';
import { useInventoryStore } from '@/stores/inventory';
import { useSessionStore } from '@/stores/session';
import { alertService } from '@/services/alertService';
import { logger } from '@/services/loggerService';
import { useJobValidatedDataTable } from '@/composables/useJobValidatedDataTable';
import type { FieldConfig } from '@/interfaces/form';
import { JobManualAssignmentsRequest } from '@/models/Job';

const jobStore = useJobStore();
const resourceStore = useResourceStore();
const warehouseStore = useWarehouseStore();
const inventoryStore = useInventoryStore();
const sessionStore = useSessionStore();
const route = useRoute();

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
    status: 'AFFECTE' | 'VALIDE' | 'TRANSFERT'| 'PRET';
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

// Fonction pour parser les dates depuis l'éditeur
export const dateValueParser = (params: any) => {
    if (!params.newValue) return '';

    const newVal = params.newValue;
    if (
        newVal !== null
        && typeof newVal === 'object'
        && Object.prototype.toString.call(newVal) === '[object Date]'
    ) {
        return (newVal as Date).toISOString().split('T')[0];
    }

    if (typeof params.newValue === 'string') {
        if (params.newValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return params.newValue;
        }

        try {
            const date = new Date(params.newValue);
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }

    return '';
};

// Fonction pour setter les valeurs de date
export const dateValueSetter = (params: any) => {
    if (!params.data || params.data.isChild) return false;

    const parsedValue = dateValueParser(params);
    const field = params.colDef.field!;
    const oldValue = params.data[field];

    if (parsedValue !== oldValue) {
        params.data[field] = parsedValue;
        return true;
    }

    return false;
};

export function useAffecter(options?: { inventoryReference?: string, warehouseReference?: string }) {
    const router = useRouter();

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

    // État réactif pour le composable DataTable
    const jobValidatedDataTableRef = ref<any>(null);

    // État pour le statut de l'inventaire
    const inventoryStatus = ref<string>('');

    // Fonction pour récupérer le statut de l'inventaire
    const fetchInventoryStatus = async () => {
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference);
            if (inventory) {
                inventoryStatus.value = inventory.status;
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération du statut de l\'inventaire', error);
        }
    };

    // Fonction pour initialiser le composable DataTable
    const initializeDataTable = () => {
        if (inventoryId.value && warehouseId.value && !jobValidatedDataTableRef.value) {
            jobValidatedDataTableRef.value = useJobValidatedDataTable(inventoryId.value, warehouseId.value);
        }
    };

    // Watch pour réinitialiser le composable quand les IDs changent
    watch([inventoryId, warehouseId], ([newInventoryId, newWarehouseId]) => {
        if (newInventoryId && newWarehouseId) {
            jobValidatedDataTableRef.value = useJobValidatedDataTable(newInventoryId, newWarehouseId);
        }
    });

    const handlePaginationChanged = async ({ page, pageSize: newPageSize }: { page: number, pageSize: number }) => {
        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.handlePaginationChanged({ page, pageSize: newPageSize });
        }
    };

    const handleSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => {
        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.handleSortChanged(sortModel);
        }
    };

    const handleFilterChanged = async (filterModel: Record<string, any>) => {
        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.handleFilterChanged(filterModel);
        }
    };

    const handleGlobalSearchChanged = async (searchTerm: string) => {
        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.handleSearchChanged(searchTerm);
        }
    };

    const teamOptions = computed(() => {
        const sessions = sessionStore.getAllSessions;
        return sessions.map(session => ({
            value: session.id.toString(),
            label: session.username
        }));
    });

    // resourceOptions est maintenant défini plus bas avec sessionOptions


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
        // Utiliser les données du composable générique si disponible, sinon fallback sur le store
        const jobs = jobValidatedDataTableRef.value?.data.value || jobStore.jobsValidated;
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
                status: (['AFFECTE', 'VALIDE', 'TRANSFERT', 'PRET'].includes(String(parentRow.status)) ? String(parentRow.status) : 'AFFECTE') as 'AFFECTE' | 'VALIDE' | 'TRANSFERT' | 'PRET',
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


    async function saveAllChanges() {
        if (pendingChanges.value.size === 0) {
            alertService.info({ text: 'Aucune modification à sauvegarder.' });
            return;
        }

        try {
            alertService.info({ text: 'Sauvegarde en cours...' });

            // Préparer les données pour assignJobsManual
            const manualAssignments: JobManualAssignmentsRequest[] = [];

            for (const [jobId, changes] of pendingChanges.value.entries()) {
                const jobData: JobManualAssignmentsRequest = {
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
                            // Les ressources peuvent être des IDs ou des références
                            if (Array.isArray(value)) {
                                const resourceIds: number[] = [];
                                for (const resourceValue of value) {
                                    // Essayer d'abord de convertir en ID numérique
                                    const numericId = parseInt(resourceValue);
                                    if (!isNaN(numericId)) {
                                        resourceIds.push(numericId);
                                    } else {
                                        // Si ce n'est pas un ID numérique, chercher la ressource par référence
                                        const resource = resourceStore.getResources.find(r => r.reference === resourceValue);
                                        if (resource && resource.id) {
                                            resourceIds.push(resource.id);
                                        }
                                    }
                                }
                                jobData.resources = resourceIds;
                            }
                            break;
                    }
                }

                manualAssignments.push(jobData);
            }

            // Envoyer les modifications via assignJobsManual

            await jobStore.assignJobsManual(manualAssignments);


            pendingChanges.value.clear();

            alertService.success({
                text: `${manualAssignments.length} modification(s) sauvegardée(s) avec succès !`
            });

            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh();
            }

        } catch (error) {
            logger.error('Erreur lors de la sauvegarde', error);
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
                    const validResourceReferences = resourceStore.getResources
                        .filter(resource => resource && resource.reference)
                        .map(r => r.reference);
                    const allValidValues = [...validResourceIds, ...validResourceReferences];
                    const invalidResources = newValue.filter(resource => !allValidValues.includes(resource));
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
            logger.error('Erreur lors de l\'initialisation des stores', error);
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
                logger.error('Erreur lors du chargement des sessions', error);
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

    async function handleValiderClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        alertService.info({ text: 'La fonction de validation est désactivée pour l\'instant.' });

        selectedRows.value = [];

        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.refresh();
        }
    }


    function clearAllSelections() {
        selectedRows.value = [];
    }

    async function handleReadyClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        const jobIds: number[] = selectedRows.value.map(r => parseInt(r.id));
        await jobStore.jobReady(jobIds);
        alertService.success({ text: `${jobIds.length} job(s) mis en statut 'Prêt' avec succès !` });
        selectedRows.value = [];
        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.refresh();
        }
    }

    async function handleResetClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        const jobIds: number[] = selectedRows.value.map(r => parseInt(r.id));
        await jobStore.jobReset(jobIds);
        alertService.success({ text: `${jobIds.length} job(s) réinitialisés avec succès !` });
        selectedRows.value = [];
        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.refresh();
        }
    }

    // Fonctions de navigation
    const handleGoToInventoryDetail = () => {
        router.push({
            name: 'inventory-detail',
            params: { reference: inventoryReference }
        });
    };

    const handleGoToAffectation = () => {
        router.push({
            name: 'inventory-planning',
            params: {
                reference: inventoryReference,
                warehouse: warehouseReference
            }
        });
    };

    const handleTransferClick = () => {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }

        // Filtrer les jobs éligibles pour le transfert (seulement PRET)
        const eligibleJobs = selectedRows.value.filter(job => job.status === 'PRET');
        const ineligibleJobs = selectedRows.value.filter(job => job.status !== 'PRET');

        if (eligibleJobs.length === 0) {
            alertService.warning({
                text: 'Aucun job éligible pour le transfert. Seuls les jobs en statut PRET peuvent être transférés.'
            });
            return;
        }

        if (ineligibleJobs.length > 0) {
            alertService.info({
                text: `${eligibleJobs.length} job(s) éligible(s). ${ineligibleJobs.length} job(s) ne sont pas en statut PRET.`
            });
        }

        showTransferModal.value = true;
    };

    // Computed pour obtenir les jobs éligibles au transfert (seulement PRET)
    const eligibleJobsForTransfer = computed(() => {
        return selectedRows.value.filter(job => job.status === 'PRET');
    });

    const handleTransferSubmit = async (data: Record<string, unknown>) => {
        const { premierComptage, deuxiemeComptage } = data as { premierComptage: boolean; deuxiemeComptage: boolean };

        // Déterminer les ordres de comptage à transférer
        const countingOrder: number[] = [];
        if (premierComptage) countingOrder.push(1);
        if (deuxiemeComptage) countingOrder.push(2);

        if (countingOrder.length === 0) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un comptage à transférer.' });
            return;
        }

        // Utiliser uniquement les jobs éligibles (seulement PRET)
        const eligibleJobIds = selectedRows.value
            .filter(job => job.status === 'PRET')
            .map(r => parseInt(r.id));

        try {
            await jobStore.jobTransfer(eligibleJobIds, countingOrder);

            alertService.success({
                text: `${eligibleJobIds.length} job(s) transféré(s) avec succès pour ${countingOrder.length === 2 ? 'les deux comptages' : countingOrder[0] === 1 ? 'le 1er comptage' : 'le 2e comptage'}`
            });

            showTransferModal.value = false;
            transferForm.value = { premierComptage: false, deuxiemeComptage: false };
            selectedRows.value = [];

            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh();
            }
        } catch (error) {
            logger.error('Erreur lors du transfert des jobs', error);
            alertService.error({
                text: 'Erreur lors du transfert des jobs'
            });
        }
    };

    async function handleResourceSubmit(data: Record<string, unknown>) {
        const { resources } = data as { resources: string[] };


        const jobIds = selectedRows.value.map(r => r.id);

        try {
            // Les ressources peuvent être des IDs ou des références
            const resourceIds: number[] = [];
            for (const resourceValue of resources) {
                // Essayer d'abord de convertir en ID numérique
                const numericId = parseInt(resourceValue);
                if (!isNaN(numericId)) {
                    resourceIds.push(numericId);
                } else {
                    // Si ce n'est pas un ID numérique, chercher la ressource par référence
                    const resource = resourceStore.getResources.find(r => r.reference === resourceValue);
                    if (resource && resource.id) {
                        resourceIds.push(resource.id);
                    }
                }
            }


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
            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh();
            }

        } catch (error) {
            logger.error('Erreur lors de l\'affectation des ressources', error);
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
            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh();
            }

        } catch (error) {
            logger.error('Erreur lors de l\'affectation de l\'équipe', error);
            alertService.error({
                text: 'Erreur lors de l\'affectation de l\'équipe'
            });
        }
    }

    // Computed pour vérifier si on doit afficher le bouton de transfert
    const showTransferButton = computed(() => {
        return inventoryStatus.value === 'EN REALISATION';
    });

    // Computed pour vérifier si on doit afficher le bouton prêt
    const showReadyButton = computed(() => {
        return inventoryStatus.value === 'EN PREPARATION';
    });

    // Computed réactif pour les options des sessions
    const sessionOptions = computed(() => {
        const sessions = sessionStore.getAllSessions;

        if (sessions.length === 0) {
            loadSessionsIfNeeded();
            return [];
        }

        const options = sessions.map(session => ({
            value: session.username,
            label: session.username
        }));
        return options;
    });

    // Computed pour les options de ressources
    const resourceOptions = computed(() => {
        const resources = resourceStore.getResources;

        if (resources.length === 0) {
            resourceStore.fetchResources();
            return [];
        }

        const options = resources.map(resource => ({
            value: resource.id?.toString() || resource.reference,
            label: resource.ressource_nom || resource.reference || `Ressource ${resource.reference}`
        }));
        return options;
    });

    // Computed réactif pour les colonnes de DataTable
    const columns = computed(() => {
        const cols: any[] = [
            {
                field: 'job',
                headerName: 'Job',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: false,
                dataType: 'text' as const,
                nestedData: {
                    key: 'locations',
                    displayKey: 'location_reference',
                    countSuffix: 'emplacements',
                    expandable: true,
                }
            },
            {
                field: 'status',
                headerName: 'Statut',
                sortable: true,
                filterable: true,
                width: 40,
                flex: 1,
                editable: false,
                dataType: 'select' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Sélectionner un statut...';
                    }
                    return value;
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: [
                        { value: 'AFFECTE', label: 'AFFECTE' },
                        { value: 'VALIDE', label: 'VALIDE' },
                        { value: 'TRANSFERE', label: 'TRANSFERE' }
                    ]
                },
                badgeStyles: [
                    { value: 'VALIDE', class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset' },
                    { value: 'AFFECTE', class: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset' },
                    { value: 'TRANSFERT', class: 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset' },
                    { value: 'PRET', class: 'inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800 ring-1 ring-purple-600/20 ring-inset' },
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
            },
            {
                field: 'team1',
                headerName: 'Équipe 1er Comptage',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: true,
                dataType: 'select' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Sélectionner une équipe...';
                    }
                    return value;
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: sessionOptions.value
                }
            },
            {
                field: 'date1',
                headerName: 'Date 1er Comptage',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: true,
                dataType: 'date' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Choisir une date...';
                    }
                    try {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return '';
                        return date.toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    } catch {
                        return value;
                    }
                }
            },
            {
                field: 'team2',
                headerName: 'Équipe 2e Comptage',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: true,
                dataType: 'select' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Sélectionner une équipe...';
                    }
                    return value;
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: sessionOptions.value
                }
            },
            {
                field: 'date2',
                headerName: 'Date 2e Comptage',
                sortable: true,
                filterable: true,
                width: 100,
                flex: 1,
                editable: true,
                dataType: 'date' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Choisir une date...';
                    }
                    try {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return '';
                        return date.toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    } catch {
                        return value;
                    }
                }
            },
            {
                field: 'resources',
                headerName: 'Ressources',
                sortable: true,
                filterable: true,
                width: 100,
                flex: 1,
                editable: true,
                dataType: 'select' as const,
                multiple: true,
                editValueFormatter: (value: any) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        return 'Sélectionner des ressources...';
                    }
                    if (Array.isArray(value)) {
                        return value.join(', ');
                    }
                    return value;
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: resourceOptions.value
                }
            }
        ];

        return cols;
    });

    onMounted(async () => {
        await initializeStores();

        await initializeIdsFromReferences();

        // Récupérer le statut de l'inventaire
        await fetchInventoryStatus();

        // Initialiser le DataTable et charger les données
        initializeDataTable();
        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.loadData();
        }
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
        handleResourceSubmit,
        handleTeamSubmit,
        handleTransferSubmit,
        loadSessionsIfNeeded,
        handleReadyClick,
        handleResetClick,
        handleGoToInventoryDetail,
        handleGoToAffectation,
        handleTransferClick,
        currentPage: computed(() => jobValidatedDataTableRef.value?.currentPage.value || 1),
        totalPages: computed(() => jobValidatedDataTableRef.value?.pagination.value.total_pages || 1),
        totalItems: computed(() => jobValidatedDataTableRef.value?.pagination.value.total || 0),
        loading: computed(() => jobValidatedDataTableRef.value?.loading.value || false),
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,
        // Nouvelles fonctions pour la gestion des IDs
        initializeIdsFromReferences,
        refreshIdsFromReferences,
        inventoryId: computed(() => inventoryId.value),
        warehouseId: computed(() => warehouseId.value),
        inventoryReference,
        warehouseReference,
        eligibleJobsForTransfer,
        // Nouvelles propriétés pour la configuration de DataTable
        columns,
        sessionOptions,
        resourceOptions,
        showTransferButton,
        showReadyButton,
        // Fonctions utilitaires pour les dates
        dateValueParser,
        dateValueSetter
    };
}
