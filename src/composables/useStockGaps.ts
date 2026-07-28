/**
 * Composable — Écarts stock théorique vs inventorié (DataTable QueryModel)
 *
 * GET /web/api/inventory/{id}/warehouses/{wid}/stock-gaps/?page=1&pageSize=20
 * PATCH /web/api/ecarts-stock/{ecart_id}/
 * POST /web/api/ecarts-stock/{ecart_id}/valider/
 *
 * @module useStockGaps
 */

import { ref, computed, shallowRef, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import type {
    ActionConfig,
    DataTableColumnAny,
    QueryModel,
    ColumnDataType,
} from '@SMATCH-Digital-dev/vue-system-design'
import { convertQueryModelToQueryParams } from '@SMATCH-Digital-dev/vue-system-design'
import { InventoryService } from '@/services/InventoryService'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { fetchInventoryIdByReference, fetchWarehouseIdByReference } from '@/composables/affecter/helpers'
import { createDataTableOperationHandler } from '@/composables/dataTable/createDataTableOperationHandler'
import { sanitizeQueryModel } from '@/composables/dataTable/sanitizeQueryModel'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import type { StockGapRow, StockGapTotaux } from '@/models/TheoreticalStock'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

function extractApiErrorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback
    const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data
    if (!data) return fallback

    if (typeof data.message === 'string' && data.message) return data.message

    const errors = data.errors
    if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors as Record<string, unknown>)[0]
        if (firstKey) {
            const messages = (errors as Record<string, unknown>)[firstKey]
            if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0]
            if (typeof messages === 'string') return messages
        }
    }

    return fallback
}

export function useStockGaps(inventoryReference: string, warehouseReference: string) {
    const router = useRouter()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()

    const inventoryId = ref<number | null>(null)
    const warehouseId = ref<number | null>(null)
    const loading = ref(false)
    const initializing = ref(true)
    const mutating = ref(false)
    const error = ref<string | null>(null)
    const rows = shallowRef<StockGapRow[]>([])
    const selectedEcartIds = ref<Array<string | number>>([])
    const totaux = ref<StockGapTotaux | null>(null)
    const source = ref<string | null>(null)
    const lastQueryModel = ref<QueryModel | null>(null)
    const queryModelRef = ref<QueryModel>({
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        search: '',
        sort: [],
        filters: {},
        customParams: {},
    })

    const pagination = ref({
        current_page: DEFAULT_PAGE,
        page_size: DEFAULT_PAGE_SIZE,
        total: 0,
        total_pages: 0,
    })

    const customParams = computed(() => ({
        inventory_id: inventoryId.value,
        warehouse_id: warehouseId.value,
    }))

    const columns = computed((): DataTableColumnAny[] => [
        {
            field: 'cle',
            headerName: 'Clé',
            sortable: true,
            filterable: true,
            dataType: 'text' as ColumnDataType,
            width: 180,
            icon: 'mdi-barcode',
        },
        {
            field: 'designation',
            headerName: 'Désignation',
            sortable: true,
            filterable: true,
            dataType: 'text' as ColumnDataType,
            width: 260,
            icon: 'mdi-tag-outline',
        },
        {
            field: 'qte_theorique',
            headerName: 'Qté théorique',
            sortable: true,
            filterable: true,
            dataType: 'number' as ColumnDataType,
            width: 140,
            icon: 'mdi-package-variant',
        },
        {
            field: 'qte_inventoriee',
            headerName: 'Qté inventoriée',
            sortable: true,
            filterable: true,
            dataType: 'number' as ColumnDataType,
            width: 150,
            icon: 'mdi-clipboard-check-outline',
        },
        {
            field: 'ecart',
            headerName: 'Écart',
            sortable: true,
            filterable: true,
            dataType: 'number' as ColumnDataType,
            width: 120,
            icon: 'mdi-scale-balance',
        },
        {
            field: 'resultat_final',
            headerName: 'Résultat final',
            sortable: true,
            filterable: true,
            dataType: 'number' as ColumnDataType,
            width: 140,
            icon: 'mdi-check-decagram-outline',
        },
        {
            field: 'valide_label',
            headerName: 'Validé',
            sortable: true,
            filterable: true,
            dataType: 'text' as ColumnDataType,
            width: 120,
            icon: 'mdi-shield-check-outline',
            badgeStyles: [
                {
                    value: 'Oui',
                    class: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
                },
                {
                    value: 'Non',
                    class: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
                },
            ],
            badgeDefaultClass: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 border-gray-200 text-gray-800',
        },
    ])

    const mergeQueryModel = (queryModel: QueryModel): QueryModel => ({
        ...queryModelRef.value,
        ...queryModel,
        page: queryModel.page ?? queryModelRef.value.page ?? DEFAULT_PAGE,
        pageSize: queryModel.pageSize ?? queryModelRef.value.pageSize ?? DEFAULT_PAGE_SIZE,
        sort: queryModel.sort ?? queryModelRef.value.sort,
        filters: queryModel.filters ?? queryModelRef.value.filters,
        search: queryModel.search !== undefined ? queryModel.search : queryModelRef.value.search,
        customParams: {
            ...(queryModel.customParams || {}),
            ...customParams.value,
        },
    })

    const fetchGaps = async (queryModel: QueryModel) => {
        if (!inventoryId.value || !warehouseId.value) return

        queryModelRef.value = { ...queryModel }

        const urlSearchParams = convertQueryModelToQueryParams(queryModel)
        const requestParams = Object.fromEntries(urlSearchParams.entries()) as Record<string, unknown>
        const {
            inventory_id: _inv,
            warehouse_id: _wh,
            only_nonzero: _onlyNonZero,
            ...cleanParams
        } = requestParams

        const response = await InventoryService.getStockGaps(
            inventoryId.value,
            warehouseId.value,
            cleanParams
        )

        rows.value = (response.rows || []).map((row) => ({
            ...row,
            id: row.ecart_id,
            _rowId: String(row.ecart_id),
            valide_label: row.valide ? 'Oui' : 'Non',
        }))
        totaux.value = response.totaux ?? null
        source.value = response.source ?? null
        pagination.value = {
            current_page: response.page ?? DEFAULT_PAGE,
            page_size: response.pageSize ?? DEFAULT_PAGE_SIZE,
            total: response.total ?? 0,
            total_pages: response.totalPages ?? 0,
        }
        selectedEcartIds.value = []
    }

    const handleOperation = createDataTableOperationHandler({
        fetch: fetchGaps,
        getLastQueryModel: () => lastQueryModel.value,
        setLastQueryModel: (qm) => {
            lastQueryModel.value = qm
        },
        onLoading: (isLoading) => {
            loading.value = isLoading
        },
        canFetch: () => !!(inventoryId.value && warehouseId.value),
        onError: async (err) => {
            logger.error('Erreur chargement écarts stock', err)
            error.value = 'Impossible de charger les écarts stock'
            await alertService.error({ text: error.value })
        },
        sanitize: (qm) => sanitizeQueryModel(mergeQueryModel(qm)),
    })

    const onTableEvent = async (_eventType: string, queryModel: QueryModel) => {
        if (!queryModel || typeof queryModel !== 'object') return
        await handleOperation(queryModel)
    }

    const reloadCurrentPage = async () => {
        await handleOperation({
            ...queryModelRef.value,
            page: queryModelRef.value.page ?? pagination.value.current_page ?? DEFAULT_PAGE,
            customParams: customParams.value,
        })
    }

    const reload = async () => {
        lastQueryModel.value = null
        await handleOperation({
            ...queryModelRef.value,
            page: DEFAULT_PAGE,
            customParams: customParams.value,
        })
    }

    const applyLocalRowUpdate = (ecartId: number, patch: Partial<StockGapRow>) => {
        rows.value = rows.value.map((row) => {
            if (row.ecart_id !== ecartId) return row
            const next = { ...row, ...patch, id: ecartId, _rowId: String(ecartId) }
            if ('valide' in patch) {
                next.valide_label = patch.valide ? 'Oui' : 'Non'
            }
            return next
        })
    }

    const onSelectionChanged = (selectedRows: Set<string> | StockGapRow[]) => {
        if (selectedRows instanceof Set) {
            selectedEcartIds.value = Array.from(selectedRows)
            return
        }
        if (Array.isArray(selectedRows)) {
            selectedEcartIds.value = selectedRows
                .map((row) => row.ecart_id ?? (row as { id?: number }).id)
                .filter((id): id is number => typeof id === 'number' && id > 0)
            return
        }
        selectedEcartIds.value = []
    }

    const selectedRows = computed(() => {
        const ids = new Set(selectedEcartIds.value.map(String))
        if (ids.size === 0) return []
        return rows.value.filter(
            (row) => ids.has(String(row.ecart_id)) || ids.has(String((row as { id?: number }).id))
        )
    })

    const selectedCount = computed(() => selectedRows.value.length)

    const selectedValidables = computed(() =>
        selectedRows.value.filter(
            (row) =>
                !row.valide
                && row.resultat_final !== null
                && row.resultat_final !== undefined
                && typeof row.ecart_id === 'number'
                && row.ecart_id > 0
        )
    )

    const canValiderSelection = computed(() => selectedValidables.value.length > 0)
    const selectedValidablesCount = computed(() => selectedValidables.value.length)

    const handleModifierResultatFinal = async (row: StockGapRow) => {
        if (row.valide) {
            await alertService.warning({
                text: 'Impossible de modifier le résultat final : la ligne est validée.',
            })
            return
        }

        if (!row.ecart_id) {
            await alertService.error({ text: 'Identifiant d\'écart introuvable.' })
            return
        }

        const swalResult = await Swal.fire({
            title: 'Modifier le résultat final',
            html: `
                <div style="text-align: left; padding: 0.5rem 0;">
                    <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 0.75rem;">
                        <strong>${row.cle}</strong> — ${row.designation || 'Article'}
                    </p>
                    <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">
                        Qté inventoriée : ${row.qte_inventoriee} · Écart : ${row.ecart}
                    </p>
                </div>
            `,
            input: 'number',
            inputPlaceholder: 'Résultat final',
            inputValue: row.resultat_final ?? row.qte_inventoriee ?? '',
            inputAttributes: {
                min: '0',
                step: '1',
            },
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#FECD1C',
            inputValidator: (value) => {
                if (value === '' || value === null || value === undefined) {
                    return 'Ce champ est obligatoire.'
                }
                const numValue = Number(value)
                if (Number.isNaN(numValue) || numValue < 0) {
                    return 'Veuillez entrer un nombre valide (≥ 0)'
                }
                return null
            },
            customClass: {
                popup: 'sweet-alerts',
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn-cancel-primary',
            },
        })

        if (!swalResult.isConfirmed || swalResult.value === undefined || swalResult.value === null) {
            return
        }

        const resultatFinal = Number(swalResult.value)
        mutating.value = true
        try {
            const response = await InventoryService.updateEcartStockResultatFinal(
                row.ecart_id,
                resultatFinal
            )
            applyLocalRowUpdate(row.ecart_id, {
                resultat_final: response.data?.resultat_final ?? resultatFinal,
                valide: response.data?.valide ?? false,
            })
            await alertService.success({
                text: response.message || 'Résultat final mis à jour',
            })
        } catch (err) {
            logger.error('Erreur modification résultat final', err)
            await alertService.error({
                text: extractApiErrorMessage(err, 'Impossible de modifier le résultat final'),
            })
        } finally {
            mutating.value = false
        }
    }

    const handleValiderEcart = async (row: StockGapRow) => {
        if (row.valide) {
            await alertService.warning({ text: 'Cette ligne est déjà validée.' })
            return
        }

        if (row.resultat_final === null || row.resultat_final === undefined) {
            await alertService.warning({
                text: 'Le résultat final doit être renseigné avant validation.',
            })
            return
        }

        if (!row.ecart_id) {
            await alertService.error({ text: 'Identifiant d\'écart introuvable.' })
            return
        }

        const confirmation = await alertService.confirm({
            title: 'Valider la ligne',
            text: `Valider l'écart "${row.cle}" avec résultat final ${row.resultat_final} ?`,
        })
        if (!confirmation.isConfirmed) return

        mutating.value = true
        try {
            const response = await InventoryService.validerEcartStock(row.ecart_id)
            applyLocalRowUpdate(row.ecart_id, {
                valide: response.data?.valide ?? true,
                resultat_final: response.data?.resultat_final ?? row.resultat_final,
            })
            await alertService.success({
                text: response.message || 'Ligne validée avec succès',
            })
            await reloadCurrentPage()
        } catch (err) {
            logger.error('Erreur validation écart stock', err)
            await alertService.error({
                text: extractApiErrorMessage(err, 'Impossible de valider la ligne'),
            })
        } finally {
            mutating.value = false
        }
    }

    const handleValiderSelection = async () => {
        const targets = selectedValidables.value
        if (targets.length === 0) {
            const selectedButInvalid = selectedRows.value.filter((row) => !row.valide)
            if (selectedButInvalid.length > 0) {
                await alertService.warning({
                    text: 'Le résultat final doit être renseigné avant validation pour chaque ligne sélectionnée.',
                })
                return
            }
            await alertService.warning({
                text: 'Aucune ligne valide à valider dans la sélection.',
            })
            return
        }

        const confirmation = await alertService.confirm({
            title: 'Valider la sélection',
            text: `Valider ${targets.length} ligne(s) sélectionnée(s) ?`,
        })
        if (!confirmation.isConfirmed) return

        const ecartIds = targets.map((row) => row.ecart_id)
        mutating.value = true
        try {
            const response = await InventoryService.validerEcartStockBulk(ecartIds)
            const validatedCount = response.data?.validated_count ?? 0
            const failedCount = response.data?.failed_count ?? 0

            if (failedCount > 0) {
                await alertService.warning({
                    title: 'Validation partielle',
                    text:
                        response.message
                        || `${validatedCount} validée(s), ${failedCount} échec(s).`,
                })
            } else {
                await alertService.success({
                    text: response.message || 'Toutes les lignes sélectionnées ont été validées',
                })
            }

            selectedEcartIds.value = []
            await reloadCurrentPage()
        } catch (err) {
            logger.error('Erreur validation multi écarts stock', err)
            await alertService.error({
                text: extractApiErrorMessage(err, 'Impossible de valider la sélection'),
            })
        } finally {
            mutating.value = false
        }
    }

    const actions = computed<ActionConfig<StockGapRow>[]>(() => [
        {
            label: 'Modifier',
            icon: 'mdi-pencil-outline',
            color: 'warning',
            tooltip: 'Modifier le résultat final',
            onClick: (row) => {
                void handleModifierResultatFinal(row)
            },
            show: (row) => !row.valide,
            disabled: (row) => row.valide || mutating.value,
        },
        {
            label: 'Valider',
            icon: 'mdi-check-circle-outline',
            color: 'success',
            tooltip: 'Valider la ligne',
            onClick: (row) => {
                void handleValiderEcart(row)
            },
            show: (row) => !row.valide,
            disabled: (row) => row.valide || mutating.value,
        },
    ])

    const initialize = async () => {
        initializing.value = true
        error.value = null
        try {
            const [invId, whId] = await Promise.all([
                fetchInventoryIdByReference(inventoryReference, inventoryStore),
                fetchWarehouseIdByReference(warehouseReference, warehouseStore),
            ])
            inventoryId.value = invId
            warehouseId.value = whId
            if (!invId || !whId) {
                error.value = 'Impossible de résoudre l\'inventaire ou le magasin.'
                return
            }
            await reload()
        } catch (err) {
            logger.error('Erreur initialisation écarts stock', err)
            error.value = 'Erreur lors de l\'initialisation'
        } finally {
            initializing.value = false
        }
    }

    const goBack = () => {
        router.push({
            name: 'inventory-detail',
            params: { reference: inventoryReference },
        })
    }

    const goToResults = () => {
        router.push({
            name: 'inventory-results',
            params: {
                reference: inventoryReference,
                warehouse: warehouseReference,
            },
        })
    }

    onMounted(() => {
        void initialize()
    })

    return {
        inventoryId,
        warehouseId,
        loading,
        initializing,
        mutating,
        error,
        rows,
        totaux,
        source,
        columns,
        actions,
        pagination,
        customParams,
        selectedCount,
        selectedValidablesCount,
        canValiderSelection,
        onSelectionChanged,
        handleValiderSelection,
        onTableEvent,
        reload,
        initialize,
        goBack,
        goToResults,
    }
}
