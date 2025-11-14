/**
 * Composable useInventoryResults - Gestion des résultats d'inventaire
 *
 * Ce composable gère :
 * - L'affichage des résultats d'inventaire par magasin
 * - La pagination, le tri et le filtrage côté serveur avec format standard DataTable
 * - La validation et modification des résultats
 * - La gestion dynamique des colonnes de comptage et d'écart
 *
 * @module useInventoryResults
 */

// ===== IMPORTS VUE =====
import { ref, computed, markRaw, watch } from 'vue'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS COMPOSABLES =====
import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'

// ===== IMPORTS SERVICES =====
import { dataTableService } from '@/services/dataTableService'
import { logger } from '@/services/loggerService'
import { alertService } from '@/services/alertService'

// ===== IMPORTS STORES =====
import { useResultsStore } from '@/stores/results'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'

// ===== IMPORTS TYPES =====
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { InventoryResult, StoreOption } from '@/interfaces/inventoryResults'
import type { Warehouse } from '@/models/Warehouse'
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'

// ===== IMPORTS ICÔNES =====
import IconCheck from '@/components/icon/icon-check.vue'
import IconPencil from '@/components/icon/icon-edit.vue'
import IconLaunch from '@/components/icon/icon-launch.vue'

/**
 * Options pour initialiser le composable
 */
export interface UseInventoryResultsConfig {
    inventoryReference?: string
    initialInventoryId?: number
}

/**
 * Composable pour la gestion des résultats d'inventaire
 * Utilise useBackendDataTable pour l'intégration avec Pinia
 */
export function useInventoryResults(config?: UseInventoryResultsConfig) {
    const resultsStore = useResultsStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()

    const {
        selectedStore,
        stores: storeOptionsFromStore
    } = storeToRefs(resultsStore)

    const { warehouses, loading: warehousesLoading } = storeToRefs(warehouseStore)

    // ===== ÉTAT LOCAL =====
    const inventoryReference = ref(config?.inventoryReference || '')
    const inventoryId = ref<number | null>(config?.initialInventoryId || null)
    const accountId = ref<number | null>(null)
    const isInitialized = ref(false)

    // États pour les magasins
    const storeOptions = ref<StoreOption[]>([])
    const usesWarehouseFallback = ref(false)

    const mapWarehouseToOption = (warehouse: Warehouse): StoreOption => ({
        label: warehouse.warehouse_name || warehouse.reference || `Entrepôt ${warehouse.id}`,
        value: String(warehouse.id)
    })

    const syncStoreOptions = (inventoryStores?: StoreOption[] | null) => {
        if (inventoryStores && inventoryStores.length > 0) {
            storeOptions.value = inventoryStores
            usesWarehouseFallback.value = false
            return
        }

        storeOptions.value = warehouses.value.map(mapWarehouseToOption)
        usesWarehouseFallback.value = true
    }

    watch(storeOptionsFromStore, newOptions => {
        if (newOptions.length > 0) {
            syncStoreOptions(newOptions)
        }
    })

    watch(warehouses, newWarehouses => {
        if (usesWarehouseFallback.value) {
            storeOptions.value = newWarehouses.map(mapWarehouseToOption)
        }
    })

    syncStoreOptions(storeOptionsFromStore.value)

    // ===== INITIALISATION DATATABLE =====

    /**
     * DataTable pour les résultats d'inventaire
     */
    const {
        data: results,
        loading,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        setPage,
        setPageSize,
        setSearch,
        setSortModel,
        setFilters,
        resetFilters,
        refresh,
        pagination
    } = useBackendDataTable<InventoryResult>('', {
        piniaStore: resultsStore,
        storeId: 'results',
        autoLoad: false,
        pageSize: 20
    })

    // ===== COMPUTED =====

    const hasResults = computed(() => results.value.length > 0)

    // ===== COLONNES DYNAMIQUES =====

    /**
     * Construire les colonnes de comptage dynamiquement
     */
    interface ResultWithLabels extends InventoryResult {
        __countingLabels?: Record<string, string>;
        __differenceLabels?: Record<string, string>;
    }

    const columns = computed<DataTableColumn[]>(() => {
        const inferCountingFields = () => {
            if (!results.value.length) return [] as string[];
            return Object.keys(results.value[0])
                .filter(key => /^contage_\d+$/.test(key))
                .sort((a, b) => Number(a.replace('contage_', '')) - Number(b.replace('contage_', '')));
        };

        const inferCountingLabel = (field: string, index: number) => {
            if (!results.value.length) return `${index + 1}ème comptage`;

            for (const result of results.value as ResultWithLabels[]) {
                const entries = Object.entries(result).filter(([key]) => key === field);
                for (const [key, value] of entries) {
                    if (key === field && result.__countingLabels?.[field]) {
                        return result.__countingLabels[field];
                    }
                }
            }

            if (index === 0) return '1er comptage';
            if (index === 1) return '2ème comptage';
            if (index === 2) return '3ème comptage';
            return `${index + 1}ème comptage`;
        };

        const inferDifferenceFields = () => {
            if (!results.value.length) return [] as string[];
            return Object.keys(results.value[0])
                .filter(key => /^ecart_\d+_\d+$/.test(key))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        };

        const inferDifferenceLabel = (field: string) => {
            if (!results.value.length) return 'Écart';

            for (const result of results.value as ResultWithLabels[]) {
                if (result.__differenceLabels?.[field]) {
                    return result.__differenceLabels[field];
                }
            }

            const match = field.match(/^ecart_(\d+)_(\d+)$/);
            if (!match) return 'Écart';
            return `Écart ${match[1]}-${match[2]}`;
        };

        const sortedCountingFields = inferCountingFields();
        const sortedDifferenceFields = inferDifferenceFields();

        const cols: DataTableColumn[] = [
            {
                headerName: 'ID',
                field: 'id',
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                width: 80,
                editable: false,
                visible: false,
                draggable: true,
                autoSize: true,
                description: 'Identifiant unique'
            },
            {
                headerName: 'Article',
                field: 'article',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                width: dataTableService.calculateOptimalColumnWidth({
                    field: 'article',
                    headerName: 'Article',
                    dataType: 'text'
                }),
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-box',
                description: 'Référence de l\'article'
            },
            {
                headerName: 'Emplacement',
                field: 'emplacement',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                width: dataTableService.calculateOptimalColumnWidth({
                    field: 'emplacement',
                    headerName: 'Emplacement',
                    dataType: 'text'
                }),
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-map-pin',
                description: 'Emplacement de l\'article'
            }
        ];

        sortedCountingFields.forEach((field, index) => {
            cols.push({
                headerName: inferCountingLabel(field, index),
                field,
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                width: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-calculator',
                description: `Valeur du comptage ${index + 1}`
            });
        });

        sortedDifferenceFields.forEach(field => {
            cols.push({
                headerName: inferDifferenceLabel(field),
                field,
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                width: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-trending-up',
                description: 'Écart entre les comptages',
                cellRenderer: (params: any) => {
                    const ecart = params?.value ?? params?.data?.[field];
                    if (ecart === undefined || ecart === null || ecart === '') return '-';
                    const numEcart = Number(ecart);
                    if (Number.isNaN(numEcart)) return '-';
                    const color = numEcart > 0 ? 'text-red-600' : numEcart < 0 ? 'text-green-600' : 'text-gray-600';
                    return `<span class="${color} font-semibold">${numEcart}</span>`;
                }
            });
        });

        cols.push({
            headerName: 'Résultat final',
            field: 'resultats',
            sortable: true,
            dataType: 'number' as ColumnDataType,
            filterable: true,
            width: 140,
            editable: true,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-check-circle',
            description: 'Résultat final validé'
        });

        return cols;
    });

    // Validation des colonnes
    columns.value.forEach(column => {
        const validation = dataTableService.validateColumnConfig(column)
        if (!validation.isValid) {
            logger.warn('Configuration de colonne invalide', { column, errors: validation.errors })
        }
    })

    // ===== ACTIONS =====

    /**
     * Actions pour chaque ligne de résultat
     */
    const actions: ActionConfig<InventoryResult>[] = [
        {
            label: 'Valider',
            icon: markRaw(IconCheck),
            color: 'success',
            onClick: async (result: InventoryResult) => {
                try {
                    const confirmation = await alertService.confirm({
                        title: 'Confirmer la validation',
                        text: 'Voulez-vous vraiment valider ce résultat ?'
                    })

                    if (confirmation.isConfirmed) {
                        await resultsStore.validateResults([result.id])
                        await alertService.success({ text: 'Résultat validé avec succès' })
                        await reloadResults()
                    }
                } catch (error) {
                    logger.error('Erreur lors de la validation', error)
                    await alertService.error({ text: 'Erreur lors de la validation' })
                }
            },
            show: () => true
        },
        {
            label: 'Modifier',
            icon: markRaw(IconPencil),
            color: 'primary',
            onClick: async (result: InventoryResult) => {
                try {
                    const swalResult = await Swal.fire({
                        title: 'Modifier le résultat',
                        text: 'Entrez la nouvelle valeur',
                        input: 'text',
                        inputPlaceholder: String(result.resultats ?? ''),
                        inputValue: String(result.resultats ?? ''),
                        showCancelButton: true,
                        confirmButtonText: 'Confirmer',
                        cancelButtonText: 'Annuler',
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn btn-secondary'
                        }
                    })

                    if (swalResult.isConfirmed && swalResult.value !== undefined && swalResult.value !== null) {
                        const newValue = Number(swalResult.value)
                        await resultsStore.updateValue(result.id, {
                            resultats: Number.isNaN(newValue) ? swalResult.value : newValue
                        })
                        await alertService.success({ text: 'Résultat modifié avec succès' })
                        await reloadResults()
                    }
                } catch (error) {
                    logger.error('Erreur lors de la modification', error)
                    await alertService.error({ text: 'Erreur lors de la modification' })
                }
            },
            show: () => true
        },
        {
            label: 'Lancer',
            icon: markRaw(IconLaunch),
            color: 'warning',
            onClick: async (result: InventoryResult) => {
                try {
                    await alertService.success({ text: 'Lancement effectué avec succès' })
                    await reloadResults()
                } catch (error) {
                    logger.error('Erreur lors du lancement', error)
                    await alertService.error({ text: 'Erreur lors du lancement' })
                }
            },
            show: () => true
        }
    ]

    // ===== MÉTHODES DE CHARGEMENT =====

    /**
     * Récupérer les magasins disponibles
     * Priorité 1 : Charger par account_id
     * Priorité 2 : Charger depuis l'inventaire (avec timeout)
     * Priorité 3 : Utiliser les magasins du store existant
     */
    const fetchStores = async () => {
        if (!inventoryId.value) {
            logger.warn('Aucun ID d\'inventaire défini')
            return
        }

        // Priorité 1 : Charger les magasins filtrés par account_id (plus rapide et fiable)
        if (accountId.value) {
            try {
                await warehouseStore.fetchWarehouses(accountId.value)
                logger.debug('Magasins chargés pour le compte', accountId.value)
                // Utiliser les magasins du warehouse store
                syncStoreOptions(null) // null pour forcer l'utilisation du fallback warehouse

                // Si on a des magasins, on peut retourner directement
                if (storeOptions.value.length > 0) {
                    logger.debug('Magasins synchronisés depuis le compte', storeOptions.value)
                    return
                }
            } catch (error) {
                logger.warn('Erreur lors du chargement des magasins par compte, essai depuis l\'inventaire', error)
                // Continuer avec le fallback
            }
        }

        // Priorité 2 : Essayer de charger les magasins depuis l'inventaire (fallback)
        try {
            const inventoryStoreOptions = await Promise.race([
                resultsStore.fetchStores(inventoryId.value),
                new Promise<StoreOption[]>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]) as StoreOption[]

            logger.debug('Magasins chargés depuis l\'inventaire', inventoryStoreOptions)

            // Si on a des magasins depuis l'inventaire, les utiliser
            if (inventoryStoreOptions && inventoryStoreOptions.length > 0) {
                syncStoreOptions(inventoryStoreOptions)
                logger.debug('Magasins synchronisés depuis l\'inventaire', storeOptions.value)
                return
            }
        } catch (error) {
            logger.warn('Impossible de charger les magasins depuis l\'inventaire', error)
            // Ne pas afficher d'erreur bloquante, utiliser ce qu'on a
        }

        // Dernier recours : utiliser les magasins déjà dans le store s'ils existent
        if (storeOptionsFromStore.value.length > 0) {
            syncStoreOptions(storeOptionsFromStore.value)
            logger.debug('Utilisation des magasins du store existant', storeOptions.value)
        } else {
            logger.warn('Aucun magasin disponible')
        }
    }

    /**
     * Récupérer les résultats pour un magasin
     */
    const fetchResults = async (storeId: string) => {
        if (!inventoryId.value) {
            logger.warn('Aucun ID d\'inventaire défini')
            return
        }

        try {
            resultsStore.setSelectedStore(storeId)
            await resultsStore.fetchResults(inventoryId.value, storeId)
            logger.debug('Résultats chargés pour le magasin', storeId)
        } catch (error) {
            logger.error('Erreur lors du chargement des résultats', error)
            await alertService.error({ text: 'Erreur lors du chargement des résultats' })
        }
    }

    /**
     * Recharger les résultats actuels
     */
    const reloadResults = async () => {
        if (selectedStore.value) {
            await fetchResults(selectedStore.value)
        }
    }

    /**
     * Récupérer l'inventaire par référence
     */
    const fetchInventoryByReference = async (reference: string) => {
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(reference)
            inventoryId.value = inventory.id
            accountId.value = inventory.account_id || null
            inventoryReference.value = reference
            logger.debug('Inventaire chargé', { id: inventoryId.value, accountId: accountId.value, reference })
            return inventory
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'inventaire', error)
            await alertService.error({ text: `Inventaire "${reference}" introuvable` })
            throw error
        }
    }

    // ===== MÉTHODES D'ACTION =====

    /**
     * Sélectionner un magasin et charger ses résultats
     */
    const handleStoreSelect = async (storeId: string | null) => {
        if (!storeId) return
        await fetchResults(storeId)
    }

    /**
     * Validation en masse des résultats sélectionnés
     */
    const handleBulkValidate = async (selectedResults: InventoryResult[]) => {
        if (selectedResults.length === 0) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un résultat à valider' })
            return
        }

        try {
            const confirmation = await alertService.confirm({
                title: 'Confirmer la validation en masse',
                text: `Voulez-vous vraiment valider ${selectedResults.length} résultat(s) ?`
            })

            if (confirmation.isConfirmed) {
                const ids = selectedResults.map(r => r.id)
                await resultsStore.validateResults(ids)
                await alertService.success({ text: `${selectedResults.length} résultat(s) validé(s) avec succès` })
                await reloadResults()
            }
        } catch (error) {
            logger.error('Erreur lors de la validation en masse', error)
            await alertService.error({ text: 'Erreur lors de la validation en masse' })
        }
    }

    // ===== HANDLERS DATATABLE =====

    /**
     * Handler pour les changements de pagination
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param params - Paramètres de pagination (format standard ou ancien format)
     */
    const onPaginationChanged = async (params: { page: number; pageSize: number } | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), utiliser directement
        if ('draw' in params && 'start' in params && 'length' in params) {
            const standardParams = params as StandardDataTableParams
            const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
            setPage(page)
            setPageSize(standardParams.length || 20)
            await reloadResults()
            return
        }

        // Sinon, convertir l'ancien format
        const paginationParams = params as { page: number; pageSize: number }
        setPage(paginationParams.page)
        setPageSize(paginationParams.pageSize)
        await reloadResults()
    }

    /**
     * Handler pour les changements de tri
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param sortModel - Modèle de tri (format standard ou ancien format)
     */
    const onSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }> | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if ('draw' in sortModel && 'start' in sortModel && 'length' in sortModel) {
            const standardParams = sortModel as StandardDataTableParams
            const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
            setPage(page)
            setPageSize(standardParams.length || 20)

            // Extraire le tri depuis les paramètres standard
            const extractedSort: Array<{ field: string; direction: 'asc' | 'desc' }> = []
            let sortIndex = 0
            while (standardParams[`order[${sortIndex}][column]`] !== undefined) {
                const columnIndex = standardParams[`order[${sortIndex}][column]`]
                const direction = standardParams[`order[${sortIndex}][dir]`] as 'asc' | 'desc'
                const fieldKey = `columns[${columnIndex}][data]`
                const fieldName = standardParams[fieldKey]
                if (fieldName) {
                    extractedSort.push({
                        field: fieldName,
                        direction
                    })
                }
                sortIndex++
            }
            setSortModel(extractedSort as any)
            await reloadResults()
            return
        }

        // Sinon, convertir l'ancien format
        const sortModelArray = sortModel as Array<{ colId: string; sort: 'asc' | 'desc' }>
        const adaptedSortModel = sortModelArray.map(sort => ({
            field: sort.colId,
            direction: sort.sort
        }))
        setSortModel(adaptedSortModel as any)
        await reloadResults()
    }

    /**
     * Handler pour les changements de filtres
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param filterModel - Modèle de filtres (format standard ou ancien format)
     */
    const onFilterChanged = async (filterModel: Record<string, { filter: string }> | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if ('draw' in filterModel && 'start' in filterModel && 'length' in filterModel) {
            const standardParams = filterModel as StandardDataTableParams
            const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
            setPage(page)
            setPageSize(standardParams.length || 20)

            // Extraire les filtres depuis les paramètres standard
            const extractedFilters: Record<string, { filter: string }> = {}
            Object.keys(standardParams).forEach(key => {
                if (key.startsWith('columns[') && key.includes('][search][value]')) {
                    const match = key.match(/columns\[(\d+)\]\[search\]\[value\]/)
                    if (match && standardParams[key]) {
                        const columnIndex = parseInt(match[1])
                        const fieldKey = `columns[${columnIndex}][data]`
                        const fieldName = standardParams[fieldKey]
                        if (fieldName) {
                            extractedFilters[fieldName] = {
                                filter: standardParams[key]
                            }
                        }
                    }
                }
            })
            setFilters(extractedFilters)
            await reloadResults()
            return
        }

        // Sinon, utiliser directement l'ancien format
        const filterModelObj = filterModel as Record<string, { filter: string }>
        setFilters(filterModelObj)
        await reloadResults()
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param searchTerm - Terme de recherche (format standard ou string)
     */
    const onGlobalSearchChanged = async (searchTerm: string | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if (typeof searchTerm === 'object' && 'draw' in searchTerm && 'start' in searchTerm && 'length' in searchTerm) {
            const standardParams = searchTerm as StandardDataTableParams
            const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
            setPage(page)
            setPageSize(standardParams.length || 20)
            setSearch(standardParams['search[value]'] || '')
            await reloadResults()
            return
        }

        // Sinon, utiliser directement la valeur string
        setSearch(searchTerm as string)
        await reloadResults()
    }

    // ===== INITIALISATION =====

    /**
     * Initialiser le composable avec une référence d'inventaire
     */
    const initialize = async (reference?: string) => {
        try {
            // Utiliser la référence fournie ou celle stockée
            const ref = reference || inventoryReference.value

            if (!ref) {
                logger.error('Aucune référence d\'inventaire fournie')
                return
            }

            // Mettre à jour la référence si fournie
            if (reference) {
                inventoryReference.value = reference
            }

            logger.debug('Initialisation des résultats d\'inventaire', { reference: ref })

            // Récupérer l'inventaire
            await fetchInventoryByReference(ref)

            if (!inventoryId.value) {
                throw new Error('Impossible de résoudre l\'ID d\'inventaire')
            }

            // Charger les magasins
            await fetchStores()

            // Sélectionner le premier magasin par défaut seulement s'il y en a
            if (storeOptions.value.length > 0) {
                const defaultStoreId = storeOptions.value[0].value
                resultsStore.setSelectedStore(defaultStoreId)
                await fetchResults(defaultStoreId)
                logger.debug('Premier magasin sélectionné par défaut', defaultStoreId)
            } else {
                logger.warn('Aucun magasin disponible pour sélection automatique')
            }

            isInitialized.value = true
            logger.debug('Initialisation terminée avec succès')
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation', error)
            await alertService.error({ text: 'Erreur lors de l\'initialisation des résultats' })
        }
    }

    /**
     * Réinitialiser avec une nouvelle référence
     */
    const reinitialize = async (reference: string) => {
        if (!reference) return

        try {
            isInitialized.value = false
            resultsStore.setSelectedStore(null)
            storeOptions.value = []
            usesWarehouseFallback.value = false

            inventoryReference.value = reference
            await initialize()
        } catch (error) {
            logger.error('Erreur lors de la réinitialisation', error)
            throw error
        }
    }

    // ===== RETURN =====

    return {
        // État
        inventoryId: computed(() => inventoryId.value),
        inventoryReference: computed(() => inventoryReference.value),
        isInitialized,
        loading,

        // Données
        results,
        stores: storeOptions,
        selectedStore,
        warehouses,
        warehousesLoading,
        usesWarehouseFallback,
        hasResults,

        // Configuration DataTable
        columns,
        actions,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        pagination,

        // Méthodes DataTable
        setPage,
        setPageSize,
        setSearch,
        setSortModel,
        setFilters,
        resetFilters,
        refresh,

        // Actions
        handleStoreSelect,
        handleBulkValidate,
        initialize,
        reinitialize,
        fetchStores,
        fetchResults,
        reloadResults,

        // Handlers DataTable
        onPaginationChanged,
        onSortChanged,
        onFilterChanged,
        onGlobalSearchChanged,

        // Alias pour compatibilité
        fetchInventoryByReference,
        initializeWithReference: initialize,
        reloadWithReference: reinitialize,
        handlePaginationChanged: onPaginationChanged,
        handleSortChanged: onSortChanged,
        handleFilterChanged: onFilterChanged,
        handleGlobalSearchChanged: onGlobalSearchChanged
    }
}
