# 📋 Pattern : Composable + DataTable - Séparation des Responsabilités

## 🎯 Principe Fondamental

**Le DataTable est responsable de SA PROPRE configuration. Les composables NE DOIVENT PAS modifier directement la configuration du DataTable.**

## ✅ Ce que le DataTable fait

1. **Gère sa propre configuration** (pagination, tri, filtres, recherche, colonnes visibles)
2. **Sauvegarde automatiquement** dans `localStorage` via `storageKey`
3. **Restaure automatiquement** sa configuration au montage
4. **Émet des événements** avec le `QueryModel` complet contenant toute sa configuration
5. **Fusionne automatiquement** les `customParams` dans le `QueryModel`

## ✅ Ce que les composables font

1. **Écoutent les événements** du DataTable (`@query-model-changed`)
2. **Utilisent le QueryModel** reçu pour faire les appels API
3. **Fournissent les données** au DataTable via `rowDataProp`
4. **Fournissent les colonnes** au DataTable via `columns`
5. **Fournissent les customParams** réactifs via `customDataTableParams`

## ❌ Ce que les composables NE DOIVENT PAS faire

### 🚫 Manipulation directe de la configuration

```typescript
// ❌ INTERDIT : Modifier directement la configuration du DataTable
resultsTableRef.value?.changePage(2)
resultsTableRef.value?.changePageSize(50)
resultsTableRef.value?.setFilterState({ status: 'active' })
resultsTableRef.value?.updateGlobalSearchTerm('search')
```

### 🚫 Lecture directe de la configuration

```typescript
// ❌ INTERDIT : Lire directement la configuration du DataTable
const currentPage = resultsTableRef.value?.currentPage
const filters = resultsTableRef.value?.filterState
```

### 🚫 Sauvegarde manuelle de la configuration

```typescript
// ❌ INTERDIT : Sauvegarder manuellement la configuration
localStorage.setItem('inventory_results_table', JSON.stringify({ page: 2, filters: {} }))
```

## ✅ Pattern Correct

### 1. Écouter les événements du DataTable

```typescript
// ✅ CORRECT : Écouter query-model-changed
<DataTable
    @query-model-changed="(queryModel) => onResultsTableEvent('query-model-changed', queryModel)"
    :customDataTableParams="resultsCustomParams"
    storageKey="inventory_results_table"
/>
```

### 2. Traiter le QueryModel reçu

```typescript
// ✅ CORRECT : Utiliser le QueryModel reçu sans le modifier
const onResultsTableEvent = async (eventType: string, queryModel: QueryModel) => {
    // Le QueryModel contient déjà :
    // - page, pageSize (pagination)
    // - sort (tri)
    // - filters (filtres)
    // - search (recherche)
    // - customParams (fusionnés automatiquement par le DataTable)
    
    // Utiliser directement pour l'appel API
    await resultsStore.fetchResultsAuto(queryModel)
}
```

### 3. Fournir les customParams réactifs

```typescript
// ✅ CORRECT : Fournir des customParams réactifs
const resultsCustomParams = computed(() => ({
    inventory_id: inventoryId.value,
    store_id: selectedStore.value
}))

// Le DataTable fusionnera automatiquement ces params dans le QueryModel
```

### 4. Fournir les données et métadonnées

```typescript
// ✅ CORRECT : Fournir les données et métadonnées depuis le store
<DataTable
    :rowDataProp="results"
    :currentPageProp="pagination.current_page"
    :totalPagesProp="pagination.total_pages"
    :totalItemsProp="pagination.total"
    :pageSizeProp="pagination.page_size"
/>
```

## 📝 Exemple Complet : useInventoryResults

```typescript
export function useInventoryResults(config?: UseInventoryResultsConfig) {
    // ✅ Fournir customParams réactifs
    const resultsCustomParams = computed(() => ({
        inventory_id: inventoryId.value,
        store_id: selectedStore.value
    }))

    // ✅ Écouter les événements du DataTable
    const onResultsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        // Vérifier que les IDs requis sont disponibles
        if (!inventoryId.value || !selectedStore.value) {
            return
        }

        // Utiliser le QueryModel tel quel (customParams déjà fusionnés)
        await resultsStore.fetchResultsAuto(queryModel)
    }

    return {
        // ✅ Exporter pour la vue
        onResultsTableEvent,
        resultsCustomParams,
        results,
        columns,
        pagination
    }
}
```

## 🔍 Vérifications à Faire

### Checklist pour chaque composable

- [ ] ✅ Le composable écoute `@query-model-changed` uniquement
- [ ] ✅ Le composable utilise le `QueryModel` reçu sans le modifier
- [ ] ✅ Le composable fournit `customDataTableParams` réactifs
- [ ] ✅ Le composable fournit `rowDataProp`, `currentPageProp`, etc.
- [ ] ❌ Le composable ne manipule PAS `resultsTableRef.value` directement
- [ ] ❌ Le composable ne lit PAS la configuration du DataTable
- [ ] ❌ Le composable ne sauvegarde PAS dans `localStorage` avec la clé du DataTable

## 🎨 Architecture Recommandée

```
┌─────────────────────────────────────────────────────────┐
│                    DataTable Component                   │
│  - Gère sa propre configuration                          │
│  - Sauvegarde dans localStorage (storageKey)            │
│  - Restaure au montage                                   │
│  - Émet query-model-changed avec QueryModel complet     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ @query-model-changed
                       │ (QueryModel avec customParams fusionnés)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Composable (useInventoryResults)            │
│  - Écoute query-model-changed                           │
│  - Utilise QueryModel pour appels API                   │
│  - Fournit données via rowDataProp                     │
│  - Fournit customParams réactifs                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ fetchResultsAuto(queryModel)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Store (resultsStore)                 │
│  - Fait l'appel API avec QueryModel                     │
│  - Retourne données + métadonnées                       │
└─────────────────────────────────────────────────────────┘
```

## 🚨 Anti-Patterns à Éviter

### Anti-Pattern 1 : Manipulation directe

```typescript
// ❌ MAUVAIS
const handlePageChange = (page: number) => {
    resultsTableRef.value?.changePage(page) // Ne pas faire ça !
    await loadResults()
}
```

```typescript
// ✅ BON : Le DataTable gère ça automatiquement
// Pas besoin de handler manuel, le DataTable émet query-model-changed
```

### Anti-Pattern 2 : Lecture de la configuration

```typescript
// ❌ MAUVAIS
const getCurrentFilters = () => {
    return resultsTableRef.value?.filterState // Ne pas faire ça !
}
```

```typescript
// ✅ BON : Utiliser le QueryModel reçu dans les événements
const onResultsTableEvent = async (eventType: string, queryModel: QueryModel) => {
    const filters = queryModel.filters // ✅ Utiliser depuis le QueryModel
}
```

### Anti-Pattern 3 : Sauvegarde manuelle

```typescript
// ❌ MAUVAIS
const saveTableState = () => {
    localStorage.setItem('inventory_results_table', JSON.stringify({
        page: currentPage.value,
        filters: filters.value
    })) // Ne pas faire ça !
}
```

```typescript
// ✅ BON : Le DataTable sauvegarde automatiquement via storageKey
// Pas besoin de sauvegarder manuellement
```

## 📚 Références

- `src/components/DataTable/STATE_MANAGEMENT.md` - Gestion d'état du DataTable
- `src/components/DataTable/types/QueryModel.ts` - Structure du QueryModel
- `src/composables/useInventoryResults.ts` - Exemple de bon pattern

## ✅ Résumé

**Règle d'or : Le DataTable émet, le composable écoute et utilise. Jamais l'inverse.**

- ✅ DataTable → émet `query-model-changed` avec QueryModel complet
- ✅ Composable → écoute et utilise le QueryModel pour les appels API
- ❌ Composable → ne modifie jamais directement la configuration du DataTable

