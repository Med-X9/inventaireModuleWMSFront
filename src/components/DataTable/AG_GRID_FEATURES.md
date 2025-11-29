# 🚀 Fonctionnalités AG-Grid Implémentées

## Vue d'ensemble

Toutes les fonctionnalités inspirées d'AG-Grid ont été intégrées dans le DataTable. Elles sont maintenant disponibles dans `InventoryManagement` pour test.

## ✅ Fonctionnalités Implémentées

### 1. ✅ Tri Multi-Colonnes (`enableMultiSort`)

Permet de trier par plusieurs colonnes simultanément (jusqu'à 3 par défaut).

**Configuration :**
```vue
<DataTable
  :enableMultiSort="true"
  :multiSortConfig="{ maxSortColumns: 3 }"
  ...
/>
```

**Utilisation :**
- Cliquez sur une colonne pour le premier tri
- Cliquez à nouveau sur une autre colonne pour ajouter un second tri
- Les numéros de priorité s'affichent sur les colonnes triées

### 2. ✅ Épinglage de Colonnes (`enableColumnPinning`)

Permet d'épingler des colonnes à gauche ou à droite.

**Configuration :**
```vue
<DataTable
  :enableColumnPinning="true"
  :columnPinningConfig="{
    defaultPinnedColumns: [
      { field: 'id', pinned: 'left' },
      { field: 'actions', pinned: 'right' }
    ]
  }"
  ...
/>
```

**Utilisation :**
- Via le gestionnaire de colonnes (bouton dans la toolbar)
- Les colonnes épinglées restent visibles lors du scroll horizontal

### 3. ✅ Redimensionnement de Colonnes (`enableColumnResize`)

Permet de redimensionner les colonnes par glisser-déposer.

**Configuration :**
```vue
<DataTable
  :enableColumnResize="true"
  :columnResizeConfig="{
    minWidth: 100,
    maxWidth: 500,
    defaultWidths: {
      'name': 200,
      'status': 150
    }
  }"
  ...
/>
```

**Utilisation :**
- Glissez la bordure droite d'une colonne pour la redimensionner
- Les largeurs sont sauvegardées dans le localStorage (via `storageKey`)

### 4. ✅ Filtres Set (`enableSetFilters`)

Affiche une liste de toutes les valeurs uniques disponibles pour sélection.

**Configuration :**
```vue
<DataTable
  :enableSetFilters="true"
  :setFiltersConfig="{
    extractUniqueValues: (field, data) => {
      // Fonction personnalisée pour extraire les valeurs uniques
      return [...new Set(data.map(row => row[field]))]
    },
    formatValue: (value) => {
      // Fonction personnalisée pour formater les valeurs
      return String(value)
    }
  }"
  ...
/>
```

**Utilisation :**
- Les colonnes avec `dataType: 'select'` et `filterConfig.options` affichent automatiquement les checkboxes
- Sélectionnez/désélectionnez les valeurs souhaitées
- Cliquez sur "Appliquer" pour filtrer

### 5. ✅ Scroll Infini (`enableInfiniteScroll`)

Charge les données progressivement lors du scroll.

**Configuration :**
```vue
<DataTable
  :enableInfiniteScroll="true"
  :infiniteScrollConfig="{
    batchSize: 50,
    threshold: 200,
    loadMore: async (startIndex, endIndex) => {
      // Fonction pour charger plus de données
      const response = await api.get('/data', {
        params: { start: startIndex, end: endIndex }
      })
      return response.data
    }
  }"
  ...
/>
```

### 6. ✅ Export CSV/Excel Amélioré

Export côté client et côté serveur amélioré.

**Utilisation :**
```typescript
import { useDataTableExport } from '@/components/DataTable/composables/useDataTableExport'

const { exportToCsvClient, exportToExcelClient } = useDataTableExport(store, {
  pagination,
  sortModel,
  filters,
  searchQuery
})

// Export côté client
exportToCsvClient(data.value, 'inventaires', ['label', 'status', 'date'])

// Export côté serveur (avec filtres, tri, etc.)
await exportToExcel({
  vuexAction: 'inventoryModule/exportInventories',
  filename: 'inventaires'
})
```

## 📝 Exemple Complet dans InventoryManagement

Le fichier `src/views/Inventory/Management/InventoryManagement.vue` contient un exemple complet :

```vue
<DataTable
  :columns="columns"
  :rowDataProp="inventories"
  :actions="actions"
  :serverSidePagination="true"
  :serverSideFiltering="true"
  :serverSideSorting="true"
  
  <!-- Nouvelles fonctionnalités AG-Grid -->
  :enableMultiSort="true"
  :multiSortConfig="{ maxSortColumns: 3 }"
  :enableColumnPinning="true"
  :enableColumnResize="true"
  :columnResizeConfig="{ minWidth: 100, maxWidth: 500 }"
  :enableSetFilters="true"
  
  @pagination-changed="handlePaginationChanged"
  @sort-changed="handleSortChanged"
  @filter-changed="handleFilterChanged"
  @global-search-changed="handleGlobalSearchChanged"
/>
```

## 🔧 Composables Disponibles

### `useMultiSort`
Gère le tri multi-colonnes.

```typescript
import { useMultiSort } from '@/components/DataTable/composables/useMultiSort'

const multiSort = useMultiSort([], { maxSortColumns: 3 })

// Ajouter un tri
multiSort.addSort('name', 'asc')

// Obtenir la direction d'un tri
const direction = multiSort.getSortDirection('name')

// Vérifier si une colonne est triée
const isSorted = multiSort.isSorted('name')
```

### `useColumnPinning`
Gère l'épinglage de colonnes.

```typescript
import { useColumnPinning } from '@/components/DataTable/composables/useColumnPinning'

const columnPinning = useColumnPinning(columnsRef, {
  defaultPinnedColumns: [
    { field: 'id', pinned: 'left' }
  ]
})

// Épingler une colonne
columnPinning.pinColumn('name', 'left')

// Désépingler
columnPinning.unpinColumn('name')

// Obtenir les colonnes ordonnées
const ordered = columnPinning.orderedColumns.value
```

### `useColumnResize`
Gère le redimensionnement de colonnes.

```typescript
import { useColumnResize } from '@/components/DataTable/composables/useColumnResize'

const columnResize = useColumnResize(columnsRef, {
  minWidth: 50,
  maxWidth: 1000
})

// Définir la largeur d'une colonne
columnResize.setColumnWidth('name', 200)

// Obtenir la largeur
const width = columnResize.getColumnWidth('name')

// Auto-size toutes les colonnes
columnResize.autoSizeAll()
```

### `useSetFilters`
Gère les filtres Set (valeurs uniques).

```typescript
import { useSetFilters } from '@/components/DataTable/composables/useSetFilters'

const setFilters = useSetFilters(columnsRef, dataRef, {
  extractUniqueValues: (field, data) => {
    return [...new Set(data.map(row => row[field]))]
  }
})

// Initialiser les options
setFilters.initializeAllFilterOptions()

// Toggle une valeur
setFilters.toggleValue('status', 'ACTIF')

// Appliquer le filtre
const filter = setFilters.applyFilter('status')
```

### `useInfiniteScroll`
Gère le scroll infini.

```typescript
import { useInfiniteScroll } from '@/components/DataTable/composables/useInfiniteScroll'

const infiniteScroll = useInfiniteScroll(containerRef, {
  batchSize: 50,
  threshold: 200,
  loadMore: async (start, end) => {
    const response = await api.get('/data', { params: { start, end } })
    return response.data
  }
})

// Réinitialiser
infiniteScroll.reset()
```

## 🎯 Tests dans InventoryManagement

Pour tester les nouvelles fonctionnalités :

1. **Tri Multi-Colonnes** :
   - Cliquez sur "Libellé" pour trier
   - Cliquez sur "Date" pour ajouter un second tri
   - Cliquez sur "Statut" pour ajouter un troisième tri

2. **Épinglage** :
   - Ouvrez le gestionnaire de colonnes (icône dans la toolbar)
   - Épinglez "Libellé" à gauche
   - Faites défiler horizontalement pour voir qu'il reste visible

3. **Redimensionnement** :
   - Glissez la bordure droite de la colonne "Libellé"
   - La largeur est sauvegardée automatiquement

4. **Filtres Set** :
   - Cliquez sur le filtre de la colonne "Statut"
   - Vous verrez une liste de checkboxes avec toutes les valeurs uniques
   - Sélectionnez plusieurs statuts et cliquez sur "Appliquer"

## 📚 Documentation Complète

Voir `DATATABLE_DOCUMENTATION.md` pour la documentation complète du DataTable.

