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
import { ref, computed, markRaw, watch, createApp, h, getCurrentInstance } from 'vue'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS COMPOSABLES =====
// Note: Le DataTable utilise enableAutoManagement, donc pas besoin de useBackendDataTable

// ===== IMPORTS SERVICES =====
import { dataTableService } from '@/services/dataTableService'
import { alertService } from '@/services/alertService'
import { EcartComptageService, type ResolveEcartRequest } from '@/services/EcartComptageService'
import { JobService } from '@/services/jobService'
import { logger } from '@/services/loggerService'

// ===== IMPORTS STORES =====
import { useResultsStore } from '@/stores/results'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { useSessionStore } from '@/stores/session'
import { useJobStore } from '@/stores/job'

// ===== IMPORTS TYPES =====
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { InventoryResult, StoreOption } from '@/interfaces/inventoryResults'
import type { Warehouse } from '@/models/Warehouse'
import type { JobResult } from '@/models/Job'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'
// ===== IMPORTS UTILS =====
// Note: QueryModel est géré automatiquement par le DataTable via enableAutoManagement

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'

// ===== IMPORTS ICÔNES =====
import IconCheck from '@/components/icon/icon-check.vue'
import IconPencil from '@/components/icon/icon-edit.vue'
import IconLaunch from '@/components/icon/icon-launch.vue'
import IconX from '@/components/icon/icon-x.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'

// ===== IMPORTS COMPOSANTS =====
import Modal from '@/components/Modal.vue'
import SelectField from '@/components/Form/SelectField.vue'
import type { SelectOption } from '@/interfaces/form'

// ===== IMPORTS PLUGINS =====
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from '@/i18n'

/**
 * Options pour initialiser le composable useInventoryResults
 *
 * @interface UseInventoryResultsConfig
 * @property {string} [inventoryReference] - Référence de l'inventaire (utilisée pour charger les données)
 * @property {number} [initialInventoryId] - ID initial de l'inventaire (optionnel, peut être chargé via référence)
 */
export interface UseInventoryResultsConfig {
    inventoryReference?: string
    initialInventoryId?: number
}

/**
 * Fonction helper pour afficher une modal avec SelectField pour sélectionner une session
 *
 * @param options - Options pour le select
 * @param title - Titre de la modal
 * @param description - Description à afficher
 * @returns Promise qui se résout avec la valeur sélectionnée ou null si annulé
 */
function showSessionSelectModal(
    options: SelectOption[],
    title: string = 'Sélectionner une session',
    description: string = 'Choisissez la session pour lancer le comptage'
): Promise<string | number | null> {
    return new Promise((resolve) => {
        // Créer un conteneur pour la modal
        const container = document.createElement('div')
        document.body.appendChild(container)

        // Créer l'application Vue
        const app = createApp({
            setup() {
                const showModal = ref<boolean>(true)
                const selectedValue = ref<string | number | null>(null)

                const handleConfirm = () => {
                    showModal.value = false
                    setTimeout(() => {
                        app.unmount()
                        container.remove()
                        resolve(selectedValue.value)
                    }, 300)
                }

                const handleCancel = () => {
                    showModal.value = false
                    setTimeout(() => {
                        app.unmount()
                        container.remove()
                        resolve(null)
                    }, 300)
                }

                const handleSelectChange = (value: string | number | string[] | number[] | null) => {
                    if (value !== null && !Array.isArray(value)) {
                        selectedValue.value = value
                    } else {
                        selectedValue.value = null
                    }
                }

                return () => h(Modal, {
                    modelValue: showModal.value,
                    'onUpdate:modelValue': (value: boolean) => {
                        showModal.value = value
                        if (!value) {
                            handleCancel()
                        }
                    },
                    title,
                    size: 'md'
                }, {
                    default: () => [
                        h('div', { class: 'space-y-6' }, [
                            h('p', {
                                class: 'text-sm text-slate-600 dark:text-slate-400 text-center mb-4'
                            }, description),
                            h(SelectField, {
                                modelValue: selectedValue.value,
                                options,
                                searchable: true,
                                clearable: false,
                                placeholder: 'Rechercher une session...',
                                searchPlaceholder: 'Tapez pour rechercher...',
                                'onUpdate:modelValue': handleSelectChange,
                                class: 'w-full'
                            }),
                            h('div', { class: 'flex justify-end gap-3 mt-6' }, [
                                h('button', {
                                    class: 'px-6 py-3 bg-transparent border-2 border-primary text-primary rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-primary hover:text-white',
                                    onClick: handleCancel
                                }, 'Annuler'),
                                h('button', {
                                    class: 'px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:from-primary-dark hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed',
                                    disabled: selectedValue.value === null,
                                    onClick: handleConfirm
                                }, 'Suivant')
                            ])
                        ])
                    ]
                })
            }
        })

        // Utiliser les plugins nécessaires
        const pinia = createPinia()
        pinia.use(piniaPluginPersistedstate)
        app.use(pinia)
        app.use(i18n)

        // Monter l'application
        app.mount(container)
    })
}

/**
 * Composable pour la gestion des résultats d'inventaire
 *
 * Gère l'affichage, la pagination, le tri, le filtrage et les actions sur les résultats d'inventaire.
 * Utilise le DataTable avec enableAutoManagement pour une gestion automatique complète.
 *
 * @param {UseInventoryResultsConfig} [config] - Configuration d'initialisation
 * @returns {Object} Objet contenant l'état, les données, les colonnes, les actions et les méthodes
 *
 * @example
 * ```typescript
 * const {
 *   loading,
 *   results,
 *   columns,
 *   actions,
 *   selectedStore,
 *   inventoryId,
 *   pagination,
 *   handleStoreSelect,
 *   initialize,
 *   showLaunchCountingModal
 * } = useInventoryResults({ inventoryReference: 'INV-2024-001' })
 * ```
 */
export function useInventoryResults(config?: UseInventoryResultsConfig) {
    const resultsStore = useResultsStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()
    const sessionStore = useSessionStore()
    const jobStore = useJobStore()

    const {
        selectedStore,
        stores: storeOptionsFromStore,
        paginationMetadata: resultsPaginationMetadata
    } = storeToRefs(resultsStore)

    const { warehouses, loading: warehousesLoading } = storeToRefs(warehouseStore)

    // ===== ÉTAT LOCAL =====
    const inventoryReference = ref(config?.inventoryReference || '')
    const inventoryId = ref<number | null>(config?.initialInventoryId || null)
    const accountId = ref<number | null>(null)
    const isInitialized = ref(false)

    /** Objet inventaire complet (pour accéder rapidement aux warehouses) */
    const inventory = ref<any | null>(null)

    // Mode de sortie pour les requêtes
    // ⚠️ Le DataTable utilise maintenant uniquement QueryModel selon FRONTEND_QUERYMODEL_GUIDE.md
    // Plus besoin de queryOutputMode

    // États pour les magasins
    const storeOptions = ref<StoreOption[]>([])
    const usesWarehouseFallback = ref(false)

    // ===== HANDLERS DATATABLE =====

    // Cache des derniers appels pour éviter les appels répétés
    let lastResultsQueryModel: QueryModel | null = null

    /**
     * Handler unifié pour toutes les opérations de la DataTable Results
     * Utilise la ref pour identifier l'instance et éviter les conflits
     * Évite les appels API répétés avec le même QueryModel
     */
    const onResultsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        // Vérifier que les IDs requis sont disponibles avant de lancer l'API
        if (!inventoryId.value || !selectedStore.value) {
            console.warn('[useInventoryResults] Results API not called: missing inventoryId or selectedStore')
            return
        }

        // Vérifier si le QueryModel a changé depuis le dernier appel
        const queryModelStr = JSON.stringify(queryModel)
        const lastQueryModelStr = lastResultsQueryModel ? JSON.stringify(lastResultsQueryModel) : null

        if (queryModelStr === lastQueryModelStr) {
            return
        }

        try {
            // Appeler l'API avec les paramètres personnalisés
            const finalQueryModel = {
                ...queryModel,
                customParams: {
                    inventory_id: inventoryId.value,
                    store_id: selectedStore.value
                }
            }

            await resultsStore.fetchResultsAuto(finalQueryModel)
            lastResultsQueryModel = { ...queryModel } // Copier pour éviter les références
        } catch (error) {
            console.error('[useInventoryResults] Error in resultsStore.fetchResultsAuto:', error)
            await alertService.error({ text: 'Erreur lors du chargement des résultats' })
        }
    }

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

    // Watch pour sélectionner automatiquement le premier magasin quand il devient disponible
    // DÉSACTIVÉ : Le chargement est maintenant géré directement dans initialize() pour éviter les chargements multiples
    // watch([storeOptions, inventoryId, selectedStore], ([newStores, newInventoryId, currentSelectedStore]) => {
    //     // Si on a des magasins, un inventaire, et qu'aucun magasin n'est sélectionné
    //     if (newStores.length > 0 && newInventoryId && !currentSelectedStore) {
    //         const firstStoreId = newStores[0].value
    //         resultsStore.setSelectedStore(firstStoreId)

    //         // Charger les résultats pour le premier magasin (en arrière-plan pour ne pas bloquer)
    //         const queryModel: QueryModel = {
    //             page: 1,
    //             pageSize: pageSize.value || 20,
    //             sort: undefined,
    //             filters: undefined,
    //             search: undefined,
    //             customParams: {
    //                 inventory_id: newInventoryId,
    //                 store_id: firstStoreId
    //             }
    //         }
    //         resultsStore.fetchResultsAuto(queryModel).catch((error) => {
    //             logger.warn('Erreur lors du chargement automatique des résultats', error)
    //         })
    //     }
    // }, { immediate: false })

    syncStoreOptions(storeOptionsFromStore.value)

    // ===== DONNÉES DU STORE =====
    /**
     * Les données et l'état sont gérés directement par le store Pinia.
     * Le DataTable utilise enableAutoManagement avec fetchResultsAuto du store pour charger
     * automatiquement les données selon la pagination, tri, filtrage et recherche.
     */
    const { results, loading: resultsLoading } = storeToRefs(resultsStore)

    /**
     * État de chargement global des résultats
     *
     * @computed {boolean} loading - True si les résultats sont en cours de chargement
     */
    const loading = computed(() => resultsLoading.value)

    // ===== COMPUTED =====

    /**
     * Vérifie si des résultats sont disponibles
     */
    const hasResults = computed(() => results.value.length > 0)

    /**
     * Pagination calculée pour les résultats
     *
     * Utilise UNIQUEMENT les valeurs retournées par le backend via paginationMetadata du store.
     * Le backend retourne { page, pageSize, total, totalPages } selon PAGINATION_FRONTEND.md.
     *
     * Le DataTable utilise ces valeurs pour afficher la pagination correctement.
     *
     * @computed {Object} resultsPaginationComputed - Objet de pagination avec les valeurs du backend
     * @computed {number} current_page - Page actuelle (1-indexed)
     * @computed {number} total_pages - Nombre total de pages
     * @computed {boolean} has_next - True s'il y a une page suivante
     * @computed {boolean} has_previous - True s'il y a une page précédente
     * @computed {number} page_size - Taille de la page
     * @computed {number} total - Nombre total d'éléments
     */
    const resultsPaginationComputed = computed(() => {
        const storeMetadata = resultsPaginationMetadata.value

        // Utiliser directement les valeurs du backend depuis paginationMetadata
        const currentPageValue = storeMetadata?.page ?? 1
        const pageSizeValue = storeMetadata?.pageSize ?? 20
        const totalValue = storeMetadata?.total ?? 0
        let totalPagesValue = storeMetadata?.totalPages ?? 0

        // Calculer totalPages seulement si le backend ne le fournit pas
        if (totalPagesValue === 0 && totalValue > 0 && pageSizeValue > 0) {
            totalPagesValue = Math.max(1, Math.ceil(totalValue / pageSizeValue))
        } else if (totalPagesValue === 0 && totalValue === 0) {
            // Si total est 0, totalPages doit être au minimum 1 pour éviter "Page 1 sur 0"
            totalPagesValue = 1
        }

        return {
            current_page: currentPageValue,
            total_pages: totalPagesValue,
            has_next: totalPagesValue > 0 ? currentPageValue < totalPagesValue : false,
            has_previous: currentPageValue > 1,
            page_size: pageSizeValue,
            total: totalValue
        }
    })

    // ===== COLONNES DYNAMIQUES =====

    /**
     * Interface étendue pour les résultats avec labels de comptage et d'écart
     *
     * @interface ResultWithLabels
     * @extends {InventoryResult}
     */
    interface ResultWithLabels extends InventoryResult {
        __countingLabels?: Record<string, string>;
        __differenceLabels?: Record<string, string>;
    }

    /**
     * Colonnes du DataTable construites dynamiquement selon les champs présents dans les données
     *
     * Les colonnes sont détectées automatiquement :
     * - Colonnes fixes : JOB, Emplacement, Article, Résolu, Résultat final
     * - Colonnes de comptage : contage_1, contage_2, contage_3, etc. (détectées dynamiquement)
     * - Colonnes d'écart : ecart_1_2, ecart_2_3, etc. (détectées dynamiquement)
     * - Colonnes de statut : statut_1er_comptage, statut_2eme_comptage, etc. (détectées dynamiquement)
     *
     * L'ordre d'affichage est : JOB, Emplacement, Article, Comptages/Écarts intercalés, Statuts, Résolu, Résultat final
     *
     * @computed {DataTableColumn[]} columns - Colonnes configurées pour le DataTable
     */

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
            // Pattern modifié pour accepter tous les formats d'écart :
            // - ecart_1_2 (deux nombres)
            // - ecart_1_2_3 (trois nombres)
            // - ecart_1_2_3_4 (quatre nombres ou plus)
            // Pattern: ecart_ suivi d'au moins un chiffre, puis un ou plusieurs groupes de _chiffres
            return Object.keys(results.value[0])
                .filter(key => /^ecart_\d+(_\d+)+$/.test(key))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        };

        const inferDifferenceLabel = (field: string) => {
            // Pattern modifié pour extraire tous les nombres de l'écart
            // Exemples :
            // - ecart_1_2 -> "Écart 1-2"
            // - ecart_2_3 -> "Écart 3" (prendre le dernier nombre)
            // - ecart_3_4 -> "Écart 4"
            // - ecart_4_5 -> "Écart 5"
            const match = field.match(/^ecart_((?:\d+_?)+)$/);
            if (!match) return 'Écart';

            // Extraire tous les nombres
            const numbers = match[1].split('_').filter(n => n.length > 0);
            if (numbers.length === 0) return 'Écart';

            // Si c'est ecart_1_2, garder le format "Écart 1-2"
            if (numbers.length === 2 && numbers[0] === '1' && numbers[1] === '2') {
                return `Écart ${numbers[0]}-${numbers[1]}`;
            }

            // Pour les autres écarts, prendre le dernier nombre (ex: ecart_2_3 -> "Écart 3")
            // Ignorer les labels du backend pour forcer notre format
            const lastNumber = numbers[numbers.length - 1];
            return `Écart ${lastNumber}`;
        };

        const inferStatusFields = () => {
            if (!results.value.length) return [] as string[];
            // Détecter les champs de statut de comptage
            // Formats possibles : statut_1er_comptage, statut_1_comptage, statut_1, statut_2eme_comptage, etc.
            return Object.keys(results.value[0])
                .filter(key => {
                    const normalized = key.toLowerCase();
                    // Pattern pour statut_X ou statut_X_comptage ou statut_Xer_comptage ou statut_Xeme_comptage
                    return /^statut_\d+(?:er|eme)?(?:_comptage)?$/i.test(key) ||
                           /^statut_(?:1er|2eme|3eme|premier|deuxieme|troisieme)(?:_comptage)?$/i.test(key);
                })
                .sort((a, b) => {
                    // Extraire le numéro pour trier
                    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                    return numA - numB;
                });
        };

        const inferStatusLabel = (field: string) => {
            if (!results.value.length) return 'Statut comptage';

            // Extraire le numéro du comptage
            const match = field.match(/(\d+)|(1er|premier)|(2eme|deuxieme)|(3eme|troisieme)/i);
            if (match) {
                let order: number;
                if (match[1]) {
                    order = parseInt(match[1]);
                } else if (match[2]) {
                    order = 1;
                } else if (match[3]) {
                    order = 2;
                } else if (match[4]) {
                    order = 3;
            } else {
                    order = 1;
                }

                const suffix = order === 1 ? 'er' : 'ème';
                return `Statut ${order}${suffix} comptage`;
            }

            return 'Statut comptage';
        };

        const sortedCountingFields = inferCountingFields();
        const sortedStatusFields = inferStatusFields();
        const sortedDifferenceFields = inferDifferenceFields();

        const cols: DataTableColumn[] = [
            // {
            //     headerName: 'ID',
            //     field: 'id',
            //     sortable: true,
            //     dataType: 'number' as ColumnDataType,
            //     filterable: true,
            //     width: 80,
            //     editable: false,
            //     hide: true,
            //     draggable: true,
            //     autoSize: true,
            //     description: 'Identifiant unique'
            // },
            {
                headerName: 'JOB',
                field: 'job_reference',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                width: dataTableService.calculateOptimalColumnWidth({
                    field: 'job_reference',
                    headerName: 'JOB',
                    dataType: 'text'
                }),
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-box',
                description: 'Référence du job',
                priority: 10 // Priorité haute - toujours visible
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
                description: 'Emplacement de l\'article',
                priority: 9 // Priorité haute
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
                description: 'Référence de l\'article',
                priority: 8, // Priorité haute
                flex: 2 // Plus d'espace pour cette colonne importante
            }
        ];

        // Ajouter les comptages avec badges de statut
        sortedCountingFields.forEach((field, index) => {
            const comptageNum = index + 1; // Numéro du comptage (1, 2, 3, etc.)

            cols.push({
                headerName: inferCountingLabel(field, index),
                field,
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                width: 120,
                minWidth: 100,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-calculator',
                description: `Valeur du comptage ${comptageNum}`,
                priority: comptageNum <= 2 ? 7 : 5, // Priorité plus élevée pour les premiers comptages
                badgeStyles: [
                    {
                        value: 'EN ATTENTE',
                        class: 'inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-900 ring-1 ring-slate-300/20 ring-inset'
                    },
                    {
                        value: 'VALIDE',
                        class: 'inline-flex items-center rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
                    },
                    {
                        value: 'AFFECTE',
                        class: 'inline-flex items-center rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-teal-600/20 ring-inset'
                    },
                    {
                        value: 'PRET',
                        class: 'inline-flex items-center rounded-md bg-purple-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-purple-600/20 ring-inset'
                    },
                    {
                        value: 'TRANSFERT',
                        class: 'inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset'
                    },
                    {
                        value: 'TERMINE',
                        class: 'inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset'
                    },
                    {
                        value: 'ENTAME',
                        class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset'
                    }
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
                cellRenderer: ((value: any, column?: any, row?: any) => {
                    // Déterminer les données de la ligne
                    let rowData: any = null;

                    if (column && row) {
                        rowData = row;
                    } else if (value && typeof value === 'object' && value.data) {
                        rowData = value.data;
                    } else if (value && typeof value === 'object') {
                        rowData = value;
                    }

                    // Récupérer la valeur du comptage
                    const comptageValue = value;
                    if (comptageValue === undefined || comptageValue === null || comptageValue === '') {
                        return '-';
                    }

                    // Déterminer le champ de statut correspondant
                    // field est comme "1er comptage", "2er comptage", etc.
                    // statutField doit être "statut_1er_comptage", "statut_2er_comptage", etc.
                    // Remplacer l'espace par un underscore
                    const statusField = `statut_${field.replace(' ', '_')}`;
                    const statusValue = rowData?.[statusField] || '';

                    // Appliquer le badge selon le statut
                    const badgeStyles = column?.badgeStyles as Array<{value: string, class: string}> | undefined;
                    const badgeDefaultClass = column?.badgeDefaultClass || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset';

                    const badgeStyle = badgeStyles?.find((s: any) => s.value === statusValue);
                    const badgeClass = badgeStyle?.class || badgeDefaultClass;

                    return `<span class="${badgeClass}">${comptageValue}</span>`;
                }) as any
            });
        });

        // Ajouter tous les écarts avec logique différenciée
        sortedDifferenceFields.forEach((ecartField) => {
            // Déterminer le type d'affichage selon le numéro d'écart
            const isEcart1_2 = ecartField.toLowerCase() === 'ecart_1_2';
            const isEcart2_3 = ecartField.toLowerCase() === 'ecart_2_3';

            cols.push({
                headerName: inferDifferenceLabel(ecartField),
                field: ecartField,
                sortable: true,
                dataType: isEcart2_3 ? 'boolean' as ColumnDataType : 'number' as ColumnDataType,
                filterable: true,
                width: 120,
                minWidth: 100,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-trending-up',
                description: 'Écart entre les comptages',
                priority: 4, // Priorité basse pour écarts
                cellRenderer: ((value: any) => {
                    if (value === undefined || value === null || value === '') {
                        return '-';
                    }

                    // Logique différenciée selon le type d'écart
                    if (isEcart1_2) {
                        // ecart_1_2 : valeur numérique avec couleurs
                        const numValue = Number(value);
                        if (Number.isNaN(numValue)) {
                            return '-';
                        }
                        const color = numValue === 0 ? 'text-green-600' : 'text-red-600';
                        return `<span class="${color} font-semibold">${numValue}</span>`;
                    } else if (isEcart2_3) {
                        // ecart_2_3 : boolean avec icônes
                        const boolValue = value === true || value === 'true' || value === 1 || value === '1';
                        if (boolValue) {
                            return `<span class="inline-flex items-center justify-center text-green-600">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                </svg>
                            </span>`;
                        } else {
                            return `<span class="inline-flex items-center justify-center text-red-600">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                </svg>
                            </span>`;
                        }
                    } else {
                        // ecart_3_4, ecart_4_5, etc. : valeur numérique entière
                        const numValue = Number(value);
                        if (Number.isNaN(numValue)) {
                            return '-';
                        }
                        // Afficher simplement la valeur entière
                        const color = numValue === 0 ? 'text-green-600' : 'text-blue-600';
                        return `<span class="${color} font-semibold">${numValue}</span>`;
                    }
                }) as any
            });
        });

        // Ajouter les colonnes de statut des comptages après tous les comptages et écarts
        sortedStatusFields.forEach((field, index) => {
            const statusNum = index + 1
            cols.push({
                headerName: inferStatusLabel(field),
                field,
                sortable: true,
                dataType: 'select' as ColumnDataType,
                filterable: true,
                width: 150,
                minWidth: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-status',
                description: 'Statut du comptage',
                priority: statusNum <= 2 ? 3 : 2, // Priorité basse
                badgeStyles: [
                    {
                        value: 'ENTAME',
                        class: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset'
                    },
                    {
                        value: 'TERMINE',
                        class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset'
                    },
                    {
                        value: 'VALIDE',
                        class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset'
                    },
                    {
                        value: 'EN ATTENTE',
                        class: 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset'
                    },
                    {
                        value: 'TRANSFERT',
                        class: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset'
                    }
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
                cellRenderer: (value: any, column: any, row: any) => {
                    const status = value || ''
                    if (!status) return '-'

                    // Trouver le style de badge pour ce statut
                    const badgeStyle = column.badgeStyles?.find((s: any) => s.value === status)
                    const defaultClass = column.badgeDefaultClass || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
                    const badgeClass = badgeStyle?.class || defaultClass

                    return `<span class="${badgeClass}">${status}</span>`
                }
            } as any);
        });

        // Colonne "Résolu" avec icône
        cols.push({
            headerName: 'Résolu',
            field: 'resolved',
            sortable: true,
            dataType: 'boolean' as ColumnDataType,
            filterable: true,
            width: 100,
            minWidth: 80,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            align: 'center',
            description: 'Statut de résolution de l\'écart',
            priority: 1, // Priorité très basse
            cellRenderer: (value: any) => {
                const isResolved = value === true || value === 'true' || value === 1 || value === '1'
                if (isResolved) {
                    return `<div class="flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                    </div>`
                } else {
                    return `<div class="flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                    </div>`
                }
            }
        });

        cols.push({
            headerName: 'Résultat final',
            field: 'resultats',
            sortable: true,
            dataType: 'number' as ColumnDataType,
            filterable: true,
            width: 140,
            minWidth: 120,
            editable: true,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-check-circle',
            description: 'Résultat final validé',
            priority: 7 // Priorité haute - important
        });

        return cols;
    });

    // Validation des colonnes
    columns.value.forEach(column => {
        const validation = dataTableService.validateColumnConfig(column)
        if (!validation.isValid) {
            // Configuration de colonne invalide
        }
    })

    // ===== NOTE SUR QUERYMODEL =====
    // Le DataTable utilise enableAutoManagement avec fetchResultsAuto du store
    // Le QueryModel est géré automatiquement par le DataTable via useAutoDataTable
    // Pas besoin de gérer QueryModel manuellement dans ce composable

    // ===== ACTIONS =====

    /**
     * Fonction helper pour extraire l'ID de l'écart de comptage depuis le résultat
     *
     * Recherche l'ID dans l'ordre de priorité suivant :
     * 1. ecart_comptage_id directement dans le résultat
     * 2. ecart_comptage_id dans le job (si job est un objet)
     * 3. ecart_comptage_id dans les assignments
     * 4. ecart_id dans le résultat (fallback pour compatibilité)
     * 5. ecart_id dans le job ou assignments (fallback)
     *
     * @param {InventoryResult} result - Résultat d'inventaire
     * @returns {number | string | null} ID de l'écart de comptage ou null si non trouvé
     *
     * @example
     * ```typescript
     * const ecartId = extractEcartComptageId(result)
     * if (ecartId) {
     *   await EcartComptageService.updateFinalResult(ecartId, { final_result: 100 })
     * }
     * ```
     */
    const extractEcartComptageId = (result: InventoryResult): number | string | null => {
        // Priorité 1 : ecart_comptage_id directement dans le résultat
        if ((result as any).ecart_comptage_id !== undefined && (result as any).ecart_comptage_id !== null && (result as any).ecart_comptage_id !== '') {
            return (result as any).ecart_comptage_id
        }

        // Priorité 2 : ecart_comptage_id dans le job (si le job est un objet)
        const job = (result as any).job
        if (job && typeof job === 'object') {
            if (job.ecart_comptage_id !== undefined && job.ecart_comptage_id !== null && job.ecart_comptage_id !== '') {
                return job.ecart_comptage_id
            }
            // Chercher aussi dans job_id si c'est un objet
            if (job.job_id && typeof job.job_id === 'object' && job.job_id.ecart_comptage_id) {
                return job.job_id.ecart_comptage_id
            }
        }

        // Priorité 3 : ecart_comptage_id dans les assignments
        const assignments = (result as any).assignments || (result as any).assignment
        if (assignments) {
            // Si c'est un tableau
            if (Array.isArray(assignments)) {
                for (const assignment of assignments) {
                    if (assignment && typeof assignment === 'object') {
                        if (assignment.ecart_comptage_id !== undefined && assignment.ecart_comptage_id !== null && assignment.ecart_comptage_id !== '') {
                            return assignment.ecart_comptage_id
                        }
                    }
                }
            }
            // Si c'est un objet unique
            else if (typeof assignments === 'object') {
                if (assignments.ecart_comptage_id !== undefined && assignments.ecart_comptage_id !== null && assignments.ecart_comptage_id !== '') {
                    return assignments.ecart_comptage_id
                }
            }
        }

        // Priorité 4 : Fallback vers ecart_id pour compatibilité (si ecart_comptage_id n'est pas trouvé)
        if (result.ecart_id !== undefined && result.ecart_id !== null && result.ecart_id !== '') {
            return result.ecart_id
        }

        // Priorité 5 : ecart_id dans le job (fallback)
        const jobFallback = (result as any).job
        if (jobFallback && typeof jobFallback === 'object') {
            if (jobFallback.ecart_id !== undefined && jobFallback.ecart_id !== null && jobFallback.ecart_id !== '') {
                return jobFallback.ecart_id
            }
        }

        // Priorité 6 : ecart_id dans les assignments (fallback)
        const assignmentsFallback = (result as any).assignments || (result as any).assignment
        if (assignmentsFallback) {
            if (Array.isArray(assignmentsFallback)) {
                for (const assignment of assignmentsFallback) {
                    if (assignment && typeof assignment === 'object' && assignment.ecart_id !== undefined && assignment.ecart_id !== null && assignment.ecart_id !== '') {
                        return assignment.ecart_id
                    }
                }
            } else if (typeof assignmentsFallback === 'object' && assignmentsFallback.ecart_id !== undefined && assignmentsFallback.ecart_id !== null && assignmentsFallback.ecart_id !== '') {
                return assignmentsFallback.ecart_id
            }
        }

        return null
    }

    /**
     * Actions disponibles pour chaque ligne de résultat
     *
     * Chaque action est affichée comme un bouton dans la colonne d'actions du DataTable.
     *
     * Actions disponibles :
     * - **Modifier** : Modifier le résultat final avec justification optionnelle
     * - **Valider** : Valider l'écart de comptage avec justification optionnelle
     *
     * @constant {ActionConfig<InventoryResult>[]} actions - Configuration des actions
     */
    const actions: ActionConfig<InventoryResult>[] = [
        {
            label: 'Modifier',
            icon: markRaw(IconPencil),
            color: 'primary',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire l'ID de l'écart de comptage depuis le résultat, le job ou les assignments
                    const ecartComptageId = extractEcartComptageId(result)

                    if (!ecartComptageId) {
                        await alertService.error({ text: 'ID de l\'écart de comptage (ecart_comptage_id) manquant dans les données. Vérifiez que le job ou les assignments contiennent un ecart_comptage_id.' })
                        return
                    }

                    // Première popup : Saisie de la nouvelle valeur
                    const swalResult = await Swal.fire({
                        title: 'Modifier le résultat final',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Entrez la nouvelle valeur du résultat final
                                </p>
                            </div>
                        `,
                        input: 'number',
                        inputPlaceholder: String(result.resultats ?? ''),
                        inputValue: result.resultats ?? '',
                        inputAttributes: {
                            min: '0',
                            step: '1'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Suivant',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#FECD1C',
                        inputValidator: (value) => {
                            if (!value || value === '') {
                                return 'Veuillez entrer une valeur'
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
                            cancelButton: 'btn-cancel-primary'
                        }
                    })

                    if (!swalResult.isConfirmed || swalResult.value === undefined || swalResult.value === null) {
                        return
                    }

                    const newValue = Number(swalResult.value)

                    // Deuxième popup : Justification (optionnelle)
                    const justificationResult = await Swal.fire({
                        title: 'Justification (optionnelle)',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Vous pouvez ajouter une justification pour cette modification
                                </p>
                            </div>
                        `,
                        input: 'textarea',
                        inputPlaceholder: 'Ex: Ajustement manuel après contrôle...',
                        inputAttributes: {
                            rows: '4'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Confirmer',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#FECD1C',
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn-cancel-primary'
                        }
                    })

                    if (!justificationResult.isConfirmed) {
                        return
                    }

                    // Appeler l'API de mise à jour du résultat final
                    // Construire le payload : inclure justification seulement si elle est renseignée
                    const updatePayload: { final_result: number; justification?: string } = {
                        final_result: newValue
                    }
                    if (justificationResult.value && typeof justificationResult.value === 'string' && justificationResult.value.trim()) {
                        updatePayload.justification = justificationResult.value.trim()
                    }
                    await EcartComptageService.updateFinalResult(Number(ecartComptageId), updatePayload)

                    await alertService.success({ text: 'Résultat final modifié avec succès' })
                    await reloadResults()
                } catch (error: any) {
                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.response?.data?.message ||
                                        error?.message ||
                                        'Erreur lors de la modification du résultat final'

                    await alertService.error({ text: errorMessage })
                }
            },
            show: () => true
        },
        {
            label: 'Valider',
            icon: markRaw(IconCheck),
            color: 'success',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire l'ID de l'écart de comptage depuis le résultat, le job ou les assignments
                    const ecartComptageId = extractEcartComptageId(result)

                    if (!ecartComptageId) {
                        await alertService.error({ text: 'ID de l\'écart de comptage (ecart_comptage_id) manquant dans les données. Vérifiez que le job ou les assignments contiennent un ecart_comptage_id.' })
                        return
                    }

                    // Vérifier que le résultat final est renseigné
                    if (!result.resultats && result.resultats !== 0) {
                        await alertService.warning({
                            text: 'Le résultat final doit être renseigné avant de pouvoir valider l\'écart'
                        })
                        return
                    }

                    const confirmation = await Swal.fire({
                        title: 'Valider l\'écart',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Voulez-vous vraiment valider cet écart de comptage ?
                                </p>
                                <div style="background: #f9fafb; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
                                    <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">Résultat final :</div>
                                    <div style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">${result.resultats ?? 'Non défini'}</div>
                                </div>
                            </div>
                        `,
                        input: 'textarea',
                        inputPlaceholder: 'Justification (optionnelle)...',
                        inputAttributes: {
                            rows: '4'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Valider',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#10B981',
                        cancelButtonColor: '#FECD1C',
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-success',
                            cancelButton: 'btn-cancel-primary'
                        }
                    })

                    if (!confirmation.isConfirmed) {
                        return
                    }

                    // Appeler l'API de résolution de l'écart (qui correspond à la validation)
                    // Construire le payload : inclure justification seulement si elle est renseignée
                    const resolvePayload: ResolveEcartRequest = {}
                    if (confirmation.value && typeof confirmation.value === 'string' && confirmation.value.trim()) {
                        resolvePayload.justification = confirmation.value.trim()
                    }
                    await EcartComptageService.resolveEcart(Number(ecartComptageId), resolvePayload)

                    await alertService.success({ text: 'Écart validé avec succès' })
                    await reloadResults()
                } catch (error: any) {
                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.response?.data?.message ||
                                        error?.message ||
                                        'Erreur lors de la validation de l\'écart'

                    await alertService.error({ text: errorMessage })
                }
            },
            show: () => true
        },
    ]

    // ===== MÉTHODES DE CHARGEMENT =====

    /**
     * Récupère les magasins disponibles pour l'inventaire
     *
     * Utilise une stratégie d'optimisation multi-niveaux pour charger les magasins le plus rapidement possible :
     *
     * 1. **PRIORITÉ ABSOLUE** : Utilise les warehouses depuis l'inventaire déjà chargé (instantané)
     * 2. **PRIORITÉ 1** : Charge via account_id si disponible (rapide, ~100-200ms)
     * 3. **PRIORITÉ 2** : Charge via API inventaire avec timeout court (500ms max)
     * 4. **FALLBACK** : Utilise les magasins déjà dans le store
     *
     * Un cache est utilisé pour éviter les appels répétés.
     *
     * @async
     * @returns {Promise<void>} Promise qui se résout une fois les magasins chargés
     *
     * @example
     * ```typescript
     * await fetchStores()
     * // Les magasins sont maintenant disponibles dans storeOptions
     * ```
     */
    const storesLoadingState = ref(false)
    const storesCache = ref<StoreOption[] | null>(null)

    const fetchStores = async () => {
        if (!inventoryId.value) {
            return
        }

        // Éviter les appels multiples simultanés
        if (storesLoadingState.value) {
            return
        }

        // Utiliser le cache si disponible et valide (évite les appels répétés)
        if (storesCache.value && storesCache.value.length > 0) {
            syncStoreOptions(storesCache.value)
            return
        }

        storesLoadingState.value = true

        try {
            // OPTIMISATION 0 : PRIORITÉ ABSOLUE - Utiliser les warehouses depuis l'inventaire (instantané)
            // Si l'inventaire est déjà chargé et contient des warehouses, les utiliser directement
            // C'est la méthode la plus rapide car les données sont déjà en mémoire
            if (inventory.value && inventory.value.warehouses && Array.isArray(inventory.value.warehouses) && inventory.value.warehouses.length > 0) {
                const inventoryWarehouses = inventory.value.warehouses
                const storeList: StoreOption[] = inventoryWarehouses.map((wh: any) => ({
                    label: wh.warehouse_name || wh.reference || `Entrepôt ${wh.id || wh.warehouse_id}`,
                    value: String(wh.id || wh.warehouse_id)
                }))
                syncStoreOptions(storeList)
                storesCache.value = storeList
                storesLoadingState.value = false
                logger.debug('Magasins chargés depuis l\'inventaire (instantané)', { count: storeList.length })
                return
            }

            // OPTIMISATION 1 : Priorité à account_id (beaucoup plus rapide que fetchStores)
            // Cet endpoint est optimisé et retourne rapidement (~100-200ms)
            if (accountId.value) {
                try {
                    // OPTIMISATION : Ne pas attendre si les warehouses sont déjà dans le store
                    if (warehouses.value.length > 0) {
                        syncStoreOptions(null) // Utiliser les warehouses du store
                        storesCache.value = storeOptions.value
                        storesLoadingState.value = false
                        logger.debug('Magasins utilisés depuis le store (déjà chargés)', { count: storeOptions.value.length })
                        return
                    }

                    await warehouseStore.fetchWarehouses(accountId.value)
                    syncStoreOptions(null) // Utiliser les warehouses du store

                    // Si on a des magasins, les mettre en cache et retourner immédiatement
                    if (storeOptions.value.length > 0) {
                        storesCache.value = storeOptions.value
                        storesLoadingState.value = false
                        logger.debug('Magasins chargés via account_id', { count: storeOptions.value.length })
                        return
                    }
                } catch (error) {
                    // En cas d'erreur, continuer avec le fallback
                    logger.warn('Erreur lors du chargement des magasins par account_id', error)
                }
            }

            // OPTIMISATION 2 : Fallback via inventaire avec timeout très court (500ms au lieu de 1s)
            // Seulement si account_id n'est pas disponible ou a échoué
            // Cet endpoint peut être lent, d'où le timeout très court
            try {
                const inventoryStores = await Promise.race([
                    resultsStore.fetchStores(inventoryId.value),
                    new Promise<StoreOption[] | null>((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout après 500ms')), 500)
                    )
                ]) as StoreOption[]

                if (inventoryStores && inventoryStores.length > 0) {
                    syncStoreOptions(inventoryStores)
                    storesCache.value = inventoryStores
                    storesLoadingState.value = false
                    logger.debug('Magasins chargés via inventaire (API)', { count: inventoryStores.length })
                    return
                }
            } catch (error) {
                // Timeout ou erreur - ignorer silencieusement (pas bloquant)
                logger.debug('Timeout ou erreur lors du chargement des magasins depuis l\'inventaire', error)
            }

            // OPTIMISATION 3 : Dernier recours - utiliser les magasins déjà dans le store
            // Si disponibles (peuvent avoir été chargés précédemment)
            if (storeOptionsFromStore.value.length > 0) {
                syncStoreOptions(storeOptionsFromStore.value)
                storesCache.value = storeOptionsFromStore.value
                logger.debug('Magasins utilisés depuis le store', { count: storeOptionsFromStore.value.length })
            }
        } catch (error) {
            // Ne pas afficher d'erreur bloquante, utiliser ce qu'on a
            logger.warn('Erreur lors du chargement des magasins', error)
        } finally {
            storesLoadingState.value = false
        }
    }

    /**
     * Recharge les résultats actuels
     *
     * ⚠️ NOTE: Avec enableAutoManagement, le rechargement est géré automatiquement par le DataTable.
     * Cette fonction est conservée pour compatibilité avec les actions qui l'appellent,
     * mais ne fait rien car le DataTable gère le rechargement automatiquement.
     *
     * @deprecated Le DataTable gère automatiquement le rechargement via autoManagement
     * @returns Promise vide (pour compatibilité)
     */
    const reloadResults = async () => {
        // Le DataTable avec enableAutoManagement gère automatiquement le rechargement
        // Cette fonction est un no-op pour compatibilité
        logger.debug('reloadResults appelé - le DataTable gère automatiquement le rechargement')
    }

    /**
     * Récupère l'inventaire par sa référence
     *
     * Charge l'inventaire depuis le store et stocke l'inventaire complet pour accès rapide aux warehouses.
     * Si l'inventaire contient déjà des warehouses, ils sont utilisés directement (optimisation).
     *
     * @async
     * @param {string} reference - Référence de l'inventaire
     * @returns {Promise<any>} Promise qui se résout avec l'inventaire chargé
     * @throws {Error} Si l'inventaire est introuvable
     *
     * @example
     * ```typescript
     * const inventory = await fetchInventoryByReference('INV-2024-001')
     * // inventory.id et inventory.warehouses sont maintenant disponibles
     * ```
     */
    const fetchInventoryByReference = async (reference: string) => {
        try {
            const fetchedInventory = await inventoryStore.fetchInventoryByReference(reference)
            if (fetchedInventory) {
                // Stocker l'inventaire complet pour accéder rapidement aux warehouses
                inventory.value = fetchedInventory
                inventoryId.value = fetchedInventory.id
                const newAccountId = fetchedInventory.account_id || null
                accountId.value = newAccountId

                // OPTIMISATION : Si l'inventaire contient déjà des warehouses, les utiliser directement
                // Sinon, précharger les magasins si account_id disponible
                if (fetchedInventory.warehouses && Array.isArray(fetchedInventory.warehouses) && fetchedInventory.warehouses.length > 0) {
                    // Les warehouses sont déjà dans l'inventaire, fetchStores les utilisera instantanément
                    fetchStores().catch(() => {
                        // Ignorer les erreurs, elles sont gérées dans fetchStores
                    })
                } else if (newAccountId) {
                    // Pas de warehouses dans l'inventaire, charger via account_id
                    fetchStores().catch(() => {
                        // Ignorer les erreurs, elles sont gérées dans fetchStores
                    })
                }
            }
            inventoryReference.value = reference
            return fetchedInventory
        } catch (error) {
            await alertService.error({ text: `Inventaire "${reference}" introuvable` })
            throw error
        }
    }

    // ===== MÉTHODES D'ACTION =====

    /**
     * Sélectionne un magasin pour afficher ses résultats
     *
     * Met à jour le magasin sélectionné dans le store. Le DataTable avec enableAutoManagement
     * détecte automatiquement le changement via customDataTableParams et recharge les données.
     *
     * @async
     * @param {string | null} storeId - ID du magasin à sélectionner
     * @returns {Promise<void>} Promise qui se résout une fois le magasin sélectionné
     *
     * @example
     * ```typescript
     * await handleStoreSelect('123')
     * // Les résultats du magasin 123 sont maintenant chargés automatiquement
     * ```
     */
    const handleStoreSelect = async (storeId: string | null) => {
        if (!storeId || !inventoryId.value) return

        try {
            // Mettre à jour le magasin sélectionné dans le store
            // Le DataTable détectera le changement via customDataTableParams et rechargera automatiquement
            resultsStore.setSelectedStore(storeId)

            // Invalider le cache des magasins
            storesCache.value = null
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la sélection du magasin' })
        }
    }

    /**
     * Valide plusieurs résultats en masse
     *
     * Valide chaque résultat sélectionné un par un. Continue même si une validation échoue.
     * Affiche un message de succès avec le nombre de résultats validés.
     *
     * @async
     * @param {InventoryResult[]} selectedResults - Liste des résultats à valider
     * @returns {Promise<void>} Promise qui se résout une fois la validation terminée
     *
     * @example
     * ```typescript
     * await handleBulkValidate([result1, result2, result3])
     * // Les 3 résultats sont maintenant validés
     * ```
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
                // Convertir les IDs en nombres et valider chaque résultat
                // Note: validateResults accepte un seul ID, donc on valide un par un
                const ids = selectedResults.map(r => {
                    const id = r.id
                    return typeof id === 'number' ? id : Number(id)
                }).filter(id => !Number.isNaN(id))

                if (ids.length === 0) {
                    await alertService.error({ text: 'Aucun ID valide trouvé pour la validation' })
                    return
                }

                // Valider chaque résultat (la fonction accepte un seul ID)
                for (const id of ids) {
                    try {
                        await resultsStore.validateResults(id)
                    } catch (error) {
                        // Continuer avec les autres même si une validation échoue
                        logger.error('Erreur lors de la validation d\'un résultat', { id, error })
                    }
                }

                await alertService.success({ text: `${ids.length} résultat(s) validé(s) avec succès` })
                await reloadResults()
            }
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la validation en masse' })
        }
    }

    // ===== INITIALISATION =====

    /**
     * Initialise le composable avec une référence d'inventaire
     *
     * Charge l'inventaire, les magasins disponibles et sélectionne automatiquement le premier magasin.
     * Le DataTable avec enableAutoManagement chargera automatiquement les résultats du magasin sélectionné.
     *
     * @async
     * @param {string} [reference] - Référence de l'inventaire (optionnel, utilise celle du config si non fourni)
     * @returns {Promise<void>} Promise qui se résout une fois l'initialisation terminée
     * @throws {Error} Si l'inventaire est introuvable ou si l'ID d'inventaire ne peut pas être résolu
     *
     * @example
     * ```typescript
     * await initialize('INV-2024-001')
     * // Le composable est maintenant initialisé et les données sont chargées
     * ```
     */
    const initialize = async (reference?: string) => {
        try {
            // Utiliser la référence fournie ou celle stockée
            const ref = reference || inventoryReference.value

            if (!ref) {
                return
            }

            // Mettre à jour la référence si fournie
            if (reference) {
                inventoryReference.value = reference
            }

            // Récupérer l'inventaire (précharge aussi les magasins si account_id disponible)
            await fetchInventoryByReference(ref)

            if (!inventoryId.value) {
                throw new Error('Impossible de résoudre l\'ID d\'inventaire')
            }

            // OPTIMISATION : Charger les magasins (instantané si dans l'inventaire, sinon via account_id)
            // fetchStores vérifie d'abord inventory.value.warehouses (instantané)
            await fetchStores()

            // Sélectionner le premier magasin par défaut
            // Le DataTable avec enableAutoManagement chargera automatiquement les données
            if (storeOptions.value.length > 0) {
                const defaultStoreId = storeOptions.value[0].value
                resultsStore.setSelectedStore(defaultStoreId)
                logger.debug('Premier magasin sélectionné par défaut', { storeId: defaultStoreId })
            } else {
                logger.warn('Aucun magasin disponible pour la sélection automatique')
            }

            isInitialized.value = true
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de l\'initialisation des résultats' })
        }
    }

    /**
     * Réinitialise le composable avec une nouvelle référence d'inventaire
     *
     * Réinitialise tous les états (magasin sélectionné, options de magasins) et recharge
     * les données avec la nouvelle référence.
     *
     * @async
     * @param {string} reference - Nouvelle référence de l'inventaire
     * @returns {Promise<void>} Promise qui se résout une fois la réinitialisation terminée
     *
     * @example
     * ```typescript
     * await reinitialize('INV-2024-002')
     * // Le composable est maintenant réinitialisé avec le nouvel inventaire
     * ```
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
            throw error
        }
    }

    // ===== FONCTIONS POUR LANCER COMPTAGE =====

    /**
     * Récupère les jobs avec écarts non résolus regroupés par ordre de comptage depuis l'API
     *
     * Utilise l'endpoint GET /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/jobs/discrepancies-by-counting/
     * pour récupérer les jobs nécessitant un comptage suivant (3ème, 4ème, etc.)
     *
     * @async
     * @returns {Promise<Map<number, JobResult[]>>} Map où la clé est le numéro de comptage (3, 4, 5, etc.)
     *         et la valeur est la liste des jobs nécessitant ce comptage
     *
     * @example
     * ```typescript
     * const jobsParComptage = await analyserJobsPourComptageSuivant()
     * // jobsParComptage.get(3) contient les jobs nécessitant un 3ème comptage
     * ```
     */
    const analyserJobsPourComptageSuivant = async (): Promise<Map<number, JobResult[]>> => {
        logger.debug('analyserJobsPourComptageSuivant: Fonction appelée')

        logger.debug('analyserJobsPourComptageSuivant: Vérification des IDs', {
            inventoryId: inventoryId.value,
            inventoryIdType: typeof inventoryId.value,
            selectedStore: selectedStore.value,
            selectedStoreType: typeof selectedStore.value
        })

        if (!inventoryId.value || !selectedStore.value) {
            logger.warn('analyserJobsPourComptageSuivant: IDs manquants', {
                inventoryId: inventoryId.value,
                selectedStore: selectedStore.value
            })
            return new Map()
        }

        try {
            // Convertir selectedStore en number (warehouseId)
            const warehouseId = typeof selectedStore.value === 'string'
                ? parseInt(selectedStore.value)
                : selectedStore.value

            logger.debug('analyserJobsPourComptageSuivant: Conversion warehouseId', {
                selectedStoreValue: selectedStore.value,
                warehouseId,
                isNaN: isNaN(warehouseId)
            })

            if (!warehouseId || isNaN(warehouseId)) {
                logger.warn('Warehouse ID invalide', { selectedStore: selectedStore.value })
                return new Map()
            }

            logger.debug('Appel API getJobsDiscrepanciesByCounting', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId
            })

            // Appeler l'API pour récupérer les jobs avec écarts regroupés par comptage
            const apiResponse = await JobService.getJobsDiscrepanciesByCounting(
                inventoryId.value,
                warehouseId
            )

            logger.debug('Réponse API getJobsDiscrepanciesByCounting', {
                apiResponse,
                apiResponseType: typeof apiResponse,
                isArray: Array.isArray(apiResponse),
                apiResponseKeys: apiResponse && typeof apiResponse === 'object' ? Object.keys(apiResponse) : 'N/A'
            })

            // Convertir la réponse de l'API en Map<number, JobResult[]>
            const jobsParComptage = new Map<number, JobResult[]>()

            // La réponse peut être soit un tableau (ancien format) soit un tableau avec un objet (nouveau format)
            if (!apiResponse || !Array.isArray(apiResponse) || apiResponse.length === 0) {
                logger.warn('Réponse API invalide, vide ou pas un tableau', {
                    apiResponse,
                    isArray: Array.isArray(apiResponse),
                    length: apiResponse?.length
                })
                return jobsParComptage
            }

            logger.debug('Traitement des données API', {
                itemsCount: apiResponse.length,
                items: apiResponse
            })

            // Parcourir les éléments de la réponse
            for (const item of apiResponse) {
                logger.debug('Traitement item', { item })

                if (!item || typeof item !== 'object') {
                    logger.debug('Item invalide ignoré', { item })
                    continue
                }

                // Nouveau format : objet avec next_counting_order
                if ('next_counting_order' in item && item.next_counting_order) {
                    const nextCountingOrder = item.next_counting_order
                    const jobs = item.jobs || []

                    logger.debug('Format nouveau détecté', {
                        nextCountingOrder,
                        jobsCount: jobs.length
                    })

                    if (!jobs || jobs.length === 0) {
                        logger.debug('Aucun job dans le nouveau format', { nextCountingOrder })
                        continue
                    }

                    // Convertir chaque job de l'API en JobResult
                    const jobResults: JobResult[] = jobs.map(job => ({
                        id: job.job_id,
                        reference: job.job_reference,
                        status: '',
                        assignments: [],
                        emplacements: [], // Les emplacements ne sont pas fournis par l'API
                        ressources: []
                    } as JobResult))

                    // Trier les jobs par référence
                    jobResults.sort((a, b) =>
                        (a.reference || '').localeCompare(b.reference || '')
                    )

                    jobsParComptage.set(nextCountingOrder, jobResults)

                    logger.debug('Jobs ajoutés pour comptage (nouveau format)', {
                        countingOrder: nextCountingOrder,
                        jobsCount: jobResults.length
                    })
                }
                // Ancien format : objet avec counting_order
                else if ('counting_order' in item && item.counting_order) {
                    const countingOrder = item.counting_order
                    const jobs = item.jobs || []

                    logger.debug('Format ancien détecté', {
                        countingOrder,
                        jobsCount: jobs.length
                    })

                    if (!jobs || jobs.length === 0) {
                        logger.debug('Aucun job dans l\'ancien format', { countingOrder })
                        continue
                    }

                    // Convertir chaque job de l'API en JobResult
                    const jobResults: JobResult[] = jobs.map(job => ({
                        id: job.job_id,
                        reference: job.job_reference,
                        status: '',
                        assignments: [],
                        emplacements: [], // Les emplacements ne sont pas fournis par l'API
                        ressources: []
                    } as JobResult))

                    // Trier les jobs par référence
                    jobResults.sort((a, b) =>
                        (a.reference || '').localeCompare(b.reference || '')
                    )

                    jobsParComptage.set(countingOrder, jobResults)

                    logger.debug('Jobs ajoutés pour comptage (ancien format)', {
                        countingOrder,
                        jobsCount: jobResults.length
                    })
                }
                else {
                    logger.debug('Format d\'item non reconnu', { item })
                }
            }

            logger.debug('Jobs par comptage trouvés', {
                totalComptages: jobsParComptage.size,
                comptages: Array.from(jobsParComptage.keys()),
                totalJobs: Array.from(jobsParComptage.values()).reduce((sum, jobs) => sum + jobs.length, 0)
            })

            logger.debug('analyserJobsPourComptageSuivant: Fin de traitement, retour de la Map', {
                mapSize: jobsParComptage.size
            })

            return jobsParComptage
        } catch (error: any) {
            logger.error('Erreur lors de la récupération des jobs avec écarts', error)

            // Gérer les erreurs spécifiques
            const errorMessage = error?.response?.data?.message || error?.message || ''

            if (errorMessage.includes('Inventaire ou entrepôt non trouvé') ||
                errorMessage.includes('non trouvé')) {
                await alertService.error({
                    text: 'Inventaire ou entrepôt non trouvé. Vérifiez que l\'inventaire et le magasin sont correctement sélectionnés.'
                })
            } else if (errorMessage) {
                await alertService.error({
                    text: `Erreur lors de la récupération des jobs : ${errorMessage}`
                })
            } else {
                await alertService.error({
                    text: 'Impossible de récupérer les jobs avec écarts pour le comptage suivant'
                })
            }

            return new Map()
        }
    }

    /**
     * Affiche la modal pour sélectionner et lancer un comptage suivant
     *
     * Affiche une modal fullscreen permettant de :
     * 1. Sélectionner les jobs nécessitant un comptage suivant (groupés par ordre de comptage)
     * 2. Sélectionner une session pour le comptage
     * 3. Lancer le comptage avec les jobs et session sélectionnés
     *
     * La sélection est mutuellement exclusive : un seul job par catégorie de comptage peut être sélectionné.
     *
     * @async
     * @returns {Promise<void>} Promise qui se résout une fois la modal fermée
     *
     * @example
     * ```typescript
     * await showLaunchCountingModal()
     * // La modal est maintenant affichée pour sélectionner les jobs
     * ```
     */
    const showLaunchCountingModal = async () => {
        try {
            logger.debug('showLaunchCountingModal: Démarrage de l\'analyse des jobs', {
                inventoryId: inventoryId.value,
                selectedStore: selectedStore.value
            })

            // ÉTAPE 1 : Analyser les jobs validés pour trouver ceux nécessitant un comptage 3, 4, 5, etc.
            const jobsParComptage = await analyserJobsPourComptageSuivant()

            logger.debug('showLaunchCountingModal: Résultat de l\'analyse', {
                jobsParComptageSize: jobsParComptage.size,
                jobsParComptageKeys: Array.from(jobsParComptage.keys())
            })

            if (jobsParComptage.size === 0) {
                logger.warn('showLaunchCountingModal: Aucun job trouvé pour comptage suivant')
                await alertService.info({ text: 'Aucun job ne nécessite un comptage suivant' })
                return
            }

            // Créer la modal avec les jobs groupés par comptage
            const container = document.createElement('div')
            document.body.appendChild(container)

            // Capturer les stores et fonctions nécessaires en closure pour la modal
            const modalSessionStore = sessionStore
            const modalJobStore = jobStore

            const app = createApp({
                setup() {
                    const showModal = ref<boolean>(true)
                    const selectedJobs = ref<Map<number, number>>(new Map()) // Map<comptage, jobId>
                    const disabledCategories = ref<Set<number>>(new Set())

                    const handleJobToggle = (comptage: number, jobId: number) => {
                        if (disabledCategories.value.has(comptage)) {
                            return // Catégorie désactivée
                        }

                        if (selectedJobs.value.get(comptage) === jobId) {
                            // Désélectionner
                            selectedJobs.value.delete(comptage)
                            disabledCategories.value.clear()
                        } else {
                            // Sélectionner ce job et désactiver les autres catégories
                            selectedJobs.value.set(comptage, jobId)
                            disabledCategories.value.clear()
                            jobsParComptage.forEach((_, catComptage) => {
                                if (catComptage !== comptage) {
                                    disabledCategories.value.add(catComptage)
                                }
                            })
                        }
                    }

                    const handleConfirm = async () => {
                        if (selectedJobs.value.size === 0) {
                            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
                            return
                        }

                        // Fermer la modal de sélection des jobs
                        showModal.value = false
                        setTimeout(() => {
                            app.unmount()
                            container.remove()
                        }, 300)

                        // ÉTAPE 2 : Afficher la sélection de session
                        try {
                            // Charger les sessions si elles ne sont pas déjà chargées
                            if (modalSessionStore.getAllSessions.length === 0) {
                                try {
                                    await modalSessionStore.fetchSessions()
                                } catch (error) {
                                    await alertService.error({ text: 'Erreur lors du chargement des sessions' })
                                    return
                                }
                            }

                            const sessions = modalSessionStore.getAllSessions

                            if (sessions.length === 0) {
                                await alertService.error({ text: 'Aucune session disponible' })
                                return
                            }

                            // Créer les options pour le select au format SelectOption
                            const sessionSelectOptions: SelectOption[] = sessions.map(session => ({
                                label: session.username,
                                value: session.id.toString()
                            }))

                            // Afficher la modal de sélection de session
                            const selectedSessionValue = await showSessionSelectModal(
                                sessionSelectOptions,
                                'Sélectionner une session',
                                'Choisissez la session pour lancer le comptage'
                            )

                            if (!selectedSessionValue) {
                                return
                            }

                            const selectedSessionId = Number(selectedSessionValue)
                            const selectedSession = sessions.find(s => s.id === selectedSessionId)

                            if (!selectedSession) {
                                await alertService.error({ text: 'Session sélectionnée introuvable' })
                                return
                            }

                            // ÉTAPE 3 : Lancer le comptage avec les jobs sélectionnés et la session
                            const jobIds = Array.from(selectedJobs.value.values())

                            try {
                                await modalJobStore.launchMultipleCountings({
                                    jobs: jobIds,
                                    session_id: selectedSessionId
                                })

                                await alertService.success({ text: 'Comptage(s) lancé(s) avec succès' })
                                // Le DataTable avec enableAutoManagement rechargera automatiquement les données
                                logger.debug('Comptage lancé - le DataTable rechargera automatiquement les données')
                            } catch (error: any) {
                                const errorMessage = error?.userMessage ||
                                                    error?.response?.data?.message ||
                                                    error?.message ||
                                                    'Erreur lors du lancement des comptages'
                                await alertService.error({ text: errorMessage })
                            }
                        } catch (error: any) {
                            await alertService.error({ text: 'Erreur lors de la sélection de la session' })
                        }
                    }

                    const handleCancel = () => {
                        showModal.value = false
                        setTimeout(() => {
                            app.unmount()
                            container.remove()
                        }, 300)
                    }

                    return () => h(Modal, {
                        modelValue: showModal.value,
                        'onUpdate:modelValue': (value: boolean) => {
                            showModal.value = value
                            if (!value) {
                                handleCancel()
                            }
                        },
                        title: 'Sélectionner les jobs',
                        size: 'fullscreen'
                    }, {
                        default: () => [
                            h('div', { class: 'space-y-4' }, [
                                h('p', {
                                    class: 'text-sm text-slate-600 dark:text-slate-400 mb-4'
                                }, 'Sélectionnez les jobs à lancer. Vous ne pouvez sélectionner qu\'un job par catégorie de comptage.'),

                                // Afficher les jobs groupés par comptage
                                Array.from(jobsParComptage.entries())
                                    .sort(([a], [b]) => a - b)
                                    .map(([comptage, jobs]) => {
                                        const isDisabled = disabledCategories.value.has(comptage)
                                        const selectedJobId = selectedJobs.value.get(comptage)

                                        return h('div', {
                                            key: comptage,
                                            class: `border rounded-lg p-4 ${isDisabled ? 'opacity-50 bg-gray-50' : 'bg-white'}`
                                        }, [
                                            h('h3', {
                                                class: 'text-lg font-semibold mb-3 text-slate-800'
                                            }, `${comptage}${comptage === 3 ? 'ème' : 'ème'} comptage`),

                                            h('div', {
                                                class: 'space-y-2'
                                            }, jobs.map(job => {
                                                const isSelected = selectedJobId === job.id

                                                // Récupérer les emplacements du job
                                                const emplacements = job.emplacements || []
                                                const emplacementReferences = emplacements
                                                    .map((emp: any) => emp.location_reference || emp.reference || emp.id || 'N/A')
                                                    .filter((ref: string) => ref !== 'N/A')

                                                // Créer le texte du tooltip avec les emplacements
                                                const tooltipText = emplacementReferences.length > 0
                                                    ? `Emplacements (${emplacementReferences.length}): ${emplacementReferences.join(', ')}`
                                                    : 'Aucun emplacement'

                                                return h('label', {
                                                    class: `flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-primary/10 border-2 border-primary' :
                                                        isDisabled ? 'cursor-not-allowed' :
                                                        'hover:bg-slate-50 border-2 border-transparent'
                                                    }`,
                                                    title: tooltipText // Tooltip avec les emplacements
                                                }, [
                                                    h('input', {
                                                        type: 'checkbox',
                                                        checked: isSelected,
                                                        disabled: isDisabled,
                                                        onChange: () => handleJobToggle(comptage, job.id),
                                                        class: 'w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary'
                                                    }),
                                                    h('span', {
                                                        class: `text-sm ${isDisabled ? 'text-gray-400' : 'text-slate-700'} relative group`
                                                    }, [
                                                        `Job ${job.reference || job.id}`,
                                                        // Tooltip personnalisé avec Tailwind
                                                        emplacementReferences.length > 0 && h('div', {
                                                            class: 'absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg pointer-events-none',
                                                            style: { transform: 'translateX(-50%)', left: '50%' }
                                                        }, [
                                                            h('div', {
                                                                class: 'font-semibold mb-1'
                                                            }, `Emplacements (${emplacementReferences.length})`),
                                                            h('div', {
                                                                class: 'max-h-32 overflow-y-auto space-y-1'
                                                            }, emplacementReferences.map((ref: string) =>
                                                                h('div', {
                                                                    class: 'text-slate-300'
                                                                }, ref)
                                                            ))
                                                        ])
                                                    ])
                                                ])
                                            }))
                                        ])
                                    })
                            ]),

                            h('div', { class: 'flex justify-end gap-3 mt-6' }, [
                                h('button', {
                                    class: 'px-6 py-3 bg-transparent border-2 border-primary text-primary rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-primary hover:text-white',
                                    onClick: handleCancel
                                }, 'Annuler'),
                                h('button', {
                                    class: 'px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:from-primary-dark hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed',
                                    disabled: selectedJobs.value.size === 0,
                                    onClick: handleConfirm
                                }, 'Suivant')
                            ])
                        ]
                    })
                }
            })

            const pinia = createPinia()
            pinia.use(piniaPluginPersistedstate)
            app.use(pinia)
            app.use(i18n)

            app.mount(container)
        } catch (error: any) {
            await alertService.error({ text: 'Erreur lors de l\'affichage de la modal' })
        }
    }

    // ===== RETURN =====

    /**
     * Retourne l'objet complet avec tous les états, données, colonnes, actions et méthodes
     *
     * @returns {Object} Objet exporté par le composable
     * @returns {ComputedRef<number | null>} inventoryId - ID de l'inventaire actuel
     * @returns {ComputedRef<string>} inventoryReference - Référence de l'inventaire actuel
     * @returns {Ref<boolean>} isInitialized - True si le composable est initialisé
     * @returns {ComputedRef<boolean>} loading - État de chargement des résultats
     * @returns {ComputedRef<InventoryResult[]>} results - Liste des résultats d'inventaire
     * @returns {Ref<StoreOption[]>} stores - Options de magasins disponibles
     * @returns {ComputedRef<string | null>} selectedStore - ID du magasin sélectionné
     * @returns {ComputedRef<Warehouse[]>} warehouses - Liste des entrepôts
     * @returns {ComputedRef<boolean>} warehousesLoading - État de chargement des entrepôts
     * @returns {Ref<boolean>} usesWarehouseFallback - True si on utilise les entrepôts comme fallback
     * @returns {ComputedRef<boolean>} hasResults - True s'il y a des résultats
     * @returns {Store} resultsStore - Store Pinia pour les résultats (exporté pour autoManagement)
     * @returns {ComputedRef<DataTableColumn[]>} columns - Colonnes du DataTable
     * @returns {ActionConfig<InventoryResult>[]} actions - Actions disponibles pour chaque ligne
     * @returns {ComputedRef<Object>} pagination - Métadonnées de pagination
     * @returns {ComputedRef<number>} resultsTotalItems - Nombre total de résultats
     * @returns {Function} handleStoreSelect - Méthode pour sélectionner un magasin
     * @returns {Function} handleBulkValidate - Méthode pour valider plusieurs résultats
     * @returns {Function} initialize - Méthode pour initialiser le composable
     * @returns {Function} reinitialize - Méthode pour réinitialiser avec une nouvelle référence
     * @returns {Function} fetchStores - Méthode pour charger les magasins
     * @returns {Function} reloadResults - Méthode pour recharger les résultats (no-op avec autoManagement)
     * @returns {Function} showLaunchCountingModal - Méthode pour afficher la modal de lancement de comptage
     * @returns {Function} analyserJobsPourComptageSuivant - Méthode pour analyser les jobs nécessitant un comptage
     * @returns {Function} fetchInventoryByReference - Méthode pour charger un inventaire par référence
     * @returns {Function} initializeWithReference - Alias pour initialize
     * @returns {Function} reloadWithReference - Alias pour reinitialize
     */
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

        // Store (exporté pour autoManagement si besoin)
        resultsStore,

        // Configuration DataTable
        columns,
        actions,
        pagination: resultsPaginationComputed,
        resultsTotalItems: computed(() => resultsPaginationMetadata.value?.total ?? 0),

        // Actions
        handleStoreSelect,
        handleBulkValidate,
        initialize,
        reinitialize,
        fetchStores,
        reloadResults,

        // Handlers DataTable harmonisés avec useAffecter.ts
        onResultsTableEvent,

        // Lancer comptage
        showLaunchCountingModal,
        analyserJobsPourComptageSuivant,

        // Alias pour compatibilité
        fetchInventoryByReference,
        initializeWithReference: initialize,
        reloadWithReference: reinitialize
    }
}
