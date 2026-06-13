import type { ComputedRef, Ref } from 'vue'
import { alertService } from '@/services/alertService'
import type { useJobStore } from '@/stores/job'
import type { useLocationStore } from '@/stores/location'

export interface PlanningBulkDeps {
    selectedAvailableLocations: Ref<string[]>
    selectedJobs: Ref<string[]>
    inventoryId: Ref<number | null>
    warehouseId: Ref<number | null>
    hasSelectedLocations: ComputedRef<boolean>
    hasSelectedJobs: ComputedRef<boolean>
    jobStore: ReturnType<typeof useJobStore>
    locationStore: ReturnType<typeof useLocationStore>
    resetAllSelections: () => void
    refreshData: () => Promise<void>
}

export function usePlanningBulk(deps: PlanningBulkDeps) {
    const {
        selectedAvailableLocations,
        selectedJobs,
        inventoryId,
        warehouseId,
        hasSelectedLocations,
        hasSelectedJobs,
        jobStore,
        locationStore,
        resetAllSelections,
        refreshData,
    } = deps

    const createJobFromSelectedLocations = async (): Promise<boolean> => {
        if (!hasSelectedLocations.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins une location' })
            return false
        }

        if (!inventoryId.value || !warehouseId.value) {
            await alertService.error({ text: 'IDs de contexte manquants' })
            return false
        }

        try {
            const result = await alertService.confirm({
                title: 'Créer un job',
                text: `Créer un job avec ${selectedAvailableLocations.value.length} emplacement(s) ?`,
            })

            if (result.isConfirmed) {
                const locationIds = selectedAvailableLocations.value.map((id) => parseInt(id))
                await jobStore.createJob(inventoryId.value, warehouseId.value, { emplacements: locationIds } as any)

                await alertService.success({ text: 'Job créé avec succès' })
                resetAllSelections()
                await refreshData()
                return true
            }
            return false
        } catch {
            await alertService.error({ text: 'Erreur lors de la création du job' })
            return false
        }
    }

    const bulkValidateJobs = async () => {
        if (!hasSelectedJobs.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Valider les jobs',
                text: `Valider ${selectedJobs.value.length} job(s) ?`,
            })

            if (result.isConfirmed) {
                const jobIds = selectedJobs.value.map((id) => parseInt(id))
                await jobStore.validateJob(jobIds)
                await alertService.success({ text: `${jobIds.length} job(s) validé(s) avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch {
            await alertService.error({ text: 'Erreur lors de la validation des jobs' })
        }
    }

    const validateAllJobs = async () => {
        if (!inventoryId.value || !warehouseId.value) {
            await alertService.warning({ text: 'Inventaire ou entrepôt non disponible' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Valider tous les jobs',
                text: 'Voulez-vous vraiment valider tous les jobs de cet inventaire ?',
            })

            if (!result.isConfirmed) {
                return
            }

            await jobStore.validateAllJobs(inventoryId.value, warehouseId.value)
            await alertService.success({ text: 'Tous les jobs ont été validés avec succès' })
            resetAllSelections()
            await refreshData()
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Erreur lors de la validation de tous les jobs'
            await alertService.error({ text: errorMessage })
        }
    }

    const bulkResetJobs = async () => {
        if (!hasSelectedJobs.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Remettre à zéro les jobs',
                text: `Remettre à zéro ${selectedJobs.value.length} job(s) ? Cette action les ramènera à leur état initial.`,
            })

            if (result.isConfirmed) {
                const jobIds = selectedJobs.value.map((id) => parseInt(id))
                await jobStore.jobReset(jobIds)
                await alertService.success({ text: `${jobIds.length} job(s) remis à zéro avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch {
            await alertService.error({ text: 'Erreur lors de la remise à zéro des jobs' })
        }
    }

    const bulkDeleteJobs = async () => {
        if (!hasSelectedJobs.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Supprimer les jobs',
                text: `Supprimer ${selectedJobs.value.length} job(s) ?`,
            })

            if (result.isConfirmed) {
                const jobIds = selectedJobs.value.map((id) => parseInt(id))
                await jobStore.deleteJob(jobIds)
                await alertService.success({ text: `${jobIds.length} job(s) supprimé(s) avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch {
            await alertService.error({ text: 'Erreur lors de la suppression des jobs' })
        }
    }

    const bulkDeactivateLocations = async (locationIds?: number[]) => {
        const idsToDeactivate = locationIds || selectedAvailableLocations.value.map((id) => parseInt(id))

        if (idsToDeactivate.length === 0) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins une location' })
            return
        }

        try {
            await locationStore.bulkUpdateStatus(idsToDeactivate)

            if (!locationIds) {
                resetAllSelections()
            }

            await refreshData()
        } catch {
            await alertService.error({ text: 'Erreur lors de la désactivation des locations' })
        }
    }

    return {
        createJobFromSelectedLocations,
        bulkValidateJobs,
        validateAllJobs,
        bulkResetJobs,
        bulkDeleteJobs,
        bulkDeactivateLocations,
    }
}
