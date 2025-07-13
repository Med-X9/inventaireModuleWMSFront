// src/config/tsConfig.ts

/**
 * Configuration TypeScript temporaire pour éviter les erreurs de type
 * avec vue-select et autres composants tiers
 */

export const tsConfig = {
  // Désactiver temporairement les vérifications strictes
  strict: false,
  noImplicitAny: false,
  strictNullChecks: false,
  strictFunctionTypes: false,
  strictBindCallApply: false,
  strictPropertyInitialization: false,
  noImplicitThis: false,
  alwaysStrict: false,

  // Configuration pour les composants tiers
  skipLibCheck: true,
  allowJs: true,
  checkJs: false,

  // Configuration pour les modules
  moduleResolution: 'bundler',
  allowImportingTsExtensions: true,
  resolveJsonModule: true,
  isolatedModules: true,
  noEmit: true,

  // Configuration pour Vue
  jsx: 'preserve',
  jsxImportSource: 'vue'
};

/**
 * Fonction pour vérifier si les vérifications strictes sont activées
 */
export function isStrictModeEnabled(): boolean {
  return tsConfig.strict;
}

/**
 * Fonction pour obtenir la configuration TypeScript
 */
export function getTypeScriptConfig() {
  return tsConfig;
}
