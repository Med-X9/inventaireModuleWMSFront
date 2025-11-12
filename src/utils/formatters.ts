/**
 * Utilitaires de formatage pour l'application
 */
import type { ComptageMode } from '@/interfaces/inventoryCreation';

export class Formatters {
    /**
     * Formate une date en format français long
     */
    static formatDate(date: string | undefined): string {
        if (!date) return 'Non défini';
        try {
            return new Date(date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return date || 'Format invalide';
        }
    }

    /**
     * Formate une date en format français court
     */
    static formatDateShort(date: string | undefined): string {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return date;
        }
    }

    /**
     * Formate le type d'inventaire
     */
    static formatInventoryType(type: string | undefined): string {
        const types: Record<string, string> = {
            'GENERAL': 'Général',
            'TOURNANT': 'Tournant'
        };
        return types[type || ''] || type || 'Non défini';
    }

    /**
     * Formate un compte
     */
    static formatAccount(account: any): string {
        if (!account) return 'Non défini';
        if (typeof account === 'string') return account;
        if (typeof account === 'object' && account.label) return account.label;
        if (typeof account === 'object' && account.name) return account.name;
        return 'Compte sélectionné';
    }

    /**
     * Formate le mode de comptage
     */
    static formatMode(mode: ComptageMode | string | undefined): string {
        const modes: Record<string, string> = {
            'en vrac': 'En vrac',
            'par article': 'Par article',
            'image de stock': 'Image de stock'
        };
        return modes[mode || ''] || mode || 'Non défini';
    }

    /**
     * Formate la méthode de saisie
     */
    static formatInputMethod(method: string | undefined): string {
        const methods: Record<string, string> = {
            'saisie': 'Saisie manuelle',
            'scanner': 'Scanner'
        };
        return methods[method || ''] || (method || 'Non défini');
    }

    /**
     * Formate un nom de magasin
     */
    static formatWarehouseName(warehouse: any): string {
        if (typeof warehouse === 'string') return warehouse;
        if (typeof warehouse === 'object') {
            return warehouse.label || warehouse.warehouse_name || 'Magasin';
        }
        return 'Magasin';
    }
}
