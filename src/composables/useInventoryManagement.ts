import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'
import { dataTableService } from '@/services/dataTableService'
import { logger } from '@/services/loggerService'
import type { InventoryTable } from '@/models/Inventory'
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { StockImportErrorResponse } from '@/interfaces/stockImport'
import { ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'


// Import des icônes
import IconEye from '@/components/icon/icon-eye.vue'
import IconUpload from '@/components/icon/icon-upload.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconEdit from '@/components/icon/icon-edit.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

// Import des nouvelles fonctionnalités
import { useDataTableLazyLoading } from './useDataTableLazyLoading'
import { useDataTableOptimizations } from './useDataTableOptimizations'

/**
 * Composable pour la gestion des inventaires
 * Utilise useBackendDataTable pour l'intégration avec Pinia et les paramètres DataTable
 * Intègre le lazy loading, les optimisations de rendu et l'édition avancée
 */
export function useInventoryManagement() {
    const router = useRouter()
    const inventoryStore = useInventoryStore()

    // Initialiser useBackendDataTable avec le store Pinia
    const {
        data: inventories,
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
    } = useBackendDataTable<InventoryTable>('', {
        piniaStore: inventoryStore,
        storeId: 'inventory',
        autoLoad: true,
        pageSize: 20
    })

    /**
     * Configuration du lazy loading - adapté pour useBackendDataTable
     */
    const lazyLoadingConfig = {
        pageSize: 50, // Charger 50 éléments par page
        debounceDelay: 300,
        threshold: 0.8,
        loadData: async (page: number, pageSize: number, filters?: any) => {
            try {
                // Utiliser les méthodes de useBackendDataTable
                setPage(page)
                setPageSize(pageSize)
                if (filters) {
                    setFilters(filters)
                }
                await refresh()

                return {
                    data: inventories.value,
                    total: pagination.value.total,
                    hasMore: pagination.value.has_next
                }
            } catch (error) {
                logger.error('Erreur lazy loading', error)
                throw error
            }
        },
        onDataLoaded: (data: any[], page: number) => {
            logger.debug('Données chargées via lazy loading', { page, count: data.length })
        },
        onError: (error: any) => {
            logger.error('Erreur lazy loading', error)
        }
    }

    /**
     * Configuration des optimisations de rendu - adapté pour useBackendDataTable
     */
    const optimizationConfig = {
        rendering: {
            enableVirtualScrolling: true,
            enableCellCaching: true,
            enableDataCompression: true,
            enablePreRendering: true,
            enableImageOptimization: true,
            optimizationThreshold: 100
        },
        maxItemsBeforeOptimization: 500,
        debounceDelay: 16, // ~60fps
        cellCacheSize: 1000,
        virtualScrolling: {
            itemHeight: 50,
            overscan: 5,
            containerHeight: 400
        }
    }
    // Les fonctionnalités de dataTable sont maintenant fournies par useBackendDataTable
    // Pas besoin d'initialiser useGenericDataTable séparément

    /**
     * Initialisation du lazy loading
     */
    const lazyLoading = useDataTableLazyLoading(lazyLoadingConfig)

    /**
     * Initialisation des optimisations de rendu - adapté pour useBackendDataTable
     */
    const optimizations = useDataTableOptimizations(
        inventories.value,
        optimizationConfig
    )

    /**
     * Initialisation de l'édition avancée - adapté pour useBackendDataTable
     */


    /**
     * Configuration des colonnes avec validation
     * Utilise le service DataTable pour la validation
     */
    const columns: DataTableColumn[] = [
        {
            headerName: 'Libellé',
            field: 'label',
            sortable: true,
            dataType: 'text' as ColumnDataType,
            filterable: true,
            width: dataTableService.calculateOptimalColumnWidth({
                field: 'label',
                headerName: 'Libellé',
                dataType: 'text'
            }),
            editable: true, // Activé pour l'édition
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-file-text',
            description: 'Libellé de l\'inventaire'
        },
        {
            headerName: 'Date',
            field: 'date',
            sortable: true,
            dataType: 'date' as ColumnDataType,
            filterable: true,
            width: dataTableService.calculateOptimalColumnWidth({
                field: 'date',
                headerName: 'Date',
                dataType: 'date'
            }),
            editable: true, // Activé pour l'édition
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-calendar',
            description: 'Date inventaire'
        },
        {
            headerName: 'Statut',
            field: 'status',
            sortable: true,
            dataType: 'select' as ColumnDataType,
            filterable: true,
            width: dataTableService.calculateOptimalColumnWidth({
                field: 'status',
                headerName: 'Statut',
                dataType: 'select'
            }),
            editable: false, // Activé pour l'édition
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-status',
            description: 'Statut de l\'inventaire',
            /**
             * Configuration du filtre select avec les options de statut disponibles
             * Permet d'afficher la liste des statuts dans le filtre (comportement Excel)
             */
            filterConfig: {
                dataType: 'select' as ColumnDataType,
                operator: 'in' as const,
                options: [
                    { value: 'EN PREPARATION', label: 'EN PREPARATION' },
                    { value: 'EN REALISATION', label: 'EN REALISATION' },
                    { value: 'TERMINE', label: 'TERMINE' },
                    { value: 'CLOTURE', label: 'CLOTURE' }
                ]
            },
            /**
             * Configuration des badges pour les différents statuts
             * Chaque statut a sa propre classe CSS pour un style distinctif
             */
            badgeStyles: [
                {
                    value: 'EN PREPARATION',
                    class: 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset'
                },
                {
                    value: 'EN REALISATION',
                    class: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset'
                },
                {
                    value: 'TERMINE',
                    class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset'
                },
                {
                    value: 'CLOTURE',
                    class: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
                }
            ],
            badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
        },
        {
            headerName: 'Date préparation',
            field: 'en_preparation_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage en préparation'
        },
        {
            headerName: 'Date réalisation',
            field: 'en_realisation_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage en réalisation'
        },
        {
            headerName: 'Date terminé',
            field: 'termine_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage terminé'
        },
        {
            headerName: 'Date clôture',
            field: 'cloture_status_date',
            sortable: true,
            dataType: 'date',
            filterable: true,
            width: 90,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            icon: 'icon-clock',
            description: 'Date passage clôturé'
        },
        {
            headerName: 'Compte',
            field: 'account_name',
            sortable: true,
            dataType: 'text',
            filterable: true,
            width: 100,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-user',
            description: 'Compte'
        },
    ]

    // Validation des colonnes
    columns.forEach(column => {
        const validation = dataTableService.validateColumnConfig(column)
        if (!validation.isValid) {
            logger.warn('Configuration de colonne invalide', { column, errors: validation.errors })
        }
    })

    // États pour la modale d'import Excel
    const showImportModal = ref(false)
    const isImporting = ref(false)
    const importError = ref<string | null>(null)
    const importErrorDetails = ref<StockImportErrorResponse | null>(null)
    const importSuccess = ref<boolean>(false)
    const importSuccessMessage = ref<string | null>(null)
    const currentImportInventory = ref<InventoryTable | null>(null)

    // Fonction pour gérer l'import Excel depuis les actions
    const handleImportExcel = (inventory: InventoryTable) => {
        currentImportInventory.value = inventory
        showImportModal.value = true
    }

    // Fonction pour gérer la suppression
    const handleDelete = async (inventory: InventoryTable) => {
        try {
            const result = await alertService.confirm({
                title: 'Confirmer la suppression',
                text: `Êtes-vous sûr de vouloir supprimer l'inventaire "${inventory.label}" ?`,
                icon: 'warning'
            })

            if (result.isConfirmed) {
                // Ici vous pouvez appeler votre API pour supprimer l'inventaire
                // await inventoryStore.deleteInventory(inventory.id)
                logger.success('Inventaire supprimé avec succès')
                await refresh()
            }
        } catch (error) {
            logger.error('Erreur lors de la suppression', error)
            alertService.error('Erreur lors de la suppression')
        }
    }

    // Actions pour les inventaires
    const actions: ActionConfig<InventoryTable>[] = [
        {
            label: 'Détail',
            icon: markRaw(IconEye),
            color: 'primary',
            onClick: inv => { void router.push({ name: 'inventory-detail', params: { reference: inv.reference } }) },
            show: () => true,
        },
        {
            label: 'Importer image de stock',
            icon: markRaw(IconUpload),
            color: 'secondary',
            onClick: handleImportExcel,
            show: inv => inv.status === 'EN PREPARATION',
        },
        {
            label: inv => inv.status === 'EN REALISATION' ? 'Transférer' : 'Préparer',
            icon: markRaw(IconCalendar),
            color: 'warning',
            onClick: inv => { void router.push({ name: 'planning-management', params: { reference: inv.reference } }) },
            show: inv => ['EN PREPARATION', 'EN REALISATION'].includes(inv.status),
        },
        {
            label: 'Modifier',
            icon: markRaw(IconEdit),
            color: 'success',
            onClick: inv => { void router.push({ name: 'inventory-edit', params: { reference: inv.reference } }) },
            show: inv => inv.status === 'EN PREPARATION',
        },
        {
            label: 'Résultats',
            icon: markRaw(IconCheck),
            color: 'info',
            onClick: inv => { void router.push({ name: 'inventory-results', params: { reference: inv.reference } }) },
            show: inv => ['EN REALISATION', 'TERMINE', 'CLOTURE'].includes(inv.status),
        },
        {
            label: 'Supprimer',
            icon: markRaw(IconTrash),
            color: 'danger',
            onClick: handleDelete,
            show: inv => inv.status === 'EN PREPARATION',
        },
    ]

    // Fonction de redirection
    const redirectToAdd = () => {
        void router.push({ name: 'inventory-create' })
    }

    // Fonction d'import Excel
    const processImportExcel = async (file: File) => {
        if (!currentImportInventory.value) return

        isImporting.value = true
        importError.value = null
        importErrorDetails.value = null

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await inventoryStore.importStockImage(currentImportInventory.value.id, formData)
            logger.success('Import Excel réussi', response)

            // Afficher le message de succès
            importSuccess.value = true
            importSuccessMessage.value = response?.message || 'Import terminé avec succès'
            importError.value = null
            importErrorDetails.value = null

            // Attendre 2 secondes avant de fermer et rafraîchir
            setTimeout(async () => {
                closeImportModal()
                await refresh()
            }, 2000)
        } catch (error: any) {
            importSuccess.value = false
            importSuccessMessage.value = null
            // Extraire les détails de l'erreur depuis la réponse API
            const errorResponse = error.response?.data || error

            // Construire l'objet d'erreur selon la documentation API
            importErrorDetails.value = {
                success: false,
                message: errorResponse.message || 'Erreur lors de l\'import',
                inventory_type: errorResponse.inventory_type || null,
                existing_stocks_count: errorResponse.existing_stocks_count ?? null,
                action_required: errorResponse.action_required || null,
                summary: errorResponse.summary || null,
                errors: errorResponse.errors || []
            }

            importError.value = importErrorDetails.value.message
            logger.error('Erreur import Excel', error)
        } finally {
            isImporting.value = false
        }
    }

    // Fonction de fermeture de modale
    const closeImportModal = () => {
        showImportModal.value = false
        isImporting.value = false
        importError.value = null
        importErrorDetails.value = null
        importSuccess.value = false
        importSuccessMessage.value = null
        currentImportInventory.value = null
    }

    // Fonction d'import avec modale
    const importStockImageWithModal = async (id: number, formData: FormData, callbacks: any) => {
        try {
            const result = await inventoryStore.importStockImage(id, formData)
            callbacks?.onSuccess?.(result)
            logger.success('Import avec modale réussi', { id })
        } catch (error) {
            callbacks?.onError?.(error)
            logger.error('Erreur import avec modale', { id, error })
        }
    }

    // Exemple d'utilisation du service centralisé de transformation des filtres
    const handleInventoryFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
        // Cette fonction n'est plus utilisée car on utilise useInventoryDataTable
        // Gardée pour compatibilité si nécessaire
    };

    // Service d'alerte mock
    const alertService = {
        success: (params: any) => logger.success('Succès', params),
        error: (params: any) => logger.error('Erreur', params),
        confirm: (params: any) => Promise.resolve({ isConfirmed: true })
    }

    // Fonction pour compter les inventaires par statut
    const getStatusCount = (status: string) => {
        return inventories.value.filter((inv: InventoryTable) => inv.status === status).length
    }

    return {
        // Données réactives de useBackendDataTable
        inventories,
        loading,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        pagination,

        // Configuration de la table
        columns,
        actions,

        // Méthodes de navigation
        redirectToAdd,

        // Méthodes de useBackendDataTable
        setPage,
        setPageSize,
        setSearch,
        setSortModel,
        setFilters,
        resetFilters,
        refresh,

        // Nouvelles fonctionnalités
        lazyLoading,
        optimizations,
        // Méthodes d'import
        importStockImageWithModal,

        // Services
        alertService,

        // États pour la modale d'import Excel
        showImportModal,
        isImporting,
        importError,
        importErrorDetails,
        importSuccess,
        importSuccessMessage,
        currentImportInventory,
        processImportExcel,
        closeImportModal,

        // Fonctions utilitaires
        getStatusCount,
        handleInventoryFilterChanged
    }
}
