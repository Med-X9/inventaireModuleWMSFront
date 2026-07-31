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
import { parsePositiveInventoryId } from '@/services/InventoryService'
import { validationAlertService } from '@/services/validationAlertService'
import { logger } from '@/services/loggerService'

// ===== IMPORTS UTILS =====
import { generatePDF } from '@/utils/pdfGenerator'

// ===== IMPORTS TYPES =====
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'
import type { FieldConfig } from '@/interfaces/form'
import type { InventoryMagasin } from '@/models/InventoryDetail'
import type { ActionConfig, DataTableColumn, TabOption } from '@SMATCH-Digital-dev/vue-system-design'

interface MagasinTableRow extends InventoryMagasin {
    _rowId: string | number
    status_label: string
    date_label: string
    status_date_lancement_label: string
}

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

    /**
     * ID numérique d’inventaire pour les appels API (ref résolu, sinon id du détail chargé).
     * Évite les requêtes du type /inventory/undefined/…
     */
    const inventoryIdResolved = computed((): number | null => {
        const fromRef = parsePositiveInventoryId(inventoryId.value)
        if (fromRef != null) {
            return fromRef
        }
        const fromDetail = (inventory.value as { id?: number } | undefined)?.id
        return parsePositiveInventoryId(fromDetail)
    })

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

            const parsedId = parsePositiveInventoryId(inventory?.id)
            if (inventory && parsedId != null) {
                inventoryId.value = parsedId
                logger.debug('ID de l\'inventaire résolu avec succès', {
                    reference,
                    inventoryId: parsedId
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
            case 'EN CONFIGURATION':
                return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
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
            case 'EN CONFIGURATION':
                return 'info'
            case 'EN PREPARATION':
                return 'info'
            case 'EN ATTENTE':
                return 'warning'
            case 'LANCEE':
                return 'success'
            case 'TERMINEE':
            case 'TERMINE':
                return 'info'
            case 'ANALYSER':
                return 'warning'
            case 'EN REALISATION':
                return 'warning'
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

    // ===== ONGLETS DÉTAIL =====
    const activeTab = ref<string | number>('detail')

    const detailTabs: TabOption[] = [
        { label: 'Détail', value: 'detail' },
        { label: 'Magasins', value: 'magasins' },
        { label: 'Équipes', value: 'equipes' },
        { label: 'Ressources', value: 'resources' },
    ]

    const MAGASIN_STATUS_BADGE_STYLES = [
        {
            value: 'EN ATTENTE',
            class: 'inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/30 dark:bg-amber-900/40 dark:text-amber-200',
        },
        {
            value: 'LANCEE',
            class: 'inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-200',
        },
        {
            value: 'TERMINEE',
            class: 'inline-flex items-center rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-500/30 dark:bg-sky-900/40 dark:text-sky-200',
        },
        {
            value: 'ANALYSER',
            class: 'inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-violet-500/30 dark:bg-violet-900/40 dark:text-violet-200',
        },
        {
            value: 'CLOTURE',
            class: 'inline-flex items-center rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-400/40 dark:bg-slate-700 dark:text-slate-200',
        },
    ] as const

    const getMagasinStatus = (row: { status?: string } | null | undefined): string =>
        (row?.status || 'EN ATTENTE').toUpperCase()

    const isInventoryTypeMagasin = computed(
        () => (inventory.value?.inventory_type || '').toUpperCase() === 'MAGASIN'
    )

    const resolveWarehouseId = (row: MagasinTableRow | InventoryMagasin): number | null => {
        const id = row.id
        return typeof id === 'number' && id > 0 ? id : null
    }

    const handleWarehouseSettingError = async (error: unknown, fallbackMessage: string) => {
        logger.error(fallbackMessage, error)
        if (error && typeof error === 'object') {
            const backendError = (error as { response?: { data?: unknown } }).response?.data
            if (backendError) {
                validationAlertService.showLaunchErrors(backendError)
                return
            }
        }
        await alertService.error({
            title: 'Erreur',
            text: fallbackMessage,
        })
    }

    const magasinsTableRows = computed(() =>
        (inventory.value?.magasins ?? []).map((magasin, index) => ({
            ...magasin,
            _rowId: magasin.id ?? magasin.reference ?? index,
            status_label: magasin.status || 'EN ATTENTE',
            date_label: magasin.date ? formatDate(magasin.date) : 'Date non définie',
            status_date_lancement_label: magasin.status_date_lancement
                ? formatDate(magasin.status_date_lancement)
                : '—',
        }))
    )

    const equipesTableRows = computed(() =>
        (inventory.value?.equipe ?? []).map((team, index) => ({
            ...team,
            _rowId: team.reference ?? team.user ?? index,
            utilisateur: getTeamUserName(team),
            nombre_comptage_label: team.nombre_comptage
                ? `${team.nombre_comptage} comptage${team.nombre_comptage > 1 ? 's' : ''}`
                : '—',
        }))
    )

    const resourcesTableRows = computed(() =>
        (inventory.value?.ressources ?? []).map((ressource, index) => ({
            ...ressource,
            _rowId: ressource.id ?? ressource.reference ?? index,
            nom_label: ressource.ressource_nom || 'Ressource sans nom',
            reference_label: ressource.reference || 'Référence non définie',
        }))
    )

    const magasinsColumns = computed<DataTableColumn[]>(() => [
        {
            field: 'nom',
            headerName: 'Magasin',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 200,
            icon: 'mdi-package-variant',
        },
        {
            field: 'reference',
            headerName: 'Référence',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 160,
            icon: 'mdi-identifier',
        },
        {
            field: 'status_label',
            headerName: 'Statut',
            sortable: true,
            filterable: true,
            dataType: 'select',
            width: 140,
            icon: 'mdi-tag-outline',
            badgeStyles: [...MAGASIN_STATUS_BADGE_STYLES],
        },
        {
            field: 'date_label',
            headerName: 'Date inventaire',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 150,
            icon: 'mdi-calendar-outline',
        },
        {
            field: 'status_date_lancement_label',
            headerName: 'Date lancement',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 150,
            icon: 'mdi-play-outline',
        },
    ])

    const equipesColumns = computed<DataTableColumn[]>(() => [
        {
            field: 'utilisateur',
            headerName: 'Utilisateur',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 220,
            icon: 'mdi-account-outline',
        },
        {
            field: 'reference',
            headerName: 'Référence',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 180,
            icon: 'mdi-identifier',
        },
        {
            field: 'nombre_comptage_label',
            headerName: 'Comptages',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 140,
            icon: 'mdi-numeric',
        },
    ])

    const resourcesColumns = computed<DataTableColumn[]>(() => [
        {
            field: 'nom_label',
            headerName: 'Ressource',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 220,
            icon: 'mdi-cube-outline',
        },
        {
            field: 'reference_label',
            headerName: 'Référence',
            sortable: true,
            filterable: true,
            dataType: 'text',
            width: 180,
            icon: 'mdi-identifier',
        },
        {
            field: 'quantity',
            headerName: 'Quantité',
            sortable: true,
            filterable: true,
            dataType: 'number',
            width: 120,
            icon: 'mdi-counter',
        },
    ])

    const cancelWarehouseLaunchByRow = async (row: MagasinTableRow) => {
        if (!inventoryId.value) return false
        const warehouseId = resolveWarehouseId(row)
        if (!warehouseId) {
            await alertService.error({ title: 'Erreur', text: `ID magasin introuvable pour "${row.nom}"` })
            return false
        }
        try {
            const result = await alertService.confirm({
                title: 'Annuler le lancement',
                text: `Annuler le lancement du magasin "${row.nom}" ? Il repassera en EN ATTENTE.`,
            })
            if (!result.isConfirmed) return false
            await inventoryStore.cancelWarehouseLaunch(inventoryId.value, warehouseId)
            await loadDetailData()
            await alertService.success({ text: `Lancement annulé pour "${row.nom}"` })
            return true
        } catch (error) {
            await handleWarehouseSettingError(error, 'Impossible d\'annuler le lancement')
            return false
        }
    }

    const termineWarehouseByRow = async (row: MagasinTableRow) => {
        if (!inventoryId.value) return false
        const warehouseId = resolveWarehouseId(row)
        if (!warehouseId) {
            await alertService.error({ title: 'Erreur', text: `ID magasin introuvable pour "${row.nom}"` })
            return false
        }
        try {
            const result = await alertService.confirm({
                title: 'Terminer le magasin',
                text: `Terminer le magasin "${row.nom}" ? Tous les jobs doivent être TERMINE.`,
            })
            if (!result.isConfirmed) return false
            await inventoryStore.termineWarehouse(inventoryId.value, warehouseId)
            await loadDetailData()
            await alertService.success({ text: `Magasin "${row.nom}" terminé` })
            return true
        } catch (error) {
            await handleWarehouseSettingError(error, 'Impossible de terminer le magasin')
            return false
        }
    }

    const analyserWarehouseByRow = async (row: MagasinTableRow) => {
        if (!inventoryId.value) return false
        const warehouseId = resolveWarehouseId(row)
        if (!warehouseId) {
            await alertService.error({ title: 'Erreur', text: `ID magasin introuvable pour "${row.nom}"` })
            return false
        }
        try {
            const result = await alertService.confirm({
                title: 'Analyser le magasin',
                text: `Analyser le magasin "${row.nom}" ? Les écarts stock seront calculés et enregistrés.`,
            })
            if (!result.isConfirmed) return false
            await inventoryStore.analyserWarehouse(inventoryId.value, warehouseId)
            await loadDetailData()
            await alertService.success({ text: `Analyse terminée pour "${row.nom}"` })
            return true
        } catch (error) {
            await handleWarehouseSettingError(error, 'Impossible d\'analyser le magasin')
            return false
        }
    }

    const closeWarehouseByRow = async (row: MagasinTableRow) => {
        if (!inventoryId.value) return false
        const warehouseId = resolveWarehouseId(row)
        if (!warehouseId) {
            await alertService.error({ title: 'Erreur', text: `ID magasin introuvable pour "${row.nom}"` })
            return false
        }
        try {
            const result = await alertService.confirm({
                title: 'Clôturer le magasin',
                text: `Clôturer le magasin "${row.nom}" ? Cette action est définitive.`,
            })
            if (!result.isConfirmed) return false
            await inventoryStore.closeWarehouse(inventoryId.value, warehouseId)
            await loadDetailData()
            await alertService.success({ text: `Magasin "${row.nom}" clôturé` })
            return true
        } catch (error) {
            await handleWarehouseSettingError(error, 'Impossible de clôturer le magasin')
            return false
        }
    }

    /**
     * Actions magasin selon le cycle Setting :
     * EN ATTENTE → planif / affectation / import planning / lancer
     * LANCEE → annuler lancement / terminer / suivi / KPI / résultats / monitoring
     * TERMINEE → import stock / analyser
     * ANALYSER → écarts stock / clôturer (MAGASIN)
     * GENERAL/TOURNANT → clôturer depuis LANCEE
     */
    const magasinsActions = computed<ActionConfig<MagasinTableRow>[]>(() => [
        {
            label: 'Planification',
            icon: 'mdi-calendar-outline',
            color: 'info',
            onClick: (row) => goToWarehousePlanning(row.reference || ''),
            show: (row) => getMagasinStatus(row) === 'EN ATTENTE',
        },
        {
            label: 'Affectation',
            icon: 'mdi-account-group-outline',
            color: 'info',
            onClick: (row) => goToWarehouseAffectation(row.reference || ''),
            show: (row) => getMagasinStatus(row) === 'EN ATTENTE',
        },
        {
            label: 'Import stock',
            icon: 'mdi-file-excel-outline',
            color: 'secondary',
            onClick: (row) => goToWarehouseStockImport(row.reference || ''),
            show: (row) => getMagasinStatus(row) === 'TERMINEE',
        },
        {
            label: 'Import planning',
            icon: 'mdi-file-upload-outline',
            color: 'primary',
            onClick: () => {
                openPlanningImportModal()
            },
            show: (row) => getMagasinStatus(row) === 'EN ATTENTE',
        },
        {
            label: 'Lancer',
            icon: 'mdi-play-outline',
            color: 'success',
            onClick: async (row) => {
                await launchInventoryByWarehouseName(row.nom)
            },
            show: (row) => getMagasinStatus(row) === 'EN ATTENTE',
        },
        {
            label: 'Annuler lancement',
            icon: 'mdi-close-circle-outline',
            color: 'danger',
            onClick: async (row) => {
                await cancelWarehouseLaunchByRow(row)
            },
            show: (row) => getMagasinStatus(row) === 'LANCEE',
        },
        {
            label: 'Terminer',
            icon: 'mdi-check-circle-outline',
            color: 'success',
            onClick: async (row) => {
                await termineWarehouseByRow(row)
            },
            show: (row) => getMagasinStatus(row) === 'LANCEE',
        },
        {
            label: 'Suivi',
            icon: 'mdi-clipboard-text-outline',
            color: 'info',
            onClick: (row) => goToWarehouseTracking(row.reference || ''),
            show: (row) => getMagasinStatus(row) === 'LANCEE',
        },
        {
            label: 'KPI',
            icon: 'mdi-view-dashboard-outline',
            color: 'primary',
            onClick: (row) => goToWarehouseKpiDashboard(row.reference || ''),
            show: (row) => getMagasinStatus(row) === 'LANCEE',
        },
        {
            label: 'Résultats',
            icon: 'mdi-chart-bar',
            color: 'primary',
            onClick: (row) => goToWarehouseResults(row.reference || ''),
            show: (row) => ['LANCEE', 'TERMINEE', 'ANALYSER', 'CLOTURE'].includes(getMagasinStatus(row)),
        },
        {
            label: 'Monitoring',
            icon: 'mdi-chart-box-outline',
            color: 'info',
            onClick: (row) => goToWarehouseMonitoring(row.reference || ''),
            show: (row) => getMagasinStatus(row) === 'LANCEE',
        },
        {
            label: 'Analyser',
            icon: 'mdi-chart-timeline-variant',
            color: 'warning',
            onClick: async (row) => {
                await analyserWarehouseByRow(row)
            },
            show: (row) => getMagasinStatus(row) === 'TERMINEE',
        },
        {
            label: 'Écarts stock',
            icon: 'mdi-scale-balance',
            color: 'warning',
            onClick: (row) => goToWarehouseStockGaps(row.reference || ''),
            show: (row) => ['ANALYSER', 'CLOTURE'].includes(getMagasinStatus(row)),
        },
        {
            label: 'Clôturer',
            icon: 'mdi-lock-outline',
            color: 'secondary',
            onClick: async (row) => {
                await closeWarehouseByRow(row)
            },
            show: (row) => {
                const status = getMagasinStatus(row)
                if (isInventoryTypeMagasin.value) return status === 'ANALYSER'
                return status === 'LANCEE'
            },
        },
    ])

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
    const goToWarehouseKpiDashboard = (warehouseReference: string) => {
        router.push({
            name: 'inventory-kpi-dashboard',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }
    const goToWarehouseStockImport = (warehouseReference: string) => {
        router.push({
            name: 'inventory-stock-import',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }
    const goToWarehouseStockGaps = (warehouseReference: string) => {
        router.push({
            name: 'inventory-stock-gaps',
            params: { reference: inventoryReference, warehouse: warehouseReference }
        })
    }

    /**
     * Boutons magasin (legacy ButtonGroup) — alignés sur le cycle Setting, sans réaffectation
     */
    const getWarehouseButtons = (magasin: InventoryMagasin): ButtonGroupButton[] => {
        const warehouseName = magasin?.nom
        const warehouseReference = magasin?.reference || ''
        const status = getMagasinStatus(magasin)
        const row = magasin as MagasinTableRow
        const buttons: ButtonGroupButton[] = []

        if (status === 'EN ATTENTE') {
            buttons.push(
                { id: 'planning', label: '', title: 'Planification', icon: 'mdi-calendar-outline', onClick: () => goToWarehousePlanning(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'affectation', label: '', title: 'Affectation', icon: 'mdi-account-group-outline', onClick: () => goToWarehouseAffectation(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'import-planning', label: '', title: 'Import planning', icon: 'mdi-file-upload-outline', onClick: () => openPlanningImportModal(), variant: 'default', class: ACTION_BUTTON_CLASS },
                {
                    id: 'launch',
                    label: '',
                    title: "Lancer l'inventaire pour ce magasin",
                    icon: 'mdi-play-outline',
                    onClick: async () => { await launchInventoryByWarehouseName(warehouseName) },
                    variant: 'default',
                    class: ACTION_BUTTON_CLASS,
                }
            )
        }

        if (status === 'LANCEE') {
            buttons.push(
                { id: 'cancel-launch', label: '', title: 'Annuler le lancement', icon: 'mdi-close-circle-outline', onClick: async () => { await cancelWarehouseLaunchByRow(row) }, variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'termine', label: '', title: 'Terminer', icon: 'mdi-check-circle-outline', onClick: async () => { await termineWarehouseByRow(row) }, variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'tracking', label: '', title: 'Suivi', icon: 'mdi-clipboard-text-outline', onClick: () => goToWarehouseTracking(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'kpi-dashboard', label: '', title: 'Tableau de bord KPI', icon: 'mdi-view-dashboard-outline', onClick: () => goToWarehouseKpiDashboard(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'results', label: '', title: 'Résultats', icon: 'mdi-chart-bar', onClick: () => goToWarehouseResults(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'monitoring', label: '', title: 'Monitoring zones', icon: 'mdi-chart-box-outline', onClick: () => goToWarehouseMonitoring(warehouseReference), variant: 'default', class: ACTION_BUTTON_CLASS }
            )
            if (!isInventoryTypeMagasin.value) {
                buttons.push({
                    id: 'close',
                    label: '',
                    title: 'Clôturer',
                    icon: 'mdi-lock-outline',
                    onClick: async () => { await closeWarehouseByRow(row) },
                    variant: 'default',
                    class: ACTION_BUTTON_CLASS,
                })
            }
        }

        if (status === 'TERMINEE') {
            buttons.push(
                {
                    id: 'stock-import',
                    label: '',
                    title: 'Import stock théorique',
                    icon: 'mdi-file-excel-outline',
                    onClick: () => goToWarehouseStockImport(warehouseReference),
                    variant: 'default',
                    class: ACTION_BUTTON_CLASS,
                },
                {
                    id: 'analyser',
                    label: '',
                    title: 'Analyser',
                    icon: 'mdi-chart-timeline-variant',
                    onClick: async () => { await analyserWarehouseByRow(row) },
                    variant: 'default',
                    class: ACTION_BUTTON_CLASS,
                }
            )
        }

        if (status === 'ANALYSER' || status === 'CLOTURE') {
            buttons.push({
                id: 'stock-gaps',
                label: '',
                title: 'Écarts stock',
                icon: 'mdi-scale-balance',
                onClick: () => goToWarehouseStockGaps(warehouseReference),
                variant: 'default',
                class: ACTION_BUTTON_CLASS,
            })
        }

        if (status === 'ANALYSER' && isInventoryTypeMagasin.value) {
            buttons.push({
                id: 'close',
                label: '',
                title: 'Clôturer',
                icon: 'mdi-lock-outline',
                onClick: async () => { await closeWarehouseByRow(row) },
                variant: 'default',
                class: ACTION_BUTTON_CLASS,
            })
        }

        return buttons
    }

    /**
     * Boutons d'action principaux selon le statut de l'inventaire
     */
    const actionButtons = computed<ButtonGroupButton[]>(() => {
        const buttons: ButtonGroupButton[] = []
        if (inventory.value?.status === 'EN CONFIGURATION') {
            buttons.push({
                id: 'configure',
                label: 'Configurer',
                icon: 'mdi-cog-outline',
                onClick: configureInventory,
                variant: 'default',
                class: ACTION_BUTTON_CLASS,
            })
        } else if (inventory.value?.status === 'EN PREPARATION') {
            buttons.push({ id: 'edit', label: 'Modifier', icon: 'mdi-pencil-outline', onClick: editInventory, variant: 'default', class: ACTION_BUTTON_CLASS })
        } else if (inventory.value?.status === 'EN REALISATION') {
            buttons.push(
                { id: 'cancel', label: 'Annuler', icon: 'mdi-close-circle-outline', onClick: async () => { await cancelInventory() }, variant: 'default', class: ACTION_BUTTON_CLASS },
                { id: 'terminate', label: 'Terminer', icon: 'mdi-check', onClick: async () => { await terminateInventory() }, variant: 'default', class: ACTION_BUTTON_CLASS }
            )
        } else if (inventory.value?.status === 'TERMINE') {
            buttons.push({ id: 'close', label: 'Clôturer', icon: 'mdi-lock-outline', onClick: async () => { await closeInventory() }, variant: 'default', class: ACTION_BUTTON_CLASS })
        }
        buttons.push({ id: 'import-tracking', label: 'Suivi Import', icon: 'mdi-upload-outline', onClick: () => handleGoToImportTracking(), variant: 'default', class: ACTION_BUTTON_CLASS })
        if (inventory.value?.status !== 'CLOTURE' && inventory.value?.status !== 'CLOTUREE') {
            buttons.push({ id: 'export-detail', label: 'Exporter Détail', icon: 'mdi-file-outline', onClick: exportToPDF, variant: 'default', class: ACTION_BUTTON_CLASS })
            if (inventoryIdResolved.value) {
                buttons.push({
                    id: 'export-jobs',
                    label: 'PDF Jobs',
                    icon: 'mdi-download-outline',
                    onClick: () => {
                        exportJobsToPDF()
                    },
                    variant: 'default',
                    class: ACTION_BUTTON_CLASS
                })
            }
        }
        return buttons
    })

    // ===== ACTIONS SUR L'INVENTAIRE =====

    /**
     * Lance l'inventaire pour un warehouse spécifique
     *
     * @param warehouseId - ID du warehouse (optionnel, si non fourni lance tous les magasins EN ATTENTE)
     */
    const launchInventoryByWarehause = async (warehouseId?: number) => {
        if (!inventory.value || !inventoryId.value) return false

        const currentInventoryId: number = inventoryId.value

        try {
            if (warehouseId) {
                const result = await alertService.confirm({
                    title: 'Lancer l\'inventaire',
                    text: `Voulez-vous vraiment lancer l'inventaire "${inventory.value.label}" pour ce magasin ?`,
                })

                if (!result.isConfirmed) return false

                await inventoryStore.launchInventoryByWarehause(currentInventoryId, warehouseId)
                await loadDetailData()
                await alertService.success({
                    text: 'L\'inventaire a été lancé avec succès pour ce magasin',
                })
                return true
            }

            return await launchMultipleWarehouses()
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
                text: 'Une erreur est survenue lors du lancement de l\'inventaire',
            })
            return false
        }
    }

    /** IDs des magasins sélectionnés dans le DataTable (lancement multi) */
    const selectedMagasinIds = ref<Array<string | number>>([])

    const onMagasinsSelectionChanged = (selectedRows: Set<string> | MagasinTableRow[]) => {
        if (selectedRows instanceof Set) {
            selectedMagasinIds.value = Array.from(selectedRows)
            return
        }
        if (Array.isArray(selectedRows)) {
            selectedMagasinIds.value = selectedRows
                .map((row) => row.id ?? row._rowId)
                .filter((id): id is string | number => id !== undefined && id !== null && id !== '')
            return
        }
        selectedMagasinIds.value = []
    }

    const selectedMagasins = computed(() => {
        const ids = new Set(selectedMagasinIds.value.map(String))
        if (ids.size === 0) return []
        return magasinsTableRows.value.filter((m) =>
            ids.has(String(m.id)) || ids.has(String(m._rowId)) || (m.reference != null && ids.has(String(m.reference)))
        )
    })

    /** Magasins encore lançables (EN ATTENTE) */
    const magasinsEnAttente = computed(() =>
        magasinsTableRows.value.filter(
            (m) => getMagasinStatus(m) === 'EN ATTENTE' && typeof m.id === 'number' && m.id > 0
        )
    )

    /** Magasins lançables pour terminaison (LANCEE) */
    const magasinsLancee = computed(() =>
        magasinsTableRows.value.filter(
            (m) => getMagasinStatus(m) === 'LANCEE' && typeof m.id === 'number' && m.id > 0
        )
    )

    const canLaunchMultipleWarehouses = computed(() => magasinsEnAttente.value.length > 0)
    const canTermineMultipleWarehouses = computed(() => magasinsLancee.value.length > 0)

    /**
     * Lance plusieurs magasins via POST .../warehouses/launch/
     * Utilise la sélection DataTable si présente, sinon tous les magasins EN ATTENTE.
     */
    const launchMultipleWarehouses = async () => {
        if (!inventory.value || !inventoryId.value) return false

        const currentInventoryId = inventoryId.value

        const selectedPending = selectedMagasins.value.filter(
            (m) => (m.status || 'EN ATTENTE').toUpperCase() === 'EN ATTENTE' && typeof m.id === 'number' && m.id > 0
        )

        const targets = selectedPending.length > 0 ? selectedPending : magasinsEnAttente.value

        if (targets.length === 0) {
            await alertService.error({
                title: 'Aucun magasin',
                text: 'Aucun magasin en attente à lancer.',
            })
            return false
        }

        const warehouseIds = targets.map((m) => m.id as number)
        const namesPreview = targets
            .slice(0, 5)
            .map((m) => m.nom)
            .join(', ')
        const more = targets.length > 5 ? ` (+${targets.length - 5})` : ''

        try {
            const result = await alertService.confirm({
                title: 'Lancer les magasins',
                text: `Voulez-vous lancer l'inventaire "${inventory.value.label}" pour ${targets.length} magasin(s) : ${namesPreview}${more} ?`,
            })

            if (!result.isConfirmed) return false

            await inventoryStore.launchInventoryWarehouses(currentInventoryId, warehouseIds)
            selectedMagasinIds.value = []
            await loadDetailData()

            await alertService.success({
                text: `${targets.length} magasin(s) lancé(s) avec succès`,
            })
            return true
        } catch (error) {
            logger.error('Erreur lors du lancement multi-magasins', error)

            if (error && typeof error === 'object') {
                const backendError = (error as any).response?.data
                if (backendError) {
                    validationAlertService.showLaunchErrors(backendError)
                    return false
                }
            }

            await alertService.error({
                title: 'Erreur de lancement',
                text: 'Une erreur est survenue lors du lancement des magasins',
            })
            return false
        }
    }

    /**
     * Termine plusieurs magasins via POST .../warehouses/termine/
     * Sélection DataTable si présente, sinon tous les magasins LANCEE.
     */
    const termineMultipleWarehouses = async () => {
        if (!inventory.value || !inventoryId.value) return false

        const currentInventoryId = inventoryId.value
        const selectedLancee = selectedMagasins.value.filter(
            (m) => getMagasinStatus(m) === 'LANCEE' && typeof m.id === 'number' && m.id > 0
        )
        const targets = selectedLancee.length > 0 ? selectedLancee : magasinsLancee.value

        if (targets.length === 0) {
            await alertService.error({
                title: 'Aucun magasin',
                text: 'Aucun magasin lancé à terminer.',
            })
            return false
        }

        const warehouseIds = targets.map((m) => m.id as number)
        const namesPreview = targets
            .slice(0, 5)
            .map((m) => m.nom)
            .join(', ')
        const more = targets.length > 5 ? ` (+${targets.length - 5})` : ''

        try {
            const result = await alertService.confirm({
                title: 'Terminer les magasins',
                text: `Terminer ${targets.length} magasin(s) : ${namesPreview}${more} ? Tous leurs jobs doivent être TERMINE.`,
            })

            if (!result.isConfirmed) return false

            const response = await inventoryStore.termineWarehouses(currentInventoryId, warehouseIds)
            selectedMagasinIds.value = []
            await loadDetailData()

            const failedCount = (response as { failed_count?: number } | undefined)?.failed_count ?? 0
            if (failedCount > 0) {
                await alertService.error({
                    title: 'Terminaison partielle',
                    text: `${(response as { completed_count?: number })?.completed_count ?? 0} magasin(s) terminé(s), ${failedCount} échec(s).`,
                })
            } else {
                await alertService.success({
                    text: `${targets.length} magasin(s) terminé(s) avec succès`,
                })
            }
            return failedCount === 0
        } catch (error) {
            await handleWarehouseSettingError(error, 'Impossible de terminer les magasins')
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
     * Redirige vers la page de configuration des comptages
     */
    const configureInventory = () => {
        router.push({ name: 'inventory-configure', params: { reference: inventoryReference } })
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
    /** Modale de suivi export PDF jobs (async + poll) */
    const showJobsPdfExportModal = ref(false)
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
     * Ouvre la modale de suivi d’export PDF des jobs (POST …/jobs/pdf/async/ + poll …/pdf-tasks/&lt;uuid&gt;/).
     */
    const exportJobsToPDF = () => {
        if (!inventoryIdResolved.value) {
            void alertService.error({
                title: 'Erreur',
                text: 'ID d’inventaire non disponible. Rechargez la page ou vérifiez l’inventaire.'
            })
            return
        }
        showJobsPdfExportModal.value = true
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

    // ===== IMPORT PLANNING (MAGASIN) =====

    const showPlanningModal = ref(false)
    const planningFile = ref<File | null>(null)
    const planningFileInput = ref<HTMLInputElement | null>(null)
    const isDraggingPlanning = ref(false)
    const isUploadingPlanning = ref(false)
    const planningUploadProgress = ref(0)
    const planningSuccess = ref(false)
    const planningSuccessMessage = ref<string | null>(null)
    const planningError = ref<string | null>(null)
    const planningErrorDetails = ref<unknown>(null)
    const planningInfoMessage = ref<string | null>(null)

    const planningModalTitle = computed(() =>
        inventory.value
            ? `Import planning — ${inventory.value.label || inventory.value.reference}`
            : 'Import planning'
    )

    const openPlanningImportModal = () => {
        planningFile.value = null
        planningError.value = null
        planningErrorDetails.value = null
        planningSuccess.value = false
        planningSuccessMessage.value = null
        planningInfoMessage.value = null
        planningUploadProgress.value = 0
        isDraggingPlanning.value = false
        showPlanningModal.value = true
    }

    const closePlanningModal = () => {
        if (isUploadingPlanning.value) return
        showPlanningModal.value = false
        planningFile.value = null
        isDraggingPlanning.value = false
        planningError.value = null
        planningErrorDetails.value = null
        planningSuccess.value = false
        planningSuccessMessage.value = null
        planningInfoMessage.value = null
        planningUploadProgress.value = 0
    }

    const onPlanningModalVisibilityChange = (visible: boolean) => {
        if (!visible) closePlanningModal()
    }

    const validateExcelFile = (file: File): boolean => {
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
        if (!isExcel) {
            void alertService.error({ text: 'Seuls les fichiers Excel (.xlsx, .xls) sont acceptés' })
            return false
        }
        return true
    }

    const getFileType = (fileName: string): string => {
        const ext = fileName.split('.').pop()?.toUpperCase()
        return ext || 'Fichier'
    }

    const handlePlanningFileChange = (event: Event) => {
        const target = event.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
            const file = target.files[0]
            if (validateExcelFile(file)) {
                planningFile.value = file
                planningError.value = null
            }
            target.value = ''
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
                planningError.value = null
            }
        }
    }

    /**
     * Import planning Excel (async) — même API que Gestion inventaire
     * POST /web/api/inventory/{id}/location-jobs/import-async/
     */
    const processPlanningUpload = async (file: File) => {
        const id = inventoryIdResolved.value
        if (!id) {
            await alertService.error({ text: 'Identifiant inventaire introuvable.' })
            return
        }

        isUploadingPlanning.value = true
        planningError.value = null
        planningErrorDetails.value = null
        planningSuccess.value = false
        planningInfoMessage.value = 'Upload du fichier en cours...'
        planningUploadProgress.value = 0

        let progressInterval: ReturnType<typeof setInterval> | null = null
        try {
            const formData = new FormData()
            formData.append('file', file)

            progressInterval = setInterval(() => {
                planningUploadProgress.value += Math.random() * 20
                if (planningUploadProgress.value >= 80 && progressInterval) {
                    clearInterval(progressInterval)
                    progressInterval = null
                }
            }, 300)

            planningInfoMessage.value = 'Traitement des données de planification...'
            const response = await inventoryStore.importLocationJobsSync(id, formData)

            if (progressInterval) clearInterval(progressInterval)
            planningUploadProgress.value = 100
            planningSuccess.value = true
            planningSuccessMessage.value =
                (response as { message?: string } | undefined)?.message
                || 'Planification importée avec succès. Suivi de la tâche en cours…'

            setTimeout(() => {
                closePlanningModal()
                handleGoToImportTracking()
            }, 1500)
        } catch (error: unknown) {
            if (progressInterval) clearInterval(progressInterval)
            planningUploadProgress.value = 0
            const errData =
                (error as { response?: { data?: { message?: string; errors?: unknown } } })?.response?.data
            planningErrorDetails.value = errData || error
            planningError.value =
                errData?.message
                || (error instanceof Error ? error.message : 'Erreur lors de l\'import du planning')
        } finally {
            isUploadingPlanning.value = false
            planningInfoMessage.value = null
        }
    }

    const handlePlanningUpload = () => {
        if (!planningFile.value || isUploadingPlanning.value) return
        void processPlanningUpload(planningFile.value)
    }

    const clearPlanningFile = () => {
        planningFile.value = null
    }

    // ===== RETURN =====

    return {
        // État
        inventory,
        loading,
        error,
        inventoryId,
        inventoryIdResolved,
        inventoryLoading,
        inventoryError,

        // Données
        magasins,
        resources,
        resourcesLoading,
        resourcesError,

        // Pagination équipe (legacy)
        teamCurrentPage,
        teamItemsPerPage,
        paginatedTeam,
        teamTotalPages,
        getTeamUserName,

        // Onglets et DataTables
        activeTab,
        detailTabs,
        magasinsTableRows,
        equipesTableRows,
        resourcesTableRows,
        magasinsColumns,
        equipesColumns,
        resourcesColumns,
        magasinsActions,

        // Lancement multi-magasins
        selectedMagasins,
        onMagasinsSelectionChanged,
        canLaunchMultipleWarehouses,
        canTermineMultipleWarehouses,
        launchMultipleWarehouses,
        termineMultipleWarehouses,

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
        goToWarehouseKpiDashboard,
        goToWarehouseStockImport,
        goToWarehouseStockGaps,

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
        configureInventory,
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
        showJobsPdfExportModal,
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

        // Import planning (MAGASIN)
        showPlanningModal,
        planningModalTitle,
        planningFile,
        planningFileInput,
        isDraggingPlanning,
        isUploadingPlanning,
        planningUploadProgress,
        planningSuccess,
        planningSuccessMessage,
        planningError,
        planningErrorDetails,
        planningInfoMessage,
        openPlanningImportModal,
        closePlanningModal,
        onPlanningModalVisibilityChange,
        handlePlanningFileChange,
        handlePlanningDragOver,
        handlePlanningDragLeave,
        handlePlanningDrop,
        handlePlanningUpload,
        clearPlanningFile,
        getFileType,

        // Navigation
        handleGoToImportTracking
    }
}
