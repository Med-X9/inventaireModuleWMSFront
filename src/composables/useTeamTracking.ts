/**
 * Page « Suivi par équipe » : jobs de chaque équipe mobile avec leur statut.
 *
 * API : GET …/inventory/<id>/warehouse/<id>/teams-tracking/
 */
import { computed, ref } from 'vue'
import type { DataTableColumn } from '@SMATCH-Digital-dev/vue-system-design'
import axiosInstance from '@/utils/axiosConfig'
import { logger } from '@/services/loggerService'
import { useInventoryStore } from '@/stores/inventory'

interface TeamJobApi {
    job_id: number
    job_reference: string
    counting_order: number | null
    status: 'EN ATTENTE' | 'ENTAME' | 'TERMINE' | 'BLOQUE'
}

interface TeamApi {
    session_id: number
    team: string
    team_name: string | null
    jobs: TeamJobApi[]
    jobs_en_attente: number
    jobs_entame: number
    jobs_termine: number
    jobs_bloque: number
    jobs_total: number
}

export interface TeamTrackingRow {
    id: string
    team: string
    jobs: Array<Record<string, any>>
    jobsEnAttente: number
    jobsEntame: number
    jobsTermine: number
    jobsBloque: number
}

const MARK = '●'
const countingLabel = (order: number | null) => (order === 1 ? '1er' : order ? `${order}e` : '-')

export function useTeamTracking(inventoryReference: string, warehouseParam: string) {
    const inventoryStore = useInventoryStore()
    const rows = ref<TeamTrackingRow[]>([])
    const loading = ref(true)
    const errorMessage = ref<string | null>(null)
    const warehouseLabel = ref('')

    const columns = computed<DataTableColumn[]>(() => [
        {
            headerName: 'Équipe',
            field: 'team',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 200
        },
        {
            headerName: 'Jobs',
            field: 'jobs',
            sortable: false,
            filterable: false,
            dataType: 'text',
            width: 220,
            description: 'Jobs de l’équipe et statut par comptage',
            nestedData: {
                key: 'jobs',
                displayKey: 'job',
                countSuffix: 'jobs',
                expandable: true,
                showCount: true,
                title: 'Jobs de l’équipe',
                columns: [
                    { field: 'job', headerName: 'Job', sortable: true, filterable: true, width: 130 },
                    { field: 'comptage', headerName: 'Comptage', sortable: true, filterable: true, width: 110 },
                    { field: 'enAttente', headerName: 'EN ATTENTE', sortable: true, filterable: false, width: 120 },
                    { field: 'entame', headerName: 'ENTAME', sortable: true, filterable: false, width: 110 },
                    { field: 'termine', headerName: 'TERMINE', sortable: true, filterable: false, width: 110 },
                    { field: 'bloque', headerName: 'BLOQUE', sortable: true, filterable: false, width: 110 }
                ]
            }
        } as any,
        { headerName: 'Jobs en attente', field: 'jobsEnAttente', sortable: true, filterable: true, dataType: 'number', width: 150 },
        { headerName: 'Jobs entamés', field: 'jobsEntame', sortable: true, filterable: true, dataType: 'number', width: 150 },
        { headerName: 'Jobs terminés', field: 'jobsTermine', sortable: true, filterable: true, dataType: 'number', width: 150 },
        { headerName: 'Jobs bloqués', field: 'jobsBloque', sortable: true, filterable: true, dataType: 'number', width: 150 }
    ])

    async function load() {
        loading.value = true
        errorMessage.value = null
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
            if (!inventory) throw new Error(`Inventaire "${inventoryReference}" introuvable`)
            const inventoryId = Number(inventory.id)

            const warehouses: any[] = Array.isArray((inventory as any).warehouses) ? (inventory as any).warehouses : []
            const match = warehouses.find(
                (w) =>
                    String(w.reference) === warehouseParam ||
                    String(w.id ?? w.warehouse_id) === warehouseParam ||
                    String(w.warehouse_name) === warehouseParam
            )
            if (!match) throw new Error(`Magasin "${warehouseParam}" introuvable dans cet inventaire`)
            const warehouseId = Number(match.id ?? match.warehouse_id)
            warehouseLabel.value = String(match.warehouse_name || match.reference || `Entrepôt ${warehouseId}`)

            const response = await axiosInstance.get(
                `/web/api/inventory/${inventoryId}/warehouse/${warehouseId}/teams-tracking/`
            )
            const teams: TeamApi[] = response.data?.data ?? []
            rows.value = teams.map((t) => ({
                id: `team-${t.session_id}`,
                team: t.team_name ? `${t.team} (${t.team_name})` : t.team,
                jobs: t.jobs.map((j) => ({
                    id: `${t.session_id}-${j.job_id}-${j.counting_order}`,
                    job: j.job_reference,
                    comptage: countingLabel(j.counting_order),
                    enAttente: j.status === 'EN ATTENTE' ? MARK : '',
                    entame: j.status === 'ENTAME' ? MARK : '',
                    termine: j.status === 'TERMINE' ? MARK : '',
                    bloque: j.status === 'BLOQUE' ? MARK : ''
                })),
                jobsEnAttente: t.jobs_en_attente,
                jobsEntame: t.jobs_entame,
                jobsTermine: t.jobs_termine,
                jobsBloque: t.jobs_bloque
            }))
        } catch (error: any) {
            logger.error('Erreur chargement du suivi par équipe', error)
            rows.value = []
            errorMessage.value = error?.response?.data?.message || error?.message || 'Impossible de charger le suivi par équipe'
        } finally {
            loading.value = false
        }
    }

    return { rows, columns, loading, errorMessage, warehouseLabel, load }
}
