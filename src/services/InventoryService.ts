import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type {CreateInventoryRequest, InventoryTable } from '@/models/Inventory';
import API from '@/api';

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
            console.log('🌐 URL complète de l\'API:', fullUrl);

            const response = await axiosInstance.get<PaginatedResponse<InventoryTable>>(API.endpoints.inventory.base, {
                params: params
            });
            console.log('📥 Réponse du service:', response);
            return response;
        } catch (error) {
            console.error('💥 Erreur dans le service InventoryService.getAll():', error);
            throw error;
        }
    }

    static async getById(id: number | string): Promise<AxiosResponse<InventoryTable>> {
        try {
            return await axiosInstance.get<InventoryTable>(`${API.endpoints.inventory.base}${id}/edit/`);
        } catch (error) {
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
            return await axiosInstance.put<InventoryTable>(`${API.endpoints.inventory.base}${id}/`, data);
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
}
