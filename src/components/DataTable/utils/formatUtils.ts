/**
 * Utilitaires de formatage pour DataTable
 * 
 * Centralise les fonctions de formatage réutilisables.
 * 
 * @module formatUtils
 */

/**
 * Formate une date au format français (DD/MM/YYYY)
 * 
 * @param value - Valeur à formater (Date, string, ou number)
 * @returns Date formatée au format français ou chaîne vide si invalide
 */
export function formatDateOnly(value: any): string {
    if (!value) return ''

    try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return String(value)

        // Format français : DD/MM/YYYY
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    } catch (error) {
        return String(value)
    }
}

