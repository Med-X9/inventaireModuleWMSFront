import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LocationService, type LocationDataTableParams } from '@/services/LocationService';
import { alertService } from '@/services/alertService';
import {
    buildDataTableParams,
    processDataTableResponse,
    type DataTableParams,
    type DataTableResponse
} from '@/utils/dataTableUtils';
import API from '@/api';
import type {
    Location,
    CreateLocationRequest,
    UpdateLocationRequest,
    LocationResponse,
    LocationQueryParams
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

    // ===== ACTIONS =====



    // Récupérer les locations non assignées
    const fetchUnassignedLocations = async (account_id: number, inventory_id: number, warehouse_id: number, params?: LocationDataTableParams): Promise<DataTableResponse<Location> | void> => {
        loading.value = true;
        error.value = null;

        try {
            const response = await LocationService.getUnassigned(account_id, inventory_id, warehouse_id, params);
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

            const isDataTableParams = params && ('draw' in params || 'start' in params || 'length' in params);

            if (isDataTableParams) {
                const pageLength = params?.length || pageSize.value || results.length || 1;
                pageSize.value = pageLength;
                const computedPage = params?.start !== undefined && pageLength > 0
                    ? Math.floor((params.start || 0) / pageLength) + 1
                    : params?.draw || currentPage.value;
                currentPage.value = Math.max(1, computedPage || 1);

                return processDataTableResponse(
                    {
                        draw: params?.draw || (payload as DataTableResponse<Location>).draw || 1,
                        recordsTotal,
                        recordsFiltered,
                        data: results
                    },
                    currentPage,
                    totalPages,
                    totalCount,
                    pageLength
                );
            }

            totalCount.value = recordsTotal;
            totalPages.value = Math.max(1, Math.ceil(totalCount.value / (pageSize.value || 1)));

            if ((params as LocationQueryParams)?.page) {
                currentPage.value = (params as LocationQueryParams).page as number;
            }
            if ((params as LocationQueryParams)?.page_size) {
                pageSize.value = (params as LocationQueryParams).page_size as number;
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des locations non assignées';
            await alertService.error({ text: 'Erreur lors du chargement des locations non assignées' });
            throw err;
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
            error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération de la location';
            await alertService.error({ text: 'Erreur lors de la récupération de la location' });
            throw err;
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
            error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération de la location';
            await alertService.error({ text: 'Erreur lors de la récupération de la location' });
            throw err;
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
            error.value = err instanceof Error ? err.message : 'Erreur lors de la création de la location';
            await alertService.error({ text: 'Erreur lors de la création de la location' });
            throw err;
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
            error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la location';
            await alertService.error({ text: 'Erreur lors de la mise à jour de la location' });
            throw err;
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
            error.value = err instanceof Error ? err.message : 'Erreur lors de la suppression de la location';
            await alertService.error({ text: 'Erreur lors de la suppression de la location' });
            throw err;
        } finally {
            deleteLoading.value = false;
        }
    };

    // Rechercher des locations
    const searchLocations = async (query: string, params?: LocationDataTableParams) => {
        searchLoading.value = true;
        error.value = null;

        try {
            const response = await LocationService.search(query, params);
            const data = response.data;

            locations.value = data.results || [];
            totalCount.value = data.count || 0;

            return data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur lors de la recherche de locations';
            await alertService.error({ text: 'Erreur lors de la recherche de locations' });
            throw err;
        } finally {
            searchLoading.value = false;
        }
    };

    // Récupérer les locations par sous-zone
    const fetchLocationsBySousZone = async (sousZoneId: number, params?: LocationDataTableParams) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await LocationService.getBySousZone(sousZoneId, params);
            const data = response.data;

            locations.value = data.results || [];
            totalCount.value = data.count || 0;

            return data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération des locations par sous-zone';
            await alertService.error({ text: 'Erreur lors de la récupération des locations par sous-zone' });
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Récupérer les locations par zone
    const fetchLocationsByZone = async (zoneId: number, params?: LocationDataTableParams) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await LocationService.getByZone(zoneId, params);
            const data = response.data;

            locations.value = data.results || [];
            totalCount.value = data.count || 0;

            return data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération des locations par zone';
            await alertService.error({ text: 'Erreur lors de la récupération des locations par zone' });
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Récupérer les locations par entrepôt
    const fetchLocationsByWarehouse = async (warehouseId: number, params?: LocationDataTableParams): Promise<DataTableResponse<Location> | LocationResponse | void> => {
        loading.value = true;
        error.value = null;

        try {
            // Le service accepte maintenant directement LocationDataTableParams qui supporte les deux formats
            const response = await LocationService.getByWarehouse(warehouseId, params);
            const data = response.data;

            locations.value = data.results || [];
            totalCount.value = data.count || 0;

            // Si c'est un format DataTable (avec draw, start, length)
            if (params && ('draw' in params || 'start' in params || 'length' in params)) {
                const draw = params.draw || 1;
                const pageLength = params.length || pageSize.value;

                return processDataTableResponse(
                    {
                        draw: draw,
                        recordsTotal: data.count || 0,
                        recordsFiltered: data.count || 0,
                        data: data.results || []
                    } as DataTableResponse<Location>,
                    currentPage,
                    totalPages,
                    totalCount,
                    pageLength
                );
            } else {
                // Format LocationQueryParams (ancien format avec page, page_size)
                return data;
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération des locations par entrepôt';
            await alertService.error({ text: 'Erreur lors de la récupération des locations par entrepôt' });
            throw err;
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
            error.value = err instanceof Error ? err.message : 'Erreur lors de l\'import en lot des locations';
            await alertService.error({ text: 'Erreur lors de l\'import en lot des locations' });
            throw err;
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
