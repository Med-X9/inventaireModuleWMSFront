import axiosInstance from '@/utils/axiosConfig'
import type { AxiosResponse } from 'axios'
import type { Article, UserProductsResponse } from '@/models/Article'
import { logger } from '@/services/loggerService'
import API from '@/api'

/**
 * Service pour la gestion des articles/produits
 */
export class ArticleService {
    /**
     * Récupérer les produits de l'utilisateur connecté
     * @param params - Paramètres optionnels (pagination, filtres, etc.)
     * @returns Promise avec la réponse contenant les produits
     */
    static async getUserProducts(
        params?: Record<string, any>
    ): Promise<AxiosResponse<UserProductsResponse>> {
        try {
            logger.debug('Récupération des produits de l\'utilisateur', { params })

            const url = `${API.endpoints.article.base}products/`
            const response = await axiosInstance.get<UserProductsResponse>(url, {
                params: params || {}
            })

            logger.debug('Produits récupérés avec succès', {
                count: response.data.data?.products?.length || 0
            })

            return response
        } catch (error) {
            logger.error('Erreur lors de la récupération des produits de l\'utilisateur', error)
            throw error
        }
    }

    /**
     * Récupérer tous les produits de l'utilisateur connecté (extrait directement le tableau)
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau de produits
     */
    static async getUserProductsList(
        params?: Record<string, any>
    ): Promise<Article[]> {
        try {
            const response = await this.getUserProducts(params)
            return response.data.data?.products || []
        } catch (error) {
            logger.error('Erreur lors de la récupération de la liste des produits', error)
            throw error
        }
    }
}

