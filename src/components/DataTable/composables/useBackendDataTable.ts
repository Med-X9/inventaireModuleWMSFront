/**
 * Composable générique d'intégration backend pour DataTable
 *
 * Ce composable fournit une interface unifiée pour la communication
 * avec n'importe quel backend Django DataTable et REST API.
 * Il s'intègre avec Pinia pour la gestion d'état des modules.
 */

import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { DataTableService } from '@/components/DataTable/services/dataTableService';
import { logger } from '@/services/loggerService';
import API from '@/api';

/**
 * Fonction générique pour trouver l'action de récupération dans un store Pinia
 * @param store - Instance du store Pinia
 * @param storeId - ID du store (optionnel)
 * @returns Nom de l'action trouvée
 */
function findFetchAction(store: any, storeId?: string): string {
    // Vérifier que le store est valide
    if (!store || typeof store !== 'object') {
        return 'fetchData';
    }

    // Liste des noms d'actions possibles à tester
    const possibleActions = [
        'fetchData',
        'getData',
        'loadData',
        'fetch'
    ];

    // Si storeId est fourni, ajouter des variantes spécifiques
    if (storeId) {
        const capitalized = storeId.charAt(0).toUpperCase() + storeId.slice(1);

        possibleActions.unshift(
            `fetch${capitalized}`,      // fetchInventory
            `fetch${capitalized}s`,     // fetchInventories (avec s majuscule)
            `get${capitalized}`,        // getInventory
            `get${capitalized}s`,       // getInventories
            `load${capitalized}`,       // loadInventory
            `load${capitalized}s`       // loadInventories
        );
    }

    // Tester chaque action possible
    for (const actionName of possibleActions) {
        if (typeof store[actionName] === 'function') {
            return actionName;
        }
    }

    // Si aucune action standard n'est trouvée, chercher toutes les actions qui commencent par 'fetch'
    const fetchActions = Object.keys(store).filter(key =>
        typeof store[key] === 'function' && key.startsWith('fetch')
    );

    if (fetchActions.length > 0) {
        return fetchActions[0];
    }

    // Si aucune action n'est trouvée, retourner la première option par défaut
    return possibleActions[0];
}

export interface BackendDataTableOptions {
    autoLoad?: boolean;
    pageSize?: number;
    debounceMs?: number;
    piniaStore?: any;               // Instance du store Pinia à utiliser
    storeId?: string;               // ID du store Pinia
}

export interface BackendDataTableState<T = any> {
    // État des données
    data: T[];
    loading: boolean;
    error: string | null;

    // Pagination
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;

    // Recherche et tri
    searchQuery: string;
    sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>;
    filters: Record<string, any>;

    // Configuration
    columns: Array<{ field: string; searchable: boolean; orderable: boolean }>;
}

export interface BackendDataTableActions {
    // Chargement des données
    loadData: () => Promise<void>;
    refresh: () => Promise<void>;

    // Pagination
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;

    // Recherche et tri
    setSearch: (query: string) => void;
    setSort: (field: string, direction: 'asc' | 'desc') => void;
    setSortModel: (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => void;

    // Filtres
    setFilters: (filters: Record<string, any>) => void;
    resetFilters: () => void;

    // Configuration
    setColumns: (columns: Array<{ field: string; searchable: boolean; orderable: boolean }>) => void;

    // Pinia
    getFromPinia: (property: string) => any;
}

/**
 * Composable générique d'intégration backend DataTable
 *
 * @param endpoint - Endpoint API (ex: '/articles/datatable/')
 * @param options - Options de configuration
 * @returns Interface complète pour la gestion du DataTable
 *
 * @example
 * // Utilisation basique
 * const { data, loading, pagination, setPage, setSearch } = useBackendDataTable('/api/users/');
 *
 * // Avec Pinia et configuration personnalisée
 * const jobStore = useJobStore();
 * const { data, loading, getFromPinia } = useBackendDataTable('/api/products/', {
 *   autoLoad: true,
 *   pageSize: 50,
 *   debounceMs: 500,
 *   piniaStore: jobStore,
 *   storeId: 'job'
 * });
 */
export function useBackendDataTable<T = any>(
    endpoint: string,
    options: BackendDataTableOptions = {}
) {
    const {
        autoLoad = true,
        pageSize = 20,
        debounceMs = 300,
        piniaStore,
        storeId
    } = options;

    // État réactif
    const data = ref<T[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Pagination
    const currentPage = ref(1);
    const pageSizeRef = ref(pageSize);
    const totalItems = ref(0);
    const totalPages = ref(0);

    // Recherche et tri
    const searchQuery = ref('');
    const sortModel = ref<Array<{ field: string; direction: 'asc' | 'desc' }>>([]);
    const filters = ref<Record<string, any>>({});

    // Configuration des colonnes
    const columns = ref<Array<{ field: string; searchable: boolean; orderable: boolean }>>([]);

    // Utiliser storeToRefs pour garantir la réactivité avec Pinia
    let storeRefs: any = null;
    if (piniaStore) {
        try {
            storeRefs = storeToRefs(piniaStore);
        } catch (e) {
            // Si storeToRefs échoue, on utilisera l'accès direct
            logger.warn('Impossible d\'utiliser storeToRefs, utilisation de l\'accès direct', e);
        }
    }

    // Computed pour récupérer les données depuis Pinia si disponible
    const piniaData = computed(() => {
        if (piniaStore) {
            let storeData: any[] = [];
            
            // Essayer d'utiliser storeToRefs d'abord pour la réactivité
            if (storeRefs) {
                if (storeId === 'location' && storeRefs.locations) {
                    storeData = storeRefs.locations.value || [];
                } else if (storeId === 'job' && storeRefs.jobs) {
                    storeData = storeRefs.jobs.value || [];
                } else if (storeId === 'inventory' && storeRefs.inventories) {
                    storeData = storeRefs.inventories.value || [];
                }
            }
            
            // Fallback: accès direct au store
            if (storeData.length === 0) {
                if (storeId === 'location') {
                    storeData = piniaStore.locations || [];
                } else if (storeId === 'job') {
                    storeData = piniaStore.jobs || [];
                } else if (storeId === 'inventory') {
                    storeData = piniaStore.inventories || [];
                } else {
                    // Fallback: essayer toutes les propriétés possibles
                    storeData = piniaStore[storeId || 'data'] || piniaStore.jobs || piniaStore.locations || piniaStore.inventories || [];
                }
            }
            
            // S'assurer que c'est un tableau et qu'il est réactif
            return Array.isArray(storeData) ? storeData : [];
        }
        return data.value;
    });

    // Computed properties
    const pagination = computed(() => {
        const paginationData = {
            current_page: currentPage.value,
            total_pages: totalPages.value,
            has_next: currentPage.value < totalPages.value,
            has_previous: currentPage.value > 1,
            page_size: pageSizeRef.value,
            total: totalItems.value
        };


        return paginationData;
    });

    // Debounced search
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedSearch = (query: string) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
            searchQuery.value = query;
            currentPage.value = 1;
        }, debounceMs);
    };

    // Méthodes
    const loadData = async (): Promise<void> => {
        loading.value = true;
        error.value = null;

        try {
            // Construire les paramètres au format DataTable
            const params = new URLSearchParams();
            params.append('draw', '1');
            params.append('start', ((currentPage.value - 1) * pageSizeRef.value).toString());
            params.append('length', pageSizeRef.value.toString());
            params.append('search[value]', searchQuery.value || '');
            params.append('search[regex]', 'false');

            // Ajouter le tri au format DataTable
            if (sortModel.value.length > 0) {
                const sort = sortModel.value[0];
                params.append('order[0][column]', '0');
                params.append('order[0][dir]', sort.direction);
            }

            // Ajouter les filtres
            Object.keys(filters.value).forEach((key) => {
                const filter = filters.value[key];
                if (filter && filter.value !== undefined && filter.value !== '') {
                    const operator = filter.operator || 'contains';
                    const paramName = `${key}_${operator}`;

                    if (filter.value2 !== undefined) {
                        params.append(`${key}_gte`, filter.value.toString());
                        params.append(`${key}_lte`, filter.value2.toString());
                    } else if (Array.isArray(filter.value)) {
                        filter.value.forEach((val: any) => {
                            params.append(`${key}_${operator}`, val.toString());
                        });
                    } else {
                        params.append(paramName, filter.value.toString());
                    }
                }
            });

            // Construire l'URL finale
            const baseUrl = endpoint.includes('?') ? endpoint : endpoint + '?';
            const finalUrl = baseUrl + params.toString();


            let result;

            // Utiliser l'action Pinia si un store est configuré
            if (piniaStore) {
                // Construire les paramètres pour l'action Pinia
                const piniaParams = {
                    page: currentPage.value,
                    pageSize: pageSizeRef.value,
                    globalSearch: searchQuery.value, // Utiliser globalSearch au lieu de search
                    filters: filters.value,
                    sort: sortModel.value.length > 0 ? sortModel.value.map(s => ({ colId: s.field, sort: s.direction as 'asc' | 'desc' })) : undefined
                };

                // Détecter automatiquement l'action disponible dans le store
                const actionName = findFetchAction(piniaStore, storeId);

                if (typeof piniaStore[actionName] === 'function') {
                    result = await piniaStore[actionName](piniaParams);
                } else {
                    throw new Error(`Action ${actionName} introuvable dans le store Pinia`);
                }

                if (!result) {
                    throw new Error('Erreur lors de l\'appel à l\'action Pinia');
                }
            } else {
                // Fallback vers l'appel direct
                const response = await fetch(finalUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                result = await response.json();

                if (result.error) {
                    throw new Error(result.error);
                }
            }

            // Validation de la réponse - adaptée pour les stores Pinia
            if (!result) {
                throw new Error('Aucune réponse reçue du store Pinia');
            }

            // Vérifier que nous avons des données valides
            const hasValidData = result.data || result.results || Array.isArray(result);
            if (!hasValidData) {
                logger.warn('Format de réponse inattendu', result);
                // Ne pas lever d'erreur, continuer avec les données disponibles
            }

            // Utiliser recordsFiltered pour la pagination (nombre après filtrage)
            const filteredCount = result.recordsFiltered || result.totalRows || result.recordsTotal || 0;
            const totalCount = result.recordsTotal || result.totalRows || 0;

            // Traitement de la réponse selon le format
            if (piniaStore) {
                // Les données sont déjà stockées dans Pinia par l'action
                // Utiliser recordsFiltered pour la pagination (nombre d'éléments après filtrage)
                totalItems.value = filteredCount;
                totalPages.value = Math.ceil(totalItems.value / pageSizeRef.value);
            } else {
                // Stockage local si pas de Pinia
                data.value = DataTableService.extractData<T>(result, true);
                totalItems.value = filteredCount;
                totalPages.value = Math.ceil(totalItems.value / pageSizeRef.value);

            }

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur de chargement';
            logger.error('Erreur DataTable', err);

            // En cas d'erreur, vider les données
            data.value = [];
            totalItems.value = 0;
            totalPages.value = 0;
        } finally {
            loading.value = false;
        }
    };

    const setPage = (page: number): void => {
        // Validation simple : page doit être >= 1
        // Ne pas valider contre totalPages car il peut être 0 au début
        if (page >= 1) {
            currentPage.value = page;
        }
    };

    const setPageSize = (size: number): void => {
        pageSizeRef.value = size;
        currentPage.value = 1;
        
        // Synchroniser avec le store Pinia si disponible
        if (piniaStore && typeof piniaStore.setPageSize === 'function') {
            piniaStore.setPageSize(size);
        } else if (piniaStore && piniaStore.pageSize !== undefined) {
            // Si le store a une propriété pageSize réactive, la mettre à jour
            piniaStore.pageSize = size;
        }
    };

    const setSearch = (query: string): void => {
        debouncedSearch(query);
    };

    const setSort = (field: string, direction: 'asc' | 'desc'): void => {
        sortModel.value = [{ field, direction }];
    };

    const setSortModel = (newSortModel: Array<{ field: string; direction: 'asc' | 'desc' }>): void => {
        sortModel.value = newSortModel;
    };

    const setFilters = (newFilters: Record<string, any>): void => {
        filters.value = { ...filters.value, ...newFilters };
        currentPage.value = 1;
    };

    const resetFilters = (): void => {
        filters.value = {};
        searchQuery.value = '';
        currentPage.value = 1;
    };

    const setColumns = (newColumns: Array<{ field: string; searchable: boolean; orderable: boolean }>): void => {
        columns.value = newColumns;
    };

    const refresh = (): Promise<void> => {
        return loadData();
    };

    // Méthodes Pinia
    const getFromPinia = (property: string): any => {
        if (piniaStore && property in piniaStore) {
            return piniaStore[property];
        }
        return undefined;
    };

    // Watchers pour le rechargement automatique
    // DÉSACTIVÉ: Le watcher de usePiniaDataTable gère le rechargement
    // Ce watcher créait un conflit de timing
    // watch([currentPage, pageSizeRef, searchQuery, sortModel, filters],
    //   () => {
    //     console.log('🔄 useBackendDataTable - Watcher déclenché:', {
    //       currentPage: currentPage.value,
    //       pageSize: pageSizeRef.value,
    //       autoLoad
    //     });
    //     if (autoLoad) {
    //       loadData();
    //     }
    //   },
    //   { deep: true }
    // );

    // Initialisation - ne pas déclencher automatiquement ici
    // Laisser customLoadData gérer l'initialisation

    // Interface publique
    const state: BackendDataTableState<T> = {
        data: data.value as T[],
        loading: loading.value,
        error: error.value,
        currentPage: currentPage.value,
        pageSize: pageSizeRef.value,
        totalItems: totalItems.value,
        totalPages: totalPages.value,
        searchQuery: searchQuery.value,
        sortModel: sortModel.value,
        filters: filters.value,
        columns: columns.value
    };

    const actions: BackendDataTableActions = {
        loadData,
        refresh,
        setPage,
        setPageSize,
        setSearch,
        setSort,
        setSortModel,
        setFilters,
        resetFilters,
        setColumns,
        getFromPinia
    };

    return {
        // État réactif - utiliser les données Pinia si disponible
        data: piniaStore ? piniaData : data,
        loading,
        error,
        pagination,

        // Paramètres
        currentPage,
        pageSize: pageSizeRef,
        searchQuery,
        sortModel,
        filters,
        columns,

        // Méthodes
        ...actions,

        // Interface complète
        state,
        actions
    };
}

/**
 * Helper pour créer facilement des DataTables avec les stores Pinia existants
 *
 * @param piniaStore - Instance du store Pinia à utiliser
 * @param actionName - Nom de l'action à utiliser (ex: 'fetchJobs', 'fetchLocations')
 * @param options - Options supplémentaires pour le composable
 * @returns Instance du composable configuré
 *
 * @example
 * // Utilisation simple avec store Job
 * const jobStore = useJobStore();
 * const jobsTable = usePiniaDataTable(jobStore, 'fetchJobs');
 *
 * // Avec options personnalisées
 * const locationStore = useLocationStore();
 * const locationsTable = usePiniaDataTable(locationStore, 'fetchLocations', {
 *   pageSize: 50,
 *   autoLoad: false
 * });
 */
export function usePiniaDataTable<T = any>(
    piniaStore: any,
    actionName: string,
    options: Omit<BackendDataTableOptions, 'piniaStore' | 'storeId'> = {}
) {

    // Variables locales pour la pagination
    const totalItems = ref(0);
    const totalPages = ref(0);

    const {
        data,
        loading,
        error,
        pagination,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        filters,
        columns,
        loadData: originalLoadData,
        refresh,
        setPage,
        setPageSize,
        setSearch,
        setSort,
        setSortModel,
        setFilters,
        resetFilters,
        setColumns,
        getFromPinia
    } = useBackendDataTable('', {
        ...options,
        piniaStore,
        storeId: piniaStore.$id
    });

    // Computed pour récupérer les données depuis Pinia
    const piniaData = computed(() => {
        // Récupérer les données depuis le store Pinia
        // Essayer plusieurs noms possibles: jobs, locations, inventories, etc.
        const storeData = piniaStore.jobs || piniaStore.locations || piniaStore.inventories ||
                          piniaStore.resources || piniaStore.warehouses || [];


        return Array.isArray(storeData) ? storeData : [];
    });

    // Override de loadData pour utiliser l'action spécifiée
    const customLoadData = async (): Promise<void> => {
        loading.value = true;
        error.value = null;

        try {
            // Construire l'URL avec les paramètres DataTable
            const frontendParams = {
                page: currentPage.value,
                pageSize: pageSize.value,
                search: searchQuery.value,
                sort: sortModel.value,
                filters: filters.value
            };

            // Construire les paramètres DataTable manuellement
            const params = new URLSearchParams();
            params.append('draw', '1');
            params.append('start', ((currentPage.value - 1) * pageSize.value).toString());
            params.append('length', pageSize.value.toString());
            params.append('search[value]', searchQuery.value || '');
            params.append('search[regex]', 'false');


            // Ajouter le tri
            if (sortModel.value.length > 0) {
                const sort = sortModel.value[0];
                params.append('order[0][column]', '0');
                params.append('order[0][dir]', sort.direction);
            }

            // Ajouter les filtres au format backend
            Object.keys(filters.value).forEach((key, index) => {
                const filter = filters.value[key];
                if (filter && filter.value !== undefined && filter.value !== '') {
                    // Format backend: field_operator=value (ex: code_article_contains=IMMO048)
                    const operator = filter.operator || 'contains';
                    const paramName = `${key}_${operator}`;

                    // Gestion des différents types de filtres
                    if (filter.value2 !== undefined) {
                        // Filtre range (between)
                        params.append(`${key}_gte`, filter.value.toString());
                        params.append(`${key}_lte`, filter.value2.toString());
                    } else if (Array.isArray(filter.value)) {
                        // Filtre liste (in, not_in)
                        filter.value.forEach((val: any) => {
                            params.append(`${key}_${operator}`, val.toString());
                        });
                    } else {
                        // Filtre standard
                        params.append(paramName, filter.value.toString());
                    }
                }
            });

            // Construire l'URL avec les paramètres DataTable
            // L'endpoint sera géré par le service lui-même
            const url = `?${params.toString()}`;

            // Construire les paramètres pour l'action Pinia
            const piniaParams = {
                sort: sortModel.value.length > 0 ? sortModel.value.map(s => ({ colId: s.field, sort: s.direction as 'asc' | 'desc' })) : undefined,
                filter: filters.value,
                page: currentPage.value,
                pageSize: pageSize.value
            };

            // Utiliser la fonction générique pour trouver l'action
            const finalActionName = findFetchAction(piniaStore, piniaStore.$id);

            if (typeof piniaStore[finalActionName] !== 'function') {
                throw new Error(`Action ${finalActionName} introuvable dans le store Pinia`);
            }

            const result = await piniaStore[finalActionName](piniaParams);

            if (!result) {
                throw new Error('Erreur lors de l\'appel à l\'action Pinia');
            }

            // Mettre à jour la pagination avec les données du résultat
            // Utiliser recordsFiltered pour la pagination (nombre après filtrage)
            const filteredCount = result.recordsFiltered || result.totalRows || result.recordsTotal || 0;
            const totalCount = result.recordsTotal || result.totalRows || 0;

            // Mettre à jour la pagination
            totalItems.value = filteredCount;
            totalPages.value = Math.ceil(filteredCount / pageSize.value);


        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur de chargement';
            logger.error('Erreur DataTable', err);
        } finally {
            loading.value = false;
        }
    };

    // Watcher pour les changements de paramètres
    // DÉSACTIVÉ: Les handlers dans les vues (onDtPageChanged, etc.) gèrent directement le rechargement
    // Ce watcher créait des appels concurrents avec des valeurs non synchronisées
    // watch([currentPage, pageSize, searchQuery, sortModel, filters],
    //   () => {
    //     console.log('🔄 usePiniaDataTable - Watcher déclenché:', {
    //       currentPage: currentPage.value,
    //       pageSize: pageSize.value,
    //       autoLoad: options.autoLoad
    //     });
    //     if (options.autoLoad !== false) {
    //       customLoadData();
    //     }
    //   },
    //   { deep: true, flush: 'post' }
    // );

    // Initialisation si autoLoad est activé
    if (options.autoLoad !== false) {
        customLoadData();
    }

    // Computed properties pour compatibilité avec DataTable.vue
    const effectiveCurrentPage = computed(() => currentPage.value);
    const effectiveTotalPages = computed(() => totalPages.value);
    const effectiveTotalItems = computed(() => totalItems.value);
    const effectivePageSize = computed(() => pageSize.value);
    const start = computed(() => ((currentPage.value - 1) * pageSize.value) + 1);
    const end = computed(() => Math.min(currentPage.value * pageSize.value, totalItems.value));

    return {
        data: piniaData, // Utiliser piniaData au lieu de data
        loading,
        error,
        pagination,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        filters,
        columns,
        loadData: customLoadData,
        refresh: customLoadData, // Utiliser customLoadData pour refresh aussi
        setPage,
        setPageSize,
        setSearch,
        setSort,
        setSortModel,
        setFilters,
        resetFilters,
        setColumns,
        getFromPinia,
        // Propriétés effectives pour compatibilité avec DataTable.vue
        effectiveCurrentPage,
        effectiveTotalPages,
        effectiveTotalItems,
        effectivePageSize,
        start,
        end,
        // Refs pour totalItems et totalPages (pour synchronisation)
        totalItems,
        totalPages,
        // Informations sur le store
        storeId: piniaStore.$id,
        actionName
    };
}

