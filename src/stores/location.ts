import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LocationService } from '@/services/LocationService';
import { alertService } from '@/services/alertService';
import type { DataTableResponse } from '@/utils/dataTableUtils';
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design';
import { convertQueryModelToQueryParams } from '@SMATCH-Digital-dev/vue-system-design';
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
    // Métadonnées de pagination depuis la dernière réponse
    const paginationMetadata = ref<{
        page?: number;
        totalPages?: number;
        pageSize?: number;
        total?: number;
    } | null>(null);

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
     * Gère les erreurs de manière uniforme
     */
    const handleError = async (err: unknown, defaultMessage: string): Promise<never> => {
        const errorMessage = err instanceof Error ? err.message : defaultMessage;
        error.value = errorMessage;
        await alertService.error({ text: errorMessage });
        throw err;
    };

    // ===== ACTIONS =====

    /**
     * Récupère les locations non assignées
     * Le store stocke uniquement les données et métadonnées brutes du backend
     * Le DataTable/useBackendDataTable gère la pagination
     */
    const fetchUnassignedLocations = async (
        account_id: number,
        inventory_id: number,
        warehouse_id: number,
        params?: QueryModel
    ): Promise<DataTableResponse<Location> | void> => {
        loading.value = true;
        error.value = null;

        try {
            // Convertir QueryModel en paramètres de requête
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            const requestBody = {
                account_id,
                inventory_id,
                warehouse_id,
                ...requestParams
            };

            const response = await LocationService.getUnassigned(account_id, inventory_id, warehouse_id, requestBody);
            const payload = response.data as any;

            // Extraire les données
            const results = Array.isArray(payload?.data)
                ? payload.data as Location[]
                : payload?.results || [];

            // Stocker les données brutes
            locations.value = results;

            // Stocker les métadonnées de pagination brutes du backend (sans calcul)
            paginationMetadata.value = {
                page: payload?.page ?? 1,
                totalPages: payload?.totalPages ?? 1,
                pageSize: payload?.pageSize ?? 20,
                total: payload?.total ?? payload?.recordsFiltered ?? payload?.recordsTotal ?? payload?.count ?? 0
            };

            // Mettre à jour totalCount pour compatibilité
            totalCount.value = paginationMetadata.value?.total || 0;

            // Retourner le format DataTable minimal (le DataTable gère la pagination)
            return {
                draw: payload?.draw || 1,
                data: results,
                recordsTotal: payload?.recordsTotal ?? payload?.count ?? paginationMetadata.value.total,
                recordsFiltered: payload?.recordsFiltered ?? paginationMetadata.value.total
            } as any;
        } catch (err) {
            await handleError(err, 'Erreur lors du chargement des locations non assignées');
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
    /**
     * Recherche de locations
     * Le store stocke uniquement les données brutes
     */
    const searchLocations = async (query: string, params?: QueryModel) => {
        searchLoading.value = true;
        error.value = null;

        try {
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            const response = await LocationService.search(query, requestParams);
            const data = response.data;

            locations.value = data.results || [];
            return data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la recherche de locations');
        } finally {
            searchLoading.value = false;
        }
    };

    // Récupérer les locations par sous-zone
    /**
     * Récupère les locations par sous-zone
     * Le store stocke uniquement les données brutes
     */
    const fetchLocationsBySousZone = async (
        sousZoneId: number,
        params?: QueryModel
    ) => {
        loading.value = true;
        error.value = null;

        try {
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            const response = await LocationService.getBySousZone(sousZoneId, requestParams);
            const data = response.data;

            locations.value = data.results || [];
            return data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la récupération des locations par sous-zone');
        } finally {
            loading.value = false;
        }
    };

    // Récupérer les locations par zone
    /**
     * Récupère les locations par zone
     * Le store stocke uniquement les données brutes
     */
    const fetchLocationsByZone = async (
        zoneId: number,
        params?: QueryModel
    ) => {
        loading.value = true;
        error.value = null;

        try {
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            const response = await LocationService.getByZone(zoneId, requestParams);
            const data = response.data;

            locations.value = data.results || [];
            return data;
        } catch (err) {
            await handleError(err, 'Erreur lors de la récupération des locations par zone');
        } finally {
            loading.value = false;
        }
    };

    // Récupérer les locations par entrepôt
    // Accepte QueryModel ou LocationDataTableParams - conversion automatique
    /**
     * Récupère les locations par entrepôt
     * Le store stocke uniquement les données brutes
     */
    const fetchLocationsByWarehouse = async (
        warehouseId: number,
        params?: QueryModel
    ): Promise<DataTableResponse<Location> | LocationResponse | void> => {
        loading.value = true;
        error.value = null;

        try {
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            const response = await LocationService.getByWarehouse(warehouseId, requestParams);
            const data = response.data;

            locations.value = data.results || [];
            return data;
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

    // Mettre à jour le statut de plusieurs locations en lot
    const bulkUpdateStatus = async (locationIds: number[]) => {
        if (!locationIds || locationIds.length === 0) {
            throw new Error('Aucun ID de location fourni');
        }

        loading.value = true;
        error.value = null;

        try {
            await LocationService.bulkUpdateStatus(locationIds);

            // Rafraîchir les données après la mise à jour du statut
            // Les locations désactivées seront automatiquement filtrées lors du prochain fetch
            await alertService.success({
                text: `${locationIds.length} location(s) désactivée(s) avec succès`
            });

            return { success: true, updatedCount: locationIds.length };
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la mise à jour du statut des locations');
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
        paginationMetadata,
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
        fetchLocationByReference,
        createLocation,
        updateLocation,
        deleteLocation,
        searchLocations,
        fetchLocationsBySousZone,
        fetchLocationsByZone,
        fetchLocationsByWarehouse,
        bulkImportLocations,
        bulkUpdateStatus,
        selectLocation,
        resetStore,
        clearError
    };
});
