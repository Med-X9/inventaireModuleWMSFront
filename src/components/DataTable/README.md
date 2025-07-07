# DataTable & useDataTable

## Présentation

Ce module fournit un composant Vue (`DataTable.vue`) et un composable (`useDataTable.ts`) pour afficher et gérer des tableaux de données avancés avec AG Grid : pagination, tri, filtres, colonnes dynamiques, sélection, actions, nested (détails), export, etc.

---

## 1. Fonctionnalités principales

| Fonctionnalité         | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| Pagination            | Pagination côté client ou serveur, pageSize configurable                    |
| Tri                   | Tri multi-colonnes, côté client ou serveur                                  |
| Filtres               | Filtres texte, nombre, select, personnalisés                                |
| Sélection             | Sélection simple ou multiple, avec checkbox                                 |
| Colonnes dynamiques   | Affichage/masquage des colonnes, persistance via localStorage               |
| Actions par ligne     | Boutons/actions personnalisés par ligne                                     |
| Nested (détails)      | Table imbriquée (expand/collapse) pour afficher des sous-données            |
| Export                | Export CSV, Excel, PDF                                                      |
| Inline editing        | Edition directe dans la cellule (optionnel)                                 |
| Sauvegarde d'état     | Persistance de la config (colonnes, page courante, filtres)                 |
| Slots personnalisés   | Pour injecter des actions ou du contenu additionnel                         |

---

## 2. `useDataTable.ts` — Composable logique

### Props attendues (UseDataTableProps)

| Propriété             | Type                                      | Obligatoire | Description                                                      |
|----------------------|--------------------------------------------|-------------|------------------------------------------------------------------|
| columns              | `DataTableColumn[]`                        | Oui         | Définition des colonnes (voir plus bas)                          |
| rowDataProp          | `T[] \| Ref<T[]> \| ComputedRef<T[]>`      | Oui         | Données à afficher                                               |
| dataUrl              | `string`                                   | Non         | URL pour fetch auto (optionnel)                                  |
| enableFiltering      | `boolean`                                  | Oui         | Active les filtres                                               |
| pagination           | `boolean`                                  | Oui         | Active la pagination                                             |
| storageKey           | `string`                                   | Oui         | Clé pour localStorage                                            |
| actions              | `ActionConfig<T>[]`                        | Oui         | Actions personnalisées par ligne                                 |
| actionsHeaderName    | `string`                                   | Non         | Titre de la colonne actions                                      |
| rowSelection         | `boolean`                                  | Oui         | Active la sélection de lignes                                    |
| exportTitle          | `string`                                   | Non         | Titre pour l'export PDF/Excel                                    |
| inlineEditing        | `boolean`                                  | Oui         | Active l'édition inline                                          |
| maxRowsForDynamicHeight | `number`                                 | Non         | Nombre max de lignes pour auto-height                            |
| showColumnSelector   | `boolean`                                  | Oui         | Affiche le sélecteur de colonnes                                 |
| showDetails          | `boolean`                                  | Oui         | Active la nested table                                           |
| onPaginationChanged  | `(params: { page: number, pageSize: number, sort?: any, filter?: any }) => void` | Non | Callback pagination serveur |

### Méthodes et propriétés exposées

| Nom                        | Type / Signature                                      | Description                                      |
|----------------------------|------------------------------------------------------|--------------------------------------------------|
| rowData                    | `ComputedRef<RowWithDetails[]>`                       | Données prêtes à afficher                        |
| pageSize                   | `Ref<number>`                                        | Taille de page courante                          |
| dynamicGridStyle           | `ComputedRef<object>`                                | Style dynamique pour AG Grid                     |
| defaultColDef              | `ColDef`                                             | Définition par défaut des colonnes               |
| visibleFields              | `Ref<string[]>`                                      | Colonnes visibles                                |
| toggleDropdown             | `() => void`                                         | Ouvre/ferme le sélecteur de colonnes             |
| resetVisibleFields         | `() => void`                                         | Réinitialise les colonnes visibles               |
| expandedRowIds             | `Ref<Set<string>>`                                   | Lignes actuellement expandées (nested)           |
| toggleRowExpansion         | `(rowId: string) => void`                            | Ouvre/ferme une ligne nested                     |
| exportToCsv                | `() => void`                                         | Exporte en CSV                                   |
| exportToExcel              | `() => void`                                         | Exporte en Excel                                 |
| exportToPdf                | `() => void`                                         | Exporte en PDF                                   |
| onGridReady                | `(event: any) => void`                               | Handler AG Grid                                  |
| onFirstDataRendered        | `(event: any, cb?: () => void) => void`              | Handler AG Grid                                  |
| onModelUpdated             | `(event: any, cb?: () => void) => void`              | Handler AG Grid                                  |
| onSelectionChanged         | `(event: any, cb?: (rows: T[]) => void) => void`     | Handler AG Grid                                  |
| onCellKeyDown              | `(event: any) => void`                               | Handler AG Grid                                  |
| onCellEditingStopped       | `(event: any, cb?: (e: any) => void) => void`        | Handler AG Grid                                  |
| savePaginationState        | `() => void`                                         | Sauvegarde la pagination                         |
| calculateOptimalHeight     | `() => void`                                         | Recalcule la hauteur du tableau                  |

### Type DataTableColumn (exemple)
```ts
interface DataTableColumn<T = any> {
  field: string;
  headerName: string;
  sortable?: boolean;
  filter?: string | boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  editable?: boolean;
  description?: string;
  detailConfig?: {
    key: string;
    columns: Array<{ field: string; valueKey: string; formatter?: (value: any, row: any) => string }>;
    iconCollapsed?: string;
    iconExpanded?: string;
    countSuffix?: string;
  };
}
```

---

## 3. `DataTable.vue` — Composant Vue

### Props détaillées

| Prop                  | Type                                      | Obligatoire | Description                                      |
|-----------------------|-------------------------------------------|-------------|--------------------------------------------------|
| columns               | `DataTableColumn[]`                       | Oui         | Colonnes à afficher                              |
| rowDataProp           | `any[]`                                   | Oui         | Données à afficher                               |
| pagination            | `boolean`                                 | Oui         | Active la pagination                             |
| paginationPageSize    | `number`                                  | Non         | Taille de page                                   |
| enableFiltering       | `boolean`                                 | Oui         | Active le filtrage                               |
| storageKey            | `string`                                  | Non         | Clé pour localStorage                            |
| showColumnSelector    | `boolean`                                 | Non         | Affiche le sélecteur de colonnes                 |
| actions               | `ActionConfig[]`                          | Non         | Actions personnalisées par ligne                 |
| showDetails           | `boolean`                                 | Non         | Active la nested table                           |
| rowSelection          | `boolean`                                 | Non         | Active la sélection de lignes                    |
| exportTitle           | `string`                                  | Non         | Titre pour l'export                              |
| inlineEditing         | `boolean`                                 | Non         | Active l'édition inline                          |
| maxRowsForDynamicHeight | `number`                                 | Non         | Nombre max de lignes pour auto-height            |

### Slots disponibles

| Nom            | Description                                      |
|----------------|--------------------------------------------------|
| table-actions  | Pour ajouter des boutons/actions au-dessus du tableau |
| contenu        | Pour ajouter du contenu personnalisé              |

### Événements émis

| Nom                  | Payload / Type         | Description                                      |
|----------------------|-----------------------|--------------------------------------------------|
| selection-changed    | `T[]`                 | Lignes sélectionnées                             |
| sort-changed         | `any`                 | Modèle de tri                                    |
| filter-changed       | `any`                 | Modèle de filtre                                 |
| pagination-changed   | `{ page, pageSize, ...}` | Changement de page ou taille de page           |
| row-expanded         | `{ rowId, expanded }`  | Expansion/collapse d'une ligne (nested)          |

---

## 4. Exemple d'intégration

```vue
<DataTable
  :columns="myColumns"
  :rowDataProp="myData"
  :pagination="true"
  :paginationPageSize="20"
  :enableFiltering="true"
  :showColumnSelector="true"
  :actions="myActions"
  :showDetails="true"
  :rowSelection="true"
  @selection-changed="onSelectionChanged"
  @sort-changed="onSortChanged"
  @filter-changed="onFilterChanged"
  @pagination-changed="onPaginationChanged"
  @row-expanded="onRowExpanded"
>
  <template #table-actions>
    <button @click="exportToCsv">Exporter CSV</button>
  </template>
</DataTable>
```

---

## 5. Bonnes pratiques
- **Sépare la logique** (useDataTable) de l'affichage (DataTable.vue)
- **Utilise les événements** pour brancher tes handlers de reload, tri, filtre, etc.
- **N'utilise pas le reload de data** lors de l'expansion/collapse d'une ligne (nested)
- **Stocke l'état des colonnes** avec `storageKey` pour une UX persistante

---

## 6. Dépendances
- [AG Grid](https://www.ag-grid.com/) (version Community ou Enterprise)
- [Vue 3](https://vuejs.org/)

---

## 7. Aide & extension
Pour toute question ou extension, voir le code source ou contacter l'équipe technique. 
