// src/config/vueConfig.ts

/**
 * Configuration Vue.js pour optimiser les performances et éviter les conflits DOM
 */

export const vueConfig = {
  // Configuration pour éviter les conflits DOM
  performance: {
    // Désactiver les avertissements de performance en production
    productionTip: false,
    // Optimiser les mises à jour réactives
    trackReactivity: false
  },

  // Configuration pour les composants
  components: {
    // Délai pour les mises à jour asynchrones
    asyncUpdateDelay: 50,
    // Nombre maximum de tentatives pour les mises à jour
    maxUpdateRetries: 3
  },

  // Configuration pour les watchers
  watchers: {
    // Délai pour les watchers profonds
    deepWatcherDelay: 100,
    // Utiliser nextTick pour les watchers
    useNextTick: true
  },

  // Configuration pour les erreurs DOM
  domErrorHandling: {
    // Ignorer les erreurs DOM spécifiques
    ignoreErrors: [
      'Node.insertBefore: Child to insert before is not a child of this node',
      'Cannot read property \'insertBefore\' of null'
    ],
    // Retry automatique en cas d'erreur
    autoRetry: true,
    // Délai avant retry
    retryDelay: 200
  }
};

/**
 * Configuration pour les composants de formulaire
 */
export const formConfig = {
  // Délai pour les mises à jour de flat-pickr
  flatpickrUpdateDelay: 150,
  // Délai pour les mises à jour de vue-select
  vueSelectUpdateDelay: 100,
  // Utiliser des clés uniques pour éviter les conflits
  useUniqueKeys: true,
  // Délai pour les validations
  validationDelay: 300
};

/**
 * Configuration pour les composants de wizard
 */
export const wizardConfig = {
  // Délai entre les étapes
  stepTransitionDelay: 100,
  // Validation asynchrone
  asyncValidation: true,
  // Retry en cas d'échec de validation
  validationRetry: true
};
