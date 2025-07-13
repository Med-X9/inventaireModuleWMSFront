<!-- <template>
    <div class="panel py-7 datatable">
        <DataTable :columns="columns" :rowDataProp="displayData" :actions="actions" :pagination="true"
            :enableFiltering="true" :rowSelection="true" @selection-changed="onSelectionChanged"
            @row-clicked="onRowClicked" storageKey="jobs_management_table">
            <template #table-actions>
                <button class="btn btn-primary mb-4" @click="launchSelected">
                    Transfer
                </button>
            </template>
        </DataTable>
    </div>
</template> -->

<script setup lang="ts">
import { ref, computed } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import { alertService } from '@/services/alertService';
import type { ActionConfig, TableRow } from '@/interfaces/dataTable';
import type { ColDef, CellClassParams, CellClickedEvent, RowClickedEvent } from 'ag-grid-community';

interface Job extends TableRow {
    id: number;
    name: string;
    status: string;
    reference?: string;
    premierComptage?: string;
    deuxiemeComptage?: string;
    locations?: string[];
}

const jobs = ref<Job[]>([
    { id: 1, name: 'JOB-A', status: 'En attente', reference: 'REF-A-2024', premierComptage: 'Premier Comptage A', deuxiemeComptage: 'Deuxième Comptage A', locations: ['Emplacement A1', 'Emplacement A2', 'Emplacement A3'] },
    { id: 2, name: 'JOB-B', status: 'En cours', reference: 'REF-B-2024', premierComptage: 'Premier Comptage B', deuxiemeComptage: 'Deuxième Comptage B', locations: ['Emplacement B1'] },
    { id: 3, name: 'JOB-C', status: 'Terminé', reference: 'REF-C-2024', premierComptage: 'Premier Comptage C', deuxiemeComptage: 'Deuxième Comptage C', locations: ['Emplacement C1', 'Emplacement C2'] },
    { id: 4, name: 'JOB-D', status: 'En attente', reference: 'REF-D-2024', premierComptage: 'Premier Comptage D', deuxiemeComptage: 'Deuxième Comptage D', locations: ['Emplacement D1', 'Emplacement D2', 'Emplacement D3', 'Emplacement D4'] },
]);

const selectedJobs = ref<Job[]>([]);
const expandedReferences = ref<Set<string>>(new Set());
const expandedComptages = ref<Set<string>>(new Set());

const displayData = computed(() => {
    const result: any[] = [];

    jobs.value.forEach(job => {
        // 1. La référence
        const refId = `ref-${job.id}`;
        result.push({
            id: refId,
            name: job.reference,
            status: job.status,
            isChild: false,
            parentId: null,
            level: 0,
            type: 'reference',
            originalJob: job
        });

        if (!expandedReferences.value.has(refId)) {
            return; // pas de comptages si non étendue
        }

        // 2. Pour chaque type de comptage, on pousse d'abord la ligne, puis ses emplacements
        [
            { key: 'premier', label: job.premierComptage },
            { key: 'deuxieme', label: job.deuxiemeComptage }
        ].forEach(({ key, label }) => {
            const comptageId = `${key}-${job.id}`;
            // la ligne de comptage
            result.push({
                id: comptageId,
                name: label,
                status: job.status,
                isChild: true,
                parentId: refId,
                level: 1,
                type: `${key}-comptage`,
                originalJob: job
            });

            // si ce comptage est étendu => emplacements
            if (expandedComptages.value.has(comptageId)) {
                job.locations?.forEach((loc, idx) => {
                    result.push({
                        id: `${comptageId}-${idx}`,
                        name: loc,
                        status: job.status,
                        isChild: true,
                        parentId: comptageId,
                        level: 1,
                        type: 'location',
                        comptageType: key
                    });
                });
            }
        });
    });

    return result;
});

const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'en attente': return 'bg-warning-light text-warning';
        case 'en cours': return 'bg-info-light text-info';
        case 'terminé': return 'bg-success-light text-success';
        default: return 'bg-gray-100 text-gray-600';
    }
};

const columns: ColDef[] = [
    {
        headerName: 'Jobs',
        field: 'name',
        sortable: true,
        filter: 'agTextColumnFilter',
        flex: 3,
        cellStyle: (params: CellClassParams) => ({
            paddingLeft: `${(params.data?.level || 0) * 25 + 10}px`
        }),
        cellRenderer: (params) => {
            if (!params.data) return '';
            const { id, type, originalJob } = params.data as any;
            let canExpand = false;
            let isExpanded = false;

            if (type === 'reference') {
                canExpand = true;
                isExpanded = expandedReferences.value.has(id);
            } else if (type.endsWith('-comptage')) {
                canExpand = originalJob?.locations?.length > 0;
                isExpanded = expandedComptages.value.has(id);
            }

            const arrow = isExpanded
                ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`
                : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg>`;

            const prefix = canExpand
                ? `<span data-expand-toggle="${id}" style="cursor:pointer;display:inline-flex;align-items:center;width:20px;margin-right:8px;" title="Cliquer pour déplier/replier">${arrow}</span>`
                : `<span style="display:inline-block;width:20px;margin-right:8px;"></span>`;

            return `<div style="display:flex;align-items:center;width:100%;">${prefix}<span>${params.value}</span></div>`;
        },
        onCellClicked: (params: CellClickedEvent) => {
            const evt = params.event;
            if (!evt) return;

            const toggleEl = (evt.target as HTMLElement).closest('[data-expand-toggle]');
            if (!toggleEl) return;

            const key = toggleEl.getAttribute('data-expand-toggle')!;
            if (key.startsWith('ref-')) {
                if (expandedReferences.value.has(key)) {
                    expandedReferences.value.delete(key);
                    // fermer tous les comptages associés
                    const jobId = key.replace('ref-', '');
                    expandedComptages.value.delete(`premier-${jobId}`);
                    expandedComptages.value.delete(`deuxieme-${jobId}`);
                } else {
                    expandedReferences.value.add(key);
                }
            } else {
                if (expandedComptages.value.has(key)) {
                    expandedComptages.value.delete(key);
                } else {
                    expandedComptages.value.add(key);
                }
            }
        }
    },
    {
        headerName: 'Statut',
        field: 'status',
        sortable: true,
        filter: 'agTextColumnFilter',
        flex: 1,
        cellRenderer: (params) => {
            if (!params.data || (params.data as any).level !== 0) return '';
            return `<span class="px-3 py-1 rounded-full text-sm ${getStatusClass(params.value as string)}">${params.value}</span>`;
        }
    }
];

const actions: ActionConfig[] = [
    {
        label: 'Transfer',
        handler: async (row) => {
            if (!row.isChild) {
                try {
                    const result = await alertService.confirm({
                        title: 'Transfer le job',
                        text: `Voulez-vous vraiment Transfer le job "${row.name}" ?`
                    });

                    if (result.isConfirmed) {
                        console.log('Lancement du job :', row);
                        // Placez ici votre logique de lancement du job

                        await alertService.success({
                            text: `Le job "${row.name}" a été lancé avec succès !`
                        });
                    }
                } catch (error) {
                    await alertService.error({
                        text: 'Une erreur est survenue lors du lancement du job.'
                    });
                }
            }
        }
    }
];

function onSelectionChanged(rows: TableRow[]) {
    // Ne garder que les références (niveau 0)
    selectedJobs.value = rows.filter(r => (r as any).level === 0) as Job[];
}

function onRowClicked(event: RowClickedEvent) {
    // Tout est géré dans onCellClicked
}

/**
 * Lancement de la sélection :
 * - Alerte si rien n'est sélectionné
 * - Confirmation si au moins un job sélectionné
 * - Succès après validation
 */
async function launchSelected() {
    if (selectedJobs.value.length === 0) {
        await alertService.warning({
            title: 'Aucune sélection',
            text: 'Veuillez sélectionner au moins un job à transférer.'
        });
        return;
    }

    const noms = selectedJobs.value.map(j => j.name).join(', ');

    try {
        const result = await alertService.confirm({
            title: 'Confirmer le transfert',
            text: `Vous êtes sur le point de transférer les jobs suivants :\n${noms}\n\nConfirmez-vous cette action ?`
        });

        if (!result.isConfirmed) {
            return;
        }

        // Placez ici votre logique de transfert réel
        console.log('Transfert lancé pour :', selectedJobs.value);

        // Simulation d'un appel API avec un délai
        // await transferJobsAPI(selectedJobs.value);

        await alertService.success({
            title: 'Transfert réussi',
            text: `Le transfert de ${selectedJobs.value.length} job(s) a été effectué avec succès !`
        });

    } catch (error) {
        console.error('Erreur lors du transfert :', error);
        await alertService.error({
            title: 'Erreur de transfert',
            text: 'Une erreur est survenue lors du transfert des jobs. Veuillez réessayer.'
        });
    }
}

const launchJob = async (row: any) => {
    try {
        // Logique de lancement du job
    } catch (error) {
        console.error('Erreur lors du lancement du job:', error);
    }
};

const launchTransfer = async () => {
    try {
        // Logique de lancement du transfert
    } catch (error) {
        console.error('Erreur lors du lancement du transfert:', error);
    }
};
</script>

<style scoped>
.datatable :deep(.ag-cell) {
    display: flex;
    align-items: center;
}

:deep(.ag-row[data-level="1"]) {
    background-color: #f8fafc;
}

:deep(.ag-row[data-is-child="true"] .ag-cell) {
    border-bottom: 1px solid #e9ecef;
}

:deep([data-expand-toggle]) {
    transition: transform 0.2s ease;
}

:deep([data-expand-toggle]:hover) {
    transform: scale(1.1);
}
</style>
