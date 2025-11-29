/**
 * Types DataTable - Réexport depuis DataTable/types
 * 
 * Ce fichier maintient la compatibilité avec les imports existants
 * Tous les types sont maintenant définis dans @/components/DataTable/types/dataTable.ts
 * 
 * @deprecated Utilisez directement @/components/DataTable/types/dataTable pour les nouveaux imports
 */

// Réexport de tous les types depuis DataTable/types
export type {
    ColumnDataType,
    FilterOperator,
    FilterConfig,
    DataTableColumn,
    ActionConfig,
    DataTableProps
} from '@/components/DataTable/types/dataTable'

// Réexport de StandardDataTableParams depuis utils
export type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// Réexport des types depuis QueryModel
export type {
    QueryModel as QueryModelType,
    SortModel as SortModelType,
    FilterModel as FilterModelType,
    QueryModelResponse as QueryModelResponseType
} from '@/components/DataTable/types/QueryModel'

// Import explicite pour les types d'alias
import type { DataTableColumn, ActionConfig } from '@/components/DataTable/types/dataTable'

// Types d'alias pour compatibilité
export type DataTableColumnAny = DataTableColumn<Record<string, unknown>>
export type ActionConfigAny = ActionConfig<Record<string, unknown>>
