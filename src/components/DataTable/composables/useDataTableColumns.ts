/**
 * Composable pour gérer les colonnes formatées du DataTable
 * 
 * Centralise la logique de formatage et de gestion des colonnes.
 * 
 * @module useDataTableColumns
 */

import { computed, ref, watch, type Ref, type ComputedRef } from 'vue'
import type { DataTableProps, DataTableColumn } from '../types/dataTable'
import { cellRenderersService } from '../services/cellRenderers'
import { formatDateOnly } from '../utils/formatUtils'
import { detectDynamicColumns, mergeColumns } from '../utils/dynamicColumnsDetector'

/**
 * Configuration pour useDataTableColumns
 */
export interface UseDataTableColumnsConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Composable useDataTable */
    dataTable: any
    /** Colonnes visibles (ref ou computed) */
    visibleColumnNames: Ref<string[]>
}

/**
 * Crée la colonne de numéro de ligne
 */
function createRowNumberColumn(dataTable: any, props: DataTableProps): DataTableColumn {
    return dataTable?.createRowNumberColumn?.() || {
        field: '__rowNumber__',
        headerName: '#',
        sortable: false,
        filterable: false,
        width: 60,
        editable: false,
        visible: true,
        draggable: false,
        autoSize: false,
        hide: false,
        resizable: false,
        pinned: 'left',
        description: 'Numéro de ligne',
        dataType: 'text' as const,
        cellRenderer: (params: any) => {
            const currentPage = dataTable?.effectiveCurrentPage || props.currentPageProp || 1
            const pageSize = dataTable?.effectivePageSize || props.pageSizeProp || 10
            const rowIndex = params?.rowIndex ?? 0
            const rowNumber = (currentPage - 1) * pageSize + rowIndex + 1
            return `<span class="row-number">${rowNumber}</span>`
        }
    }
}

/**
 * Composable pour gérer les colonnes formatées
 */
export function useDataTableColumns(config: UseDataTableColumnsConfig) {
    const { props, dataTable, visibleColumnNames } = config

    /**
     * Colonnes dynamiques détectées (si enableDynamicColumns est activé)
     * 
     * ⚡ OPTIMISÉ : Désactivé automatiquement pour 500+ lignes pour éviter les lenteurs
     * Utilise un cache et n'analyse qu'un échantillon pour de meilleures performances
     */
    const dynamicColumns = computed<DataTableColumn[]>(() => {
        if (!props.enableDynamicColumns) {
            return []
        }

        // Récupérer les données depuis dataTable
        const rowData = dataTable?.paginatedData || dataTable?.rowData || props.rowDataProp || []
        
        if (!rowData || rowData.length === 0) {
            return []
        }

        const dataArray = rowData as Record<string, unknown>[]
        
        // ⚡ OPTIMISATION CRITIQUE : Pour 500+ lignes, désactiver la détection dynamique
        // La détection dynamique est très coûteuse avec de grandes quantités de données
        // et cause des blocages de 2 minutes. Les colonnes doivent être définies statiquement.
        if (dataArray.length >= 500) {
            // Retourner un tableau vide pour éviter les blocages
            // Les colonnes doivent être définies dans props.columns pour les grandes quantités
            return []
        }

        // Pour moins de 500 lignes, la détection est acceptable
        // La fonction detectDynamicColumns utilise déjà un cache et un échantillon limité
        const detectedColumns = detectDynamicColumns(
            dataArray,
            props.columns,
            props.dynamicColumnsConfig || {}
        )

        return detectedColumns
    })

    /**
     * Colonnes fusionnées (statiques + dynamiques)
     */
    const mergedColumns = computed<DataTableColumn[]>(() => {
        const dynamicCols = dynamicColumns.value
        
        if (dynamicCols.length === 0) {
            return props.columns
        }

        // Fusionner les colonnes statiques avec les colonnes dynamiques
        return mergeColumns(
            props.columns,
            dynamicCols,
            props.dynamicColumnsConfig?.customDetector ? 'end' : 'end'
        )
    })

    /**
     * Colonnes formatées avec les renderers appliqués
     */
    const formattedColumns = computed<DataTableColumn[]>(() => {
        // Créer la colonne de numéro de ligne
        const rowNumberColumn = createRowNumberColumn(dataTable, props)

        // Utiliser les colonnes fusionnées (statiques + dynamiques)
        const allColumns = mergedColumns.value

        // Filtrer les colonnes pour éviter les doublons de __rowNumber__
        // ET exclure les colonnes avec visible: false par défaut (sauf si elles sont dans visibleColumnNames)
        const otherColumns = allColumns.filter(col => {
            if (col.field === '__rowNumber__') return false
            
            // Exclure les colonnes avec hide: true (toujours masquées)
            if (col.hide === true) return false
            
            // Exclure les colonnes avec visible: false SAUF si elles sont dans visibleColumnNames
            // (c'est-à-dire qu'elles ont été explicitement ajoutées via ColumnManager)
            if (col.visible === false) {
                const isInVisibleColumnNames = visibleColumnNames.value.includes(col.field)
                if (!isInVisibleColumnNames) {
                    return false
                }
            }
            
            return true
        })

        // Ajouter la colonne de numéro de ligne en première position
        const columnsWithRowNumber = [rowNumberColumn, ...otherColumns]

        const result = columnsWithRowNumber.map(column => {
            // Utiliser le service cellRenderers pour détecter et appliquer les renderers appropriés
            const renderer = cellRenderersService.getRenderer(column)

            if (renderer) {
                return {
                    ...column,
                    valueFormatter: (params: any) => {
                        // Si la colonne a déjà un formateur personnalisé, l'utiliser
                        if (column.valueFormatter) {
                            return column.valueFormatter(params)
                        }
                        // Sinon, utiliser le renderer du service
                        return renderer(params.value, column, params.data, params.rowIndex)
                    }
                }
            }

            // Fallback pour les colonnes de type date
            if (column.dataType === 'date' || column.dataType === 'datetime') {
                return {
                    ...column,
                    valueFormatter: (params: any) => {
                        // Si la colonne a déjà un formateur personnalisé, l'utiliser
                        if (column.valueFormatter) {
                            return column.valueFormatter(params)
                        }
                        // Sinon, appliquer le formatage de date
                        return formatDateOnly(params.value)
                    }
                }
            }

            return column
        })

        return result
    })

    /**
     * Cache pour les colonnes visibles
     */
    const visibleColumnsCache = ref<{ columns: DataTableColumn[], visibleColumnsKeys: string } | null>(null)

    /**
     * Colonnes visibles filtrées
     */
    const visibleColumns = computed<DataTableColumn[]>(() => {
        const visibleCols = visibleColumnNames.value || []
        const visibleColsKey = visibleCols.join(',')

        if (!formattedColumns.value || formattedColumns.value.length === 0) {
            // Si pas de colonnes, créer au moins la colonne de numérotation
            const rowNumberColumn = createRowNumberColumn(dataTable, props)
            const result = [rowNumberColumn]
            visibleColumnsCache.value = { columns: result, visibleColumnsKeys: visibleColsKey }
            return result
        }

        // Toujours inclure la colonne de numéro de ligne en premier
        let rowNumberColumn = formattedColumns.value.find(col => col.field === '__rowNumber__')

        // Si la colonne n'existe pas, la créer
        if (!rowNumberColumn) {
            rowNumberColumn = createRowNumberColumn(dataTable, props)
        }

        // Filtrer les autres colonnes selon leur visibilité
        let otherColumns: DataTableColumn[] = []
        const currentVisibleCols = visibleColumnNames.value
        if (currentVisibleCols.length > 0) {
            // Utiliser un Set pour une recherche O(1) au lieu de O(n)
            const visibleSet = new Set(currentVisibleCols)

            otherColumns = formattedColumns.value.filter(column => {
                if (column.field === '__rowNumber__') return false

                // Vérifier si la colonne est dans la liste des colonnes visibles
                const isInVisibleSet = visibleSet.has(column.field)
                if (!isInVisibleSet) {
                    return false
                }

                // Vérifier la définition initiale de la colonne dans props.columns
                const columnDef = props.columns.find(c => c.field === column.field)
                if (columnDef) {
                    // Exclure UNIQUEMENT si hide: true (toujours masquée)
                    if (columnDef.hide === true) {
                        return false
                    }
                }

                // Si la colonne est dans visibleSet, l'inclure
                return true
            })
        } else {
            // Si pas de visibleColumns défini, utiliser toutes les colonnes sauf __rowNumber__
            // ET exclure UNIQUEMENT celles avec hide: true
            otherColumns = formattedColumns.value.filter(column => {
                if (column.field === '__rowNumber__') return false

                // Vérifier la définition initiale de la colonne dans props.columns
                const columnDef = props.columns.find(c => c.field === column.field)
                if (columnDef) {
                    // Exclure UNIQUEMENT si hide: true (toujours masquée)
                    if (columnDef.hide === true) return false
                    // Exclure si visible: false (masquée par défaut si pas dans visibleColumns)
                    if (columnDef.visible === false) return false
                }

                return true
            })
        }

        // Toujours inclure la colonne de numéro de ligne en première position
        const result = [rowNumberColumn, ...otherColumns]
        visibleColumnsCache.value = { columns: result, visibleColumnsKeys: visibleColsKey }
        
        return result
    })

    /**
     * Colonnes pour le gestionnaire (exclut UNIQUEMENT les colonnes avec hide: true)
     * Doit inclure TOUTES les colonnes disponibles, y compris celles avec visible: false
     * pour que l'utilisateur puisse les activer via ColumnManager
     */
    const columnsForManager = computed<DataTableColumn[]>(() => {
        // Utiliser les colonnes fusionnées (statiques + dynamiques)
        const allColumns = mergedColumns.value
        
        // et appliquer les renderers comme dans formattedColumns
        const rowNumberColumn = createRowNumberColumn(dataTable, props)
        
        // Filtrer les colonnes pour exclure uniquement hide: true
        const otherColumns = allColumns
            .filter(col => col.field !== '__rowNumber__' && col.hide !== true)
            .map(column => {
                // Appliquer les renderers comme dans formattedColumns
                const renderer = cellRenderersService.getRenderer(column)

                if (renderer) {
                    return {
                        ...column,
                        valueFormatter: (params: any) => {
                            if (column.valueFormatter) {
                                return column.valueFormatter(params)
                            }
                            return renderer(params.value, column, params.data, params.rowIndex)
                        }
                    }
                }

                // Fallback pour les colonnes de type date
                if (column.dataType === 'date' || column.dataType === 'datetime') {
                    return {
                        ...column,
                        valueFormatter: (params: any) => {
                            if (column.valueFormatter) {
                                return column.valueFormatter(params)
                            }
                            return formatDateOnly(params.value)
                        }
                    }
                }

                return column
            })

        const result = [rowNumberColumn, ...otherColumns]
        
        return result
    })

    return {
        formattedColumns,
        visibleColumns,
        columnsForManager,
        createRowNumberColumn: () => createRowNumberColumn(dataTable, props)
    }
}

