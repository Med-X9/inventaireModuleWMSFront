/**
 * Composable pour la gestion complète des inventaires
 *
 * Fournit :
 * - Configuration des colonnes DataTable
 * - Actions disponibles sur les inventaires
 * - Gestion des modales d'import et de planification
 * - Handlers pour les opérations DataTable
 *
 * @module useInventoryManagement
 */

// ===== IMPORTS =====

import { ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { alertService } from '@/services/alertService'
import { dataTableService } from '@/services/dataTableService'
import { useInventoryStore } from '@/stores/inventory'
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { InventoryTable } from '@/models/Inventory'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'

// ===== IMPORTS ICÔNES =====
import IconEye from '@/components/icon/icon-eye.vue'
import IconUpload from '@/components/icon/icon-upload.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconEdit from '@/components/icon/icon-edit.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import IconPlus from '@/components/icon/icon-plus.vue'

// ===== CONSTANTES =====

/**
 * Options de statut disponibles pour les inventaires
 */
const INVENTORY_STATUS_OPTIONS = [
    { value: 'EN PREPARATION', label: 'EN PREPARATION' },
    { value: 'EN REALISATION', label: 'EN REALISATION' },
    { value: 'TERMINE', label: 'TERMINE' },
    { value: 'CLOTURE', label: 'CLOTURE' }
]

/**
 * Styles des badges pour chaque statut
 */
const STATUS_BADGE_STYLES = [
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
]

// ===== COMPOSABLE =====

/**
 * Composable pour la gestion complète des inventaires
 *
 * @returns Configuration et handlers pour la gestion des inventaires
 */
export function useInventoryManagement() {
    const router = useRouter()
    const inventoryStore = useInventoryStore()
    const { inventories } = storeToRefs(inventoryStore)

    // ===== ÉTATS RÉACTIFS =====

    // États des modales
    const showImportModal = ref(false)
    const showPlanningModal = ref(false)
    const currentImportInventory = ref<InventoryTable | null>(null)
    const currentPlanningInventory = ref<InventoryTable | null>(null)

    // États d'import
    const isImporting = ref(false)
    const importError = ref<string | null>(null)
    const importErrorDetails = ref<any>(null)
    const importSuccess = ref(false)
    const importSuccessMessage = ref<string | null>(null)
    const selectedFile = ref<File | null>(null)
    const uploadProgress = ref(0)
    const isDragging = ref(false)

    // États de planification
    const planningFile = ref<File | null>(null)
    const isDraggingPlanning = ref(false)
    const isUploadingPlanning = ref(false)
    const planningUploadProgress = ref(0)
    const planningSuccess = ref(false)
    const planningSuccessMessage = ref<string | null>(null)
    const planningError = ref<string | null>(null)
    const planningErrorDetails = ref<any>(null)
    const planningInfoMessage = ref<string | null>(null)

    // ===== CONFIGURATION DES COLONNES =====

    /**
     * Configuration des colonnes du DataTable
     * Chaque colonne est configurée avec ses propriétés d'affichage, tri, filtrage
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
            editable: true,
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
            editable: true,
            visible: true,
            draggable: true,
            autoSize: true,
            align: 'center',
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
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-status',
            description: 'Statut de l\'inventaire',
            filterConfig: {
                dataType: 'select' as ColumnDataType,
                operator: 'in' as const,
                options: INVENTORY_STATUS_OPTIONS
            },
            badgeStyles: STATUS_BADGE_STYLES,
            badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
        },
        // Colonnes de dates de statut (masquées par défaut)
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
            align: 'center',
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
            align: 'center',
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
            align: 'center',
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
            align: 'center',
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
        }
    ]

    // Validation des colonnes
    columns.forEach(column => {
        const validation = dataTableService.validateColumnConfig(column)
        if (!validation.isValid) {
            console.warn(`Configuration de colonne invalide pour ${column.field}:`, validation.errors)
        }
    })

    // ===== ACTIONS SUR LES INVENTAIRES =====

    /**
     * Actions disponibles dans le DataTable
     * Chaque action définit son comportement et ses conditions d'affichage
     */
    const actions: ActionConfig[] = [
        {
            label: 'Détail',
            icon: markRaw(IconEye),
            color: 'primary',
            onClick: (row: any) => handleDetail(row as InventoryTable),
        },
        {
            label: 'Planifier',
            icon: markRaw(IconCalendar),
            color: 'primary',
            onClick: (row: any) => handlePlan(row as InventoryTable),
            show: (row: any) => ['EN PREPARATION', 'EN REALISATION'].includes((row as InventoryTable).status),
        },
        {
            label: 'Ajouter planification',
            icon: markRaw(IconPlus),
            color: 'primary',
            onClick: (row: any) => handleAddPlanning(row as InventoryTable),
            show: (row: any) => (row as InventoryTable).status === 'EN PREPARATION',
        },
        {
            label: 'Importer image de stock',
            icon: markRaw(IconUpload),
            color: 'primary',
            onClick: (row: any) => handleImportExcel(row as InventoryTable),
            show: (row: any) => (row as InventoryTable).status === 'EN PREPARATION',
        },
        {
            label: 'Modifier',
            icon: markRaw(IconEdit),
            color: 'primary',
            onClick: (row: any) => handleEdit(row as InventoryTable),
            show: (row: any) => (row as InventoryTable).status === 'EN PREPARATION',
        },
        {
            label: 'Résultats',
            icon: markRaw(IconCheck),
            color: 'primary',
            onClick: (row: any) => handleResults(row as InventoryTable),
            show: (row: any) => ['EN REALISATION', 'TERMINE', 'CLOTURE'].includes((row as InventoryTable).status),
        },
        {
            label: 'Supprimer',
            icon: markRaw(IconTrash),
            color: 'danger',
            onClick: async (row: any) => await handleDelete(row as InventoryTable),
            show: (row: any) => (row as InventoryTable).status === 'EN PREPARATION',
        },
    ]

    // ===== HANDLERS DES ACTIONS =====

    /**
     * Navigation vers la page de détail d'un inventaire
     */
    const handleDetail = (inventory: InventoryTable) => {
        router.push({ name: 'inventory-detail', params: { reference: inventory.reference } })
    }

    /**
     * Navigation vers la page de planning d'un inventaire
     */
    const handlePlan = (inventory: InventoryTable) => {
        router.push({ name: 'planning-management', params: { reference: inventory.reference } })
    }

    /**
     * Navigation vers la page d'édition d'un inventaire
     */
    const handleEdit = (inventory: InventoryTable) => {
        router.push({ name: 'inventory-edit', params: { reference: inventory.reference } })
    }

    /**
     * Navigation vers la page des résultats d'un inventaire
     */
    const handleResults = (inventory: InventoryTable) => {
        router.push({ name: 'inventory-results', params: { reference: inventory.reference } })
    }

    /**
     * Ouverture de la modal d'import d'image de stock
     */
    const handleImportExcel = (inventory: InventoryTable) => {
        currentImportInventory.value = inventory
        showImportModal.value = true
    }

    /**
     * Ouverture de la modal d'ajout de planification
     */
    const handleAddPlanning = (inventory: InventoryTable) => {
        console.log('[handleAddPlanning] Définition de currentPlanningInventory avec:', inventory)
        console.log('[handleAddPlanning] ID de l\'inventaire:', inventory?.id)
        currentPlanningInventory.value = inventory
        showPlanningModal.value = true
        console.log('[handleAddPlanning] currentPlanningInventory défini:', currentPlanningInventory.value)
    }

    /**
     * Suppression d'un inventaire avec confirmation
     */
    const handleDelete = async (inventory: InventoryTable): Promise<void> => {
        const confirmed = await alertService.confirm({
            title: 'Confirmer la suppression',
            text: `Supprimer l'inventaire "${inventory.label}" ?`
        })
        if (confirmed.isConfirmed) {
            // TODO: Implement delete logic
            alertService.success({ text: 'Inventaire supprimé' })
        }
    }

    // ===== GESTION DES MODALES =====

    /**
     * Fermeture de la modal d'import avec nettoyage complet
     */
    const closeImportModal = () => {
        showImportModal.value = false
        isImporting.value = false
        importError.value = null
        importErrorDetails.value = null
        importSuccess.value = false
        importSuccessMessage.value = null
        currentImportInventory.value = null
        selectedFile.value = null
        uploadProgress.value = 0
        isDragging.value = false
    }

    /**
     * Fermeture de la modal de planification
     */
    const closePlanningModal = () => {
        console.log('[closePlanningModal] Fermeture de la modal - remise à null de currentPlanningInventory')
        console.log('[closePlanningModal] currentPlanningInventory avant:', currentPlanningInventory.value)
        showPlanningModal.value = false
        planningFile.value = null
        isDraggingPlanning.value = false
        currentPlanningInventory.value = null
        console.log('[closePlanningModal] currentPlanningInventory après:', currentPlanningInventory.value)
    }

    // ===== IMPORT D'IMAGE DE STOCK =====

    /**
     * Import d'image de stock sans barre de progression
     */
    const processImportExcel = async (file: File) => {
        await processImport(file, false)
    }

    /**
     * Import d'image de stock avec barre de progression simulée
     */
    const processImportExcelWithProgress = async (file: File) => {
        await processImport(file, true)
    }

    /**
     * Méthode commune pour l'import d'image de stock
     */
    const processImport = async (file: File, withProgress: boolean = false) => {
        if (!currentImportInventory.value) return

        isImporting.value = true
        importError.value = null
        importErrorDetails.value = null

        if (withProgress) {
            uploadProgress.value = 0
        }

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Simuler la progression si demandé
            let progressInterval: NodeJS.Timeout | null = null
            if (withProgress) {
                progressInterval = setInterval(() => {
                    uploadProgress.value += Math.random() * 15
                    if (uploadProgress.value >= 90) {
                        clearInterval(progressInterval!)
                        progressInterval = null
                    }
                }, 200)
            }

            const response = await inventoryStore.importStockImage(currentImportInventory.value.id, formData)

            if (progressInterval) {
                clearInterval(progressInterval)
            }
            if (withProgress) {
                uploadProgress.value = 100
            }

            importSuccess.value = true
            importSuccessMessage.value = response?.message || 'Import terminé avec succès'

            setTimeout(() => {
                closeImportModal()
                window.location.reload() // Recharger les données
            }, 2000)

        } catch (error: any) {
            if (withProgress) {
                uploadProgress.value = 0
            }
            importErrorDetails.value = error.response?.data || error
            importError.value = importErrorDetails.value.message || 'Erreur lors de l\'import'
        } finally {
            isImporting.value = false
        }
    }

    // ===== UPLOAD DE PLANIFICATION =====

    /**
     * Upload et traitement d'un fichier de planification
     */
    const processPlanningUpload = async (file: File) => {
        console.log('[processPlanningUpload] Début avec fichier:', file?.name)
        console.log('[processPlanningUpload] currentPlanningInventory:', currentPlanningInventory.value)
        console.log('[processPlanningUpload] currentPlanningInventory.value existe:', !!currentPlanningInventory.value)
        console.log('[processPlanningUpload] currentPlanningInventory.value?.id:', currentPlanningInventory.value?.id)
        console.log('[processPlanningUpload] typeof currentPlanningInventory.value?.id:', typeof currentPlanningInventory.value?.id)

        // Vérifier si on a un ID ou une référence
        const inventoryId = currentPlanningInventory.value?.id || currentPlanningInventory.value?.reference

        if (!inventoryId) {
            console.error('[processPlanningUpload] Ni id ni reference trouvés - RETOUR ANTICIPE')
            console.error('[processPlanningUpload] Valeur complète:', JSON.stringify(currentPlanningInventory.value, null, 2))
            return
        }

        console.log('[processPlanningUpload] Démarrage de l\'upload pour inventory ID/Reference:', inventoryId)

        isUploadingPlanning.value = true
        planningError.value = null
        planningErrorDetails.value = null
        planningSuccess.value = false
        planningInfoMessage.value = 'Upload du fichier en cours...'
        planningUploadProgress.value = 0

        try {
            console.log('[processPlanningUpload] Création du FormData avec fichier:', file.name)
            const formData = new FormData()
            formData.append('file', file)

            console.log('[processPlanningUpload] Appel de inventoryStore.importLocationJobsSync')
            // Simuler la progression
            const progressInterval = setInterval(() => {
                planningUploadProgress.value += Math.random() * 20
                if (planningUploadProgress.value >= 80) {
                    clearInterval(progressInterval)
                }
            }, 300)

            planningInfoMessage.value = 'Traitement des données de planification...'
            await inventoryStore.importLocationJobsSync(inventoryId, formData)
            console.log('[processPlanningUpload] inventoryStore.importLocationJobsSync terminé avec succès')

            clearInterval(progressInterval)
            planningUploadProgress.value = 100

            planningSuccess.value = true
            planningSuccessMessage.value = 'Planification ajoutée avec succès'

            setTimeout(() => {
                closePlanningModal()
                // Rediriger vers la page de planning
                if (currentPlanningInventory.value) {
                    router.push({
                        name: 'planning-management',
                        params: { reference: currentPlanningInventory.value.reference }
                    })
                }
            }, 2000)

        } catch (error: any) {
            console.error('[processPlanningUpload] Erreur capturée:', error)
            console.error('[processPlanningUpload] Erreur response:', error?.response?.data)
            planningUploadProgress.value = 0
            planningErrorDetails.value = error.response?.data || error
            planningError.value = error?.message || 'Erreur lors de l\'upload'
        } finally {
            console.log('[processPlanningUpload] Finally - nettoyage terminé')
            isUploadingPlanning.value = false
            planningInfoMessage.value = null
        }
    }

    // ===== GESTION DES FICHIERS =====

    /**
     * Validation des fichiers Excel
     */
    const validateExcelFile = (file: File): boolean => {
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
        if (!isExcel) {
            alertService.error({ text: 'Seuls les fichiers Excel (.xlsx, .xls) sont acceptés' })
            return false
        }
        return true
    }

    // ===== HANDLERS D'IMPORT =====

    const handleFileChange = (event: Event) => {
        const target = event.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
            selectedFile.value = target.files[0]
        }
    }

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = true
    }

    const handleDragLeave = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = false
    }

    const handleDrop = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = false

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0]
            if (validateExcelFile(file)) {
                selectedFile.value = file
            }
        }
    }

    // ===== HANDLERS DE PLANIFICATION =====

    const handlePlanningFileChange = (event: Event) => {
        const target = event.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
            planningFile.value = target.files[0]
        }
    }

    const handlePlanningDragOver = (event: DragEvent) => {
        event.preventDefault()
        isDraggingPlanning.value = true
    }

    const handlePlanningDragLeave = (event: DragEvent) => {
        event.preventDefault()
        isDraggingPlanning.value = false
    }

    const handlePlanningDrop = (event: DragEvent) => {
        event.preventDefault()
        isDraggingPlanning.value = false

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0]
            if (validateExcelFile(file)) {
                planningFile.value = file
            }
        }
    }



    // ===== HANDLERS DATATABLE =====

    /**
     * Handler commun pour les opérations DataTable (pagination, tri, filtrage, recherche)
     */
    const handleInventoryOperation = async (queryModel: QueryModel) => {
        console.log('[useInventoryManagement] handleInventoryOperation called with:', queryModel)
        try {
            console.log('[useInventoryManagement] Calling inventoryStore.fetchInventories...')
            await inventoryStore.fetchInventories(queryModel)
            console.log('[useInventoryManagement] inventoryStore.fetchInventories completed')
        } catch (error) {
            console.error('[useInventoryManagement] Error in inventoryStore.fetchInventories:', error)
            alertService.error({ text: 'Erreur lors du chargement des inventaires' })
        }
    }

    // Handlers spécialisés
    const handlePaginationChanged = (queryModel: QueryModel) => {
        console.log('[useInventoryManagement] handlePaginationChanged called with:', queryModel)
        return handleInventoryOperation(queryModel)
    }
    const handleSortChanged = (queryModel: QueryModel) => {
        console.log('[useInventoryManagement] handleSortChanged called with:', queryModel)
        return handleInventoryOperation(queryModel)
    }
    const handleFilterChanged = (queryModel: QueryModel) => {
        console.log('[useInventoryManagement] handleFilterChanged called with:', queryModel)
        return handleInventoryOperation(queryModel)
    }
    const handleGlobalSearchChanged = (queryModel: QueryModel) => {
        console.log('[useInventoryManagement] handleGlobalSearchChanged called with:', queryModel)
        return handleInventoryOperation(queryModel)
    }

    const handleCellValueChanged = () => {
        // TODO: Implémenter l'édition en ligne
    }

    // ===== EXPORT =====

    /**
     * Export des inventaires en CSV
     */
    const handleExportCsv = async () => {
        try {
            await inventoryStore.exportInventories({ export: 'csv' })
            alertService.success({ text: 'Export CSV réussi' })
        } catch (error: any) {
            alertService.error({ text: error?.message || 'Erreur export CSV' })
        }
    }

    /**
     * Export des inventaires en Excel
     */
    const handleExportExcel = async () => {
        try {
            await inventoryStore.exportInventories({ export: 'excel' })
            alertService.success({ text: 'Export Excel réussi' })
        } catch (error: any) {
            alertService.error({ text: error?.message || 'Erreur export Excel' })
        }
    }

    // ===== NAVIGATION =====

    /**
     * Redirection vers la page de création d'inventaire
     */
    const redirectToAdd = () => {
        router.push({ name: 'inventory-create' })
    }

    // ===== CHARGEMENT INITIAL =====

    /**
     * Chargement initial des inventaires
     */
    const loadInventories = async () => {
        try {
            await inventoryStore.fetchInventories()
        } catch (error) {
            alertService.error({ text: 'Erreur lors du chargement des inventaires' })
        }
    }

    // ===== RETURN =====

    return {
        // ===== DONNÉES =====
        inventories,
        loadInventories,

        // ===== CONFIGURATION DATATABLE =====
        columns,
        actions,

        // ===== NAVIGATION =====
        redirectToAdd,

        // ===== HANDLERS DATATABLE =====
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,
        handleCellValueChanged,
        handleExportCsv,
        handleExportExcel,

        // ===== MODALES =====
        showImportModal,
        showPlanningModal,
        currentImportInventory,
        currentPlanningInventory,
        closeImportModal,
        closePlanningModal,

        // ===== IMPORT D'IMAGE DE STOCK =====
        isImporting,
        importError,
        importErrorDetails,
        importSuccess,
        importSuccessMessage,
        selectedFile,
        uploadProgress,
        isDragging,
        processImportExcel,
        processImportExcelWithProgress,

        // ===== PLANIFICATION =====
        planningFile,
        isDraggingPlanning,
        isUploadingPlanning,
        planningUploadProgress,
        planningSuccess,
        planningSuccessMessage,
        planningError,
        planningErrorDetails,
        planningInfoMessage,
        processPlanningUpload,

        // ===== HANDLERS DE FICHIERS =====
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handlePlanningFileChange,
        handlePlanningDragOver,
        handlePlanningDragLeave,
        handlePlanningDrop,

        // ===== SERVICES =====
        alertService
    }
}
