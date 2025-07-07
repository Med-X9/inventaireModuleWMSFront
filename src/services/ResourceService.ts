import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type {
    Resource,
    CreateResourceRequest,
    UpdateResourceRequest,
    ResourceResponse,
    ResourcesResponse,
    AssignResourceRequest,
    AssignResourceResponse
} from '@/models/Resource';
import API from '@/api';

export class ResourceService {
    /**
     * Récupérer toutes les ressources avec pagination
     */
    static async getResources(page: number = 1, limit: number = 10): Promise<ResourcesResponse> {
        try {
            const response: AxiosResponse<ResourcesResponse> = await axiosInstance.get(
                `${API.endpoints.resource.base}?page=${page}&limit=${limit}`
            );
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des ressources:', error);
            throw error;
        }
    }

    /**
     * Récupérer une ressource par son ID
     */
    static async getResourceById(id: number): Promise<Resource> {
        try {
            const response: AxiosResponse<ResourceResponse> = await axiosInstance.get(
                `${API.endpoints.resource.base}/${id}`
            );
            return response.data.data;
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération de la ressource ${id}:`, error);
            throw error;
        }
    }

    /**
     * Créer une nouvelle ressource
     */
    static async createResource(resourceData: CreateResourceRequest): Promise<Resource> {
        try {
            const response: AxiosResponse<ResourceResponse> = await axiosInstance.post(
                API.endpoints.resource.base,
                resourceData
            );
            return response.data.data;
        } catch (error) {
            console.error('❌ Erreur lors de la création de la ressource:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour une ressource
     */
    static async updateResource(id: number, resourceData: UpdateResourceRequest): Promise<Resource> {
        try {
            const response: AxiosResponse<ResourceResponse> = await axiosInstance.put(
                `${API.endpoints.resource.base}/${id}`,
                resourceData
            );
            return response.data.data;
        } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour de la ressource ${id}:`, error);
            throw error;
        }
    }

    /**
     * Supprimer une ressource
     */
    static async deleteResource(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`${API.endpoints.resource.base}/${id}`);
        } catch (error) {
            console.error(`❌ Erreur lors de la suppression de la ressource ${id}:`, error);
            throw error;
        }
    }

    /**
     * Rechercher des ressources par nom ou référence
     */
    static async searchResources(query: string, page: number = 1, limit: number = 10): Promise<ResourcesResponse> {
        try {
            const response: AxiosResponse<ResourcesResponse> = await axiosInstance.get(
                `${API.endpoints.resource.base}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
            );
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la recherche de ressources:', error);
            throw error;
        }
    }

    /**
     * Récupérer les ressources disponibles (non assignées)
     */
    static async getAvailableResources(): Promise<Resource[]> {
        try {
            const response: AxiosResponse<ResourcesResponse> = await axiosInstance.get(
                `${API.endpoints.resource.base}`
            );
            return response.data.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des ressources disponibles:', error);
            throw error;
        }
    }

    /**
     * Assigner une ressource à un inventaire
     */
    static async assignResourceToInventory(assignData: AssignResourceRequest): Promise<AssignResourceResponse> {
        try {
            const response: AxiosResponse<AssignResourceResponse> = await axiosInstance.post(
                `${API.endpoints.resource.base}/assign`,
                assignData
            );
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de l\'assignation de la ressource:', error);
            throw error;
        }
    }

    /**
     * Retirer une ressource d'un inventaire
     */
    static async removeResourceFromInventory(inventoryId: number, resourceId: number): Promise<void> {
        try {
            await axiosInstance.delete(
                `${API.endpoints.resource.base}/assign/${inventoryId}/${resourceId}`
            );
        } catch (error) {
            console.error('❌ Erreur lors du retrait de la ressource:', error);
            throw error;
        }
    }

    /**
     * Récupérer les ressources d'un inventaire spécifique
     */
    // static async getInventoryResources(inventoryId: number): Promise<Resource[]> {
    //     try {
    //         const response: AxiosResponse<ResourcesResponse> = await axiosInstance.get(
    //             `${API.INVENTORIES}/${inventoryId}/resources`
    //         );
    //         return response.data.data;
    //     } catch (error) {
    //         console.error(`❌ Erreur lors de la récupération des ressources de l'inventaire ${inventoryId}:`, error);
    //         throw error;
    //     }
    // }

    /**
     * Mettre à jour la quantité d'une ressource assignée
     */
    static async updateAssignedResourceQuantity(
        inventoryId: number,
        resourceId: number,
        quantity: number
    ): Promise<AssignResourceResponse> {
        try {
            const response: AxiosResponse<AssignResourceResponse> = await axiosInstance.patch(
                `${API.endpoints.resource.base}/assign/${inventoryId}/${resourceId}`,
                { quantity }
            );
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de la quantité:', error);
            throw error;
        }
    }
}

export default ResourceService;
