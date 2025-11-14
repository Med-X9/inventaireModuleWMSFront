# Utilitaire de conversion des paramètres DataTable

Ce module fournit des fonctions utilitaires pour convertir les paramètres du DataTable vers le format standard DataTable compatible avec le backend.

## 📦 Import

```typescript
import { 
    convertToStandardDataTableParams,
    convertPaginationToStandardParams,
    convertSortToStandardParams,
    convertFiltersToStandardParams
} from '@/components/DataTable/utils/dataTableParamsConverter'
```

## 🚀 Utilisation de base

### Exemple 1 : Conversion complète (pagination + filtres + tri)

```typescript
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

const onLocationFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
    // Convertir les paramètres vers le format standard
    const standardParams = convertToStandardDataTableParams({
        page: locationsCurrentPage.value,
        pageSize: locationsPageSize.value,
        filters: filterModel,
        sort: locationsSortModel.value || [],
        globalSearch: locationsSearchQuery.value
    }, {
        columns: adaptedAvailableLocationColumns.value,
        draw: 1,
        customParams: {
            account_id: accountId.value,
            inventory_id: inventoryId.value,
            warehouse_id: warehouseId.value
        }
    })
    
    // Utiliser les paramètres standardisés pour l'API
    await locationStore.fetchUnassignedLocations(
        accountId.value,
        inventoryId.value,
        warehouseId.value,
        standardParams
    )
}
```

### Exemple 2 : Conversion de pagination uniquement

```typescript
import { convertPaginationToStandardParams } from '@/components/DataTable/utils/dataTableParamsConverter'

const onPaginationChanged = async (params: { page: number; pageSize: number }) => {
    const paginationParams = convertPaginationToStandardParams(
        params.page,
        params.pageSize,
        1 // draw number
    )
    
    // paginationParams = { draw: 1, start: 0, length: 20 }
    await loadData(paginationParams)
}
```

### Exemple 3 : Conversion de tri uniquement

```typescript
import { convertSortToStandardParams } from '@/components/DataTable/utils/dataTableParamsConverter'

const onSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
    // Mapping des champs vers les index de colonnes
    const fieldToColumnIndex = {
        'reference': 1,
        'zone_name': 2,
        'sous_zone_name': 3
    }
    
    const sortParams = convertSortToStandardParams(sortModel, fieldToColumnIndex)
    
    // sortParams = { 'order[0][column]': 1, 'order[0][dir]': 'asc' }
    await loadData({ ...otherParams, ...sortParams })
}
```

### Exemple 4 : Conversion de filtres uniquement

```typescript
import { convertFiltersToStandardParams } from '@/components/DataTable/utils/dataTableParamsConverter'

const onFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
    // Mapping des champs vers les index de colonnes
    const fieldToColumnIndex = {
        'reference': 1,
        'zone_name': 2,
        'sous_zone_name': 3
    }
    
    const filterParams = convertFiltersToStandardParams(filterModel, fieldToColumnIndex)
    
    // filterParams = { 
    //   'columns[1][data]': 'reference',
    //   'columns[1][search][value]': 'A-01',
    //   'columns[1][search][regex]': false,
    //   ...
    // }
    await loadData({ ...otherParams, ...filterParams })
}
```

## 📋 Format de sortie

### Format standard DataTable

Le format de sortie suit le standard DataTable décrit dans `EXEMPLE_ENDPOINT_COMPLET.md` :

```typescript
{
    draw: 1,
    start: 0,
    length: 20,
    'search[value]': 'laptop',
    'search[regex]': false,
    'order[0][column]': 2,
    'order[0][dir]': 'asc',
    'columns[0][data]': 'id',
    'columns[0][name]': 'id',
    'columns[0][searchable]': true,
    'columns[0][orderable]': true,
    'columns[0][search][value]': '',
    'columns[0][search][regex]': false,
    'columns[1][data]': 'reference',
    'columns[1][name]': 'reference',
    'columns[1][searchable]': true,
    'columns[1][orderable]': true,
    'columns[1][search][value]': 'A-01',
    'columns[1][search][regex]': false,
    // ... paramètres personnalisés
    account_id: 1,
    inventory_id: 10,
    warehouse_id: 5
}
```

## 🔧 Options de conversion

### `ConversionOptions`

```typescript
interface ConversionOptions {
    /**
     * Mapping des noms de champs vers les index de colonnes
     * Si non fourni, les colonnes seront mappées par ordre d'apparition
     */
    fieldToColumnIndex?: Record<string, number>
    
    /**
     * Liste des colonnes dans l'ordre d'affichage
     * Utilisée pour mapper les champs aux index de colonnes
     */
    columns?: Array<{ field: string; [key: string]: any }>
    
    /**
     * Numéro de draw (pour synchronisation)
     */
    draw?: number
    
    /**
     * Recherche globale
     */
    globalSearch?: string
    
    /**
     * Paramètres personnalisés supplémentaires à ajouter
     */
    customParams?: Record<string, any>
}
```

## 📝 Exemple complet dans un composable

```typescript
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import type { DataTableColumn } from '@/types/dataTable'

export function usePlanning() {
    // ... autres code ...
    
    // Colonnes de la table
    const locationColumns: DataTableColumn[] = [
        { field: 'id', headerName: 'ID' },
        { field: 'reference', headerName: 'Référence' },
        { field: 'zone_name', headerName: 'Zone' },
        { field: 'sous_zone_name', headerName: 'Sous-zone' }
    ]
    
    // Handler pour les changements de filtre
    const onLocationFilterChanged = async (
        filterModel: Record<string, { filter: string }>
    ) => {
        const standardParams = convertToStandardDataTableParams({
            page: locationsCurrentPage.value,
            pageSize: locationsPageSize.value,
            filters: filterModel,
            sort: locationsSortModel.value || [],
            globalSearch: locationsSearchQuery.value
        }, {
            columns: locationColumns,
            draw: 1,
            customParams: {
                account_id: accountId.value,
                inventory_id: inventoryId.value,
                warehouse_id: warehouseId.value
            }
        })
        
        await locationStore.fetchUnassignedLocations(
            accountId.value,
            inventoryId.value,
            warehouseId.value,
            standardParams
        )
    }
    
    // Handler pour les changements de pagination
    const onLocationPaginationChanged = async (
        params: { page: number; pageSize: number }
    ) => {
        setLocationsPageSize(params.pageSize)
        setLocationsPage(params.page)
        
        const standardParams = convertToStandardDataTableParams({
            page: params.page,
            pageSize: params.pageSize,
            filters: currentFilters.value,
            sort: locationsSortModel.value || []
        }, {
            columns: locationColumns,
            draw: 1,
            customParams: {
                account_id: accountId.value,
                inventory_id: inventoryId.value,
                warehouse_id: warehouseId.value
            }
        })
        
        await locationStore.fetchUnassignedLocations(
            accountId.value,
            inventoryId.value,
            warehouseId.value,
            standardParams
        )
    }
    
    // Handler pour les changements de tri
    const onLocationSortChanged = async (
        sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>
    ) => {
        setLocationsSortModel(sortModel)
        
        const standardParams = convertToStandardDataTableParams({
            page: locationsCurrentPage.value,
            pageSize: locationsPageSize.value,
            filters: currentFilters.value,
            sort: sortModel
        }, {
            columns: locationColumns,
            draw: 1,
            customParams: {
                account_id: accountId.value,
                inventory_id: inventoryId.value,
                warehouse_id: warehouseId.value
            }
        })
        
        await locationStore.fetchUnassignedLocations(
            accountId.value,
            inventoryId.value,
            warehouseId.value,
            standardParams
        )
    }
    
    return {
        // ... autres exports ...
        onLocationFilterChanged,
        onLocationPaginationChanged,
        onLocationSortChanged
    }
}
```

## 🎯 Cas d'usage

### 1. Filtre simple
```typescript
const filterModel = {
    reference: { filter: 'A-01' }
}

// Résultat :
// columns[1][search][value] = 'A-01'
```

### 2. Filtres multiples
```typescript
const filterModel = {
    reference: { filter: 'A-01' },
    zone_name: { filter: 'Général' }
}

// Résultat :
// columns[1][search][value] = 'A-01'
// columns[2][search][value] = 'Général'
```

### 3. Tri simple
```typescript
const sortModel = [
    { colId: 'reference', sort: 'asc' }
]

// Résultat :
// order[0][column] = 1
// order[0][dir] = 'asc'
```

### 4. Tri multiple
```typescript
const sortModel = [
    { colId: 'zone_name', sort: 'asc' },
    { colId: 'reference', sort: 'desc' }
]

// Résultat :
// order[0][column] = 2
// order[0][dir] = 'asc'
// order[1][column] = 1
// order[1][dir] = 'desc'
```

### 5. Recherche globale + Filtres + Tri
```typescript
const standardParams = convertToStandardDataTableParams({
    page: 1,
    pageSize: 20,
    filters: {
        reference: { filter: 'A-01' }
    },
    sort: [{ colId: 'reference', sort: 'asc' }],
    globalSearch: 'test'
}, {
    columns: locationColumns,
    draw: 1
})

// Résultat inclut :
// - search[value] = 'test'
// - order[0][column] = 1
// - order[0][dir] = 'asc'
// - columns[1][search][value] = 'A-01'
```

## 📚 Référence

Pour plus de détails sur le format standard DataTable, consultez `EXEMPLE_ENDPOINT_COMPLET.md`.

