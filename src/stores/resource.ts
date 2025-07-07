import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import ResourceService from '@/services/ResourceService';
import type { Resource, CreateResourceRequest, UpdateResourceRequest } from '@/models/Resource';
import { alertService } from '@/services/alertService';

export const useResourceStore = defineStore('resource', () => {
    // State
    const resources = ref<Resource[]>([]);
    const currentResource = ref<Resource | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const itemsPerPage = ref(10);
    const searchQuery = ref('');

    // Getters
    const getResources = computed(() => resources.value);
    const getCurrentResource = computed(() => currentResource.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);
    const getTotalCount = computed(() => totalCount.value);
    const getCurrentPage = computed(() => currentPage.value);
    const getItemsPerPage = computed(() => itemsPerPage.value);
    const getSearchQuery = computed(() => searchQuery.value);

    // Actions
    const setLoading = (isLoading: boolean) => {
        loading.value = isLoading;
    };

    const setError = (errorMessage: string | null) => {
        error.value = errorMessage;
    };

    const clearError = () => {
        error.value = null;
    };

    const setCurrentResource = (resource: Resource | null) => {
        currentResource.value = resource;
    };

    const setSearchQuery = (query: string) => {
        searchQuery.value = query;
    };

    const setPagination = (page: number, limit: number) => {
        currentPage.value = page;
        itemsPerPage.value = limit;
    };

    // Fetch all resources with pagination
    const fetchResources = async (page: number = 1, limit: number = 10) => {
        try {
            setLoading(true);
            clearError();

            const response = await ResourceService.getResources(page, limit);
            resources.value = response.data;
            totalCount.value = response.count;
            currentPage.value = page;
            itemsPerPage.value = limit;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des ressources';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // Fetch resource by ID
    const fetchResourceById = async (id: number) => {
        try {
            setLoading(true);
            clearError();

            const resource = await ResourceService.getResourceById(id);
            setCurrentResource(resource);
            return resource;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération de la ressource';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Create new resource
    const createResource = async (resourceData: CreateResourceRequest) => {
        try {
            setLoading(true);
            clearError();

            const newResource = await ResourceService.createResource(resourceData);
            resources.value.unshift(newResource); // Add to beginning of list
            totalCount.value += 1;

            await alertService.success({ text: 'Ressource créée avec succès' });
            return newResource;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la création de la ressource';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Update resource
    const updateResource = async (id: number, resourceData: UpdateResourceRequest) => {
        try {
            setLoading(true);
            clearError();

            const updatedResource = await ResourceService.updateResource(id, resourceData);

            // Update in resources list
            const index = resources.value.findIndex(r => r.id === id);
            if (index !== -1) {
                resources.value[index] = updatedResource;
            }

            // Update current resource if it's the one being updated
            if (currentResource.value?.id === id) {
                setCurrentResource(updatedResource);
            }

            await alertService.success({ text: 'Ressource mise à jour avec succès' });
            return updatedResource;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour de la ressource';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Delete resource
    const deleteResource = async (id: number) => {
        try {
            setLoading(true);
            clearError();

            await ResourceService.deleteResource(id);

            // Remove from resources list
            resources.value = resources.value.filter(r => r.id !== id);
            totalCount.value -= 1;

            // Clear current resource if it's the one being deleted
            if (currentResource.value?.id === id) {
                setCurrentResource(null);
            }

            await alertService.success({ text: 'Ressource supprimée avec succès' });
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de la ressource';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Search resources
    const searchResources = async (query: string, page: number = 1, limit: number = 10) => {
        try {
            setLoading(true);
            clearError();

            const response = await ResourceService.searchResources(query, page, limit);
            resources.value = response.data;
            totalCount.value = response.count;
            currentPage.value = page;
            itemsPerPage.value = limit;
            searchQuery.value = query;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la recherche de ressources';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // Get available resources
    const fetchAvailableResources = async () => {
        try {
            setLoading(true);
            clearError();

            const availableResources = await ResourceService.getAvailableResources();
            return availableResources;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des ressources disponibles';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Assign resource to inventory
    const assignResourceToInventory = async (inventoryId: number, resourceId: number, quantity: number) => {
        try {
            setLoading(true);
            clearError();

            const result = await ResourceService.assignResourceToInventory({
                inventory_id: inventoryId,
                resource_id: resourceId,
                quantity
            });

            await alertService.success({ text: 'Ressource assignée avec succès' });
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de l\'assignation de la ressource';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Remove resource from inventory
    const removeResourceFromInventory = async (inventoryId: number, resourceId: number) => {
        try {
            setLoading(true);
            clearError();

            await ResourceService.removeResourceFromInventory(inventoryId, resourceId);

            await alertService.success({ text: 'Ressource retirée avec succès' });
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors du retrait de la ressource';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Get inventory resources
    // const fetchInventoryResources = async (inventoryId: number) => {
    //     try {
    //         setLoading(true);
    //         clearError();

    //         const inventoryResources = await ResourceService.getInventoryResources(inventoryId);
    //         return inventoryResources;
    //     } catch (err: any) {
    //         const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des ressources de l\'inventaire';
    //         setError(errorMessage);
    //         await alertService.error({ text: errorMessage });
    //         return [];
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Update assigned resource quantity
    const updateAssignedResourceQuantity = async (inventoryId: number, resourceId: number, quantity: number) => {
        try {
            setLoading(true);
            clearError();

            const result = await ResourceService.updateAssignedResourceQuantity(inventoryId, resourceId, quantity);

            await alertService.success({ text: 'Quantité mise à jour avec succès' });
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour de la quantité';
            setError(errorMessage);
            await alertService.error({ text: errorMessage });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Reset store state
    const resetState = () => {
        resources.value = [];
        currentResource.value = null;
        loading.value = false;
        error.value = null;
        totalCount.value = 0;
        currentPage.value = 1;
        itemsPerPage.value = 10;
        searchQuery.value = '';
    };

    return {
        // State
        resources,
        currentResource,
        loading,
        error,
        totalCount,
        currentPage,
        itemsPerPage,
        searchQuery,

        // Getters
        getResources,
        getCurrentResource,
        isLoading,
        getError,
        getTotalCount,
        getCurrentPage,
        getItemsPerPage,
        getSearchQuery,

        // Actions
        setLoading,
        setError,
        clearError,
        setCurrentResource,
        setSearchQuery,
        setPagination,
        fetchResources,
        fetchResourceById,
        createResource,
        updateResource,
        deleteResource,
        searchResources,
        fetchAvailableResources,
        assignResourceToInventory,
        removeResourceFromInventory,
        // fetchInventoryResources,
        updateAssignedResourceQuantity,
        resetState
    };
});
