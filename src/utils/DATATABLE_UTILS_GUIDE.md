# 📊 Guide des Utilitaires DataTable

## 🎯 Vue d'ensemble

Les utilitaires DataTable (`src/utils/dataTableUtils.ts`) fournissent des fonctions réutilisables pour standardiser la gestion des paramètres et réponses DataTable dans toute l'application.

## 🔧 Fonctions Principales

### 1. `buildDataTableParams(params, draw?)`

Construit les paramètres DataTable standard à partir des paramètres d'entrée.

```typescript
import { buildDataTableParams } from '@/utils/dataTableUtils';

const queryParams = buildDataTableParams({
    page: 1,
    pageSize: 20,
    globalSearch: 'terme de recherche',
    sort: [{ colId: 'name', sort: 'asc' }],
    filter: { 
        status: { value: 'active', operator: 'equals' },
        date: { value: '2024-01-01', operator: 'gte' }
    }
});
```

**Paramètres générés :**
- `draw=1`
- `start=0`
- `length=20`
- `search[value]=terme de recherche`
- `search[regex]=false`
- `order[0][column]=0`
- `order[0][dir]=asc`
- `status_equals=active`
- `date_gte=2024-01-01`

### 2. `processDataTableResponse(response, currentPage, totalPages, totalItems, pageSize)`

Traite la réponse DataTable et met à jour la pagination.

```typescript
import { processDataTableResponse } from '@/utils/dataTableUtils';

const result = processDataTableResponse(
    response.data,
    currentPage,
    totalPages,
    totalItems,
    pageSize
);
```

**Fonctionnalités :**
- ✅ Met à jour `totalItems` avec `recordsFiltered`
- ✅ Calcule `totalPages` basé sur `recordsFiltered`
- ✅ Vérifie les limites de page
- ✅ Retourne les données formatées

### 3. `buildSortParams(sortModel)`

Construit les paramètres de tri pour DataTable.

```typescript
import { buildSortParams } from '@/utils/dataTableUtils';

const sortParams = buildSortParams([
    { colId: 'name', sort: 'asc' },
    { colId: 'date', sort: 'desc' }
]);
```

### 4. `buildFilterParams(filterModel)`

Construit les paramètres de filtres pour DataTable.

```typescript
import { buildFilterParams } from '@/utils/dataTableUtils';

const filterParams = buildFilterParams({
    status: { value: 'active', operator: 'equals' },
    date: { value: '2024-01-01', operator: 'gte' }
});
```

### 5. `validateDataTableResponse(response)`

Valide une réponse DataTable.

```typescript
import { validateDataTableResponse } from '@/utils/dataTableUtils';

if (validateDataTableResponse(response)) {
    // Réponse valide
}
```

### 6. `createEmptyDataTableResponse(draw?)`

Crée une réponse DataTable vide.

```typescript
import { createEmptyDataTableResponse } from '@/utils/dataTableUtils';

const emptyResponse = createEmptyDataTableResponse(1);
```

### 7. `calculatePaginationMetrics(recordsFiltered, pageSize, currentPage)`

Calcule les métriques de pagination.

```typescript
import { calculatePaginationMetrics } from '@/utils/dataTableUtils';

const metrics = calculatePaginationMetrics(100, 20, 1);
// {
//   totalPages: 5,
//   startIndex: 0,
//   endIndex: 20,
//   hasNextPage: true,
//   hasPreviousPage: false,
//   totalItems: 100
// }
```

## 🏪 Utilisation dans les Stores Pinia

### Exemple : Store Inventory

```typescript
import { 
    buildDataTableParams, 
    processDataTableResponse, 
    type DataTableParams, 
    type DataTableResponse 
} from '@/utils/dataTableUtils';

export const useInventoryStore = defineStore('inventory', () => {
    const fetchInventories = async (params?: DataTableParams) => {
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

            // Appeler l'API
            const response = await InventoryService.getAll(queryParams);
            const data = response.data.data || [];
            inventories.value = data;

            // Traiter la réponse
            const usedPageSize = params?.pageSize ?? pageSize.value;
            return processDataTableResponse(
                response.data,
                currentPage,
                totalPages,
                totalItems,
                usedPageSize
            );
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur';
            throw err;
        } finally {
            loading.value = false;
        }
    };
});
```

### Exemple : Store Job

```typescript
const fetchJobsDataTable = async (inventoryId: number, warehouseId: number, params?: DataTableParams) => {
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

        // Ajouter les paramètres spécifiques
        queryParams.append('inventory_id', inventoryId.toString());
        queryParams.append('warehouse_id', warehouseId.toString());

        // Appeler l'API
        const response = await JobService.getAll(queryParams);
        const data = response.data.data || [];
        jobs.value = data;

        // Traiter la réponse
        const usedPageSize = params?.pageSize ?? pageSize.value;
        return processDataTableResponse(
            response.data,
            currentPage,
            { value: Math.ceil(totalCount.value / usedPageSize) },
            totalCount,
            usedPageSize
        );
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Erreur';
        throw err;
    } finally {
        loading.value = false;
    }
};
```

## 🔄 Avantages

### ✅ Réutilisabilité
- **Code DRY** : Évite la duplication
- **Standardisation** : Format uniforme partout
- **Maintenance** : Modifications centralisées

### ✅ Performance
- **Paramètres optimisés** : Format DataTable standard
- **Pagination efficace** : Calculs optimisés
- **Validation rapide** : Vérifications intégrées

### ✅ Flexibilité
- **Paramètres personnalisés** : Ajout facile de filtres
- **Tri multiple** : Support des tris complexes
- **Recherche globale** : Recherche unifiée

## 📋 Interfaces TypeScript

```typescript
interface DataTableParams {
    page?: number;
    pageSize?: number;
    globalSearch?: string;
    sort?: Array<{
        colId: string;
        sort: 'asc' | 'desc';
    }>;
    filter?: Record<string, {
        value: any;
        operator?: string;
    }>;
}

interface DataTableResponse<T> {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: T[];
}
```

## 🚀 Migration

### Avant (Code dupliqué)
```typescript
// Dans chaque store
const queryParams = new URLSearchParams();
queryParams.append('draw', '1');
queryParams.append('start', '0');
queryParams.append('length', '20');
// ... 20+ lignes de code dupliqué
```

### Après (Code réutilisable)
```typescript
// Dans chaque store
const queryParams = buildDataTableParams({
    page: 1,
    pageSize: 20,
    globalSearch: 'terme'
});
```

## 🎯 Résultat

- ✅ **Code DRY** : Plus de duplication
- ✅ **Maintenance facile** : Modifications centralisées
- ✅ **Type safety** : Interfaces TypeScript
- ✅ **Performance** : Paramètres optimisés
- ✅ **Standardisation** : Format uniforme

**Les utilitaires DataTable simplifient et standardisent la gestion des données dans toute l'application !** 🎉
