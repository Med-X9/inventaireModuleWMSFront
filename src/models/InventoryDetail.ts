// src/models/InventoryDetail.ts

export interface InventoryComptage {
    order: number;
    count_mode: string;
    champs_actifs: string[];
}

export interface InventoryEquipe {
    id: number;
    reference: string;
    user: {
        id: number;
        username: string;
        email: string;
        nom: string;
        prenom: string;
        type: string;
    }

}

export interface InventoryMagasin {
    nom: string;
    date: string;
}

export interface InventoryRessource {
    id: number;
    reference: string,
    ressource_nom :string,
    quantity: number
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
    account_name: string;
    magasins: InventoryMagasin[];
    comptages: InventoryComptage[];
    equipe: InventoryEquipe[];
    ressources: InventoryRessource[];
}

// Interface pour la réponse API - structure réelle
export interface InventoryDetailResponse {
    message: string;
    data: InventoryDetail;
}
