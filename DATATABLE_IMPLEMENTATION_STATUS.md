# 📊 État d'implémentation du nouveau modèle DataTable

## ✅ Déjà implémentés (utilisent StandardDataTableParams)

### Stores
- ✅ `src/stores/inventory.ts` - `fetchInventories()` 
  - Accepte `QueryModel | StandardDataTableParams`
  - Utilise `normalizeToStandardParams()` et `buildStandardParamsUrl()`

- ✅ `src/stores/job.ts` - `fetchJobs()`, `fetchJobsValidated()`
  - Accepte `QueryModel | StandardDataTableParams`
  - Utilise `normalizeToStandardParams()` et `buildStandardParamsUrl()`
  - `fetchJobsDataTable()` déprécié, délègue à `fetchJobs()`

- ✅ `src/stores/location.ts` - `fetchUnassignedLocations()`, `fetchLocationsByWarehouse()`
  - Accepte `QueryModel | StandardDataTableParams | LocationDataTableParams`
  - Utilise `normalizeToStandardParams()` et `buildStandardParamsUrl()`

- ✅ `src/stores/resource.ts` - `fetchResources()`
  - Accepte `QueryModel | StandardDataTableParams`
  - Utilise `normalizeToStandardParams()` et `buildStandardParamsUrl()`

- ✅ `src/stores/results.ts` - `fetchResults()`
  - Accepte `StandardDataTableParams | Record<string, any>`

### Composables
- ✅ `src/composables/useInventoryManagement.ts`
  - Utilise `handleStandardParamsChanged()` unifié
  - Passe directement `StandardDataTableParams` au store

- ✅ `src/composables/usePlanning.ts`
  - Utilise `convertToStandardDataTableParams()` pour convertir les paramètres

- ✅ `src/composables/useInventoryResults.ts`
  - Utilise `StandardDataTableParams` et `convertResultsParamsToStandard()`

### Vues
- ✅ `src/views/Inventory/Management/InventoryManagement.vue`
  - Utilise `handleStandardParamsChanged()` pour tous les événements

---

## 🔄 À mettre à jour

### Stores
- ✅ **Tous les stores principaux sont migrés**

### Code obsolète conservé pour compatibilité
- ⚠️ `src/utils/dataTableUtils.ts` - `buildDataTableParams()` et ancien `DataTableParams`
  - **Conservé** pour compatibilité avec l'export Excel/CSV
  - Ne pas utiliser dans les nouveaux stores, utiliser `buildStandardParamsUrl()` à la place

### Composables
- 🔄 `src/composables/useJobManagement.ts`
  - Utilise `useGenericDataTable` qui utilise `DataTableParams`
  - **Action requise** : Adapter pour utiliser `StandardDataTableParams`

- 🔄 `src/composables/useAffecter.ts`
  - **À vérifier** : Vérifier si utilise déjà `StandardDataTableParams` ou `convertToStandardDataTableParams()`

- 🔄 `src/composables/useGenericDataTable.ts`
  - Utilise `DataTableParams` (ancien format)
  - **Action requise** : Adapter pour supporter `StandardDataTableParams`

### Vues
- 🔄 `src/views/Inventory/Affecter.vue`
  - **À vérifier** : Vérifier les handlers (`handlePaginationChanged`, `handleSortChanged`, `handleFilterChanged`)

- 🔄 `src/views/Inventory/Planning.vue`
  - **À vérifier** : Utilise `usePlanning` qui gère déjà la conversion, mais vérifier les handlers

- 🔄 `src/views/Inventory/PlanningManagement.vue`
  - **À vérifier** : Vérifier les handlers

- 🔄 `src/views/Inventory/Results/InventoryResults.vue`
  - **À vérifier** : Utilise `useInventoryResults` qui gère déjà `StandardDataTableParams`

- 🔄 `src/views/Job/JobManagement.vue`
  - Utilise `useJobManagement` qui doit être mis à jour

---

## 📝 Fonctions utilitaires centralisées

### Déjà créées dans `src/components/DataTable/utils/dataTableParamsConverter.ts`
- ✅ `convertToStandardDataTableParams()` - Convertit QueryModel vers StandardDataTableParams
- ✅ `normalizeToStandardParams()` - Détecte et convertit automatiquement QueryModel ou StandardDataTableParams
- ✅ `buildStandardParamsUrl()` - Construit l'URL avec encodage correct des paramètres (avec crochets)

### Format StandardDataTableParams
```typescript
interface StandardDataTableParams {
    draw?: number
    start: number
    length: number
    'search[value]'?: string
    'search[regex]'?: boolean
    'order[][column]'?: number
    'order[][dir]'?: 'asc' | 'desc'
    'columns[index][data]'?: string
    'columns[index][name]'?: string
    'columns[index][search][value]'?: string
    'columns[index][search][regex]'?: boolean
    'columns[index][operator]'?: string
    [key: string]: any
}
```

---

## 🎯 Plan d'action - État actuel

1. ✅ **Terminé** : Implémenter le nouveau modèle dans `inventory.ts`
2. ✅ **Terminé** : Mettre à jour `job.ts` store
3. ✅ **Terminé** : Mettre à jour `location.ts` store
4. ✅ **Terminé** : Mettre à jour `resource.ts` store
5. ✅ **Terminé** : Mettre à jour `results.ts` store (déjà compatible)

### Résumé des migrations

**Stores migrés (5/5)** :
- ✅ `inventory.ts`
- ✅ `job.ts`
- ✅ `location.ts`
- ✅ `resource.ts`
- ✅ `results.ts`

**Composables déjà compatibles** :
- ✅ `useInventoryManagement.ts`
- ✅ `usePlanning.ts`
- ✅ `useInventoryResults.ts`
- ✅ `useAffecter.ts` (utilise StandardDataTableParams)

**Code obsolète** :
- ⚠️ `buildDataTableParams()` dans `dataTableUtils.ts` - Conservé pour export uniquement
- ⚠️ `useGenericDataTable()` - Utilise encore l'ancien format, mais les stores utilisent directement le nouveau modèle

---

## 📌 Notes importantes

- Le DataTable convertit automatiquement `QueryModel` → `StandardDataTableParams` avant d'émettre les événements
- Les stores peuvent accepter les deux formats grâce à `normalizeToStandardParams()`
- `buildStandardParamsUrl()` préserve les crochets dans les noms de paramètres (ex: `columns[2][data]`)
- Les filtres sont automatiquement inclus dans les paramètres si présents

