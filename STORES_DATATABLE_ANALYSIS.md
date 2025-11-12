# 📊 Analyse des Stores - Migration vers DataTable

## 🎯 Objectif
Vérifier si tous les stores utilisent le format DataTable au lieu de l'ancien format REST API pour la pagination.

## ✅ Stores qui utilisent DataTable

### 1. ✅ `inventory.ts` - **DÉJÀ MIGRÉ**
- ✅ Utilise `buildDataTableParams` et `processDataTableResponse` de `dataTableUtils.ts`
- ✅ Fonction `fetchInventories` avec `DataTableParams`
- ✅ Support de `recordsFiltered` pour la pagination
- ✅ Format DataTable standard (draw, start, length, etc.)

```typescript
const fetchInventories = async (params?: DataTableParams) => {
    const queryParams = buildDataTableParams({
        page: params?.page || currentPage.value,
        pageSize: params?.pageSize || pageSize.value,
        globalSearch: params?.globalSearch,
        sort: params?.sort,
        filter: params?.filters || params?.filter
    });
    // ...
    return processDataTableResponse(response.data, ...);
};
```

### 2. ✅ `job.ts` - **PARTIELLEMENT MIGRÉ**
- ✅ Fonction `fetchJobsDataTable` qui utilise DataTable
- ⚠️ Fonction `fetchJobs` utilise encore l'ancien format REST API
- ⚠️ Autres fonctions (`fetchJobsByWarehouse`, etc.) utilisent encore REST API

**Action requise** : Migrer toutes les fonctions `fetchJobs*` vers le format DataTable

## ❌ Stores qui n'utilisent PAS DataTable

### 3. ❌ `location.ts` - **N'UTILISE PAS DataTable**
- ❌ Utilise l'ancien format REST API
- ❌ Fonction `fetchLocations` avec `LocationQueryParams`
- ❌ Pas d'utilisation de `buildDataTableParams` ni `processDataTableResponse`

**Action requise** : Migrer vers DataTable

### 4. ❌ `resource.ts` - **N'UTILISE PAS DataTable**
- ❌ Fonction `fetchResources` sans pagination DataTable
- ❌ Utilise l'ancien format REST API
- ❌ Pas d'utilisation de `buildDataTableParams` ni `processDataTableResponse`

**Action requise** : Migrer vers DataTable

### 5. ✅ `warehouse.ts` - **OK** (Pas de pagination nécessaire)
- ✅ Store simple sans pagination complexe
- ✅ Fonction `fetchWarehouses` sans paramètres de pagination

### 6. ✅ `session.ts` - **OK** (Pas de pagination nécessaire)
- ✅ Store simple sans pagination complexe
- ✅ Fonction `fetchSessions` sans paramètres de pagination

## 📊 Tableau récapitulatif

| Store | DataTable | REST API | Statut | Action Requise |
|-------|-----------|----------|---------|----------------|
| `inventory.ts` | ✅ | ❌ | ✅ Migré | - |
| `job.ts` | ⚠️ Partiel | ⚠️ Partiel | 🔄 En cours | Migrer toutes les fonctions |
| `location.ts` | ❌ | ✅ | ❌ Non migré | Migrer vers DataTable |
| `resource.ts` | ❌ | ✅ | ❌ Non migré | Migrer vers DataTable |
| `warehouse.ts` | N/A | N/A | ✅ OK | - |
| `session.ts` | N/A | N/A | ✅ OK | - |

## 🎯 Plan d'Action

### Priorité 1 : Compléter la migration de `job.ts`
1. Migrer `fetchJobs` vers le format DataTable
2. Migrer `fetchJobsValidated` vers le format DataTable
3. Migrer `fetchJobsByWarehouse` vers le format DataTable
4. Migrer `fetchJobsByInventory` vers le format DataTable
5. Migrer `fetchJobsByStatus` vers le format DataTable

### Priorité 2 : Migrer `location.ts`
1. Ajouter l'import de `buildDataTableParams` et `processDataTableResponse`
2. Modifier `fetchLocations` pour utiliser `DataTableParams`
3. Modifier `fetchLocationsBySousZone` pour utiliser `DataTableParams`
4. Modifier `fetchLocationsByZone` pour utiliser `DataTableParams`
5. Modifier `fetchLocationsByWarehouse` pour utiliser `DataTableParams`
6. Supprimer l'ancien type `LocationQueryParams`

### Priorité 3 : Migrer `resource.ts`
1. Ajouter l'import de `buildDataTableParams` et `processDataTableResponse`
2. Modifier `fetchResources` pour utiliser `DataTableParams`
3. Ajouter la gestion de `recordsFiltered` pour la pagination

## 🔧 Avantages de la migration vers DataTable

1. ✅ **Uniformité** : Tous les stores utilisent le même format
2. ✅ **Filtrage avancé** : Support des filtres DataTable
3. ✅ **Tri standardisé** : Format DataTable pour le tri
4. ✅ **Recherche globale** : Support de la recherche globale DataTable
5. ✅ **Pagination cohérente** : Utilisation de `recordsFiltered` partout
6. ✅ **Réutilisabilité** : Utilitaires partagés dans `dataTableUtils.ts`

## 📝 Notes

- Les stores `warehouse.ts` et `session.ts` n'ont pas besoin de migration car ils ne gèrent pas de pagination complexe
- Le store `inventory.ts` est la référence pour la migration
- Les utilitaires `dataTableUtils.ts` sont déjà disponibles et testés
