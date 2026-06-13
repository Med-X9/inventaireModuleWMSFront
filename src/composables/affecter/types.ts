export interface RowNode {
    id: string
    job: string
    locations?: Array<{
        id?: number
        reference?: string
        location_reference?: string
        zone_name?: string
        sous_zone_name?: string
        zone?: { zone_name?: string }
        sous_zone?: { sous_zone_name?: string }
    }>
    team1: string
    team1Status?: string
    date1: string
    team2: string
    team2Status?: string
    date2: string
    resources: string
    resourcesList: string[]
    nbResources: number
    status: 'EN ATTENTE' | 'AFFECTE' | 'VALIDE' | 'TRANSFERT' | 'PRET' | 'ENTAME' | 'TERMINE' | 'CLOTURE'
    isChild?: boolean
    parentId?: string | null
    childType?: 'location' | 'resource'
    assignments?: Array<{
        counting_order: number
        status: string
        session?: { id: number; username: string }
        date_start?: string
    }>
}

export interface RowAction {
    label: string
    onClick: (row: Record<string, unknown>) => void
}

export function extractJobId(idWithSuffix: string): string {
    if (idWithSuffix.includes('-idx')) {
        return idWithSuffix.split('-idx')[0]
    }
    return idWithSuffix
}
