/**
 * Helpers pour la gestion des modes d'usage du DataTable
 *
 * Fonctions utilitaires pour détecter et gérer les différents modes
 */

import type { DataTableProps } from '../types/dataTable'

export type DataTableMode = 'simple' | 'advanced' | 'enterprise'

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
 * Valide la configuration selon le mode détecté
 */
export function validateConfigurationForMode(props: DataTableProps): { valid: boolean; warnings: string[]; errors: string[] } {
  const mode = detectDataTableMode(props)
  const warnings: string[] = []
  const errors: string[] = []

  // Validation commune
  if (!props.columns || props.columns.length === 0) {
    errors.push('La propriété "columns" est obligatoire')
  }

  if (!props.rowDataProp && !props.dataUrl) {
    errors.push('Soit "rowDataProp" soit "dataUrl" doit être fourni')
  }

  if (props.rowDataProp && props.dataUrl) {
    warnings.push('"rowDataProp" et "dataUrl" sont tous deux fournis. "dataUrl" sera prioritaire.')
  }

  // Validations selon le mode
  switch (mode) {
    case 'simple':
      if (props.enableVirtualScrolling) {
        warnings.push('Virtual scrolling activé en mode Simple. Considérez le mode Advanced.')
      }
      if (props.enablePivot) {
        warnings.push('Pivot activé en mode Simple. Utilisez le mode Enterprise.')
      }
      break

    case 'advanced':
      if (!props.storageKey) {
        warnings.push('Storage key non fourni. La persistance sera limitée.')
      }
      break

    case 'enterprise':
      if (!props.storageKey) {
        warnings.push('Storage key recommandé pour le mode Enterprise.')
      }
      break
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  }
}

/**
 * Recommande un mode selon la configuration
 */
export function recommendMode(props: DataTableProps): { recommendedMode: DataTableMode; reason: string } {
  const currentMode = detectDataTableMode(props)

  // Si l'utilisateur a explicitement activé des features avancées
  if (props.enableVirtualScrolling || props.enablePivot || props.enableMasterDetail) {
    return {
      recommendedMode: 'enterprise',
      reason: 'Fonctionnalités avancées détectées (virtual scrolling, pivot, master-detail)'
    }
  }

  // Si données volumineuses potentielles
  if (props.dataUrl && (props.enableExport || props.enableColumnResize)) {
    return {
      recommendedMode: 'advanced',
      reason: 'Données server-side avec features étendues'
    }
  }

  // Par défaut
  return {
    recommendedMode: 'simple',
    reason: 'Configuration basique détectée'
  }
}

/**
 * Génère une configuration optimisée selon le mode
 */
export function generateOptimizedConfig(mode: DataTableMode, baseProps: DataTableProps): Partial<DataTableProps> {
  const optimized: Partial<DataTableProps> = { ...baseProps }

  switch (mode) {
    case 'simple':
      // Désactiver toutes les features avancées
      optimized.enableColumnPinning = false
      optimized.enableColumnResize = false
      optimized.enableColumnGrouping = false
      optimized.enableColumnAggregation = false
      optimized.enableInlineEditing = false
      optimized.enableBatchEditing = false
      optimized.enableExport = false
      optimized.enableVirtualScrolling = false
      optimized.enableInfiniteScroll = false
      optimized.enablePivot = false
      optimized.enableMasterDetail = false
      optimized.enableAdvancedEditing = false
      optimized.enableSetFilters = false

      // Activer les basiques
      optimized.enableFiltering = baseProps.enableFiltering !== false
      optimized.enableGlobalSearch = baseProps.enableGlobalSearch !== false
      optimized.pagination = baseProps.pagination !== false
      optimized.showColumnSelector = baseProps.showColumnSelector !== false
      break

    case 'advanced':
      // Activer les features utiles
      optimized.enableColumnResize = baseProps.enableColumnResize !== false
      optimized.enableColumnPinning = baseProps.enableColumnPinning !== false
      optimized.enableExport = baseProps.enableExport !== false
      optimized.enableInlineEditing = baseProps.enableInlineEditing !== false

      // Désactiver les features trop complexes
      optimized.enablePivot = false
      optimized.enableMasterDetail = false
      optimized.enableVirtualScrolling = false
      optimized.enableInfiniteScroll = false
      optimized.enableAdvancedEditing = false
      break

    case 'enterprise':
      // Tout activer selon les besoins
      optimized.enableColumnResize = baseProps.enableColumnResize !== false
      optimized.enableColumnPinning = baseProps.enableColumnPinning !== false
      optimized.enableColumnGrouping = baseProps.enableColumnGrouping !== false
      optimized.enableColumnAggregation = baseProps.enableColumnAggregation !== false
      optimized.enableInlineEditing = baseProps.enableInlineEditing !== false
      optimized.enableBatchEditing = baseProps.enableBatchEditing !== false
      optimized.enableExport = baseProps.enableExport !== false
      optimized.enableSetFilters = baseProps.enableSetFilters !== false
      optimized.enableVirtualScrolling = baseProps.enableVirtualScrolling || false
      optimized.enableInfiniteScroll = baseProps.enableInfiniteScroll || false
      optimized.enablePivot = baseProps.enablePivot || false
      optimized.enableMasterDetail = baseProps.enableMasterDetail || false
      optimized.enableAdvancedEditing = baseProps.enableAdvancedEditing || false
      break
  }

  return optimized
}

/**
 * Calcule les métriques d'usage du DataTable
 */
export function calculateUsageMetrics(props: DataTableProps): {
  mode: DataTableMode
  featureCount: number
  complexity: 'low' | 'medium' | 'high'
  recommendedOptimizations: string[]
} {
  const mode = detectDataTableMode(props)

  const features = [
    props.enableColumnPinning,
    props.enableColumnResize,
    props.enableColumnGrouping,
    props.enableColumnAggregation,
    props.enableInlineEditing,
    props.enableBatchEditing,
    props.enableExport,
    props.enableVirtualScrolling,
    props.enableInfiniteScroll,
    props.enablePivot,
    props.enableMasterDetail,
    props.enableAdvancedEditing,
    props.enableSetFilters
  ].filter(Boolean).length

  let complexity: 'low' | 'medium' | 'high'
  if (features <= 3) complexity = 'low'
  else if (features <= 7) complexity = 'medium'
  else complexity = 'high'

  const optimizations: string[] = []

  if (features > 5 && !props.enableVirtualScrolling) {
    optimizations.push('Considérez le virtual scrolling pour améliorer les performances')
  }

  if (props.dataUrl && !props.storageKey) {
    optimizations.push('Ajoutez un storageKey pour la persistance des préférences utilisateur')
  }

  if (complexity === 'high' && mode !== 'enterprise') {
    optimizations.push('Passez en mode Enterprise pour optimiser les performances')
  }

  return {
    mode,
    featureCount: features,
    complexity,
    recommendedOptimizations: optimizations
  }
}
