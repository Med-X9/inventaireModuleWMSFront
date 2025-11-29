# 📋 Guide de Configuration Simplifiée des DataTables

Ce guide explique comment utiliser les helpers simplifiés pour configurer les DataTables dans les composables.

## 🎯 Objectif

Simplifier et unifier la configuration des DataTables pour éviter la duplication de code et standardiser les patterns d'utilisation.

## 📦 Helpers Disponibles

### 1. `dataTableHelpers.ts`
Fonctions utilitaires pour extraire et traiter les paramètres DataTable :

- `extractFiltersFromStandardParams()` - Extrait les filtres depuis StandardDataTableParams
- `extractPageFromStandardParams()` - Extrait le numéro de page
- `extractPageSizeFromStandardParams()` - Extrait la taille de page
- `extractSortFromStandardParams()` - Extrait le modèle de tri
- `isStandardDataTableParams()` - Vérifie si c'est StandardDataTableParams
- `createSimpleDataTableHandler()` - Crée un handler simplifié
- `createUnifiedDataTableHandlers()` - Crée tous les handlers d'un coup

### 2. `createDataTableConfig.ts`
Configuration standardisée des props et handlers :

- `createStandardDataTableProps()` - Crée les props standardisées
- `createStandardDataTableHandlers()` - Crée les handlers standardisés
- `createCompleteDataTableConfig()` - Configuration complète en une fois
- `createStoreActionHandler()` - Handler pour actions de store Pinia

### 3. `dataTableConfigBuilder.ts`
Builder pour configurations complexes avec Pinia :

- `createPiniaDataTableConfig()` - Configuration complète avec store Pinia
- `createUnifiedHandlers()` - Handlers unifiés pour tous les événements

## 🚀 Utilisation Simplifiée

### Pattern Standard (Recommandé)

```typescript
import { createUnifiedDataTableHandlers } from './utils/dataTableHelpers'
import { createStandardDataTableProps } from './utils/createDataTableConfig'

export function useMyComposable() {
    const store = useMyStore()
    const columns = computed(() => [...])
    const customParams = computed(() => ({ ... }))

    // Fonction de chargement des données
    const loadData = async (params: StandardDataTableParams) => {
        await store.fetchData(params)
    }

    // Handlers unifiés (tous les événements utilisent la même fonction)
    const handlers = createUnifiedDataTableHandlers(loadData)

    // Props standardisées
    const props = computed(() => createStandardDataTableProps({
        columns: columns.value,
        customParams: customParams.value,
        exportTitle: 'Mes données',
        enableSelection: true
    }))

    return {
        props,
        handlers,
        // ... autres propriétés
    }
}
```

### Pattern avec Synchronisation de Filtres

```typescript
import { 
    extractFiltersFromStandardParams,
    extractPageFromStandardParams,
    extractPageSizeFromStandardParams,
    extractSortFromStandardParams
} from './utils/dataTableHelpers'

export function useMyComposable() {
    const { filters, setFilters, setPage, setPageSize, setSortModel } = useBackendDataTable(...)

    const loadData = async (params: StandardDataTableParams) => {
        // Extraire et synchroniser la pagination
        const pageSize = extractPageSizeFromStandardParams(params, 20)
        const page = extractPageFromStandardParams(params, pageSize)
        setPageSize(pageSize)
        setPage(page)

        // Extraire et synchroniser le tri
        const sortModel = extractSortFromStandardParams(params, columns.value)
        setSortModel(sortModel)

        // Extraire et synchroniser les filtres
        const extractedFilters = extractFiltersFromStandardParams(params, columns.value)
        setFilters(extractedFilters)

        // Charger les données
        await store.fetchData(params)
    }

    return {
        handlers: createUnifiedDataTableHandlers(loadData),
        // ...
    }
}
```

## ✅ Avantages

1. **Moins de code dupliqué** - Les handlers sont générés automatiquement
2. **Configuration standardisée** - Tous les DataTables utilisent les mêmes patterns
3. **Type-safe** - Tous les types sont correctement définis
4. **Facile à maintenir** - Un seul endroit pour changer la logique
5. **Performance** - Moins de conversions inutiles

## 📝 Exemples d'Utilisation

### Exemple 1 : DataTable Simple

```typescript
const handlers = {
    onPaginationChanged: loadData,
    onSortChanged: loadData,
    onFilterChanged: loadData,
    onGlobalSearchChanged: loadData
}
```

### Exemple 2 : DataTable avec Synchronisation

```typescript
const onPaginationChanged = async (params: StandardDataTableParams) => {
    const pageSize = extractPageSizeFromStandardParams(params)
    const page = extractPageFromStandardParams(params, pageSize)
    setPagination(page, pageSize)
    await loadData(params)
}
```

## 🔧 Migration des Composables Existants

Pour migrer un composable existant :

1. **Remplacer les handlers individuels** par `createUnifiedDataTableHandlers()`
2. **Utiliser les helpers d'extraction** pour synchroniser l'état
3. **Simplifier les props** avec `createStandardDataTableProps()`
4. **Supprimer les convertisseurs** qui ne sont plus nécessaires

