// Déclarations de types pour @SMATCH-Digital-dev/vue-system-design
// Le package exporte ces composants au runtime (dist/index.js), mais les types ne les exposent pas correctement.
// On ajoute donc des déclarations pour éviter les erreurs TS.

declare module '@SMATCH-Digital-dev/vue-system-design' {
  // Ré-exporter tous les exports du package (inclut les types corrects avec slots)
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/components/base'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/components/overlay'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/components/layout'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/components/charts'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/components/icon'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/composables'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/utils'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/types'
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/theme'
  // Layouts (inclut AppLayout)
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/layouts'
  // Thème install (exporté depuis ./theme/install dans index.d.ts)
  export { installTheme } from '@SMATCH-Digital-dev/vue-system-design/dist/theme/install'

  // DataTable (exporté depuis ./components/DataTable mais pas dans les types)
  import type { DefineComponent } from 'vue'
  export const DataTable: DefineComponent<any, any, any>

  // ButtonGroup (exporté depuis ./components/base/ButtonGroup mais pas dans les types de base)
  export { default as ButtonGroup } from '@SMATCH-Digital-dev/vue-system-design/dist/components/base/ButtonGroup'
  export type { ButtonGroupButton, ButtonGroupVariant, ButtonGroupSize } from '@SMATCH-Digital-dev/vue-system-design/dist/components/base/ButtonGroup'
}

// Déclaration pour le module theme/install
declare module '@SMATCH-Digital-dev/vue-system-design/theme/install' {
  /**
   * Installe le thème en injectant les variables CSS dans le document
   */
  export function installTheme(): void
  export default installTheme
}

// Déclaration pour le module theme
declare module '@SMATCH-Digital-dev/vue-system-design/theme' {
  export * from '@SMATCH-Digital-dev/vue-system-design/dist/theme'
}


