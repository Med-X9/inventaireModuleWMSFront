// src/services/LocationService.ts
import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type {
    Location,
    CreateLocationRequest,
    UpdateLocationRequest,
    LocationResponse,
    LocationQueryParams
} from '@/models/Location';
import type { DataTableResponse } from '@/utils/dataTableUtils';
import API from '@/api';
import { logger } from '@/services/loggerService';
import { normalizeDataTableResponse, convertUnifiedToStandardDataTable } from '@/utils/dataTableResponseNormalizer';
import type { UnifiedDataTableResponse } from '@/utils/dataTableResponseNormalizer';

// Extension pour LocationResponse pour supporter DataTable
export interface DataTableLocationResponse extends LocationResponse {}

// Interface pour les paramètres DataTable
export interface DataTableParams {
    draw?: number;
    start?: number;
    length?: number;
    [key: string]: any;
}

// Interface combinant les paramètres de Location et DataTable
export interface LocationDataTableParams extends Partial<LocationQueryParams> {
    draw?: number;
    start?: number;
    length?: number;
    [key: string]: any;
}

export class LocationService {
    /**
     * Récupérer toutes les locations avec pagination
     * @param params - Paramètres de requête optionnels (supporte DataTable et filtres)
     * @returns Promise avec la réponse paginée de locations
     */

    /**
     * Récupérer les locations non assignées pour un entrepôt et un inventaire (format FORMAT_ACTUEL.md)
     * Le service reçoit les paramètres déjà convertis au format FORMAT_ACTUEL.md par le store
     * @param account_id - ID du compte
     * @param inventory_id - ID de l'inventaire
     * @param warehouse_id - ID de l'entrepôt
     * @param params - Paramètres au format FORMAT_ACTUEL.md (déjà convertis par le store)
     * @returns Promise avec la réponse paginée de locations non assignées
     */
    static async getUnassigned(
        account_id: number,
        inventory_id: number,
        warehouse_id: number,
        params?: Record<string, any>
    ): Promise<AxiosResponse<(LocationResponse | DataTableResponse<Location>) & { page: number; totalPages: number; pageSize: number; total: number }>> {
        try {
            const url = `${API.endpoints.warehouse?.base}${account_id}/warehouse/${warehouse_id}/inventory/${inventory_id}/locations/unassigned/`;

            const response = await axiosInstance.post<UnifiedDataTableResponse<Location>>(
                url,
                params || {},
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            const unifiedResponse = normalizeDataTableResponse<Location>(response.data);
            const standardResponse = convertUnifiedToStandardDataTable(unifiedResponse);
            return {
                ...response,
                data: {
                    ...standardResponse,
                    page: unifiedResponse.page,
                    totalPages: unifiedResponse.totalPages,
                    pageSize: unifiedResponse.pageSize,
                    total: unifiedResponse.total
                } as any
            } as AxiosResponse<(LocationResponse | DataTableResponse<Location>) & { page: number; totalPages: number; pageSize: number; total: number }>;
        } catch (error) {
            logger.error('Erreur lors de la récupération des locations non assignées', error);
            throw error;
        }
    }

    // Récupérer une location par ID

    // Récupérer une location par référence
    static async getByReference(reference: string): Promise<AxiosResponse<Location>> {
        try {
            return await axiosInstance.get<Location>(`${API.endpoints.location?.base}by-reference/${reference}/`);
        } catch (error) {
            logger.error('Erreur lors de la récupération de la location par référence', error);
            throw error;
        }
    }

    // Créer une nouvelle location
    static async create(data: CreateLocationRequest): Promise<AxiosResponse<Location>> {
        try {
            return await axiosInstance.post<Location>(`${API.endpoints.location?.base}`, data);
        } catch (error) {
            logger.error('Erreur lors de la création de la location', error);
            throw error;
        }
    }

    // Mettre à jour une location
    static async update(id: number | string, data: UpdateLocationRequest): Promise<AxiosResponse<Location>> {
        try {
            return await axiosInstance.put<Location>(`${API.endpoints.location?.base}${id}/`, data);
        } catch (error) {
            logger.error('Erreur lors de la mise à jour de la location', error);
            throw error;
        }
    }

    // Supprimer une location
    static async delete(id: number | string): Promise<AxiosResponse<void>> {
        try {
            return await axiosInstance.delete<void>(`${API.endpoints.location?.base}${id}/`);
        } catch (error) {
            logger.error('Erreur lors de la suppression de la location', error);
            throw error;
        }
    }

    // Rechercher des locations
    static async search(query: string, params?: LocationDataTableParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const searchParams = { ...params, search: query };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}search/`, {
                params: searchParams
            });
        } catch (error) {
            logger.error('Erreur lors de la recherche de locations', error);
            throw error;
        }
    }

    // Récupérer les locations par sous-zone
    static async getBySousZone(sousZoneId: number, params?: LocationDataTableParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const zoneParams = { ...params, sous_zone_id: sousZoneId };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}by-sous-zone/`, {
                params: zoneParams
            });
        } catch (error) {
            logger.error('Erreur lors de la récupération des locations par sous-zone', error);
            throw error;
        }
    }

    // Récupérer les locations par zone
    static async getByZone(zoneId: number, params?: LocationDataTableParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const zoneParams = { ...params, zone_id: zoneId };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}by-zone/`, {
                params: zoneParams
            });
        } catch (error) {
            logger.error('Erreur lors de la récupération des locations par zone', error);
            throw error;
        }
    }

    // Récupérer les locations par entrepôt
    static async getByWarehouse(warehouseId: number, params?: LocationDataTableParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const warehouseParams = { ...params, warehouse_id: warehouseId };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}by-warehouse/`, {
                params: warehouseParams
            });
        } catch (error) {
            logger.error('Erreur lors de la récupération des locations par entrepôt', error);
            throw error;
        }
    }

    // Récupérer les locations par entrepôt avec URL complète (pour DataTable)
    static async getByWarehouseByUrl(url: string): Promise<AxiosResponse<LocationResponse>> {
        try {
            return await axiosInstance.get<LocationResponse>(url);
        } catch (error) {
            logger.error('Erreur lors de la récupération des locations par entrepôt', error);
            throw error;
        }
    }

    // Récupérer les statistiques des locations
    static async getStats(): Promise<AxiosResponse<{
        total_locations: number;
        locations_by_sous_zone: Record<string, number>;
        locations_by_zone: Record<string, number>;
        locations_by_warehouse: Record<string, number>;
        recent_locations: Location[];
    }>> {
        try {
            return await axiosInstance.get(`${API.endpoints.location?.base}stats/`);
        } catch (error) {
            logger.error('Erreur lors de la récupération des statistiques des locations', error);
            throw error;
        }
    }

    // Importer des locations en lot
    static async bulkImport(locations: CreateLocationRequest[]): Promise<AxiosResponse<{
        created: number;
        errors: string[];
    }>> {
        try {
            return await axiosInstance.post(`${API.endpoints.location?.base}bulk-import/`, {
                locations: locations
            });
        } catch (error) {
            logger.error('Erreur lors de l\'import en lot des locations', error);
            throw error;
        }
    }

    /**
     * Mettre à jour le statut de plusieurs locations en lot
     * @param locationIds - Liste des IDs des locations à désactiver
     * @returns Promise avec la réponse de l'API
     */
    static async bulkUpdateStatus(locationIds: number[]): Promise<AxiosResponse<{
        success: boolean;
        message: string;
        updated_count?: number;
    }>> {
        try {
            return await axiosInstance.post(`${API.endpoints.location?.base}bulk-deactivate/`, {
                location_ids: locationIds
            });
        } catch (error) {
            logger.error('Erreur lors de la mise à jour du statut des locations', error);
            throw error;
        }
    }

    // Exporter les locations
    static async export(format: 'csv' | 'excel' | 'json' = 'csv', params?: LocationDataTableParams): Promise<AxiosResponse<Blob>> {
        try {
            return await axiosInstance.get(`${API.endpoints.location?.base}export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
        } catch (error) {
            logger.error('Erreur lors de l\'export des locations', error);
            throw error;
        }
    }
}
