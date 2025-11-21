import { ref, computed, onMounted } from 'vue'
import { alertService } from '@/services/alertService'

// Types
interface Job {
    id: number
    reference: string
    statut: string
    n_comptage: number
    equipe: string
    nbr_emplacement: number
    nbr_emplacement_restant: number
    premier_operateur: string
    deuxieme_operateur: string
}

interface Warehouse {
    id: number
    name: string
}

interface Operator {
    id: number
    name: string
}

interface PaginationConfig {
    page: number
    pageSize: number
    total: number
}

interface AssignFormData {
    firstOperator: string
    secondOperator: string
}

/**
 * Composable pour la gestion de la page des jobs
 * Gère l'état, les données et les actions de la page JobManagement
 */
export function useJobManagementPage() {
    // ===== ÉTAT RÉACTIF =====

    const jobs = ref<Job[]>([])
    const warehouses = ref<Warehouse[]>([])
    const operators = ref<Operator[]>([])
    const selectedWarehouse = ref('')
    const selectedStatus = ref('')
    const selectedJobs = ref<string[]>([])
    const loading = ref(false)
    const showAssignModal = ref(false)

    // Pagination
    const pagination = ref<PaginationConfig>({
        page: 1,
        pageSize: 20,
        total: 0
    })

    // Formulaire d'affectation
    const assignForm = ref<AssignFormData>({
        firstOperator: '',
        secondOperator: ''
    })

    // ===== COMPUTED PROPERTIES =====

    /**
     * Configuration des colonnes du DataTable
     */
    const jobsColumns = computed(() => [
        {
            field: 'id',
            headerName: 'ID',
            hide: true,
            sortable: true
        },
        {
            field: 'reference',
            headerName: 'Référence',
            sortable: true,
            filterable: true,
            width: 150,
            pinned: 'left'
        },
        {
            field: 'statut',
            headerName: 'Statut',
            sortable: true,
            filterable: true,
            dataType: 'select',
            width: 120,
            rendererType: 'badge',
            badgeStyles: [
                { value: 'TRANSFERE', class: 'bg-cyan-100 border-cyan-200 text-cyan-800' },
                { value: 'ENTAME', class: 'bg-yellow-100 border-yellow-200 text-yellow-800' },
                { value: 'CLOTURE', class: 'bg-gray-100 border-gray-200 text-gray-800' }
            ],
            badgeBaseClass: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
            badgeDefaultClass: 'bg-gray-100 border-gray-200 text-gray-800'
        },
        {
            field: 'n_comptage',
            headerName: 'N° Comptage',
            sortable: true,
            width: 100,
            type: 'number'
        },
        {
            field: 'equipe',
            headerName: 'Équipe',
            sortable: true,
            filterable: true,
            width: 120
        },
        {
            field: 'nbr_emplacement',
            headerName: 'Nbr Emplacements',
            sortable: true,
            width: 130,
            type: 'number'
        },
        {
            field: 'nbr_emplacement_restant',
            headerName: 'Restants',
            sortable: true,
            width: 100,
            type: 'number',
            cellRenderer: (params: any) => {
                // Vérification de sécurité pour éviter l'erreur si params.data est undefined
                if (!params || !params.data) {
                    return '0 (0%)'
                }

                const value = params.value || 0
                const total = params.data.nbr_emplacement || 0
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                return `${value} (${percentage}%)`
            }
        },
        {
            field: 'premier_operateur',
            headerName: '1er Opérateur',
            sortable: true,
            filterable: true,
            width: 140
        },
        {
            field: 'deuxieme_operateur',
            headerName: '2e Opérateur',
            sortable: true,
            filterable: true,
            width: 140
        }
    ])

    /**
     * Configuration des actions du DataTable
     */
    const jobsActions = computed(() => [
        {
            label: 'Saisie',
            color: 'primary' as const,
            onClick: (row: any) => {
                alertService.info({ text: `Ouverture de la saisie pour le job ${row.id}` })
            }
        }
    ])

    // ===== MÉTHODES DE CHARGEMENT DES DONNÉES =====

    /**
     * Charge la liste des entrepôts/magasins
     */
    const loadWarehouses = async (): Promise<void> => {
        try {
            // Simuler le chargement des magasins
            warehouses.value = [
                { id: 1, name: 'Magasin Principal' },
                { id: 2, name: 'Magasin Secondaire' },
                { id: 3, name: 'Entrepôt Nord' },
                { id: 4, name: 'Entrepôt Sud' }
            ]
        } catch (error) {
            await alertService.error({ text: 'Erreur lors du chargement des magasins' })
        }
    }

    /**
     * Charge la liste des opérateurs
     */
    const loadOperators = async (): Promise<void> => {
        try {
            // Simuler le chargement des opérateurs
            operators.value = [
                { id: 1, name: 'Jean Dupont' },
                { id: 2, name: 'Marie Martin' },
                { id: 3, name: 'Pierre Durand' },
                { id: 4, name: 'Sophie Laurent' },
                { id: 5, name: 'Lucas Bernard' }
            ]
        } catch (error) {
            await alertService.error({ text: 'Erreur lors du chargement des opérateurs' })
        }
    }

    /**
     * Charge la liste des jobs
     */
    const loadJobs = async (): Promise<void> => {
        try {
            loading.value = true

            // Simuler le chargement des jobs
            const mockJobs: Job[] = [
                {
                    id: 1,
                    reference: 'JOB-2024-001',
                    statut: 'TRANSFERE',
                    n_comptage: 1,
                    equipe: 'Équipe A',
                    nbr_emplacement: 150,
                    nbr_emplacement_restant: 150,
                    premier_operateur: '',
                    deuxieme_operateur: ''
                },
                {
                    id: 2,
                    reference: 'JOB-2024-002',
                    statut: 'ENTAME',
                    n_comptage: 1,
                    equipe: 'Équipe B',
                    nbr_emplacement: 200,
                    nbr_emplacement_restant: 75,
                    premier_operateur: 'Jean Dupont',
                    deuxieme_operateur: 'Marie Martin'
                },
                {
                    id: 3,
                    reference: 'JOB-2024-003',
                    statut: 'CLOTURE',
                    n_comptage: 2,
                    equipe: 'Équipe A',
                    nbr_emplacement: 120,
                    nbr_emplacement_restant: 0,
                    premier_operateur: 'Pierre Durand',
                    deuxieme_operateur: 'Sophie Laurent'
                },
                {
                    id: 4,
                    reference: 'JOB-2024-004',
                    statut: 'TRANSFERE',
                    n_comptage: 1,
                    equipe: 'Équipe C',
                    nbr_emplacement: 180,
                    nbr_emplacement_restant: 0,
                    premier_operateur: 'Lucas Bernard',
                    deuxieme_operateur: 'Jean Dupont'
                },
                {
                    id: 5,
                    reference: 'JOB-2024-005',
                    statut: 'TRANSFERE',
                    n_comptage: 1,
                    equipe: 'Équipe D',
                    nbr_emplacement: 90,
                    nbr_emplacement_restant: 45,
                    premier_operateur: 'Marie Martin',
                    deuxieme_operateur: 'Pierre Durand'
                },
                {
                    id: 6,
                    reference: 'JOB-2024-006',
                    statut: 'ENTAME',
                    n_comptage: 1,
                    equipe: 'Équipe E',
                    nbr_emplacement: 75,
                    nbr_emplacement_restant: 60,
                    premier_operateur: 'Sophie Laurent',
                    deuxieme_operateur: ''
                },
                {
                    id: 7,
                    reference: 'JOB-2024-007',
                    statut: 'CLOTURE',
                    n_comptage: 3,
                    equipe: 'Équipe F',
                    nbr_emplacement: 300,
                    nbr_emplacement_restant: 0,
                    premier_operateur: 'Lucas Bernard',
                    deuxieme_operateur: 'Jean Dupont'
                }
            ]

            jobs.value = mockJobs
            pagination.value.total = mockJobs.length

        } catch (error) {
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
        } finally {
            loading.value = false
        }
    }

    // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

    /**
     * Gestionnaire de changement d'entrepôt
     */
    const onWarehouseChange = (): void => {
        loadJobs()
    }

    /**
     * Gestionnaire de changement de statut
     */
    const onStatusChange = (): void => {
        loadJobs()
    }

    /**
     * Gestionnaire de changement de pagination
     */
    const onPaginationChanged = (event: any): void => {
        pagination.value = { ...pagination.value, ...event }
        loadJobs()
    }

    /**
     * Gestionnaire de changement de tri
     */
    const onSortChanged = (sortModel: any): void => {
        loadJobs()
    }

    /**
     * Gestionnaire de changement de filtre
     */
    const onFilterChanged = (filterModel: any): void => {
        loadJobs()
    }

    /**
     * Gestionnaire de changement de sélection
     */
    const onSelectionChanged = (selectedRows: Set<string>): void => {
        selectedJobs.value = Array.from(selectedRows)
    }

    // ===== ACTIONS =====

    /**
     * Actualise la liste des jobs
     */
    const refreshJobs = (): void => {
        loadJobs()
    }

    /**
     * Exporte les jobs
     */
    const exportJobs = (): void => {
        // Logique d'export
        alertService.success({ text: 'Jobs exportés avec succès' })
    }

    /**
     * Validation en lot des jobs sélectionnés
     */
    const bulkValidate = async (): Promise<void> => {
        const result = await alertService.confirm({
            title: 'Confirmer la validation',
            text: `Valider ${selectedJobs.value.length} job(s) ?`
        })

        if (result.isConfirmed) {
            // Logique de validation en lot
            await alertService.success({ text: `${selectedJobs.value.length} job(s) validé(s)` })
            selectedJobs.value = []
            loadJobs()
        }
    }

    /**
     * Ouvre la modal d'affectation des opérateurs
     */
    const bulkAssign = (): void => {
        if (selectedJobs.value.length === 0) return
        showAssignModal.value = true
    }

    /**
     * Ferme la modal d'affectation
     */
    const closeAssignModal = (): void => {
        showAssignModal.value = false
        assignForm.value = {
            firstOperator: '',
            secondOperator: ''
        }
    }

    /**
     * Confirme l'affectation des opérateurs
     */
    const confirmAssign = async (): Promise<void> => {
        if (!assignForm.value.firstOperator) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins le premier opérateur' })
            return
        }

        // Logique d'affectation
        await alertService.success({
            text: `Opérateurs affectés à ${selectedJobs.value.length} job(s)`
        })

        closeAssignModal()
        selectedJobs.value = []
        loadJobs()
    }

    // ===== INITIALISATION =====

    /**
     * Initialise les données au montage du composant
     */
    const initializeData = async (): Promise<void> => {
        await Promise.all([
            loadWarehouses(),
            loadOperators(),
            loadJobs()
        ])
    }

    // Lifecycle - Initialisation automatique
    onMounted(() => {
        initializeData()
    })

    // ===== EXPOSITION DES PROPRIÉTÉS ET MÉTHODES =====

    return {
        // État réactif
        jobs,
        warehouses,
        operators,
        selectedWarehouse,
        selectedStatus,
        selectedJobs,
        loading,
        showAssignModal,
        pagination,
        assignForm,

        // Propriétés calculées
        jobsColumns,
        jobsActions,

        // Méthodes de chargement
        loadWarehouses,
        loadOperators,
        loadJobs,
        refreshJobs,

        // Gestionnaires d'événements
        onWarehouseChange,
        onStatusChange,
        onPaginationChanged,
        onSortChanged,
        onFilterChanged,
        onSelectionChanged,

        // Actions
        exportJobs,
        bulkValidate,
        bulkAssign,
        closeAssignModal,
        confirmAssign,

        // Initialisation
        initializeData
    }
}
