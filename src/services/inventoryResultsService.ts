import axiosInstance from '@/utils/axiosConfig';
import type { StoreOption, InventoryResult } from '../interfaces/inventoryResults';
import type { AxiosResponse } from 'axios';
import API from '@/api';
import { logger } from '@/services/loggerService';
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter';

export class InventoryResultsService {
    private static baseUrl = API.endpoints.inventory?.base;

    /**
     * Récupérer les résultats d'inventaire pour un inventaire et un magasin donnés
     * @param inventoryId - ID de l'inventaire
     * @param storeId - ID du magasin (warehouse)
     * @param params - Paramètres DataTable optionnels (pagination, tri, filtres, recherche)
     */
    static async getResults(
        inventoryId: number,
        storeId: string | number,
        params?: StandardDataTableParams | Record<string, any>
    ): Promise<InventoryResult[]> {
        try {
            logger.debug('Récupération des résultats avec paramètres DataTable', {
                inventoryId,
                storeId,
                params
            });

            const response = await axiosInstance.get(
                `${this.baseUrl}${inventoryId}/warehouses/${storeId}/results/`,
                { params: params || {} }
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
                    // Ne pas ignorer les valeurs null, seulement undefined
                    // Les valeurs null sont valides pour les écarts (indiquent qu'il n'y a pas d'écart calculable)
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

                    // Pattern modifié pour accepter tous les formats d'écart :
                    // - ecart_1_2 (deux nombres)
                    // - ecart_1_2_3 (trois nombres)
                    // - ecart_1_2_3_4 (quatre nombres ou plus)
                    // Pattern: ecart_ suivi d'au moins un chiffre, puis un ou plusieurs groupes de _chiffres
                    // Vérifier d'abord si la clé commence déjà par "ecart_" (format standard)
                    if (rawKey.toLowerCase().startsWith('ecart_')) {
                        // Utiliser la clé telle quelle si elle est déjà au bon format
                        // Préserver la valeur même si elle est null (null signifie pas d'écart calculable)
                        normalizedItem[rawKey] = value;
                        differenceLabels[rawKey] = rawKey;
                        logger.debug('Écart normalisé', { rawKey, value, fieldKey: rawKey });
                        return;
                    }

                    // Sinon, essayer de matcher avec le pattern normalisé
                    const differenceMatch = keyNormalized.match(/^ecart_((?:\d+_?)+)$/i);
                    if (differenceMatch) {
                        // Préserver le format exact de la clé si elle est déjà au bon format
                        // Sinon, normaliser en format standard
                        const numbers = differenceMatch[1].split('_').filter(n => n.length > 0);
                        if (numbers.length >= 2) {
                            const fieldKey = `ecart_${numbers.join('_')}`;
                            normalizedItem[fieldKey] = value;
                            differenceLabels[fieldKey] = rawKey;
                            return;
                        }
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
                            // Pour les champs non reconnus, les copier tels quels
                            // Cela inclut les champs d'écart qui n'ont pas été normalisés précédemment
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
