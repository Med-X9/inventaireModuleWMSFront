import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ArticleService } from '@/services/ArticleService'
import type { Article, UserProductsResponse } from '@/models/Article'
import type { AxiosResponse } from 'axios'
import { logger } from '@/services/loggerService'

export const useArticleStore = defineStore('article', () => {
    // ===== STATE =====
    const articles = ref<Article[]>([])
    const currentUserId = ref<number | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // ===== GETTERS =====
    const getArticles = computed(() => articles.value)
    const getCurrentUserId = computed(() => currentUserId.value)
    const isLoading = computed(() => loading.value)
    const getError = computed(() => error.value)

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Gère les erreurs de manière uniforme avec extraction du message d'erreur backend
     */
    const handleError = (err: unknown, defaultMessage: string): never => {
        let errorMessage = defaultMessage

        if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as any).response
            if (response?.data) {
                const backendData = response.data
                if (backendData.message) {
                    errorMessage = backendData.message
                } else if (backendData.detail) {
                    errorMessage = backendData.detail
                } else if (backendData.error) {
                    errorMessage = backendData.error
                } else if (Array.isArray(backendData.errors)) {
                    const errorMessages = backendData.errors
                        .map((errItem: any) => {
                            if (typeof errItem === 'string') {
                                return errItem
                            }
                            if (errItem?.message) {
                                return errItem.message
                            }
                            if (errItem?.field && errItem?.message) {
                                return `${errItem.field}: ${errItem.message}`
                            }
                            return null
                        })
                        .filter((msg: string | null): msg is string => msg !== null)
                    if (errorMessages.length > 0) {
                        errorMessage = errorMessages.join(' | ')
                    }
                } else if (typeof backendData === 'string') {
                    errorMessage = backendData
                }
            }
        } else if (err instanceof Error) {
            errorMessage = err.message
        }

        error.value = errorMessage
        throw err
    }

    // ===== ACTIONS =====

    /**
     * Récupérer les produits de l'utilisateur connecté
     * @param params - Paramètres optionnels (pagination, filtres, etc.)
     * @returns Promise avec la réponse complète
     */
    const fetchUserProducts = async (
        params?: Record<string, any>
    ): Promise<UserProductsResponse> => {
        loading.value = true
        error.value = null
        try {
            logger.debug('Store: Récupération des produits de l\'utilisateur', { params })

            const response = await ArticleService.getUserProducts(params)
            const products = response.data.data?.products || []

            articles.value = products

            logger.debug('Store: Produits chargés', {
                count: products.length
            })

            return response.data
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des produits de l\'utilisateur')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer les produits de l'utilisateur connecté (version simplifiée qui retourne juste le tableau)
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau de produits
     */
    const fetchUserProductsList = async (
        params?: Record<string, any>
    ): Promise<Article[]> => {
        loading.value = true
        error.value = null
        try {
            const products = await ArticleService.getUserProductsList(params)
            articles.value = products
            return products
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération de la liste des produits')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Réinitialiser l'état du store
     */
    const resetState = () => {
        articles.value = []
        currentUserId.value = null
        loading.value = false
        error.value = null
    }

    /**
     * Vider l'erreur
     */
    const clearError = () => {
        error.value = null
    }

    // ===== RETURN =====
    return {
        // State
        articles,
        currentUserId,
        loading,
        error,

        // Getters
        getArticles,
        getCurrentUserId,
        isLoading,
        getError,

        // Actions
        fetchUserProducts,
        fetchUserProductsList,
        resetState,
        clearError
    }
})

