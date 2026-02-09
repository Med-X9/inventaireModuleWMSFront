# ✅ Checklist : Vérification du Pattern DataTable + Composable

## 🔍 Vérifications à faire pour chaque composable qui utilise DataTable

### 1. ✅ Écoute des événements

- [ ] Le composable écoute `@query-model-changed` (événement principal)
- [ ] Le composable n'écoute PAS les événements individuels (`@pagination-changed`, `@filter-changed`, etc.) sauf pour compatibilité
- [ ] Le handler reçoit un `QueryModel` complet

```vue
<!-- ✅ BON -->
<DataTable
    @query-model-changed="(queryModel) => onTableEvent('query-model-changed', queryModel)"
/>

<!-- ⚠️ DÉPRÉCIÉ (pour compatibilité uniquement) -->
<DataTable
    @pagination-changed="handlePaginationChanged"
    @filter-changed="handleFilterChanged"
/>
```

### 2. ✅ Utilisation du QueryModel

- [ ] Le composable utilise le `QueryModel` reçu tel quel (sans modification)
- [ ] Le composable ne modifie PAS `queryModel.page`, `queryModel.filters`, etc.
- [ ] Le composable passe le `QueryModel` directement au store/service

```typescript
// ✅ BON
const onTableEvent = async (eventType: string, queryModel: QueryModel) => {
    // Utiliser le QueryModel tel quel
    await store.fetchData(queryModel)
}

// ❌ MAUVAIS
const onTableEvent = async (eventType: string, queryModel: QueryModel) => {
    // Ne pas modifier le QueryModel
    queryModel.page = 1 // ❌
    queryModel.filters = {} // ❌
    await store.fetchData(queryModel)
}
```

### 3. ✅ CustomParams réactifs

- [ ] Le composable fournit `customDataTableParams` comme `computed`
- [ ] Les `customParams` sont réactifs (utilisent `computed()`)
- [ ] Le composable ne modifie PAS les `customParams` dans le handler

```typescript
// ✅ BON
const customParams = computed(() => ({
    inventory_id: inventoryId.value,
    store_id: selectedStore.value
}))

// ❌ MAUVAIS
const customParams = {
    inventory_id: inventoryId.value, // Pas réactif
    store_id: selectedStore.value
}
```

### 4. ✅ Référence au DataTable

- [ ] Si `tableRef` est déclaré, il n'est PAS utilisé pour manipuler la configuration
- [ ] Aucun appel à `tableRef.value?.changePage()`, `tableRef.value?.setFilterState()`, etc.
- [ ] `tableRef` est utilisé uniquement pour des opérations non-configurationnelles (export, etc.)

```typescript
// ✅ BON : Déclaration OK
const tableRef = ref<any>(null)

// ❌ MAUVAIS : Manipulation de la configuration
tableRef.value?.changePage(2) // ❌
tableRef.value?.setFilterState({}) // ❌
tableRef.value?.updateGlobalSearchTerm('search') // ❌

// ✅ BON : Utilisation pour export (si nécessaire)
tableRef.value?.exportToExcel() // ✅ OK si méthode d'export existe
```

### 5. ✅ Pas de sauvegarde manuelle

- [ ] Le composable ne sauvegarde PAS dans `localStorage` avec la clé du DataTable
- [ ] Le composable ne lit PAS depuis `localStorage` avec la clé du DataTable
- [ ] Le DataTable gère sa propre sauvegarde via `storageKey`

```typescript
// ❌ MAUVAIS
localStorage.setItem('inventory_results_table', JSON.stringify({ page: 2 }))
const saved = localStorage.getItem('inventory_results_table')

// ✅ BON : Le DataTable gère ça automatiquement via storageKey
<DataTable storageKey="inventory_results_table" />
```

### 6. ✅ Fourniture des données

- [ ] Le composable fournit `rowDataProp` avec les données
- [ ] Le composable fournit les métadonnées (`currentPageProp`, `totalPagesProp`, etc.)
- [ ] Les métadonnées viennent du store/backend, pas du composable

```vue
<!-- ✅ BON -->
<DataTable
    :rowDataProp="results"
    :currentPageProp="pagination.current_page"
    :totalPagesProp="pagination.total_pages"
    :totalItemsProp="pagination.total"
    :pageSizeProp="pagination.page_size"
/>
```

## 📋 Checklist pour useInventoryResults

- [x] ✅ Écoute `@query-model-changed` uniquement
- [x] ✅ Utilise le `QueryModel` reçu sans modification
- [x] ✅ Fournit `resultsCustomParams` comme `computed`
- [x] ✅ `resultsTableRef` déclaré mais non utilisé pour manipuler la config
- [x] ✅ Ne sauvegarde pas dans `localStorage` manuellement
- [x] ✅ Fournit les données et métadonnées depuis le store

## 📋 Checklist pour useInventoryManagement

- [ ] ⚠️ Utilise encore les handlers individuels (à migrer vers `@query-model-changed`)
- [x] ✅ Utilise le `QueryModel` reçu sans modification
- [ ] ⚠️ Pas de `customDataTableParams` (à ajouter si nécessaire)
- [x] ✅ Pas de manipulation directe de la configuration
- [x] ✅ Ne sauvegarde pas dans `localStorage` manuellement
- [x] ✅ Fournit les données depuis le store

## 🎯 Actions Recommandées

1. **useInventoryManagement** : Migrer vers `@query-model-changed` avec `onInventoryTableEvent`
2. **Tous les composables** : Ajouter des commentaires pour rappeler le pattern
3. **Code review** : Vérifier qu'aucun composable ne manipule directement la config

