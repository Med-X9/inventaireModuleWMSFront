# 📋 Documentation QueryModel

## Vue d'ensemble

Le **QueryModel** est un modèle de requête unifié pour DataTable, équivalent à `sortModel` et `filterModel` d'AG-Grid. Il encapsule tous les paramètres de requête (tri, filtres, pagination, recherche) dans un format standardisé.

## ✅ Support QueryModel

**Oui, le DataTable supporte maintenant QueryModel !**

## 📦 Structure du QueryModel

```typescript
interface QueryModel {
    // Tri multi-colonnes
    sort?: SortModel[]
    
    // Filtres par champ
    filters?: Record<string, FilterModel>
    
    // Pagination
    pagination?: {
        page: number
        pageSize: number
    }
    
    // Recherche globale
    globalSearch?: string
    
    // Paramètres personnalisés
    customParams?: Record<string, any>
}
```

## 🚀 Utilisation

### 1. Utilisation avec le composable `useQueryModel`

```typescript
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { ref } from 'vue'

const columns = ref([
    { field: 'name', headerName: 'Nom' },
    { field: 'status', headerName: 'Statut' }
])

const {
    queryModel,
    updateSort,
    updateFilter,
    updatePagination,
    updateGlobalSearch,
    toStandardParams
} = useQueryModel({
    columns,
    enabled: true
})

// Mettre à jour le tri
updateSort([
    { field: 'name', direction: 'asc', priority: 1 },
    { field: 'status', direction: 'desc', priority: 2 }
])

// Ajouter un filtre
updateFilter('status', {
    field: 'status',
    dataType: 'select',
    operator: 'in',
    values: ['ACTIF', 'INACTIF']
})

// Mettre à jour la pagination
updatePagination(2, 50)

// Recherche globale
updateGlobalSearch('test')

// Obtenir les paramètres standard pour l'API
const apiParams = toStandardParams.value
```

### 2. Conversion vers différents formats backend

#### Format DataTables.js (StandardDataTableParams)

```typescript
import { convertQueryModelToStandardParams } from '@/components/DataTable/utils/queryModelConverter'

const queryModel: QueryModel = {
    sort: [
        { field: 'name', direction: 'asc' }
    ],
    filters: {
        status: {
            field: 'status',
            dataType: 'select',
            operator: 'in',
            values: ['ACTIF']
        }
    },
    pagination: {
        page: 1,
        pageSize: 20
    },
    globalSearch: 'test'
}

const standardParams = convertQueryModelToStandardParams(queryModel, {
    columns: [
        { field: 'id' },
        { field: 'name' },
        { field: 'status' }
    ]
})

// Résultat : format DataTables.js
// {
//   draw: 1,
//   start: 0,
//   length: 20,
//   'search[value]': 'test',
//   'order[0][column]': 1,
//   'order[0][dir]': 'asc',
//   'columns[2][search][value]': 'ACTIF',
//   ...
// }
```

#### Format REST API personnalisé

```typescript
import { convertQueryModelToRestApi } from '@/components/DataTable/utils/queryModelConverter'

const restApiParams = convertQueryModelToRestApi(queryModel)

// Résultat : format REST API
// {
//   page: 1,
//   page_size: 20,
//   search: 'test',
//   ordering: 'name',
//   status_in: ['ACTIF'],
//   ...
// }
```

#### Format Django QuerySet

```typescript
import { convertQueryModelToDjango } from '@/components/DataTable/utils/queryModelConverter'

const djangoParams = convertQueryModelToDjango(queryModel)

// Résultat : format Django
// {
//   page: 1,
//   page_size: 20,
//   search: 'test',
//   order_by: [{ field: 'name', direction: 'asc' }],
//   filters: [
//     { field: 'status', operator: 'in', values: ['ACTIF'] }
//   ]
// }
```

### 3. Création depuis les paramètres DataTable

```typescript
import { createQueryModelFromDataTableParams } from '@/components/DataTable/utils/queryModelConverter'

const queryModel = createQueryModelFromDataTableParams({
    page: 2,
    pageSize: 50,
    sort: [
        { field: 'name', direction: 'asc' }
    ],
    filters: {
        status: {
            filter: 'ACTIF',
            operator: 'equals'
        }
    },
    globalSearch: 'test'
})
```

## 📝 Exemple Complet

### Dans un composable

```typescript
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToStandardParams } from '@/components/DataTable/utils/queryModelConverter'

export function useInventoryDataTable() {
    const columns = ref([...])
    
    const {
        queryModel,
        updateSort,
        updateFilter,
        updatePagination,
        updateGlobalSearch,
        toStandardParams
    } = useQueryModel({ columns })
    
    // Handler pour le tri
    const handleSortChanged = async (sort: SortModel[]) => {
        updateSort(sort)
        await fetchData()
    }
    
    // Handler pour les filtres
    const handleFilterChanged = async (filters: Record<string, FilterModel>) => {
        Object.entries(filters).forEach(([field, filter]) => {
            updateFilter(field, filter)
        })
        await fetchData()
    }
    
    // Charger les données
    const fetchData = async () => {
        const params = toStandardParams.value
        const response = await api.get('/inventories', { params })
        // ...
    }
    
    return {
        queryModel,
        handleSortChanged,
        handleFilterChanged,
        fetchData
    }
}
```

### Dans le DataTable

```vue
<template>
    <DataTable
        :columns="columns"
        :rowDataProp="data"
        @sort-changed="handleSortChanged"
        @filter-changed="handleFilterChanged"
        @pagination-changed="handlePaginationChanged"
        @global-search-changed="handleGlobalSearchChanged"
    />
</template>

<script setup lang="ts">
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'

const { queryModel, updateSort, updateFilter, ... } = useQueryModel({ columns })

const handleSortChanged = (sort: SortModel[]) => {
    updateSort(sort)
}

const handleFilterChanged = (filters: Record<string, FilterModel>) => {
    Object.entries(filters).forEach(([field, filter]) => {
        updateFilter(field, filter)
    })
}
</script>
```

## 🔧 Opérateurs de Filtre Supportés

| Opérateur | Description | Exemple |
|-----------|-------------|---------|
| `equals` | Égal à | `value: 'ACTIF'` |
| `not_equals` | Différent de | `value: 'INACTIF'` |
| `contains` | Contient | `value: 'test'` |
| `not_contains` | Ne contient pas | `value: 'test'` |
| `starts_with` | Commence par | `value: 'A-'` |
| `ends_with` | Termine par | `value: '-01'` |
| `greater_than` | Supérieur à | `value: 100` |
| `less_than` | Inférieur à | `value: 50` |
| `between` | Entre deux valeurs | `value: 10, value2: 20` |
| `in` | Dans une liste | `values: ['ACTIF', 'INACTIF']` |
| `not_in` | Pas dans une liste | `values: ['ARCHIVE']` |
| `is_null` | Est null | - |
| `is_not_null` | N'est pas null | - |

## 🎯 Avantages du QueryModel

1. **Format unifié** : Un seul format pour tous les paramètres de requête
2. **Type-safe** : Typage TypeScript complet
3. **Multi-backend** : Conversion vers différents formats backend
4. **Extensible** : Support des paramètres personnalisés
5. **AG-Grid compatible** : Format similaire à AG-Grid

## 📚 Fichiers

- Types : `src/components/DataTable/types/QueryModel.ts`
- Convertisseurs : `src/components/DataTable/utils/queryModelConverter.ts`
- Composable : `src/components/DataTable/composables/useQueryModel.ts`

