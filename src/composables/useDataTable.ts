import { ref, computed, watch, onMounted, onUnmounted, type ComputedRef } from 'vue'
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
import { alertService } from '@/services/alertService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { Ref } from 'vue'

export interface UseDataTableProps<T = Record<string, unknown>> {
    columns: DataTableColumn[]
    rowDataProp: T[] | Ref<T[]> | ComputedRef<T[]>
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
    onPaginationChanged?: (params: { page: number, pageSize: number }) => void
}

export function useDataTable<T extends Record<string, unknown> = Record<string, unknown>>(
    props: UseDataTableProps<T> | ComputedRef<UseDataTableProps<T>>
) {
    // Extraire les props réelles (peut être un computed ou un objet simple)
    const actualProps = computed(() => {
        if ('value' in props) {
            return props.value;
        }
        return props;
    });

    const gridApi = ref<GridApi | null>(null)
    const columnApi = ref<any>(null)
    const expandedRowIds = ref<Set<string>>(new Set())

    // Flag pour éviter les appels multiples de pagination
    const isRestoringState = ref(false)
    let paginationTimeout: number | null = null

    // Utiliser directement la prop comme source de vérité
    const rowData = computed<RowWithDetails[]>(() => {
        // Gère ref/computed ou tableau direct
        const data = 'value' in actualProps.value.rowDataProp
            ? actualProps.value.rowDataProp.value
            : actualProps.value.rowDataProp;
        console.log('Données brutes dans rowDataProp:', data);
        if (!actualProps.value.showDetails) {
            return (data ?? []) as RowWithDetails[];
        }

        const newData: RowWithDetails[] = [];
        const arr = Array.isArray(data) ? data : [];

        arr.forEach((parentRow) => {
            // Ajouter la ligne parent sans marquage enfant
            newData.push({
                ...parentRow,
                isChild: false,
                parentId: null
            });

            // Identifier l'id de la ligne parent
            const rowId = String(
                (parentRow as Record<string, unknown>).id
                ?? (parentRow as Record<string, unknown>).reference
                ?? Math.random()
            );

            // Si cette ligne est étendue, ajouter les enfants
            if (expandedRowIds.value.has(rowId)) {
                actualProps.value.columns.forEach(column => {
                    if (column.detailConfig && column.field) {
                        const detailConfig = column.detailConfig;
                        const detailData = (parentRow as Record<string, unknown>)[detailConfig.key];

                        if (Array.isArray(detailData) && detailData.length > 0) {
                            detailData.forEach((item, index) => {
                                const childRow: RowWithDetails = {
                                    id: `${rowId}--${detailConfig.key}--${index}`,
                                    isChild: true,
                                    parentId: rowId,
                                    childType: detailConfig.key,
                                    originalItem: item
                                };

                                if (detailConfig.columns) {
                                    detailConfig.columns.forEach(colConfig => {
                                        const value = (colConfig.valueKey && typeof item === 'object' && item !== null)
                                            ? (item as Record<string, unknown>)[colConfig.valueKey]
                                            : item;

                                        const formattedValue = colConfig.formatter
                                            ? colConfig.formatter(value, item)
                                            : String(value ?? '');

                                        if (column.field) {
                                            childRow[column.field] = formattedValue;
                                        }
                                    });
                                } else {
                                    let displayValue = '';
                                    if (detailConfig.labelField && typeof item === 'object' && item !== null) {
                                        displayValue = String((item as Record<string, unknown>)[detailConfig.labelField] ?? '');
                                    } else {
                                        displayValue = String(item ?? '');
                                    }
                                    if (column.field) {
                                        childRow[column.field] = displayValue;
                                    }
                                }

                                newData.push(childRow);
                            });
                        }
                    }
                });
            }
        });

        return newData;
    });

    const pageSize = ref(50)
    const paginationStorageKey = actualProps.value.storageKey + '_paginationState'

    // Dynamic height management
    const calculatedHeight = ref(470)

    // Export dropdown state
    const showExportDropdown = ref(false)
    const exportDropdownRef = ref<HTMLElement | null>(null)

    // Check if grid is valid and not destroyed
    const isGridValid = (): boolean => {
        return !!(gridApi.value && !gridApi.value.isDestroyed())
    }

    // Fonction pour basculer l'expansion d'une ligne
    const toggleRowExpansion = (rowId: string) => {
        if (expandedRowIds.value.has(rowId)) {
            expandedRowIds.value.delete(rowId);
            emitRowExpanded(rowId, false);
        } else {
            expandedRowIds.value.add(rowId);
            emitRowExpanded(rowId, true);
        }
    }

    // Événement personnalisé pour l'expansion
    const emitRowExpanded = (rowId: string, expanded: boolean) => {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('datatable-row-expanded', { detail: { rowId, expanded } });
            window.dispatchEvent(event);
        }
    }

    // Calculate optimal height
    const calculateOptimalHeight = () => {
        if (!isGridValid()) return

        const displayedRowCount = gridApi.value!.getDisplayedRowCount()
        const headerHeight = 48
        const rowHeight = 42
        const paginationHeight = actualProps.value.pagination ? 52 : 0
        const scrollbarBuffer = 20

        if (displayedRowCount <= actualProps.value.maxRowsForDynamicHeight) {
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
        if (!isGridValid() || !actualProps.value.pagination) return

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
        if (!isGridValid() || !actualProps.value.pagination) return

        isRestoringState.value = true;

        try {
            const saved = localStorage.getItem(paginationStorageKey)
            if (!saved) {
                isRestoringState.value = false;
                return;
            }

            const state = JSON.parse(saved)
            const maxAge = 24 * 60 * 60 * 1000 // 24h

            if (state.timestamp && Date.now() - state.timestamp > maxAge) {
                localStorage.removeItem(paginationStorageKey)
                isRestoringState.value = false;
                return;
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
                    // Réactiver les événements de pagination après restauration
                    setTimeout(() => {
                        isRestoringState.value = false;
                    }, 100);
                }, 300)
            } else {
                isRestoringState.value = false;
            }
        } catch (err) {
            console.warn('Error restoring pagination:', err)
            localStorage.removeItem(paginationStorageKey)
            isRestoringState.value = false;
        }
    }

    const defaultColDef: ColDef = {
        resizable: true,
        sortable: true,
        filter: actualProps.value.enableFiltering ? 'agTextColumnFilter' : false,
        flex: 1,
        minWidth: 100
    }

    const minVisibleColumns = computed(() => {
        const t = actualProps.value.columns.length
        return t > 4 ? 5 : t >= 3 ? 2 : 1
    })

    const allAvailableFields = computed(() =>
        actualProps.value.columns.map(c => c.field!).filter(Boolean)
    )

    // CORRECTION: Fonction simplifiée pour obtenir les colonnes visibles initiales
    const getInitialVisibleFields = (): string[] => {
        try {
            const stored = localStorage.getItem(actualProps.value.storageKey)

            if (!stored) {
                return allAvailableFields.value
            }

            const parsed = JSON.parse(stored) as string[]

            // Vérifier que c'est un tableau
            if (!Array.isArray(parsed)) {
                return allAvailableFields.value
            }

            // Vérifier que les colonnes sauvegardées existent encore
            const validStoredFields = parsed.filter(f => allAvailableFields.value.includes(f))

            // Si aucune colonne valide, retourner toutes
            if (validStoredFields.length === 0) {
                return allAvailableFields.value
            }

            return validStoredFields
        } catch (error) {
            // En cas d'erreur, supprimer l'entrée corrompue et retourner toutes
            localStorage.removeItem(actualProps.value.storageKey)
            return allAvailableFields.value
        }
    }

    const visibleFields = ref<string[]>(getInitialVisibleFields())

    // CORRECTION: Watch amélioré pour sauvegarder les changements
    watch(visibleFields, (newFields) => {
        try {
            localStorage.setItem(actualProps.value.storageKey, JSON.stringify(newFields))
        } catch (error) {
            console.error('Error saving to localStorage:', error) // Debug
        }
    }, { deep: true })

    // Gérer l'ajout de nouvelles colonnes
    watch(allAvailableFields, (newFields, oldFields) => {
        if (oldFields && newFields.length !== oldFields.length) {
            const addedFields = newFields.filter(f => !oldFields.includes(f))
            if (addedFields.length > 0) {
                visibleFields.value.push(...addedFields)
            }
            // Supprimer les champs qui n'existent plus
            visibleFields.value = visibleFields.value.filter(f => newFields.includes(f))
        }
    })

    const showDropdown = ref(false)
    const dropdownRef = ref<HTMLElement | null>(null)

    const toggleDropdown = () => {
        showDropdown.value = !showDropdown.value
    }

    // CORRECTION: Fonction de reset améliorée
    const resetVisibleFields = () => {
        visibleFields.value = [...allAvailableFields.value] // Créer une nouvelle référence
        localStorage.removeItem(actualProps.value.storageKey)
        showDropdown.value = false
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
        doc.text(actualProps.value.exportTitle, 14, 15)

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

    // Cell editing with confirmation
    const onCellKeyDown = (e: CellKeyDownEvent) => {
        if (e.event instanceof KeyboardEvent && e.event.key === 'Enter' && isGridValid()) {
            gridApi.value!.stopEditing()
        }
    }

    const onCellEditingStopped = async (e: CellEditingStoppedEvent, callback?: (event: CellValueChangedEvent) => void) => {
        if ((e.data as RowWithDetails)?.isChild) return // Pas d'édition sur les lignes enfant

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
        if (!isGridValid() || !actualProps.value.pagination || isRestoringState.value) return

        // Clear previous timeout
        if (paginationTimeout) {
            clearTimeout(paginationTimeout)
        }

        // Debounce the pagination callback to avoid multiple calls
        paginationTimeout = setTimeout(() => {
            const newPageSize = gridApi.value!.paginationGetPageSize()
            if (newPageSize !== pageSize.value) {
                pageSize.value = newPageSize
            }

            // Appeler le callback de pagination si fourni
            if (actualProps.value.onPaginationChanged) {
                const currentPage = gridApi.value!.paginationGetCurrentPage() + 1; // AG Grid est 0-based
                const currentPageSize = gridApi.value!.paginationGetPageSize();

                // Récupérer les paramètres de tri et filtre actuels (compatible AG Grid Community)
                let sortModel = [];
                let filterModel = {};

                try {
                    // Essayer d'abord les méthodes Enterprise
                    if (typeof gridApi.value!.getSortModel === 'function') {
                        sortModel = gridApi.value!.getSortModel();
                    }
                    if (typeof gridApi.value!.getFilterModel === 'function') {
                        filterModel = gridApi.value!.getFilterModel();
                    }
                } catch (error) {
                    console.warn('Méthodes Enterprise non disponibles, utilisation des méthodes Community');
                }

                actualProps.value.onPaginationChanged({
                    page: currentPage,
                    pageSize: currentPageSize,
                    sort: sortModel,
                    filter: filterModel
                });
            }

            // Save state
            if (isGridValid()) {
                savePaginationState()
            }
        }, 150) // Délai de 150ms pour éviter les appels multiples
    }

    // Variable to track if we should save on destroy
    let shouldSaveOnDestroy = true

    // Cleanup before component destruction
    const cleanupBeforeDestroy = () => {
        if (shouldSaveOnDestroy && actualProps.value.pagination && isGridValid()) {
            savePaginationState()
        }

        // Clean up timeout
        if (paginationTimeout) {
            clearTimeout(paginationTimeout)
            paginationTimeout = null
        }

        // Clean up the API reference
        gridApi.value = null
        shouldSaveOnDestroy = false
    }

    // --- SAUVEGARDE ET RESTAURATION DE L'ÉTAT DE LA TABLE ---
    const saveTableState = () => {
        if (!isGridValid()) return;
        try {
            // Récupérer les modèles de tri et filtre de manière compatible
            let filterModel = {};
            try {
                if (typeof gridApi.value!.getFilterModel === 'function') {
                    filterModel = gridApi.value!.getFilterModel();
                }
            } catch (error) {
                console.warn('getFilterModel non disponible');
            }

            const state = {
                visibleFields: visibleFields.value,
                filterModel: filterModel,
                page: gridApi.value!.paginationGetCurrentPage(),
                pageSize: gridApi.value!.paginationGetPageSize(),
                timestamp: Date.now()
            };
            localStorage.setItem(actualProps.value.storageKey + '_tableState', JSON.stringify(state));
        } catch (err) {
            console.warn('Error saving table state:', err);
        }
    };

    const restoreTableState = () => {
        if (!isGridValid()) return;

        isRestoringState.value = true;

        try {
            const saved = localStorage.getItem(actualProps.value.storageKey + '_tableState');
            if (!saved) {
                isRestoringState.value = false;
                return;
            }
            const state = JSON.parse(saved);
            // Colonnes visibles
            if (Array.isArray(state.visibleFields)) {
                visibleFields.value = state.visibleFields;
            }
            // Filtres
            if (state.filterModel) {
                try {
                    if (typeof gridApi.value!.setFilterModel === 'function') {
                        gridApi.value!.setFilterModel(state.filterModel);
                    }
                } catch (error) {
                    console.warn('setFilterModel non disponible');
                }
            }
            // Page size
            if (typeof state.pageSize === 'number' && state.pageSize > 0) {
                pageSize.value = state.pageSize;
                gridApi.value!.setGridOption('paginationPageSize', state.pageSize);
            }
            // Page courante
            if (typeof state.page === 'number' && state.page >= 0) {
                setTimeout(() => {
                    if (isGridValid()) {
                        const totalPages = gridApi.value!.paginationGetTotalPages();
                        const targetPage = Math.min(state.page, Math.max(0, totalPages - 1));
                        if (targetPage >= 0 && totalPages > 0) {
                            gridApi.value!.paginationGoToPage(targetPage);
                        }
                    }
                    // Réactiver les événements de pagination après restauration
                    setTimeout(() => {
                        isRestoringState.value = false;
                    }, 100);
                }, 300);
            } else {
                isRestoringState.value = false;
            }
        } catch (err) {
            console.warn('Error restoring table state:', err);
            localStorage.removeItem(actualProps.value.storageKey + '_tableState');
            isRestoringState.value = false;
        }
    };

    // Sauvegarder l'état à chaque changement pertinent
    watch(visibleFields, saveTableState, { deep: true });
    watch(pageSize, saveTableState);
    watch(() => rowData.value, saveTableState, { deep: true });

    // Sauvegarde sur changement de filtre/tri/pagination
    const onAnyTableChange = () => {
        saveTableState();
    };

    // Grid ready handler
    const onGridReady = (event: any) => {
        gridApi.value = event.api
        columnApi.value = event.columnApi

        // Écouter les changements de pagination
        if (actualProps.value.pagination && gridApi.value) {
            gridApi.value.addEventListener('paginationChanged', handlePaginationChanged)
        }

        // Restore state if available (seulement si pas déjà en cours de restauration)
        if (actualProps.value.storageKey && !isRestoringState.value) {
            restoreTableState()
        }
    }

    function onFirstDataRendered(_: FirstDataRenderedEvent, callback?: () => void) {
        if (actualProps.value.pagination && isGridValid() && !isRestoringState.value) {
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
        const defs = actualProps.value.columns.map(col => {
            const { description, detailConfig, ...colDef } = col

            // Configuration de base de la colonne - LOGIQUE SIMPLE COMME V1
            const baseConfig: ColDef = {
                ...colDef,
                headerTooltip: description || col.headerName,
                // LOGIQUE SIMPLE : si inlineEditing est true ET que la colonne n'a pas editable: false
                editable: actualProps.value.inlineEditing && col.editable !== false
            }

            // Si la colonne a une configuration de détails et que showDetails est activé
            if (detailConfig && actualProps.value.showDetails) {
                const defaultIconCollapsed = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`
                const defaultIconExpanded = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`

                return {
                    ...baseConfig,
                    cellClassRules: {
                        'ml-6 text-gray-600 italic': 'data.isChild'
                    },
                    // Pour les détails, pas d'édition sur les lignes enfant
                    editable: (params: { data?: RowWithDetails }) => {
                        if (params.data?.isChild) return false
                        return actualProps.value.inlineEditing && col.editable !== false
                    },
                    cellStyle: (params: { data?: RowWithDetails }) => {
                        if (!params.data) return undefined
                        if (params.data.isChild) {
                            return {
                                paddingLeft: '20px',
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
                            return params.value ?? ''
                        }

                        const rowId = String(params.data.id || (params.data as Record<string, unknown>).reference || Math.random())
                        const isExpanded = expandedRowIds.value.has(rowId)
                        const detailData = (params.data as Record<string, unknown>)[detailConfig.key]
                        const hasDetails = Array.isArray(detailData) && detailData.length > 0

                        if (!hasDetails) {
                            return `<span>${params.value ?? ''}</span>`
                        }

                        const arrow = isExpanded
                            ? (detailConfig.iconExpanded || defaultIconExpanded)
                            : (detailConfig.iconCollapsed || defaultIconCollapsed)

                        const countText = detailConfig.countSuffix
                            ? ` (${detailData.length} ${detailConfig.countSuffix})`
                            : ` (${detailData.length})`

                        return `
              <div style="display: flex; align-items: center; width: 100%;">
                <span style="cursor: pointer; display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" data-expand-toggle="${rowId}" title="Cliquer pour afficher/masquer les détails">
                  ${arrow}
                </span>
                <span>${params.value ?? ''}</span>
                <span style="color: #666; font-size: 11px; margin-left: 8px;">${countText}</span>
              </div>`
                    },
                    onCellClicked: (event: CellClickedEvent) => {
                        const target = event.event?.target as HTMLElement
                        const expandToggle = target.closest('[data-expand-toggle]')
                        if (expandToggle && !(event.data as RowWithDetails)?.isChild) {
                            const rowId = expandToggle.getAttribute('data-expand-toggle')
                            if (rowId) {
                                toggleRowExpansion(rowId)
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
        }
    }

    // Computed visible columns with index
    const computedVisibleColumnDefsWithIndex = computed<ColDef[]>(() => {
        const cols = [...computedVisibleColumnDefs.value]

        // Add actions column if actions are provided
        if (actualProps.value.actions.length) {
            cols.push({
                headerName: actualProps.value.actionsHeaderName,
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
                        params: { actions: actualProps.value.actions }
                    }
                },
                cellStyle: { display: 'block', overflow: 'visible' },
                suppressSizeToFit: true,
                headerTooltip: actualProps.value.actionsHeaderName
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

    // Fonction pour vérifier l'état du localStorage (utile pour debug)
    const getStorageState = () => {
        const stored = localStorage.getItem(actualProps.value.storageKey)
        return {
            hasStoredData: !!stored,
            storedFields: stored ? JSON.parse(stored) : null,
            allFields: allAvailableFields.value,
            currentVisible: visibleFields.value
        }
    }

    onMounted(() => {
        document.addEventListener('click', handleClickOutside, { passive: true })
        document.addEventListener('click', handleClickOutsideExport)

        if (actualProps.value.dataUrl) {
            // Fetch data from URL if provided
            fetch(actualProps.value.dataUrl)
                .then(response => response.json())
                .then(data => {
                    // Restore state after data load
                    setTimeout(() => {
                        if (isGridValid() && actualProps.value.pagination) {
                            restorePaginationState()
                        }
                        restoreTableState()
                    }, 500)
                })
                .catch(err => console.error('fetchData error', err))
        } else {
            restoreTableState()
        }
    })

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('click', handleClickOutsideExport)
        // Save before component destruction
        cleanupBeforeDestroy()
        saveTableState()
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
        getStorageState,

        // Details management
        expandedRowIds,
        toggleRowExpansion,

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
