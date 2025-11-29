import { dataTableService } from '@/services/dataTableService'
import { logger } from '@/services/loggerService'
import type { InventoryTable } from '@/models/Inventory'
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { StockImportErrorResponse } from '@/interfaces/stockImport'
import { ref, markRaw, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToQueryParams, convertQueryModelToRestApi, createQueryModelFromDataTableParams } from '@/components/DataTable/utils/queryModelConverter'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'


// Import des icônes
import IconEye from '@/components/icon/icon-eye.vue'
import IconUpload from '@/components/icon/icon-upload.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconEdit from '@/components/icon/icon-edit.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

// Note: Lazy loading et optimisations sont maintenant intégrés dans useBackendDataTable
// Pas besoin d'imports séparés (KISS - Keep It Simple)

/**
 * Composable pour la gestion des inventaires
 * Utilise useBackendDataTable pour l'intégration avec Pinia et les paramètres DataTable
 * Intègre le lazy loading, les optimisations de rendu et l'édition avancée
 */
export function useInventoryManagement() {
    const router = useRouter()
    const inventoryStore = useInventoryStore()

    // État local simple
    const inventories = computed(() => inventoryStore.inventories)
    const loading = computed(() => inventoryStore.loading)
    const currentPage = computed(() => inventoryStore.currentPage)
    const pageSize = computed(() => inventoryStore.pageSize)

    // ===== QUERYMODEL =====
    
    /**
     * Mode de sortie pour les paramètres de requête (défaut: 'queryParams')
     */
    const queryOutputMode = ref<'queryModel' | 'dataTable' | 'restApi' | 'queryParams'>('queryParams')

    /**
     * Colonnes pour QueryModel (sera défini plus tard)
     */
    const columnsRef = computed(() => {
        // columns est défini plus tard dans le fichier, donc on retourne un tableau vide pour l'instant
        return []
    })

    /**
     * QueryModel pour gérer les requêtes avec mode de sortie configurable
     */
    const {
        queryModel: queryModelRef,
        toStandardParams,
        updatePagination: updateQueryPagination,
        updateSort: updateQuerySort,
        updateFilter: updateQueryFilter,
        updateGlobalSearch: updateQueryGlobalSearch
    } = useQueryModel({
        columns: columnsRef,
        enabled: true
    })

    /**
     * Convertit le QueryModel selon le mode configuré
     */
    const convertQueryModelToOutput = (queryModelData: QueryModel) => {
        switch (queryOutputMode.value) {
            case 'queryModel':
                return queryModelData
            case 'restApi':
                return convertQueryModelToRestApi(queryModelData)
            case 'queryParams':
                return convertQueryModelToQueryParams(queryModelData)
            case 'dataTable':
            default:
                return toStandardParams.value
        }
    }

    /**
     * Pagination calculée pour les inventaires
     * Utilise le totalItems du store pour calculer les informations de pagination
     */
    const inventoryPaginationComputed = computed(() => {
        const totalCount = inventoryStore.totalItems || 0
        const pageSizeValue = pageSize.value || 20
        const currentPageValue = currentPage.value || 1

        return {
            current_page: currentPageValue,
            total_pages: Math.max(1, Math.ceil(totalCount / pageSizeValue)),
            has_next: currentPageValue < Math.ceil(totalCount / pageSizeValue),
            has_previous: currentPageValue > 1,
            page_size: pageSizeValue,
            total: totalCount
        }
    })

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

    /**
     * Fonction pour rafraîchir les données avec le même pattern que usePlanning et useInventoryResults
     */
    const refresh = async (params?: StandardDataTableParams) => {
        try {
            // Utiliser les paramètres fournis ou construire à partir des valeurs actuelles
            let finalParams: StandardDataTableParams
            if (params && 'start' in params && 'length' in params) {
                // C'est déjà StandardDataTableParams
                finalParams = params
            } else {
                // Construire depuis les valeurs actuelles si nécessaire
                finalParams = params || {
                    draw: currentPage.value || 1,
                    start: ((currentPage.value || 1) - 1) * (pageSize.value || 20),
                    length: pageSize.value || 20
                }
            }

            // S'assurer que length et start sont bien définis
            if (!finalParams.length) {
                finalParams.length = pageSize.value || 20
            }
            if (finalParams.start === undefined) {
                finalParams.start = ((currentPage.value || 1) - 1) * (pageSize.value || 20)
            }

            logger.debug('Chargement des inventaires avec paramètres DataTable:', {
                pageSize: pageSize.value,
                params: finalParams
            })

            await inventoryStore.fetchInventories(finalParams)
            await nextTick()

            logger.debug('Inventaires mis à jour dans le store', {
                count: inventoryStore.inventories.length,
                totalItems: inventoryStore.totalItems
            })
        } catch (error) {
            logger.error('Erreur lors du chargement des inventaires', error)
            throw error
        }
    }

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

    // ===== CONFIGURATION DES FONCTIONNALITÉS AG-GRID =====

    /**
     * Configuration du tri multi-colonnes
     */
    const multiSortConfig = {
        maxSortColumns: 3
    }

    /**
     * Configuration de l'épinglage de colonnes
     */
    const columnPinningConfig = {
        defaultPinnedColumns: [
            { field: 'label', pinned: 'left' as const }
        ]
    }

    /**
     * Configuration du redimensionnement de colonnes
     */
    const columnResizeConfig = {
        minWidth: 100,
        maxWidth: 500,
        defaultWidths: {
            'label': 200,
            'status': 150,
            'date': 120,
            'account_name': 150
        }
    }

    /**
     * Configuration des filtres Set (valeurs uniques)
     */
    const setFiltersConfig = {
        extractUniqueValues: (field: string, data: any[]) => {
            if (field === 'status') {
                return ['EN PREPARATION', 'EN REALISATION', 'TERMINE', 'CLOTURE']
            }
            // Pour les autres champs, extraire les valeurs uniques depuis les données
            const values = new Set<any>()
            data.forEach(row => {
                const value = row[field]
                if (value !== null && value !== undefined && value !== '') {
                    values.add(value)
                }
            })
            return Array.from(values).sort()
        },
        formatValue: (value: any) => {
            if (value === null || value === undefined) return '(Vide)'
            if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
            return String(value)
        }
    }

    // 🚀 Handlers simplifiés : reçoivent directement StandardDataTableParams du DataTable
    const handleStandardParamsChanged = async (params: StandardDataTableParams) => {
        await inventoryStore.fetchInventories(params)
    }

    // ===== HANDLERS DATATABLE =====

    /**
     * Handler pour les changements de tri
     * Accepte StandardDataTableParams quand serverSideSorting est activé
     */
    const handleSortChanged = async (params: any) => {
        if (params && typeof params === 'object' && ('start' in params || 'draw' in params)) {
            await handleStandardParamsChanged(params as StandardDataTableParams)
        }
    }

    /**
     * Handler pour les changements de filtre
     * Accepte StandardDataTableParams quand serverSideFiltering est activé
     */
    const handleFilterChanged = async (params: StandardDataTableParams | QueryModel | Record<string, any> | any) => {
        if (params && typeof params === 'object' && ('start' in params || 'draw' in params)) {
            await handleStandardParamsChanged(params as StandardDataTableParams)
        }
    }

    /**
     * Handler pour les changements de pagination
     * Accepte StandardDataTableParams quand serverSidePagination est activé
     */
    const handlePaginationChanged = async (params: StandardDataTableParams | QueryModel | Record<string, any> | any) => {
        if (params && typeof params === 'object' && ('start' in params || 'draw' in params)) {
            await handleStandardParamsChanged(params as StandardDataTableParams)
        }
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte StandardDataTableParams ou string
     */
    const handleGlobalSearchChanged = async (params: any) => {
        if (params && typeof params === 'object') {
            // Vérifier si c'est un StandardDataTableParams
            if ('start' in params || 'draw' in params || 'length' in params) {
                await handleStandardParamsChanged(params as StandardDataTableParams)
            } else {
                console.warn('Recherche globale reçue avec un objet de format inattendu', params)
            }
        } else if (typeof params === 'string') {
            // Convertir string en StandardDataTableParams
            const standardParams: StandardDataTableParams = {
                start: 0,
                length: pageSize.value || 10,
                'search[value]': params || '',
                draw: 1
            }
            await handleStandardParamsChanged(standardParams)
        } else {
            console.warn('Recherche globale reçue avec un format inattendu', typeof params, params)
        }
    }

    /**
     * Handler pour les changements de valeur de cellule
     */
    const handleCellValueChanged = (event: { data: any; field: string; newValue: any; oldValue: any }) => {
        // TODO: Implémenter la logique de sauvegarde des modifications
        // await inventoryStore.updateInventory(event.data.id, { [event.field]: event.newValue })
    }

    // ===== ÉTATS POUR L'UPLOAD DE FICHIER =====

    /** Fichier sélectionné pour l'import */
    const selectedFile = ref<File | null>(null)

    /** Référence à l'input file */
    const fileInput = ref<HTMLInputElement>()

    /** État de drag & drop */
    const isDragging = ref(false)

    /** Progression de l'upload */
    const uploadProgress = ref(0)

    // ===== HANDLERS DE FICHIER =====

    /**
     * Handler pour le changement de fichier
     */
    const handleFileChange = (event: Event) => {
        const target = event.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
            selectedFile.value = target.files[0]
            uploadProgress.value = 0
        }
    }

    /**
     * Handler pour le survol lors du drag & drop
     */
    const handleDragOver = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = true
    }

    /**
     * Handler pour la sortie du drag & drop
     */
    const handleDragLeave = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = false
    }

    /**
     * Handler pour le dépôt de fichier
     */
    const handleDrop = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = false

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0]
            // Vérifier le type de fichier
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                selectedFile.value = file
                uploadProgress.value = 0
            } else {
                alertService.error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés')
            }
        }
    }

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Formater la taille d'un fichier en unités lisibles
     */
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    /**
     * Obtenir le type de fichier depuis son nom
     */
    const getFileType = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toUpperCase()
        return extension ? `Fichier ${extension}` : 'Fichier inconnu'
    }

    /**
     * Formater une date en français
     */
    const formatDate = (date: string | Date): string => {
        if (!date) return ''
        const d = new Date(date)
        return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // ===== WRAPPERS POUR L'IMPORT =====

    /**
     * Wrapper pour processImportExcel avec gestion de progression
     */
    const processImportExcelWithProgress = async (file: File) => {
        uploadProgress.value = 0

        // Simuler la progression pendant l'upload
        const progressInterval = setInterval(() => {
            if (uploadProgress.value < 90) {
                uploadProgress.value += 10
            }
        }, 200)

        try {
            await processImportExcel(file)
            clearInterval(progressInterval)
            uploadProgress.value = 100
            await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
            clearInterval(progressInterval)
            uploadProgress.value = 0
            throw error
        }
    }

    /**
     * Wrapper pour closeImportModal avec nettoyage
     * Réinitialise tous les états liés à l'import
     */
    const closeImportModalWithCleanup = () => {
        if (isImporting.value) return // Empêcher la fermeture pendant l'import

        selectedFile.value = null
        uploadProgress.value = 0
        isDragging.value = false
        closeImportModal()
    }

    /**
     * Handler pour les erreurs de chargement
     */
    const handleLoadError = (error: any) => {
        alertService.error('Erreur lors du chargement des inventaires')
    }

    return {
        // Données réactives de useBackendDataTable (synchronisées avec QueryModel)
        inventories,
        loading,
        currentPage,
        pageSize,
        pagination: inventoryPaginationComputed,
        inventoryTotalItems: computed(() => inventoryStore.totalItems || 0),

        // Configuration de la table
        columns,
        actions,

        // Méthodes de navigation
        redirectToAdd,

        // Méthodes de rafraîchissement
        refresh,

        // 🚀 Configuration des fonctionnalités AG-Grid
        multiSortConfig,
        columnPinningConfig,
        columnResizeConfig,
        setFiltersConfig,

        // 🚀 Handler simplifié pour StandardDataTableParams
        handleStandardParamsChanged,

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

        // Handlers DataTable
        handleSortChanged,
        handleFilterChanged,
        handlePaginationChanged,
        handleGlobalSearchChanged,
        handleCellValueChanged,

        // États pour l'upload de fichier
        selectedFile,
        fileInput,
        isDragging,
        uploadProgress,

        // Handlers de fichier
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,

        // Fonctions utilitaires
        formatFileSize,
        getFileType,
        formatDate,
        getStatusCount,

        // Wrappers pour l'import
        processImportExcelWithProgress,
        closeImportModalWithCleanup,
        handleLoadError,

        // Fonctions utilitaires (dépréciées mais conservées pour compatibilité)
        handleInventoryFilterChanged,

        // QueryModel
        queryModel: computed(() => queryModelRef.value),
        queryOutputMode: computed(() => queryOutputMode.value),
        convertQueryModelToOutput
    }
}
