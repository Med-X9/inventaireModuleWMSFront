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
  CellValueChangedEvent
} from 'ag-grid-community'
import type { ActionConfig, TableRow, DataTableColumn } from '@/interfaces/dataTable'
import { alertService } from '@/services/alertService'
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
}

export function useDataTable<T extends Record<string, unknown> = Record<string, unknown>>(
  props: UseDataTableProps<T>
) {
  const gridApi = ref<GridApi | null>(null)
  const rowData = ref(props.rowDataProp.slice() as T[])

  watch(() => props.rowDataProp, v => (rowData.value = v.slice() as T[]), { immediate: true })

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

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: props.enableFiltering ? 'agTextColumnFilter' : false,
    flex: 1,
    minWidth: 100
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
    const selectedRows = gridApi.value!.getSelectedRows() as T[]
    callback?.(selectedRows)
  }

  // Cell editing with confirmation
  const onCellKeyDown = (e: CellKeyDownEvent) => {
    if (e.event instanceof KeyboardEvent && e.event.key === 'Enter' && isGridValid()) {
      gridApi.value!.stopEditing()
    }
  }

  const onCellEditingStopped = async (e: CellEditingStoppedEvent, callback?: (event: CellValueChangedEvent) => void) => {
    const field = e.colDef.field!
    const oldVal = e.oldValue
    const newVal = e.value

    // Normaliser les valeurs pour comparaison
    const normalizedOldValue = oldVal === null || oldVal === undefined ? '' : String(oldVal);
    const normalizedNewValue = newVal === null || newVal === undefined ? '' : String(newVal);

    // Si les valeurs normalisées sont identiques, ne rien faire
    if (normalizedNewValue === normalizedOldValue) return

    // Demander confirmation avant de valider le changement
    try {
      const confirmed = await alertService.confirm({
        title: 'Confirmer la modification',
        text: `Voulez-vous vraiment modifier "${e.colDef.headerName || field}" de "${normalizedOldValue}" vers "${normalizedNewValue}" ?`,
      });

      if (confirmed.isConfirmed) {
        // Émettre l'événement de changement
        const changeEvent = {
          data: e.data,
          colDef: e.colDef,
          newValue: newVal,
          oldValue: oldVal
        } as CellValueChangedEvent

        callback?.(changeEvent)
      } else {
        // Annuler le changement en restaurant l'ancienne valeur
        if (e.data && e.colDef.field) {
          e.data[e.colDef.field] = oldVal
          // Forcer le rafraîchissement de la cellule
          if (isGridValid()) {
            gridApi.value!.refreshCells({
              rowNodes: [e.node!],
              columns: [e.colDef.field],
              force: true
            })
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error)
      // En cas d'erreur, restaurer l'ancienne valeur
      if (e.data && e.colDef.field) {
        e.data[e.colDef.field] = oldVal
        if (isGridValid()) {
          gridApi.value!.refreshCells({
            rowNodes: [e.node!],
            columns: [e.colDef.field],
            force: true
          })
        }
      }
    }
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
          rowData.value = data
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
      const { description, ...colDef } = col
      return {
        ...colDef,
        filter: props.enableFiltering ? (col.filter || 'agTextColumnFilter') : false,
        headerTooltip: description || col.headerName
      }
    })

    return defs.filter(d => visibleFields.value.includes(d.field!) || d.field === 'actions')
  })

  // Row number column
  const rowNumberColumn: ColDef = {
    headerName: 'N°',
    valueGetter: params => {
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
        editable: () => false,
        singleClickEdit: false,
        minWidth: 80,
        maxWidth: 80,
        cellRenderer: 'ActionMenu',
        cellRendererParams: {
          actions: props.actions
        },
        cellStyle: { display: 'block', overflow: 'visible' },
        suppressSizeToFit: true,
        headerTooltip: props.actionsHeaderName
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

    // Export functionality
    showExportDropdown,
    exportDropdownRef,
    toggleExportDropdown,
    exportToCsv,
    exportToExcel,
    exportToPdf,

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