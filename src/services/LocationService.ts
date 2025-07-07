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
import API from '@/api';

export class LocationService {
    // Récupérer toutes les locations avec pagination et filtres
    static async getAll(params?: LocationQueryParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}`, {
                params: params
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des locations:', error);
            throw error;
        }
    }

    // Récupérer les locations non assignées
    static async getUnassigned(warehouseId: number, params?: LocationQueryParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.warehouse?.base}${warehouseId}/locations/unassigned/`, {
                params: params
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des locations non assignées:', error);
            throw error;
        }
    }

    // Récupérer une location par ID
    static async getById(id: number | string): Promise<AxiosResponse<Location>> {
        try {
            return await axiosInstance.get<Location>(`${API.endpoints.location?.base}${id}/`);
        } catch (error) {
            console.error('Erreur lors de la récupération de la location:', error);
            throw error;
        }
    }

    // Récupérer une location par référence
    static async getByReference(reference: string): Promise<AxiosResponse<Location>> {
        try {
            return await axiosInstance.get<Location>(`${API.endpoints.location?.base}by-reference/${reference}/`);
        } catch (error) {
            console.error('Erreur lors de la récupération de la location par référence:', error);
            throw error;
        }
    }

    // Créer une nouvelle location
    static async create(data: CreateLocationRequest): Promise<AxiosResponse<Location>> {
        try {
            return await axiosInstance.post<Location>(`${API.endpoints.location?.base}`, data);
        } catch (error) {
            console.error('Erreur lors de la création de la location:', error);
            throw error;
        }
    }

    // Mettre à jour une location
    static async update(id: number | string, data: UpdateLocationRequest): Promise<AxiosResponse<Location>> {
        try {
            return await axiosInstance.put<Location>(`${API.endpoints.location?.base}${id}/`, data);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la location:', error);
            throw error;
        }
    }

    // Supprimer une location
    static async delete(id: number | string): Promise<AxiosResponse<void>> {
        try {
            return await axiosInstance.delete<void>(`${API.endpoints.location?.base}${id}/`);
        } catch (error) {
            console.error('Erreur lors de la suppression de la location:', error);
            throw error;
        }
    }

    // Rechercher des locations
    static async search(query: string, params?: LocationQueryParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const searchParams = { ...params, search: query };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}search/`, {
                params: searchParams
            });
        } catch (error) {
            console.error('Erreur lors de la recherche de locations:', error);
            throw error;
        }
    }

    // Récupérer les locations par sous-zone
    static async getBySousZone(sousZoneId: number, params?: LocationQueryParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const zoneParams = { ...params, sous_zone_id: sousZoneId };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}by-sous-zone/`, {
                params: zoneParams
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des locations par sous-zone:', error);
            throw error;
        }
    }

    // Récupérer les locations par zone
    static async getByZone(zoneId: number, params?: LocationQueryParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const zoneParams = { ...params, zone_id: zoneId };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}by-zone/`, {
                params: zoneParams
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des locations par zone:', error);
            throw error;
        }
    }

    // Récupérer les locations par entrepôt
    static async getByWarehouse(warehouseId: number, params?: LocationQueryParams): Promise<AxiosResponse<LocationResponse>> {
        try {
            const warehouseParams = { ...params, warehouse_id: warehouseId };
            return await axiosInstance.get<LocationResponse>(`${API.endpoints.location?.base}by-warehouse/`, {
                params: warehouseParams
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des locations par entrepôt:', error);
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
            console.error('Erreur lors de la récupération des statistiques des locations:', error);
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
            console.error('Erreur lors de l\'import en lot des locations:', error);
            throw error;
        }
    }

    // Exporter les locations
    static async export(format: 'csv' | 'excel' | 'json' = 'csv', params?: LocationQueryParams): Promise<AxiosResponse<Blob>> {
        try {
            return await axiosInstance.get(`${API.endpoints.location?.base}export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
        } catch (error) {
            console.error('Erreur lors de l\'export des locations:', error);
            throw error;
        }
    }
}
