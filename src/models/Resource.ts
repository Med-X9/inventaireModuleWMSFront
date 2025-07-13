// src/models/Resource.ts

export interface Resource {
    id?: number;
    reference: string;
    libelle: string;
    type_ressource?: string;
    quantity?: number;
    type?: string;
    status?: string;
    unit?: string;
    location?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    // Propriété alternative pour compatibilité
    ressource_nom?: string;
}

export interface CreateResourceRequest {
    reference: string;
    ressource_nom: string;
    quantity: number;
    type?: string;
    status?: string;
    unit?: string;
    location?: string;
    description?: string;
}

export interface UpdateResourceRequest {
    reference?: string;
    ressource_nom?: string;
    quantity?: number;
    type?: string;
    status?: string;
    unit?: string;
    location?: string;
    description?: string;
}

export interface ResourceResponse {
    message: string;
    data: Resource;
}

export interface ResourcesResponse {
    message: string;
    data: Resource[];
    count: number;
    next: string | null;
    previous: string | null;
}

// Interface pour l'assignation de ressources à un inventaire
export interface AssignResourceRequest {
    resource_id: number;
    quantity: number;
}

// Interface pour la réponse d'assignation
export interface AssignResourceResponse {
    message: string;
    data: {
        inventory_id: number;
        resource_id: number;
        quantity: number;
        assigned_at: string;
    };
}
