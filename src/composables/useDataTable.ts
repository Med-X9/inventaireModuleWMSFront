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

interface ExtendedGridApi extends GridApi {
  paginationSetPageSize(ps: number): void
  paginationGetCurrentPage(): number
  paginationGoToPage(page: number): void
}

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
  const gridApi = ref<ExtendedGridApi | null>(null)

  // 1) ref<T[]> pur
  const rowData = ref<Record<string, unknown>[]>([])
  // 2) watch immédiat pour synchroniser la prop
  watch(
    () => props.rowDataProp,
    v => { rowData.value = v },
    { immediate: true }
  )

  const pageSize = ref(50)

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: props.enableFiltering ? 'agTextColumnFilter' : false,
    flex: 1,
    minWidth: 100,
  }

  const minVisibleColumns = computed(() => {
    const t = props.columns.length
    if (t > 4) return 3
    if (t >= 3) return 2
    return 1
  })

  const visibleFields = useLocalStorage<string[]>(
    props.storageKey,
    props.columns.map(c => c.field!).filter(Boolean)
  )

  onMounted(async () => {
    if (props.dataUrl) {
      try {
        rowData.value = await fetchData(props.dataUrl)
      } catch (e) {
        console.error(e)
      }
    }
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  function onGridReady(e: GridReadyEvent) {
    gridApi.value = e.api as ExtendedGridApi
    const saved = localStorage.getItem('paginationState')
    if (saved && gridApi.value) {
      const { pageSize: ps } = JSON.parse(saved)
      if (ps) {
        pageSize.value = ps
        gridApi.value.paginationSetPageSize(ps)
      }
    }
    if (gridApi.value && props.pagination) {
      gridApi.value.addEventListener('paginationChanged', () => {
        const curr = gridApi.value!.paginationGetCurrentPage()
        localStorage.setItem(
          'paginationState',
          JSON.stringify({ currentPage: curr, pageSize: pageSize.value })
        )
      })
    }
  }

  function onFirstDataRendered(e: FirstDataRenderedEvent) {
    const saved = localStorage.getItem('paginationState')
    if (saved && gridApi.value) {
      const { currentPage } = JSON.parse(saved)
      if (typeof currentPage === 'number') {
        gridApi.value.paginationGoToPage(currentPage)
      }
    }
  }

  const computedVisibleColumnDefs = computed<ColDef[]>(() => {
    const base = props.columns.map(col => ({
      ...col,
      filter: props.enableFiltering ? (col.filter || 'agTextColumnFilter') : false,
    }))

    if (props.actions.length) {
      base.push({
        headerName: props.actionsHeaderName,
        field: 'actions',
        sortable: false,
        filter: false,
        minWidth: 80,
        maxWidth: 80,
        cellRenderer: ActionMenu,
        cellRendererParams: { actions: props.actions },
        cellStyle: { overflow: 'visible' },
        suppressSizeToFit: true,
      })
    }

    return base.filter(c =>
      visibleFields.value.includes(c.field!) || c.field === 'actions'
    )
  })

  const showDropdown = ref(false)
  const toggleDropdown = () => { showDropdown.value = !showDropdown.value }
  const resetVisibleFields = () => {
    visibleFields.value = props.columns.map(c => c.field!).filter(Boolean)
    localStorage.removeItem(props.storageKey)
  }
  function handleClickOutside(e: MouseEvent) {
    const w = document.querySelector('.select-wrapper')
    if (w && !w.contains(e.target as Node)) showDropdown.value = false
  }

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
  }
}
