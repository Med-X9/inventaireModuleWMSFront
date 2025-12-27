/**
 * Composable pour la gestion des modes d'usage du DataTable
 *
 * Détecte automatiquement le mode d'usage et applique les configurations par défaut
 */

import { ref, computed, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'

export type DataTableMode = 'simple' | 'advanced' | 'enterprise'

export interface DataTableModeConfig {
  /** Mode détecté automatiquement */
  mode: Ref<DataTableMode>
  /** Configuration optimisée pour le mode */
  optimizedConfig: Ref<Partial<DataTableProps>>
  /** Fonctionnalités activées par défaut */
  defaultFeatures: Ref<Record<string, boolean>>
  /** Recommandations d'usage */
  recommendations: Ref<string[]>
}

/**
 * Détecte automatiquement le mode d'usage du DataTable
 */
export function detectDataTableMode(props: DataTableProps): DataTableMode {
  // Mode Enterprise : Toutes les features avancées activées
  if (props.enablePivot ||
      props.enableMasterDetail ||
      props.enableVirtualScrolling ||
      props.enableInfiniteScroll ||
      props.enableAdvancedEditing) {
    return 'enterprise'
  }

  // Mode Advanced : Features étendues activées
  if (props.enableColumnPinning ||
      props.enableColumnResize ||
      props.enableColumnGrouping ||
      props.enableColumnAggregation ||
      props.enableBatchEditing ||
      props.enableInlineEditing ||
      props.enableExport ||
      props.enableSetFilters) {
    return 'advanced'
  }

  // Mode Simple : Configuration basique (server-side ou client-side)
  return 'simple'
}

/**
 * Configuration optimisée par mode
 */
export function getOptimizedConfigForMode(mode: DataTableMode, props: DataTableProps): Partial<DataTableProps> {
  const baseConfig: Partial<DataTableProps> = {
    // Fonctionnalités de base toujours activées
    enableFiltering: true,
    enableGlobalSearch: true,
    pagination: true,
    showColumnSelector: true,
    rowSelection: false, // Désactivé par défaut, mais peut être activé
  }

  switch (mode) {
    case 'simple':
      return {
        ...baseConfig,
        // Server-side par défaut si dataUrl fourni
        serverSidePagination: !!props.dataUrl,
        serverSideSorting: !!props.dataUrl,
        serverSideFiltering: !!props.dataUrl,
        // Features avancées désactivées
        enableColumnPinning: false,
        enableColumnResize: false,
        enableExport: false,
        enableInlineEditing: false,
        // Optimisations performance
        enableVirtualScrolling: false,
        enableInfiniteScroll: false,
      }

    case 'advanced':
      return {
        ...baseConfig,
        // Server-side par défaut si dataUrl fourni
        serverSidePagination: !!props.dataUrl,
        serverSideSorting: !!props.dataUrl,
        serverSideFiltering: !!props.dataUrl,
        // Features avancées activées
        enableColumnResize: props.enableColumnResize !== false,
        enableColumnPinning: props.enableColumnPinning !== false,
        enableExport: props.enableExport !== false,
        enableInlineEditing: props.enableInlineEditing !== false,
        // Optimisations conditionnelles
        enableVirtualScrolling: props.enableVirtualScrolling || false,
        enableInfiniteScroll: props.enableInfiniteScroll || false,
      }

    case 'enterprise':
      return {
        ...baseConfig,
        // Server-side par défaut si dataUrl fourni
        serverSidePagination: !!props.dataUrl,
        serverSideSorting: !!props.dataUrl,
        serverSideFiltering: !!props.dataUrl,
        // Toutes les features disponibles
        enableColumnResize: props.enableColumnResize !== false,
        enableColumnPinning: props.enableColumnPinning !== false,
        enableColumnGrouping: props.enableColumnGrouping !== false,
        enableColumnAggregation: props.enableColumnAggregation !== false,
        enableInlineEditing: props.enableInlineEditing !== false,
        enableBatchEditing: props.enableBatchEditing !== false,
        enableExport: props.enableExport !== false,
        enableSetFilters: props.enableSetFilters !== false,
        enableVirtualScrolling: props.enableVirtualScrolling || false,
        enableInfiniteScroll: props.enableInfiniteScroll || false,
        enablePivot: props.enablePivot || false,
        enableMasterDetail: props.enableMasterDetail || false,
        enableAdvancedEditing: props.enableAdvancedEditing || false,
      }

    default:
      return baseConfig
  }
}

/**
 * Fonctionnalités activées par défaut selon le mode
 */
export function getDefaultFeaturesForMode(mode: DataTableMode): Record<string, boolean> {
  switch (mode) {
    case 'simple':
      return {
        pagination: true,
        sorting: true,
        filtering: true,
        globalSearch: true,
        columnSelector: true,
        rowSelection: false,
        columnResize: false,
        columnPinning: false,
        export: false,
        inlineEditing: false,
        virtualScrolling: false,
        infiniteScroll: false,
      }

    case 'advanced':
      return {
        pagination: true,
        sorting: true,
        filtering: true,
        globalSearch: true,
        columnSelector: true,
        rowSelection: true,
        columnResize: true,
        columnPinning: true,
        export: true,
        inlineEditing: true,
        virtualScrolling: false,
        infiniteScroll: false,
      }

    case 'enterprise':
      return {
        pagination: true,
        sorting: true,
        filtering: true,
        globalSearch: true,
        columnSelector: true,
        rowSelection: true,
        columnResize: true,
        columnPinning: true,
        columnGrouping: true,
        columnAggregation: true,
        export: true,
        inlineEditing: true,
        batchEditing: true,
        virtualScrolling: true,
        infiniteScroll: true,
        pivot: true,
        masterDetail: true,
        advancedEditing: true,
        setFilters: true,
      }

    default:
      return {}
  }
}

/**
 * Recommandations d'usage selon le mode
 */
export function getRecommendationsForMode(mode: DataTableMode): string[] {
  switch (mode) {
    case 'simple':
      return [
        'Utilisez ce mode pour les tables simples avec données server-side',
        'Idéal pour les listes basiques avec pagination',
        'Configurez dataUrl pour activer automatiquement le server-side',
        'Les données client-side sont aussi supportées'
      ]

    case 'advanced':
      return [
        'Mode recommandé pour la plupart des applications métier',
        'Active les fonctionnalités essentielles sans surcharge',
        'Configurez enableRowSelection pour la sélection multiple',
        'Utilisez enableExport pour les exports CSV/Excel'
      ]

    case 'enterprise':
      return [
        'Mode complet pour les applications complexes',
        'Active toutes les fonctionnalités disponibles',
        'Utilisez enableVirtualScrolling pour de gros volumes de données',
        'Configurez enablePivot pour les analyses croisées',
        'enableMasterDetail pour les relations parent/enfant'
      ]

    default:
      return []
  }
}

/**
 * Composable principal pour la gestion des modes
 */
export function useDataTableModes(props: DataTableProps): DataTableModeConfig {
  // Détection automatique du mode
  const mode = ref<DataTableMode>(detectDataTableMode(props))

  // Configuration optimisée
  const optimizedConfig = computed(() => getOptimizedConfigForMode(mode.value, props))

  // Fonctionnalités par défaut
  const defaultFeatures = computed(() => getDefaultFeaturesForMode(mode.value))

  // Recommandations
  const recommendations = computed(() => getRecommendationsForMode(mode.value))

  // Mise à jour du mode si les props changent
  const updateMode = () => {
    mode.value = detectDataTableMode(props)
  }

  return {
    mode,
    optimizedConfig,
    defaultFeatures,
    recommendations,
    // Actions
    updateMode
  }
}
