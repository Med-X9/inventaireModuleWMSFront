/**
 * Modèle Article (Product)
 * Représente un produit/article dans le système
 */

export interface Article {
    web_id: number
    product_name: string | null
    product_code: string
    internal_product_code: string
    family_name: string
    is_variant: boolean
    n_lot: boolean
    n_serie: boolean
    dlc: boolean
    numeros_serie: string[]
    created_at: string
    updated_at: string
}

/**
 * Réponse de l'API pour les produits d'un utilisateur
 */
export interface UserProductsResponse {
    success: boolean
    message: string
    data: {
        products: Article[]
    }
}

/**
 * Requête pour récupérer les produits d'un utilisateur
 */
export interface GetUserProductsRequest {
    user_id: number
    params?: Record<string, any>
}

