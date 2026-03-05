# 📊 Documentation Complète - DataTable

Guide détaillé pour utiliser le composant DataTable de `@SMATCH-Digital-dev/vue-system-design`.

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Utilisation de Base](#utilisation-de-base)
4. [Props Détaillées](#props-détaillées)
5. [Configuration des Colonnes](#configuration-des-colonnes)
6. [Événements](#événements)
7. [QueryModel](#querymodel)
8. [Pagination](#pagination)
9. [Tri](#tri)
10. [Filtrage](#filtrage)
11. [Recherche Globale](#recherche-globale)
12. [Sélection Multiple](#sélection-multiple)
13. [Actions](#actions)
14. [Export de Données](#export-de-données)
15. [Édition Inline](#édition-inline)
16. [Groupement de Lignes](#groupement-de-lignes)
17. [Master/Detail](#masterdetail)
18. [Colonnes Épinglées](#colonnes-épinglées)
19. [Virtual Scrolling](#virtual-scrolling)
20. [API Server-Side](#api-server-side)
21. [Persistance](#persistance)
22. [Types TypeScript](#types-typescript)
23. [Architecture – Ordre d'initialisation](#architecture--ordre-dinitialisation-des-composables)
24. [API interne (usage avancé)](#api-interne-usage-avancé)
25. [Exemples Complets](#exemples-complets)
26. [Dépannage](#dépannage)

---

## 🎯 Introduction

Le DataTable est un composant de table de données avancé pour Vue 3, conçu pour gérer de grandes quantités de données avec des fonctionnalités complètes :

- ✅ Pagination (client et serveur)
- ✅ Tri multi-colonnes
- ✅ Filtrage avancé par colonne
- ✅ Recherche globale
- ✅ Sélection multiple
- ✅ Export (CSV, Excel, PDF)
- ✅ Édition inline
- ✅ Groupement de lignes
- ✅ Master/Detail
- ✅ Colonnes épinglées
- ✅ Virtual scrolling
- ✅ Persistance dans localStorage

---

## 📦 Installation

```bash
npm install @SMATCH-Digital-dev/vue-system-design
```

```typescript
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import '@SMATCH-Digital-dev/vue-system-design/styles'
```

---

## 🚀 Utilisation de Base

### Exemple Minimal

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const columns = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Nom' },
  { field: 'email', headerName: 'Email' }
]

const data = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
])
</script>
```

### Exemple avec Server-Side

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
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'

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
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryModel)
    })
    const result = await response.json()
    
    data.value = result.data
    currentPage.value = result.page
    totalPages.value = result.totalPages
    totalItems.value = result.total
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 📋 Props Détaillées

### Props Principales

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `columns` | `DataTableColumn[]` | **requis** | Définition des colonnes de la table |
| `rowDataProp` | `any[]` | `[]` | Données à afficher dans la table |
| `loading` | `boolean` | `false` | État de chargement (affiche un skeleton) |
| `pagination` | `boolean` | `true` | Activer/désactiver la pagination |
| `enableFiltering` | `boolean` | `true` | Activer le filtrage par colonne |
| `enableGlobalSearch` | `boolean` | `true` | Activer la recherche globale |
| `rowSelection` | `boolean` | `false` | Activer la sélection multiple |
| `inlineEditing` | `boolean` | `false` | Activer l'édition inline |
| `storageKey` | `string` | `'datatable'` | Clé pour la persistance localStorage |

### Props de Pagination

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `currentPageProp` | `number` | `1` | Page actuelle (server-side) |
| `totalPagesProp` | `number` | `1` | Nombre total de pages (server-side) |
| `totalItemsProp` | `number` | `0` | Nombre total d'éléments (server-side) |
| `pageSizeProp` | `number` | `20` | Taille de page par défaut |

### Props Avancées

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `actions` | `ActionConfig[]` | `[]` | Actions disponibles sur chaque ligne |
| `showColumnSelector` | `boolean` | `true` | Afficher le sélecteur de colonnes |
| `enableGrouping` | `boolean` | `false` | Activer le groupement de lignes |
| `enableMasterDetail` | `boolean` | `false` | Activer le mode master/detail |
| `enableColumnPinning` | `boolean` | `false` | Activer l'épinglage de colonnes |
| `enableVirtualScrolling` | `boolean` | `false` | Activer le virtual scrolling |
| `mode` | `'querymodel' \| 'datatable' \| 'rest' \| 'custom'` | `'querymodel'` | Mode de fonctionnement |
| `apiConfig` | `ApiConfig` | `undefined` | Configuration pour chargement automatique |

### Props d'État

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `forbidden` | `boolean` | `false` | Afficher l'état "accès interdit" |
| `emptyStateConfig` | `EmptyStateConfig` | `undefined` | Configuration de l'état vide personnalisé |
| `forbiddenStateConfig` | `ForbiddenStateConfig` | `undefined` | Configuration de l'état "interdit" personnalisé |

---

## ⚙️ Configuration des Colonnes

### Interface DataTableColumn

```typescript
interface DataTableColumn<T = Record<string, unknown>> {
  // Obligatoire
  field: string                    // Nom du champ dans les données
  headerName: string               // Libellé affiché dans l'en-tête
  
  // Tri et Filtrage
  sortable?: boolean               // Activer le tri (défaut: false)
  filterable?: boolean             // Activer le filtre (défaut: false)
  
  // Dimensions
  width?: number                   // Largeur fixe en pixels
  minWidth?: number                // Largeur minimale
  maxWidth?: number                // Largeur maximale
  flex?: number                    // Facteur de flexibilité (pour largeur automatique)
  
  // Visibilité
  hide?: boolean                   // Masquer complètement la colonne
  visible?: boolean                 // Visibilité de la colonne (peut être changée par l'utilisateur)
  
  // Positionnement
  pinned?: 'left' | 'right'        // Épingler la colonne à gauche ou droite
  
  // Formatage
  valueFormatter?: (params: {
    value: any
    data: T
    rowIndex: number
    column: DataTableColumn<T>
  }) => string                     // Formatter la valeur affichée
  
  // Rendu personnalisé
  cellRenderer?: string | Component // Renderer personnalisé pour la cellule
  cellRendererParams?: Record<string, any> // Paramètres pour le renderer
  
  // Type de données
  dataType?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect'
  
  // Validation (pour édition inline)
  editable?: boolean                // Colonne éditable
  validationRules?: ValidationRule[] // Règles de validation
  
  // Autres
  headerTooltip?: string           // Tooltip pour l'en-tête
  cellClass?: string | ((params: any) => string) // Classes CSS pour la cellule
  headerClass?: string             // Classes CSS pour l'en-tête
}
```

### Exemples de Colonnes

```typescript
const columns = [
  // Colonne simple
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    sortable: true
  },
  
  // Colonne avec flex
  {
    field: 'name',
    headerName: 'Nom',
    flex: 1,
    sortable: true,
    filterable: true
  },
  
  // Colonne avec formatter
  {
    field: 'price',
    headerName: 'Prix',
    sortable: true,
    valueFormatter: ({ value }) => `${value} €`
  },
  
  // Colonne avec renderer personnalisé
  {
    field: 'status',
    headerName: 'Statut',
    cellRenderer: 'badge',
    cellRendererParams: {
      colorMap: {
        active: 'green',
        inactive: 'gray',
        pending: 'yellow'
      }
    }
  },
  
  // Colonne épinglée
  {
    field: 'actions',
    headerName: 'Actions',
    pinned: 'right',
    width: 150,
    sortable: false,
    filterable: false
  },
  
  // Colonne avec type de données
  {
    field: 'createdAt',
    headerName: 'Date de création',
    dataType: 'date',
    sortable: true,
    filterable: true,
    valueFormatter: ({ value }) => {
      return new Date(value).toLocaleDateString('fr-FR')
    }
  }
]
```

---

## 🎯 Événements

### @query-model-changed

Événement principal émis pour tous les changements (pagination, tri, filtres, recherche).

```vue
<template>
  <DataTable
    @query-model-changed="handleQueryChange"
  />
</template>

<script setup lang="ts">
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'

const handleQueryChange = (queryModel: QueryModel) => {
  console.log('Page:', queryModel.page)
  console.log('PageSize:', queryModel.pageSize)
  console.log('Sort:', queryModel.sort)
  console.log('Filters:', queryModel.filters)
  console.log('Search:', queryModel.search)
  
  // Appel API avec queryModel
  fetchData(queryModel)
}
</script>
```

### Événements Spécifiques

```vue
<template>
  <DataTable
    @pagination-changed="handlePagination"
    @sort-changed="handleSort"
    @filter-changed="handleFilter"
    @global-search-changed="handleSearch"
    @selection-changed="handleSelection"
    @row-clicked="handleRowClick"
    @cell-value-changed="handleCellEdit"
    @export-csv="handleExportCsv"
    @export-spreadsheet="handleExportExcel"
    @export-pdf="handleExportPdf"
  />
</template>
```

### Liste Complète des Événements

| Événement | Paramètres | Description |
|-----------|------------|-------------|
| `query-model-changed` | `QueryModel` | Émis pour tous les changements |
| `pagination-changed` | `QueryModel` | Changement de page ou taille |
| `sort-changed` | `QueryModel` | Changement de tri |
| `filter-changed` | `QueryModel` | Changement de filtres |
| `global-search-changed` | `QueryModel` | Changement de recherche globale |
| `selection-changed` | `Set<string>` | Changement de sélection |
| `row-clicked` | `Record<string, unknown>` | Clic sur une ligne |
| `cell-value-changed` | `{ rowId, field, value, oldValue }` | Modification d'une cellule |
| `export-csv` | - | Export CSV déclenché |
| `export-spreadsheet` | - | Export Excel déclenché |
| `export-pdf` | - | Export PDF déclenché |

---

## 📊 QueryModel

Le QueryModel est le format unifié utilisé pour toutes les communications avec le serveur.

### Structure

```typescript
interface QueryModel {
  page: number                      // Page actuelle (commence à 1)
  pageSize: number                  // Taille de page
  sort?: Array<{                    // Tri (optionnel)
    colId: string                   // ID de la colonne
    sort: 'asc' | 'desc'           // Direction du tri
  }>
  filters?: Record<string, FilterModel> // Filtres par colonne
  search?: string                   // Recherche globale
  customParams?: Record<string, any> // Paramètres personnalisés
}
```

### Exemple de QueryModel

```typescript
{
  page: 2,
  pageSize: 50,
  sort: [
    { colId: 'name', sort: 'asc' },
    { colId: 'createdAt', sort: 'desc' }
  ],
  filters: {
    status: {
      operator: 'equals',
      value: 'active'
    },
    price: {
      operator: 'greater_than',
      value: 100
    }
  },
  search: 'john',
  customParams: {
    category: 'electronics'
  }
}
```

### Conversion en Paramètres GET

Le QueryModel peut être converti en paramètres GET pour les APIs REST :

```typescript
function queryModelToParams(queryModel: QueryModel): string {
  const params = new URLSearchParams()
  
  params.append('page', queryModel.page.toString())
  params.append('pageSize', queryModel.pageSize.toString())
  
  if (queryModel.sort) {
    params.append('sort', JSON.stringify(queryModel.sort))
  }
  
  if (queryModel.filters) {
    params.append('filters', JSON.stringify(queryModel.filters))
  }
  
  if (queryModel.search) {
    params.append('search', queryModel.search)
  }
  
  return params.toString()
}
```

---

## 📄 Pagination

### Pagination Client-Side

Par défaut, la pagination est gérée côté client si `rowDataProp` contient toutes les données :

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="allData"
    :pagination="true"
    :pageSizeProp="20"
  />
</template>
```

### Pagination Server-Side

Pour la pagination serveur, utilisez les props et l'événement `@query-model-changed` :

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
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'

const data = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const pageSize = ref(20)

const handleQueryChange = async (queryModel: QueryModel) => {
  loading.value = true
  try {
    const response = await fetchData(queryModel)
    data.value = response.data
    currentPage.value = response.page
    totalPages.value = response.totalPages
    totalItems.value = response.total
  } finally {
    loading.value = false
  }
}
</script>
```

### Tailles de Page Personnalisées

```vue
<template>
  <DataTable
    :pageSizeProp="50"
    :pageSizeOptions="[10, 20, 50, 100]"
  />
</template>
```

---

## 🔄 Tri

### Tri Simple

Cliquez sur l'en-tête de colonne pour trier. Le tri alterne entre : aucun → asc → desc → aucun.

```typescript
const columns = [
  { field: 'name', headerName: 'Nom', sortable: true }
]
```

### Tri Multi-Colonnes

Activez le tri multi-colonnes :

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :enableMultiSort="true"
  />
</template>
```

Maintenez `Ctrl` (ou `Cmd` sur Mac) et cliquez sur plusieurs colonnes pour ajouter des tris supplémentaires.

### Tri Initial

```typescript
const columns = [
  {
    field: 'name',
    headerName: 'Nom',
    sortable: true,
    initialSort: 'asc' // Tri initial
  }
]
```

### Gérer le Tri

```vue
<template>
  <DataTable
    @sort-changed="handleSort"
  />
</template>

<script setup lang="ts">
const handleSort = (queryModel: QueryModel) => {
  console.log('Tri actuel:', queryModel.sort)
  // queryModel.sort = [
  //   { colId: 'name', sort: 'asc' },
  //   { colId: 'createdAt', sort: 'desc' }
  // ]
}
</script>
```

---

## 🔍 Filtrage

### Filtres par Colonne

Activez les filtres sur une colonne :

```typescript
const columns = [
  {
    field: 'name',
    headerName: 'Nom',
    filterable: true
  }
]
```

### Opérateurs de Filtre

| Opérateur | Description | Exemple |
|-----------|-------------|---------|
| `equals` | Égal à | `value === 'test'` |
| `not_equals` | Différent de | `value !== 'test'` |
| `contains` | Contient | `value.includes('test')` |
| `not_contains` | Ne contient pas | `!value.includes('test')` |
| `starts_with` | Commence par | `value.startsWith('test')` |
| `ends_with` | Se termine par | `value.endsWith('test')` |
| `greater_than` | Supérieur à | `value > 100` |
| `less_than` | Inférieur à | `value < 100` |
| `greater_equal` | Supérieur ou égal | `value >= 100` |
| `less_equal` | Inférieur ou égal | `value <= 100` |
| `between` | Entre deux valeurs | `value >= min && value <= max` |
| `in` | Dans la liste | `['a', 'b', 'c'].includes(value)` |
| `not_in` | Pas dans la liste | `!['a', 'b', 'c'].includes(value)` |
| `is_null` | Est null | `value === null` |
| `is_not_null` | N'est pas null | `value !== null` |
| `is_empty` | Est vide | `value === ''` |
| `is_not_empty` | N'est pas vide | `value !== ''` |
| `regex` | Expression régulière | `/pattern/.test(value)` |

### Filtres Avancés

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :enableFiltering="true"
    :enableSetFilters="true"
    @filter-changed="handleFilter"
  />
</template>

<script setup lang="ts">
const handleFilter = (queryModel: QueryModel) => {
  console.log('Filtres actifs:', queryModel.filters)
  // queryModel.filters = {
  //   name: {
  //     operator: 'contains',
  //     value: 'john'
  //   },
  //   status: {
  //     operator: 'in',
  //     value: ['active', 'pending']
  //   }
  // }
}
</script>
```

### Filtres par Type de Données

Le DataTable adapte automatiquement les opérateurs selon le type de données :

- **Text** : `contains`, `equals`, `starts_with`, `ends_with`, etc.
- **Number** : `equals`, `greater_than`, `less_than`, `between`, etc.
- **Date** : `equals`, `greater_than`, `less_than`, `between`
- **Boolean** : `equals`
- **Select** : `equals`, `in`, `not_in`

---

## 🔎 Recherche Globale

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :enableGlobalSearch="true"
    @global-search-changed="handleSearch"
  />
</template>
```

### Utilisation

La recherche globale recherche dans toutes les colonnes `filterable: true`. Elle émet un `QueryModel` avec le champ `search`.

```typescript
const handleSearch = (queryModel: QueryModel) => {
  console.log('Recherche:', queryModel.search)
  // Appel API avec recherche
  fetchData(queryModel)
}
```

### Personnalisation

```vue
<template>
  <DataTable
    :globalSearchPlaceholder="'Rechercher dans toutes les colonnes...'"
    :globalSearchDebounce="300"
  />
</template>
```

---

## ☑️ Sélection Multiple

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :rowSelection="true"
    @selection-changed="handleSelection"
  />
</template>

<script setup lang="ts">
const handleSelection = (selectedRows: Set<string>) => {
  console.log('Lignes sélectionnées:', Array.from(selectedRows))
  // selectedRows = Set(['row-1', 'row-2', 'row-3'])
}
</script>
```

### Actions sur Sélection

```vue
<template>
  <div>
    <DataTable
      :columns="columns"
      :rowDataProp="data"
      :rowSelection="true"
      @selection-changed="selectedRows = $event"
    />
    
    <div v-if="selectedRows.size > 0" class="mt-4">
      <Button @click="handleBulkDelete">
        Supprimer {{ selectedRows.size }} élément(s)
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DataTable, Button } from '@SMATCH-Digital-dev/vue-system-design'

const selectedRows = ref<Set<string>>(new Set())

const handleBulkDelete = () => {
  // Supprimer les lignes sélectionnées
  console.log('Suppression de:', Array.from(selectedRows.value))
}
</script>
```

### Sélection par Page

Par défaut, la sélection est limitée à la page actuelle. Pour sélectionner toutes les pages :

```vue
<template>
  <DataTable
    :rowSelection="true"
    :selectAllPages="true"
  />
</template>
```

---

## 🎬 Actions

### Configuration des Actions

```typescript
interface ActionConfig<T = Record<string, unknown>> {
  label: string                    // Libellé de l'action
  icon?: string                    // Nom de l'icône
  variant?: 'primary' | 'secondary' | 'danger' | 'warning'
  onClick: (row: T) => void        // Fonction appelée au clic
  visible?: (row: T) => boolean    // Condition de visibilité
  disabled?: (row: T) => boolean   // Condition de désactivation
}
```

### Exemple

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :actions="actions"
  />
</template>

<script setup lang="ts">
const actions = [
  {
    label: 'Voir',
    icon: 'eye',
    variant: 'primary',
    onClick: (row) => {
      console.log('Voir:', row)
      // Navigation vers la page de détail
    }
  },
  {
    label: 'Éditer',
    icon: 'edit',
    variant: 'secondary',
    onClick: (row) => {
      console.log('Éditer:', row)
      // Ouvrir le formulaire d'édition
    }
  },
  {
    label: 'Supprimer',
    icon: 'trash',
    variant: 'danger',
    onClick: (row) => {
      if (confirm('Êtes-vous sûr ?')) {
        deleteRow(row.id)
      }
    },
    visible: (row) => row.status !== 'deleted'
  }
]
</script>
```

### Actions Conditionnelles

```typescript
const actions = [
  {
    label: 'Activer',
    icon: 'check',
    variant: 'success',
    visible: (row) => row.status === 'inactive',
    onClick: (row) => activateRow(row.id)
  },
  {
    label: 'Désactiver',
    icon: 'x',
    variant: 'warning',
    visible: (row) => row.status === 'active',
    onClick: (row) => deactivateRow(row.id)
  }
]
```

---

## 📤 Export de Données

### Export CSV

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    @export-csv="handleExportCsv"
  />
</template>

<script setup lang="ts">
const handleExportCsv = () => {
  // L'export est géré automatiquement par le DataTable
  // Vous pouvez personnaliser le comportement si nécessaire
  console.log('Export CSV déclenché')
}
</script>
```

### Export Excel

```vue
<template>
  <DataTable
    @export-spreadsheet="handleExportExcel"
  />
</template>
```

### Export PDF

```vue
<template>
  <DataTable
    @export-pdf="handleExportPdf"
  />
</template>
```

### Export de la Sélection

```vue
<template>
  <DataTable
    :rowSelection="true"
    @export-selected-csv="handleExportSelectedCsv"
    @export-selected-spreadsheet="handleExportSelectedExcel"
  />
</template>
```

### Personnalisation

```vue
<template>
  <DataTable
    :exportTitle="'Rapport Utilisateurs'"
    :exportFileName="'users-report'"
  />
</template>
```

---

## ✏️ Édition Inline

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :inlineEditing="true"
    @cell-value-changed="handleCellEdit"
  />
</template>

<script setup lang="ts">
const handleCellEdit = (event: {
  rowId: string | number
  field: string
  value: any
  oldValue: any
}) => {
  console.log('Cellule modifiée:', event)
  // Sauvegarder la modification
  saveCellValue(event.rowId, event.field, event.value)
}
</script>
```

### Colonnes Éditables

```typescript
const columns = [
  {
    field: 'name',
    headerName: 'Nom',
    editable: true,  // Colonne éditable
    validationRules: [
      {
        validator: (value: string) => value.length >= 3,
        message: 'Le nom doit contenir au moins 3 caractères'
      }
    ]
  },
  {
    field: 'email',
    headerName: 'Email',
    editable: true,
    validationRules: [
      {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Email invalide'
      }
    ]
  },
  {
    field: 'id',
    headerName: 'ID',
    editable: false  // Colonne non éditable
  }
]
```

### Navigation Clavier

Lorsque l'édition inline est activée :

- **Tab** : Sauvegarde et passe à la cellule suivante
- **Shift+Tab** : Sauvegarde et passe à la cellule précédente
- **Enter** : Sauvegarde la cellule actuelle
- **Escape** : Annule l'édition et restaure la valeur originale

### Édition en Lot

```vue
<template>
  <DataTable
    :inlineEditing="true"
    :enableAdvancedEditing="true"
  />
</template>
```

Le mode avancé permet de modifier plusieurs cellules avant de sauvegarder toutes les modifications en une fois.

---

## 📊 Groupement de Lignes

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :enableGrouping="true"
    :groupBy="['category', 'status']"
  />
</template>
```

### Configuration

```typescript
const columns = [
  {
    field: 'category',
    headerName: 'Catégorie',
    enableRowGroup: true  // Permettre le groupement par cette colonne
  },
  {
    field: 'status',
    headerName: 'Statut',
    enableRowGroup: true
  }
]
```

### Fonctions d'Agrégation

```typescript
const columns = [
  {
    field: 'price',
    headerName: 'Prix',
    aggFunc: 'sum'  // Somme pour les groupes
    // Autres fonctions : 'avg', 'min', 'max', 'count'
  }
]
```

---

## 🔗 Master/Detail

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :enableMasterDetail="true"
    @detail-toggle="handleDetailToggle"
  />
</template>

<script setup lang="ts">
const handleDetailToggle = (rowId: string | number) => {
  console.log('Détail togglé pour:', rowId)
  // Charger les détails si nécessaire
}
</script>
```

### Configuration du Detail

```vue
<template>
  <DataTable
    :enableMasterDetail="true"
    :detailRowHeight="200"
    :detailComponent="DetailComponent"
  />
</template>

<script setup lang="ts">
import DetailComponent from './DetailComponent.vue'
</script>
```

---

## 📌 Colonnes Épinglées

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :enableColumnPinning="true"
  />
</template>
```

### Configuration

```typescript
const columns = [
  {
    field: 'id',
    headerName: 'ID',
    pinned: 'left'  // Épingler à gauche
  },
  {
    field: 'actions',
    headerName: 'Actions',
    pinned: 'right'  // Épingler à droite
  }
]
```

Les colonnes épinglées restent visibles lors du défilement horizontal.

---

## 🎯 Virtual Scrolling

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :enableVirtualScrolling="true"
    :virtualScrollingConfig="{
      itemHeight: 50,
      overscan: 5
    }"
  />
</template>
```

Le virtual scrolling améliore les performances pour les grandes listes en ne rendant que les lignes visibles.

### Seuil configurable

Le seuil d'activation (défaut : 2000 lignes) est configurable via la prop dédiée ou la config :

```vue
<DataTable
  :virtualScrollingThreshold="1000"
  :enableVirtualScrolling="true"
/>

<!-- Ou via virtualScrollingConfig -->
<DataTable
  :virtualScrollingConfig="{ threshold: 1000, overscan: 20 }"
  :enableVirtualScrolling="true"
/>
```

### Limites et contraintes

| Limitation | Détail |
|------------|--------|
| **Hauteur fixe** | Par défaut les lignes ont une hauteur fixe (`itemHeight`, 60px). Une option `getRowHeight` permet un support limité des hauteurs variables (voir ci‑dessous). |
| **Virtualisation horizontale** | Non implémentée. Toutes les colonnes sont rendues. Une piste d’évolution est documentée ci‑dessous. |
| **Seuil minimum** | Le virtual scrolling s'active uniquement lorsque le nombre de lignes dépasse le seuil (défaut 2000). En dessous, toutes les lignes sont rendues normalement. |

### Lignes de hauteur variable (8.3)

Lorsque le virtual scrolling est utilisé avec un grand nombre de lignes, une option **`getRowHeight`** peut être fournie pour des hauteurs par ligne :

- **Sans `getRowHeight`** : comportement actuel (hauteur fixe `itemHeight`).
- **Avec `getRowHeight(index: number) => number`** : la hauteur totale et les spacers sont calculés à partir des hauteurs renvoyées (cache ou mesure). Les indices visibles sont dérivés du scroll en sommant ces hauteurs.

Contraintes : `getRowHeight` doit être une fonction synchrone et stable (idéalement dérivée d’un cache de hauteurs mesurées). Les hauteurs dynamiques non connues à l’avance (ex. contenu asynchrone) peuvent nécessiter un recalcul après mesure.

Exemple d'utilisation de `getRowHeight` via `virtualScrollingConfig` :

```vue
<DataTable
  :data="data"
  :columns="columns"
  :enableVirtualScrolling="true"
  :virtualScrollingConfig="{
    threshold: 500,
    getRowHeight: (index) => rowHeightCache[index] ?? 60
  }"
/>
```

Où `rowHeightCache` est un tableau ou une Map remplie par mesure (ex. ResizeObserver) ou par règle métier.

### Virtualisation horizontale des colonnes (8.2 – envisagée)

Une évolution possible pour les tableaux à nombreuses colonnes :

- **Principe** : ne rendre que les colonnes dont la zone intersecte le viewport horizontal (`scrollLeft`, `clientWidth`), avec un overscan, et des colonnes « spacer » avant/après pour garder le défilement correct.
- **Compatibilité** : les colonnes épinglées (pinning) resteraient toujours rendues ; la virtualisation ne s’appliquerait qu’aux colonnes non épinglées.
- **Prérequis** : largeurs de colonnes connues (ex. `getColumnWidth(col)` existant), et propagation de `scrollLeft` depuis le conteneur (ex. via `useTableBodyScroll` ou équivalent).
- **Implémentation envisagée** : un composable dédié (ex. `useHorizontalColumnVirtualization`) calculant `startColIndex`, `endColIndex`, `spacerBeforeWidth`, `spacerAfterWidth` à partir de `scrollLeft`, `containerWidth` et des largeurs de colonnes ; TableBody utiliserait une liste `visibleColumns` dérivée de ce range au lieu de `responsiveColumns` pour le rendu des cellules (thead + tbody).

---

## 🌐 API Server-Side

### Configuration Automatique

```vue
<template>
  <DataTable
    :columns="columns"
    :apiConfig="{
      endpoint: '/api/users',
      format: 'rest',
      method: 'POST',
      autoLoad: true
    }"
  />
</template>
```

### Format REST API

Le serveur doit retourner :

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

### Format DataTable

```json
{
  "recordsTotal": 100,
  "recordsFiltered": 50,
  "data": [...]
}
```

### Transformation Personnalisée

```vue
<template>
  <DataTable
    :apiConfig="{
      endpoint: '/api/users',
      transformParams: (queryModel) => {
        // Transformer les paramètres avant l'envoi
        return {
          page: queryModel.page,
          limit: queryModel.pageSize,
          sort: queryModel.sort,
          // ...
        }
      },
      transformResponse: (response) => {
        // Transformer la réponse
        return {
          data: response.items,
          total: response.count,
          page: response.currentPage,
          pageSize: response.limit,
          totalPages: Math.ceil(response.count / response.limit)
        }
      }
    }"
  />
</template>
```

---

## 💾 Persistance

### Activation

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    storageKey="my-table"
  />
</template>
```

La persistance sauvegarde automatiquement dans `localStorage` :
- Colonnes visibles
- Largeurs de colonnes
- Filtres actifs
- Tri actif
- Taille de page
- Page actuelle

### Désactiver la Persistance

```vue
<template>
  <DataTable
    :storageKey="undefined"
  />
</template>
```

---

## 📝 Types TypeScript

### Imports

```typescript
import type {
  DataTableColumn,
  DataTableProps,
  ActionConfig,
  QueryModel,
  FilterModel,
  DataTableInstance
} from '@SMATCH-Digital-dev/vue-system-design'
```

### Exemple avec Types

```typescript
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import type { DataTableColumn, QueryModel } from '@SMATCH-Digital-dev/vue-system-design'

const columns: DataTableColumn[] = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Nom' }
]

const handleQueryChange = (queryModel: QueryModel) => {
  // TypeScript connaît la structure de QueryModel
  console.log(queryModel.page)
  console.log(queryModel.sort)
}
```

---

## 💡 Exemples Complets

### Exemple 1 : Table Simple

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="users"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const columns = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Nom', flex: 1 },
  { field: 'email', headerName: 'Email', flex: 1 }
]

const users = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
])
</script>
```

### Exemple 2 : Table avec API

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
import { ref, onMounted } from 'vue'
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'
import axios from 'axios'

const columns = [
  { field: 'id', headerName: 'ID', sortable: true, width: 80 },
  { field: 'name', headerName: 'Nom', sortable: true, filterable: true, flex: 1 },
  { field: 'email', headerName: 'Email', filterable: true, flex: 1 },
  { field: 'status', headerName: 'Statut', sortable: true, filterable: true }
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
    const response = await axios.post('/api/users', queryModel)
    data.value = response.data.data
    currentPage.value = response.data.page
    totalPages.value = response.data.totalPages
    totalItems.value = response.data.total
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Charger les données initiales
  handleQueryChange({
    page: 1,
    pageSize: 20
  })
})
</script>
```

### Exemple 3 : Table avec Actions et Sélection

```vue
<template>
  <div>
    <div v-if="selectedRows.size > 0" class="mb-4 p-4 bg-blue-50 rounded">
      <p>{{ selectedRows.size }} élément(s) sélectionné(s)</p>
      <Button @click="handleBulkDelete" variant="danger">
        Supprimer la sélection
      </Button>
    </div>
    
    <DataTable
      :columns="columns"
      :rowDataProp="data"
      :actions="actions"
      :rowSelection="true"
      @selection-changed="selectedRows = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DataTable, Button } from '@SMATCH-Digital-dev/vue-system-design'

const selectedRows = ref<Set<string>>(new Set())

const actions = [
  {
    label: 'Voir',
    icon: 'eye',
    onClick: (row) => viewRow(row.id)
  },
  {
    label: 'Éditer',
    icon: 'edit',
    onClick: (row) => editRow(row.id)
  },
  {
    label: 'Supprimer',
    icon: 'trash',
    variant: 'danger',
    onClick: (row) => deleteRow(row.id)
  }
]

const handleBulkDelete = () => {
  if (confirm(`Supprimer ${selectedRows.value.size} élément(s) ?`)) {
    // Supprimer les éléments sélectionnés
    Array.from(selectedRows.value).forEach(id => {
      deleteRow(id)
    })
    selectedRows.value.clear()
  }
}
</script>
```

---

## 🏗️ Architecture – Ordre d'initialisation des composables

L'ordre d'appel des composables dans `useDataTableComponent` est important pour éviter les erreurs "Cannot access before initialization".

```
1. safeProps, modes (useDataTableModes)
2. tableConfig (useDataTableConfig) – si storageKey
3. useDataTableComponentConfig → effectiveProps, effectiveServerSide*
4. dataTableComposable (useDataTable)
5. useDataTableServerSide – si server-side
6. useDataTableComponentApi → apiData – si apiConfig (sync internalRefs, queryModel)
7. useDataTableColumns, useDataTableFeatures
8. grouping, pivot, masterDetail, editing – selon config
```

**Sous-modules extraits :**
- `useDataTableComponentConfig` – résolution des props effectives (server-side)
- `useDataTableComponentApi` – configuration API + synchronisation pagination
- `useDataTableConfigRestore` – restauration depuis localStorage

Les refs internes (`_internalRefs`) sont exposées par `useDataTable` pour permettre à `useDataTableApi` de synchroniser la pagination (effectiveCurrentPage, effectiveTotalItems, etc.) avec les données chargées côté serveur.

---

## 🔧 API interne (usage avancé)

| Propriété | Où | Usage |
|-----------|-----|-------|
| `_internalRefs` | Retour de `useDataTable` | Refs internes pour synchronisation pagination avec l'API. **Ne pas utiliser** en dehors du DataTable. En lecture, préférer `effectiveCurrentPage`, `effectivePageSize`, etc. |
| `changePageSize.__updateHandler` | `dataTable.changePageSize` | Permet à `useDataTableServerSide` d'injecter le handler réel. Usage interne uniquement. |
| `queryModel.updateFilter` | Passé à `useDataTableServerSide` | Extension de `UseQueryModelReturn` pour le filtrage server-side. |

Ces APIs peuvent changer sans préavis. Préférez les APIs publiques (props, events, slots).

---

## 🆘 Dépannage

### Le DataTable ne s'affiche pas

1. Vérifier que les styles sont importés :
```typescript
import '@SMATCH-Digital-dev/vue-system-design/styles'
```

2. Vérifier que `columns` et `rowDataProp` sont définis

3. Vérifier la console pour les erreurs

### La pagination ne fonctionne pas

1. Pour server-side : Vérifier que `@query-model-changed` est géré
2. Vérifier que `currentPageProp`, `totalPagesProp`, `totalItemsProp` sont mis à jour

### Les filtres ne fonctionnent pas

1. Vérifier que `enableFiltering="true"`
2. Vérifier que les colonnes ont `filterable: true`
3. Vérifier que `@filter-changed` ou `@query-model-changed` est géré

### Erreur TypeScript

1. Importer les types :
```typescript
import type { DataTableColumn, QueryModel } from '@SMATCH-Digital-dev/vue-system-design'
```

2. Vérifier que les types correspondent aux props

---

## 📚 Ressources

- **Package** : `@SMATCH-Digital-dev/vue-system-design`
- **Version** : 1.0.0
- **Documentation générale** : [DOCUMENTATION_UTILISATION.md](./DOCUMENTATION_UTILISATION.md)

---

**Dernière mise à jour** : 2024

