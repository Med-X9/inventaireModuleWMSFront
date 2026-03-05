/**
 * Utilitaire de normalisation des résultats d'inventaire
 *
 * Extrait la logique de normalisation complexe du service pour améliorer la maintenabilité
 * et permettre la réutilisation.
 */

import type { InventoryResult } from '@/interfaces/inventoryResults'

/**
 * Interface pour les labels de comptage et d'écart
 */
export interface InventoryResultLabels {
    countingLabels: Record<string, string>
    differenceLabels: Record<string, string>
}

/**
 * Résultat de normalisation avec labels
 */
export interface NormalizedInventoryResult extends InventoryResult {
    __countingLabels?: Record<string, string>
    __differenceLabels?: Record<string, string>
}

/**
 * Normalise un résultat d'inventaire brut vers le format standard
 *
 * @param item - Données brutes du backend
 * @param index - Index dans le tableau (pour générer un ID de fallback)
 * @param inventoryId - ID de l'inventaire (pour générer un ID de fallback)
 * @param storeId - ID du magasin (pour générer un ID de fallback)
 * @returns Résultat normalisé avec labels
 */
export function normalizeInventoryResult(
    item: Record<string, unknown>,
    index: number,
    inventoryId: number,
    storeId: string | number
): NormalizedInventoryResult {
    // Extraire les champs de base avec fallbacks
    const jobId = extractJobId(item, index, inventoryId, storeId)
    const emplacement = String(item.emplacement ?? item.location ?? '')
    const article = String(item.article ?? item.product ?? '')
    const finalResult = extractFinalResult(item)

    // Créer l'objet de base
    const normalizedItem: NormalizedInventoryResult = {
        id: jobId,
        jobId,
        emplacement,
        article,
        product: String(item.product ?? item.article ?? ''),
        final_result: finalResult,
        resultats: finalResult
    }

    // Normaliser les champs dynamiques (comptages, écarts, etc.)
    const labels = normalizeDynamicFields(item, normalizedItem)

    // Ajouter les labels seulement si nécessaire
    if (Object.keys(labels.countingLabels).length > 0) {
        normalizedItem.__countingLabels = labels.countingLabels
    }
    if (Object.keys(labels.differenceLabels).length > 0) {
        normalizedItem.__differenceLabels = labels.differenceLabels
    }

    return normalizedItem
}

/**
 * Extrait l'ID du job avec fallbacks
 * ⚡ CORRECTION : Garantit l'unicité même sans ID dans les données
 * Utilise une combinaison unique basée sur l'index + données uniques de la ligne
 */
function extractJobId(
    item: Record<string, unknown>,
    index: number,
    inventoryId: number,
    storeId: string | number
): string {
    // Priorité 1 : ID explicite dans les données
    if (item.jobId && item.jobId !== null && item.jobId !== undefined) {
        return `job-${item.jobId}-${index}` // Ajouter index pour garantir l'unicité même si jobId est dupliqué
    }
    if (item.job_id && item.job_id !== null && item.job_id !== undefined) {
        return `job_id-${item.job_id}-${index}`
    }
    if (item.id && item.id !== null && item.id !== undefined) {
        return `id-${item.id}-${index}` // Ajouter index pour garantir l'unicité même si id est dupliqué
    }

    // ⚡ CORRECTION : Fallback avec combinaison unique basée sur les données de la ligne
    // Utiliser emplacement + article + index pour garantir l'unicité
    const emplacement = String(item.emplacement ?? item.location ?? '')
    const article = String(item.article ?? item.product ?? '')
    const uniqueHash = `${emplacement}-${article}-${index}`

    // Si emplacement et article sont vides, utiliser inventoryId + storeId + index
    if (!emplacement && !article) {
        return `${inventoryId}-${storeId}-${index}`
    }

    // Sinon, utiliser le hash unique basé sur les données + index
    return `${inventoryId}-${storeId}-${uniqueHash}`
}

/**
 * Extrait le résultat final avec conversion de type sécurisée
 */
function extractFinalResult(item: Record<string, unknown>): number | null {
    const rawValue = item.final_result ?? item.resultats
    if (rawValue === null || rawValue === undefined) return null
    const numValue = Number(rawValue)
    return isNaN(numValue) ? null : numValue
}

/**
 * Normalise les champs dynamiques (comptages, écarts, etc.)
 * ⚡ OPTIMISÉ : Réduction des opérations coûteuses (normalizeKey, regex) au strict minimum
 */
function normalizeDynamicFields(
    item: Record<string, unknown>,
    normalizedItem: NormalizedInventoryResult
): InventoryResultLabels {
    const countingLabels: Record<string, string> = {}
    const differenceLabels: Record<string, string> = {}

    // ⚡ OPTIMISATION : Itérer directement sur les clés au lieu de Object.entries (plus rapide)
    const keys = Object.keys(item)

    for (let i = 0; i < keys.length; i++) {
        const rawKey = keys[i]
        const value = item[rawKey]

        // Ignorer undefined et champs déjà normalisés (check rapide)
        if (value === undefined || rawKey in normalizedItem) continue

        // ⚡ OPTIMISATION : Vérifier les formats standards en premier avec toLowerCase() une seule fois
        const keyLower = rawKey.toLowerCase()

        // Formats standards (le plus fréquent) - vérification rapide sans regex
        if (keyLower.startsWith('contage_')) {
            normalizedItem[rawKey] = value
            // Optionnellement, extraire le label si nécessaire
            continue
        }

        if (keyLower.startsWith('ecart_')) {
            normalizedItem[rawKey] = value
            differenceLabels[rawKey] = rawKey
            continue
        }

        // ⚡ OPTIMISATION : Éviter normalizeKey et regex si possible
        // Vérifier d'abord les patterns simples avant d'utiliser regex
        const hasDigit = /\d/.test(rawKey)

        // Seulement si la clé contient des chiffres, essayer les formats alternatifs (plus coûteux)
        if (hasDigit && (keyLower.includes('comptage') || keyLower.includes('ecart'))) {
            const normalized = normalizeKey(rawKey)
            const countingField = extractCountingField(normalized, rawKey, value)
            const differenceField = extractDifferenceField(normalized, rawKey, value)

            if (countingField) {
                normalizedItem[countingField.field] = value
                countingLabels[countingField.field] = rawKey
                continue
            }

            if (differenceField) {
                normalizedItem[differenceField.field] = value
                differenceLabels[differenceField.field] = rawKey
                continue
            }
        }

        // Traiter les champs standards (plus rapide que normalizeKey pour les cas standards)
        const standardMapped = applyStandardFieldMappingFast(keyLower, rawKey, value, normalizedItem)
        if (!standardMapped) {
            // Copier seulement si pas déjà présent (fallback)
            if (!(rawKey in normalizedItem)) {
                normalizedItem[rawKey] = value
            }
        }
    }

    return { countingLabels, differenceLabels }
}

/**
 * Version optimisée de applyStandardFieldMapping qui évite normalizeKey pour les cas standards
 */
function applyStandardFieldMappingFast(
    keyLower: string,
    rawKey: string,
    value: unknown,
    normalizedItem: NormalizedInventoryResult
): boolean {
    // Vérifier les cas standards directement avec keyLower (déjà lowercase)
    switch (keyLower) {
        case 'location':
        case 'emplacement':
            if (!normalizedItem.emplacement) {
                normalizedItem.emplacement = String(value)
            }
            return true

        case 'product':
        case 'article':
            if (!normalizedItem.article) {
                normalizedItem.article = String(value)
                normalizedItem.product = String(value)
            }
            return true

        case 'final_result':
        case 'resultats':
            if (normalizedItem.final_result === null) {
                const numValue = value === null || value === undefined ? null : Number(value)
                normalizedItem.final_result = isNaN(Number(numValue)) ? null : numValue
                normalizedItem.resultats = normalizedItem.final_result
            }
            return true

        case 'jobid':
        case 'job_id':
            if (!normalizedItem.jobId) {
                normalizedItem.jobId = String(value)
                normalizedItem.id = String(value)
            }
            return true

        case 'product_internal_code':
        case 'productinternalcode':
            if (!(rawKey in normalizedItem)) {
                normalizedItem[rawKey] = value
            }
            return true

        case 'product_description':
        case 'productdescription':
            if (!(rawKey in normalizedItem)) {
                normalizedItem[rawKey] = value
            }
            return true

        case 'product_family':
        case 'productfamily':
            if (!(rawKey in normalizedItem)) {
                normalizedItem[rawKey] = value
            }
            return true

        default:
            return false
    }
}

/**
 * Normalise une clé (supprime accents, etc.)
 */
function normalizeKey(key: string): string {
    return key
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
}

/**
 * Extrait un champ de comptage depuis une clé normalisée
 */
function extractCountingField(
    normalized: string,
    rawKey: string,
    value: unknown
): { field: string } | null {
    const match = normalized.match(/^(\d+)(?:er|eme)?\s*comptage$/i)
    if (!match) return null
    return { field: `contage_${match[1]}` }
}

/**
 * Extrait un champ d'écart depuis une clé normalisée
 */
function extractDifferenceField(
    normalized: string,
    rawKey: string,
    value: unknown
): { field: string } | null {
    // 1. Cas simple déjà normalisé : "ecart_1_2", "ecart_1_2_3", etc.
    let match = normalized.match(/^ecart_((?:\d+_?)+)$/i)
    if (match) {
        const numbers = match[1].split('_').filter(n => n.length > 0)
        if (numbers.length < 2) return null
        return { field: `ecart_${numbers.join('_')}` }
    }

    // 2. Cas labels backend type "Écart 1er-2ème comptage"
    //    Exemples possibles après normalisation :
    //    - "ecart 1er-2eme comptage"
    //    - "ecart 1-2 comptage"
    //    - "ecart 1er 2eme comptage"
    match = normalized.match(/^ecart[ _-]*([\d\w _-]+?)\s*comptage?$/i)
    if (!match) return null

    const numbers = (match[1].match(/\d+/g) || [])
    if (numbers.length < 2) return null

    return { field: `ecart_${numbers.join('_')}` }
}

/**
 * Applique le mapping des champs standards
 * ⚠️ DEPRECATED : Utiliser applyStandardFieldMappingFast pour de meilleures performances
 * Conservé pour compatibilité mais n'est plus appelé directement
 */
function applyStandardFieldMapping(
    normalized: string,
    rawKey: string,
    value: unknown,
    normalizedItem: NormalizedInventoryResult
): void {
    // Cette fonction est maintenant un wrapper vers la version optimisée
    const keyLower = normalized.toLowerCase()
    const mapped = applyStandardFieldMappingFast(keyLower, rawKey, value, normalizedItem)
    if (!mapped && !(rawKey in normalizedItem)) {
        normalizedItem[rawKey] = value
    }
}

/**
 * Normalise un tableau de résultats d'inventaire
 *
 * @param rawResults - Tableau de résultats bruts
 * @param inventoryId - ID de l'inventaire
 * @param storeId - ID du magasin
 * @returns Tableau de résultats normalisés
 */
export function normalizeInventoryResults(
    rawResults: Record<string, unknown>[],
    inventoryId: number,
    storeId: string | number
): NormalizedInventoryResult[] {
    return rawResults.map((item, index) =>
        normalizeInventoryResult(item, index, inventoryId, storeId)
    )
}

