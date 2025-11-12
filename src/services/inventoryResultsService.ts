import axiosInstance from '@/utils/axiosConfig';
import type { StoreOption, InventoryResult } from '../interfaces/inventoryResults';
import type { AxiosResponse } from 'axios';
import API from '@/api';
import { logger } from '@/services/loggerService';

export class InventoryResultsService {
    private static baseUrl = API.endpoints.inventory?.base;

    /**
     * Récupérer les résultats d'inventaire pour un inventaire et un magasin donnés
     * @param inventoryId - ID de l'inventaire
     * @param storeId - ID du magasin (warehouse)
     */
    static async getResults(inventoryId: number, storeId: string | number): Promise<InventoryResult[]> {
        try {
            const response = await axiosInstance.get(
                `${this.baseUrl}${inventoryId}/warehouses/${storeId}/results/`
            );
            const payload = response.data;

            const rawResults: Array<Record<string, any>> = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];

            if (!Array.isArray(rawResults)) {
                logger.warn('Format de réponse inattendu pour les résultats d\'inventaire', payload);
                return [];
            }

            return rawResults.map((item, index) => {
                const jobId = item.jobId ?? item.job_id ?? item.id ?? `${inventoryId}-${storeId}-${index + 1}`;
                const emplacement = item.emplacement ?? item.location ?? '';
                const article = item.article ?? item.product ?? '';
                const finalResultRaw = item.final_result ?? item.resultats ?? null;
                const finalResult = finalResultRaw === null || finalResultRaw === undefined
                    ? null
                    : Number(finalResultRaw);

                const normalizedItem: Record<string, any> = {
                    id: jobId,
                    jobId,
                    emplacement,
                    article,
                    product: item.product ?? item.article ?? '',
                    final_result: finalResult,
                    resultats: finalResult
                };

                const countingLabels: Record<string, string> = {};
                const differenceLabels: Record<string, string> = {};

                Object.entries(item).forEach(([rawKey, value]) => {
                    if (value === undefined) return;

                    const keyNormalized = rawKey
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .trim()
                        .toLowerCase();

                const countingMatch = keyNormalized.match(/^(\d+)(?:er|eme)?\s*comptage$/i);
                    if (countingMatch) {
                        const order = countingMatch[1];
                        const fieldKey = `contage_${order}`;
                        normalizedItem[fieldKey] = value;
                        countingLabels[fieldKey] = rawKey;
                        return;
                    }

                    const differenceMatch = keyNormalized.match(/^ecart_(\d+)_(\d+)$/i);
                    if (differenceMatch) {
                        const from = differenceMatch[1];
                        const to = differenceMatch[2];
                        const fieldKey = `ecart_${from}_${to}`;
                        normalizedItem[fieldKey] = value;
                        differenceLabels[fieldKey] = rawKey;
                        return;
                    }

                    switch (keyNormalized) {
                        case 'location':
                        case 'emplacement':
                            normalizedItem.emplacement = value;
                            break;
                        case 'product':
                        case 'article':
                            normalizedItem.article = value;
                            normalizedItem.product = value;
                            break;
                        case 'final_result':
                        case 'resultats':
                            normalizedItem.final_result = value === null || value === undefined ? null : Number(value);
                            normalizedItem.resultats = normalizedItem.final_result;
                            break;
                        case 'jobid':
                        case 'job_id':
                            normalizedItem.jobId = value;
                            normalizedItem.id = value;
                            break;
                        default:
                            if (!(rawKey in normalizedItem)) {
                                normalizedItem[rawKey] = value;
                            }
                            break;
                    }
                });

                if (Object.keys(countingLabels).length > 0) {
                    normalizedItem.__countingLabels = countingLabels;
                }
                if (Object.keys(differenceLabels).length > 0) {
                    normalizedItem.__differenceLabels = differenceLabels;
                }

                return normalizedItem as InventoryResult;
            });
        } catch (error) {
            logger.error('Erreur lors de la récupération des résultats', error);
            throw error;
        }
    }

    /**
     * Modifier la valeur d'un résultat d'inventaire
     * @param id - ID du résultat
     * @param data - Données à modifier (valeur du résultat, etc.)
     */
    static async updateValue(id: number | string, data: Partial<InventoryResult>): Promise<AxiosResponse<any>> {
        try {
            const response = await axiosInstance.put(`${this.baseUrl}${id}/`, data);
            return response;
        } catch (error) {
            logger.error('Erreur lors de la modification du résultat', error);
            throw error;
        }
    }

    /**
     * Valider un ou plusieurs résultats d'inventaire
     * @param ids - IDs des résultats à valider
     */
    static async validateResults(ids: Array<number | string>): Promise<AxiosResponse<any>> {
        try {
            const response = await axiosInstance.post(`${this.baseUrl}validate/`, { result_ids: ids });
            return response;
        } catch (error) {
            logger.error('Erreur lors de la validation des résultats', error);
            throw error;
        }
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
        try {
            const response = await axiosInstance.get<StoreOption[]>(
                `${API.endpoints.inventory?.base}${inventoryId}/warehouses/`
            );
            return response.data;
        } catch (error) {
            logger.error('Erreur lors de la récupération des magasins', error);
            throw error;
        }
    }
}

export const inventoryResultsService = InventoryResultsService;
