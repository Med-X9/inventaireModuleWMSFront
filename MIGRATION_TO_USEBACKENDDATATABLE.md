# Migration vers `useBackendDataTable.ts`

## 🎯 Objectif

Standardiser tous les composables DataTable pour utiliser **`useBackendDataTable.ts`** comme solution unique et centralisée.

## 📊 Architecture Cible

```
Component Vue
    ↓
Composable Spécialisé (useJobManagement, usePlanningManagement, etc.)
    ↓
useBackendDataTable.ts (UNIQUE SOLUTION)
    ↓
Pinia Store
    ↓
Service
    ↓
API Backend (Django)
```

## 📋 Composables à Migrer

### ✅ Déjà Migrés
- `useJobManagement.ts` - Migré vers `useBackendDataTable`

### ⏳ À Migrer
- `usePlanningManagement.ts` - Utilise `useGenericDataTable`
- `useInventoryManagement.ts` - Utilise `useInventoryDataTable`
- `useAffecter.ts` - Utilise `useJobValidatedDataTable`
- `useResourceDataTable.ts` - Wrapper de `useGenericDataTable`
- `useLocationDataTable.ts` - Wrapper de `useGenericDataTable`
- `useJobValidatedDataTable.ts` - Wrapper de `useGenericDataTable`

### 🗑️ À Supprimer (Duplication)
- `useGenericDataTable.ts` - Remplacé par `useBackendDataTable`
- `useInventoryDataTable.ts` - Remplacé par `useBackendDataTable`

## 🔄 Pattern de Migration

### Avant (useGenericDataTable)
```typescript
export function useMyDataTable() {
    const store = useMyStore();
    
    return useGenericDataTable({
        store: store,
        fetchAction: 'fetchData',
        defaultPageSize: 20,
        additionalParams: { inventoryId, warehouseId }
    });
}
```

### Après (useBackendDataTable)
```typescript
export function useMyDataTable() {
    const store = useMyStore();
    
    return useBackendDataTable('', {
        piniaStore: store,
        storeId: 'myStore',
        pageSize: 20,
        autoLoad: true
    });
}
```

## 📝 Étapes de Migration

1. **Analyser le composable existant**
   - Identifier le store Pinia utilisé
   - Identifier l'action fetch utilisée
   - Identifier les paramètres additionnels (ex: inventoryId, warehouseId)

2. **Adapter le composable**
   - Remplacer `useGenericDataTable` par `useBackendDataTable`
   - Configurer `piniaStore` et `storeId`
   - Adapter les handlers si nécessaire

3. **Vérifier les exports**
   - S'assurer que tous les handlers nécessaires sont exportés
   - `handlePaginationChanged`, `handleSortChanged`, `handleFilterChanged`
   - `loading`, `data`, `pagination`

4. **Tester**
   - Vérifier que les données se chargent correctement
   - Vérifier que la pagination fonctionne
   - Vérifier que le tri et les filtres fonctionnent

5. **Supprimer les anciens composables**
   - Une fois tous les composables migrés
   - Supprimer `useGenericDataTable.ts` et `useInventoryDataTable.ts`

## 🔧 Exemple Concret : usePlanningManagement

### État Actuel
```typescript
const {
    data: planningData,
    loading,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    refresh
} = useGenericDataTable<Store>({
    store: inventoryStore,
    fetchAction: 'fetchPlanningManagement',
    defaultPageSize: 20
});
```

### État Cible
```typescript
const inventoryStore = useInventoryStore();

const {
    data,
    loading,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    refresh
} = useBackendDataTable<Store>('', {
    piniaStore: inventoryStore,
    storeId: 'inventory',
    pageSize: 20,
    autoLoad: true
});

const planningData = computed(() => data.value as Store[]);
```

## 📊 Avantages de la Migration

1. **Centralisation** : Une seule solution pour tous les DataTables
2. **Maintenabilité** : Un seul fichier à maintenir
3. **Cohérence** : Tous les composables suivent le même pattern
4. **Réduction de code** : Suppression des duplications
5. **Tests simplifiés** : Un seul composable à tester

## ⚠️ Points d'Attention

- **StoreId** : Doit correspondre à l'ID du store Pinia
- **Action** : L'action fetch doit être détectée automatiquement par `findFetchAction`
- **Paramètres additionnels** : Si nécessaire, les passer via les props du composable
- **Handlers** : Les handlers doivent correspondre aux événements du DataTable.vue

## 🚀 Ordre de Migration Recommandé

1. **usePlanningManagement.ts** - Le plus simple, déjà partiellement migré
2. **useInventoryManagement.ts** - Dépend de `useInventoryDataTable`
3. **useAffecter.ts** - Utilise `useJobValidatedDataTable`
4. **Les wrappers** (useResourceDataTable, useLocationDataTable, etc.)
5. **Suppression des anciens composables**

## 📝 Checklist de Migration

Pour chaque composable à migrer :

- [ ] Analyser le composable existant
- [ ] Créer une version migrée vers `useBackendDataTable`
- [ ] Adapter les handlers et exports
- [ ] Tester la migration
- [ ] Vérifier qu'il n'y a pas de régression
- [ ] Supprimer l'ancien code si migration réussie
- [ ] Documenter les changements

