import { resolveJobCreatedAt, transformLocations } from '@/composables/affecter/useAffecterData'
import type { JobTable } from '@/models/Job'
import type { Location } from '@/models/Location'

type PlanningJobSource = JobTable & { emplacements?: unknown[] }

export type PlanningJobRow = PlanningJobSource & {
    locations: ReturnType<typeof transformLocations>
    created_at?: string | null
}

export type PlanningLocationRow = Location & {
    zone_name: string
    sous_zone_name: string
    location_reference: string
}

export function normalizePlanningLocation(location: Location): PlanningLocationRow {
    const loc = location as Location & {
        zone_name?: string
        sous_zone_name?: string
    }

    return {
        ...loc,
        zone_name: loc.zone_name ?? loc.zone?.zone_name ?? '',
        sous_zone_name: loc.sous_zone_name ?? loc.sous_zone?.sous_zone_name ?? '',
        location_reference: loc.location_reference || loc.reference || '',
    }
}

export function normalizePlanningJob(job: PlanningJobSource): PlanningJobRow {
    const jobWithMeta = job as PlanningJobSource & { job_id?: number }
    const jobId = job.id ?? jobWithMeta.job_id ?? 0

    const emplacements = Array.isArray(job.emplacements) ? job.emplacements : []
    const locations = Array.isArray(job.locations) ? job.locations : []
    const rawLocations = emplacements.length > 0 ? emplacements : locations

    return {
        ...job,
        id: jobId,
        locations: transformLocations(jobId, rawLocations as unknown[]),
        created_at: resolveJobCreatedAt(job as unknown as Record<string, unknown>) ?? undefined,
    }
}

export function mapPlanningJobs(jobs: JobTable[] | null | undefined): PlanningJobRow[] {
    if (!jobs?.length) return []
    return jobs.map((job) => normalizePlanningJob(job as PlanningJobSource))
}

export function mapPlanningLocations(locations: Location[] | null | undefined): PlanningLocationRow[] {
    if (!locations?.length) return []
    return locations.map(normalizePlanningLocation)
}
