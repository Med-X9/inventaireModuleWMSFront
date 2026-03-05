import axiosInstance from '@/utils/axiosConfig';
import type { StoreOption, InventoryResult } from '../interfaces/inventoryResults';
import type { AxiosResponse } from 'axios';
import API from '@/api';
import { normalizeDataTableResponse } from '@/utils/dataTableResponseNormalizer';
import type { StandardDataTableParams } from '@SMATCH-Digital-dev/vue-system-design/dist/components/DataTable/utils/dataTableParamsConverter';
import type { UnifiedDataTableResponse } from '@/utils/dataTableResponseNormalizer';

/**
 * Réponse typée selon FORMAT_ACTUEL.md
 * Format : { rows: [...], page: number, pageSize: number, total: number, totalPages: number }
 */
export interface InventoryResultsResponse {
    rows: Record<string, unknown>[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

/**
 * Service pour la gestion des résultats d'inventaire
 *
 * Architecture en couches :
 * - Vue -> Composable (useInventoryResults) -> Store (resultsStore) -> Service (InventoryResultsService) -> API
 *
 * Responsabilités :
 * - Appels API pour récupérer, modifier et valider les résultats d'inventaire
 * - Normalisation des données reçues du backend
 * - Export des données (CSV, Excel)
 *
 * @module InventoryResultsService
 */
export class InventoryResultsService {
    /** URL de base pour les endpoints d'inventaire */
    private static baseUrl = API.endpoints.inventory?.base;
    /** URL de base pour les endpoints d'écart de comptage */
    private static baseUrl2 = API.endpoints.ecartComptage?.base;

    /**
     * Récupère les résultats d'inventaire pour un inventaire et un magasin donnés
     *
     * Architecture : composable -> store -> service
     * Le service reçoit les paramètres déjà convertis au format FORMAT_ACTUEL.md par le store
     * et fait uniquement l'appel API et retourne la réponse brute normalisée selon FORMAT_ACTUEL.md
     *
     * Format de réponse selon FORMAT_ACTUEL.md :
     * { rows: [...], page: number, pageSize: number, total: number, totalPages: number }
     *
     * @param inventoryId - ID de l'inventaire
     * @param storeId - ID du magasin (warehouse)
     * @param params - Paramètres au format FORMAT_ACTUEL.md (déjà convertis par le store)
     * @returns Réponse brute normalisée selon FORMAT_ACTUEL.md (sans normalisation des résultats)
     */
    static async getResults(
        inventoryId: number,
        storeId: string | number,
        params?: Record<string, unknown>
    ): Promise<InventoryResultsResponse> {
        const response = await axiosInstance.get<UnifiedDataTableResponse<Record<string, unknown>>>(
            `${this.baseUrl}${inventoryId}/warehouses/${storeId}/results/`,
            {
                params: params || {},
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Normaliser uniquement la structure de pagination vers FORMAT_ACTUEL.md
        // La normalisation des résultats individuels est faite dans le composable
        const unifiedResponse = normalizeDataTableResponse<Record<string, unknown>>(response.data);

        // Retourner directement le format FORMAT_ACTUEL.md
        return {
            rows: unifiedResponse.rows,
            page: unifiedResponse.page ?? 1,
            pageSize: unifiedResponse.pageSize ?? 20,
            total: unifiedResponse.total ?? 0,
            totalPages: unifiedResponse.totalPages ?? 0
        };
    }

    /**
     * Modifier la valeur d'un résultat d'inventaire
     * @param id - ID du résultat
     * @param data - Données à modifier (valeur du résultat, etc.)
     */
    static async updateValue(
        id: number | string,
        data: Partial<InventoryResult>
    ): Promise<AxiosResponse<InventoryResult>> {
        return await axiosInstance.put(`${this.baseUrl2}${id}/final-result/`, data);
    }

    /**
     * Valider un ou plusieurs résultats d'inventaire
     * @param ids - IDs des résultats à valider
     */
    static async validateResults(ids: number): Promise<AxiosResponse<{ success: boolean }>> {
        return await axiosInstance.post(`${this.baseUrl2}/${ids}/resolve/`);
    }

    /**
     * Récupérer les métadonnées de l'inventaire (nombre de comptages, etc.)
     * @param inventoryId - ID de l'inventaire
     */
    /**
     * Récupérer les magasins disponibles pour un inventaire
     * @param inventoryId - ID de l'inventaire
     */
    static async getStoreOptions(inventoryId: number): Promise<StoreOption[]> {
        const response = await axiosInstance.get<StoreOption[]>(
            `${API.endpoints.inventory?.base}${inventoryId}/warehouses/`
        );
        return response.data;
    }

    /**
     * Exporter les résultats d'inventaire en CSV ou Excel
     * @param inventoryId - ID de l'inventaire
     * @param storeId - ID du magasin (warehouse)
     * @param format - Format d'export ('csv' ou 'excel')
     * @param params - Paramètres DataTable optionnels (pagination, tri, filtres, recherche)
     * @returns Promise avec la réponse contenant le blob du fichier
     */
    static async exportResults(
        inventoryId: number,
        storeId: string | number,
        format: 'csv' | 'excel' = 'excel',
        params?: StandardDataTableParams | Record<string, unknown>
    ): Promise<AxiosResponse<Blob>> {
        const exportParams = {
            ...params,
            export: format
        };

        return await axiosInstance.get(
            `${this.baseUrl}${inventoryId}/warehouses/${storeId}/results/`,
            {
                params: exportParams,
                responseType: 'blob'
            }
        );
    }

    /**
     * Exporter les résultats d'inventaire via l'endpoint dédié
     *
     * @param inventoryId - ID de l'inventaire
     * @param warehouseId - ID du warehouse
     * @returns Promise avec la réponse contenant le blob du fichier Excel
     */
    static async exportResultsData(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<Blob>> {
        return await axiosInstance.get(
            `${this.baseUrl}${inventoryId}/warehouses/${warehouseId}/results/export/`,
            {
                responseType: 'blob'
            }
        );
    }

    /**
     * Exporter les articles consolidés d'un inventaire en Excel
     * @param inventoryId - ID de l'inventaire
     * @returns Promise avec la réponse contenant le blob du fichier Excel
     */
    static async exportConsolidatedArticles(inventoryId: number): Promise<AxiosResponse<Blob>> {
        return await axiosInstance.get(
            `${this.baseUrl}${inventoryId}/articles-consolides/export/`,
            {
                responseType: 'blob'
            }
        );
    }
}

export const inventoryResultsService = InventoryResultsService;
