import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LocationService, type LocationDataTableParams } from '@/services/LocationService';
import { alertService } from '@/services/alertService';
import {
    processDataTableResponse,
    type DataTableResponse
} from '@/utils/dataTableUtils';
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter';
import { normalizeToStandardParams } from '@/components/DataTable/utils/dataTableParamsConverter';
import type { QueryModel } from '@/components/DataTable/types/QueryModel';
import type {
    Location,
    CreateLocationRequest,
    UpdateLocationRequest,
    LocationResponse
} from '@/models/Location';

export const useLocationStore = defineStore('location', () => {
    // ===== ÉTAT =====
    const locations = ref<Location[]>([]);
    const currentLocation = ref<Location | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const totalCount = ref(0);
    const totalPages = ref(1);
    const currentPage = ref(1);
    const pageSize = ref(20);

    // États spécifiques
    const searchLoading = ref(false);
    const createLoading = ref(false);
    const updateLoading = ref(false);
    const deleteLoading = ref(false);
    const statsLoading = ref(false);

    // ===== GETTERS =====
    const getLocations = computed(() => locations.value);
    const getCurrentLocation = computed(() => currentLocation.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);
    const getTotalCount = computed(() => totalCount.value);
    const getCurrentPage = computed(() => currentPage.value);
    const getPageSize = computed(() => pageSize.value);

    // Getters calculés
    const getLocationsBySousZone = computed(() => {
        const grouped: Record<string, Location[]> = {};
        locations.value.forEach(location => {
            const sousZoneName = location.sous_zone.sous_zone_name;
            if (!grouped[sousZoneName]) {
                grouped[sousZoneName] = [];
            }
            grouped[sousZoneName].push(location);
        });
        return grouped;
    });

    const getLocationsByZone = computed(() => {
        const grouped: Record<string, Location[]> = {};
        locations.value.forEach(location => {
            const zoneName = location.zone.zone_name;
            if (!grouped[zoneName]) {
                grouped[zoneName] = [];
            }
            grouped[zoneName].push(location);
        });
        return grouped;
    });

    const getLocationsByWarehouse = computed(() => {
        const grouped: Record<string, Location[]> = {};
        locations.value.forEach(location => {
            const warehouseName = location.warehouse.warehouse_name;
            if (!grouped[warehouseName]) {
                grouped[warehouseName] = [];
            }
            grouped[warehouseName].push(location);
        });
        return grouped;
    });

    const getSousZones = computed(() => {
        return [...new Set(locations.value.map(location => location.sous_zone.sous_zone_name))];
    });

    const getZones = computed(() => {
        return [...new Set(locations.value.map(location => location.zone.zone_name))];
    });

    const getWarehouses = computed(() => {
        return [...new Set(locations.value.map(location => location.warehouse.warehouse_name))];
    });

    const getLocationsByReference = computed(() => {
        const grouped: Record<string, Location[]> = {};
        locations.value.forEach(location => {
            if (!grouped[location.reference]) {
                grouped[location.reference] = [];
            }
            grouped[location.reference].push(location);
        });
        return grouped;
    });

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Met à jour la pagination à partir des paramètres standard et retourne les infos de pagination
     */
    const updatePaginationFromParams = (
        standardParams: StandardDataTableParams,
        recordsFiltered: number,
        defaultLength: number = pageSize.value
    ): { pageLength: number; computedPage: number } => {
        const pageLength = standardParams.length || defaultLength;
        pageSize.value = pageLength;

        const computedPage = standardParams.start !== undefined && pageLength > 0
            ? Math.floor((standardParams.start || 0) / pageLength) + 1
            : standardParams.draw || currentPage.value;

        currentPage.value = Math.max(1, computedPage || 1);
        totalCount.value = recordsFiltered;
        totalPages.value = Math.max(1, Math.ceil(recordsFiltered / pageLength));

        return { pageLength, computedPage };
    };

    /**
     * Gère les erreurs de manière uniforme
     */
    const handleError = async (err: unknown, defaultMessage: string): Promise<never> => {
        const errorMessage = err instanceof Error ? err.message : defaultMessage;
        error.value = errorMessage;
        await alertService.error({ text: errorMessage });
        throw err;
    };

    // ===== ACTIONS =====

    // 🚀 Accepte QueryModel ou StandardDataTableParams ou LocationDataTableParams - conversion automatique
    const fetchUnassignedLocations = async (
        account_id: number,
        inventory_id: number,
        warehouse_id: number,
        params?: QueryModel | StandardDataTableParams | LocationDataTableParams
    ): Promise<DataTableResponse<Location> | void> => {
        loading.value = true;
        error.value = null;

        try {
            // Normaliser les paramètres (détecte et convertit QueryModel si nécessaire)
            const standardParams: StandardDataTableParams = normalizeToStandardParams(
                params,
                {
                    draw: 1,
                    defaultPage: currentPage.value,
                    defaultPageSize: pageSize.value
                }
            );

            // Ajouter les paramètres spécifiques aux locations
            const paramsWithLocationData: LocationDataTableParams = {
                ...standardParams,
                account_id,
                inventory_id,
                warehouse_id
            };

            const response = await LocationService.getUnassigned(account_id, inventory_id, warehouse_id, paramsWithLocationData);
            const payload = response.data as (LocationResponse & DataTableResponse<Location>) | LocationResponse | DataTableResponse<Location>;

            const results = Array.isArray((payload as DataTableResponse<Location>).data)
                ? (payload as DataTableResponse<Location>).data as Location[]
                : (payload as LocationResponse).results || [];

            const recordsTotal = (payload as DataTableResponse<Location>).recordsTotal
                ?? (payload as LocationResponse).count
                ?? results.length;

            const recordsFiltered = (payload as DataTableResponse<Location>).recordsFiltered
                ?? recordsTotal;

            locations.value = results;

            // Mettre à jour la pagination
            const { pageLength } = updatePaginationFromParams(standardParams, recordsFiltered);

            return processDataTableResponse(
                {
                    draw: standardParams.draw || (payload as DataTableResponse<Location>).draw || 1,
                    recordsTotal,
                    recordsFiltered,
                    data: results
                },
                currentPage,
                totalPages,
                totalCount,
                pageLength
            );
        } catch (err) {
            await handleError(err, 'Erreur lors du chargement des locations non assignées');
        } finally {
            loading.value = false;
        }
    };

    // Récupérer une location par ID
    const fetchLocationById = async (id: number | string) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await LocationService.getById(id);
            currentLocation.value = response.data;
            return response.data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la récupération de la location');
        } finally {
            loading.value = false;
        }
    };

    // Récupérer une location par référence
    const fetchLocationByReference = async (reference: string) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await LocationService.getByReference(reference);
            currentLocation.value = response.data;
            return response.data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la récupération de la location');
        } finally {
            loading.value = false;
        }
    };

    // Créer une nouvelle location
    const createLocation = async (data: CreateLocationRequest) => {
        createLoading.value = true;
        error.value = null;

        try {
            const response = await LocationService.create(data);
            const newLocation = response.data;

            // Ajouter à la liste
            locations.value.unshift(newLocation);
            totalCount.value++;

            await alertService.success({ text: 'Location créée avec succès' });
            return newLocation;
        } catch (err) {
            await handleError(err, 'Erreur lors de la création de la location');
        } finally {
            createLoading.value = false;
        }
    };

    // Mettre à jour une location
    const updateLocation = async (id: number | string, data: UpdateLocationRequest) => {
        updateLoading.value = true;
        error.value = null;

        try {
            const response = await LocationService.update(id, data);
            const updatedLocation = response.data;

            // Mettre à jour dans la liste
            const index = locations.value.findIndex(loc => loc.id === updatedLocation.id);
            if (index !== -1) {
                locations.value[index] = updatedLocation;
            }

            // Mettre à jour la location courante si c'est la même
            if (currentLocation.value?.id === updatedLocation.id) {
                currentLocation.value = updatedLocation;
            }

            await alertService.success({ text: 'Location mise à jour avec succès' });
            return updatedLocation;
        } catch (err) {
            await handleError(err, 'Erreur lors de la mise à jour de la location');
        } finally {
            updateLoading.value = false;
        }
    };

    // Supprimer une location
    const deleteLocation = async (id: number | string) => {
        deleteLoading.value = true;
        error.value = null;

        try {
            await LocationService.delete(id);

            // Supprimer de la liste
            locations.value = locations.value.filter(loc => loc.id !== id);
            totalCount.value--;

            // Réinitialiser la location courante si c'est la même
            if (currentLocation.value?.id === id) {
                currentLocation.value = null;
            }

            await alertService.success({ text: 'Location supprimée avec succès' });
        } catch (err) {
            await handleError(err, 'Erreur lors de la suppression de la location');
        } finally {
            deleteLoading.value = false;
        }
    };

    // Rechercher des locations
    const searchLocations = async (query: string, params?: QueryModel | StandardDataTableParams | LocationDataTableParams) => {
        searchLoading.value = true;
        error.value = null;

        try {
            // Normaliser les paramètres si fournis
            const standardParams = params ? normalizeToStandardParams(params, {
                draw: 1,
                defaultPage: currentPage.value,
                defaultPageSize: pageSize.value
            }) : undefined;

            const response = await LocationService.search(query, standardParams as LocationDataTableParams);
            const data = response.data;

            locations.value = data.results || [];
            if (standardParams && data.count !== undefined) {
                updatePaginationFromParams(standardParams, data.count || 0);
            } else {
                totalCount.value = data.count || 0;
            }

            return data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la recherche de locations');
        } finally {
            searchLoading.value = false;
        }
    };

    // Récupérer les locations par sous-zone
    const fetchLocationsBySousZone = async (
        sousZoneId: number,
        params?: QueryModel | StandardDataTableParams | LocationDataTableParams
    ) => {
        loading.value = true;
        error.value = null;

        try {
            // Normaliser les paramètres si fournis
            const standardParams = params ? normalizeToStandardParams(params, {
                draw: 1,
                defaultPage: currentPage.value,
                defaultPageSize: pageSize.value
            }) : undefined;

            const response = await LocationService.getBySousZone(sousZoneId, standardParams as LocationDataTableParams);
            const data = response.data;

            locations.value = data.results || [];
            if (standardParams && data.count !== undefined) {
                updatePaginationFromParams(standardParams, data.count || 0);
            } else {
                totalCount.value = data.count || 0;
            }

            return data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la récupération des locations par sous-zone');
        } finally {
            loading.value = false;
        }
    };

    // Récupérer les locations par zone
    const fetchLocationsByZone = async (
        zoneId: number,
        params?: QueryModel | StandardDataTableParams | LocationDataTableParams
    ) => {
        loading.value = true;
        error.value = null;

        try {
            // Normaliser les paramètres si fournis
            const standardParams = params ? normalizeToStandardParams(params, {
                draw: 1,
                defaultPage: currentPage.value,
                defaultPageSize: pageSize.value
            }) : undefined;

            const response = await LocationService.getByZone(zoneId, standardParams as LocationDataTableParams);
            const data = response.data;

            locations.value = data.results || [];
            if (standardParams && data.count !== undefined) {
                updatePaginationFromParams(standardParams, data.count || 0);
            } else {
                totalCount.value = data.count || 0;
            }

            return data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la récupération des locations par zone');
        } finally {
            loading.value = false;
        }
    };

    // Récupérer les locations par entrepôt
    // 🚀 Accepte QueryModel ou StandardDataTableParams ou LocationDataTableParams - conversion automatique
    const fetchLocationsByWarehouse = async (
        warehouseId: number,
        params?: QueryModel | StandardDataTableParams | LocationDataTableParams
    ): Promise<DataTableResponse<Location> | LocationResponse | void> => {
        loading.value = true;
        error.value = null;

        try {
            // Normaliser les paramètres (détecte et convertit QueryModel si nécessaire)
            const standardParams: StandardDataTableParams = normalizeToStandardParams(
                params,
                {
                    draw: 1,
                    defaultPage: currentPage.value,
                    defaultPageSize: pageSize.value
                }
            );

            // Le service accepte LocationDataTableParams qui est compatible avec StandardDataTableParams
            const response = await LocationService.getByWarehouse(warehouseId, standardParams as LocationDataTableParams);
            const data = response.data;

            locations.value = data.results || [];

            // Mettre à jour la pagination
            const recordsFiltered = data.count || 0;
            const { pageLength } = updatePaginationFromParams(standardParams, recordsFiltered);

            return processDataTableResponse(
                {
                    draw: standardParams.draw || 1,
                    recordsTotal: data.count || 0,
                    recordsFiltered: data.count || 0,
                    data: data.results || []
                } as DataTableResponse<Location>,
                currentPage,
                totalPages,
                totalCount,
                pageLength
            );
        } catch (err) {
            await handleError(err, 'Erreur lors de la récupération des locations par entrepôt');
        } finally {
            loading.value = false;
        }
    };

    // Importer des locations en lot
    const bulkImportLocations = async (locationsData: CreateLocationRequest[]) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await LocationService.bulkImport(locationsData);
            const result = response.data;

            if (result.errors.length > 0) {
                await alertService.warning({
                    text: `${result.created} locations créées avec succès. ${result.errors.length} erreurs.`
                });
            } else {
                await alertService.success({ text: `${result.created} locations créées avec succès` });
            }

            // Recharger les locations

            return result;
        } catch (err) {
            await handleError(err, 'Erreur lors de l\'import en lot des locations');
        } finally {
            loading.value = false;
        }
    };


    // Sélectionner une location
    const selectLocation = (location: Location) => {
        currentLocation.value = location;
    };

    // Réinitialiser le store
    const resetStore = () => {
        locations.value = [];
        currentLocation.value = null;
        loading.value = false;
        error.value = null;
        totalCount.value = 0;
        currentPage.value = 1;
        pageSize.value = 20;
    };

    // Effacer l'erreur
    const clearError = () => {
        error.value = null;
    };

    return {
        // État
        locations,
        currentLocation,
        loading,
        error,
        totalCount,
        currentPage,
        pageSize,
        searchLoading,
        createLoading,
        updateLoading,
        deleteLoading,
        statsLoading,

        // Getters
        getLocations,
        getCurrentLocation,
        isLoading,
        getError,
        getTotalCount,
        getCurrentPage,
        getPageSize,
        getLocationsBySousZone,
        getLocationsByZone,
        getLocationsByWarehouse,
        getSousZones,
        getZones,
        getWarehouses,
        getLocationsByReference,

        // Actions
        fetchUnassignedLocations,
        fetchLocationById,
        fetchLocationByReference,
        createLocation,
        updateLocation,
        deleteLocation,
        searchLocations,
        fetchLocationsBySousZone,
        fetchLocationsByZone,
        fetchLocationsByWarehouse,
        bulkImportLocations,
        selectLocation,
        resetStore,
        clearError
    };
});
