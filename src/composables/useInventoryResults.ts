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
import { ref, computed, markRaw, watch, createApp, h, getCurrentInstance, nextTick } from 'vue'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS COMPOSABLES =====
import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'

// ===== IMPORTS SERVICES =====
import { dataTableService } from '@/services/dataTableService'
import { logger } from '@/services/loggerService'
import { alertService } from '@/services/alertService'
import { EcartComptageService, type ResolveEcartRequest } from '@/services/EcartComptageService'
import { InventoryResultsService } from '@/services/inventoryResultsService'

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
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// ===== IMPORTS UTILS =====
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import { convertQueryModelToRestApi, convertQueryModelToQueryParams, createQueryModelFromDataTableParams } from '@/components/DataTable/utils/queryModelConverter'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'

// ===== IMPORTS ICÔNES =====
import IconCheck from '@/components/icon/icon-check.vue'
import IconPencil from '@/components/icon/icon-edit.vue'
import IconLaunch from '@/components/icon/icon-launch.vue'

// ===== IMPORTS COMPOSANTS =====
import Modal from '@/components/Modal.vue'
import SelectField from '@/components/Form/SelectField.vue'
import type { SelectOption } from '@/interfaces/form'

// ===== IMPORTS PLUGINS =====
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from '@/i18n'

/**
 * Mode de sortie pour les paramètres de requête
 */
export type QueryOutputMode = 'queryModel' | 'dataTable' | 'restApi' | 'queryParams'

/**
 * Options pour initialiser le composable
 */
export interface UseInventoryResultsConfig {
    inventoryReference?: string
    initialInventoryId?: number
    /** Mode de sortie pour les paramètres de requête (défaut: 'dataTable') */
    queryOutputMode?: QueryOutputMode
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
 * Utilise useBackendDataTable pour l'intégration avec Pinia
 */
export function useInventoryResults(config?: UseInventoryResultsConfig) {
    const resultsStore = useResultsStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()
    const sessionStore = useSessionStore()
    const jobStore = useJobStore()

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

    // Mode de sortie pour les requêtes
    // Par défaut, utiliser 'dataTable' pour compatibilité avec le backend actuel
    // Changer à 'queryParams' une fois que le backend supporte le nouveau format
    const queryOutputMode = ref<QueryOutputMode>(config?.queryOutputMode || 'dataTable')

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

    /**
     * Pagination calculée pour les résultats
     * Utilise le totalCount du store pour calculer les informations de pagination
     */
    const resultsPaginationComputed = computed(() => {
        const totalCount = resultsStore.totalCount || 0
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
                description: 'Référence du job'
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
            }
        ];

        // Construire les colonnes dans l'ordre : Comptage 1, Comptage 2, Écart 1-2, Comptage 3, Écart 3, etc.
        sortedCountingFields.forEach((field, index) => {
            const comptageNum = index + 1; // Numéro du comptage (1, 2, 3, etc.)

            // Ajouter le comptage
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
                description: `Valeur du comptage ${comptageNum}`
        });

            // Après le comptage 2, ajouter Écart 1-2
            if (comptageNum === 2) {
                const ecart1_2 = sortedDifferenceFields.find(f => f.toLowerCase() === 'ecart_1_2');
                if (ecart1_2) {
            cols.push({
                        headerName: inferDifferenceLabel(ecart1_2),
                        field: ecart1_2,
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
                cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                    let ecart: any;
                    let rowData: any;

                    if (column && row) {
                        ecart = paramsOrValue;
                        rowData = row;
                    } else {
                        const params = paramsOrValue;
                        ecart = params?.value;
                        rowData = params?.data || params?.rowData || params?.node?.data;
                    }

                    if (ecart === undefined || ecart === null) {
                                ecart = rowData?.[ecart1_2];
                            }

                    if (ecart === undefined || ecart === null || ecart === '') {
                        return '-';
                    }

                    const numEcart = Number(ecart);
                    if (Number.isNaN(numEcart)) {
                        return '-';
                    }

                    const color = numEcart === 0 ? 'text-green-600' : 'text-red-600';
                    return `<span class="${color} font-semibold">${numEcart}</span>`;
                }) as any
            });
                }
            }

            // Pour les comptages 3 et plus, ajouter leur écart correspondant (Écart 3, Écart 4, etc.)
            if (comptageNum >= 3) {
                // Trouver l'écart correspondant (ecart_2_3 pour comptage 3, ecart_3_4 pour comptage 4, etc.)
                const ecartField = sortedDifferenceFields.find(e => {
                    const numbers = e.match(/\d+/g) || [];
                    const lastNum = numbers[numbers.length - 1];
                    return lastNum === String(comptageNum) && e.toLowerCase() !== 'ecart_1_2';
                });

                if (ecartField) {
                    const isEcart1_2 = false;
                    cols.push({
                        headerName: inferDifferenceLabel(ecartField),
                        field: ecartField,
                        sortable: isEcart1_2,
                        dataType: 'number' as ColumnDataType,
                        filterable: isEcart1_2,
                        width: 120,
                        editable: false,
                        visible: true,
                        draggable: true,
                        autoSize: true,
                        icon: 'icon-trending-up',
                        description: 'Écart entre les comptages',
                        cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                            // Déterminer si c'est le format params ou (value, column, row)
                            let rowData: any;

                            if (column && row) {
                                rowData = row;
                            } else {
                                const params = paramsOrValue;
                                rowData = params?.data || params?.rowData || params?.node?.data;
                            }

                            // Pour les autres écarts (ecart_2_3, ecart_3_4, etc.) : Vérifier si le dernier comptage est égal à un des précédents
                            // Extraire les numéros des comptages depuis le nom du champ
                            const match = ecartField.match(/^ecart_(\d+)(?:_(\d+))+$/);
                            if (!match) {
                                return '-';
                            }

                            // Extraire tous les numéros
                            const numbers = ecartField.match(/\d+/g) || [];
                            if (numbers.length < 2) {
                                return '-';
                            }

                            // Prendre le dernier numéro (le comptage à vérifier)
                            const lastNumber = numbers[numbers.length - 1];
                            const comptageLastField = `contage_${lastNumber}`;
                            const comptageLastValue = rowData?.[comptageLastField];

                            // Vérifier si le dernier comptage est vide
                            const isLastComptageEmpty = comptageLastValue === undefined || comptageLastValue === null || comptageLastValue === '';

                            if (isLastComptageEmpty) {
                                return '-';
                            }

                            // Récupérer TOUS les comptages précédents (de 1 jusqu'à N-1, pas seulement ceux dans le nom du champ)
                            // Exemple: pour ecart_2_3 avec comptage 3, récupérer comptage 1 ET comptage 2
                            const lastComptageNum = parseInt(lastNumber);
                            const previousComptageValues: any[] = [];

                            // Récupérer tous les comptages de 1 jusqu'à N-1
                            for (let num = 1; num < lastComptageNum; num++) {
                                const comptageField = `contage_${num}`;
                                const comptageValue = rowData?.[comptageField];
                                if (comptageValue !== undefined && comptageValue !== null && comptageValue !== '') {
                                    const numValue = typeof comptageValue === 'number' ? comptageValue : Number(comptageValue);
                                    if (!Number.isNaN(numValue)) {
                                        previousComptageValues.push(numValue);
                                    }
                                }
                            }

                            // Si aucun comptage précédent n'existe, afficher icône d'erreur
                            if (previousComptageValues.length === 0) {
                                return `<span class="inline-flex items-center justify-center text-red-600">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                    </svg>
                                </span>`;
                            }

                            // Convertir le dernier comptage en nombre
                            const numComptageLast = typeof comptageLastValue === 'number' ? comptageLastValue : Number(comptageLastValue);
                            if (Number.isNaN(numComptageLast)) {
                                return `<span class="inline-flex items-center justify-center text-red-600">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                    </svg>
                                </span>`;
                            }

                            // Vérifier si le dernier comptage est égal à l'un des comptages précédents
                            const isEqualToOnePrevious = previousComptageValues.some(prevValue => {
                                if (Number.isInteger(prevValue) && Number.isInteger(numComptageLast)) {
                                    return prevValue === numComptageLast;
                                }
                                const diff = Math.abs(prevValue - numComptageLast);
                                return diff < 0.0001;
                            });

                            if (isEqualToOnePrevious) {
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
                        }) as any
                    });
                }
            }
        });

        // Ajouter les colonnes de statut des comptages après tous les comptages et écarts
        sortedStatusFields.forEach(field => {
            cols.push({
                headerName: inferStatusLabel(field),
                field,
                sortable: true,
                dataType: 'select' as ColumnDataType,
                filterable: true,
                width: 150,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-status',
                description: 'Statut du comptage',
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

    // ===== QUERYMODEL =====

    /**
     * QueryModel pour gérer les requêtes avec mode de sortie configurable
     */
    const {
        queryModel: queryModelRef,
        toStandardParams,
        updatePagination: updateQueryPagination,
        updateSort: updateQuerySort,
        updateFilter: updateQueryFilter,
        updateGlobalSearch: updateQueryGlobalSearch,
        fromDataTableParams: fromDataTableParamsQueryModel,
        reset: resetQueryModel
    } = useQueryModel({
        columns,
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
     * Crée un QueryModel depuis les paramètres DataTable actuels
     */
    const createQueryModelFromCurrentState = () => {
        return createQueryModelFromDataTableParams({
            page: currentPage.value || 1,
            pageSize: pageSize.value || 20,
            sort: (sortModel.value || []).map(s => ({
                field: s.field,
                direction: s.direction
            })),
            filters: undefined, // Les filtres sont gérés séparément
            globalSearch: searchQuery.value || undefined,
            customParams: {
                inventory_id: inventoryId.value,
                store_id: selectedStore.value
            }
        })
    }

    // ===== ACTIONS =====

    /**
     * Actions pour chaque ligne de résultat
     */
    const actions: ActionConfig<InventoryResult>[] = [
        {
            label: 'Modifier',
            icon: markRaw(IconPencil),
            color: 'primary',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire l'ID de l'écart (peut être l'ID du résultat ou un champ spécifique)
                    const ecartId = result.ecart_id || result.id

                    if (!ecartId) {
                        await alertService.error({ text: 'ID de l\'écart manquant' })
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
                    await EcartComptageService.updateFinalResult(Number(ecartId), updatePayload)

                    await alertService.success({ text: 'Résultat final modifié avec succès' })
                    await reloadResults()
                } catch (error: any) {
                    logger.error('Erreur lors de la modification du résultat final', error)

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
                    // Extraire l'ID de l'écart (peut être l'ID du résultat ou un champ spécifique)
                    const ecartId = result.ecart_id || result.id

                    if (!ecartId) {
                        await alertService.error({ text: 'ID de l\'écart manquant' })
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
                    await EcartComptageService.resolveEcart(Number(ecartId), resolvePayload)

                    await alertService.success({ text: 'Écart validé avec succès' })
                    await reloadResults()
                } catch (error: any) {
                    logger.error('Erreur lors de la validation de l\'écart', error)

                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.response?.data?.message ||
                                        error?.message ||
                                        'Erreur lors de la validation de l\'écart'

                    await alertService.error({ text: errorMessage })
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
                    // Extraire les informations nécessaires depuis la ligne
                    const jobId = result.jobId || result.job_id || result.id
                    const locationId = result.location_id || result.locationId || result.emplacement_id
                    const emplacementName = result.emplacement || result.location_reference || result.location_name || 'Emplacement inconnu'
                    const articleName = result.article || result.product || result.product_name || null

                    // Vérifier que les informations de base sont présentes
                    if (!jobId) {
                        await alertService.error({ text: 'ID du job manquant' })
                        return
                    }

                    if (!locationId) {
                        await alertService.error({ text: 'ID de l\'emplacement manquant' })
                        return
                    }

                    // Charger les sessions si elles ne sont pas déjà chargées
                    if (sessionStore.getAllSessions.length === 0) {
                        try {
                            await sessionStore.fetchSessions()
                        } catch (error) {
                            logger.error('Erreur lors du chargement des sessions', error)
                            await alertService.error({ text: 'Erreur lors du chargement des sessions' })
                            return
                        }
                    }

                    const sessions = sessionStore.getAllSessions

                    if (sessions.length === 0) {
                        await alertService.error({ text: 'Aucune session disponible' })
                        return
                    }

                    // Créer les options pour le select au format SelectOption
                    const sessionSelectOptions: SelectOption[] = sessions.map(session => ({
                        label: session.username,
                        value: session.id.toString()
                    }))

                    // Première popup : Sélection de la session avec SelectField
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

                    // Deuxième popup : Confirmation - Design amélioré
                    const confirmation = await Swal.fire({
                        title: '<div style="font-size: 1.5rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Confirmer le lancement</div>',
                        html: `
                            <div style="text-align: left; padding: 1.5rem; background: #f9fafb; border-radius: 0.5rem; margin: 1rem 0;">
                                <div style="display: flex; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                                    <div style="width: 40px; height: 40px; background: #FECD1C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Emplacement</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${emplacementName}</div>
                                    </div>
                                </div>
                                ${articleName ? `
                                <div style="display: flex; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                                    <div style="width: 40px; height: 40px; background: #FECD1C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="9" y1="3" x2="9" y2="21"></line>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Article</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${articleName}</div>
                                    </div>
                                </div>
                                ` : ''}
                                <div style="display: flex; align-items: center;">
                                    <div style="width: 40px; height: 40px; background: #FECD1C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Session</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${selectedSession.username}</div>
                                    </div>
                                </div>
                            </div>
                            <p style="text-align: center; color: #6b7280; font-size: 0.95rem; margin-top: 1rem;">
                                Voulez-vous vraiment lancer le comptage pour cet emplacement ?
                            </p>
                        `,
                        icon: 'question',
                        iconColor: '#FECD1C',
                        showCancelButton: true,
                        confirmButtonText: 'Confirmer',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#FECD1C',
                        customClass: {
                            popup: 'sweet-alerts-launch',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn-cancel-primary'
                        },
                        width: '550px',
                        padding: '2rem'
                    })

                    if (confirmation.isConfirmed) {
                        // Appeler l'action du store pour lancer le comptage
                        await jobStore.launchCounting({
                            job_id: Number(jobId),
                            location_id: Number(locationId),
                            session_id: selectedSessionId
                        })

                        await alertService.success({ text: 'Comptage lancé avec succès' })
                        await reloadResults()
                    }
                } catch (error: any) {
                    logger.error('Erreur lors du lancement du comptage', error)

                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.userMessage ||
                                        error?.response?.data?.message ||
                                        error?.message ||
                                        'Erreur lors du lancement du comptage'

                    await alertService.error({ text: errorMessage })
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
     * Convertir les paramètres vers le format configuré (QueryModel, DataTable ou RestApi)
     *
     * @param page - Numéro de page
     * @param pageSize - Taille de page
     * @param filters - Modèle de filtres
     * @param sort - Modèle de tri
     * @param globalSearch - Recherche globale
     * @returns Paramètres au format configuré selon queryOutputMode
     */
    const convertResultsParams = (
        page: number,
        pageSize: number,
        filters?: Record<string, { filter: string; operator?: string }>,
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>,
        globalSearch?: string
    ) => {
        // Créer un QueryModel depuis les paramètres DataTable
        // Filtrer les valeurs vides avant de créer le QueryModel
        const filteredFilters = filters ? Object.fromEntries(
            Object.entries(filters)
                .filter(([field, filterConfig]) => {
                    // Ignorer les filtres avec des valeurs vides
                    if (!filterConfig || !filterConfig.filter) {
                        return false
                    }
                    const filterValue = filterConfig.filter
                    // Ignorer si la valeur est vide, null, undefined ou une chaîne vide
                    if (filterValue === '' || filterValue === null || filterValue === undefined ||
                        (typeof filterValue === 'string' && filterValue.trim() === '') ||
                        String(filterValue) === 'undefined' || String(filterValue) === 'null') {
                        // Sauf pour les opérateurs null/not_null qui sont valides même sans valeur
                        if (filterConfig.operator === 'is_null' || filterConfig.operator === 'is_not_null') {
                            return true
                        }
                        return false
                    }
                    return true
                })
                .map(([field, filterConfig]) => [
                    field,
                    {
                        field,
                        dataType: 'text' as const,
                        operator: (filterConfig.operator || 'contains') as 'contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null',
                        value: filterConfig.filter
                    }
                ])
        ) : undefined

        const queryModelData = createQueryModelFromDataTableParams({
            page,
            pageSize,
            sort: sort?.map(s => ({ field: s.colId, direction: s.sort })),
            filters: filteredFilters && Object.keys(filteredFilters).length > 0 ? filteredFilters : undefined,
            globalSearch: globalSearch && globalSearch.trim() !== '' ? globalSearch : undefined,
            customParams: {
                inventory_id: inventoryId.value,
                store_id: selectedStore.value
            }
        })

            // Convertir selon le mode configuré
        switch (queryOutputMode.value) {
            case 'queryModel':
                return queryModelData as QueryModel

            case 'restApi':
                return convertQueryModelToRestApi(queryModelData)

            case 'queryParams':
                return convertQueryModelToQueryParams(queryModelData)

            case 'dataTable':
            default:
                return convertToStandardDataTableParams(
                    {
                        page,
                        pageSize,
                        filters: filters || {},
                        sort: sort || [],
                        globalSearch
                    },
                    {
                        columns: columns.value,
                        draw: 1,
                        customParams: {
                            inventory_id: inventoryId.value,
                            store_id: selectedStore.value
                        }
                    }
                )
        }
    }

    /**
     * Alias pour compatibilité avec l'ancien code
     * @deprecated Utiliser convertResultsParams à la place
     */
    const convertResultsParamsToStandard = (
        page: number,
        pageSize: number,
        filters?: Record<string, { filter: string; operator?: string }>,
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>,
        globalSearch?: string
    ): StandardDataTableParams => {
        // Si le mode est dataTable, retourner directement
        if (queryOutputMode.value === 'dataTable') {
            return convertResultsParams(page, pageSize, filters, sort, globalSearch) as StandardDataTableParams
        }
        // Sinon, forcer la conversion vers StandardDataTableParams
        return convertToStandardDataTableParams(
            {
                page,
                pageSize,
                filters: filters || {},
                sort: sort || [],
                globalSearch
            },
            {
                columns: columns.value,
                draw: 1,
                customParams: {
                    inventory_id: inventoryId.value,
                    store_id: selectedStore.value
                }
            }
        )
    }

    /**
     * Récupérer les résultats pour un magasin avec paramètres DataTable
     *
     * @param storeId - ID du magasin
     * @param params - Paramètres DataTable optionnels (pagination, tri, filtres, recherche)
     */
    const fetchResults = async (
        storeId: string,
        params?: StandardDataTableParams | Record<string, any>
    ) => {
        if (!inventoryId.value) {
            logger.warn('Aucun ID d\'inventaire défini')
            return
        }

        try {
            resultsStore.setSelectedStore(storeId)

            // Utiliser convertResultsParams qui convertit automatiquement selon queryOutputMode
            // Par défaut, queryOutputMode est 'queryParams' pour utiliser le nouveau format
            // Si le backend ne supporte pas encore QueryParams, changer queryOutputMode à 'dataTable'
            const finalParams = convertResultsParams(
                    currentPage.value || 1,
                    pageSize.value || 20,
                    undefined,
                    (sortModel.value || []).map(s => ({
                        colId: s.field,
                        sort: s.direction as 'asc' | 'desc'
                    })),
                    searchQuery.value || undefined
                )

            logger.debug('Chargement des résultats avec paramètres', {
                format: queryOutputMode.value,
                inventoryId: inventoryId.value,
                storeId,
                pageSize: pageSize.value,
                params: finalParams,
                paramsType: typeof finalParams,
                paramsKeys: Object.keys(finalParams || {})
            })

            await resultsStore.fetchResults(inventoryId.value, storeId, finalParams)
            await nextTick()

            logger.debug('Résultats mis à jour dans le store', {
                count: resultsStore.results.length,
                totalCount: resultsStore.totalCount,
                sample: resultsStore.results.slice(0, 2).map(r => ({ id: r.id, article: r.article }))
            })
        } catch (error) {
            logger.error('Erreur lors du chargement des résultats', error)
            await alertService.error({ text: 'Erreur lors du chargement des résultats' })
        }
    }

    /**
     * Recharger les résultats actuels avec les paramètres DataTable actuels
     */
    const reloadResults = async () => {
        if (selectedStore.value) {
            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                undefined,
                (sortModel.value || []).map(s => ({
                    colId: s.field,
                    sort: s.direction as 'asc' | 'desc'
                })),
                searchQuery.value || undefined
            )
            await fetchResults(selectedStore.value, standardParams)
        }
    }

    /**
     * Récupérer l'inventaire par référence
     */
    const fetchInventoryByReference = async (reference: string) => {
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(reference)
            if (inventory) {
                inventoryId.value = inventory.id
                accountId.value = inventory.account_id || null
            }
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
     * Réinitialise la pagination et les filtres lors du changement de magasin
     */
    const handleStoreSelect = async (storeId: string | null) => {
        if (!storeId) return

        // Réinitialiser la pagination et les filtres lors du changement de magasin
        setPage(1)
        resetFilters()
        setSearch('')
        setSortModel([])

        // Charger les résultats avec les paramètres par défaut
        const standardParams = convertResultsParamsToStandard(
            1,
            pageSize.value || 20,
            undefined,
            [],
            undefined
        )

        await fetchResults(storeId, standardParams)
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
    const onPaginationChanged = async (params: { page: number; pageSize: number; start?: number; end?: number } | StandardDataTableParams | QueryModel | Record<string, any>) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), utiliser directement
            if ('draw' in params && 'start' in params && 'length' in params) {
                const standardParams = params as StandardDataTableParams
                const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
                setPage(page)
                setPageSize(standardParams.length || 20)

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Si c'est le format simple avec page et pageSize (venant de useDataTable)
            if ('page' in params && 'pageSize' in params && typeof params.page === 'number' && typeof params.pageSize === 'number') {
            const paginationParams = params as { page: number; pageSize: number }
            setPage(paginationParams.page)
            setPageSize(paginationParams.pageSize)

                // Utiliser convertResultsParams qui respecte queryOutputMode (par défaut 'dataTable')
                // et qui inclut les filtres, tri et recherche actuels
                if (selectedStore.value) {
                    await fetchResults(selectedStore.value)
                }
                return
            }

            // Si c'est un objet vide ou inconnu, utiliser les valeurs actuelles
            if (typeof params === 'object' && params !== null && Object.keys(params).length === 0) {
                logger.warn('Paramètres de pagination vides, utilisation des valeurs actuelles')
            if (selectedStore.value) {
                    await fetchResults(selectedStore.value)
                }
                return
            }

            // Sinon, essayer de convertir selon le mode configuré
            logger.warn('Format de pagination non reconnu, utilisation des valeurs par défaut', params)
            if (selectedStore.value) {
                await fetchResults(selectedStore.value)
            }
        } catch (error) {
            logger.error('Erreur dans onPaginationChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de pagination' })
        }
    }

    /**
     * Handler pour les changements de tri
     * Accepte QueryModel, StandardDataTableParams, RestApi ou l'ancien format
     *
     * @param sortModel - Modèle de tri (format configuré ou ancien format)
     */
    const onSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }> | StandardDataTableParams | QueryModel | Record<string, any>) => {
        try {
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

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Sinon, convertir l'ancien format
            const sortModelArray = sortModel as Array<{ colId: string; sort: 'asc' | 'desc' }>
            const adaptedSortModel = sortModelArray.map(sort => ({
                field: sort.colId,
                direction: sort.sort
            }))
            setSortModel(adaptedSortModel as any)

            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                undefined,
                sortModelArray,
                searchQuery.value || undefined
            )

            if (selectedStore.value) {
                await fetchResults(selectedStore.value, standardParams)
            }
        } catch (error) {
            logger.error('Erreur dans onSortChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de tri' })
        }
    }

    /**
     * Handler pour les changements de filtres
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param filterModel - Modèle de filtres (format standard ou ancien format)
     */
    const onFilterChanged = async (filterModel: Record<string, { filter: string }> | StandardDataTableParams) => {
        try {
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

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Sinon, utiliser directement l'ancien format
            const filterModelObj = filterModel as Record<string, { filter: string }>
            setFilters(filterModelObj)

            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                filterModelObj,
                (sortModel.value || []).map(s => ({ colId: s.field, sort: s.direction as 'asc' | 'desc' })),
                searchQuery.value || undefined
            )

            if (selectedStore.value) {
                await fetchResults(selectedStore.value, standardParams)
            }
        } catch (error) {
            logger.error('Erreur dans onFilterChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de filtre' })
        }
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte QueryModel, StandardDataTableParams, RestApi ou l'ancien format
     *
     * @param searchTerm - Terme de recherche (format configuré ou string)
     */
    const onGlobalSearchChanged = async (searchTerm: string | StandardDataTableParams | QueryModel | Record<string, any>) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), extraire les informations
            if (typeof searchTerm === 'object' && 'draw' in searchTerm && 'start' in searchTerm && 'length' in searchTerm) {
                const standardParams = searchTerm as StandardDataTableParams
                const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
                setPage(page)
                setPageSize(standardParams.length || 20)
                setSearch(standardParams['search[value]'] || '')

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Sinon, utiliser directement la valeur string
            setSearch(searchTerm as string)

            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                undefined,
                (sortModel.value || []).map(s => ({ colId: s.field, sort: s.direction as 'asc' | 'desc' })),
                searchTerm as string || undefined
            )

            if (selectedStore.value) {
                await fetchResults(selectedStore.value, standardParams)
            }
        } catch (error) {
            logger.error('Erreur dans onGlobalSearchChanged', error)
            await alertService.error({ text: 'Erreur lors de la recherche' })
        }
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

                // Charger avec les paramètres par défaut (utilise convertResultsParams qui respecte queryOutputMode)
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

    // ===== EXPORTS =====

    /**
     * Exporter les résultats en CSV ou Excel
     * @param format - Format d'export ('csv' ou 'excel')
     * @param selectedOnly - Si true, exporter uniquement les résultats sélectionnés
     */
    const exportResults = async (format: 'csv' | 'excel' = 'excel', selectedOnly: boolean = false) => {
        if (!inventoryId.value || !selectedStore.value) {
            await alertService.warning({ text: 'Veuillez sélectionner un magasin avant d\'exporter' })
            return
        }

        try {
            // Afficher un loader
            const loadingSwal = Swal.fire({
                title: 'Export en cours...',
                text: 'Le fichier est en cours de préparation. Veuillez patienter.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            // Construire les paramètres DataTable actuels
            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                undefined,
                (sortModel.value || []).map(s => ({
                    colId: s.field,
                    sort: s.direction as 'asc' | 'desc'
                })),
                searchQuery.value || undefined
            )

            // Si on exporte uniquement les sélectionnés, ajouter les IDs
            if (selectedOnly && resultsStore.selectedResults.length > 0) {
                const selectedIds = resultsStore.selectedResults.map(r => r.id)
                standardParams.selected_ids = selectedIds.join(',')
            }

            // Appeler le service d'export
            const response = await InventoryResultsService.exportResults(
                inventoryId.value,
                selectedStore.value,
                format,
                standardParams
            )

            // Vérifier que la réponse contient un blob
            if (!response.data || !(response.data instanceof Blob)) {
                throw new Error('Aucune donnée reçue du backend')
            }

            // Déterminer le type MIME et l'extension
            const mimeType = format === 'excel'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv;charset=utf-8;'
            const fileExtension = format === 'excel' ? 'xlsx' : 'csv'

            // Créer le blob avec le bon type MIME
            const blob = new Blob([response.data], { type: mimeType })

            // Générer le nom du fichier
            const timestamp = new Date().toISOString().split('T')[0]
            const storeLabel = storeOptions.value.find(s => s.value === selectedStore.value)?.label || 'magasin'
            const filename = `Resultats_Inventaire_${inventoryReference.value || inventoryId.value}_${storeLabel}_${timestamp}`

            // Télécharger le fichier
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.setAttribute('download', `${filename}.${fileExtension}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(downloadUrl)

            // Fermer le loader et afficher le succès
            await Swal.close()
            await alertService.success({
                text: `Export ${format === 'excel' ? 'Excel' : 'CSV'} réussi`
            })

            logger.debug('Export réussi', { format, filename })
        } catch (error: any) {
            logger.error('Erreur lors de l\'export', error)

            // Extraire le message d'erreur
            const errorMessage = error?.response?.data?.message ||
                                error?.message ||
                                `Erreur lors de l'export ${format === 'excel' ? 'Excel' : 'CSV'}`

            await Swal.close()
            await alertService.error({ text: errorMessage })
        }
    }

    /**
     * Exporter en CSV
     */
    const exportToCsv = async (selectedOnly: boolean = false) => {
        await exportResults('csv', selectedOnly)
    }

    /**
     * Exporter en Excel
     */
    const exportToExcel = async (selectedOnly: boolean = false) => {
        await exportResults('excel', selectedOnly)
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
        pagination: resultsPaginationComputed,
        resultsTotalItems: computed(() => resultsStore.totalCount || 0),

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

        // Exports
        exportResults,
        exportToCsv,
        exportToExcel,

        // QueryModel
        queryModel: computed(() => queryModelRef.value),
        queryOutputMode: computed(() => queryOutputMode.value),
        convertQueryModelToOutput,
        createQueryModelFromCurrentState,

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
