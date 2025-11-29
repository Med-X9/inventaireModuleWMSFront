# 📋 Exemple Complet : InventoryManagement avec Fonctionnalités AG-Grid

## Vue d'ensemble

Cet exemple montre comment utiliser toutes les nouvelles fonctionnalités AG-Grid dans le contexte de la gestion des inventaires.

## 🎯 Fonctionnalités Démonstrées

### 1. Tri Multi-Colonnes

**Comment tester :**
1. Cliquez sur la colonne "Libellé" → Premier tri (priorité 1)
2. Cliquez sur la colonne "Date" → Second tri (priorité 2)
3. Cliquez sur la colonne "Statut" → Troisième tri (priorité 3)
4. Cliquez à nouveau sur "Libellé" → Change la direction ou supprime le tri

**Code :**
```vue
:enableMultiSort="true"
:multiSortConfig="{ maxSortColumns: 3 }"
```

### 2. Épinglage de Colonnes

**Comment tester :**
1. Cliquez sur l'icône de gestion des colonnes dans la toolbar
2. Épinglez "Libellé" à gauche
3. Faites défiler horizontalement → "Libellé" reste visible

**Code :**
```vue
:enableColumnPinning="true"
:columnPinningConfig="{
    defaultPinnedColumns: [
        { field: 'label', pinned: 'left' }
    ]
}"
```

### 3. Redimensionnement de Colonnes

**Comment tester :**
1. Survolez la bordure droite d'une colonne
2. Le curseur change en `↔`
3. Glissez pour redimensionner
4. La largeur est sauvegardée automatiquement

**Code :**
```vue
:enableColumnResize="true"
:columnResizeConfig="{
    minWidth: 100,
    maxWidth: 500,
    defaultWidths: {
        'label': 200,
        'status': 150,
        'date': 120
    }
}"
```

### 4. Filtres Set (Valeurs Uniques)

**Comment tester :**
1. Cliquez sur le filtre de la colonne "Statut"
2. Vous voyez une liste de checkboxes :
   - ☐ EN PREPARATION
   - ☐ EN REALISATION
   - ☐ TERMINE
   - ☐ CLOTURE
3. Cochez plusieurs statuts
4. Cliquez sur "Appliquer"
5. Le tableau affiche uniquement les inventaires avec les statuts sélectionnés

**Code :**
```vue
:enableSetFilters="true"
:setFiltersConfig="{
    extractUniqueValues: (field, data) => {
        if (field === 'status') {
            return ['EN PREPARATION', 'EN REALISATION', 'TERMINE', 'CLOTURE']
        }
        return [...new Set(data.map(row => row[field]).filter(v => v != null))]
    }
}"
```

### 5. Export avec Filtres/Tri

**Comment tester :**
1. Appliquez des filtres et/ou des tris
2. Cliquez sur "Exporter Excel" ou "Exporter CSV"
3. Le fichier exporté contient uniquement les données filtrées/triées

**Code :**
```typescript
const { exportToExcel, exportToCsv } = useDataTableExport(store, {
    pagination,
    sortModel,
    filters,
    searchQuery
})

await exportToExcel({
    vuexAction: 'fetchInventories',
    filename: 'inventaires'
})
```

## 📊 Configuration Complète

```vue
<DataTable
    <!-- Configuration de base -->
    :columns="columns"
    :rowDataProp="inventories"
    :actions="actions"
    :pagination="true"
    :enableFiltering="true"
    :enableGlobalSearch="true"
    
    <!-- Pagination/Tri/Filtrage côté serveur -->
    :serverSidePagination="true"
    :serverSideFiltering="true"
    :serverSideSorting="true"
    
    <!-- 🚀 Fonctionnalités AG-Grid -->
    :enableMultiSort="true"
    :multiSortConfig="{ maxSortColumns: 3 }"
    :enableColumnPinning="true"
    :enableColumnResize="true"
    :enableSetFilters="true"
    
    <!-- Événements -->
    @pagination-changed="handlePaginationChanged"
    @sort-changed="handleSortChanged"
    @filter-changed="handleFilterChanged"
    @global-search-changed="handleGlobalSearchChanged"
/>
```

## 🔧 Handlers d'Événements

### Pagination

```typescript
const handlePaginationChanged = async (params: StandardDataTableParams | { page: number; pageSize: number }) => {
    if ('page' in params) {
        // Format simple
        currentPage.value = params.page
        pageSize.value = params.pageSize
    } else {
        // Format standard DataTable
        const extracted = extractFromStandardParams(params)
        currentPage.value = extracted.page
        pageSize.value = extracted.pageSize
    }
    await loadData()
}
```

### Tri

```typescript
const handleSortChanged = async (params: StandardDataTableParams | Array<{ field: string; direction: 'asc' | 'desc' }>) => {
    if (Array.isArray(params)) {
        // Format simple
        sortModel.value = params.map(s => ({ colId: s.field, sort: s.direction }))
    } else {
        // Format standard DataTable
        const extracted = extractFromStandardParams(params)
        sortModel.value = extracted.sortModel
    }
    currentPage.value = 1 // Réinitialiser à la page 1
    await loadData()
}
```

### Filtres

```typescript
const handleFilterChanged = async (params: StandardDataTableParams | Record<string, any>) => {
    if ('filters' in params) {
        // Format standard DataTable
        const extracted = extractFromStandardParams(params)
        filters.value = extracted.filters
    } else {
        // Format simple
        filters.value = transformFilters(params)
    }
    currentPage.value = 1 // Réinitialiser à la page 1
    await loadData()
}
```

### Recherche Globale

```typescript
const handleGlobalSearchChanged = async (params: StandardDataTableParams | string) => {
    if (typeof params === 'string') {
        searchQuery.value = params
    } else {
        const extracted = extractFromStandardParams(params)
        searchQuery.value = extracted.searchQuery
    }
    currentPage.value = 1 // Réinitialiser à la page 1
    await loadData()
}
```

## 📝 Configuration des Colonnes

```typescript
const columns: DataTableColumn[] = [
    {
        field: 'label',
        headerName: 'Libellé',
        sortable: true,
        filterable: true,
        dataType: 'text',
        width: 200,
        // Épinglable à gauche
        pinned: 'left' // Optionnel
    },
    {
        field: 'status',
        headerName: 'Statut',
        sortable: true,
        filterable: true,
        dataType: 'select',
        // Configuration du filtre Set
        filterConfig: {
            dataType: 'select',
            operator: 'in',
            options: [
                { value: 'EN PREPARATION', label: 'EN PREPARATION' },
                { value: 'EN REALISATION', label: 'EN REALISATION' },
                { value: 'TERMINE', label: 'TERMINE' },
                { value: 'CLOTURE', label: 'CLOTURE' }
            ]
        }
    },
    {
        field: 'date',
        headerName: 'Date',
        sortable: true,
        filterable: true,
        dataType: 'date',
        width: 120
    }
]
```

## 🎨 Personnalisation

### Couleurs des Badges de Statut

```typescript
badgeStyles: [
    {
        value: 'EN PREPARATION',
        class: 'bg-yellow-50 text-yellow-800'
    },
    {
        value: 'EN REALISATION',
        class: 'bg-blue-50 text-blue-800'
    },
    {
        value: 'TERMINE',
        class: 'bg-green-50 text-green-800'
    },
    {
        value: 'CLOTURE',
        class: 'bg-gray-50 text-gray-800'
    }
]
```

## 🚀 Cas d'Usage Avancés

### 1. Tri Multi-Colonnes avec Priorité

```typescript
// L'utilisateur trie par :
// 1. Statut (asc) - Priorité 1
// 2. Date (desc) - Priorité 2
// 3. Libellé (asc) - Priorité 3

// Les données sont triées :
// 1. D'abord par Statut
// 2. Puis par Date (dans chaque groupe de statut)
// 3. Puis par Libellé (dans chaque groupe de date)
```

### 2. Épinglage Dynamique

```typescript
// Épingler une colonne programmatiquement
const pinColumn = (field: string, direction: 'left' | 'right') => {
    columnPinning.pinColumn(field, direction)
}

// Exemple : Épingler "Actions" à droite
pinColumn('actions', 'right')
```

### 3. Export Personnalisé

```typescript
// Exporter uniquement les colonnes visibles
const exportVisibleColumns = async () => {
    const visibleFields = columns
        .filter(col => col.visible !== false)
        .map(col => col.field)
    
    await exportToCsvClient(
        inventories.value,
        'inventaires',
        visibleFields
    )
}
```

## 📚 Ressources

- Documentation complète : `DATATABLE_DOCUMENTATION.md`
- Fonctionnalités AG-Grid : `AG_GRID_FEATURES.md`
- Composables : `src/components/DataTable/composables/`

