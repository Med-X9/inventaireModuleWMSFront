/**
 * Configuration standardisée et simplifiée pour les DataTables
 * Unifie toutes les configurations répétées dans les composables
 *
 * @module createDataTableConfig
 */

import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import type { DataTableColumn } from '@/types/dataTable'
import { createSimpleDataTableHandler, isStandardDataTableParams } from './dataTableHelpers'

/**
 * Configuration de base pour un DataTable
 */
export interface DataTableConfig {
    /** Colonnes du DataTable */
    columns: DataTableColumn[]
    /** Titre pour l'export */
    exportTitle?: string
    /** Storage key pour la persistance */
    storageKey?: string
    /** Actions personnalisées */
    actions?: any[]
    /** Paramètres personnalisés pour les appels API */
    customParams?: Record<string, any> | (() => Record<string, any>)
    /** Taille de page par défaut */
    defaultPageSize?: number
    /** Activer l'édition inline */
    enableEditing?: boolean
    /** Activer la sélection de lignes */
    enableSelection?: boolean
}

/**
 * Configuration standardisée des props pour le composant DataTable
 */
export interface StandardDataTableProps {
    /** Colonnes */
    columns: DataTableColumn[]
    /** Activer la pagination côté serveur */
    serverSidePagination?: boolean
    /** Activer le filtrage côté serveur */
    serverSideFiltering?: boolean
    /** Activer le tri côté serveur */
    serverSideSorting?: boolean
    /** Activer la pagination */
    pagination?: boolean
    /** Activer le filtrage */
    enableFiltering?: boolean
    /** Activer l'édition inline */
    inlineEditing?: boolean
    /** Activer la sélection de lignes */
    rowSelection?: boolean
    /** Afficher le sélecteur de colonnes */
    showColumnSelector?: boolean
    /** Titre pour l'export */
    exportTitle?: string
    /** Storage key */
    storageKey?: string
    /** Actions */
    actions?: any[]
    /** Paramètres personnalisés */
    customDataTableParams?: Record<string, any> | (() => Record<string, any>)
    /** Loading state */
    loading?: boolean
}

/**
 * Crée une configuration standardisée pour les props du DataTable
 * Simplifie la création en utilisant des valeurs par défaut intelligentes
 *
 * @param config - Configuration du DataTable
 * @param overrides - Overrides optionnels pour personnaliser
 * @returns Props standardisés pour le composant DataTable
 */
export function createStandardDataTableProps(
    config: DataTableConfig,
    overrides?: Partial<StandardDataTableProps>
): StandardDataTableProps {
    // Déterminer customParams (peut être une fonction ou un objet)
    const customParams = typeof config.customParams === 'function'
        ? config.customParams()
        : config.customParams || {}

    return {
        columns: config.columns,
        // Server-side par défaut (recommandé pour les performances)
        serverSidePagination: true,
        serverSideFiltering: true,
        serverSideSorting: true,
        // UI features
        pagination: true,
        enableFiltering: true,
        inlineEditing: config.enableEditing ?? false,
        rowSelection: config.enableSelection ?? (config.actions ? config.actions.length > 0 : false),
        showColumnSelector: false,
        // Export
        exportTitle: config.exportTitle,
        // Storage
        storageKey: config.storageKey,
        // Actions
        actions: config.actions || [],
        // Custom params
        customDataTableParams: customParams,
        // Overrides
        ...overrides
    }
}

/**
 * Configuration pour les handlers d'événements DataTable
 * Simplifie la création des handlers qui acceptent StandardDataTableParams
 */
export interface DataTableHandlers {
    onPaginationChanged?: (params: StandardDataTableParams) => Promise<void> | void
    onSortChanged?: (params: StandardDataTableParams) => Promise<void> | void
    onFilterChanged?: (params: StandardDataTableParams) => Promise<void> | void
    onGlobalSearchChanged?: (params: StandardDataTableParams) => Promise<void> | void
    onSelectionChanged?: (selectedRows: Set<string>) => void
}

/**
 * Crée des handlers standardisés pour les événements DataTable
 * Tous les handlers acceptent automatiquement StandardDataTableParams
 *
 * @param handlers - Configuration des handlers
 * @returns Handlers compatibles avec les événements du DataTable
 */
export function createStandardDataTableHandlers(handlers: DataTableHandlers): DataTableHandlers {
    return handlers
}

/**
 * Configuration complète pour un DataTable avec store Pinia
 * Simplifie l'intégration avec les stores Pinia existants
 */
export interface PiniaDataTableConfig<T = any> extends DataTableConfig {
    /** Store Pinia à utiliser */
    store: any
    /** ID du store (optionnel, pour trouver l'action automatiquement) */
    storeId?: string
    /** Nom de l'action à appeler (optionnel, détecté automatiquement si non fourni) */
    actionName?: string
    /** Paramètres additionnels à passer à l'action */
    additionalParams?: Record<string, any> | (() => Record<string, any>)
    /** Charger automatiquement au montage */
    autoLoad?: boolean
}

/**
 * Configuration complète d'un DataTable
 * Combine props et handlers en une seule configuration
 */
export interface CompleteDataTableConfig<T = any> {
    /** Configuration de base */
    config: DataTableConfig
    /** Props standardisés */
    props: StandardDataTableProps
    /** Handlers d'événements */
    handlers: DataTableHandlers
    /** Référence pour accéder aux méthodes du DataTable */
    ref?: any
}

/**
 * Crée une configuration complète pour un DataTable
 * Simplifie la création en combinant props et handlers
 *
 * @param config - Configuration de base
 * @param handlers - Handlers d'événements
 * @param overrides - Overrides optionnels
 * @returns Configuration complète prête à l'emploi
 */
export function createCompleteDataTableConfig(
    config: DataTableConfig,
    handlers: DataTableHandlers = {},
    overrides?: Partial<StandardDataTableProps>
): CompleteDataTableConfig {
    return {
        config,
        props: createStandardDataTableProps(config, overrides),
        handlers: createStandardDataTableHandlers(handlers)
    }
}

/**
 * Helper pour créer rapidement un handler qui délègue à un store Pinia
 * Simplifie l'intégration avec les stores existants
 *
 * @param storeAction - Action du store à appeler
 * @param extractParams - Fonction pour extraire des paramètres additionnels
 * @returns Handler compatible avec les événements DataTable
 */
export function createStoreActionHandler<T extends StandardDataTableParams = StandardDataTableParams>(
    storeAction: (params: T) => Promise<any>,
    extractParams?: (params: StandardDataTableParams) => Partial<T>
) {
    return createSimpleDataTableHandler<T>(async (params) => {
        const finalParams = extractParams
            ? { ...params, ...extractParams(params) } as T
            : params as T
        await storeAction(finalParams)
    })
}
