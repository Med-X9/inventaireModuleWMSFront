import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  ColDef,
  GridReadyEvent,
  FirstDataRenderedEvent,
  GridApi
} from 'ag-grid-community'
import { fetchData } from '@/services/dataTableService'
import type { ActionConfig, TableRow, DataTableColumn } from '@/interfaces/dataTable'
import ActionMenu from '@/components/DataTable/ActionMenu.vue'

export interface UseDataTableProps {
  columns: DataTableColumn[]
  rowDataProp: TableRow[]
  dataUrl?: string
  enableFiltering: boolean
  pagination: boolean
  storageKey: string
  actions: ActionConfig[]
  actionsHeaderName: string
}

export function useDataTable(props: UseDataTableProps) {
  const gridApi = ref<GridApi | null>(null)
  const rowData = ref(props.rowDataProp.slice())
  watch(() => props.rowDataProp, v => (rowData.value = v.slice()), { immediate: true })

  const pageSize = ref(50)
  const paginationStorageKey = `${props.storageKey}_paginationState`

  // Vérifier si la grille est valide et non détruite
  const isGridValid = (): boolean => {
    return !!(gridApi.value && !gridApi.value.isDestroyed())
  }

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
      console.warn('Erreur sauvegarde pagination:', err)
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

      // Restaurer la taille de page d'abord
      if (typeof state.pageSize === 'number' && state.pageSize > 0) {
        pageSize.value = state.pageSize
        gridApi.value!.setGridOption('paginationPageSize', state.pageSize)
      }

      // Puis restaurer la page courante après un délai
      if (typeof state.currentPage === 'number' && state.currentPage >= 0) {
        setTimeout(() => {
          if (isGridValid()) {
            const totalPages = gridApi.value!.paginationGetTotalPages()
            const targetPage = Math.min(state.currentPage, Math.max(0, totalPages - 1))
            
            if (targetPage >= 0 && totalPages > 0) {
              gridApi.value!.paginationGoToPage(targetPage)
            }
          }
        }, 300) // Délai augmenté pour assurer la stabilité
      }
    } catch (err) {
      console.warn('Erreur restauration pagination:', err)
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
  const toggleDropdown = () => { showDropdown.value = !showDropdown.value }
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

  // Fonction pour gérer les changements de pagination
  const handlePaginationChanged = () => {
    if (!isGridValid() || !props.pagination) return

    const newPageSize = gridApi.value!.paginationGetPageSize()
    if (newPageSize !== pageSize.value) {
      pageSize.value = newPageSize
    }

    // Sauvegarder l'état à chaque changement avec un léger délai pour éviter les appels multiples
    setTimeout(() => {
      if (isGridValid()) {
        savePaginationState()
      }
    }, 100)
  }

  // Variable pour suivre si on doit sauvegarder à la destruction
  let shouldSaveOnDestroy = true

  // Fonction pour nettoyer avant la destruction du composant
  const cleanupBeforeDestroy = () => {
    if (shouldSaveOnDestroy && props.pagination && isGridValid()) {
      savePaginationState()
    }
    // Nettoyer la référence à l'API
    gridApi.value = null
    shouldSaveOnDestroy = false
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside, { passive: true })
    
    if (props.dataUrl) {
      fetchData(props.dataUrl)
        .then(data => {
          rowData.value = data
          // Restaurer l'état après le chargement des données
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
    // Sauvegarder avant la destruction du composant
    cleanupBeforeDestroy()
  })

  function onGridReady(e: GridReadyEvent) {
    gridApi.value = e.api

    if (props.pagination) {
      // Restaurer la taille de page depuis le localStorage
      const saved = localStorage.getItem(paginationStorageKey)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (typeof state.pageSize === 'number' && state.pageSize > 0) {
            pageSize.value = state.pageSize
            gridApi.value.setGridOption('paginationPageSize', state.pageSize)
          }
        } catch (err) {
          console.warn('Erreur lecture pageSize:', err)
        }
      }

      // Écouter les événements de pagination
      gridApi.value.addEventListener('paginationChanged', handlePaginationChanged)
      
      // Restaurer l'état après l'initialisation
      setTimeout(() => {
        if (isGridValid()) {
          restorePaginationState()
        }
      }, 200)
    }
  }

  function onFirstDataRendered(_: FirstDataRenderedEvent) {
    if (props.pagination && isGridValid()) {
      // Restauration après le premier rendu
      setTimeout(() => {
        if (isGridValid()) {
          restorePaginationState()
        }
      }, 300)
    }
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

    if (props.actions.length) {
      defs.push({
        headerName: props.actionsHeaderName,
        field: 'actions',
        colId: 'actions',
        sortable: false,
        filter: false,
        editable: () => false,
        singleClickEdit: false,
        minWidth: 80,
        maxWidth: 80,
        cellRenderer: ActionMenu,
        cellRendererParams: { actions: props.actions },
        cellStyle: params => params.data?.isChild
          ? { display: 'none', overflow: 'hidden' }
          : { display: 'block', overflow: 'visible' },
        suppressSizeToFit: true,
        headerTooltip: props.actionsHeaderName
      })
    }

    return defs.filter(d => visibleFields.value.includes(d.field!) || d.field === 'actions')
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
    savePaginationState,
    isGridValid
  }
}