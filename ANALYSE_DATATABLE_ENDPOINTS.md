# 📊 Analyse et Adaptation des Endpoints DataTable

## 🎯 Objectif
Adopter un format standard pour tous les endpoints DataTable en utilisant les paramètres standardisés (page, pageSize, sort, filter, globalSearch) et le composable `useGenericDataTable`.

## 📋 État Actuel

### ✅ Stores Déjà Adaptés

#### 1. **inventory.ts** ✅
- **Endpoint**: `fetchInventories`
- **Format**: Utilise `buildDataTableParams` et `processDataTableResponse`
- **Support**: page, pageSize, sort, filters, globalSearch
- **Retour**: `DataTableResponse<InventoryTable>`

#### 2. **job.ts** ✅
- **Endpoint**: `fetchJobs`, `fetchJobsValidated`
- **Format**: Utilise `buildDataTableParams` et `processDataTableResponse`
- **Support**: page, pageSize, sort, filters, globalSearch
- **Retour**: `DataTableResponse<JobTable>`

### ⚠️ Stores à Adapter

#### 3. **location.ts** ⚠️
**Problème**: N'utilise pas les paramètres DataTable standard
- `fetchLocations` accepte `LocationQueryParams` (format REST API)
- Nécessite conversion vers format DataTable

**Solution**:
```typescript
const fetchLocations = async (params?: DataTableParams) => {
    loading.value = true;
    error.value = null;
    try {
        // Construire les paramètres DataTable
        const queryParams = buildDataTableParams(params);
        
        const response = await LocationService.getAll(params);
        const locationData = response.data.data || [];
        locations.value = locationData;
        
        return processDataTableResponse(
            response.data,
            currentPage,
            totalPages,
            totalCount,
            params?.pageSize || pageSize.value
        );
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des locations';
        throw err;
    } finally {
        loading.value = false;
    }
};
```

#### 4. **resource.ts** ⚠️
**Problème**: N'utilise pas les paramètres DataTable
- `fetchResources` n'accepte aucun paramètre
- Pas de pagination dynamique ni filtrage

**Solution**:
```typescript
const fetchResources = async (params?: DataTableParams) => {
    loading.value = true;
    error.value = null;
    try {
        // Construire les paramètres DataTable
        const queryParams = buildDataTableParams({
            page: params?.page || currentPage.value,
            pageSize: params?.pageSize || pageSize.value,
            globalSearch: params?.globalSearch,
            sort: params?.sort,
            filter: params?.filter
        });
        
        const response = await ResourceService.getAll(queryParams);
        const resourceData = response.data.data || [];
        resources.value = resourceData;
        
        return processDataTableResponse(
            response.data,
            currentPage,
            totalPages,
            totalCount,
            params?.pageSize || pageSize.value
        );
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération des ressources';
        throw err;
    } finally {
        loading.value = false;
    }
};
```

#### 5. **warehouse.ts** ⚠️
**Problème**: Très simple, pas de pagination
- `fetchWarehouses` retourne toutes les données

**Solution**:
```typescript
const fetchWarehouses = async (params?: DataTableParams) => {
    loading.value = true;
    error.value = null;
    try {
        // Construire les paramètres DataTable
        const queryParams = buildDataTableParams(params || {});
        
        const response = await WarehouseService.getAll(queryParams);
        const warehouseData = response.data.data || [];
        warehouses.value = warehouseData;
        
        return processDataTableResponse(
            response.data,
            currentPage,
            totalPages,
            totalCount,
            params?.pageSize || pageSize.value
        );
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des entrepôts';
        throw err;
    } finally {
        loading.value = false;
    }
};
```

#### 6. **session.ts** ⚠️
**Problème**: Old Vuex pattern avec Options API
- Déjà simple mais pourrait bénéficier du format DataTable

## 📦 Services à Adapter

### 1. **LocationService.ts**
Adapter `getAll` pour accepter `URLSearchParams` au lieu de `LocationQueryParams`:
```typescript
static async getAll(queryParams?: URLSearchParams): Promise<AxiosResponse> {
    const url = `${this.baseUrl}?${queryParams?.toString() || ''}`;
    return await axiosInstance.get(url);
}
```

### 2. **ResourceService.ts**
Ajouter les paramètres de pagination:
```typescript
static async getResources(queryParams?: URLSearchParams): Promise<AxiosResponse> {
    const url = `${this.baseUrl}?${queryParams?.toString() || ''}`;
    return await axiosInstance.get(url);
}
```

### 3. **WarehouseService.ts**
Adapter pour la pagination:
```typescript
static async getAll(queryParams?: URLSearchParams): Promise<AxiosResponse> {
    const url = `${this.baseUrl}?${queryParams?.toString() || ''}`;
    return await axiosInstance.get(url);
}
```

## 🔧 Composable à Créer

### useLocationDataTable.ts
```typescript
import { useGenericDataTable } from './useInventoryDataTable';
import { useLocationStore } from '@/stores/location';
import type { Location } from '@/models/Location';

export function useLocationDataTable() {
    const locationStore = useLocationStore();
    
    return useGenericDataTable<Location>({
        store: locationStore,
        fetchAction: 'fetchLocations',
        defaultPageSize: 20
    });
}
```

### useResourceDataTable.ts
```typescript
import { useGenericDataTable } from './useInventoryDataTable';
import { useResourceStore } from '@/stores/resource';
import type { Resource } from '@/models/Resource';

export function useResourceDataTable() {
    const resourceStore = useResourceStore();
    
    return useGenericDataTable<Resource>({
        store: resourceStore,
        fetchAction: 'fetchResources',
        defaultPageSize: 20
    });
}
```

### useWarehouseDataTable.ts
```typescript
import { useGenericDataTable } from './useInventoryDataTable';
import { useWarehouseStore } from '@/stores/warehouse';
import type { Warehouse } from '@/models/Warehouse';

export function useWarehouseDataTable() {
    const warehouseStore = useWarehouseStore();
    
    return useGenericDataTable<Warehouse>({
        store: warehouseStore,
        fetchAction: 'fetchWarehouses',
        defaultPageSize: 50
    });
}
```

## 📝 Recommandations

### 1. Format Standard pour les Stores
Tous les stores doivent retourner:
```typescript
return {
    data: T[],
    recordsTotal: number,
    recordsFiltered: number
};
```

### 2. Utilisation Uniforme
Tous les composables doivent utiliser `useGenericDataTable`:
```typescript
const {
    data,
    loading,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    refresh
} = useGenericDataTable<T>({
    store,
    fetchAction,
    defaultPageSize,
    additionalParams // Si nécessaire
});
```

### 3. Services Uniformes
Tous les services doivent accepter `URLSearchParams`:
```typescript
static async getAll(queryParams?: URLSearchParams): Promise<AxiosResponse<DataTableResponse<T>>> {
    const url = `${this.baseUrl}?${queryParams?.toString() || ''}`;
    return await axiosInstance.get(url);
}
```

## 🎯 Prochaines Étapes

1. ✅ Adapter location.ts pour utiliser DataTableParams
2. ✅ Adapter resource.ts pour utiliser DataTableParams
3. ✅ Adapter warehouse.ts pour utiliser DataTableParams
4. ✅ Adapter session.ts pour utiliser DataTableParams
5. ✅ Adapter les services correspondants
6. ✅ Créer les composables spécialisés
7. ✅ Tester chaque composant avec useGenericDataTable

