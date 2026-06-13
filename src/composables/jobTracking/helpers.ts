import { logger } from '@/services/loggerService'
import type { JobEmplacement } from '@/models/Job'

export function formatDateTime(value: string | null | undefined): string | null {
    if (!value) {
        return null
    }

    try {
        return new Date(value).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch (error) {
        logger.warn('Format de date invalide', { value, error })
        return value
    }
}

export function mapEmplacementLabel(emplacement: JobEmplacement, index: number): string {
    return emplacement?.location_reference
        || emplacement?.reference
        || `Emplacement ${index + 1}`
}
