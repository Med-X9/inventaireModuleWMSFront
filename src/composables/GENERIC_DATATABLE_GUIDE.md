# 📊 Guide d'Utilisation - useGenericDataTable

## 🎯 Vue d'ensemble

Le composable `useGenericDataTable` est un composable générique et réutilisable pour gérer n'importe quel DataTable avec Pinia. Il fournit une interface standardisée pour la pagination, le tri, la recherche et le filtrage.

## 🚀 Utilisation de Base

### **Exemple 1: Inventaires**

```typescript
import { useInventoryDataTable } from '@/composables/useInventoryDataTable';

export default {
    setup() {
        const {
            data: inventories,
            loading,
            currentPage,
            pageSize,
            pagination,
            handleFilterChanged,
            handleSortChanged,
            handleSearchChanged,
            handlePaginationChanged,
            refresh
        } = useInventoryDataTable();

        return {
            inventories,
            loading,
            currentPage,
            pageSize,
            pagination,
            handleFilterChanged,
            handleSortChanged,
            handleSearchChanged,
            handlePaginationChanged,
            refresh
        };
    }
};
```

### **Exemple 2: Jobs**

```typescript
import { useGenericDataTable } from '@/composables/useInventoryDataTable';
import { useJobStore } from '@/stores/job';
import type { JobTable } from '@/models/Job';

export default {
    setup() {
        const jobStore = useJobStore();

        const {
            data: jobs,
            loading,
            currentPage,
            pageSize,
            pagination,
            handleFilterChanged,
            handleSortChanged,
            handleSearchChanged,
            handlePaginationChanged,
            refresh
        } = useGenericDataTable<JobTable>({
            store: jobStore,
            fetchAction: 'fetchJobsDataTable',
            defaultPageSize: 20
        });

        return {
            jobs,
            loading,
            currentPage,
            pageSize,
            pagination,
            handleFilterChanged,
            handleSortChanged,
            handleSearchChanged,
            handlePaginationChanged,
            refresh
        };
    }
};
```

## 🔧 Configuration

### **Interface GenericDataTableConfig**

```typescript
interface GenericDataTableConfig<T = any> {
    store: any;              // Store Pinia
    fetchAction: string;     // Nom de l'action
    defaultPageSize?: number; // Taille de page (défaut: 20)
}
```

## 📋 API du Composable

### **Propriétés Réactives**

- `data` - Données de la table
- `loading` - État de chargement
- `currentPage` - Page actuelle
- `pageSize` - Taille de page
- `searchQuery` - Terme de recherche
- `sortModel` - Modèle de tri
- `pagination` - Informations de pagination

### **Actions Disponibles**

- `handleFilterChanged` - Gérer les changements de filtres
- `handleSortChanged` - Gérer les changements de tri
- `handleSearchChanged` - Gérer les changements de recherche
- `handlePaginationChanged` - Gérer les changements de pagination
- `resetFilters` - Réinitialiser les filtres
- `refresh` - Rafraîchir les données
- `loadData` - Charger les données

## ✅ Avantages

- ✅ **Code DRY** : Réutilisable pour tous les DataTables
- ✅ **Type Safety** : Support TypeScript générique
- ✅ **Standardisation** : Interface uniforme
- ✅ **Maintenance** : Modifications centralisées
