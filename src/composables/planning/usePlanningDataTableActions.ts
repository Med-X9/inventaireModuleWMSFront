import { alertService } from '@/services/alertService'
import type { ActionConfig } from '@SMATCH-Digital-dev/vue-system-design'
import type { Job } from '@/models/Job'
import type { Location } from '@/models/Location'
import type { useJobStore } from '@/stores/job'
import type { ComputedRef } from 'vue'

export interface PlanningDataTableActionsDeps {
    jobStore: ReturnType<typeof useJobStore>
    resetAllSelections: () => void
    refreshData: () => Promise<void>
    bulkDeactivateLocations: (locationIds?: number[]) => Promise<void>
    /** Setting EN ATTENTE → actions d'édition visibles */
    canEditPlanning: ComputedRef<boolean>
}

export function createPlanningDataTableActions(deps: PlanningDataTableActionsDeps) {
    const { jobStore, resetAllSelections, refreshData, bulkDeactivateLocations, canEditPlanning } = deps

    const jobsActions: ActionConfig<Job>[] = [
        {
            label: 'Valider',
            icon: 'mdi-check-circle-outline',
            color: 'success',
            onClick: async (job: Job) => {
                try {
                    const result = await alertService.confirm({
                        title: 'Confirmer la validation',
                        text: `Voulez-vous vraiment valider le job "${job.reference}" ?`,
                    })

                    if (result.isConfirmed) {
                        await jobStore.validateJob([job.id])
                        await alertService.success({ text: 'Job validé avec succès' })
                        resetAllSelections()
                        await refreshData()
                    }
                } catch {
                    await alertService.error({ text: 'Erreur lors de la validation du job' })
                }
            },
            show: (job: Job) => canEditPlanning.value && job.status === 'EN ATTENTE',
        },
        {
            label: 'Supprimer',
            icon: 'mdi-delete-outline',
            color: 'danger',
            onClick: async (job: Job) => {
                try {
                    const result = await alertService.confirm({
                        title: 'Confirmer la suppression',
                        text: `Voulez-vous vraiment supprimer le job "${job.reference}" ?`,
                    })

                    if (result.isConfirmed) {
                        await jobStore.deleteJob([job.id])
                        await alertService.success({ text: 'Job supprimé avec succès' })
                        resetAllSelections()
                        await refreshData()
                    }
                } catch {
                    await alertService.error({ text: 'Erreur lors de la suppression du job' })
                }
            },
            show: () => canEditPlanning.value,
        },
    ]

    const locationsActions: ActionConfig<Location>[] = [
        {
            label: 'Désactiver',
            icon: 'mdi-close-circle-outline',
            color: 'danger',
            onClick: async (location: Location) => {
                try {
                    const result = await alertService.confirm({
                        title: 'Confirmer la désactivation',
                        text: `Voulez-vous vraiment désactiver la location "${location.reference}" ?`,
                    })

                    if (result.isConfirmed) {
                        await bulkDeactivateLocations([location.id])
                        await alertService.success({ text: 'Location désactivée avec succès' })
                        resetAllSelections()
                        await refreshData()
                    }
                } catch {
                    await alertService.error({ text: 'Erreur lors de la désactivation de la location' })
                }
            },
            show: () => canEditPlanning.value,
        },
    ]

    return { jobsActions, locationsActions }
}
