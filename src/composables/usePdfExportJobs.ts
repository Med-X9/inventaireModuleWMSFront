/**
 * Chargement des jobs d'un inventaire / magasin pour les pages d'export PDF
 * (assignments terminés, transfert du Ne comptage).
 *
 * Source : API de suivi `jobs/discrepancies/` (assignments par comptage), pages de 200.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { JobService } from '@/services/jobService'
import { logger } from '@/services/loggerService'
import { useInventoryStore } from '@/stores/inventory'

export interface PdfExportAssignment {
    status: string
    team: string
}

export interface PdfExportRow {
    jobId: number
    jobReference: string
    jobStatus: string | null
    /** Assignment par ordre de comptage (statut + équipe) */
    byOrder: Record<number, PdfExportAssignment>
}

/** Statuts d'assignment dont les fiches sont à remplir / à transférer (même règle que l'API PDF) */
export const TRANSFER_STATUSES = ['PRET', 'TRANSFERT']

export function statusBadgeClass(status: string): string {
    switch (status) {
        case 'TERMINE':
            return 'bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300'
        case 'ENTAME':
            return 'bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300'
        case 'TRANSFERT':
            return 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300'
        case 'PRET':
            return 'bg-purple-100 text-purple-800 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-300'
        default:
            return 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-200'
    }
}

function toRows(jobs: any[]): PdfExportRow[] {
    return jobs.map((job) => {
        const byOrder: PdfExportRow['byOrder'] = {}
        ;(job.assignments || []).forEach((a: any) => {
            // Assignments sans statut = comptages futurs non créés
            if (!a || a.status === null || a.status === undefined || !a.counting_order) return
            const session = a.session as { username?: string } | undefined
            byOrder[Number(a.counting_order)] = {
                status: String(a.status),
                team: String(a.username || session?.username || '')
            }
        })
        return {
            jobId: Number(job.job_id),
            jobReference: String(job.job_reference || `job-${job.job_id}`),
            jobStatus: job.job_status ?? null,
            byOrder
        }
    })
}

async function fetchAllJobs(inventoryId: number, warehouseId: number): Promise<any[]> {
    const pageSize = 200
    const all: any[] = []
    let page = 1
    while (true) {
        const response = await JobService.getJobsDiscrepancies(inventoryId, warehouseId, {
            page,
            page_size: pageSize
        })
        const data: any[] = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.rows)
                ? response.rows
                : []
        all.push(...data)
        if (data.length < pageSize) break
        page += 1
    }
    return all
}

export function usePdfExportJobs(inventoryReference: string, warehouseParam: string) {
    const router = useRouter()
    const inventoryStore = useInventoryStore()

    const inventoryId = ref<number | null>(null)
    const warehouseLabel = ref('')
    const rows = ref<PdfExportRow[]>([])
    const loading = ref(true)
    const errorMessage = ref<string | null>(null)

    const countingOrders = computed(() => {
        const orders = new Set<number>()
        rows.value.forEach((r) => Object.keys(r.byOrder).forEach((o) => orders.add(Number(o))))
        return Array.from(orders).sort((a, b) => a - b)
    })

    async function load() {
        loading.value = true
        errorMessage.value = null
        try {
            const fetched = await inventoryStore.fetchInventoryByReference(inventoryReference)
            if (!fetched) {
                throw new Error(`Inventaire "${inventoryReference}" introuvable`)
            }
            inventoryId.value = Number(fetched.id)

            const warehouses: any[] = Array.isArray(fetched.warehouses) ? fetched.warehouses : []
            const match = warehouses.find(
                (w) =>
                    String(w.reference) === warehouseParam ||
                    String(w.id ?? w.warehouse_id) === warehouseParam ||
                    String(w.warehouse_name) === warehouseParam
            )
            if (!match) {
                throw new Error(`Magasin "${warehouseParam}" introuvable dans cet inventaire`)
            }
            const warehouseId = Number(match.id ?? match.warehouse_id)
            warehouseLabel.value = String(match.warehouse_name || match.reference || `Entrepôt ${warehouseId}`)

            rows.value = toRows(await fetchAllJobs(inventoryId.value, warehouseId))
        } catch (error: any) {
            logger.error('Erreur chargement des jobs pour l\'export PDF', error)
            errorMessage.value =
                error?.response?.data?.message || error?.message || 'Impossible de charger les jobs de cet inventaire'
            rows.value = []
        } finally {
            loading.value = false
        }
    }

    function goBack() {
        void router.push({
            name: 'inventory-job-tracking',
            params: { reference: inventoryReference, warehouse: warehouseParam }
        })
    }

    return {
        inventoryId,
        warehouseLabel,
        rows,
        loading,
        errorMessage,
        countingOrders,
        load,
        goBack
    }
}
