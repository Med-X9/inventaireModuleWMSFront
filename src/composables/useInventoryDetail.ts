/**
 * Composable useInventoryDetail - Gestion des détails d'inventaire
 *
 * Ce composable gère :
 * - Le chargement et l'affichage des détails d'un inventaire
 * - Les actions sur l'inventaire (lancer, modifier, annuler, terminer, clôturer)
 * - La gestion des ressources associées à l'inventaire
 * - L'export PDF de l'inventaire et des jobs
 *
 * @module useInventoryDetail
 */

// ===== IMPORTS VUE =====
import { computed, ref, onMounted } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRouter } from 'vue-router'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'
import { useResourceStore } from '@/stores/resource'
import { useAppStore } from '@/stores'

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { validationAlertService } from '@/services/validationAlertService'
import { InventoryService } from '@/services/InventoryService'
import { logger } from '@/services/loggerService'

// ===== IMPORTS UTILS =====
import { generatePDF } from '@/utils/pdfGenerator'

// ===== INTERFACES =====

/**
 * Réponse d'erreur du backend
 */
interface BackendErrorResponse {
    message: string
    errors?: string[]
    detail?: string
    status?: number
}

// ===== COMPOSABLE PRINCIPAL =====

/**
 * Composable pour la gestion des détails d'inventaire
 *
 * @param inventoryReference - Référence de l'inventaire
 * @returns Objet contenant toutes les propriétés et méthodes nécessaires
 */
export function useInventoryDetail(inventoryReference: string) {
    const router = useRouter()
    const appStore = useAppStore()
    const inventoryStore = useInventoryStore()
    const resourceStore = useResourceStore()

    // ===== ÉTAT RÉACTIF =====

    /** ID de l'inventaire récupéré depuis la référence */
    const inventoryId = ref<number | null>(null)

    /** État de chargement de l'inventaire */
    const inventoryLoading = ref(false)

    /** Erreur lors du chargement de l'inventaire */
    const inventoryError = ref<string | null>(null)

    // ===== COMPUTED PROPERTIES =====

    /** Inventaire actuel depuis le store */
    const inventory = computed(() => inventoryStore.getCurrentInventoryDetail)

    /** État de chargement depuis le store */
    const loading = computed(() => inventoryStore.isLoading)

    /** Erreur depuis le store */
    const error = computed(() => inventoryStore.getError)

    /** Ressources associées à l'inventaire */
    const resources = computed(() => inventory.value?.ressources || [])

    /** État de chargement des ressources */
    const resourcesLoading = computed(() => resourceStore.isLoading)

    /** Erreur des ressources */
    const resourcesError = computed(() => resourceStore.getError)

    /** Magasins associés à l'inventaire */
    const magasins = computed(() => inventory.value?.magasins || [])

    // ===== MÉTHODES D'INITIALISATION =====

    /**
     * Récupère l'ID de l'inventaire par sa référence
     *
     * @param reference - Référence de l'inventaire
     */
    const fetchInventoryIdByReference = async (reference: string) => {
        inventoryLoading.value = true
        inventoryError.value = null

        try {
            logger.debug('Résolution de l\'ID de l\'inventaire par référence', { reference })

            // Utiliser fetchInventoryByReference qui récupère directement l'inventaire par référence
            // Cette méthode fait un appel API direct, plus fiable que de chercher dans la liste paginée
            const inventory = await inventoryStore.fetchInventoryByReference(reference)

            if (inventory && inventory.id) {
                inventoryId.value = inventory.id
                logger.debug('ID de l\'inventaire résolu avec succès', {
                    reference,
                    inventoryId: inventory.id
                })
            } else {
                inventoryError.value = `Aucun inventaire trouvé avec la référence: ${reference}`
                logger.warn('Inventaire trouvé mais sans ID', { reference, inventory })
            }
        } catch (error) {
            inventoryError.value = 'Erreur lors de la récupération de l\'inventaire'
            logger.error('Erreur lors de la récupération de l\'ID de l\'inventaire', { reference, error })
        } finally {
            inventoryLoading.value = false
        }
    }

    /**
     * Charge les détails de l'inventaire
     */
    const loadDetailData = async () => {
        if (!inventoryId.value) {
            logger.warn('ID d\'inventaire non disponible')
            return
        }

        try {
            await inventoryStore.fetchInventoryDetail(inventoryId.value)
        } catch (error) {
            logger.error('Erreur lors du chargement des détails', error)
            await alertService.error({
                title: 'Erreur',
                text: 'Impossible de charger les détails de l\'inventaire'
            })
        }
    }

    // ===== MÉTHODES UTILITAIRES =====

    /**
     * Formate une date au format français
     *
     * @param dateString - Date à formater
     * @returns Date formatée ou "Non définie"
     */
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Non définie'
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    /**
     * Retourne la classe CSS pour le badge de statut
     *
     * @param status - Statut de l'inventaire
     * @returns Classe CSS pour le badge
     */
    const getStatusClass = (status: string | undefined): string => {
        if (!status) return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'

        switch (status) {
            case 'EN PREPARATION':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            case 'EN REALISATION':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            case 'TERMINE':
            case 'TERMINEE':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'CLOTURE':
            case 'CLOTUREE':
                return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
        }
    }

    // ===== ACTIONS SUR L'INVENTAIRE =====

    /**
     * Lance l'inventaire
     */
    const launchInventory = async () => {
        if (!inventory.value || !inventoryId.value) return false

        try {
            const result = await alertService.confirm({
                title: 'Lancer l\'inventaire',
                text: `Voulez-vous vraiment lancer l'inventaire "${inventory.value.label}" ?`
            })

            if (result.isConfirmed) {
                await inventoryStore.launchInventory(inventoryId.value)
                await loadDetailData()

                await alertService.success({
                    text: 'L\'inventaire a été lancé avec succès'
                })
                return true
            }

            return false
        } catch (error) {
            logger.error('Erreur lors du lancement', error)

            if (error && typeof error === 'object') {
                const backendError = (error as any).response?.data
                if (backendError) {
                    validationAlertService.showLaunchErrors(backendError)
                    return false
                }
            }

            await alertService.error({
                title: 'Erreur de lancement',
                text: 'Une erreur est survenue lors du lancement de l\'inventaire'
            })
            return false
        }
    }

    /**
     * Redirige vers la page d'édition de l'inventaire
     */
    const editInventory = () => {
        router.push({ name: 'inventory-edit', params: { reference: inventoryReference } })
    }

    /**
     * Annule l'inventaire
     */
    const cancelInventory = async () => {
        if (!inventoryId.value) return false

        try {
            const result = await alertService.confirm({
                title: 'Annuler l\'inventaire',
                text: 'Êtes-vous sûr de vouloir annuler le lancement de l\'inventaire ?'
            })

            if (result.isConfirmed) {
                await inventoryStore.cancelInventory(inventoryId.value)
                await loadDetailData()

                await alertService.success({
                    text: 'L\'inventaire a été annulé'
                })
                return true
            }

            return false
        } catch (error) {
            logger.error('Erreur lors de l\'annulation', error)
            await alertService.error({
                text: 'Une erreur est survenue lors de l\'annulation'
            })
            return false
        }
    }

    /**
     * Termine l'inventaire
     */
    const terminateInventory = async () => {
        if (!inventory.value || !inventoryId.value) return false

        try {
            const result = await alertService.confirm({
                title: 'Terminer l\'inventaire',
                text: `Voulez-vous vraiment terminer l'inventaire "${inventory.value.label}" ?`
            })

            if (result.isConfirmed) {
                await inventoryStore.terminateInventory(inventoryId.value)
                await loadDetailData()

                await alertService.success({
                    text: 'L\'inventaire a été terminé avec succès'
                })
                return true
            }

            return false
        } catch (error) {
            logger.error('Erreur lors de la terminaison', error)
            await alertService.error({
                text: 'Une erreur est survenue lors de la fin de l\'inventaire'
            })
            return false
        }
    }

    /**
     * Clôture l'inventaire
     */
    const closeInventory = async () => {
        if (!inventory.value || !inventoryId.value) return false

        try {
            const result = await alertService.confirm({
                title: 'Clôturer l\'inventaire',
                text: `Voulez-vous vraiment clôturer définitivement l'inventaire "${inventory.value.label}" ?`
            })

            if (result.isConfirmed) {
                await inventoryStore.closeInventory(inventoryId.value)
                await loadDetailData()

                await alertService.success({
                    text: 'L\'inventaire a été clôturé avec succès'
                })
                return true
            }

            return false
        } catch (error) {
            logger.error('Erreur lors de la clôture', error)
            await alertService.error({
                text: 'Une erreur est survenue lors de la clôture de l\'inventaire'
            })
            return false
        }
    }

    // ===== GESTION DES RESSOURCES =====

    /**
     * Assigne des ressources à l'inventaire
     *
     * @param resources - Tableau de ressources à assigner
     */
    const assignResourceToInventory = async (resources: Array<{ resource_id: number; quantity: number }>) => {
        if (!inventoryId.value) {
            logger.error('ID d\'inventaire non disponible')
            return null
        }

        try {
            const result = await resourceStore.assignResourceToInventory(inventoryId.value, resources)
            if (result) {
                await loadDetailData()
            }
            return result
        } catch (error) {
            logger.error('Erreur lors de l\'assignation de la ressource', error)
            return null
        }
    }

    /**
     * Met à jour la quantité d'une ressource
     *
     * @param resourceId - ID de la ressource
     * @param quantity - Nouvelle quantité
     */
    const updateResourceQuantity = async (resourceId: number, quantity: number) => {
        if (!inventoryId.value) {
            logger.error('ID d\'inventaire non disponible')
            return null
        }

        try {
            const result = await resourceStore.updateAssignedResourceQuantity(inventoryId.value, resourceId, quantity)
            if (result) {
                await loadDetailData()
            }
            return result
        } catch (error) {
            logger.error('Erreur lors de la mise à jour de la quantité', error)
            return null
        }
    }

    /**
     * Retire une ressource de l'inventaire
     *
     * @param resourceId - ID de la ressource à retirer
     */
    const removeResourceFromInventory = async (resourceId: number) => {
        if (!inventoryId.value) {
            logger.error('ID d\'inventaire non disponible')
            return false
        }

        try {
            const result = await resourceStore.removeResourceFromInventory(inventoryId.value, resourceId)
            if (result) {
                await loadDetailData()
            }
            return result
        } catch (error) {
            logger.error('Erreur lors du retrait de la ressource', error)
            return false
        }
    }

    /**
     * Récupère les ressources disponibles
     */
    const getAvailableResources = async () => {
        try {
            return await resourceStore.fetchAvailableResources()
        } catch (error) {
            logger.error('Erreur lors de la récupération des ressources disponibles', error)
            return []
        }
    }

    // ===== EXPORT PDF =====

    /**
     * Exporte l'inventaire en PDF
     */
    const exportToPDF = async () => {
        if (!inventory.value) return

        const data: any = {
            inventory: {
                label: inventory.value.label,
                reference: inventory.value.reference,
                inventory_date: inventory.value.date,
                statut: inventory.value.status,
                contages: inventory.value.comptages,
                teams: inventory.value.equipe
            },
            magasins: inventory.value.magasins || [],
            resources: inventory.value.ressources || []
        }

        await generatePDF(data, `Inventaire_${inventory.value.reference}`)
    }

    /**
     * Exporte les jobs d'un inventaire en PDF depuis le backend
     */
    const exportJobsToPDF = async () => {
        if (!inventoryId.value) {
            await alertService.error({
                title: 'Erreur',
                text: 'ID d\'inventaire non disponible'
            })
            return
        }

        try {
            const blob = await InventoryService.exportJobsToPDF(inventoryId.value)

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Jobs_Inventaire_${inventory.value?.reference || inventoryId.value}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            await alertService.success({
                text: 'Export PDF des jobs réussi'
            })
        } catch (error: any) {
            logger.error('Erreur lors de l\'export PDF des jobs', error)
            await alertService.error({
                title: 'Erreur',
                text: error?.response?.data?.message || 'Impossible d\'exporter les jobs en PDF'
            })
        }
    }

    // ===== LIFECYCLE =====

    /**
     * Initialisation au montage du composant
     */
    onMounted(async () => {
        try {
            await fetchInventoryIdByReference(inventoryReference)

            if (inventoryId.value) {
                await loadDetailData()
            } else {
                logger.error('Impossible de récupérer l\'ID de l\'inventaire')
                await alertService.error({
                    title: 'Erreur',
                    text: inventoryError.value || 'Impossible de charger l\'inventaire'
                })
            }
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation', error)
            await alertService.error({
                title: 'Erreur',
                text: 'Impossible d\'initialiser les données de l\'inventaire'
            })
        }
    })

    // ===== RETURN =====

    return {
        // État
        inventory,
        loading,
        error,
        inventoryId,
        inventoryLoading,
        inventoryError,

        // Données
        magasins,
        resources,
        resourcesLoading,
        resourcesError,

        // Actions sur l'inventaire
        launchInventory,
        editInventory,
        cancelInventory,
        terminateInventory,
        closeInventory,

        // Utilitaires
        formatDate,
        getStatusClass,
        loadDetailData,

        // Gestion des ressources
        assignResourceToInventory,
        updateResourceQuantity,
        removeResourceFromInventory,
        getAvailableResources,

        // Export
        exportToPDF,
        exportJobsToPDF
    }
}
