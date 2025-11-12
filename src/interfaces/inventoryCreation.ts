// Types pour les inventaires - Fichier unifié
export type ComptageMode = 'image de stock' | 'en vrac' | 'par article';

export interface ComptageConfig {
    mode: ComptageMode | '';
    inputMethod?: '' | 'saisie' | 'scanner';
    saisieQuantite?: boolean;
    scannerUnitaire?: boolean;
    dlc?: boolean;
    numeroSerie?: boolean;
    numeroLot?: boolean;
    guideQuantite?: boolean;
    guideArticle?: boolean;
    isVariante?: boolean;
    stock_situation?: boolean;
}

export interface StepConfig {
    step: number;
    modes: ComptageMode[];
    options: string[];
}

// Types pour les comptes et magasins
export interface Account {
    id?: number;
    label?: string;
    name?: string;
}

export interface Warehouse {
    id?: number;
    label?: string;
    warehouse_name?: string;
    date?: string;
}

// Interface étendue pour l'en-tête d'inventaire
export interface InventoryHeader {
    libelle?: string;
    date?: string;
    inventory_type?: string;
    compte?: Account | string; // Accepte soit un objet Account soit une string
    magasin?: Warehouse[];
}

export interface InventoryCreationState {
    header: InventoryHeader;
    comptages: ComptageConfig[];
    step?: number;
    step1Data?: InventoryHeader;
}

// Types pour les réponses API
export interface LaunchResponse {
    message?: string;
    error?: string;
    errors?: string[];
    infos?: string[];
}

// Types pour les alertes
export type AlertType = 'error' | 'warning' | 'success' | 'info';

export interface AlertMessageProps {
    show: boolean;
    type: AlertType;
    title: string;
    subtitle: string;
    message: string;
    primaryActionText?: string;
    secondaryActionText?: string;
    primaryAction?: () => void;
    secondaryAction?: () => void;
}

// Alias pour la compatibilité
export type Comptage = ComptageConfig;
