import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  ColDef,
  GridReadyEvent,
  FirstDataRenderedEvent,
  GridApi,
  CsvExportParams,
  SelectionChangedEvent,
  CellKeyDownEvent,
  CellEditingStoppedEvent,
  ModelUpdatedEvent,
  CellValueChangedEvent,
  CellClickedEvent
} from 'ag-grid-community'
import type { ActionConfig, TableRow, DataTableColumn, DetailConfig, RowWithDetails } from '@/interfaces/dataTable'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export interface UseDataTableProps<T = Record<string, unknown>> {
  columns: DataTableColumn[]
  rowDataProp: T[]
  dataUrl?: string
  enableFiltering: boolean
  pagination: boolean
  storageKey: string
  actions: ActionConfig<T>[]
  actionsHeaderName: string
  rowSelection: boolean
  exportTitle: string
  inlineEditing: boolean
  maxRowsForDynamicHeight: number
  showColumnSelector: boolean
  showDetails: boolean
  // NOUVEAU: Permettre de désactiver la confirmation automatique
  autoConfirmEdits?: boolean
}

export function useDataTable<T extends Record<string, unknown> = Record<string, unknown>>(
  props: UseDataTableProps<T>
) {
  const gridApi = ref<GridApi | null>(null)
  const originalRowData = ref(props.rowDataProp.slice() as T[])

  // NOUVEAU: Map pour gérer l'expansion par colonne
  // Clé: "rowId--fieldName", Valeur: boolean
  const expandedCells = ref<Map<string, boolean>>(new Map())

  // Données d'affichage avec gestion des détails
  const rowData = ref<RowWithDetails[]>([])

  const pageSize = ref(50)
  const paginationStorageKey = `${props.storageKey}_paginationState`

  // Dynamic height management
  const calculatedHeight = ref(470)

  // Export dropdown state
  const showExportDropdown = ref(false)
  const exportDropdownRef = ref<HTMLElement | null>(null)

  // Check if grid is valid and not destroyed
  const isGridValid = (): boolean => {
    return !!(gridApi.value && !gridApi.value.isDestroyed())
  }

  // NOUVEAU: Fonction pour générer la clé d'expansion
  const getExpansionKey = (rowId: string, fieldName: string): string => {
    return `${rowId}--${fieldName}`
  }

  // NOUVEAU: Fonction pour vérifier si une cellule est étendue
  const isCellExpanded = (rowId: string, fieldName: string): boolean => {
    return expandedCells.value.get(getExpansionKey(rowId, fieldName)) || false
  }

  // NOUVEAU: Fonction pour basculer l'expansion d'une cellule spécifique
  const toggleCellExpansion = (rowId: string, fieldName: string) => {
    const key = getExpansionKey(rowId, fieldName)
    const currentState = expandedCells.value.get(key) || false
    expandedCells.value.set(key, !currentState)
    buildDisplayData()

    // Forcer le rafraîchissement de la grille
    if (isGridValid()) {
      gridApi.value!.setGridOption('rowData', rowData.value)
    }
  }

  // MODIFIÉ: Construction des données d'affichage avec support du tri hiérarchique
  const buildDisplayData = () => {
    if (!props.showDetails) {
      rowData.value = originalRowData.value.slice() as RowWithDetails[]
      return
    }

    const newData: RowWithDetails[] = []

    originalRowData.value.forEach((parentRow, parentIndex) => {
      // Générer un ID unique pour la ligne parent
      const rowId = String(parentRow.id || (parentRow as Record<string, unknown>).reference || (parentRow as Record<string, unknown>).name || Math.random().toString(36).substr(2, 9))

      // NOUVEAU: Ajouter des champs de tri hiérarchique
      const sortOrder = parentIndex * 1000 // Espacement large pour les enfants

      // Ajouter la ligne parent avec ordre de tri
      newData.push({
        ...parentRow,
        id: rowId,
        isChild: false,
        parentId: null,
        _sortOrder: sortOrder,
        _parentSortOrder: sortOrder,
        _isMainRow: true
      })

      // Collecter toutes les données de détails étendues pour cette ligne
      const allExpandedDetails: Array<{
        config: DetailConfig
        data: unknown[]
        fieldName: string
      }> = []

      props.columns.forEach(column => {
        if (column.detailConfig && column.field) {
          const detailConfig = column.detailConfig
          const fieldName = column.field

          // Vérifier si CETTE colonne spécifique est étendue pour CETTE ligne
          if (isCellExpanded(rowId, fieldName)) {
            const detailData = (parentRow as Record<string, unknown>)[detailConfig.key]
            
            if (Array.isArray(detailData) && detailData.length > 0) {
              allExpandedDetails.push({
                config: detailConfig,
                data: detailData,
                fieldName
              })
            }
          }
        }
      })

      // Si on a des détails étendus, créer les lignes enfant fusionnées
      if (allExpandedDetails.length > 0) {
        // Trouver le nombre maximum d'éléments parmi toutes les colonnes étendues
        const maxItems = Math.max(...allExpandedDetails.map(detail => detail.data.length))

        // Créer une ligne enfant pour chaque index jusqu'au maximum
        for (let index = 0; index < maxItems; index++) {
          const childRow: RowWithDetails = {
            id: `${rowId}__details__${index}`,
            isChild: true,
            parentId: rowId,
            childType: 'merged_details',
            originalItem: null,
            // NOUVEAU: Ordre de tri pour maintenir les enfants près du parent
            _sortOrder: sortOrder + index + 1,
            _parentSortOrder: sortOrder,
            _isMainRow: false
          }

          // Pour chaque colonne étendue, ajouter les données à l'index correspondant
          allExpandedDetails.forEach(({ config, data, fieldName }) => {
            const item = data[index] // Peut être undefined si cette colonne a moins d'éléments
            
            if (item !== undefined) {
              // Remplir les colonnes configurées pour les détails
              if (config.columns) {
                config.columns.forEach(colConfig => {
                  const value = colConfig.valueKey && typeof item === 'object' && item !== null 
                    ? (item as Record<string, unknown>)[colConfig.valueKey] 
                    : item
                  const formattedValue = colConfig.formatter ? colConfig.formatter(value, item) : String(value || '')
                  
                  childRow[colConfig.field] = formattedValue
                })
              } else {
                // Configuration par défaut
                let displayValue: string
                if (config.labelField && typeof item === 'object' && item !== null) {
                  displayValue = String((item as Record<string, unknown>)[config.labelField] || '')
                } else {
                  displayValue = String(item || '')
                }
                childRow[fieldName] = displayValue
              }
            } else {
              // Si pas de données à cet index pour cette colonne, laisser vide
              if (config.columns) {
                config.columns.forEach(colConfig => {
                  childRow[colConfig.field] = ''
                })
              } else {
                childRow[fieldName] = ''
              }
            }
          })

          newData.push(childRow)
        }
      }
    })

    rowData.value = newData
  }

  // Reconstruction initiale des données
  buildDisplayData()

  // Watch pour les changements de données
  watch(() => props.rowDataProp, v => {
    originalRowData.value = v.slice() as T[]
    // Reset les expansions quand les données changent
    expandedCells.value.clear()
    buildDisplayData()
  }, { immediate: false, deep: true })

  // Calculate optimal height
  const calculateOptimalHeight = () => {
    if (!isGridValid()) return

    const displayedRowCount = gridApi.value!.getDisplayedRowCount()
    const headerHeight = 48
    const rowHeight = 42
    const paginationHeight = props.pagination ? 52 : 0
    const scrollbarBuffer = 20

    if (displayedRowCount <= props.maxRowsForDynamicHeight) {
      const contentHeight = headerHeight + (displayedRowCount * rowHeight) + paginationHeight + scrollbarBuffer
      calculatedHeight.value = Math.max(contentHeight, 200)
    } else {
      calculatedHeight.value = 470
    }
  }

  // Dynamic grid style
  const dynamicGridStyle = computed(() => ({
    width: '100%',
    height: `${calculatedHeight.value}px`
  }))

  const savePaginationState = () => {
    if (!isGridValid() || !props.pagination) return

    try {
      const currentPage = gridApi.value!.paginationGetCurrentPage()
      const currentPageSize = gridApi.value!.paginationGetPageSize()

      const state = {
        currentPage,
        pageSize: currentPageSize,
        timestamp: Date.now()
      }

      localStorage.setItem(paginationStorageKey, JSON.stringify(state))
    } catch (err) {
      console.warn('Error saving pagination:', err)
    }
  }

  const restorePaginationState = () => {
    if (!isGridValid() || !props.pagination) return

    try {
      const saved = localStorage.getItem(paginationStorageKey)
      if (!saved) return

      const state = JSON.parse(saved)
      const maxAge = 24 * 60 * 60 * 1000 // 24h

      if (state.timestamp && Date.now() - state.timestamp > maxAge) {
        localStorage.removeItem(paginationStorageKey)
        return
      }

      // Restore page size first
      if (typeof state.pageSize === 'number' && state.pageSize > 0) {
        pageSize.value = state.pageSize
        gridApi.value!.setGridOption('paginationPageSize', state.pageSize)
      }

      // Then restore current page after a delay
      if (typeof state.currentPage === 'number' && state.currentPage >= 0) {
        setTimeout(() => {
          if (isGridValid()) {
            const totalPages = gridApi.value!.paginationGetTotalPages()
            const targetPage = Math.min(state.currentPage, Math.max(0, totalPages - 1))

            if (targetPage >= 0 && totalPages > 0) {
              gridApi.value!.paginationGoToPage(targetPage)
            }
          }
        }, 300)
      }
    } catch (err) {
      console.warn('Error restoring pagination:', err)
      localStorage.removeItem(paginationStorageKey)
    }
  }

  // NOUVEAU: Fonction pour nettoyer le localStorage
  const clearStorageData = () => {
    try {
      // Supprimer les données de colonnes visibles
      localStorage.removeItem(props.storageKey)
      
      // Supprimer les données de pagination
      localStorage.removeItem(paginationStorageKey)
      
      // Supprimer les données d'affectation spécifiques
      const affectationKeys = [
        'affectationData',
        'teamJobs1',
        'teamJobs2', 
        'dates1',
        'dates2',
        'resources',
        'jobStatuses'
      ]
      
      affectationKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('localStorage cleared for DataTable and affectation data')
    } catch (err) {
      console.warn('Error clearing localStorage:', err)
    }
  }

  // MODIFIÉ: Comparateur personnalisé pour le tri hiérarchique
  const hierarchicalComparator = (valueA: any, valueB: any, nodeA: any, nodeB: any, isDescending: boolean) => {
    const dataA = nodeA.data as RowWithDetails
    const dataB = nodeB.data as RowWithDetails

    // Si les deux sont dans le même groupe parent
    if (dataA._parentSortOrder === dataB._parentSortOrder) {
      // Utiliser l'ordre de tri interne au groupe
      const sortOrderA = dataA._sortOrder || 0
      const sortOrderB = dataB._sortOrder || 0
      return sortOrderA - sortOrderB
    }

    // Sinon, comparer les groupes parents
    const parentOrderA = dataA._parentSortOrder || 0
    const parentOrderB = dataB._parentSortOrder || 0
    
    if (isDescending) {
      return parentOrderB - parentOrderA
    } else {
      return parentOrderA - parentOrderB
    }
  }

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: props.enableFiltering ? 'agTextColumnFilter' : false,
    flex: 1,
    minWidth: 100,
    // NOUVEAU: Comparateur personnalisé pour toutes les colonnes
    comparator: hierarchicalComparator
  }

  const minVisibleColumns = computed(() => {
    const t = props.columns.length
    return t > 4 ? 5 : t >= 3 ? 2 : 1
  })

  const allAvailableFields = computed(() =>
    props.columns.map(c => c.field!).filter(Boolean)
  )

  const getInitialVisibleFields = () => {
    const stored = localStorage.getItem(props.storageKey)
    const allFields = allAvailableFields.value
    if (!stored) return allFields

    try {
      const parsed = JSON.parse(stored) as string[]
      const newOnes = allFields.filter(f => !parsed.includes(f))
      if (newOnes.length) {
        const updated = [...parsed, ...newOnes]
        localStorage.setItem(props.storageKey, JSON.stringify(updated))
        return updated
      }
      const valid = parsed.filter(f => allFields.includes(f))
      return valid.length ? valid : allFields
    } catch {
      return allFields
    }
  }

  const visibleFields = ref<string[]>(getInitialVisibleFields())

  watch(visibleFields, vf => localStorage.setItem(props.storageKey, JSON.stringify(vf)), { deep: true })

  watch(allAvailableFields, (newF, oldF) => {
    if (oldF && newF.length !== oldF.length) {
      const added = newF.filter(f => !oldF.includes(f))
      if (added.length) visibleFields.value.push(...added)
      visibleFields.value = visibleFields.value.filter(f => newF.includes(f))
    }
  })

  const showDropdown = ref(false)
  const dropdownRef = ref<HTMLElement | null>(null)

  const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
  }

  const resetVisibleFields = () => {
    visibleFields.value = allAvailableFields.value
    localStorage.removeItem(props.storageKey)
  }

  const handleClickOutside = (e: Event) => {
    const wrap = dropdownRef.value
    if (wrap && !wrap.contains((e as MouseEvent).target as Node)) {
      showDropdown.value = false
    }
  }

  // Export functionality
  const toggleExportDropdown = () => {
    showExportDropdown.value = !showExportDropdown.value
  }

  const getExportableColumns = () => {
    return computedVisibleColumnDefsWithIndex.value
      .filter(col => col.field !== 'actions' && col.field !== undefined)
  }

  const exportToCsv = () => {
    if (!isGridValid()) return

    const params: CsvExportParams = {
      columnSeparator: ',',
      columnKeys: getExportableColumns().map(col => col.field!) as string[],
    }

    gridApi.value!.exportDataAsCsv(params)
    showExportDropdown.value = false
  }

  const exportToExcel = () => {
    if (!isGridValid()) return

    const allData: Record<string, unknown>[] = []
    gridApi.value!.forEachNodeAfterFilterAndSort(node => {
      if (node.data) allData.push(node.data)
    })

    if (!allData.length) return

    const visibleCols = getExportableColumns()
    const headers = visibleCols.map(col => col.headerName || col.field)
    const dataForSheet = allData.map(row => {
      const obj: Record<string, unknown> = {}
      visibleCols.forEach(col => {
        if (col.field) obj[col.field] = row[col.field]
      })
      return obj
    })

    const ws = XLSX.utils.json_to_sheet(dataForSheet, {
      header: visibleCols.map(c => c.field as string).filter(Boolean)
    })
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Données')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, 'export.xlsx')
    showExportDropdown.value = false
  }

  const exportToPdf = () => {
    if (!isGridValid()) return

    const doc = new jsPDF()
    doc.setFontSize(12)
    doc.setTextColor(44, 62, 80)
    doc.text(props.exportTitle, 14, 15)

    const visibleCols = getExportableColumns()
    const headers = visibleCols.map(col => col.headerName || col.field || '')
    const body: (string | number)[][] = []

    gridApi.value!.forEachNodeAfterFilterAndSort(node => {
      if (!node.data) return
      const row: (string | number)[] = []
      visibleCols.forEach(col => {
        const val = node.data[col.field!] ?? ''
        row.push(val)
      })
      body.push(row)
    })

    autoTable(doc, {
      head: [headers],
      body,
      startY: 25,
      headStyles: { fillColor: [255, 204, 17] },
    })

    doc.save('export.pdf')
    showExportDropdown.value = false
  }

  const handleClickOutsideExport = (event: MouseEvent) => {
    const wrap = exportDropdownRef.value
    if (wrap && !wrap.contains(event.target as Node)) {
      showExportDropdown.value = false
    }
  }

  // Event handlers
  const onModelUpdated = (event: ModelUpdatedEvent, callback?: () => void) => {
    calculateOptimalHeight()
    callback?.()
  }

  const onSelectionChanged = (event: SelectionChangedEvent, callback?: (selectedRows: T[]) => void) => {
    if (!isGridValid()) return
    const selectedRows = gridApi.value!.getSelectedRows().filter((row: RowWithDetails) => !row.isChild) as T[]
    callback?.(selectedRows)
  }

  // Cell editing - SIMPLIFIÉ : pas de confirmation ici
  const onCellKeyDown = (e: CellKeyDownEvent) => {
    if (e.event instanceof KeyboardEvent && e.event.key === 'Enter' && isGridValid()) {
      gridApi.value!.stopEditing()
    }
  }

  // MODIFIÉ: Confirmation conditionnelle basée sur le prop autoConfirmEdits
  const onCellEditingStopped = async (e: CellEditingStoppedEvent, callback?: (event: CellValueChangedEvent) => void) => {
    // Ignorer les lignes enfant
    if ((e.data as RowWithDetails)?.isChild) return

    const field = e.colDef.field!
    const oldVal = e.oldValue
    const newVal = e.value

    // Normaliser les valeurs pour comparaison
    const normalizedOldValue = oldVal === null || oldVal === undefined ? '' : String(oldVal)
    const normalizedNewValue = newVal === null || newVal === undefined ? '' : String(newVal)

    // Si les valeurs normalisées sont identiques, ne rien faire
    if (normalizedNewValue === normalizedOldValue) return

    // Vérifier si l'édition a été annulée (Escape)
    if (e.event && e.event instanceof KeyboardEvent && e.event.key === 'Escape') {
      return
    }

    // Si autoConfirmEdits est false, émettre directement sans confirmation
    if (props.autoConfirmEdits === false) {
      const changeEvent = {
        data: e.data,
        colDef: e.colDef,
        newValue: newVal,
        oldValue: oldVal
      } as CellValueChangedEvent

      callback?.(changeEvent)
      return
    }

    // Sinon, émettre directement (comportement par défaut simplifié)
    const changeEvent = {
      data: e.data,
      colDef: e.colDef,
      newValue: newVal,
      oldValue: oldVal
    } as CellValueChangedEvent

    callback?.(changeEvent)
  }

  // Handle pagination changes
  const handlePaginationChanged = () => {
    if (!isGridValid() || !props.pagination) return

    const newPageSize = gridApi.value!.paginationGetPageSize()
    if (newPageSize !== pageSize.value) {
      pageSize.value = newPageSize
    }

    // Save state with slight delay to avoid multiple calls
    setTimeout(() => {
      if (isGridValid()) {
        savePaginationState()
      }
    }, 100)
  }

  // Variable to track if we should save on destroy
  let shouldSaveOnDestroy = true

  // Cleanup before component destruction
  const cleanupBeforeDestroy = () => {
    if (shouldSaveOnDestroy && props.pagination && isGridValid()) {
      savePaginationState()
    }
    // Clean up the API reference
    gridApi.value = null
    shouldSaveOnDestroy = false
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside, { passive: true })
    document.addEventListener('click', handleClickOutsideExport)

    if (props.dataUrl) {
      // Fetch data from URL if provided
      fetch(props.dataUrl)
        .then(response => response.json())
        .then(data => {
          originalRowData.value = data
          buildDisplayData()
          // Restore state after data load
          setTimeout(() => {
            if (isGridValid() && props.pagination) {
              restorePaginationState()
            }
          }, 500)
        })
        .catch(err => console.error('fetchData error', err))
    }
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('click', handleClickOutsideExport)
    // Save before component destruction
    cleanupBeforeDestroy()
  })

  function onGridReady(e: GridReadyEvent, callback?: () => void) {
    gridApi.value = e.api

    if (props.pagination) {
      // Restore page size from localStorage
      const saved = localStorage.getItem(paginationStorageKey)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (typeof state.pageSize === 'number' && state.pageSize > 0) {
            pageSize.value = state.pageSize
            gridApi.value.setGridOption('paginationPageSize', state.pageSize)
          }
        } catch (err) {
          console.warn('Error reading pageSize:', err)
        }
      }

      // Listen to pagination events
      gridApi.value.addEventListener('paginationChanged', handlePaginationChanged)

      // Restore state after initialization
      setTimeout(() => {
        if (isGridValid()) {
          restorePaginationState()
        }
      }, 200)
    }

    calculateOptimalHeight()
    callback?.()
  }

  function onFirstDataRendered(_: FirstDataRenderedEvent, callback?: () => void) {
    if (props.pagination && isGridValid()) {
      // Restore after first render
      setTimeout(() => {
        if (isGridValid()) {
          restorePaginationState()
        }
      }, 300)
    }
    calculateOptimalHeight()
    callback?.()
  }

  const computedVisibleColumnDefs = computed<ColDef[]>(() => {
    const defs = props.columns.map(col => {
      const { description, detailConfig, ...colDef } = col

      // Configuration de base de la colonne
      const baseConfig: ColDef = {
        ...colDef,
        filter: props.enableFiltering ? (col.filter || 'agTextColumnFilter') : false,
        headerTooltip: description || col.headerName,
        // LOGIQUE SIMPLE : si inlineEditing est true ET que la colonne n'a pas editable: false
        editable: props.inlineEditing && col.editable !== false,
        // NOUVEAU: Ajouter le comparateur personnalisé
        comparator: hierarchicalComparator
      }

      // Si la colonne a une configuration de détails et que showDetails est activé
      if (detailConfig && props.showDetails) {
        const defaultIconCollapsed = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`
        const defaultIconExpanded = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`

        return {
          ...baseConfig,
          // Pour les détails, pas d'édition sur les lignes enfant
          editable: (params: { data?: RowWithDetails }) => {
            if (params.data?.isChild) return false
            return props.inlineEditing && col.editable !== false
          },
          cellStyle: (params: { data?: RowWithDetails }) => {
            if (!params.data) return undefined
            if (params.data.isChild) {
              return { 
                paddingLeft: '35px', 
                color: '#666', 
                fontStyle: 'italic', 
                fontSize: '12px' 
              }
            }
            return undefined
          },
          cellRenderer: (params: { data?: RowWithDetails; value?: unknown }) => {
            if (!params.data) return ''
            if (params.data.isChild) {
              return `${params.value ?? ''}`
            }

            const rowId = String(params.data.id || (params.data as Record<string, unknown>).reference || (params.data as Record<string, unknown>).name || Math.random().toString(36).substr(2, 9))
            const fieldName = col.field!
            const isExpanded = isCellExpanded(rowId, fieldName)
            const detailData = (params.data as Record<string, unknown>)[detailConfig.key]
            const hasDetails = Array.isArray(detailData) && detailData.length > 0

            if (!hasDetails) {
              // Pour la colonne ressources, afficher un message spécial
              if (detailConfig.key === 'resourcesList') {
                return `<span class="text-gray-400">Aucune ressource</span>`
              }
              return `<span>${params.value ?? ''}</span>`
            }

            const arrow = isExpanded
              ? (detailConfig.iconExpanded || defaultIconExpanded)
              : (detailConfig.iconCollapsed || defaultIconCollapsed)

            // Pour la colonne ressources, afficher le nombre de ressources
            let displayValue = params.value ?? ''
            if (detailConfig.key === 'resourcesList') {
              displayValue = `${detailData.length} ressource${detailData.length > 1 ? 's' : ''}`
            }

            return `
              <div style="display: flex; align-items: center; width: 100%; cursor: pointer;" data-expand-toggle="${rowId}" data-field-name="${fieldName}">
                <span style="display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" title="Cliquer pour afficher/masquer les détails">
                  ${arrow}
                </span>
                <span>${displayValue}</span>
              </div>`
          },
          onCellClicked: (event: CellClickedEvent) => {
            if ((event.data as RowWithDetails)?.isChild) return
            
            const target = event.event?.target as HTMLElement
            const cell = target.closest('[data-expand-toggle]') as HTMLElement
            
            if (cell) {
              const rowId = cell.getAttribute('data-expand-toggle')
              const fieldName = cell.getAttribute('data-field-name')
              
              if (rowId && fieldName) {
                event.event?.preventDefault()
                event.event?.stopPropagation()
                toggleCellExpansion(rowId, fieldName)
              }
            }
          }
        }
      }

      return baseConfig
    })

    return defs.filter(d => visibleFields.value.includes(d.field!) || d.field === 'actions')
  })

  // Row number column - MASQUER POUR LES LIGNES ENFANT
  const rowNumberColumn: ColDef = {
    headerName: 'N°',
    valueGetter: params => {
      // Ne pas afficher de numéro pour les lignes enfant
      if ((params.data as RowWithDetails)?.isChild) return ''
      return params.node?.rowIndex != null ? (params.node.rowIndex + 1).toString() : ''
    },
    width: 70,
    minWidth: 70,
    maxWidth: 80,
    suppressSizeToFit: true,
    menuTabs: [],
    sortable: false,
    filter: 'agTextColumnFilter',
    cellClass: 'text-left',
    editable: false, // Numéro de ligne jamais éditable
    cellStyle: (params: { data?: RowWithDetails }) => {
      // Masquer complètement la cellule pour les lignes enfant
      if (params.data?.isChild) {
        return { display: 'none' }
      }
      return undefined
    },
    // NOUVEAU: Comparateur spécial pour maintenir l'ordre hiérarchique
    comparator: hierarchicalComparator
  }

  // Computed visible columns with index
  const computedVisibleColumnDefsWithIndex = computed<ColDef[]>(() => {
    const cols = [...computedVisibleColumnDefs.value]

    // Add actions column if actions are provided
    if (props.actions.length) {
      cols.push({
        headerName: props.actionsHeaderName,
        field: 'actions',
        colId: 'actions',
        sortable: false,
        filter: false,
        editable: false, // Actions jamais éditables
        singleClickEdit: false,
        minWidth: 80,
        maxWidth: 80,
        cellRendererSelector: params => {
          // si ligne enfant, pas de renderer
          if ((params.data as RowWithDetails)?.isChild) {
            return { component: null }
          }
          // sinon on remet ActionMenu
          return {
            component: 'ActionMenu',
            params: { actions: props.actions }
          }
        },
        cellStyle: { display: 'block', overflow: 'visible' },
        suppressSizeToFit: true,
        headerTooltip: props.actionsHeaderName,
        // NOUVEAU: Comparateur pour maintenir l'ordre
        comparator: hierarchicalComparator
      })
    }

    // Add row number column at the beginning
    cols.unshift(rowNumberColumn)

    return cols
  })

  // Watch for data changes to recalculate height
  watch(() => rowData.value, () => {
    calculateOptimalHeight()
  }, { deep: true })

  watch(() => pageSize.value, () => {
    calculateOptimalHeight()
  })

  return {
    // Grid state
    gridApi,
    rowData,
    pageSize,
    calculatedHeight,
    dynamicGridStyle,
    defaultColDef,
    isGridValid,

    // Column management
    visibleFields,
    showDropdown,
    dropdownRef,
    minVisibleColumns,
    computedVisibleColumnDefs,
    computedVisibleColumnDefsWithIndex,
    toggleDropdown,
    resetVisibleFields,

    // Details management - NOUVEAU
    expandedCells,
    toggleCellExpansion,
    isCellExpanded,
    buildDisplayData,

    // Export functionality
    showExportDropdown,
    exportDropdownRef,
    toggleExportDropdown,
    exportToCsv,
    exportToExcel,
    exportToPdf,

    // Storage management - NOUVEAU
    clearStorageData,

    // Event handlers
    onGridReady,
    onFirstDataRendered,
    onModelUpdated,
    onSelectionChanged,
    onCellKeyDown,
    onCellEditingStopped,

    // Utility functions
    savePaginationState,
    calculateOptimalHeight
  }
}