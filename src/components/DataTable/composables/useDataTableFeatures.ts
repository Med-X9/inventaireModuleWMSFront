/**
 * ⚡ Composable pour les fonctionnalités du DataTable
 * 
 * Centralise les fonctionnalités non-core :
 * - Column management (gestion des colonnes visibles, réordonnancement)
 * - Export (CSV, Spreadsheet, PDF)
 * - Persistence (sauvegarde/restauration de configuration)
 * 
 * @module useDataTableFeatures
 */

import { computed, ref, watch, watchEffect, unref, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'
import type { EmitFunction } from '../types/composables'
import { useDataTableConfig } from './useDataTableConfig'
import { useDataTablePersistence } from './useDataTablePersistence'

/**
 * Configuration pour useDataTableFeatures
 */
export interface UseDataTableFeaturesConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Fonction d'émission d'événements */
    emit: EmitFunction
    /** Instance du DataTable */
    dataTable: import('../types/composables').DataTableInstance
    /** Référence aux colonnes visibles */
    visibleColumnNames: Ref<string[]>
    /** Fonction pour mettre à jour les colonnes visibles */
    updateVisibleColumns: (columns: string[]) => void
    /** Référence aux colonnes formatées */
    formattedColumns: Ref<import('../types/dataTable').DataTableColumn[]>
}

/**
 * ⚡ Composable pour gérer les fonctionnalités du DataTable
 * 
 * @param config - Configuration du composable
 * @returns Fonctionnalités (column management, export, persistence)
 */
export function useDataTableFeatures(config: UseDataTableFeaturesConfig) {
    const { props, emit, dataTable, visibleColumnNames, updateVisibleColumns, formattedColumns } = config

    // ⚡ PERSISTENCE : Configuration sauvegardée dans localStorage
    const tableConfig = props.storageKey ? useDataTableConfig(
        props.storageKey,
        {
            visibleColumns: (() => {
                try {
                    const cols = dataTable.visibleColumns
                    const unwrapped = Array.isArray(cols) ? cols : (cols?.value || [])
                    return Array.isArray(unwrapped) ? unwrapped : []
                } catch {
                    return []
                }
            })(),
            columnOrder: (() => {
                try {
                    const cols = dataTable.visibleColumns
                    const unwrapped = Array.isArray(cols) ? cols : (cols?.value || [])
                    return Array.isArray(unwrapped) ? unwrapped : []
                } catch {
                    return []
                }
            })(),
            columnWidths: (() => {
                try {
                    const widths = dataTable.columnWidths
                    return (typeof widths === 'object' && widths !== null && !Array.isArray(widths)) ? widths : {}
                } catch {
                    return {}
                }
            })(),
            pinnedColumns: [],
            stickyHeader: false,
            pageSize: props.pageSizeProp || 20
        }
    ) : null

    // ⚡ PERSISTENCE : Gestion automatique de la persistance
    const persistence = props.storageKey ? useDataTablePersistence({
        storageKey: props.storageKey,
        tableConfig: tableConfig!
    }) : null

    // ⚡ EXPORT : État de chargement pour les exports
    const exportLoadingState = ref({
        csv: false,
        spreadsheet: false,
        pdf: false,
        csvSelection: false,
        spreadsheetSelection: false
    })

    // ⚡ EXPORT : Fonctions d'export (déléguées à dataTable)
    const exportToCsv = () => {
        if (dataTable.exportToCsv && typeof dataTable.exportToCsv === 'function') {
            return dataTable.exportToCsv()
        }
    }

    const exportToSpreadsheet = () => {
        if (dataTable.exportToSpreadsheet && typeof dataTable.exportToSpreadsheet === 'function') {
            return dataTable.exportToSpreadsheet()
        }
    }

    const exportToPdf = () => {
        if (dataTable.exportToPdf && typeof dataTable.exportToPdf === 'function') {
            return dataTable.exportToPdf()
        }
    }

    const exportSelectedToCsv = () => {
        if (dataTable.exportSelectedToCsv && typeof dataTable.exportSelectedToCsv === 'function') {
            return dataTable.exportSelectedToCsv()
        }
    }

    const exportSelectedToSpreadsheet = () => {
        if (dataTable.exportSelectedToSpreadsheet && typeof dataTable.exportSelectedToSpreadsheet === 'function') {
            return dataTable.exportSelectedToSpreadsheet()
        }
    }

    // ⚡ COLUMN MANAGEMENT : Watcher pour synchroniser les colonnes visibles avec tableConfig
    let columnChangeTimeout: number | null = null
    watchEffect(() => {
        try {
            const cols = dataTable.visibleColumns
            const colsArray = Array.isArray(cols) ? cols : (cols?.value || [])
            
            if (colsArray.length > 0 && tableConfig) {
                // Batch les changements pour éviter les appels répétés
                if (columnChangeTimeout) {
                    clearTimeout(columnChangeTimeout)
                }

                columnChangeTimeout = window.setTimeout(() => {
                    try {
                        if (tableConfig && Array.isArray(colsArray)) {
                            tableConfig.updateVisibleColumns(colsArray)
                            tableConfig.updateColumnOrder(colsArray)
                        }
                    } catch (error) {
                        // Ignorer les erreurs
                    }
                }, 16) // ~60fps
            }
        } catch {
            // Ignorer les erreurs
        }
    }, { flush: 'post' })

    // ⚡ COLUMN MANAGEMENT : Handler pour les changements de colonnes visibles
    const handleVisibleColumnsChanged = (newVisibleColumns: string[], newColumnWidths: Record<string, number>) => {
        // Filtrer UNIQUEMENT les colonnes avec hide: true (toujours masquées)
        const filteredColumns = newVisibleColumns.filter(col => {
            if (col === '__rowNumber__') return true

            const columnDef = props.columns.find(c => c.field === col)
            if (!columnDef) return false

            // Exclure UNIQUEMENT si hide: true
            if (columnDef.hide === true) return false

            return true
        })

        // S'assurer que __rowNumber__ est toujours en première position
        const columnsWithRowNumber = filteredColumns.includes('__rowNumber__')
            ? filteredColumns
            : ['__rowNumber__', ...filteredColumns]

        // Réorganiser pour s'assurer que __rowNumber__ est en première position
        if (columnsWithRowNumber[0] !== '__rowNumber__') {
            const colsWithoutRowNumber = columnsWithRowNumber.filter(col => col !== '__rowNumber__')
            updateVisibleColumns(['__rowNumber__', ...colsWithoutRowNumber])
        } else {
            updateVisibleColumns(columnsWithRowNumber)
        }

        // Mettre à jour les largeurs de colonnes
        if (dataTable.columnWidths && typeof dataTable.columnWidths === 'object') {
            const widths = dataTable.columnWidths as Record<string, number>
            Object.assign(widths, newColumnWidths)
        }

        // Sauvegarder dans tableConfig
        if (tableConfig) {
            tableConfig.updateVisibleColumns(columnsWithRowNumber)
            tableConfig.updateColumnOrder(columnsWithRowNumber)
        }
    }

    // ⚡ COLUMN MANAGEMENT : Réordonner les colonnes
    const reorderColumns = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return
        
        const newVisibleColumns = [...visibleColumnNames.value]

        // Empêcher de déplacer __rowNumber__
        const fromField = newVisibleColumns[fromIndex]
        const toField = newVisibleColumns[toIndex]

        if (fromField === '__rowNumber__' || toField === '__rowNumber__') {
            return
        }

        // Vérifier que les index sont valides
        if (fromIndex < 0 || fromIndex >= newVisibleColumns.length || 
            toIndex < 0 || toIndex >= newVisibleColumns.length) {
            return
        }

        // Réordonner les colonnes
        const [movedColumn] = newVisibleColumns.splice(fromIndex, 1)
        newVisibleColumns.splice(toIndex, 0, movedColumn)
        
        // S'assurer que __rowNumber__ reste en première position
        const rowNumberIndex = newVisibleColumns.indexOf('__rowNumber__')
        if (rowNumberIndex !== 0 && rowNumberIndex !== -1) {
            newVisibleColumns.splice(rowNumberIndex, 1)
            newVisibleColumns.unshift('__rowNumber__')
        }
        
        updateVisibleColumns(newVisibleColumns)

        // Sauvegarder dans tableConfig
        if (tableConfig) {
            tableConfig.updateVisibleColumns(newVisibleColumns)
            tableConfig.updateColumnOrder(newVisibleColumns)
        }
    }

    return {
        // Persistence
        tableConfig,
        persistence,

        // Column Management
        handleVisibleColumnsChanged,
        reorderColumns,

        // Export
        exportToCsv,
        exportToSpreadsheet,
        exportToPdf,
        exportSelectedToCsv,
        exportSelectedToSpreadsheet,
        exportLoadingState
    }
}

