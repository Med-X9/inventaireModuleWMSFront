import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useJobStore } from '@/stores/job';
import { alertService } from '@/services/alertService';

const jobStore = useJobStore();

// TODO: Remplacer ce mapping par un appel API réel pour obtenir les IDs à partir des références
async function getInventoryIdFromReference(reference: string): Promise<number> {
    return Number(reference) || 1;
}
async function getWarehouseIdFromReference(reference: string): Promise<number> {
    return Number(reference) || 1;
}

export function useAffecter(inventoryReference: string, warehouseReference: string) {
    // --- État global ---
    const inventoryId = ref<number|null>(null);
    const warehouseId = ref<number|null>(null);
    const expandedJobIds = ref<Set<string>>(new Set());
    const expandedResourceIds = ref<Set<string>>(new Set());
    const selectedRows = ref<any[]>([]);
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

    // --- Champs de formulaire ---
    const teamFields = [
        { key: 'team', label: 'Équipe', type: 'select', searchable: true, options: [ { value: 'Team A', label: 'Team A' }, { value: 'Team B', label: 'Team B' }, { value: 'Team C', label: 'Team C' } ], validators: [{ key: 'required', fn: v => !!v, msg: 'Équipe requise' }] },
        { key: 'date', label: 'Date', type: 'date', validators: [{ key: 'required', fn: v => !!v, msg: 'Date requise' }] }
    ];
    const resourceFields = [
        { key: 'resources', label: 'Ressources', type: 'select', options: [ { value: 'Resource A', label: 'Resource A' }, { value: 'Resource B', label: 'Resource B' }, { value: 'Resource C', label: 'Resource C' } ], multiple: true, searchable: true, clearable: true, props: { placeholder: 'Sélectionnez une ou plusieurs ressources' }, validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Sélectionnez au moins une ressource' }] }
    ];
    const transferFields = [
        { key: 'premierComptage', label: 'Premier Comptage', type: 'checkbox', props: { label: 'Transférer le premier comptage', description: 'Transférer les affectations du premier comptage' } },
        { key: 'deuxiemeComptage', label: 'Deuxième Comptage', type: 'checkbox', props: { label: 'Transférer le deuxième comptage', description: 'Transférer les affectations du deuxième comptage' } }
    ];

    // --- Données principales ---
    const rows = computed(() =>
        jobStore.jobsValidated.map(job => ({
            id: job.id,
            job: job.reference || `Job ${job.id}`,
            locations: job.emplacements ? job.emplacements.map(l => l.reference) : [],
            team1: job.assignments && job.assignments[0] && job.assignments[0].session ? String(job.assignments[0].session) : '',
            date1: '',
            team2: job.assignments && job.assignments[1] && job.assignments[1].session ? String(job.assignments[1].session) : '',
            date2: '',
            resourcesList: job.ressources || [],
            resources: job.ressources ? job.ressources.join(', ') : '',
            nbResources: job.ressources ? job.ressources.length : 0,
            status: job.status || 'planifier'
        }))
    );
    const displayData = ref<any[]>([]);

    // --- Méthodes ---
    function rebuildDisplayData() {
        const newData: any[] = [];
        rows.value.forEach((parentRow) => {
            newData.push({ ...parentRow, isChild: false, parentId: null });
            if (expandedJobIds.value.has(String(parentRow.id))) {
                const locs = parentRow.locations || [];
                locs.forEach((location) => {
                    newData.push({
                        id: `${String(parentRow.id)}--location--${location}`,
                        job: `└─ ${location}`,
                        team1: '', date1: '', team2: '', date2: '', resources: '', resourcesList: [], nbResources: 0,
                        status: parentRow.status,
                        isChild: true, parentId: String(parentRow.id), childType: 'location'
                    });
                });
            }
            if (expandedResourceIds.value.has(String(parentRow.id))) {
                const resources = parentRow.resourcesList || [];
                resources.forEach((resource) => {
                    newData.push({
                        id: `${String(parentRow.id)}--resource--${resource}`,
                        job: '', team1: '', date1: '', team2: '', date2: '',
                        resources: `└─ ${resource}`, resourcesList: [], nbResources: 0,
                        status: parentRow.status,
                        isChild: true, parentId: String(parentRow.id), childType: 'resource'
                    });
                });
            }
        });
        displayData.value = newData;
    }

    function handleAffecterPremierComptageClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        currentTeamType.value = 'premier';
        showTeamModal.value = true;
        // showAssignmentDropdown.value = false;
    }
    function handleAffecterDeuxiemeComptageClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        currentTeamType.value = 'deuxieme';
        showTeamModal.value = true;
        // showAssignmentDropdown.value = false;
    }
    function handleValiderClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        alertService.info({ text: 'La fonction de validation est désactivée pour l\'instant.' });
        rebuildDisplayData();
    }
    async function handleResourceSubmit(data: Record<string, unknown>) {
        alertService.info({ text: 'La fonction d\'affectation de ressources est désactivée pour l\'instant.' });
        showResourceModal.value = false;
        resourceForm.value = { resources: [] };
        rebuildDisplayData();
    }
    async function handleTeamSubmit(data: Record<string, unknown>) {
        alertService.info({ text: 'La fonction d\'affectation de comptage est désactivée pour l\'instant.' });
        showTeamModal.value = false;
        teamForm.value = { team: '', date: '' };
        rebuildDisplayData();
    }
    function handleTransfererClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
            return;
        }
        alertService.info({ text: 'La fonction de transfert de comptage est désactivée pour l\'instant.' });
        showTransferModal.value = false;
        transferForm.value = { premierComptage: false, deuxiemeComptage: false };
        rebuildDisplayData();
    }
    function onSelectionChanged(rowsData: any[]) {
        selectedRows.value = rowsData.filter((r: any) => !r.isChild);
    }

    // --- Lifecycle ---
    onMounted(async () => {
        inventoryId.value = await getInventoryIdFromReference(inventoryReference);
        warehouseId.value = await getWarehouseIdFromReference(warehouseReference);
        if (inventoryId.value && warehouseId.value) {
            await jobStore.fetchJobsValidated(inventoryId.value, warehouseId.value);
        }
        rebuildDisplayData();
        document.addEventListener('click', () => {}); // placeholder pour click outside
    });
    onUnmounted(() => {
        document.removeEventListener('click', () => {});
    });

    return {
        rows,
        displayData,
        expandedJobIds,
        expandedResourceIds,
        selectedRows,
        pendingChanges,
        hasUnsavedChanges,
        showTeamModal,
        showResourceModal,
        showTransferModal,
        currentTeamType,
        modalTitle,
        teamForm,
        teamFields,
        resourceForm,
        resourceFields,
        transferForm,
        transferFields,
        rebuildDisplayData,
        handleAffecterPremierComptageClick,
        handleAffecterDeuxiemeComptageClick,
        handleValiderClick,
        handleResourceSubmit,
        handleTeamSubmit,
        handleTransfererClick,
        onSelectionChanged
    };
}
