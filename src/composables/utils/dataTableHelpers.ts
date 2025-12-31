/**
 * Helpers pour simplifier la gestion des DataTables
 * Fonctions utilitaires pour extraire et traiter les paramètres DataTable
 *
 * @module dataTableHelpers
 */

import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import type { DataTableColumn } from '@/types/dataTable'

/**
 * Extrait les filtres depuis StandardDataTableParams
 *
 * @param params - Paramètres standard DataTable
 * @param columns - Colonnes du DataTable
 * @returns Objet avec les filtres extraits { [field]: { filter: value, operator: operator } }
 */
export function extractFiltersFromStandardParams(
    params: StandardDataTableParams,
    columns: DataTableColumn[]
): Record<string, { filter: any; operator?: string }> {
    const extractedFilters: Record<string, any> = {}

    columns.forEach((col, index) => {
        const filterKey = `columns[${index}][search][value]`
        const filterValue = params[filterKey]
        const operatorKey = `columns[${index}][operator]`
        const operator = params[operatorKey]

        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
            extractedFilters[col.field] = {
                filter: filterValue,
                operator: operator || 'contains'
            }
        }
    })

    return extractedFilters
}

/**
 * Vérifie si un paramètre est au format StandardDataTableParams
 *
 * @param params - Paramètres à vérifier
 * @returns true si c'est StandardDataTableParams
 */
export function isStandardDataTableParams(params: any): params is StandardDataTableParams {
    return params && typeof params === 'object' && ('draw' in params || 'start' in params || 'length' in params)
}

/**
 * Extrait le numéro de page depuis StandardDataTableParams
 *
 * @param params - Paramètres standard DataTable
 * @param pageSize - Taille de page (par défaut 20)
 * @returns Numéro de page (1-indexed)
 */
export function extractPageFromStandardParams(params: StandardDataTableParams, pageSize: number = 20): number {
    const start = params.start || 0
    return Math.floor(start / pageSize) + 1
}

/**
 * Extrait la taille de page depuis StandardDataTableParams
 *
 * @param params - Paramètres standard DataTable
 * @param defaultPageSize - Taille de page par défaut (par défaut 20)
 * @returns Taille de page
 */
export function extractPageSizeFromStandardParams(params: StandardDataTableParams, defaultPageSize: number = 20): number {
    return params.length || defaultPageSize
}

/**
 * Extrait le modèle de tri depuis StandardDataTableParams
 *
 * @param params - Paramètres standard DataTable
 * @param columns - Colonnes du DataTable pour mapper les indices
 * @returns Modèle de tri au format { field: string; direction: 'asc' | 'desc' }[]
 */
export function extractSortFromStandardParams(
    params: StandardDataTableParams,
    columns: DataTableColumn[]
): Array<{ field: string; direction: 'asc' | 'desc' }> {
    const sortModel: Array<{ field: string; direction: 'asc' | 'desc' }> = []
    let sortIndex = 0

    while (params[`order[${sortIndex}][column]`] !== undefined) {
        const columnIndex = params[`order[${sortIndex}][column]`]
        const direction = params[`order[${sortIndex}][dir]`] as 'asc' | 'desc'
        const fieldKey = `columns[${columnIndex}][data]`
        const fieldName = params[fieldKey]

        if (fieldName && columns[columnIndex]) {
            sortModel.push({
                field: fieldName,
                direction: direction || 'asc'
            })
        }
        sortIndex++
    }

    return sortModel
}

/**
 * Handler wrapper qui simplifie la gestion des événements DataTable
 * Gère automatiquement la conversion et l'extraction des paramètres
 *
 * @param handler - Fonction qui traite les paramètres standard
 * @param extractParams - Fonction optionnelle pour extraire des paramètres supplémentaires
 * @returns Handler compatible avec les événements du DataTable
 */
export function createSimpleDataTableHandler<T extends StandardDataTableParams = StandardDataTableParams>(
    handler: (params: T) => Promise<void> | void,
    extractParams?: (params: any) => Partial<T>
) {
    return async (params: any) => {
        try {
            // Si c'est déjà StandardDataTableParams, utiliser directement
            if (isStandardDataTableParams(params)) {
                const finalParams = extractParams
                    ? { ...params, ...extractParams(params) } as T
                    : params as T
                await handler(finalParams)
                return
            }

            // Sinon, essayer de convertir
            const standardParams = {
                draw: 1,
                start: 0,
                length: 10,
                ...(params as object || {}),
                ...(extractParams ? extractParams(params) : {})
            } as unknown as T

            await handler(standardParams)
        } catch (error) {
            console.error('Erreur dans le handler DataTable', error)
            throw error
        }
    }
}

/**
 * Crée un handler unifié qui gère tous les types d'événements DataTable
 * Simplifie la création de handlers pour pagination, tri, filtres, recherche
 *
 * @param loadData - Fonction qui charge les données avec les paramètres standard
 * @returns Handlers pour tous les événements DataTable
 */
export function createUnifiedDataTableHandlers(
    loadData: (params: StandardDataTableParams) => Promise<void>
) {
    return {
        onPaginationChanged: createSimpleDataTableHandler(loadData),
        onSortChanged: createSimpleDataTableHandler(loadData),
        onFilterChanged: createSimpleDataTableHandler(loadData),
        onGlobalSearchChanged: createSimpleDataTableHandler(loadData)
    }
}

