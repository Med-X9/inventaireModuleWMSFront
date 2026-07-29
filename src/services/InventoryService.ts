import axiosInstance from '@/utils/axiosConfig';
import type { AxiosError, AxiosResponse } from 'axios';
import type { CreateInventoryRequest, InventoryDetails, InventoryTable, ResponseInventoryDetails } from '@/models/Inventory';
import type { InventoryDetail, InventoryDetailResponse, WarehouseSettingStatusResponse } from '@/models/InventoryDetail';
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
import type {
    EcartStockBulkValidateResponse,
    EcartStockMutationResponse,
    StockGapResponse,
    StockImportStartResponse,
    StockImportStatusResponse,
} from '@/models/TheoreticalStock';

// ---------------------------------------------------------------------------
// PDF jobs inventaire — POST /web/api/inventory/<id>/jobs/pdf/ (API_PDF_INVENTAIRE.md)
// ---------------------------------------------------------------------------

export class InventoryJobsPdfRequestError extends Error {
    constructor(
        message: string,
        public readonly errorType?: string
    ) {
        super(message)
        this.name = 'InventoryJobsPdfRequestError'
    }
}

export interface InventoryJobsPdfResult {
    blob: Blob
    /** Extrait de Content-Disposition si présent (ex. Job inventaire (&lt;ref&gt;).pdf) */
    filename: string | null
}

/** POST …/jobs/pdf/async/ → 202 */
export type PdfTaskState = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR'

export interface InventoryJobsPdfAsyncStartResponse {
    success: boolean
    task_id: string
    status: PdfTaskState
}

/** GET …/pdf-tasks/&lt;uuid&gt;/ */
export interface PdfTaskStatusResponse {
    success: boolean
    task_id: string
    task_type: string
    status: PdfTaskState
    error_message: string | null
    download_url?: string
}

interface InventoryJobsPdfJsonBody {
    success?: boolean
    message?: string
    error_type?: string
}

async function parseJsonFromBlob(blob: Blob): Promise<InventoryJobsPdfJsonBody | null> {
    try {
        const text = await blob.text()
        const j = JSON.parse(text) as InventoryJobsPdfJsonBody
        if (j && typeof j === 'object') {
            return j
        }
    } catch {
        /* pas du JSON */
    }
    return null
}

function parseFilenameFromContentDisposition(header: string | undefined): string | null {
    if (!header) {
        return null
    }
    const utf8 = /filename\*=UTF-8''([^;\n]+)/i.exec(header)
    if (utf8?.[1]) {
        try {
            return decodeURIComponent(utf8[1].trim())
        } catch {
            return utf8[1]
        }
    }
    const quoted = /filename="([^"]+)"/i.exec(header)
    return quoted?.[1] ?? null
}

async function blobLooksLikePdf(blob: Blob): Promise<boolean> {
    if (blob.size < 4) {
        return false
    }
    const buf = await blob.slice(0, 4).arrayBuffer()
    const a = new Uint8Array(buf)
    return a[0] === 0x25 && a[1] === 0x50 && a[2] === 0x44 && a[3] === 0x46 // %PDF
}

/**
 * Entier strictement &gt; 0 pour les segments d’URL (évite /inventory/undefined/…).
 */
export function parsePositiveInventoryId(raw: unknown): number | null {
    if (raw == null) {
        return null
    }
    if (typeof raw === 'string') {
        const t = raw.trim()
        if (t === '' || t === 'undefined' || t === 'null') {
            return null
        }
    }
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 1) {
        return null
    }
    return Math.trunc(n)
}

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
     * Configurer les comptages d'un inventaire (EN CONFIGURATION → EN PREPARATION)
     * @param id - ID de l'inventaire
     * @param data - Payload des comptages selon le type d'inventaire
     */
    static async configureCountings(
        id: number | string,
        data: Record<string, unknown>
    ): Promise<AxiosResponse<unknown>> {
        try {
            return await axiosInstance.post(`${API.endpoints.inventory.base}${id}/countings/`, data);
        } catch (error) {
            logger.error(`Erreur lors de la configuration des comptages de l'inventaire ${id}`, error);
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
     * Statut Setting d'un magasin
     * GET /web/api/inventory/{id}/warehouse/{wid}/setting-status/
     */
    static async getWarehouseSettingStatus(
        inventoryId: number,
        warehouseId: number
    ): Promise<WarehouseSettingStatusResponse> {
        try {
            const response = await axiosInstance.get<WarehouseSettingStatusResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouse/${warehouseId}/setting-status/`
            )
            return response.data
        } catch (error) {
            logger.error(
                `Erreur récupération statut Setting inventaire ${inventoryId} magasin ${warehouseId}`,
                error
            )
            throw error
        }
    }

    /**
     * Lancer un inventaire pour un magasin
     * @param idInentory - ID de l'inventaire
     * @param idWarehouse - ID du magasin
     * @returns Promise avec la réponse de lancement
     */
    static async launchByWarehause(idInentory: number, idWarehouse: number): Promise<AxiosResponse<LaunchResponse>> {
        try {
            const response = await axiosInstance.post<LaunchResponse>(`${API.endpoints.inventory.base}${idInentory}/warehouse/${idWarehouse}/launch/`);
            return response;
        } catch (error) {
            logger.error(`Erreur lors du lancement de l'inventaire ${idInentory} pour le magasin ${idWarehouse}`, error);
            throw error;
        }
    }

    /**
     * Lancer l'inventaire pour plusieurs magasins
     * POST /web/api/inventory/{inventory_id}/warehouses/launch/
     * Body: { warehouse_ids: number[] }
     */
    static async launchWarehouses(
        inventoryId: number,
        warehouseIds: number[]
    ): Promise<AxiosResponse<LaunchResponse>> {
        try {
            return await axiosInstance.post<LaunchResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouses/launch/`,
                { warehouse_ids: warehouseIds }
            )
        } catch (error) {
            logger.error(
                `Erreur lors du lancement multi-magasins de l'inventaire ${inventoryId}`,
                error
            )
            throw error
        }
    }

    /**
     * Annuler le lancement d'un magasin (LANCEE → EN ATTENTE)
     * POST /inventory/{id}/warehouse/{wid}/cancel-launch/
     */
    static async cancelWarehouseLaunch(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<LaunchResponse>> {
        try {
            return await axiosInstance.post<LaunchResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouse/${warehouseId}/cancel-launch/`
            )
        } catch (error) {
            logger.error(
                `Erreur annulation lancement inventaire ${inventoryId} magasin ${warehouseId}`,
                error
            )
            throw error
        }
    }

    /**
     * Terminer un magasin (LANCEE → TERMINEE)
     * POST /inventory/{id}/warehouse/{wid}/termine/
     */
    static async termineWarehouse(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<LaunchResponse>> {
        try {
            return await axiosInstance.post<LaunchResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouse/${warehouseId}/termine/`
            )
        } catch (error) {
            logger.error(
                `Erreur terminaison inventaire ${inventoryId} magasin ${warehouseId}`,
                error
            )
            throw error
        }
    }

    /**
     * Terminer plusieurs magasins
     * POST /inventory/{id}/warehouses/termine/
     */
    static async termineWarehouses(
        inventoryId: number,
        warehouseIds: number[]
    ): Promise<AxiosResponse<LaunchResponse>> {
        try {
            return await axiosInstance.post<LaunchResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouses/termine/`,
                { warehouse_ids: warehouseIds }
            )
        } catch (error) {
            logger.error(
                `Erreur terminaison multi-magasins inventaire ${inventoryId}`,
                error
            )
            throw error
        }
    }

    /**
     * Analyser un magasin (TERMINEE → ANALYSER + sync écarts)
     * POST /inventory/{id}/warehouse/{wid}/analyser/
     */
    static async analyserWarehouse(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<LaunchResponse>> {
        try {
            return await axiosInstance.post<LaunchResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouse/${warehouseId}/analyser/`
            )
        } catch (error) {
            logger.error(
                `Erreur analyse inventaire ${inventoryId} magasin ${warehouseId}`,
                error
            )
            throw error
        }
    }

    /**
     * Clôturer un magasin
     * POST /inventory/{id}/warehouse/{wid}/close/
     */
    static async closeWarehouse(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<LaunchResponse>> {
        try {
            return await axiosInstance.post<LaunchResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouse/${warehouseId}/close/`
            )
        } catch (error) {
            logger.error(
                `Erreur clôture inventaire ${inventoryId} magasin ${warehouseId}`,
                error
            )
            throw error
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
     * Import asynchrone du stock théorique (Excel) pour un inventaire + magasin
     * POST /web/api/inventory/{id}/warehouses/{wid}/stocks/import/
     */
    static async importTheoreticalStocks(
        inventoryId: number,
        warehouseId: number,
        formData: FormData
    ): Promise<AxiosResponse<StockImportStartResponse>> {
        try {
            return await axiosInstance.post<StockImportStartResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouses/${warehouseId}/stocks/import/`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    validateStatus: (status) => (status >= 200 && status < 300) || status === 202,
                }
            )
        } catch (error) {
            logger.error('Erreur lors de l\'import du stock théorique', error)
            throw error
        }
    }

    /**
     * Statut d'un import de stock théorique
     * GET /web/api/inventory/stocks/import/{task_id}/status/
     */
    static async getTheoreticalStockImportStatus(
        importTaskId: number
    ): Promise<AxiosResponse<StockImportStatusResponse>> {
        try {
            return await axiosInstance.get<StockImportStatusResponse>(
                `${API.endpoints.inventory.base}stocks/import/${importTaskId}/status/`
            )
        } catch (error) {
            logger.error(`Erreur statut import stock théorique ${importTaskId}`, error)
            throw error
        }
    }

    /**
     * Dernier import de stock théorique pour inventaire + magasin
     * GET /web/api/inventory/{id}/warehouses/{wid}/stocks/import/latest/
     */
    static async getLatestTheoreticalStockImport(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<StockImportStatusResponse>> {
        try {
            return await axiosInstance.get<StockImportStatusResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouses/${warehouseId}/stocks/import/latest/`
            )
        } catch (error) {
            logger.error('Erreur récupération dernier import stock théorique', error)
            throw error
        }
    }

    /**
     * Écarts stock théorique vs inventorié (paginé)
     * GET /web/api/inventory/{id}/warehouses/{wid}/stock-gaps/?page=1&pageSize=20
     */
    static async getStockGaps(
        inventoryId: number,
        warehouseId: number,
        params?: Record<string, unknown>
    ): Promise<StockGapResponse> {
        try {
            const response = await axiosInstance.get<StockGapResponse>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouses/${warehouseId}/stock-gaps/`,
                {
                    params: params || {},
                    headers: { 'Content-Type': 'application/json' },
                }
            )
            return response.data
        } catch (error) {
            logger.error('Erreur lors du calcul des écarts stock', error)
            throw error
        }
    }

    /**
     * Exporte l'analyse (écarts stock) d'un magasin en Excel
     * GET /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/analyse/export/excel/
     * @returns Promise avec la réponse contenant le blob du fichier .xlsx
     */
    static async exportAnalyseExcel(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<Blob>> {
        try {
            return await axiosInstance.get<Blob>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouse/${warehouseId}/analyse/export/excel/`,
                { responseType: 'blob' }
            )
        } catch (error) {
            logger.error(
                `Erreur export Excel analyse inventaire ${inventoryId} magasin ${warehouseId}`,
                error
            )
            throw error
        }
    }

    /**
     * Exporte en PDF les lignes d'analyse avec écart (recomptage)
     * GET /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/analyse/export/pdf/
     * @returns Promise avec la réponse contenant le blob du fichier .pdf
     */
    static async exportAnalysePdf(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<Blob>> {
        try {
            return await axiosInstance.get<Blob>(
                `${API.endpoints.inventory.base}${inventoryId}/warehouse/${warehouseId}/analyse/export/pdf/`,
                { responseType: 'blob' }
            )
        } catch (error) {
            logger.error(
                `Erreur export PDF analyse inventaire ${inventoryId} magasin ${warehouseId}`,
                error
            )
            throw error
        }
    }

    /**
     * Modifier le résultat final d'une ligne écart stock
     * PATCH /web/api/ecarts-stock/{ecart_id}/
     */
    static async updateEcartStockResultatFinal(
        ecartId: number,
        resultatFinal: number
    ): Promise<EcartStockMutationResponse> {
        try {
            const response = await axiosInstance.patch<EcartStockMutationResponse>(
                `${API.endpoints.ecartStock.base}${ecartId}/`,
                { resultat_final: resultatFinal },
                { headers: { 'Content-Type': 'application/json' } }
            )
            return response.data
        } catch (error) {
            logger.error(`Erreur modification résultat final écart stock ${ecartId}`, error)
            throw error
        }
    }

    /**
     * Valider une ligne écart stock
     * POST /web/api/ecarts-stock/{ecart_id}/valider/
     */
    static async validerEcartStock(ecartId: number): Promise<EcartStockMutationResponse> {
        try {
            const response = await axiosInstance.post<EcartStockMutationResponse>(
                `${API.endpoints.ecartStock.base}${ecartId}/valider/`
            )
            return response.data
        } catch (error) {
            logger.error(`Erreur validation écart stock ${ecartId}`, error)
            throw error
        }
    }

    /**
     * Valider plusieurs lignes écart stock
     * POST /web/api/ecarts-stock/valider/
     */
    static async validerEcartStockBulk(
        ecartIds: number[]
    ): Promise<EcartStockBulkValidateResponse> {
        try {
            const response = await axiosInstance.post<EcartStockBulkValidateResponse>(
                `${API.endpoints.ecartStock.base}valider/`,
                { ecart_ids: ecartIds },
                { headers: { 'Content-Type': 'application/json' } }
            )
            return response.data
        } catch (error) {
            logger.error('Erreur validation multi écarts stock', error)
            throw error
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
     * Exporte les jobs d'un inventaire en PDF (synchrone).
     * POST ` /web/api/inventory/<inventory_id>/jobs/pdf/ `
     *
     * Body JSON optionnel : `job` ou `job[]` (IDs de jobs) — sinon `{}` ; filtrage défaut côté API
     * (assignments / jobs PRET + TRANSFERT, voir API_PDF_INVENTAIRE.md).
     *
     * @param id - ID de l'inventaire
     * @param options - `jobIds` pour restreindre à certains jobs (mêmes filtres de statut API)
     */
    static async exportJobsToPDF(
        id: number | string,
        options?: { jobIds?: number[] }
    ): Promise<InventoryJobsPdfResult> {
        const iid = parsePositiveInventoryId(id)
        if (iid == null) {
            throw new InventoryJobsPdfRequestError('ID inventaire invalide pour l’export PDF.', 'validation_error')
        }
        const body: Record<string, unknown> = {}
        if (options?.jobIds?.length) {
            body.job = options.jobIds
        }

        try {
            const response = await axiosInstance.post<Blob>(
                `${API.endpoints.inventory.base}${iid}/jobs/pdf/`,
                body,
                {
                    responseType: 'blob',
                    headers: {
                        Accept: 'application/pdf, application/json;q=0.1',
                        'Content-Type': 'application/json'
                    }
                }
            )

            const blob = response.data
            const contentType = String(response.headers['content-type'] || '')

            if (contentType.includes('application/json')) {
                const errJson = await parseJsonFromBlob(blob)
                throw new InventoryJobsPdfRequestError(
                    errJson?.message || 'Erreur lors de la génération du PDF des jobs',
                    errJson?.error_type
                )
            }

            if (!(await blobLooksLikePdf(blob))) {
                const errJson = await parseJsonFromBlob(blob)
                if (errJson?.message) {
                    throw new InventoryJobsPdfRequestError(errJson.message, errJson.error_type)
                }
                throw new InventoryJobsPdfRequestError(
                    'La réponse du serveur n\'est pas un fichier PDF valide.'
                )
            }

            const filename = parseFilenameFromContentDisposition(
                response.headers['content-disposition'] as string | undefined
            )
            return { blob, filename }
        } catch (err: unknown) {
            if (err instanceof InventoryJobsPdfRequestError) {
                throw err
            }

            const ax = err as AxiosError<Blob>
            if (ax.response?.data instanceof Blob) {
                const errJson = await parseJsonFromBlob(ax.response.data)
                if (errJson?.message) {
                    throw new InventoryJobsPdfRequestError(errJson.message, errJson.error_type)
                }
            }

            logger.error('Erreur lors de l\'export PDF des jobs', err)
            throw err
        }
    }

    /**
     * Démarre la génération PDF des jobs en arrière-plan.
     * POST ` /web/api/inventory/<id>/jobs/pdf/async/ ` → 202 + task_id
     */
    /**
     * PDF des assignments TERMINE non encore imprimés pour un magasin (async + poll).
     * POST `…/warehouse/<warehouse_id>/jobs/pdf/finished-assignments/async/`
     */
    static async startWarehouseFinishedAssignmentsPdfAsync(
        inventoryId: number | string,
        warehouseId: number | string
    ): Promise<InventoryJobsPdfAsyncStartResponse> {
        const iid = parsePositiveInventoryId(inventoryId)
        const wid = parsePositiveInventoryId(warehouseId)
        if (iid == null) {
            throw new Error('ID inventaire invalide pour l’export PDF (valeur manquante ou incorrecte).')
        }
        if (wid == null) {
            throw new Error('ID entrepôt invalide pour l’export PDF (valeur manquante ou incorrecte).')
        }
        const response = await axiosInstance.post<InventoryJobsPdfAsyncStartResponse>(
            `${API.endpoints.inventory.base}${iid}/warehouse/${wid}/jobs/pdf/finished-assignments/async/`,
            {},
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        )
        return response.data
    }

    static async startInventoryJobsPdfAsync(
        id: number | string,
        options?: { jobIds?: number[] }
    ): Promise<InventoryJobsPdfAsyncStartResponse> {
        const iid = parsePositiveInventoryId(id)
        if (iid == null) {
            throw new Error('ID inventaire invalide pour l’export PDF (valeur manquante ou incorrecte).')
        }
        const body: Record<string, unknown> = {}
        if (options?.jobIds?.length) {
            body.job = options.jobIds
        }
        const response = await axiosInstance.post<InventoryJobsPdfAsyncStartResponse>(
            `${API.endpoints.inventory.base}${iid}/jobs/pdf/async/`,
            body,
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        )
        return response.data
    }

    /**
     * Statut d'une tâche PDF (polling).
     * GET ` /web/api/pdf-tasks/<task_id>/ `
     */
    static async getPdfTaskStatus(taskId: string): Promise<PdfTaskStatusResponse> {
        const response = await axiosInstance.get<PdfTaskStatusResponse>(
            `${API.endpoints.pdfTasks.base}${taskId}/`
        )
        return response.data
    }

    /**
     * Télécharge le binaire PDF depuis l'URL retournée par la tâche (Bearer via intercepteur).
     * L'URL peut être absolue ou chemin relatif sous la même origine que l'API.
     */
    static async fetchPdfFromDownloadUrl(url: string): Promise<InventoryJobsPdfResult> {
        const base = String(API.baseURL || '').replace(/\/$/, '')
        const resolved = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `${base}/${url.replace(/^\//, '')}`

        try {
            const response = await axiosInstance.get<Blob>(resolved, {
                responseType: 'blob',
                headers: {
                    Accept: 'application/pdf, application/json;q=0.1'
                }
            })

            const blob = response.data
            const contentType = String(response.headers['content-type'] || '')

            if (contentType.includes('application/json')) {
                const errJson = await parseJsonFromBlob(blob)
                throw new InventoryJobsPdfRequestError(
                    errJson?.message || 'Impossible de récupérer le fichier PDF',
                    errJson?.error_type
                )
            }

            if (!(await blobLooksLikePdf(blob))) {
                const errJson = await parseJsonFromBlob(blob)
                if (errJson?.message) {
                    throw new InventoryJobsPdfRequestError(errJson.message, errJson.error_type)
                }
                throw new InventoryJobsPdfRequestError(
                    'Le fichier reçu n\'est pas un PDF valide. Vérifiez l\'accès au média (authentification, CORS).'
                )
            }

            const filename = parseFilenameFromContentDisposition(
                response.headers['content-disposition'] as string | undefined
            )
            return { blob, filename }
        } catch (err: unknown) {
            if (err instanceof InventoryJobsPdfRequestError) {
                throw err
            }
            const ax = err as AxiosError<Blob>
            if (ax.response?.data instanceof Blob) {
                const errJson = await parseJsonFromBlob(ax.response.data)
                if (errJson?.message) {
                    throw new InventoryJobsPdfRequestError(errJson.message, errJson.error_type)
                }
            }
            logger.error('Erreur lors du téléchargement du PDF (URL tâche)', err)
            throw err
        }
    }
}
