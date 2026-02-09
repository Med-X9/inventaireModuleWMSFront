# Architecture Simplifiée - Gestion Automatique des Événements

## Problème Résolu

Avant, chaque composable devait gérer manuellement tous les événements du DataTable :
- `@pagination-changed`
- `@page-size-changed`
- `@sort-changed`
- `@filter-changed`
- `@global-search-changed`
- `@query-model-changed`

Et fusionner manuellement les `customParams` dans chaque handler.

## Solution Implémentée

### 1. Utilisation de `customDataTableParams` réactif

Le DataTable fusionne automatiquement les `customParams` dans tous les QueryModel émis.

**Dans la vue** :
```vue
<DataTable
    :customDataTableParams="resultsCustomParams"
    @query-model-changed="onResultsTableEvent"
/>
```

**Dans le composable** :
```typescript
const resultsCustomParams = computed(() => ({
    inventory_id: inventoryId.value,
    store_id: selectedStore.value
}))
```

### 2. Un seul handler : `@query-model-changed`

Le DataTable émet maintenant `query-model-changed` pour tous les événements, avec tous les états préservés (pagination, tri, filtres, recherche, customParams).

**Avant** (6 handlers) :
```vue
@pagination-changed="(queryModel) => onResultsTableEvent('pagination', queryModel)"
@page-size-changed="(queryModel) => onResultsTableEvent('page-size-changed', queryModel)"
@sort-changed="(queryModel) => onResultsTableEvent('sort', queryModel)"
@filter-changed="(queryModel) => onResultsTableEvent('filter', queryModel)"
@global-search-changed="(queryModel) => onResultsTableEvent('search', queryModel)"
@query-model-changed="(queryModel) => onResultsTableEvent('query-model-changed', queryModel)"
```

**Après** (1 handler) :
```vue
@query-model-changed="(queryModel) => onResultsTableEvent('query-model-changed', queryModel)"
```

### 3. Handler simplifié

Le handler est maintenant beaucoup plus simple :

```typescript
const processEventDirectly = async (eventType: string, queryModel: QueryModel) => {
    // Vérifications de base
    if (!queryModel || typeof queryModel !== 'object') return
    if (!inventoryId.value || !selectedStore.value) return
    
    // Éviter les appels API inutiles
    const queryModelStr = JSON.stringify(queryModel)
    if (queryModelStr === lastExecutedQueryModelStr) return
    
    // Appeler le store (customParams déjà fusionnés par le DataTable)
    await resultsStore.fetchResultsAuto(queryModel)
}
```

**Plus besoin de** :
- ❌ Fusionner manuellement les `customParams` (fait par le DataTable)
- ❌ Valider/sanitizer le QueryModel (fait par le DataTable)
- ❌ Gérer plusieurs types d'événements (un seul handler)

## Avantages

### 1. Code plus simple
- **Avant** : ~100 lignes de gestion d'événements
- **Après** : ~30 lignes

### 2. Moins de duplication
- Plus besoin de gérer chaque type d'événement séparément
- Le DataTable gère la préservation des états

### 3. Plus maintenable
- Un seul point d'entrée pour tous les événements
- Logique centralisée dans le DataTable

### 4. Réutilisable
- Même pattern pour tous les composables
- Pas besoin de réécrire la logique à chaque fois

## Pattern à Suivre

Pour chaque nouveau composable qui utilise le DataTable :

### 1. Définir les customParams

```typescript
const customParams = computed(() => ({
    // Vos paramètres dynamiques
    inventory_id: inventoryId.value,
    store_id: selectedStore.value
}))
```

### 2. Exporter les customParams

```typescript
return {
    // ... autres exports
    customParams // ou resultsCustomParams, etc.
}
```

### 3. Dans la vue, utiliser customDataTableParams

```vue
<DataTable
    :customDataTableParams="customParams"
    @query-model-changed="handleQueryModelChanged"
/>
```

### 4. Handler simple

```typescript
const handleQueryModelChanged = async (queryModel: QueryModel) => {
    // Vérifications de base
    if (!queryModel || !requiredIds.value) return
    
    // Appeler le store (customParams déjà fusionnés)
    await store.fetchData(queryModel)
}
```

## Exemple Complet

### Composable

```typescript
export function useMyDataTable() {
    const store = useMyStore()
    const myId = ref(1)
    
    // CustomParams réactifs
    const customParams = computed(() => ({
        my_id: myId.value
    }))
    
    // Handler simple
    const handleQueryModelChanged = async (queryModel: QueryModel) => {
        if (!queryModel || !myId.value) return
        await store.fetchData(queryModel)
    }
    
    return {
        customParams,
        handleQueryModelChanged,
        // ... autres exports
    }
}
```

### Vue

```vue
<template>
    <DataTable
        :columns="columns"
        :rowDataProp="data"
        :customDataTableParams="customParams"
        @query-model-changed="handleQueryModelChanged"
    />
</template>

<script setup>
const { customParams, handleQueryModelChanged } = useMyDataTable()
</script>
```

## Migration depuis l'Ancienne Architecture

### Étape 1 : Ajouter customDataTableParams

```vue
<DataTable
    :customDataTableParams="resultsCustomParams"
    <!-- ... autres props -->
/>
```

### Étape 2 : Remplacer tous les handlers par un seul

```vue
<!-- Avant -->
@pagination-changed="..."
@page-size-changed="..."
@sort-changed="..."
@filter-changed="..."
@global-search-changed="..."

<!-- Après -->
@query-model-changed="onResultsTableEvent"
```

### Étape 3 : Simplifier le handler

```typescript
// Supprimer la fusion manuelle de customParams
// Le DataTable le fait automatiquement maintenant

const processEventDirectly = async (queryModel: QueryModel) => {
    // Plus besoin de mergeQueryModelWithCustomParams
    await store.fetchData(queryModel)
}
```

## Conclusion

L'architecture est maintenant **beaucoup plus simple** :
- ✅ Un seul handler au lieu de 6
- ✅ Pas de fusion manuelle de customParams
- ✅ Code réutilisable pour tous les composables
- ✅ Le DataTable gère tout automatiquement

**Résultat** : Moins de code, plus maintenable, plus facile à utiliser ! 🎉

