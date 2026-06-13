import { computed, type ComputedRef, type Ref } from 'vue'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'
import { PLANNING_NAV_BUTTON_CLASS } from '@/composables/planning/constants'

export interface PlanningButtonsDeps {
    selectedJobsCount: ComputedRef<number>
    selectedAvailableCount: ComputedRef<number>
    hasAvailableJobs: ComputedRef<boolean>
    onGoToDetail: () => void
    onGoToAffecter: () => void
    validateAllJobs: () => Promise<void>
    bulkValidateJobs: () => Promise<void>
    bulkResetJobs: () => Promise<void>
    createJobFromSelectedLocations: () => Promise<boolean>
    openAddToJobModal: () => void
    bulkDeactivateLocations: () => Promise<void>
}

export function usePlanningButtons(deps: PlanningButtonsDeps) {
    const navigationButtons = computed<ButtonGroupButton[]>(() => [
        {
            id: 'detail',
            label: 'Détail',
            icon: 'mdi-eye-outline',
            onClick: deps.onGoToDetail,
            class: PLANNING_NAV_BUTTON_CLASS,
        },
        {
            id: 'affecter',
            label: 'Affecter',
            icon: 'mdi-account-multiple-outline',
            onClick: deps.onGoToAffecter,
            class: `${PLANNING_NAV_BUTTON_CLASS} border-l-0`,
        },
    ])

    const jobsActionButtons = computed<ButtonGroupButton[]>(() => [
        {
            id: 'validate-all',
            label: 'Valider tous',
            icon: 'mdi-check-circle-outline',
            variant: 'success',
            onClick: () => { void deps.validateAllJobs() },
            class: 'text-white bg-success border-2 border-success hover:bg-success-dark hover:text-white',
        },
        {
            id: 'validate',
            label: `Valider (${deps.selectedJobsCount.value})`,
            icon: 'mdi-check-circle-outline',
            onClick: () => { void deps.bulkValidateJobs() },
            disabled: deps.selectedJobsCount.value === 0,
            class: `${PLANNING_NAV_BUTTON_CLASS} border-l-0`,
        },
        {
            id: 'return',
            label: `Retourner (${deps.selectedJobsCount.value})`,
            icon: 'mdi-arrow-left',
            onClick: () => { void deps.bulkResetJobs() },
            disabled: deps.selectedJobsCount.value === 0,
            class: `${PLANNING_NAV_BUTTON_CLASS} border-l-0`,
        },
    ])

    const locationsActionButtons = computed<ButtonGroupButton[]>(() => [
        {
            id: 'create-job',
            label: `Créer Job (${deps.selectedAvailableCount.value})`,
            icon: 'mdi-plus',
            onClick: () => { void deps.createJobFromSelectedLocations() },
            disabled: deps.selectedAvailableCount.value === 0,
            class: PLANNING_NAV_BUTTON_CLASS,
        },
        {
            id: 'add-to-job',
            label: `Ajouter (${deps.selectedAvailableCount.value})`,
            icon: 'mdi-plus',
            onClick: deps.openAddToJobModal,
            disabled: deps.selectedAvailableCount.value === 0,
            visible: deps.hasAvailableJobs.value,
            class: `${PLANNING_NAV_BUTTON_CLASS} border-l-0`,
        },
        {
            id: 'deactivate',
            label: `Désactiver (${deps.selectedAvailableCount.value})`,
            icon: 'mdi-close-circle-outline',
            onClick: () => { void deps.bulkDeactivateLocations() },
            disabled: deps.selectedAvailableCount.value === 0,
            class:
                'text-error bg-white dark:bg-bg-card border-2 border-error hover:bg-error hover:text-white ' +
                'disabled:hover:bg-white disabled:hover:text-error border-l-0',
        },
    ])

    return { navigationButtons, jobsActionButtons, locationsActionButtons }
}
