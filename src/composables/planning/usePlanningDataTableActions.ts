import { alertService } from '@/services/alertService'
import type { ActionConfig } from '@SMATCH-Digital-dev/vue-system-design'
import type { Job } from '@/models/Job'
import type { Location } from '@/models/Location'
import type { useJobStore } from '@/stores/job'

export interface PlanningDataTableActionsDeps {
    jobStore: ReturnType<typeof useJobStore>
    resetAllSelections: () => void
    refreshData: () => Promise<void>
    bulkDeactivateLocations: (locationIds?: number[]) => Promise<void>
}

export function createPlanningDataTableActions(deps: PlanningDataTableActionsDeps) {
    const { jobStore, resetAllSelections, refreshData, bulkDeactivateLocations } = deps

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
            show: (job: Job) => job.status === 'EN ATTENTE',
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
            show: () => true,
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
            show: () => true,
        },
    ]

    return { jobsActions, locationsActions }
}
