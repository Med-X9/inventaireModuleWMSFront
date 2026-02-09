# Architecture de Gestion des Événements - DataTable vs Composables

## Problème Identifié

Actuellement, `useInventoryResults.ts` gère manuellement tous les événements du DataTable alors que normalement le DataTable devrait gérer tout automatiquement.

## État Actuel

### Ce que fait le DataTable

Le DataTable :
1. ✅ Gère l'UI (pagination, filtres, recherche, tri)
2. ✅ Émet des événements avec QueryModel (`@pagination-changed`, `@filter-changed`, etc.)
3. ✅ Sauvegarde/restaure la configuration dans localStorage
4. ❌ **N'appelle PAS automatiquement l'API** (fonctionnalité `enableAutoManagement` non implémentée)

### Ce que fait `useInventoryResults`

Le composable doit :
1. ✅ Écouter tous les événements du DataTable
2. ✅ Fusionner les `customParams` (inventory_id, store_id) avec le QueryModel
3. ✅ Appeler `resultsStore.fetchResultsAuto()` pour charger les données
4. ✅ Gérer les erreurs et le loading
5. ✅ Mettre en file d'attente les événements avant l'initialisation
6. ✅ Invalider les caches

## Pourquoi cette Architecture ?

### Raison 1 : `enableAutoManagement` n'est pas implémenté

Dans `useDataTableComponent.ts` ligne 354 :
```typescript
const autoDataTable: AutoDataTableInstance | undefined = undefined 
// shouldEnableAutoManagement ? useAutoDataTable({...}) : undefined
```

Le DataTable a l'infrastructure pour gérer automatiquement les appels API, mais elle est commentée/non implémentée.

### Raison 2 : Besoin de `customParams` dynamiques

`useInventoryResults` doit fusionner dynamiquement :
- `inventory_id` (peut changer)
- `store_id` (peut changer via sélection de magasin)

Ces paramètres ne sont pas connus au moment de la configuration du DataTable.

### Raison 3 : Logique métier spécifique

`useInventoryResults` a besoin de :
- Vérifier que `inventoryId` et `selectedStore` sont disponibles
- Gérer la file d'attente avant l'initialisation
- Invalider les caches de normalisation
- Gérer les erreurs spécifiques au domaine

## Solutions Possibles

### Option 1 : Implémenter `enableAutoManagement` (Recommandé pour le futur)

**Avantages** :
- Le DataTable gère tout automatiquement
- Moins de code dans les composables
- Architecture plus propre

**Inconvénients** :
- Nécessite d'implémenter `useAutoDataTable`
- Doit gérer les `customParams` dynamiques
- Plus complexe à implémenter

**Implémentation** :
```typescript
// Dans useDataTableComponent.ts
const autoDataTable = shouldEnableAutoManagement 
    ? useAutoDataTable({
        piniaStore: props.autoManagementConfig.piniaStore,
        storeAction: props.autoManagementConfig.storeAction,
        customParams: computed(() => props.customDataTableParams) // Réactif
    })
    : undefined
```

### Option 2 : Simplifier avec `customDataTableParams` réactif (Solution actuelle améliorée)

**Avantages** :
- Pas besoin d'implémenter `enableAutoManagement`
- `customParams` sont déjà fusionnés dans le QueryModel émis
- Moins de logique dans `useInventoryResults`

**Inconvénients** :
- Le composable doit quand même écouter les événements
- Doit toujours appeler l'API manuellement

**Implémentation actuelle** :
```typescript
// Dans InventoryResults.vue
<DataTable
    :customDataTableParams="resultsCustomParams"
    @query-model-changed="onResultsTableEvent"
/>

// Dans useInventoryResults.ts
const resultsCustomParams = computed(() => ({
    inventory_id: inventoryId.value,
    store_id: selectedStore.value
}))
```

### Option 3 : Utiliser un handler unifié simplifié

**Avantages** :
- Code plus simple dans `useInventoryResults`
- Un seul point d'entrée pour tous les événements

**Implémentation** :
```typescript
// Simplifier processEventDirectly pour être plus générique
const processEventDirectly = async (queryModel: QueryModel) => {
    // customParams sont déjà fusionnés par le DataTable
    await resultsStore.fetchResultsAuto(queryModel)
}
```

## Recommandation

### Court terme (Maintenant)

**Garder l'architecture actuelle** mais simplifier `useInventoryResults` :

1. ✅ Utiliser `customDataTableParams` réactif (déjà fait)
2. ✅ Simplifier `processEventDirectly` pour être plus générique
3. ✅ Réduire la logique de validation (déjà dans le DataTable)
4. ✅ Documenter pourquoi cette architecture est nécessaire

### Long terme (Futur)

**Implémenter `enableAutoManagement`** :

1. Créer `useAutoDataTable` composable
2. Gérer les `customParams` réactifs
3. Appeler automatiquement le store/API
4. Simplifier les composables comme `useInventoryResults`

## Code Actuel - Analyse

### Ce qui est nécessaire dans `useInventoryResults`

```typescript
// ✅ NÉCESSAIRE : Fusion des customParams
const finalQueryModel = mergeQueryModelWithCustomParams(
    sanitizedQueryModel, 
    resultsCustomParams.value
)

// ✅ NÉCESSAIRE : Vérification des IDs requis
if (!inventoryId.value || !selectedStore.value) {
    return
}

// ✅ NÉCESSAIRE : File d'attente avant initialisation
if (!isInitialized.value) {
    pendingEventsQueue.push({ eventType, queryModel })
    return
}

// ✅ NÉCESSAIRE : Appel API spécifique au domaine
await resultsStore.fetchResultsAuto(finalQueryModel)

// ✅ NÉCESSAIRE : Invalidation des caches de normalisation
normalizedResultsCache.value = null
columnsCache.value = null
```

### Ce qui pourrait être simplifié

```typescript
// ⚠️ PEUT-ÊTRE SIMPLIFIÉ : Validation du QueryModel
// Le DataTable devrait déjà valider avant d'émettre

// ⚠️ PEUT-ÊTRE SIMPLIFIÉ : Éviter les appels API inutiles
// Le DataTable devrait déjà gérer ça avec hasQueryModelChanged

// ⚠️ PEUT-ÊTRE SIMPLIFIÉ : Gestion du loading
// Le DataTable pourrait gérer le loading automatiquement
```

## Conclusion

L'architecture actuelle est **nécessaire** car :
1. `enableAutoManagement` n'est pas implémenté
2. Besoin de `customParams` dynamiques (inventory_id, store_id)
3. Logique métier spécifique (normalisation, caches, file d'attente)

**Mais** elle peut être **simplifiée** en :
1. Utilisant `customDataTableParams` réactif (déjà fait ✅)
2. Réduisant la validation redondante
3. Documentant clairement pourquoi cette architecture est nécessaire

**Pour le futur** : Implémenter `enableAutoManagement` pour une architecture plus propre.

