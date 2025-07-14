import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { CreateInventoryRequest, InventoryDetails, InventoryTable, ResponseInventoryDetails } from '@/models/Inventory';
import type { InventoryDetail, InventoryDetailResponse } from '@/models/InventoryDetail';
import API from '@/api';
import type { PlanningManagementResponse } from '@/models/PlanningManagement';

// Interface pour la réponse paginée
interface PaginatedResponse<T> {
    count: number;
    results: T[];
    next: string | null;
    previous: string | null;
}

export class InventoryService {
    static async getAll(params?: any): Promise<AxiosResponse<PaginatedResponse<InventoryTable>>> {
        try {
            // Construire l'URL complète pour l'affichage
            const baseUrl = API.endpoints.inventory.base;
            const queryString = params ? new URLSearchParams(params).toString() : '';
            const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

            const response = await axiosInstance.get<PaginatedResponse<InventoryTable>>(API.endpoints.inventory.base, {
                params: params
            });
            return response;
        } catch (error) {
            console.error('💥 Erreur dans le service InventoryService.getAll():', error);
            throw error;
        }
    }

    static async getById(id: number | string): Promise<AxiosResponse<ResponseInventoryDetails>> {
        try {
            return await axiosInstance.get<ResponseInventoryDetails>(`${API.endpoints.inventory.base}${id}/edit/`);
        } catch (error) {
            throw error;
        }
    }

    static async getInventoryDetail(id: number | string): Promise<AxiosResponse<InventoryDetailResponse>> {
        try {
            const response = await axiosInstance.get<InventoryDetailResponse>(`${API.endpoints.inventory.base}${id}/detail/`);
            return response;
        } catch (error) {
            console.error('💥 Erreur dans le service InventoryService.getInventoryDetail():', error);
            throw error;
        }
    }

    static async create(data: CreateInventoryRequest): Promise<AxiosResponse<InventoryTable>> {
        try {
            return await axiosInstance.post<InventoryTable>(`${API.endpoints.inventory.base}create/`, data);
        } catch (error) {
            throw error;
        }
    }

    static async update(id: number | string, data: Partial<InventoryTable>): Promise<AxiosResponse<InventoryTable>> {
        try {
            return await axiosInstance.put<InventoryTable>(`${API.endpoints.inventory.base}${id}/update/`, data);
        } catch (error) {
            throw error;
        }
    }

    static async delete(id: number | string): Promise<AxiosResponse<void>> {
        try {
            return await axiosInstance.delete<void>(`${API.endpoints.inventory.base}${id}/`);
        } catch (error) {
            throw error;
        }
    }
    static async getPlanningManagement(id: number): Promise<AxiosResponse<PlanningManagementResponse>> {
        try {
            return await axiosInstance.get<PlanningManagementResponse>(`${API.endpoints.inventory.base}${id}/warehouse-stats/`);
        } catch (error) {
            throw error;
        }
    }

    static async importStocks(id: number, formData: FormData): Promise<AxiosResponse<any>> {
        try {
            return await axiosInstance.post<any>(`${API.endpoints.inventory.base}${id}/stocks/import/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            console.error('💥 Erreur dans le service InventoryService.importStocks():', error);
            throw error;
        }
    }
}
