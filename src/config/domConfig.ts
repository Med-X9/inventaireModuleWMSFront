// src/config/domConfig.ts

/**
 * Configuration pour la gestion des problèmes DOM
 */

export const domConfig = {
  // Désactiver temporairement certains composants problématiques
  disabledComponents: {
    // Désactiver les tooltips dans les selects si nécessaire
    selectTooltips: false,
    // Désactiver les animations si elles causent des problèmes
    animations: true,
    // Désactiver les transitions si elles causent des problèmes
    transitions: true
  },

  // Configuration des délais pour éviter les conflits
  delays: {
    // Délai avant la mise à jour des composants
    componentUpdate: 100,
    // Délai avant la validation
    validation: 200,
    // Délai avant la réinitialisation
    reset: 300
  },

  // Configuration des retry
  retry: {
    // Nombre maximum de tentatives
    maxAttempts: 3,
    // Délai entre les tentatives
    delay: 500
  },

  // Configuration des erreurs à ignorer
  ignoredErrors: [
    'Node.insertBefore: Child to insert before is not a child of this node',
    'Cannot read property \'insertBefore\' of null',
    'can\'t access property "nextSibling", e is null',
    'TypeError: z is null',
    'TypeError: can\'t access property "nextSibling", e is null'
  ],

  // Configuration du debug
  debug: {
    // Activer le debug DOM
    enabled: true,
    // Afficher les erreurs dans la console
    consoleLog: true,
    // Afficher le composant de debug
    showDebugger: true
  }
};

/**
 * Fonction pour vérifier si une erreur doit être ignorée
 */
export function shouldIgnoreError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return domConfig.ignoredErrors.some(ignored =>
    errorMessage.includes(ignored)
  );
}

/**
 * Fonction pour obtenir un délai basé sur la configuration
 */
export function getDelay(type: keyof typeof domConfig.delays): number {
  return domConfig.delays[type];
}

/**
 * Fonction pour vérifier si le debug est activé
 */
export function isDebugEnabled(): boolean {
  return domConfig.debug.enabled;
}
