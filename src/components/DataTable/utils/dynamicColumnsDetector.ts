/**
 * Utilitaire pour détecter automatiquement les colonnes dynamiques basées sur les données
 *
 * Cette fonctionnalité permet d'ajouter automatiquement des colonnes au DataTable
 * en fonction des champs présents dans les données, similaires à useInventoryResults.ts
 *
 * @module dynamicColumnsDetector
 */

import type { DataTableColumn, ColumnDataType } from '../types/dataTable'
import { dataTableService } from '@/services/dataTableService'

/**
 * Configuration pour la détection dynamique des colonnes
 */
export interface DynamicColumnDetectorConfig {
    /** Fonction personnalisée pour détecter et créer des colonnes dynamiques */
    customDetector?: (data: Record<string, unknown>[], existingColumns: DataTableColumn[]) => DataTableColumn[]

    /** Champs à exclure de la détection automatique (ex: __metadata__, __rowNumber__) */
    excludeFields?: string[] | ((field: string) => boolean)

    /** Fonction pour déterminer le type de données d'un champ */
    fieldTypeDetector?: (field: string, value: unknown) => ColumnDataType

    /** Configuration par défaut pour les colonnes détectées */
    defaultColumnConfig?: Partial<DataTableColumn>

    /** Activer/désactiver le cache (défaut: true pour performance, false pour apps en temps réel) */
    cacheEnabled?: boolean

    /** Durée du cache en millisecondes (défaut: 10000ms pour performance, 0-1000ms pour temps réel) */
    cacheDuration?: number

    /** Invalider le cache si la structure des données change (défaut: false, true recommandé pour temps réel) */
    detectStructureChanges?: boolean
}

/**
 * Détecte le type de données d'un champ basé sur la valeur
 */
function detectFieldType(field: string, value: unknown): ColumnDataType {
    if (value === null || value === undefined) {
        return 'text'
    }

    // Détecter le type basé sur la valeur
    if (typeof value === 'boolean') {
        return 'boolean'
    }

    if (typeof value === 'number') {
        // Vérifier si c'est une date (timestamp)
        if (field.includes('date') || field.includes('time') || field.includes('_at')) {
            return 'datetime'
        }
        return 'number'
    }

    if (typeof value === 'string') {
        // Vérifier les formats spéciaux
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return 'date'
        }
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return 'datetime'
        }
        if (value.includes('@') && value.includes('.')) {
            return 'email'
        }
        if (/^https?:\/\//.test(value)) {
            return 'url'
        }
        if (/^\+?\d{10,}$/.test(value.replace(/\s/g, ''))) {
            return 'phone'
        }
        return 'text'
    }

    if (Array.isArray(value)) {
        return 'array'
    }

    if (typeof value === 'object') {
        return 'object'
    }

    return 'text'
}

/**
 * Génère un nom d'affichage à partir d'un nom de champ
 */
function generateHeaderName(field: string): string {
    // Convertir snake_case ou camelCase en texte lisible
    return field
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim()
}

/**
 * Cache pour les colonnes dynamiques détectées (évite de recalculer à chaque fois)
 *
 * ⚠️ NOTE : Le cache peut être problématique pour les apps en temps réel car il peut servir
 * des colonnes obsolètes. Utilisez cacheEnabled: false ou cacheDuration: 0-1000ms pour
 * les apps en temps réel qui nécessitent une réactivité immédiate.
 */
const dynamicColumnsCache = new Map<string, { columns: DataTableColumn[], timestamp: number, fieldsHash?: string }>()
const DEFAULT_CACHE_DURATION = 10000 // 10 secondes par défaut (performance)
const MAX_SAMPLE_SIZE = 50 // Analyser seulement les 50 premières lignes (réduit de 100 à 50 pour performance)
const MAX_CACHE_ENTRIES = 5 // Réduire le cache à 5 entrées maximum

/**
 * Détecte automatiquement les colonnes supplémentaires basées sur les données
 *
 * ⚡ OPTIMISÉ : Utilise un cache et n'analyse que les premières lignes pour de meilleures performances
 *
 * @param data - Tableau de données à analyser
 * @param existingColumns - Colonnes déjà définies statiquement
 * @param config - Configuration pour la détection
 * @returns Tableau de colonnes dynamiques détectées
 */
export function detectDynamicColumns(
    data: Record<string, unknown>[],
    existingColumns: DataTableColumn[] = [],
    config: DynamicColumnDetectorConfig = {}
): DataTableColumn[] {
    const {
        customDetector,
        excludeFields = ['__metadata__', '__rowNumber__', '__countingLabels__', '__differenceLabels__', 'id'],
        fieldTypeDetector = detectFieldType,
        defaultColumnConfig = {
            sortable: true,
            filterable: true,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            priority: 0
        },
        cacheEnabled = true, // Cache activé par défaut pour performance
        cacheDuration = DEFAULT_CACHE_DURATION, // 10s par défaut, peut être réduit pour temps réel
        detectStructureChanges = false // Détection de structure désactivée par défaut
    } = config

    // Si une fonction personnalisée est fournie, l'utiliser en priorité
    if (customDetector && typeof customDetector === 'function') {
        return customDetector(data, existingColumns)
    }

    // Si aucune donnée, retourner un tableau vide
    if (!data || data.length === 0) {
        return []
    }

    // ⚡ OPTIMISATION : Analyser seulement un échantillon des données (premières lignes)
    // Pour 500+ lignes, analyser seulement les 50 premières pour éviter les blocages
    const sampleSize = Math.min(data.length, MAX_SAMPLE_SIZE)
    const sampleData = data.slice(0, sampleSize)

    // Récupérer tous les champs présents dans les données (échantillon seulement)
    // Cette opération est effectuée une seule fois et réutilisée pour le cache et la détection
    const allFields = new Set<string>()

    sampleData.forEach(row => {
        if (row && typeof row === 'object') {
            Object.keys(row).forEach(key => {
                // Exclure les champs spéciaux
                const shouldExclude = typeof excludeFields === 'function'
                    ? excludeFields(key)
                    : excludeFields.includes(key)

                if (!shouldExclude) {
                    allFields.add(key)
                }
            })
        }
    })

    // ⚡ OPTIMISATION : Utiliser un cache pour éviter de recalculer (si activé)
    // Pour les apps en temps réel, désactiver le cache (cacheEnabled: false) pour une réactivité immédiate
    let cacheKey: string | null = null
    let cached: { columns: DataTableColumn[], timestamp: number, fieldsHash?: string } | undefined
    const now = Date.now()

    if (cacheEnabled && cacheDuration > 0) {
        // Hash basé sur les champs réels (optimal pour temps réel) ou longueur (rapide pour statique)
        const fieldsHash = detectStructureChanges
            ? Array.from(allFields).sort().join(',')
            : `${data.length}`

        cacheKey = `${fieldsHash}-${existingColumns.length}-${JSON.stringify(existingColumns.map(c => c.field).sort())}`
        cached = dynamicColumnsCache.get(cacheKey)

        // Vérifier si le cache est valide
        if (cached && (now - cached.timestamp) < cacheDuration) {
            // Si detectStructureChanges est activé, vérifier que le hash des champs correspond
            if (!detectStructureChanges || cached.fieldsHash === fieldsHash) {
                return cached.columns
            }
        }
    }

    // Filtrer les champs qui existent déjà dans les colonnes statiques
    const existingFields = new Set(existingColumns.map(col => col.field))
    const newFields = Array.from(allFields).filter(field => !existingFields.has(field))

    // Créer des colonnes pour chaque nouveau champ
    const dynamicColumns: DataTableColumn[] = newFields.map(field => {
        // Trouver une valeur non nulle pour déterminer le type (dans l'échantillon seulement)
        const sampleValue = sampleData.find(row => row[field] !== null && row[field] !== undefined)?.[field]
        const dataType = fieldTypeDetector(field, sampleValue)

        // Calculer une largeur optimale
        const width = dataTableService.calculateOptimalColumnWidth({
            field,
            headerName: generateHeaderName(field),
            dataType
        })

        // Créer la colonne avec la configuration par défaut
        const column: DataTableColumn = {
            field,
            headerName: generateHeaderName(field),
            dataType,
            width,
            description: `Colonne détectée automatiquement : ${generateHeaderName(field)}`,
            ...defaultColumnConfig
        }

        return column
    })

    // ⚡ OPTIMISATION : Mettre en cache les résultats (seulement si cache activé)
    if (cacheEnabled && cacheDuration > 0 && cacheKey) {
        // Calculer le hash des champs pour détection de structure si activé (réutiliser le calcul précédent)
        const fieldsHash = detectStructureChanges
            ? Array.from(allFields).sort().join(',')
            : undefined

        dynamicColumnsCache.set(cacheKey, {
            columns: dynamicColumns,
            timestamp: now,
            fieldsHash
        })

        // Nettoyer le cache si trop grand (garder seulement les MAX_CACHE_ENTRIES dernières entrées)
        if (dynamicColumnsCache.size > MAX_CACHE_ENTRIES) {
            const entries = Array.from(dynamicColumnsCache.entries())
            // Trier par timestamp et garder les plus récentes
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
            dynamicColumnsCache.clear()
            // Garder seulement les MAX_CACHE_ENTRIES plus récentes
            entries.slice(0, MAX_CACHE_ENTRIES).forEach(([key, value]) => {
                dynamicColumnsCache.set(key, value)
            })
        }
    }

    return dynamicColumns
}

/**
 * Fusionne les colonnes statiques avec les colonnes dynamiques détectées
 *
 * @param staticColumns - Colonnes définies statiquement
 * @param dynamicColumns - Colonnes détectées dynamiquement
 * @param insertPosition - Position où insérer les colonnes dynamiques (par défaut : à la fin)
 * @returns Tableau de colonnes fusionnées
 */
export function mergeColumns(
    staticColumns: DataTableColumn[],
    dynamicColumns: DataTableColumn[],
    insertPosition: 'start' | 'end' | number = 'end'
): DataTableColumn[] {
    // Filtrer les doublons (au cas où)
    const existingFields = new Set(staticColumns.map(col => col.field))
    const uniqueDynamicColumns = dynamicColumns.filter(col => !existingFields.has(col.field))

    if (uniqueDynamicColumns.length === 0) {
        return staticColumns
    }

    // Insérer les colonnes dynamiques selon la position
    if (insertPosition === 'start') {
        return [...uniqueDynamicColumns, ...staticColumns]
    } else if (insertPosition === 'end') {
        return [...staticColumns, ...uniqueDynamicColumns]
    } else if (typeof insertPosition === 'number') {
        const before = staticColumns.slice(0, insertPosition)
        const after = staticColumns.slice(insertPosition)
        return [...before, ...uniqueDynamicColumns, ...after]
    }

    return staticColumns
}

