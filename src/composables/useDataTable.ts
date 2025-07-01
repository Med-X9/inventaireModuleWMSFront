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
    console.log('🔧 useDataTable - Props reçues:', {
        rowDataProp: props.rowDataProp,
        rowDataPropLength: props.rowDataProp?.length || 0,
        columns: props.columns?.length || 0
    });

    const gridApi = ref<GridApi | null>(null)

    // Vérifier que rowDataProp est un tableau
    const safeRowData = Array.isArray(props.rowDataProp) ? props.rowDataProp : [];
    const rowData = ref(safeRowData.slice())

    console.log('📦 useDataTable - rowData initial:', rowData.value);
    console.log('📊 useDataTable - Nombre de lignes initial:', rowData.value.length);

    watch(() => props.rowDataProp, v => {
        console.log('🔄 useDataTable - rowDataProp changé:', v);
        console.log('📈 Nouveau nombre de lignes:', v?.length || 0);

        // Vérifier que v est un tableau avant d'utiliser slice
        const safeData = Array.isArray(v) ? v : [];
        rowData.value = safeData.slice();
        console.log('💾 rowData mis à jour:', rowData.value);
    }, { immediate: true })

    const pageSize = ref(50)
    const paginationStorageKey = `${props.storageKey}_paginationState`

    const savePaginationState = () => {
        if (!gridApi.value || !props.pagination) return
        try {
            const state = {
                currentPage: gridApi.value.paginationGetCurrentPage(),
                pageSize: gridApi.value.paginationGetPageSize(),
                timestamp: Date.now()
            }
            localStorage.setItem(paginationStorageKey, JSON.stringify(state))
        } catch (err) {
            console.warn('Erreur sauvegarde pagination:', err)
        }
    }

    const restorePaginationState = () => {
        if (!gridApi.value || !props.pagination) return
        try {
            const saved = localStorage.getItem(paginationStorageKey)
            if (!saved) return
            const state = JSON.parse(saved)
            const maxAge = 24 * 60 * 60 * 1000
            if (state.timestamp && Date.now() - state.timestamp > maxAge) {
                localStorage.removeItem(paginationStorageKey)
                return
            }
            if (typeof state.pageSize === 'number' && state.pageSize > 0) {
                pageSize.value = state.pageSize
                gridApi.value.setGridOption('paginationPageSize', state.pageSize)
            }
            if (typeof state.currentPage === 'number' && state.currentPage >= 0) {
                setTimeout(() => {
                    if (gridApi.value) {
                        const total = gridApi.value.paginationGetTotalPages()
                        const target = Math.min(state.currentPage, total - 1)
                        if (target >= 0) gridApi.value.paginationGoToPage(target)
                    }
                }, 100)
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
    onMounted(() => {
        document.addEventListener('click', handleClickOutside, { passive: true })
        if (props.dataUrl) fetchData(props.dataUrl).then(data => rowData.value = data).catch(err => console.error('fetchData error', err))
    })
    onUnmounted(() => document.removeEventListener('click', handleClickOutside))

    function onGridReady(e: GridReadyEvent) {
        gridApi.value = e.api
        const saved = localStorage.getItem(paginationStorageKey)
        if (saved) {
            try {
                const state = JSON.parse(saved)
                if (typeof state.pageSize === 'number') {
                    pageSize.value = state.pageSize
                    gridApi.value.setGridOption('paginationPageSize', state.pageSize)
                }
            } catch { }
        }
        if (props.pagination) {
            gridApi.value.addEventListener('paginationChanged', savePaginationState)
            gridApi.value.addEventListener('paginationChanged', () => {
                if (!gridApi.value) return
                const ps = gridApi.value.paginationGetPageSize()
                if (ps !== pageSize.value) pageSize.value = ps
                savePaginationState()
            })
            setTimeout(restorePaginationState, 50)
        }
    }

    function onFirstDataRendered(_: FirstDataRenderedEvent) {
        if (props.pagination) setTimeout(restorePaginationState, 100)
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
                minWidth: 80,
                maxWidth: 80,
                cellRenderer: ActionMenu,
                cellRendererParams: { actions: props.actions },
                // Fully hide for child rows, and provide both display and overflow keys
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
        gridApi
    }
}
