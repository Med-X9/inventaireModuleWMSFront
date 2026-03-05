/**
 * Service DataTable - pont vers le package @SMATCH-Digital-dev/vue-system-design.
 * Fournit une validation minimale des colonnes pour compatibilité.
 */
import type { DataTableColumn } from '@SMATCH-Digital-dev/vue-system-design'

export interface ColumnValidation {
  isValid: boolean
  errors?: string[]
}

export const dataTableService = {
  /**
   * Valide la configuration d'une colonne (compatibilité).
   * Retourne toujours { isValid: true } ; la validation stricte est gérée par le package.
   */
  validateColumnConfig(_column: Partial<DataTableColumn<Record<string, unknown>>> & { field: string }): ColumnValidation {
    return { isValid: true }
  }
}
