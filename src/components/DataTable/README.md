# DataTable Component Structure

## Organisation des fichiers

Cette bibliothèque de composants DataTable est organisée en sous-dossiers pour faciliter la maintenance :

### Structure

```
DataTable/
├── README.md                 # Documentation de la structure
├── DataTable.vue            # Composant principal
├── DataTableSkeleton.vue    # Skeleton loader
├── TableHeader.vue          # En-tête du tableau
├── TableBody.vue            # Corps du tableau
├── Toolbar.vue              # Barre d'outils
├── Pagination.vue           # Pagination
├── ColumnManager.vue        # Gestionnaire de colonnes
├── cells/                   # Composants de cellules
│   ├── EditableCell.vue
│   ├── AdvancedEditableCell.vue
│   ├── SafeEditableCell.vue
│   ├── NestedDataCell.vue
│   └── NestedDataExpander.vue
├── filters/                 # Composants de filtres
│   ├── AdvancedFilter.vue
│   └── FilterDropdown.vue
├── composables/             # Composables réutilisables (SOLID)
│   ├── useDataTable.ts          # Composable principal (orchestrateur)
│   ├── useDataTableCore.ts      # Gestion colonnes et état de base
│   ├── useDataTableSelection.ts # Gestion sélection (DRY)
│   ├── useBackendDataTable.ts   # Intégration backend
│   ├── useQueryModel.ts         # Modèle de requête unifié
│   ├── useAutoDataTable.ts      # Gestion automatique complète
│   ├── useDataTableExport.ts    # Export (CSV, Excel, PDF)
│   ├── useDataTableEditing.ts   # Édition inline
│   ├── useDataTableGrouping.ts  # Groupement de lignes
│   ├── useDataTableMasterDetail.ts
│   ├── useDataTablePivot.ts
│   ├── useMultiSort.ts          # Tri multi-colonnes
│   ├── useColumnPinning.ts      # Épinglage de colonnes
│   ├── useColumnResize.ts       # Redimensionnement
│   ├── useSetFilters.ts         # Filtres Set (valeurs uniques)
│   ├── useInfiniteScroll.ts     # Scroll infini
│   └── useVirtualScrolling.ts   # Virtual scrolling
├── types/                   # Types TypeScript
│   └── dataTable.ts
└── services/                # Services
    └── dataTableService.ts
```

## Exemple d'importation

### Depuis un composant Vue

```typescript
import DataTable from '@/components/DataTable/DataTable.vue'
import { useDataTable } from '@/components/DataTable/composables/useDataTable'
import type { DataTableConfig } from '@/components/DataTable/types/dataTable'
```

### Note importante

Si vous déplacez des fichiers existants vers cette structure, assurez-vous de mettre à jour tous les imports dans vos fichiers.
