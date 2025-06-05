import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  ColDef,
  GridReadyEvent,
  FirstDataRenderedEvent,
  GridApi
} from 'ag-grid-community'
import { fetchData } from '@/services/dataTableService'
import { useLocalStorage } from '@/utils/storage'
import type { ActionConfig } from '@/interfaces/dataTable'
import ActionMenu from '@/components/DataTable/ActionMenu.vue'

export interface UseDataTableProps {
  columns: ColDef[]
  rowDataProp: Record<string, unknown>[]
  dataUrl?: string
  enableFiltering: boolean
  pagination: boolean
  storageKey: string
  actions: ActionConfig[]
  actionsHeaderName: string
}

export function useDataTable(props: UseDataTableProps) {
  // Référence à l'API AG-Grid
  const gridApi = ref<GridApi|null>(null)

  // --- ROW DATA ---
  const rowData = ref(props.rowDataProp.slice())
  watch(() => props.rowDataProp, v => (rowData.value = v.slice()), { immediate: true })

  // --- PAGINATION STATE ---
  const pageSize = ref(50)
  const paginationStorageKey = `${props.storageKey}_paginationState`

  // --- COL DEFS PAR DÉFAUT ---
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: props.enableFiltering ? 'agTextColumnFilter' : false,
    flex: 1,
    minWidth: 100,
  }

  // --- VISIBLE FIELDS ---
  const minVisibleColumns = computed(() => {
    const t = props.columns.length
    return t > 4 ? 5 : t >= 3 ? 2 : 1
  })
  const visibleFields = useLocalStorage<string[]>(
    props.storageKey,
    props.columns.map(c => c.field!).filter(Boolean)
  )

  // --- DROPDOWN SELECTEUR DE COLONNES ---
  const showDropdown = ref(false)
  const dropdownRef = ref<HTMLElement|null>(null)
  const toggleDropdown = () => { showDropdown.value = !showDropdown.value }
  const resetVisibleFields = () => {
    visibleFields.value = props.columns.map(c => c.field!).filter(Boolean)
    localStorage.removeItem(props.storageKey)
  }
  function handleClickOutside(e: MouseEvent) {
    const wrap = dropdownRef.value
    if (wrap && !wrap.contains(e.target as Node)) {
      showDropdown.value = false
    }
  }

  // --- LIFECYCLE ---
  onMounted(async () => {
    document.addEventListener('click', handleClickOutside)
    if (props.dataUrl) {
      try {
        rowData.value = await fetchData(props.dataUrl)
      } catch (err) {
        console.error('fetchData error', err)
      }
    }
  })
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  // --- AG GRID READY ---
  function onGridReady(e: GridReadyEvent) {
    gridApi.value = e.api

    // Restauration du state de pagination
    const saved = localStorage.getItem(paginationStorageKey)
    let initialPage = 0
    let initialSize = pageSize.value

    if (saved) {
      try {
        const obj = JSON.parse(saved)
        if (typeof obj.pageSize === 'number') initialSize = obj.pageSize
        if (typeof obj.currentPage === 'number') initialPage = obj.currentPage
      } catch {}
    }

    pageSize.value = initialSize

    // ← Utilisation de la nouvelle API AG-Grid v32+
    gridApi.value.setGridOption('paginationPageSize', initialSize)

    if (props.pagination) {
      gridApi.value.addEventListener('paginationChanged', () => {
        localStorage.setItem(
          paginationStorageKey,
          JSON.stringify({
            currentPage: gridApi.value!.paginationGetCurrentPage(),
            pageSize:    gridApi.value!.paginationGetPageSize(),
          })
        )
      })
      // Naviguer vers la page restaurée
      setTimeout(() => {
        if (initialPage > 0) {
          gridApi.value!.paginationGoToPage(initialPage)
        }
      }, 0)
    }
  }

  function onFirstDataRendered(_: FirstDataRenderedEvent) {
    // exposé si besoin
  }

  // --- COLONNES VISIBLES CALCULÉES ---
  const computedVisibleColumnDefs = computed<ColDef[]>(() => {
    const base = props.columns.map(col => ({
      ...col,
      filter: props.enableFiltering
        ? col.filter || 'agTextColumnFilter'
        : false,
    }))

    if (props.actions.length) {
      base.push({
        headerName: props.actionsHeaderName,
        field:      'actions',
        colId:      'actions',
        sortable:   false,
        filter:     false,
        minWidth:   80,
        maxWidth:   80,
        cellRenderer:       ActionMenu,
        cellRendererParams: { actions: props.actions },
        cellStyle:          { overflow: 'visible' },
        suppressSizeToFit:  true,
      })
    }

    return base.filter(c =>
      visibleFields.value.includes(c.field!) || c.field === 'actions'
    )
  })

  return {
    defaultColDef,
    rowData,
    pageSize,
    onGridReady,
    onFirstDataRendered,
    computedVisibleColumnDefs,
    visibleFields,
    showDropdown,
    toggleDropdown,
    resetVisibleFields,
    minVisibleColumns,
    dropdownRef,
    gridApi,
  }
}