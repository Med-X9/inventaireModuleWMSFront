/**
 * Service pour la gestion des écarts de comptage
 * 
 * Ce service gère :
 * - La mise à jour du résultat final d'un écart
 * - La résolution d'un écart
 * 
 * @module EcartComptageService
 */

import axiosInstance from '@/utils/axiosConfig'
import { logger } from '@/services/loggerService'
import type { AxiosResponse } from 'axios'

/**
 * Interface pour la mise à jour du résultat final
 */
export interface UpdateFinalResultRequest {
    final_result: number
    justification?: string
    resolved?: boolean
}

/**
 * Interface pour la résolution d'un écart
 */
export interface ResolveEcartRequest {
    justification?: string
}

/**
 * Réponse de l'API pour la mise à jour du résultat final
 */
export interface UpdateFinalResultResponse {
    success: boolean
    message: string
    data: {
        id: number
        reference: string
        inventory: number
        total_sequences: number
        stopped_sequence: number
        final_result: number
        justification?: string
        resolved: boolean
        created_at: string
        updated_at: string
    }
}

/**
 * Réponse de l'API pour la résolution d'un écart
 */
export interface ResolveEcartResponse {
    success: boolean
    message: string
    data: {
        id: number
        reference: string
        inventory: number
        total_sequences: number
        stopped_sequence: number
        final_result: number
        justification?: string
        resolved: boolean
        created_at: string
        updated_at: string
    }
}

/**
 * Service pour la gestion des écarts de comptage
 */
export class EcartComptageService {
    private static baseUrl = '/web/api/ecarts-comptage/'

    /**
     * Mettre à jour le résultat final d'un écart de comptage
     * 
     * @param ecartId - ID de l'écart de comptage
     * @param data - Données de mise à jour
     * @returns Réponse de l'API
     */
    static async updateFinalResult(
        ecartId: number,
        data: UpdateFinalResultRequest
    ): Promise<AxiosResponse<UpdateFinalResultResponse>> {
        try {
            logger.debug('Mise à jour du résultat final de l\'écart', { ecartId, data })
            
            const response = await axiosInstance.patch<UpdateFinalResultResponse>(
                `${this.baseUrl}${ecartId}/final-result/`,
                data
            )

            logger.debug('Résultat final mis à jour avec succès', response.data)
            return response
        } catch (error: any) {
            logger.error('Erreur lors de la mise à jour du résultat final', { ecartId, error })
            throw error
        }
    }

    /**
     * Résoudre un écart de comptage
     * 
     * @param ecartId - ID de l'écart de comptage
     * @param data - Données de résolution (justification optionnelle)
     * @returns Réponse de l'API
     */
    static async resolveEcart(
        ecartId: number,
        data?: ResolveEcartRequest
    ): Promise<AxiosResponse<ResolveEcartResponse>> {
        try {
            logger.debug('Résolution de l\'écart de comptage', { ecartId, data })
            
            const response = await axiosInstance.patch<ResolveEcartResponse>(
                `${this.baseUrl}${ecartId}/resolve/`,
                data || {}
            )

            logger.debug('Écart résolu avec succès', response.data)
            return response
        } catch (error: any) {
            logger.error('Erreur lors de la résolution de l\'écart', { ecartId, error })
            throw error
        }
    }
}

