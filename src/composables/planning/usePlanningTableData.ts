import { shallowRef, watch, type Ref } from 'vue'
import type { JobTable } from '@/models/Job'
import type { Location } from '@/models/Location'
import {
    mapPlanningJobs,
    mapPlanningLocations,
    type PlanningJobRow,
    type PlanningLocationRow,
} from '@/composables/planning/usePlanningData'

export function usePlanningTableData(
    storeJobs: Ref<JobTable[]>,
    storeLocations: Ref<Location[]>,
) {
    const jobsTableRows = shallowRef<PlanningJobRow[]>([])
    const locationsTableRows = shallowRef<PlanningLocationRow[]>([])

    const syncJobsTableRows = () => {
        jobsTableRows.value = mapPlanningJobs(storeJobs.value)
    }

    const syncLocationsTableRows = () => {
        locationsTableRows.value = mapPlanningLocations(storeLocations.value)
    }

    watch(storeJobs, () => syncJobsTableRows(), { deep: true, immediate: true })
    watch(storeLocations, () => syncLocationsTableRows(), { deep: true, immediate: true })

    return {
        jobs: jobsTableRows,
        locations: locationsTableRows,
        syncJobsTableRows,
        syncLocationsTableRows,
    }
}
