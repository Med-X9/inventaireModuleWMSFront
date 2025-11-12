// src/utils/domUtils.ts

/**
 * Utilitaire pour gérer les erreurs DOM et améliorer la stabilité
 */

import { logger } from '@/services/loggerService';

/**
 * Exécute une fonction de manière sécurisée en évitant les conflits DOM
 * @param fn - Fonction à exécuter
 * @param fallback - Fonction de fallback en cas d'erreur
 */
export function safeExecute<T>(fn: () => T, fallback?: () => T): T | undefined {
    try {
        return fn();
    } catch (error) {
        logger.warn('Erreur DOM détectée, utilisation du fallback', error);
        return fallback?.();
    }
}

/**
 * Exécute une fonction de manière asynchrone avec retry en cas d'erreur DOM
 * @param fn - Fonction à exécuter
 * @param maxRetries - Nombre maximum de tentatives
 * @param delay - Délai entre les tentatives en ms
 */
export async function safeExecuteWithRetry<T>(
    fn: () => T | Promise<T>,
    maxRetries: number = 3,
    delay: number = 100
): Promise<T | undefined> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            logger.warn(`Tentative ${i + 1}/${maxRetries} échouée`, error);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return undefined;
}

/**
 * Vérifie si un élément DOM existe et est valide
 * @param element - Élément à vérifier
 */
export function isValidDOMElement(element: any): boolean {
    return element &&
           typeof element === 'object' &&
           element.nodeType !== undefined &&
           element.nodeType !== 3; // Pas un nœud de texte
}

/**
 * Force la mise à jour d'un composant avec gestion d'erreur
 * @param component - Composant à mettre à jour
 * @param updateFn - Fonction de mise à jour
 */
export function safeComponentUpdate<T>(
    component: T,
    updateFn: (comp: T) => void
): void {
    if (!component) return;

    safeExecute(() => {
        updateFn(component);
    });
}

/**
 * Gestionnaire d'erreur global pour les erreurs DOM
 */
export function setupGlobalDOMErrorHandler(): void {
    if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message &&
                event.error.message.includes('Node.insertBefore')) {
                logger.warn('Erreur DOM détectée et ignorée', event.error);
                event.preventDefault();
                return false;
            }
        });
    }
}
