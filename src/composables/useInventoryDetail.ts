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

// ===== IMPORTS TYPES =====
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'
import type { FieldConfig } from '@/interfaces/form'

// ===== IMPORTS ICÔNES =====
import IconDownload from '@/components/icon/icon-download.vue'
import IconFile from '@/components/icon/icon-file.vue'
import IconPlay from '@/components/icon/icon-play.vue'
import IconEdit from '@/components/icon/icon-edit.vue'
import IconCancel from '@/components/icon/icon-cancel.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconLock from '@/components/icon/icon-lock.vue'
import IconUpload from '@/components/icon/icon-upload.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconUsers from '@/components/icon/icon-users.vue'
import IconBarChart from '@/components/icon/icon-bar-chart.vue'
import IconClipboardText from '@/components/icon/icon-clipboard-text.vue'
import IconChartSquare from '@/components/icon/icon-chart-square.vue'

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

    /** État de chargement initial (résolution de l'ID + chargement des détails) */
    const initialLoading = ref(true)

    // ===== COMPUTED PROPERTIES =====

    /** Inventaire actuel depuis le store */
    const inventory = computed(() => inventoryStore.getCurrentInventoryDetail)

    /** État de chargement depuis le store */
    const loading = computed(() => inventoryStore.isLoading || inventoryLoading.value || initialLoading.value)

    /** Erreur depuis le store */
    const error = computed(() => inventoryError.value || inventoryStore.getError)

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
            inventoryError.value = 'ID d\'inventaire non disponible'
            return
        }

        try {
            inventoryError.value = null
            await inventoryStore.fetchInventoryDetail(inventoryId.value)
        } catch (error) {
            logger.error('Erreur lors du chargement des détails', error)
            inventoryError.value = 'Impossible de charger les détails de l\'inventaire'
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

    /** Classe CSS commune pour les boutons d'action (bordure primaire, fond blanc, hover) */
    const ACTION_BUTTON_CLASS =
        'bg-white text-primary border border-primary hover:bg-primary hover:text-white ' +
        'dark:bg-slate-900 dark:text-primary dark:border-primary dark:hover:bg-primary ' +
        'dark:hover:text-white transition-all duration-200'

    /**
     * Retourne le variant Badge pour le statut de l'inventaire
     */
    const getStatusBadgeVariant = (status?: string): 'primary' | 'success' | 'error' | 'warning' | 'info' => {
        if (!status) return 'primary'
        switch (status.toUpperCase()) {
            case 'EN PREPARATION':
                return 'info'
            case 'EN REALISATION':
                return 'warning'
            case 'TERMINE':
                return 'success'
            case 'CLOTURE':
            case 'CLOTUREE':
                return 'primary'
            case 'ANNULE':
            case 'ANNULEE':
                return 'error'
            default:
                return 'primary'
        }
    }

    /**
     * Vérifie si un comptage a des options activées
     */
    const hasAnyOption = (comptage: any): boolean => {
        if (comptage?.champs_actifs && Array.isArray(comptage.champs_actifs)) {
            return comptage.champs_actifs.length > 0
        }
        const c = comptage as any
        return !!(
            c?.isVariante ||
            c?.guideArticle ||
            c?.guideQuantite ||
            c?.dlc ||
            c?.numeroSerie ||
            c?.numeroLot ||
            c?.inputMethod === 'scanner' ||
            c?.inputMethod === 'saisie' ||
            c?.scannerUnitaire ||
            c?.saisieQuantite ||
            c?.is_variant ||
            c?.show_product ||
            c?.quantity_show ||
            c?.unit_scanned ||
            c?.entry_quantity
        )
    }

    /**
     * Retourne la classe CSS pour le badge de mode de comptage
     */
    const getCountModeBadgeClass = (countMode: string): string => {
        switch (countMode) {
            case 'image de stock':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
            case 'en vrac':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
            case 'par article':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
        }
    }

    /**
     * Retourne le label affiché pour le mode de comptage
     */
    const getCountModeLabel = (countMode: string): string => {
        switch (countMode) {
            case 'image de stock':
                return 'Image de stock'
            case 'en vrac':
                return 'En vrac'
            case 'par article':
                return 'Par article'
            default:
                return countMode || 'Non défini'
        }
    }

    /**
     * Retourne le nom d'utilisateur d'une équipe
     */
    const getTeamUserName = (team: any): string => {
        if (team?.user) return team.user
        if (team?.userObject?.username) return team.userObject.username
        return 'Utilisateur inconnu'
    }

    // ===== PAGINATION ÉQUIPE =====
    const teamCurrentPage = ref(1)
    const teamItemsPerPage = ref(6)
    const paginatedTeam = computed(() => {
        const teamList = inventory.value?.equipe && Array.isArray(inventory.value.equipe) ? inventory.value.equipe : []
        const start = (teamCurrentPage.value - 1) * teamItemsPerPage.value
        const end = start + teamItemsPerPage.value
        return teamList.slice(start, end)
    })
    const teamTotalPages = computed(() => {
        const teamList = inventory.value?.equipe && Array.isArray(inventory.value.equipe) ? inventory.value.equipe : []
        return Math.ceil(teamList.length / teamItemsPerPage.value)
    })

    // ===== NAVIGATION WAREHOUSE =====
    const goToWarehousePlanning = (warehouseReference: string) => {
        router.push({
            name: 'inventory-planning',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }
    const goToWarehouseAffectation = (warehouseReference: string) => {
        router.push({
            name: 'inventory-affecter',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }
    const goToWarehouseReaffectation = (warehouseReference: string) => {
        router.push({
            name: 'inventory-reaffectation',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }
    const goToWarehouseResults = (warehouseReference: string) => {
        router.push({
            name: 'inventory-results',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }
    const goToWarehouseTracking = (warehouseReference: string) => {
        router.push({
            name: 'inventory-job-tracking',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }
    const goToWarehouseMonitoring = (warehouseReference: string) => {
        router.push({
            name: 'inventory-monitoring',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }

    /**
     * Génère les boutons d'action pour un magasin (planning, affectation, résultats, etc.)
     */
    const getWarehouseButtons = (magasin: any): ButtonGroupButton[] => {
        const warehouseName = magasin?.nom
        const warehouseReference = magasin?.reference

        const buttons: ButtonGroupButton[] = [
            { id: 'planning', label: 'Planification', icon: IconCalendar, onClick: () => goToWarehousePlanning(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
            { id: 'affectation', label: 'Affectation', icon: IconUsers, onClick: () => goToWarehouseAffectation(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
            { id: 'reaffectation', label: 'Réaffectation', icon: IconUsers, onClick: () => goToWarehouseReaffectation(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
            { id: 'tracking', label: 'Suivi', icon: IconClipboardText, onClick: () => goToWarehouseTracking(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS }
        ]
        if (inventory.value?.status === 'EN REALISATION') {
            buttons.push(
                { id: 'results', label: 'Résultats', icon: IconBarChart, onClick: () => goToWarehouseResults(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'monitoring', label: 'Monitoring', icon: IconChartSquare, onClick: () => goToWarehouseMonitoring(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS }
            )
        }
        if (inventory.value?.status === 'EN PREPARATION') {
            buttons.push({
                id: 'launch',
                label: 'Lancer',
                icon: IconPlay,
                onClick: async () => { await launchInventoryByWarehouseName(warehouseName) },
                variant: 'default',
                class: ACTION_BUTTON_CLASS
            })
        }
        return buttons
    }

    /**
     * Boutons d'action principaux selon le statut de l'inventaire
     */
    const actionButtons = computed<ButtonGroupButton[]>(() => {
        const buttons: ButtonGroupButton[] = []
        if (inventory.value?.status === 'EN PREPARATION') {
            buttons.push({ id: 'edit', label: 'Modifier', icon: IconEdit, onClick: editInventory, variant: 'default', class: ACTION_BUTTON_CLASS })
        } else if (inventory.value?.status === 'EN REALISATION') {
            buttons.push(
                { id: 'cancel', label: 'Annuler', icon: IconCancel, onClick: async () => { await cancelInventory() }, variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'terminate', label: 'Terminer', icon: IconCheck, onClick: async () => { await terminateInventory() }, variant: 'default', class: ACTION_BUTTON_CLASS }
            )
        } else if (inventory.value?.status === 'TERMINE') {
            buttons.push({ id: 'close', label: 'Clôturer', icon: IconLock, onClick: async () => { await closeInventory() }, variant: 'default', class: ACTION_BUTTON_CLASS })
        }
        buttons.push({ id: 'import-tracking', label: 'Suivi Import', icon: IconUpload, onClick: () => handleGoToImportTracking(), variant: 'default', class: ACTION_BUTTON_CLASS })
        if (inventory.value?.status !== 'CLOTURE' && inventory.value?.status !== 'CLOTUREE') {
            buttons.push({ id: 'export-detail', label: 'Exporter Détail', icon: IconFile, onClick: exportToPDF, variant: 'default', class: ACTION_BUTTON_CLASS })
            if (inventoryId.value) {
                buttons.push({ id: 'export-jobs', label: 'PDF Jobs', icon: IconDownload, onClick: exportJobsToPDF, variant: 'default', class: ACTION_BUTTON_CLASS })
            }
        }
        return buttons
    })

    // ===== ACTIONS SUR L'INVENTAIRE =====

    /**
     * Lance l'inventaire pour un warehouse spécifique
     *
     * @param warehouseId - ID du warehouse (optionnel, si non fourni lance pour tous les warehouses)
     */
    const launchInventoryByWarehause = async (warehouseId?: number) => {
        if (!inventory.value || !inventoryId.value) return false

        // Capturer la valeur de inventoryId dans une variable locale pour éviter les problèmes de type dans les closures
        const currentInventoryId: number = inventoryId.value

        try {
            const result = await alertService.confirm({
                title: 'Lancer l\'inventaire',
                text: warehouseId
                    ? `Voulez-vous vraiment lancer l'inventaire "${inventory.value.label}" pour ce magasin ?`
                    : `Voulez-vous vraiment lancer l'inventaire "${inventory.value.label}" ?`
            })

            if (result.isConfirmed) {
                if (warehouseId) {
                    // Lancer pour un warehouse spécifique
                    await inventoryStore.launchInventoryByWarehause(currentInventoryId, warehouseId)
                } else {
                    // Si aucun warehouseId n'est fourni, lancer pour tous les warehouses
                    // Itérer sur tous les magasins de l'inventaire
                    const warehouses = inventory.value?.magasins || []
                    if (warehouses.length === 0) {
                        await alertService.error({
                            title: 'Erreur',
                            text: 'Aucun magasin associé à cet inventaire'
                        })
                        return false
                    }

                    // Lancer pour chaque warehouse
                    const launchPromises = warehouses.map(async (magasin) => {
                        try {
                            // Les informations des magasins (dont potentiellement l'ID) viennent déjà de l'API
                            // GET /inventory/{id}/warehouses/ via InventoryService.getInventoryWarehouses
                            const whId = (magasin as any).id

                            if (typeof whId === 'number' && whId > 0) {
                                return inventoryStore.launchInventoryByWarehause(currentInventoryId, whId)
                            }
                            logger.warn(`Warehouse ID invalide pour le magasin ${magasin.nom}: ${whId}`)
                            return null
                        } catch (error) {
                            logger.error(`Erreur lors du lancement pour le magasin ${magasin.nom}`, error)
                            return null
                        }
                    })

                    await Promise.all(launchPromises)
                }
                await loadDetailData()

                await alertService.success({
                    text: warehouseId
                        ? 'L\'inventaire a été lancé avec succès pour ce magasin'
                        : 'L\'inventaire a été lancé avec succès'
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
     * Lance l'inventaire pour un warehouse par son nom
     * Récupère l'ID du warehouse depuis son nom puis lance l'inventaire
     *
     * @param warehouseName - Nom du warehouse
     */
    const launchInventoryByWarehouseName = async (warehouseName: string) => {
        if (!inventory.value || !inventoryId.value) return false

        try {
            // Les informations de magasins viennent déjà de l'API
            // GET /inventory/{id}/warehouses/ et sont exposées dans inventory.value.magasins
            const magasin = inventory.value.magasins.find((m: any) => m.nom === warehouseName)

            const warehouseId = magasin?.id

            if (!warehouseId || typeof warehouseId !== 'number' || warehouseId <= 0) {
                await alertService.error({
                    title: 'Erreur',
                    text: `Impossible de trouver le magasin "${warehouseName}"`
                })
                logger.warn('[useInventoryDetail] ID de magasin introuvable dans les données de warehouses', {
                    warehouseName,
                    magasins: inventory.value.magasins
                })
                return false
            }

            // Lancer l'inventaire pour ce warehouse
            return await launchInventoryByWarehause(warehouseId)
        } catch (error) {
            logger.error('Erreur lors de la récupération du warehouse à partir des données d\'inventaire', error)
            await alertService.error({
                title: 'Erreur',
                text: 'Une erreur est survenue lors de la récupération du magasin'
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

    // ===== MODAL RESSOURCES (état + méthodes) =====
    const showAddResourceModal = ref(false)
    const resourceLines = ref([{ resource: '', quantity: 1 }])
    const availableResources = ref<any[]>([])

    const resourceOptions = computed(() => {
        return resourceStore.getResources
            .filter((r: any) => r.id)
            .map((r: any) => ({
                value: String(r.id),
                label: r.ressource_nom || r.libelle
            }))
    })

    const addResourceLine = () => {
        resourceLines.value.push({ resource: '', quantity: 1 })
    }

    const removeResourceLine = (index: number) => {
        if (resourceLines.value.length > 1) {
            resourceLines.value.splice(index, 1)
        }
    }

    const getAvailableResourceOptions = (currentIndex: number) => {
        const selected = resourceLines.value
            .map((line, idx) => (idx !== currentIndex ? line.resource : null))
            .filter((v): v is string => v != null && v !== '')
        return resourceOptions.value.filter(opt => !selected.includes(opt.value))
    }

    const resourceFields = (index: number): FieldConfig[] => [
        {
            key: 'resource',
            label: 'Ressource',
            type: 'select',
            options: getAvailableResourceOptions(index),
            required: true,
            props: { placeholder: 'Choisissez une ressource' }
        },
        {
            key: 'quantity',
            label: 'Quantité',
            type: 'number',
            required: true,
            props: { min: 1, type: 'number', inputmode: 'numeric', placeholder: 'Quantité' }
        }
    ]

    const loadAvailableResources = async () => {
        try {
            const resources = await getAvailableResources()
            availableResources.value = resources || []
        } catch (err) {
            logger.error('Erreur lors du chargement des ressources disponibles', err)
            availableResources.value = []
        }
    }

    const onAddResources = async () => {
        try {
            const validLines = resourceLines.value.filter(line => line.resource && line.quantity > 0)
            if (validLines.length === 0) {
                await alertService.error({ text: 'Veuillez sélectionner au moins une ressource avec une quantité valide.' })
                return
            }
            const resourcesToAssign = validLines.map(line => ({
                resource_id: parseInt(line.resource),
                quantity: line.quantity
            }))
            await assignResourceToInventory(resourcesToAssign)
            showAddResourceModal.value = false
            resourceLines.value = [{ resource: '', quantity: 1 }]
            await loadDetailData()
        } catch (err) {
            logger.error('Erreur lors de l\'ajout des ressources', err)
        }
    }

    const openAddResourceModal = async () => {
        if (resourceStore.getResources.length === 0) {
            await resourceStore.fetchResources()
        }
        await loadAvailableResources()
        resourceLines.value = [{ resource: '', quantity: 1 }]
        showAddResourceModal.value = true
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

    // ===== MÉTHODES D'INITIALISATION =====

    /**
     * Initialise les données de l'inventaire
     * À appeler depuis le composant au montage
     */
    const initializeInventory = async () => {
        try {
            initialLoading.value = true
            inventoryError.value = null

            await fetchInventoryIdByReference(inventoryReference)

            if (inventoryId.value) {
                await loadDetailData()
            } else {
                logger.error('Impossible de récupérer l\'ID de l\'inventaire')
                inventoryError.value = inventoryError.value || 'Impossible de charger l\'inventaire'
            }
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation', error)
            inventoryError.value = 'Impossible d\'initialiser les données de l\'inventaire'
        } finally {
            initialLoading.value = false
        }
    }

    // ===== NAVIGATION =====

    /**
     * Navigation vers la page de suivi de l'importation du planning
     */
    const handleGoToImportTracking = () => {
        router.push({
            name: 'inventory-import-tracking',
            params: { reference: inventoryReference }
        })
    }

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

        // Pagination équipe
        teamCurrentPage,
        teamItemsPerPage,
        paginatedTeam,
        teamTotalPages,
        getTeamUserName,

        // Boutons et navigation warehouse
        actionButtons,
        getWarehouseButtons,
        ACTION_BUTTON_CLASS,
        goToWarehousePlanning,
        goToWarehouseAffectation,
        goToWarehouseReaffectation,
        goToWarehouseResults,
        goToWarehouseTracking,
        goToWarehouseMonitoring,

        // Helpers affichage
        getStatusBadgeVariant,
        hasAnyOption,
        getCountModeBadgeClass,
        getCountModeLabel,

        // Actions sur l'inventaire
        launchInventoryByWarehause,
        launchInventoryByWarehouseName,
        launchInventory: launchInventoryByWarehause,
        editInventory,
        cancelInventory,
        terminateInventory,
        closeInventory,

        // Utilitaires
        formatDate,
        getStatusClass,
        loadDetailData,
        initializeInventory,

        // Gestion des ressources
        assignResourceToInventory,
        updateResourceQuantity,
        removeResourceFromInventory,
        getAvailableResources,
        showAddResourceModal,
        resourceLines,
        availableResources,
        resourceOptions,
        addResourceLine,
        removeResourceLine,
        getAvailableResourceOptions,
        resourceFields,
        loadAvailableResources,
        onAddResources,
        openAddResourceModal,

        // Export
        exportToPDF,
        exportJobsToPDF,

        // Navigation
        handleGoToImportTracking
    }
}
