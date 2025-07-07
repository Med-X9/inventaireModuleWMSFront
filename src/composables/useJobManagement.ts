import { ref, markRaw, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { JobTable } from '@/models/Job'
import type { DataTableColumn, ActionConfig } from '@/interfaces/dataTable'
import { jobService } from '../services/jobService'
import { alertService } from '@/services/alertService'
import { useJobStore } from '@/stores/job'
import { JobService } from '../services/jobService'

import IconEdit from '@/components/icon/icon-edit.vue'
import IconTrashLines from '@/components/icon/icon-trash-lines.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconClock from '@/components/icon/icon-clock.vue'
import IconPlay from '@/components/icon/icon-play.vue'

export function useJobManagement() {
    const router = useRouter()
    const jobStore = useJobStore();

    // ✅ Utilise un computed pour surveiller le store
    const jobs = computed(() => jobStore.jobs);
    const loading = jobStore.isLoading;

    // États pour les paramètres de tri et filtre
    const currentSortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([]);
    const currentFilterModel = ref<Record<string, { filter: string }>>({});

    // Charger les jobs via store avec paramètres
    const fetchJobs = async (params?: {
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>;
        filter?: Record<string, { filter: string }>;
        page?: number;
        pageSize?: number;
    }) => {
        try {
            // Mettre à jour les modèles actuels si fournis
            if (params?.sort) currentSortModel.value = params.sort;
            if (params?.filter) currentFilterModel.value = params.filter;

            await jobStore.fetchJobs(params);
        } catch (err) {
            console.error('Erreur chargement jobs:', err);
        }
    };

    // Handler pour les changements de pagination
    const handlePaginationChanged = async ({ page, pageSize }: { page: number, pageSize: number }) => {
        console.log('🔄 Pagination jobs changée:', { page, pageSize });
        await fetchJobs({
            page,
            pageSize,
            sort: currentSortModel.value,
            filter: currentFilterModel.value
        });
    };

    // Handler pour les changements de tri
    const handleSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
        currentSortModel.value = sortModel;
        await fetchJobs({
            sort: sortModel,
            filter: currentFilterModel.value
        });
    };

    // Handler pour les changements de filtre
    const handleFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
        currentFilterModel.value = filterModel;
        await fetchJobs({
            sort: currentSortModel.value,
            filter: filterModel
        });
    };

    const columns: DataTableColumn<JobTable>[] = [
        { headerName: 'ID', field: 'id', sortable: true, filter: 'agNumberColumnFilter', description: 'Identifiant' },
        { headerName: 'Référence', field: 'reference', sortable: true, filter: 'agTextColumnFilter', description: 'Référence unique' },
        {
            headerName: 'Status',
            field: 'status',
            sortable: true,
            filter: 'agTextColumnFilter',
            description: 'État du job',
            cellRenderer: (params: any) => {
                let status = params.value;
                let badgeClass = '';

                switch(status) {
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
        },
        { headerName: 'Entrepôt', field: 'warehouse_name', sortable: true, filter: 'agTextColumnFilter', description: 'Entrepôt' },
        { headerName: 'Inventaire', field: 'inventory_reference', sortable: true, filter: 'agTextColumnFilter', description: 'Référence inventaire' },
        { headerName: 'Date attente', field: 'en_attente_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date mise en attente' },
        { headerName: 'Date validation', field: 'valide_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date validation' },
        { headerName: 'Date terminaison', field: 'termine_date', sortable: true, filter: 'agDateColumnFilter', description: 'Date terminaison' },
    ]

    const handleDelete = async (job: JobTable) => {
        try {
            const r = await alertService.confirm({
                title: 'Confirmation',
                text: 'Supprimer ce job ?'
            })
            if (r.isConfirmed) {
                if (typeof job.id === 'number') {
                    await JobService.delete(job.id)
                    await alertService.success({ text: "Job supprimé avec succès" })
                    await fetchJobs()
                } else {
                    await alertService.error({ text: "ID de job invalide" })
                }
            }
        } catch {
            await alertService.error({ text: "Erreur lors de la suppression" })
        }
    }

    const handleValidate = async (job: JobTable) => {
        try {
            const r = await alertService.confirm({
                title: 'Confirmation',
                text: 'Valider ce job ?'
            })
            if (r.isConfirmed) {
                await jobStore.validateJob(job.id)
                await alertService.success({ text: "Job validé avec succès" })
                await fetchJobs()
            }
        } catch {
            await alertService.error({ text: "Erreur lors de la validation" })
        }
    }

    const handleComplete = async (job: JobTable) => {
        try {
            const r = await alertService.confirm({
                title: 'Confirmation',
                text: 'Terminer ce job ?'
            })
            if (r.isConfirmed) {
                await jobStore.completeJob(job.id)
                await alertService.success({ text: "Job terminé avec succès" })
                await fetchJobs()
            }
        } catch {
            await alertService.error({ text: "Erreur lors de la terminaison" })
        }
    }

    const handleSetWaiting = async (job: JobTable) => {
        try {
            const r = await alertService.confirm({
                title: 'Confirmation',
                text: 'Mettre ce job en attente ?'
            })
            if (r.isConfirmed) {
                await jobStore.setJobWaiting(job.id)
                await alertService.success({ text: "Job mis en attente avec succès" })
                await fetchJobs()
            }
        } catch {
            await alertService.error({ text: "Erreur lors de la mise en attente" })
        }
    }

    const actions: ActionConfig<JobTable>[] = [
        {
            label: 'Détail',
            icon: markRaw(IconEye),
            class: 'flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 text-md',
            handler: job => { void router.push({ name: 'job-detail', params: { id: job.id } }) },
            visible: () => true,
        },
        {
            label: 'Valider',
            icon: markRaw(IconCheck),
            class: 'flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-800 text-md',
            handler: handleValidate,
            visible: job => job.status === 'EN ATTENTE',
        },
        {
            label: 'Terminer',
            icon: markRaw(IconPlay),
            class: 'flex items-center gap-1 px-2 py-1 text-emerald-600 hover:text-emerald-800 text-md',
            handler: handleComplete,
            visible: job => job.status === 'VALIDE',
        },
        {
            label: 'Mettre en attente',
            icon: markRaw(IconClock),
            class: 'flex items-center gap-1 px-2 py-1 text-yellow-600 hover:text-yellow-800 text-md',
            handler: handleSetWaiting,
            visible: job => ['VALIDE', 'TERMINE'].includes(job.status),
        },
        {
            label: 'Modifier',
            icon: markRaw(IconEdit),
            class: 'flex items-center gap-1 px-2 py-1 text-orange-600 hover:text-orange-800 text-md',
            handler: job => { void router.push({ name: 'job-edit', params: { id: job.id } }) },
            visible: job => job.status === 'EN ATTENTE',
        },
        {
            label: 'Supprimer',
            icon: markRaw(IconTrashLines),
            class: 'flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 text-md',
            handler: handleDelete,
            visible: job => job.status === 'EN ATTENTE',
        },
    ]

    const redirectToAdd = () => { void router.push({ name: 'job-create' }) }

    return {
        jobs,
        loading,
        columns,
        actions,
        redirectToAdd,
        fetchJobs,
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
    }
}
