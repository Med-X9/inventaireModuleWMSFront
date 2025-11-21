import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { CreateInventoryRequest, InventoryDetails, InventoryTable, ResponseInventoryDetails } from '@/models/Inventory';
import type { InventoryDetail, InventoryDetailResponse } from '@/models/InventoryDetail';
import API from '@/api';
import type { PlanningManagementResponse } from '@/models/PlanningManagement';
import { logger } from '@/services/loggerService';

// Interface pour la réponse paginée REST API
interface PaginatedResponse<T> {
    count: number;
    results: T[];
    next: string | null;
    previous: string | null;
}

import type { DataTableResponse, DataTableParams } from '@/utils/dataTableUtils';

// Interface pour les réponses de lancement d'inventaire
export interface LaunchResponse {
    message?: string;
    error?: string;
    errors?: string[];
    infos?: string[];
}

// Interface pour la réponse d'import de stocks
export interface ImportStocksResponse {
    message: string;
    success: boolean;
    imported_count: number;
    errors?: string[];
}

export class InventoryService {
    /**
     * Récupérer tous les inventaires avec pagination (format DataTable) via URL complète
     * @param url - URL complète de la requête
     * @returns Promise avec la réponse DataTable
     */
    static async getAllByUrl(url: string): Promise<DataTableResponse<InventoryTable>> {
        try {
            const response = await axiosInstance.get<DataTableResponse<InventoryTable>>(url);
            return response.data;
        } catch (error) {
            logger.error('Erreur lors de la récupération des inventaires par URL', error);
            throw error;
        }
    }

    /**
     * Récupérer tous les inventaires avec paramètres de pagination
     * @param params - Paramètres de pagination et filtres
     * @returns Promise avec la réponse paginée d'inventaires
     */
    static async getAll(params?: Record<string, any>): Promise<AxiosResponse<DataTableResponse<InventoryTable>>> {
        try {
            const response = await axiosInstance.get<DataTableResponse<InventoryTable>>(API.endpoints.inventory.base, {
                params: params
            });

            return response;
        } catch (error) {
            logger.error('Erreur dans InventoryService.getAll', error);
            throw error;
        }
    }

    /**
     * Récupérer un inventaire par son ID
     * @param id - ID de l'inventaire
     * @returns Promise avec les détails de l'inventaire
     */
    static async getById(id: number | string): Promise<AxiosResponse<ResponseInventoryDetails>> {
        try {
            return await axiosInstance.get<ResponseInventoryDetails>(`${API.endpoints.inventory.base}${id}/edit/`);
        } catch (error) {
            logger.error(`Erreur lors de la récupération de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupérer un inventaire par sa référence
     * @param reference - Référence de l'inventaire
     * @returns Promise avec les détails de l'inventaire
     */
    static async getByReference(reference: string): Promise<AxiosResponse<ResponseInventoryDetails>> {
        try {
            return await axiosInstance.get<ResponseInventoryDetails>(`${API.endpoints.inventory.base}by-reference/${reference}`);
        } catch (error) {
            logger.error(`Erreur lors de la récupération de l'inventaire par référence ${reference}`, error);
            throw error;
        }
    }

    /**
     * Récupérer les détails complets d'un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec les détails complets de l'inventaire
     */
    static async getInventoryDetail(id: number | string): Promise<AxiosResponse<InventoryDetailResponse>> {
        try {
            const response = await axiosInstance.get<InventoryDetailResponse>(`${API.endpoints.inventory.base}${id}/detail/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des détails de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Créer un nouvel inventaire
     * @param data - Données de création de l'inventaire
     * @returns Promise avec l'inventaire créé
     */
    static async create(data: CreateInventoryRequest): Promise<AxiosResponse<InventoryTable>> {
        try {
            return await axiosInstance.post<InventoryTable>(`${API.endpoints.inventory.base}create/`, data);
        } catch (error) {
            logger.error('Erreur lors de la création de l\'inventaire', error);
            throw error;
        }
    }

    /**
     * Mettre à jour un inventaire
     * @param id - ID de l'inventaire
     * @param data - Données de mise à jour (partiel)
     * @returns Promise avec l'inventaire mis à jour
     */
    static async update(id: number | string, data: Partial<InventoryTable>): Promise<AxiosResponse<InventoryTable>> {
        try {
            return await axiosInstance.put<InventoryTable>(`${API.endpoints.inventory.base}${id}/update/`, data);
        } catch (error) {
            logger.error(`Erreur lors de la mise à jour de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Supprimer un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise vide
     */
    static async delete(id: number | string): Promise<AxiosResponse<void>> {
        try {
            return await axiosInstance.delete<void>(`${API.endpoints.inventory.base}${id}/`);
        } catch (error) {
            logger.error(`Erreur lors de la suppression de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Lancer un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec la réponse de lancement
     */
    static async launch(id: number | string): Promise<AxiosResponse<LaunchResponse>> {
        try {
            const response = await axiosInstance.post<LaunchResponse>(`${API.endpoints.inventory.base}${id}/launch/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors du lancement de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Annuler un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise vide
     */
    static async cancel(id: number | string): Promise<AxiosResponse<void>> {
        try {
            return await axiosInstance.post<void>(`${API.endpoints.inventory.base}${id}/cancel/`);
        } catch (error) {
            logger.error(`Erreur lors de l'annulation de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Terminer un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise vide
     */
    static async terminate(id: number | string): Promise<AxiosResponse<void>> {
        try {
            return await axiosInstance.post<void>(`${API.endpoints.inventory.base}${id}/terminate/`);
        } catch (error) {
            logger.error(`Erreur lors de la terminaison de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Clôturer un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise vide
     */
    static async close(id: number | string): Promise<AxiosResponse<void>> {
        try {
            return await axiosInstance.post<void>(`${API.endpoints.inventory.base}${id}/close/`);
        } catch (error) {
            logger.error(`Erreur lors de la clôture de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupérer les statistiques de planning d'un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec les statistiques de planning
     */
    static async getPlanningManagement(id: number, params?: any): Promise<AxiosResponse<PlanningManagementResponse>> {
        try {
            logger.debug('InventoryService.getPlanningManagement appelé', { id, params });
            const url = `${API.endpoints.inventory.base}${id}/warehouse-stats/`;
            const response = await axiosInstance.get<PlanningManagementResponse>(url, { params });
            logger.debug('InventoryService.getPlanningManagement réponse reçue', { 
                status: response.status,
                dataCount: response.data?.data?.length || 0
            });
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des statistiques de planning pour l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Importer des stocks pour un inventaire à partir d'un fichier
     * @param id - ID de l'inventaire
     * @param formData - Données du formulaire contenant le fichier
     * @returns Promise avec la réponse d'import
     */
    static async importStocks(id: number, formData: FormData): Promise<AxiosResponse<ImportStocksResponse>> {
        try {
            return await axiosInstance.post<ImportStocksResponse>(`${API.endpoints.inventory.base}${id}/stocks/import/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            logger.error('Erreur lors de l\'import des stocks', error);
            throw error;
        }
    }

    /**
     * Exporte les jobs d'un inventaire en PDF
     * @param id - ID de l'inventaire
     * @returns Promise qui résout avec le blob du PDF
     */
    static async exportJobsToPDF(id: number | string): Promise<Blob> {
        try {
            const response = await axiosInstance.post(
                `${API.endpoints.inventory.base}${id}/jobs/pdf/`,
                {}, // Body vide pour POST
                {
                    responseType: 'blob' // Configuration axios pour recevoir un blob
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Erreur lors de l\'export PDF des jobs', error);
            throw error;
        }
    }
}
