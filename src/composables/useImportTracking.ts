/**
 * Composable useImportTracking - Gestion du suivi d'importation du planning
 *
 * Ce composable gère :
 * - Le chargement du statut d'importation
 * - Le polling automatique pour les imports en cours
 * - Le calcul du temps estimé restant
 * - La gestion des erreurs d'importation
 * - Le formatage des données d'affichage
 *
 * @module useImportTracking
 */

// ===== IMPORTS VUE =====
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { InventoryService } from '@/services/InventoryService'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'

// ===== INTERFACES =====

/**
 * Structure d'une tâche d'importation
 */
export interface ImportTask {
    import_task_id: number
    inventory_id?: number
    status: 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    file_name?: string
    total_rows: number
    validated_rows?: number
    processed_rows: number
    imported_count?: number
    updated_count?: number
    error_count?: number
    error_message?: string | null
    errors?: Array<{
        row_number: number
        error_type: string
        error_message: string
        field_name: string
        field_value: string
        row_data?: Record<string, any>
    }>
    created_at?: string
    updated_at?: string
    chunks?: {
        total_chunks: number
        completed_chunks: number
        current_chunk: number
        overall_progress: number
        chunks_detail?: Array<{
            chunk_number: number
            status: string
            start_row: number
            end_row: number
            processed_rows: number
            imported_count?: number
            updated_count?: number
            progress: number
            started_at?: string
            completed_at?: string
        }>
    }
}

// ===== COMPOSABLE PRINCIPAL =====

/**
 * Composable pour la gestion du suivi d'importation
 *
 * @param inventoryReference - Référence de l'inventaire
 * @returns Objet contenant toutes les propriétés et méthodes nécessaires
 */
export function useImportTracking(inventoryReference: string) {
    // ===== ÉTAT RÉACTIF =====

    /** ID de l'inventaire récupéré depuis la référence */
    const inventoryId = ref<number | null>(null)

    /** État de chargement */
    const loading = ref(false)

    /** État de chargement de l'inventaire */
    const loadingInventory = ref(false)

    /** Tâche d'import actuelle */
    const importTask = ref<ImportTask | null>(null)

    /** Intervalle de polling */
    const pollInterval = ref<number | null>(null)

    /** Temps de départ du traitement */
    const startTime = ref<Date | null>(null)

    /** Erreur de chargement */
    const error = ref<string | null>(null)

    /** Code d'erreur HTTP */
    const errorCode = ref<number | null>(null)

    /** Valeurs animées pour les statistiques */
    const animatedImportedCount = ref(0)
    const animatedUpdatedCount = ref(0)
    const animatedErrorCount = ref(0)
    const animatedProcessedRows = ref(0)

    // ===== STORES =====
    const inventoryStore = useInventoryStore()

    // ===== ANIMATION UTILITY =====

    /**
     * Anime une valeur numérique de l'ancienne à la nouvelle valeur
     */
    const animateValue = (refValue: any, targetValue: number, duration = 500) => {
        const startValue = refValue.value
        const diff = targetValue - startValue
        const startTime = performance.now()

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Fonction d'easing (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3)

            refValue.value = Math.round(startValue + diff * easeOut)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }

    // ===== WATCHERS =====

    /**
     * Watch les changements de statistiques et anime les valeurs
     */
    watch(
        () => importTask.value,
        (newTask, oldTask) => {
            if (newTask) {
                // Animer imported_count
                const importedCount = newTask.imported_count || 0
                if (!oldTask || importedCount !== (oldTask.imported_count || 0)) {
                    animateValue(animatedImportedCount, importedCount)
                }
                // Animer updated_count
                const updatedCount = newTask.updated_count || 0
                if (!oldTask || updatedCount !== (oldTask.updated_count || 0)) {
                    animateValue(animatedUpdatedCount, updatedCount)
                }
                // Animer error_count
                const errorCount = newTask.error_count || 0
                if (!oldTask || errorCount !== (oldTask.error_count || 0)) {
                    animateValue(animatedErrorCount, errorCount)
                }
                // Animer processed_rows
                const processedRows = newTask.processed_rows || 0
                if (!oldTask || processedRows !== (oldTask.processed_rows || 0)) {
                    animateValue(animatedProcessedRows, processedRows)
                }
            }
        },
        { deep: true }
    )

    // ===== COMPUTED PROPERTIES =====

    /**
     * Vérifie si l'import est en cours de traitement
     */
    const isProcessing = computed(() => {
        if (!importTask.value) return false
        const status = importTask.value.status.toUpperCase()
        return ['PENDING', 'VALIDATING', 'PROCESSING'].includes(status)
    })

    /**
     * Calcule le pourcentage de progression
     * Utilise overall_progress depuis chunks si disponible, sinon calcule depuis processed_rows
     */
    const progressPercentage = computed(() => {
        if (!importTask.value) return 0
        
        // Priorité 1 : Utiliser overall_progress depuis chunks si disponible
        if (importTask.value.chunks?.overall_progress !== undefined) {
            return Math.round(importTask.value.chunks.overall_progress)
        }
        
        // Priorité 2 : Calculer depuis processed_rows / total_rows
        if (importTask.value.total_rows === 0) return 0
        return Math.round((importTask.value.processed_rows / importTask.value.total_rows) * 100)
    })

    /**
     * Retourne le label du statut traduit
     */
    const statusLabel = computed(() => {
        if (!importTask.value) return ''
        const labels: Record<string, string> = {
            PENDING: 'En attente',
            VALIDATING: 'Validation',
            PROCESSING: 'En cours',
            COMPLETED: 'Terminé',
            FAILED: 'Échoué'
        }
        return labels[importTask.value.status] || importTask.value.status
    })

    /**
     * Retourne les classes CSS pour le badge de statut
     */
    const statusBadgeClass = computed(() => {
        if (!importTask.value) return ''
        const status = importTask.value.status.toUpperCase()
        const classes: Record<string, string> = {
            PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            VALIDATING: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            PROCESSING: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
            COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }
        return classes[status] || ''
    })

    /**
     * Retourne les classes CSS pour le point de statut
     */
    const statusDotClass = computed(() => {
        if (!importTask.value) return ''
        const status = importTask.value.status.toUpperCase()
        const classes: Record<string, string> = {
            PENDING: 'bg-yellow-500',
            VALIDATING: 'bg-blue-500',
            PROCESSING: 'bg-primary',
            COMPLETED: 'bg-green-500',
            FAILED: 'bg-red-500'
        }
        return classes[status] || ''
    })

    /**
     * Calcule le temps estimé restant
     */
    const estimatedTimeRemaining = computed(() => {
        if (!importTask.value || !isProcessing.value || !startTime.value) return null

        const now = new Date()
        const elapsed = (now.getTime() - startTime.value.getTime()) / 1000 // en secondes
        const processedRows = importTask.value.processed_rows
        const totalRows = importTask.value.total_rows

        if (processedRows === 0 || elapsed === 0) return null

        const rowsPerSecond = processedRows / elapsed
        const remainingRows = totalRows - processedRows
        const remainingSeconds = Math.ceil(remainingRows / rowsPerSecond)

        if (remainingSeconds < 60) {
            return `${remainingSeconds}s`
        } else if (remainingSeconds < 3600) {
            const minutes = Math.ceil(remainingSeconds / 60)
            return `${minutes}min`
        } else {
            const hours = Math.floor(remainingSeconds / 3600)
            const minutes = Math.ceil((remainingSeconds % 3600) / 60)
            return `${hours}h ${minutes}min`
        }
    })

    // ===== MÉTHODES =====

    /**
     * Récupère l'ID de l'inventaire par sa référence
     * Utilise directement l'API getByReference (plus efficace)
     */
    const fetchInventoryId = async () => {
        try {
            loadingInventory.value = true
            const response = await InventoryService.getByReference(inventoryReference)

            // Extraire l'ID depuis la réponse
            const inventoryData = response.data?.data
            if (inventoryData && inventoryData.id) {
                inventoryId.value = inventoryData.id
            } else {
                alertService.error({
                    text: `Inventaire ${inventoryReference} introuvable`
                })
            }
        } catch (error) {
            alertService.error({
                text: 'Erreur lors de la récupération de l\'inventaire'
            })
        } finally {
            loadingInventory.value = false
        }
    }

    /**
     * Récupère le statut d'importation depuis l'API via le store
     */
    const fetchImportStatus = async () => {
        if (!inventoryId.value) {
            return
        }

        try {
            loading.value = true
            error.value = null
            errorCode.value = null

            const response = await inventoryStore.getImportLocationJobsStatusByInventory(inventoryId.value)

            if (response.success && response.data) {
                const apiData = response.data

                // Mapper les données de l'API vers le format ImportTask
                const taskData: ImportTask = {
                    import_task_id: apiData.import_task_id,
                    inventory_id: apiData.inventory_id,
                    status: apiData.status?.toUpperCase() as ImportTask['status'] || 'PENDING',
                    file_name: apiData.file_name,
                    total_rows: apiData.total_rows || 0,
                    validated_rows: apiData.validated_rows,
                    processed_rows: apiData.processed_rows || 0,
                    imported_count: apiData.imported_count,
                    updated_count: apiData.updated_count,
                    error_count: apiData.error_count,
                    error_message: apiData.error_message || null,
                    errors: apiData.errors || [],
                    created_at: apiData.created_at,
                    updated_at: apiData.updated_at,
                    chunks: apiData.chunks ? {
                        total_chunks: apiData.chunks.total_chunks,
                        completed_chunks: apiData.chunks.completed_chunks,
                        current_chunk: apiData.chunks.current_chunk,
                        overall_progress: apiData.chunks.overall_progress || 0,
                        chunks_detail: apiData.chunks.chunks_detail || []
                    } : undefined
                }

                // Calculer imported_count et updated_count depuis les chunks si non disponibles
                if (!taskData.imported_count && taskData.chunks?.chunks_detail) {
                    taskData.imported_count = taskData.chunks.chunks_detail.reduce((sum, chunk) => 
                        sum + (chunk.imported_count || 0), 0
                    )
                }
                if (!taskData.updated_count && taskData.chunks?.chunks_detail) {
                    taskData.updated_count = taskData.chunks.chunks_detail.reduce((sum, chunk) => 
                        sum + (chunk.updated_count || 0), 0
                    )
                }

                // Si c'est la première fois qu'on reçoit des données de traitement, enregistrer le temps de départ
                if (!startTime.value && taskData.processed_rows > 0 && ['VALIDATING', 'PROCESSING'].includes(taskData.status)) {
                    startTime.value = new Date()
                }

                importTask.value = taskData
            } else {
                importTask.value = null
                error.value = 'Aucune tâche d\'import trouvée'
            }
        } catch (err: any) {
            importTask.value = null
            errorCode.value = err.response?.status || null

            if (err.response?.status === 404) {
                error.value = 'Aucune tâche d\'import en cours pour cet inventaire'
            } else if (err.response?.status === 403) {
                error.value = 'Accès refusé : vous n\'avez pas les permissions nécessaires'
            } else if (err.response?.status === 500) {
                error.value = 'Erreur serveur lors de la récupération du statut'
            } else {
                error.value = err.response?.data?.message || err.message || 'Erreur lors de la récupération du statut d\'import'
            }

            // Afficher une alerte seulement pour les erreurs autres que 404
            if (err.response?.status !== 404) {
                alertService.error({
                    text: error.value || 'Erreur inconnue'
                })
            }
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualise manuellement le statut d'importation
     */
    const refreshStatus = async () => {
        await fetchImportStatus()
    }

    /**
     * Démarre le polling automatique
     */
    const startPolling = () => {
        // Polling toutes les 3 secondes si l'import est en cours
        pollInterval.value = window.setInterval(async () => {
            if (isProcessing.value) {
                await fetchImportStatus()
            } else {
                stopPolling()
            }
        }, 3000)
    }

    /**
     * Arrête le polling automatique
     */
    const stopPolling = () => {
        if (pollInterval.value) {
            clearInterval(pollInterval.value)
            pollInterval.value = null
        }
    }

    /**
     * Formate un nombre avec séparateurs de milliers
     */
    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('fr-FR').format(num)
    }

    /**
     * Formate une date en format français
     */
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr)
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    /**
     * Retourne les classes CSS pour un type d'erreur
     */
    const getErrorTypeClass = (errorType: string): string => {
        const classes: Record<string, string> = {
            VALIDATION_ERROR: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            FORMAT_ERROR: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
            MISSING_FIELD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            DUPLICATE_ERROR: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
            INTEGRITY_ERROR: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
        }
        return classes[errorType] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
    }

    /**
     * Initialise le composable
     */
    const initialize = async () => {
        // 1. D'abord récupérer l'ID de l'inventaire
        await fetchInventoryId()

        // 2. Ensuite récupérer le statut d'import
        if (inventoryId.value) {
            await fetchImportStatus()

            // 3. Démarrer le polling si nécessaire
            if (isProcessing.value) {
                startPolling()
            }
        }
    }

    // ===== LIFECYCLE =====

    /**
     * Initialisation au montage du composant
     */
    onMounted(async () => {
        await initialize()
    })

    /**
     * Nettoyage au démontage du composant
     */
    onUnmounted(() => {
        stopPolling()
    })

    // ===== RETURN =====

    return {
        // État
        inventoryReference,
        inventoryId,
        loading,
        loadingInventory,
        importTask,
        error,
        errorCode,

        // Valeurs animées
        animatedImportedCount,
        animatedUpdatedCount,
        animatedErrorCount,
        animatedProcessedRows,

        // Computed
        isProcessing,
        progressPercentage,
        statusLabel,
        statusBadgeClass,
        statusDotClass,
        estimatedTimeRemaining,

        // Méthodes
        fetchImportStatus,
        refreshStatus,
        startPolling,
        stopPolling,
        formatNumber,
        formatDate,
        getErrorTypeClass,
        initialize
    }
}
