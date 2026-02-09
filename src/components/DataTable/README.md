# 📊 DataTable - Composant de Table de Données

Composant Vue 3 de table de données avancé, **100% server-side**, avec pagination, tri, filtrage, recherche et export.

## 🚀 Utilisation de Base

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :loading="loading"
    :currentPageProp="currentPage"
    :totalPagesProp="totalPages"
    :totalItemsProp="totalItems"
    :pageSizeProp="pageSize"
    @query-model-changed="handleQueryChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'

const columns = [
  { field: 'id', headerName: 'ID', sortable: true },
  { field: 'name', headerName: 'Nom', sortable: true, filterable: true },
  { field: 'email', headerName: 'Email', filterable: true }
]

const data = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const pageSize = ref(20)

const handleQueryChange = async (queryModel: QueryModel) => {
  loading.value = true
  try {
    // Appel API avec queryModel
    const response = await fetchData(queryModel)
    data.value = response.data
    currentPage.value = response.page
    totalPages.value = response.totalPages
    totalItems.value = response.totalItems
  } finally {
    loading.value = false
  }
}
</script>
```

## 📋 Props Principales

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `columns` | `DataTableColumn[]` | **requis** | Définition des colonnes |
| `rowDataProp` | `any[]` | `[]` | Données de la table |
| `loading` | `boolean` | `false` | État de chargement |
| `currentPageProp` | `number` | `1` | Page actuelle |
| `totalPagesProp` | `number` | `1` | Nombre total de pages |
| `totalItemsProp` | `number` | `0` | Nombre total d'éléments |
| `pageSizeProp` | `number` | `20` | Taille de page |
| `pagination` | `boolean` | `true` | Activer la pagination |
| `enableFiltering` | `boolean` | `true` | Activer les filtres |
| `enableGlobalSearch` | `boolean` | `true` | Activer la recherche globale |
| `rowSelection` | `boolean` | `false` | Activer la sélection multiple |
| `storageKey` | `string` | `'datatable'` | Clé pour la persistance localStorage |

## 🎯 Événements

### `@query-model-changed`

Événement principal émis pour tous les changements (pagination, tri, filtres, recherche).

```typescript
interface QueryModel {
  page: number
  pageSize: number
  sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>
  filters?: Record<string, FilterModel>
  search?: string
  customParams?: Record<string, any>
}
```

**Exemple :**
```typescript
const handleQueryChange = (queryModel: QueryModel) => {
  // queryModel.page = 2
  // queryModel.pageSize = 50
  // queryModel.sort = [{ colId: 'name', sort: 'asc' }]
  // queryModel.filters = { name: { operator: 'contains', value: 'test' } }
  // queryModel.search = 'recherche globale'
  
  // Appel API
  fetchData(queryModel)
}
```

### Événements Spécifiques (optionnels)

- `@pagination-changed` : Changement de page/taille
- `@sort-changed` : Changement de tri
- `@filter-changed` : Changement de filtres
- `@global-search-changed` : Changement de recherche globale

## 📐 Configuration des Colonnes

```typescript
interface DataTableColumn {
  field: string                    // Nom du champ
  headerName: string               // Libellé de l'en-tête
  sortable?: boolean               // Activer le tri
  filterable?: boolean             // Activer le filtre
  width?: number                   // Largeur fixe
  minWidth?: number                // Largeur minimale
  maxWidth?: number                // Largeur maximale
  flex?: number                    // Flex pour largeur automatique
  hide?: boolean                   // Masquer la colonne
  visible?: boolean                // Visibilité de la colonne
  pinned?: 'left' | 'right'        // Épingler la colonne
  valueFormatter?: (params: any) => string  // Formatter de valeur
  cellRenderer?: string | Component // Renderer personnalisé
}
```

**Exemple :**
```typescript
const columns = [
  {
    field: 'id',
    headerName: 'ID',
    sortable: true,
    width: 80
  },
  {
    field: 'name',
    headerName: 'Nom',
    sortable: true,
    filterable: true,
    flex: 1
  },
  {
    field: 'price',
    headerName: 'Prix',
    sortable: true,
    valueFormatter: ({ value }) => `${value} €`
  },
  {
    field: 'status',
    headerName: 'Statut',
    cellRenderer: 'badge',
    cellRendererParams: {
      colorMap: { active: 'green', inactive: 'gray' }
    }
  }
]
```

## 🔍 Filtrage

### Filtres par Colonne

Les filtres sont activés automatiquement si `filterable: true` sur la colonne.

**Opérateurs disponibles :**
- `equals`, `not_equals`
- `contains`, `not_contains`
- `starts_with`, `ends_with`
- `greater_than`, `less_than`
- `greater_equal`, `less_equal`
- `between`, `in`, `not_in`
- `is_null`, `is_not_null`
- `is_empty`, `is_not_empty`
- `regex`

### Recherche Globale

Recherche dans toutes les colonnes activées. Émet un `QueryModel` avec `search`.

## 🔄 Tri

### Tri Simple
Cliquer sur l'en-tête de colonne pour trier (asc/desc).

### Tri Multi-Colonnes
Activer avec `enableMultiSort: true`. Maintenir `Ctrl` + clic pour ajouter plusieurs tris.

## 📤 Export

Exports disponibles via la toolbar :
- **CSV** : Export complet ou sélection
- **Excel** : Export complet ou sélection
- **PDF** : Export complet

```vue
<DataTable
  @export-csv="handleExportCsv"
  @export-spreadsheet="handleExportExcel"
  @export-pdf="handleExportPdf"
/>
```

## 💾 Persistance

La persistance automatique dans `localStorage` est activée avec `storageKey` :

```vue
<DataTable
  storageKey="inventory-table"
  <!-- Sauvegarde automatique : colonnes visibles, largeurs, filtres, tri, pagination -->
/>
```

## 🎨 Fonctionnalités Avancées

### Sélection Multiple
```vue
<DataTable
  :rowSelection="true"
  @selection-changed="handleSelection"
/>
```

### Édition Inline
```vue
<DataTable
  :inlineEditing="true"
  @cell-value-changed="handleCellEdit"
/>
```

### Colonnes Épinglées
```vue
<DataTable
  :enableColumnPinning="true"
  <!-- Glisser-déposer les colonnes pour les épingler -->
/>
```

### Groupement de Lignes
```vue
<DataTable
  :enableGrouping="true"
  :groupBy="['category']"
/>
```

## 🏗️ Architecture

Le DataTable utilise une architecture modulaire avec des composables spécialisés :

- **`useDataTable`** : État de base (colonnes, pagination, sélection)
- **`useDataTableServerSide`** : Logique server-side (pagination, tri, filtres, recherche)
- **`useDataTableFeatures`** : Fonctionnalités (export, gestion colonnes, persistance)
- **`useDataTableState`** : États globaux (loading, erreurs, computed)
- **`useDataTableColumns`** : Gestion des colonnes (formatage, visibilité)
- **`useQueryModel`** : Modèle de requête unifié

## 📝 Notes Importantes

1. **100% Server-Side** : Toutes les opérations (pagination, tri, filtres) sont gérées côté serveur
2. **QueryModel Unifié** : Tous les événements utilisent le format `QueryModel`
3. **Performance** : Optimisé pour les grandes quantités de données (cache RowId, watchers optimisés)
4. **TypeScript** : Entièrement typé avec interfaces strictes

## 🔗 Types

Tous les types sont exportés depuis :
- `@/components/DataTable/types/dataTable` : Types de colonnes et props
- `@/components/DataTable/types/QueryModel` : Types de QueryModel
- `@/components/DataTable/types/composables` : Types des composables

