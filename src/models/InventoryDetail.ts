// src/models/InventoryDetail.ts

export interface InventoryComptage {
    order: number;
    count_mode: string;
    champs_actifs: string[];
}

export interface InventoryEquipe {
    id?: number;
    reference: string | null;
    // Format depuis l'endpoint /team/ (format nouveau)
    user?: string; // username directement
    nombre_comptage?: number;
    // Format ancien (si nécessaire pour compatibilité)
    userObject?: {
        id: number;
        username: string;
        email: string;
        nom: string;
        prenom: string;
        type: string;
    };
}

export interface InventoryMagasin {
    nom: string;
    date: string | null;
}

export interface InventoryRessource {
    id?: number;
    reference: string;
    ressource_reference?: string | null;
    ressource_nom: string | null;
    quantity: number;
}

export interface InventoryDetail {
    id: number;
    reference: string;
    label: string;
    date: string;
    status: string;
    inventory_type: string;
    en_preparation_status_date: string | null;
    en_realisation_status_date: string | null;
    termine_status_date: string | null;
    cloture_status_date: string | null;
    account_name?: string;
    account_reference?: string;
    magasins: InventoryMagasin[];
    comptages: InventoryComptage[];
    equipe: InventoryEquipe[];
    ressources: InventoryRessource[];
}

// Interfaces pour les réponses des nouveaux endpoints

export interface InventoryBasicResponse {
    success: boolean;
    message: string;
    data: {
        reference: string;
        label: string;
        date: string;
        status: string;
        inventory_type: string;
        en_preparation_status_date: string | null;
        en_realisation_status_date: string | null;
        termine_status_date: string | null;
        cloture_status_date: string | null;
    };
}

export interface InventoryAccountResponse {
    success: boolean;
    message: string;
    data: {
        account_name: string | null;
        account_reference: string | null;
    };
}

export interface InventoryWarehousesResponse {
    success: boolean;
    message: string;
    data: {
        magasins: InventoryMagasin[];
    };
}

export interface InventoryCountingsResponse {
    success: boolean;
    message: string;
    data: {
        comptages: InventoryComptage[];
    };
}

export interface InventoryTeamResponse {
    success: boolean;
    message: string;
    data: {
        equipe: Array<{
            reference: string | null;
            user: string;
            nombre_comptage: number;
        }>;
    };
}

export interface InventoryResourcesResponse {
    success: boolean;
    message: string;
    data: {
        ressources: Array<{
            reference: string;
            ressource_reference: string | null;
            ressource_nom: string | null;
            quantity: number;
        }>;
    };
}

// Interface pour la réponse API - structure réelle (ancien endpoint)
export interface InventoryDetailResponse {
    message: string;
    data: InventoryDetail;
}
