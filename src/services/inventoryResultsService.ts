import axiosInstance from '@/utils/axiosConfig';
import type { StoreOption, InventoryResult } from '../interfaces/inventoryResults';
import type { AxiosResponse } from 'axios';
import API from '@/api';
import { logger } from '@/services/loggerService';
import { normalizeDataTableResponse, convertUnifiedToStandardDataTable } from '@/utils/dataTableResponseNormalizer';
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter';

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
     * Récupérer les résultats d'inventaire pour un inventaire et un magasin donnés
     *
     * Architecture : composable -> store -> service
     * Le service reçoit les paramètres déjà convertis au format FORMAT_ACTUEL.md par le store
     * et fait uniquement l'appel API
     *
     * @param inventoryId - ID de l'inventaire
     * @param storeId - ID du magasin (warehouse)
     * @param params - Paramètres au format FORMAT_ACTUEL.md (déjà convertis par le store)
     * @returns Objet contenant les résultats et les informations de pagination
     */
    static async getResults(
        inventoryId: number,
        storeId: string | number,
        params?: Record<string, any>
    ): Promise<{
        data: InventoryResult[];
        recordsFiltered?: number;
        recordsTotal?: number;
        draw?: number;
        page?: number;
        totalPages?: number;
        pageSize?: number;
        total?: number;
    }> {
        try {
            logger.debug('Service: Appel API pour récupérer les résultats', {
                inventoryId,
                storeId,
                params
            });

            // Le service reçoit les paramètres déjà convertis au format FORMAT_ACTUEL.md par le store
            // Il fait uniquement l'appel API avec POST et JSON body
            const response = await axiosInstance.post(
                `${this.baseUrl}${inventoryId}/warehouses/${storeId}/results/`,
                params || {},
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            const payload = response.data;

            // Normaliser la réponse backend vers le format FORMAT_ACTUEL.md
            // Format attendu : { rows: [...], page: 2, pageSize: 10, total: 28, totalPages: 3 }

            // Normaliser la réponse backend vers le format unifié
            // Format attendu : { rows: [...], page: 2, pageSize: 10, total: 28, totalPages: 3 }
            const unifiedResponse = normalizeDataTableResponse<Record<string, any>>(payload);

            // Convertir vers le format DataTable standard pour compatibilité
            const normalizedResponse = convertUnifiedToStandardDataTable(unifiedResponse);

            const rawResults = normalizedResponse.data;
            const recordsFiltered = normalizedResponse.recordsFiltered;
            const recordsTotal = normalizedResponse.recordsTotal;
            const draw = normalizedResponse.draw;

            // Optimiser la normalisation avec moins d'itérations
            const normalizedResults = rawResults.map((item, index) => {
                const jobId = item.jobId ?? item.job_id ?? item.id ?? `${inventoryId}-${storeId}-${index + 1}`;
                const emplacement = item.emplacement ?? item.location ?? '';
                const article = item.article ?? item.product ?? '';
                const finalResultRaw = item.final_result ?? item.resultats ?? null;
                const finalResult = finalResultRaw === null || finalResultRaw === undefined
                    ? null
                    : Number(finalResultRaw);

                // Créer l'objet de base directement (plus rapide)
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

                // Optimiser : itérer une seule fois sur les clés
                const entries = Object.entries(item);
                for (let i = 0; i < entries.length; i++) {
                    const [rawKey, value] = entries[i];

                    // Ignorer undefined
                    if (value === undefined) continue;

                    // Vérifier d'abord les formats standards (plus rapide)
                    const keyLower = rawKey.toLowerCase();

                    // Comptage : format standard contage_X
                    if (keyLower.startsWith('contage_')) {
                        normalizedItem[rawKey] = value;
                        continue;
                    }

                    // Écart : format standard ecart_X_Y
                    if (keyLower.startsWith('ecart_')) {
                        normalizedItem[rawKey] = value;
                        differenceLabels[rawKey] = rawKey;
                        continue;
                    }

                    // Sinon, normaliser seulement si nécessaire (lent, donc en dernier)
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
                        continue;
                    }

                    const differenceMatch = keyNormalized.match(/^ecart_((?:\d+_?)+)$/i);
                    if (differenceMatch) {
                        const numbers = differenceMatch[1].split('_').filter(n => n.length > 0);
                        if (numbers.length >= 2) {
                            const fieldKey = `ecart_${numbers.join('_')}`;
                            normalizedItem[fieldKey] = value;
                            differenceLabels[fieldKey] = rawKey;
                            continue;
                        }
                    }

                    // Traitement des champs standards (switch optimisé)
                    switch (keyNormalized) {
                        case 'location':
                        case 'emplacement':
                            if (!normalizedItem.emplacement) normalizedItem.emplacement = value;
                            break;
                        case 'product':
                        case 'article':
                            if (!normalizedItem.article) {
                                normalizedItem.article = value;
                                normalizedItem.product = value;
                            }
                            break;
                        case 'final_result':
                        case 'resultats':
                            if (normalizedItem.final_result === null) {
                                normalizedItem.final_result = value === null || value === undefined ? null : Number(value);
                                normalizedItem.resultats = normalizedItem.final_result;
                            }
                            break;
                        case 'jobid':
                        case 'job_id':
                            if (!normalizedItem.jobId) {
                                normalizedItem.jobId = value;
                                normalizedItem.id = value;
                            }
                            break;
                        default:
                            // Copier seulement si pas déjà présent
                            if (!(rawKey in normalizedItem)) {
                                normalizedItem[rawKey] = value;
                            }
                            break;
                    }
                }

                // Ajouter les labels seulement si nécessaire
                if (Object.keys(countingLabels).length > 0) {
                    normalizedItem.__countingLabels = countingLabels;
                }
                if (Object.keys(differenceLabels).length > 0) {
                    normalizedItem.__differenceLabels = differenceLabels;
                }

                return normalizedItem as InventoryResult;
            });

            // Les informations de pagination ont déjà été extraites plus haut
            // Utiliser les valeurs déjà calculées

            // Extraire page et totalPages de la réponse normalisée
            // ⚠️ Utiliser UNIQUEMENT les valeurs du backend - aucun calcul
            // Le backend retourne { rows, page, pageSize, total, totalPages }
            // unifiedResponse contient ces valeurs directement
            const page = unifiedResponse.page ?? 1
            const totalPages = unifiedResponse.totalPages ?? 0 // ⚠️ Utiliser uniquement la valeur du backend (pas de || qui masque 0)

            // Debug: logger les valeurs extraites (seulement en mode développement)
            if (process.env.NODE_ENV === 'development') {
                logger.debug('inventoryResultsService: Valeurs extraites', {
                    page,
                    totalPages,
                    pageSize: unifiedResponse.pageSize,
                    total: unifiedResponse.total
                })
            }

            return {
                data: normalizedResults,
                recordsFiltered,
                recordsTotal,
                draw,
                // Ajouter page et totalPages pour que useBackendDataTable puisse les utiliser
                page,
                totalPages,
                pageSize: unifiedResponse.pageSize,
                total: unifiedResponse.total
            } as any; // Type assertion car le type de retour standard ne contient pas ces champs
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
            const response = await axiosInstance.put(`${this.baseUrl2}${id}/final-result/`, data);
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
    static async validateResults(ids: number): Promise<AxiosResponse<any>> {
        try {
            const response = await axiosInstance.post(`${this.baseUrl2}/${ids}/resolve/`);
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
        params?: StandardDataTableParams | Record<string, any>
    ): Promise<AxiosResponse<Blob>> {
        try {
            logger.debug('Export des résultats d\'inventaire', {
                inventoryId,
                storeId,
                format,
                params
            });

            // Construire les paramètres avec le format d'export
            const exportParams = {
                ...params,
                export: format
            };

            const response = await axiosInstance.get(
                `${this.baseUrl}${inventoryId}/warehouses/${storeId}/results/`,
                {
                    params: exportParams,
                    responseType: 'blob'
                }
            );

            logger.debug('Export réussi', {
                format,
                blobSize: response.data.size
            });

            return response;
        } catch (error) {
            logger.error('Erreur lors de l\'export des résultats', error);
            throw error;
        }
    }

    /**
     * Exporter les articles consolidés d'un inventaire en Excel
     * @param inventoryId - ID de l'inventaire
     * @returns Promise avec la réponse contenant le blob du fichier Excel
     */
    static async exportConsolidatedArticles(inventoryId: number): Promise<AxiosResponse<Blob>> {
        try {
            logger.debug('Export des articles consolidés', { inventoryId });

            const response = await axiosInstance.get(
                `${this.baseUrl}${inventoryId}/articles-consolides/export/`,
                {
                    responseType: 'blob'
                }
            );

            logger.debug('Export des articles consolidés réussi', {
                blobSize: response.data.size
            });

            return response;
        } catch (error) {
            logger.error('Erreur lors de l\'export des articles consolidés', error);
            throw error;
        }
    }
}

export const inventoryResultsService = InventoryResultsService;
