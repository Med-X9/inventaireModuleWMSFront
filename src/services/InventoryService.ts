import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { Inventory, CreateInventoryRequest } from '@/models/Inventory';
import API from '@/api';

// Interface pour la réponse paginée
interface PaginatedResponse<T> {
  count: number;
  results: T[];
  next: string | null;
  previous: string | null;
}

export class InventoryService {
    static async getAll(): Promise<AxiosResponse<PaginatedResponse<Inventory>>> {
        try {
            console.log('🚀 Service - Appel GET /inventory/');
            console.log('🔗 URL complète:', `${axiosInstance.defaults.baseURL}${API.endpoints.inventory.base}`);
            const response = await axiosInstance.get<PaginatedResponse<Inventory>>(API.endpoints.inventory.base);
            console.log('📥 Réponse du service:', response);
            return response;
        } catch (error) {
            console.error('💥 Erreur dans le service InventoryService.getAll():', error);
            throw error;
        }
    }

    static async getById(id: number | string): Promise<AxiosResponse<Inventory>> {
        try {
            return await axiosInstance.get<Inventory>(`${API.endpoints.inventory.base}${id}/`);
        } catch (error) {
            throw error;
        }
    }

    static async create(data: CreateInventoryRequest): Promise<AxiosResponse<Inventory>> {
        try {
            return await axiosInstance.post<Inventory>(API.endpoints.inventory.base, data);
        } catch (error) {
            throw error;
        }
    }

    static async update(id: number | string, data: Partial<Inventory>): Promise<AxiosResponse<Inventory>> {
        try {
            return await axiosInstance.put<Inventory>(`${API.endpoints.inventory.base}${id}/`, data);
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
