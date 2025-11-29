# 📊 Documentation DataTable

## Vue d'ensemble

Le composant `DataTable` est un tableau de données avancé avec support de :
- ✅ Pagination (côté serveur ou client)
- ✅ Tri (selon configuration des colonnes)
- ✅ Filtrage (selon configuration des colonnes)
- ✅ Recherche globale
- ✅ Sélection multiple
- ✅ Export (CSV, Excel, PDF)
- ✅ Édition inline
- ✅ Groupement de lignes
- ✅ Virtual scrolling

## 🚀 Utilisation de base

### Exemple minimal

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :actions="actions"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import type { DataTableColumn, ActionConfig } from '@/types/dataTable'

const columns: DataTableColumn[] = [
  {
    field: 'name',
    headerName: 'Nom',
    sortable: true,
    filterable: true,
    dataType: 'text'
  },
  {
    field: 'status',
    headerName: 'Statut',
    sortable: true,
    filterable: true,
    dataType: 'select',
    filterConfig: {
      dataType: 'select',
      operator: 'in',
      options: [
        { value: 'ACTIF', label: 'Actif' },
        { value: 'INACTIF', label: 'Inactif' }
      ]
    }
  }
]

const data = ref([
  { name: 'Item 1', status: 'ACTIF' },
  { name: 'Item 2', status: 'INACTIF' }
])

const actions: ActionConfig[] = [
  {
    label: 'Éditer',
    onClick: (row) => console.log('Éditer', row)
  }
]
</script>
```

## 📋 Props principales

### Props obligatoires

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `DataTableColumn[]` | Configuration des colonnes |
| `rowDataProp` | `any[]` | Données à afficher |

### Props optionnelles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `actions` | `ActionConfig[]` | `[]` | Actions disponibles pour chaque ligne |
| `loading` | `boolean` | `false` | État de chargement |
| `serverSidePagination` | `boolean` | `false` | Pagination côté serveur |
| `currentPageProp` | `number` | `1` | Page courante (si pagination serveur) |
| `pageSizeProp` | `number` | `10` | Taille de page |
| `totalItemsProp` | `number` | `0` | Total d'éléments (si pagination serveur) |
| `enableGlobalSearch` | `boolean` | `true` | Activer la recherche globale |
| `enableFiltering` | `boolean` | `true` | Activer le filtrage |
| `enableSorting` | `boolean` | `true` | Activer le tri |
| `enablePagination` | `boolean` | `true` | Activer la pagination |
| `rowSelection` | `boolean` | `false` | Activer la sélection multiple |
| `inlineEditing` | `boolean` | `false` | Activer l'édition inline |

## 📊 Configuration des colonnes

### Propriétés de base

```typescript
interface DataTableColumn {
  field: string                    // Nom du champ dans les données
  headerName?: string              // Nom d'affichage (défaut: field)
  dataType?: ColumnDataType        // Type de données
  sortable?: boolean               // Triable (défaut: true)
  filterable?: boolean             // Filtrable (défaut: true)
  width?: number                   // Largeur fixe
  visible?: boolean                // Visible par défaut
  editable?: boolean               // Éditable inline
}
```

### Types de données supportés

- `text` - Texte
- `number` - Nombre
- `date` - Date
- `datetime` - Date et heure
- `boolean` - Booléen
- `select` - Sélection (avec options)
- `email` - Email
- `url` - URL
- `phone` - Téléphone
- `currency` - Devise
- `percentage` - Pourcentage

### Configuration du filtrage

#### Filtre select avec options prédéfinies

```typescript
{
  field: 'status',
  headerName: 'Statut',
  dataType: 'select',
  filterable: true,
  filterConfig: {
    dataType: 'select',
    operator: 'in',
    options: [
      { value: 'EN PREPARATION', label: 'EN PREPARATION' },
      { value: 'EN REALISATION', label: 'EN REALISATION' },
      { value: 'TERMINE', label: 'TERMINE' },
      { value: 'CLOTURE', label: 'CLOTURE' }
    ]
  }
}
```

**Résultat** : Affiche une liste de checkboxes au lieu d'un champ de saisie.

#### Filtre texte

```typescript
{
  field: 'name',
  headerName: 'Nom',
  dataType: 'text',
  filterable: true
  // Pas de filterConfig = filtre texte standard
}
```

#### Filtre nombre

```typescript
{
  field: 'price',
  headerName: 'Prix',
  dataType: 'number',
  filterable: true
}
```

#### Filtre date

```typescript
{
  field: 'created_at',
  headerName: 'Date de création',
  dataType: 'date',
  filterable: true
}
```

### Configuration du tri

Le tri est automatiquement activé si `sortable: true` (par défaut).

```typescript
{
  field: 'name',
  headerName: 'Nom',
  sortable: true  // Activer le tri
}
```

## 🎯 Configuration des actions

```typescript
interface ActionConfig<T> {
  label: string | ((row: T) => string)  // Libellé de l'action
  icon?: Component                       // Icône Vue
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  onClick: (row: T) => void              // Fonction appelée au clic
  show?: (row: T) => boolean             // Condition d'affichage
}
```

### Exemple

```typescript
import IconEdit from '@/components/icon/icon-edit.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import { markRaw } from 'vue'

const actions: ActionConfig[] = [
  {
    label: 'Éditer',
    icon: markRaw(IconEdit),
    color: 'primary',
    onClick: (row) => editRow(row),
    show: (row) => row.status === 'ACTIF'
  },
  {
    label: 'Supprimer',
    icon: markRaw(IconTrash),
    color: 'danger',
    onClick: (row) => deleteRow(row)
  }
]
```

## 📡 Événements

### Pagination

```vue
<DataTable
  @pagination-changed="handlePaginationChanged"
/>
```

```typescript
const handlePaginationChanged = (params: StandardDataTableParams | { page: number; pageSize: number }) => {
  if ('page' in params) {
    // Pagination simple
    console.log('Page:', params.page, 'PageSize:', params.pageSize)
  } else {
    // StandardDataTableParams (avec tri, filtres, etc.)
    console.log('Params:', params)
  }
}
```

### Tri

```vue
<DataTable
  @sort-changed="handleSortChanged"
/>
```

```typescript
const handleSortChanged = (params: StandardDataTableParams | Array<{ field: string; direction: 'asc' | 'desc' }>) => {
  if (Array.isArray(params)) {
    // Tri simple
    console.log('Sort:', params)
  } else {
    // StandardDataTableParams
    console.log('Params:', params)
  }
}
```

### Filtrage

```vue
<DataTable
  @filter-changed="handleFilterChanged"
/>
```

```typescript
const handleFilterChanged = (params: StandardDataTableParams | Record<string, any>) => {
  if ('filters' in params) {
    // StandardDataTableParams
    console.log('Filters:', params.filters)
  } else {
    // Filtres simples
    console.log('Filters:', params)
  }
}
```

### Recherche globale

```vue
<DataTable
  @global-search-changed="handleGlobalSearchChanged"
/>
```

```typescript
const handleGlobalSearchChanged = (params: StandardDataTableParams | string) => {
  if (typeof params === 'string') {
    console.log('Search:', params)
  } else {
    console.log('Search:', params.globalSearch)
  }
}
```

## 🔄 Pagination côté serveur

### Configuration

```vue
<DataTable
  :serverSidePagination="true"
  :currentPageProp="currentPage"
  :pageSizeProp="pageSize"
  :totalItemsProp="totalItems"
  :loading="loading"
  @pagination-changed="handlePaginationChanged"
  @sort-changed="handleSortChanged"
  @filter-changed="handleFilterChanged"
  @global-search-changed="handleGlobalSearchChanged"
/>
```

### Handler complet

```typescript
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

const handlePaginationChanged = async (params: StandardDataTableParams | { page: number; pageSize: number }) => {
  if ('page' in params && 'pageSize' in params) {
    // Convertir en StandardDataTableParams si nécessaire
    const standardParams: StandardDataTableParams = {
      page: params.page,
      pageSize: params.pageSize,
      sort: sortModel.value,
      filters: filterModel.value,
      globalSearch: searchQuery.value
    }
    
    await fetchData(standardParams)
  }
}

const handleSortChanged = async (params: StandardDataTableParams | Array<{ field: string; direction: 'asc' | 'desc' }>) => {
  if (Array.isArray(params)) {
    sortModel.value = params
  } else {
    sortModel.value = params.sort || []
  }
  
  await fetchData({
    page: 1,
    pageSize: pageSize.value,
    sort: sortModel.value,
    filters: filterModel.value,
    globalSearch: searchQuery.value
  })
}

const handleFilterChanged = async (params: StandardDataTableParams | Record<string, any>) => {
  if ('filters' in params) {
    filterModel.value = params.filters || {}
  } else {
    filterModel.value = params
  }
  
  await fetchData({
    page: 1,
    pageSize: pageSize.value,
    sort: sortModel.value,
    filters: filterModel.value,
    globalSearch: searchQuery.value
  })
}

const fetchData = async (params: StandardDataTableParams) => {
  loading.value = true
  try {
    const response = await api.get('/data', { params })
    data.value = response.data.data
    totalItems.value = response.data.total
  } finally {
    loading.value = false
  }
}
```

## 🎨 Exemple complet avec gestion automatique

### Utilisation avec composable

```typescript
// useInventoryManagement.ts
import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'
import { useInventoryStore } from '@/stores/inventory'

export function useInventoryManagement() {
  const inventoryStore = useInventoryStore()
  
  // Configuration des colonnes
  const columns: DataTableColumn[] = [
    {
      field: 'label',
      headerName: 'Libellé',
      sortable: true,
      filterable: true,
      dataType: 'text'
    },
    {
      field: 'status',
      headerName: 'Statut',
      sortable: true,
      filterable: true,
      dataType: 'select',
      filterConfig: {
        dataType: 'select',
        operator: 'in',
        options: [
          { value: 'EN PREPARATION', label: 'EN PREPARATION' },
          { value: 'EN REALISATION', label: 'EN REALISATION' },
          { value: 'TERMINE', label: 'TERMINE' },
          { value: 'CLOTURE', label: 'CLOTURE' }
        ]
      }
    }
  ]
  
  // Actions
  const actions: ActionConfig[] = [
    {
      label: 'Détail',
      onClick: (inv) => router.push({ name: 'inventory-detail', params: { reference: inv.reference } })
    }
  ]
  
  // Utiliser useBackendDataTable pour gérer automatiquement
  const {
    data: inventories,
    loading,
    pagination,
    refresh
  } = useBackendDataTable('', {
    piniaStore: inventoryStore,
    storeId: 'inventory',
    autoLoad: true,
    pageSize: 20
  })
  
  return {
    columns,
    actions,
    inventories,
    loading,
    pagination,
    refresh
  }
}
```

### Dans le template

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="inventories"
    :actions="actions"
    :loading="loading"
    :serverSidePagination="true"
    :currentPageProp="pagination.current_page"
    :pageSizeProp="pagination.page_size"
    :totalItemsProp="pagination.total"
    @pagination-changed="handlePaginationChanged"
    @sort-changed="handleSortChanged"
    @filter-changed="handleFilterChanged"
    @global-search-changed="handleGlobalSearchChanged"
  />
</template>
```

## 🔧 Gestion automatique selon configuration

Le DataTable gère automatiquement :

### ✅ Tri
- **Activation** : Si `sortable: true` sur la colonne
- **Comportement** : Clic sur l'en-tête de colonne
- **Indicateur visuel** : Flèches ↑ ↓

### ✅ Filtrage
- **Activation** : Si `filterable: true` sur la colonne
- **Type de filtre** : Déterminé par `dataType` et `filterConfig`
  - `select` + `filterConfig.options` → Liste de checkboxes
  - `text` → Champ de saisie texte
  - `number` → Champ numérique
  - `date` → Sélecteur de date
  - `boolean` → Sélecteur Oui/Non

### ✅ Pagination
- **Côté client** : Si `serverSidePagination: false`
- **Côté serveur** : Si `serverSidePagination: true` (nécessite handlers)

## 📝 Format StandardDataTableParams

### Format simplifié (utilisé dans les événements)

```typescript
interface StandardDataTableParams {
  page: number
  pageSize: number
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  filters?: Record<string, {
    field: string
    operator: FilterOperator
    dataType: ColumnDataType
    value?: any
    value2?: any
    values?: any[]
  }>
  globalSearch?: string
}
```

### Format backend (DataTables.js)

Le DataTable convertit automatiquement vers le format DataTables.js pour l'API :

```typescript
interface StandardDataTableParams {
  draw: number
  start: number
  length: number
  'search[value]'?: string
  'search[regex]'?: boolean
  'order[0][column]'?: number
  'order[0][dir]'?: 'asc' | 'desc'
  'columns[0][data]'?: string
  'columns[0][search][value]'?: string
  // ... etc
}
```

### Conversion automatique

Utilisez `convertToStandardDataTableParams` pour convertir les paramètres :

```typescript
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

const handleFilterChanged = async (params: StandardDataTableParams | Record<string, any>) => {
  const standardParams = convertToStandardDataTableParams(
    {
      page: 1,
      pageSize: 20,
      filters: 'filters' in params ? params.filters : params,
      sort: sortModel.value,
      globalSearch: searchQuery.value
    },
    {
      columns: columns.value,
      draw: 1,
      customParams: {
        account_id: accountId.value,
        inventory_id: inventoryId.value
      }
    }
  )
  
  await fetchData(standardParams)
}
```

## 🎯 Utilisation simplifiée avec gestion automatique

### Principe

Le DataTable gère automatiquement la pagination, le tri et le filtrage **selon la configuration de chaque colonne** :

- **Tri** : Activé automatiquement si `sortable: true`
- **Filtrage** : Activé automatiquement si `filterable: true`
- **Type de filtre** : Déterminé par `dataType` et `filterConfig`

### Exemple simplifié

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :actions="actions"
    :serverSidePagination="true"
    @pagination-changed="handlePaginationChanged"
    @sort-changed="handleSortChanged"
    @filter-changed="handleFilterChanged"
    @global-search-changed="handleGlobalSearchChanged"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import type { DataTableColumn, ActionConfig, StandardDataTableParams } from '@/types/dataTable'
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// Configuration des colonnes (définit automatiquement tri et filtrage)
const columns: DataTableColumn[] = [
  {
    field: 'name',
    headerName: 'Nom',
    sortable: true,        // ✅ Tri automatique activé
    filterable: true,      // ✅ Filtre texte automatique
    dataType: 'text'
  },
  {
    field: 'status',
    headerName: 'Statut',
    sortable: true,        // ✅ Tri automatique activé
    filterable: true,      // ✅ Filtre select avec checkboxes
    dataType: 'select',
    filterConfig: {
      dataType: 'select',
      operator: 'in',
      options: [
        { value: 'ACTIF', label: 'Actif' },
        { value: 'INACTIF', label: 'Inactif' }
      ]
    }
  },
  {
    field: 'price',
    headerName: 'Prix',
    sortable: true,        // ✅ Tri automatique activé
    filterable: true,      // ✅ Filtre nombre automatique
    dataType: 'number'
  }
]

const data = ref([...])
const actions: ActionConfig[] = [...]

// Handlers simplifiés - le DataTable gère tout automatiquement
const handlePaginationChanged = async (params: StandardDataTableParams | { page: number; pageSize: number }) => {
  const standardParams = convertToStandardDataTableParams(params)
  await fetchData(standardParams)
}

const handleSortChanged = async (params: StandardDataTableParams | Array<{ field: string; direction: 'asc' | 'desc' }>) => {
  const standardParams = convertToStandardDataTableParams(params, {
    page: 1, // Retour à la page 1 lors d'un nouveau tri
    pageSize: pageSize.value
  })
  await fetchData(standardParams)
}

const handleFilterChanged = async (params: StandardDataTableParams | Record<string, any>) => {
  const standardParams = convertToStandardDataTableParams(params, {
    page: 1, // Retour à la page 1 lors d'un nouveau filtre
    pageSize: pageSize.value
  })
  await fetchData(standardParams)
}

const handleGlobalSearchChanged = async (params: StandardDataTableParams | string) => {
  const standardParams = convertToStandardDataTableParams(params, {
    page: 1, // Retour à la page 1 lors d'une nouvelle recherche
    pageSize: pageSize.value
  })
  await fetchData(standardParams)
}

const fetchData = async (params: StandardDataTableParams) => {
  // Appel API avec les paramètres standardisés
  const response = await api.get('/data', { params })
  data.value = response.data.data
  totalItems.value = response.data.total
}
</script>
```

### Fonction utilitaire pour simplifier

```typescript
// utils/dataTableHelpers.ts
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

/**
 * Crée un handler générique pour les événements DataTable
 */
export function createDataTableHandler(
  fetchFunction: (params: StandardDataTableParams) => Promise<void>,
  options?: {
    resetPage?: boolean  // Réinitialiser à la page 1 (défaut: true)
    pageSize?: number
  }
) {
  const { resetPage = true, pageSize = 20 } = options || {}
  
  return async (params: any) => {
    const standardParams = convertToStandardDataTableParams(params, {
      page: resetPage ? 1 : undefined,
      pageSize
    })
    await fetchFunction(standardParams)
  }
}

// Utilisation
const handlePaginationChanged = createDataTableHandler(fetchData, { resetPage: false })
const handleSortChanged = createDataTableHandler(fetchData, { resetPage: true })
const handleFilterChanged = createDataTableHandler(fetchData, { resetPage: true })
const handleGlobalSearchChanged = createDataTableHandler(fetchData, { resetPage: true })
```

## 🎯 Bonnes pratiques

### 1. Configuration des colonnes

```typescript
// ✅ BON : Configuration complète
const columns: DataTableColumn[] = [
  {
    field: 'status',
    headerName: 'Statut',
    dataType: 'select',
    sortable: true,
    filterable: true,
    filterConfig: {
      dataType: 'select',
      operator: 'in',
      options: [
        { value: 'ACTIF', label: 'Actif' },
        { value: 'INACTIF', label: 'Inactif' }
      ]
    }
  }
]

// ❌ MAUVAIS : Configuration incomplète
const columns = [
  { field: 'status' } // Manque dataType et filterConfig
]
```

### 2. Gestion des événements

```typescript
// ✅ BON : Utiliser StandardDataTableParams
const handleFilterChanged = async (params: StandardDataTableParams | Record<string, any>) => {
  const standardParams: StandardDataTableParams = {
    page: 1,
    pageSize: pageSize.value,
    sort: sortModel.value,
    filters: 'filters' in params ? params.filters : params,
    globalSearch: searchQuery.value
  }
  await fetchData(standardParams)
}

// ❌ MAUVAIS : Ignorer les autres paramètres
const handleFilterChanged = async (filters: Record<string, any>) => {
  await fetchData({ filters }) // Manque page, sort, etc.
}
```

### 3. Pagination côté serveur

```typescript
// ✅ BON : Toujours réinitialiser à la page 1 lors d'un filtre/tri
const handleFilterChanged = async (params) => {
  currentPage.value = 1 // Important !
  await fetchData({ ...params, page: 1 })
}

// ❌ MAUVAIS : Oublier de réinitialiser la page
const handleFilterChanged = async (params) => {
  await fetchData(params) // Reste sur la page actuelle
}
```

## 🐛 Dépannage

### Le filtre select n'affiche pas les checkboxes

**Problème** : Le filtre affiche un champ de saisie au lieu de checkboxes.

**Solution** : Vérifier que :
1. `dataType: 'select'` est défini
2. `filterConfig.options` est présent avec des options
3. Le fichier utilisé est `src/components/DataTable/filters/FilterDropdown.vue` (pas `FilterDropdown.vue` à la racine)

### Le bouton "Appliquer" reste désactivé

**Problème** : Après sélection de valeurs, le bouton reste grisé.

**Solution** : Vérifier que `toggleSelectValue` crée un nouveau Set pour forcer la réactivité Vue.

### La pagination ne fonctionne pas

**Problème** : Les données ne changent pas lors du changement de page.

**Solution** : 
- Vérifier que `serverSidePagination` est correctement configuré
- Vérifier que les handlers d'événements sont bien connectés
- Vérifier que `totalItemsProp` est mis à jour

## 📚 Ressources

- Types : `src/types/dataTable.ts`
- Composables : `src/components/DataTable/composables/`
- Utilitaires : `src/components/DataTable/utils/`

