// src/models/Location.ts

// Interface pour une sous-zone
export interface SousZone {
    id: number;
    reference: string;
    sous_zone_name: string;
    sous_zone_status: string;
    description: string;
}

// Interface pour une zone
export interface Zone {
    id: number;
    reference: string;
    zone_name: string;
    zone_status: string;
    description: string;
}

// Interface pour un entrepôt
export interface Warehouse {
    id: number;
    reference: string;
    warehouse_name: string;
    warehouse_type: string;
    status: string;
}

// Interface pour une location
export interface Location {
    id: number;
    reference: string;
    location_reference: string;
    description: string;
    sous_zone: SousZone;
    zone: Zone;
    warehouse: Warehouse;
    // "families":[{"id":155,"reference":"FAM-1772","family_name":"TOP MODEL","family_description":null,"family_status":"ACTIVE"}
    created_at?: string;
    updated_at?: string;
}

// Interface pour la création d'une location
export interface CreateLocationRequest {
    reference: string;
    location_reference: string;
    description: string;
    sous_zone_id: number;
    zone_id: number;
    warehouse_id: number;
}

// Interface pour la mise à jour d'une location
export interface UpdateLocationRequest {
    reference?: string;
    location_reference?: string;
    description?: string;
    sous_zone_id?: number;
    zone_id?: number;
    warehouse_id?: number;
}

// Interface pour la réponse paginée des locations
export interface LocationResponse {
    count: number;
    results: Location[];
    next: string | null;
    previous: string | null;
}

// Interface pour les filtres de recherche
export interface LocationFilters {
    reference?: string;
    location_reference?: string;
    description?: string;
    sous_zone_id?: number;
    zone_id?: number;
    warehouse_id?: number;
    sous_zone_name?: string;
    zone_name?: string;
    warehouse_name?: string;
}

// Interface pour les paramètres de requête
export interface LocationQueryParams {
    page?: number;
    page_size?: number;
    ordering?: string;
    search?: string;
    reference?: string;
    location_reference?: string;
    description?: string;
    sous_zone_id?: number;
    zone_id?: number;
    warehouse_id?: number;
    sous_zone_name?: string;
    zone_name?: string;
    warehouse_name?: string;
}
