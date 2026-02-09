import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { CreateInventoryRequest, InventoryDetails, InventoryTable, ResponseInventoryDetails } from '@/models/Inventory';
import type { InventoryDetail, InventoryDetailResponse } from '@/models/InventoryDetail';
import API from '@/api';
import type { PlanningManagementResponse } from '@/models/PlanningManagement';
import { logger } from '@/services/loggerService';
import { normalizeDataTableResponse, convertUnifiedToStandardDataTable } from '@/utils/dataTableResponseNormalizer';
import type { UnifiedDataTableResponse } from '@/utils/dataTableResponseNormalizer';

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

// Interface pour la réponse d'import de planification (location-jobs) - Asynchrone
export interface ImportLocationJobsResponse {
    success: boolean;
    message: string;
    data?: {
        status: 'processing' | 'completed' | 'failed';
        message: string;
        inventory_id: number;
        import_task_id: number;
        // Résultats disponibles uniquement quand status === 'completed'
        imported_count?: number;
        locations_updated?: number;
        jobs_created?: number;
        job_details_created?: number;
        unconsumed_locations_count?: number;
    };
    errors?: Array<{
        row_number: number;
        field: string;
        value: string;
        message: string;
    }>;
}

// Interface pour le statut de l'import
export interface ImportLocationJobsStatusResponse {
    success: boolean;
    message: string;
    data: {
        status: 'processing' | 'completed' | 'failed';
        message: string;
        inventory_id: number;
        import_task_id: number;
        progress?: number; // Pourcentage de progression (0-100)
        // Résultats disponibles uniquement quand status === 'completed'
        imported_count?: number;
        locations_updated?: number;
        jobs_created?: number;
        job_details_created?: number;
        unconsumed_locations_count?: number;
        // Erreurs disponibles uniquement quand status === 'failed'
        errors?: Array<{
            row_number: number;
            field: string;
            value: string;
            message: string;
        }>;
    };
}

export class InventoryService {
    /**
     * Récupérer tous les inventaires avec pagination (format DataTable) via URL complète
     * @param url - URL complète de la requête
     * @returns Promise avec la réponse DataTable
     */
    static async getAllByUrl(url: string): Promise<DataTableResponse<InventoryTable> & { page: number; totalPages: number; pageSize: number; total: number }> {
        try {
            const response = await axiosInstance.get<UnifiedDataTableResponse<InventoryTable>>(url);
            const unifiedResponse = normalizeDataTableResponse<InventoryTable>(response.data);
            const standardResponse = convertUnifiedToStandardDataTable(unifiedResponse);
            return {
                ...standardResponse,
                page: unifiedResponse.page,
                totalPages: unifiedResponse.totalPages,
                pageSize: unifiedResponse.pageSize,
                total: unifiedResponse.total
            } as DataTableResponse<InventoryTable> & { page: number; totalPages: number; pageSize: number; total: number };
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
    /**
     * Récupérer tous les inventaires avec paramètres de pagination (format FORMAT_ACTUEL.md)
     * Le service reçoit les paramètres déjà convertis au format FORMAT_ACTUEL.md par le store
     * @param params - Paramètres au format FORMAT_ACTUEL.md (déjà convertis par le store)
     * @returns Promise avec la réponse paginée d'inventaires
     */
    static async getAll(params?: Record<string, any>): Promise<DataTableResponse<InventoryTable> & { page: number; totalPages: number; pageSize: number; total: number }> {
        try {
            // Utiliser GET avec query parameters selon FORMAT_ACTUEL.md
            // Les paramètres complexes (sort, filters) sont automatiquement JSON.stringify par axios
            const response = await axiosInstance.get<UnifiedDataTableResponse<InventoryTable>>(
                API.endpoints.inventory.base,
                {
                    params: params || {}
                }
            );

            const unifiedResponse = normalizeDataTableResponse<InventoryTable>(response.data);
            const standardResponse = convertUnifiedToStandardDataTable(unifiedResponse);
            return {
                    ...standardResponse,
                    page: unifiedResponse.page,
                    totalPages: unifiedResponse.totalPages,
                    pageSize: unifiedResponse.pageSize,
                    total: unifiedResponse.total
            } as DataTableResponse<InventoryTable> & { page: number; totalPages: number; pageSize: number; total: number };
        } catch (error) {
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
            return await axiosInstance.get<ResponseInventoryDetails>(`${API.endpoints.inventory.base}by-reference/${reference}/`);
        } catch (error) {
            logger.error(`Erreur lors de la récupération de l'inventaire par référence ${reference}`, error);
            throw error;
        }
    }


    /**
     * Récupérer les informations de base d'un inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec les informations de base
     */
    static async getInventoryBasic(id: number | string): Promise<AxiosResponse<import('@/models/InventoryDetail').InventoryBasicResponse>> {
        try {
            const response = await axiosInstance.get(`${API.endpoints.inventory.base}${id}/basic/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des informations de base de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupérer les informations du compte associé à l'inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec les informations du compte
     */
    static async getInventoryAccount(id: number | string): Promise<AxiosResponse<import('@/models/InventoryDetail').InventoryAccountResponse>> {
        try {
            const response = await axiosInstance.get(`${API.endpoints.inventory.base}${id}/account/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des informations du compte de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupérer la liste des magasins associés à l'inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec la liste des magasins
     */
    static async getInventoryWarehouses(id: number | string): Promise<AxiosResponse<import('@/models/InventoryDetail').InventoryWarehousesResponse>> {
        try {
            const response = await axiosInstance.get(`${API.endpoints.inventory.base}${id}/warehouses/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des magasins de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupérer la liste des comptages configurés pour l'inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec la liste des comptages
     */
    static async getInventoryCountings(id: number | string): Promise<AxiosResponse<import('@/models/InventoryDetail').InventoryCountingsResponse>> {
        try {
            const response = await axiosInstance.get(`${API.endpoints.inventory.base}${id}/countings/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des comptages de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupérer l'équipe assignée à l'inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec l'équipe assignée
     */
    static async getInventoryTeam(id: number | string): Promise<AxiosResponse<import('@/models/InventoryDetail').InventoryTeamResponse>> {
        try {
            const response = await axiosInstance.get(`${API.endpoints.inventory.base}${id}/team/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération de l'équipe de l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupérer les ressources assignées à l'inventaire
     * @param id - ID de l'inventaire
     * @returns Promise avec les ressources assignées
     */
    static async getInventoryResources(id: number | string): Promise<AxiosResponse<import('@/models/InventoryDetail').InventoryResourcesResponse>> {
        try {
            const response = await axiosInstance.get(`${API.endpoints.inventory.base}${id}/resources/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des ressources de l'inventaire ${id}`, error);
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
            return await axiosInstance.post<void>(`${API.endpoints.inventory.base}${id}/complete/`);
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
                rowsCount: response.data?.rows?.length || 0,
                total: response.data?.total || 0
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
     * Importe la planification (location-jobs) depuis un fichier Excel (asynchrone)
     * @param id - ID de l'inventaire
     * @param formData - Données du formulaire contenant le fichier Excel
     * @returns Promise avec la réponse d'import (202 Accepted avec import_task_id)
     */
    static async importLocationJobsSync(id: string | number, formData: FormData): Promise<AxiosResponse<ImportLocationJobsResponse>> {
        try {
            return await axiosInstance.post<ImportLocationJobsResponse>(
                `${API.endpoints.inventory.base}${id}/location-jobs/import-async/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    validateStatus: (status) => {
                        // Accepter 202 Accepted comme succès
                        return (status >= 200 && status < 300) || status === 202;
                    }
                }
            );
        } catch (error) {
            logger.error(`Erreur lors de l'import de la planification pour l'inventaire ${id}`, error);
            throw error;
        }
    }

    /**
     * Récupère le statut d'un import de planification en cours (par importTaskId)
     * @param importTaskId - ID de la tâche d'import
     * @returns Promise avec le statut de l'import
     */
    static async getImportLocationJobsStatus(importTaskId: number): Promise<AxiosResponse<ImportLocationJobsStatusResponse>> {
        try {
            return await axiosInstance.get<ImportLocationJobsStatusResponse>(
                `${API.endpoints.inventory.base}location-jobs/import/${importTaskId}/status/`
            );
        } catch (error) {
            logger.error(`Erreur lors de la récupération du statut de l'import ${importTaskId}`, error);
            throw error;
        }
    }

    /**
     * Récupère le statut d'un import de planification par inventoryId
     * @param inventoryId - ID de l'inventaire
     * @returns Promise avec le statut de l'import
     */
    static async getImportLocationJobsStatusByInventory(inventoryId: number): Promise<AxiosResponse<any>> {
        try {
            return await axiosInstance.get(
                `${API.endpoints.inventory.base}location-jobs/import/${inventoryId}/status/`
            );
        } catch (error) {
            logger.error(`Erreur lors de la récupération du statut de l'import pour l'inventaire ${inventoryId}`, error);
            throw error;
        }
    }

    /**
     * Exporte tous les inventaires en CSV ou Excel
     * @param params - Paramètres au format FORMAT_ACTUEL.md avec export: 'csv' ou 'excel'
     * @returns Promise avec la réponse contenant le blob du fichier
     */
    static async exportAll(params?: Record<string, any>): Promise<AxiosResponse<Blob>> {
        try {
            const response = await axiosInstance.get(
                API.endpoints.inventory.base,
                {
                    params: params || {},
                    responseType: 'blob'
                }
            );
            return response;
        } catch (error) {
            logger.error('Erreur lors de l\'export des inventaires', error);
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
