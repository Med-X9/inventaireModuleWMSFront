/**
 * Page « Lancement du comptage suivant » (3e, 4e, …).
 *
 * Remplace l'ancienne fenêtre plein écran : liste des jobs à relancer regroupés par numéro de
 * comptage, choix de l'équipe mobile puis lancement.
 *
 * API : GET   …/warehouse/<id>/jobs/discrepancies-by-counting/  (jobs ENTAME avec écarts non résolus)
 *       POST  jobs/launch-counting/ { jobs: [...], session_id }
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { JobService } from '@/services/jobService'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import { useInventoryStore } from '@/stores/inventory'
import { useJobStore } from '@/stores/job'
import { useSessionStore } from '@/stores/session'

export interface LaunchJob {
    jobId: number
    reference: string
    /** Plus haut comptage terminé avec des écarts */
    currentMaxCounting: number | null
    /** Nombre d'emplacements en écart (résultat final vide) */
    locationsCount: number
}

export interface LaunchGroup {
    /** Numéro du comptage à lancer (3, 4, …) */
    order: number
    jobs: LaunchJob[]
}

export function useCountingLaunch(inventoryReference: string, warehouseParam: string) {
    const router = useRouter()
    const inventoryStore = useInventoryStore()
    const jobStore = useJobStore()
    const sessionStore = useSessionStore()

    const inventoryId = ref<number | null>(null)
    const warehouseLabel = ref('')
    const groups = ref<LaunchGroup[]>([])
    const loading = ref(true)
    const errorMessage = ref<string | null>(null)

    /** Sélection : un seul numéro de comptage à la fois (comme l'ancienne fenêtre) */
    const selectedOrder = ref<number | null>(null)
    const selectedJobIds = ref<Set<number>>(new Set())
    const sessionId = ref<number | null>(null)
    const sessionsLoading = ref(false)
    const launching = ref(false)

    const sessions = computed(() => sessionStore.getAllSessions || [])

    const selectedGroup = computed(() => groups.value.find((g) => g.order === selectedOrder.value) ?? null)
    const selectedJobs = computed(
        () => selectedGroup.value?.jobs.filter((j) => selectedJobIds.value.has(j.jobId)) ?? []
    )
    const selectedLocationsCount = computed(() =>
        selectedJobs.value.reduce((sum, job) => sum + job.locationsCount, 0)
    )
    const canLaunch = computed(
        () => selectedJobs.value.length > 0 && !!sessionId.value && !launching.value
    )

    const isGroupDisabled = (order: number) => selectedOrder.value !== null && selectedOrder.value !== order

    async function loadSessions(order: number) {
        sessionsLoading.value = true
        try {
            await sessionStore.fetchMobileUsersForCountingOrder(order)
        } catch (error) {
            logger.error('Erreur lors du chargement des équipes mobiles', error)
        } finally {
            sessionsLoading.value = false
        }
    }

    async function toggleJob(order: number, jobId: number) {
        if (isGroupDisabled(order) || launching.value) return
        const next = new Set(selectedJobIds.value)
        if (next.has(jobId)) next.delete(jobId)
        else next.add(jobId)

        const previousOrder = selectedOrder.value
        selectedJobIds.value = next
        selectedOrder.value = next.size > 0 ? order : null
        if (selectedOrder.value !== null && selectedOrder.value !== previousOrder) {
            sessionId.value = null
            await loadSessions(selectedOrder.value)
        }
        if (selectedOrder.value === null) sessionId.value = null
    }

    async function toggleGroup(group: LaunchGroup) {
        if (isGroupDisabled(group.order) || launching.value) return
        const allSelected = group.jobs.every((j) => selectedJobIds.value.has(j.jobId))
        const previousOrder = selectedOrder.value
        selectedJobIds.value = allSelected ? new Set() : new Set(group.jobs.map((j) => j.jobId))
        selectedOrder.value = allSelected ? null : group.order
        if (selectedOrder.value !== null && selectedOrder.value !== previousOrder) {
            sessionId.value = null
            await loadSessions(selectedOrder.value)
        }
        if (selectedOrder.value === null) sessionId.value = null
    }

    async function load() {
        loading.value = true
        errorMessage.value = null
        selectedOrder.value = null
        selectedJobIds.value = new Set()
        sessionId.value = null
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
            if (!inventory) {
                throw new Error(`Inventaire "${inventoryReference}" introuvable`)
            }
            inventoryId.value = Number(inventory.id)

            const warehouses: any[] = Array.isArray(inventory.warehouses) ? inventory.warehouses : []
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

            const response = await JobService.getJobsDiscrepanciesByCounting(inventoryId.value, warehouseId)
            const items: any[] = Array.isArray(response) ? response : []
            groups.value = items
                .filter((item) => item && item.next_counting_order && Array.isArray(item.jobs) && item.jobs.length > 0)
                .map((item) => ({
                    order: Number(item.next_counting_order),
                    jobs: item.jobs.map((job: any) => ({
                        jobId: Number(job.job_id),
                        reference: String(job.job_reference || `job-${job.job_id}`),
                        currentMaxCounting: job.current_max_counting ?? null,
                        locationsCount: Number(job.discrepancies_locations_count ?? 0)
                    }))
                }))
                .sort((a, b) => a.order - b.order)
        } catch (error: any) {
            // 404 « aucun job avec écarts » : état normal, pas une erreur d'affichage bloquante
            const status = error?.response?.status
            const message = error?.response?.data?.message || error?.message || ''
            groups.value = []
            if (status !== 404) {
                logger.error('Erreur chargement des jobs à relancer', error)
                errorMessage.value = message || 'Impossible de charger les jobs à relancer'
            }
        } finally {
            loading.value = false
        }
    }

    async function launch(): Promise<boolean> {
        if (!canLaunch.value || !sessionId.value) return false
        launching.value = true
        try {
            await jobStore.launchMultipleCountings({
                jobs: selectedJobs.value.map((j) => j.jobId),
                session_id: sessionId.value
            })
            await alertService.success({ text: 'Comptage(s) lancé(s) avec succès' })
            return true
        } catch (error: any) {
            const message =
                error?.userMessage ||
                error?.response?.data?.message ||
                error?.message ||
                'Erreur lors du lancement du comptage'
            await alertService.error({ text: message })
            return false
        } finally {
            launching.value = false
        }
    }

    function goToResults() {
        void router.push({
            name: 'inventory-results',
            params: { reference: inventoryReference, warehouse: warehouseParam }
        })
    }

    return {
        warehouseLabel,
        groups,
        loading,
        errorMessage,
        selectedOrder,
        selectedJobIds,
        selectedJobs,
        selectedLocationsCount,
        sessions,
        sessionsLoading,
        sessionId,
        launching,
        canLaunch,
        isGroupDisabled,
        toggleJob,
        toggleGroup,
        load,
        launch,
        goToResults
    }
}
