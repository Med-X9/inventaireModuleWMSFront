# 🔄 Intégration QueryModel dans InventoryManagement

## ✅ Modifications Effectuées

### 1. `useInventoryManagement.ts`

#### Ajout des imports
```typescript
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToStandardParams } from '@/components/DataTable/utils/queryModelConverter'
import type { SortModel, FilterModel } from '@/components/DataTable/types/QueryModel'
```

#### Initialisation du QueryModel
```typescript
// Après la définition des colonnes
const columnsRef = computed(() => columns)
const {
    queryModel,
    updateSort,
    updateFilter,
    updatePagination,
    updateGlobalSearch,
    toStandardParams,
    syncQueryModelToBackend
} = useQueryModel({
    columns: columnsRef,
    enabled: true
})
```

#### Handlers QueryModel
```typescript
// Handler pour le tri
const handleQueryModelSortChanged = async (sort: SortModel[]) => {
    updateSort(sort)
    // Synchroniser avec useBackendDataTable
    const backendSort = sort.map(s => ({ field: s.field, direction: s.direction }))
    setSortModel(backendSort)
    await syncQueryModelToBackend()
}

// Handler pour les filtres
const handleQueryModelFilterChanged = async (filters: Record<string, FilterModel>) => {
    Object.entries(filters).forEach(([field, filter]) => {
        updateFilter(field, filter)
    })
    // Synchroniser avec useBackendDataTable
    const backendFilters: Record<string, any> = {}
    Object.entries(filters).forEach(([field, filter]) => {
        backendFilters[field] = {
            value: filter.value,
            operator: filter.operator,
            value2: filter.value2,
            values: filter.values
        }
    })
    setFilters(backendFilters)
    await syncQueryModelToBackend()
}

// Handler pour la pagination
const handleQueryModelPaginationChanged = async (page: number, pageSize: number) => {
    updatePagination(page, pageSize)
    setPage(page)
    setPageSize(pageSize)
    await syncQueryModelToBackend()
}

// Handler pour la recherche
const handleQueryModelSearchChanged = async (search: string) => {
    updateGlobalSearch(search)
    setSearch(search)
    await syncQueryModelToBackend()
}
```

### 2. `InventoryManagement.vue`

#### Wrappers pour convertir vers QueryModel
```typescript
// Les handlers convertissent automatiquement les formats vers QueryModel
const handleSortChanged = async (params: any) => {
    // Détecte le format et convertit vers QueryModel
    if (Array.isArray(params) && params.every((p: any) => p.field && p.direction)) {
        const sortModels: SortModel[] = params.map((p: any, index: number) => ({
            field: p.field,
            direction: p.direction,
            priority: index + 1
        }))
        await handleQueryModelSortChanged(sortModels)
    } else {
        // Format original - conversion automatique
        await originalHandleSortChanged(params)
    }
}
```

## 🔄 Flux de Données

```
DataTable Event
    ↓
InventoryManagement.vue Handler
    ↓
Conversion vers QueryModel
    ↓
useInventoryManagement.ts Handler
    ↓
Synchronisation avec useBackendDataTable
    ↓
API Call
```

## 📊 Format QueryModel

```typescript
{
    sort: [
        { field: 'name', direction: 'asc', priority: 1 },
        { field: 'status', direction: 'desc', priority: 2 }
    ],
    filters: {
        status: {
            field: 'status',
            dataType: 'select',
            operator: 'in',
            values: ['ACTIF', 'INACTIF']
        }
    },
    pagination: {
        page: 1,
        pageSize: 20
    },
    globalSearch: 'test'
}
```

## 🎯 Avantages

1. **Format unifié** : Tous les paramètres dans un seul objet
2. **Type-safe** : Typage TypeScript complet
3. **Conversion automatique** : Support de multiples formats d'entrée
4. **Synchronisation** : Automatique avec useBackendDataTable
5. **Extensible** : Facile d'ajouter de nouveaux paramètres

## 🚀 Utilisation

Le QueryModel est maintenant utilisé automatiquement dans `InventoryManagement`. Tous les événements du DataTable sont convertis vers QueryModel et synchronisés avec le backend.

