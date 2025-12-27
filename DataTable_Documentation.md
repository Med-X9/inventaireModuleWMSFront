# 📊 DataTable - Documentation Complète

## 🎯 Vue d'ensemble

Le DataTable est un composant Vue 3 ultra-performant pour l'affichage et la manipulation de données tabulaires avec des fonctionnalités avancées de gestion côté serveur et client.

### ✨ Fonctionnalités Principales

- ✅ **Pagination côté serveur** - ACTIVÉ PAR DÉFAUT (gestion efficace de gros volumes)
- ✅ **Tri multi-colonnes** - ACTIVÉ PAR DÉFAUT (tri complexe avec plusieurs niveaux)
- ✅ **Filtrage avancé** - ACTIVÉ PAR DÉFAUT (filtres par colonne avec opérateurs)
- ✅ **Recherche globale** - ACTIVÉE PAR DÉFAUT (recherche full-text avec debounce)
- ✅ **Épinglage de colonnes** - ACTIVÉ PAR DÉFAUT (colonnes fixes à gauche/droite)
- ✅ **Redimensionnement** - ACTIVÉ PAR DÉFAUT (ajustement dynamique des largeurs)
- ✅ **Persistance automatique** - ACTIVÉE PAR DÉFAUT (sauvegarde des préférences utilisateur)
- ✅ **Export** - CSV, Excel, PDF avec personnalisation
- ✅ **Actions personnalisées** - Menus contextuels par ligne
- ✅ **Sélection multiple** - OPTIONNEL (cases à cocher avec gestion d'état)
- ✅ **Édition inline** - OPTIONNEL (modification directe des cellules)
- ✅ **Virtual Scrolling** - **AUTO-ACTIVÉ** dès 50+ lignes (évite les plants)

---

## 🔧 Installation & Import

```typescript
import DataTable from '@/components/DataTable/DataTable.vue'
import type { DataTableColumn, ActionConfig } from '@/types/dataTable'
```

---

## 📋 Props Principales

### Props Obligatoires

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `DataTableColumn[]` | **CRITIQUE** - Configuration des colonnes du tableau |
| `actions` | `ActionConfig[]` | **CRITIQUE** - Actions disponibles sur chaque ligne |

### Props de Configuration Générale

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `rowDataProp` | `any[]` | `[]` | Données à afficher (optionnel pour server-side) |
| `serverSidePagination` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Pagination côté serveur |
| `serverSideFiltering` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Filtrage côté serveur |
| `serverSideSorting` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Tri côté serveur |
| `pagination` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Pagination active |
| `enableFiltering` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Filtres de colonnes |
| `enableGlobalSearch` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Recherche globale |
| `enableMultiSort` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Tri multi-colonnes |
| `enableColumnPinning` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Épinglage colonnes |
| `enableColumnResize` | `boolean` | `true` | **ACTIVÉ PAR DÉFAUT** - Redimensionnement |
| `storageKey` | `string` | `'datatable'` | **ACTIVÉ PAR DÉFAUT** - Persistance automatique |

### Props de Pagination

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `currentPageProp` | `number` | `undefined` | Page actuelle (contrôlée) |
| `totalPagesProp` | `number` | `undefined` | Nombre total de pages |
| `totalItemsProp` | `number` | `undefined` | Nombre total d'éléments |
| `pageSizeProp` | `number` | `20` | Taille de page par défaut |

### Props Avancées

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `enableMultiSort` | `boolean` | `true` | Tri multi-colonnes |
| `enableColumnPinning` | `boolean` | `true` | Épinglage de colonnes |
| `enableColumnResize` | `boolean` | `true` | Redimensionnement |
| `enableVirtualScrolling` | `boolean` | `false` | Virtual scrolling |
| `enableSetFilters` | `boolean` | `false` | Filtres par ensemble |
| `debounceFilter` | `number` | `300` | Délai debounce filtres (ms) |
| `maxRowsForDynamicHeight` | `number` | `undefined` | Hauteur dynamique |

---

## 🟢 **ACTIVÉ PAR DÉFAUT (Fonctionne automatiquement)**

### ✅ Fonctionnalités Core (Activées automatiquement)
| Fonctionnalité | Valeur par défaut | Description |
|----------------|------------------|-------------|
| **Pagination côté serveur** | `serverSidePagination: true` | Pagination serveur automatique |
| **Filtrage côté serveur** | `serverSideFiltering: true` | Filtres serveur automatiques |
| **Tri côté serveur** | `serverSideSorting: true` | Tri serveur automatique |
| **Tri des colonnes** | `sortable: true` | Toutes les colonnes sont triables par défaut |
| **Filtrage** | `enableFiltering: true` | Filtres par colonne activés |
| **Recherche globale** | `enableGlobalSearch: true` | Barre de recherche globale |
| **Pagination** | `pagination: true` | Pagination activée (côté serveur) |
| **Tri multi-colonnes** | `enableMultiSort: true` | Tri sur plusieurs colonnes |
| **Épinglage colonnes** | `enableColumnPinning: true` | Colonnes peuvent être épinglées |
| **Redimensionnement** | `enableColumnResize: true` | Colonnes redimensionnables |
| **Persistance automatique** | `storageKey: 'datatable'` | Sauvegarde des préférences utilisateur |

---

## 🟡 **OPTIONNEL (Configuration explicite requise)**

### Fonctionnalités Auto-Activées (Intelligent)
| Fonctionnalité | Activation automatique | Description |
|----------------|----------------------|-------------|
| **Virtual Scrolling** | **Dès 50+ lignes** | Évite les plants de performance automatiquement |
| **Pagination intelligente** | **Dès 100+ lignes** | Active la pagination pour de gros volumes |
| **Server-Side forcé** | **Dès 500+ lignes** | Bascule automatiquement côté serveur |

### Fonctionnalités Avancées (Désactivées par défaut)
| Fonctionnalité | Valeur par défaut | Quand l'activer |
|----------------|------------------|-----------------|
| **Sélection multiple** | `rowSelection: false` | Pour sélectionner plusieurs lignes |
| **Édition inline** | `inlineEditing: false` | Pour modifier directement les cellules |
| **Groupement** | `enableGrouping: false` | Pour grouper les données |
| **Pivot** | `enablePivot: false` | Pour les tableaux croisés dynamiques |
| **Master/Detail** | `enableMasterDetail: false` | Pour afficher des détails étendus |
| **Scroll infini** | `enableInfiniteScroll: false` | Pour chargement continu |
| **Filtres par ensemble** | `enableSetFilters: false` | Filtres par liste de valeurs |

---

## 🎨 Configuration des Colonnes

### Interface DataTableColumn

```typescript
interface DataTableColumn<T = Record<string, unknown>> {
  // Identification
  headerName: string           // Titre affiché dans l'en-tête
  field: string               // Nom du champ dans les données

  // Comportement
  sortable?: boolean          // Tri activé (défaut: true)
  filterable?: boolean        // Filtre activé (défaut: true)
  editable?: boolean          // Édition activée (défaut: false)
  visible?: boolean           // Colonne visible (défaut: true)
  hide?: boolean             // Colonne cachée (défaut: false)
  draggable?: boolean         // Peut être déplacée (défaut: true)

  // Apparence
  width?: number             // Largeur fixe en px
  minWidth?: number          // Largeur minimale
  maxWidth?: number          // Largeur maximale
  flex?: number              // Largeur flexible (ratio)
  align?: 'left' | 'center' | 'right' // Alignement (défaut: 'left')

  // Métadonnées
  dataType?: ColumnDataType   // Type de données pour le rendu
  icon?: string              // Icône FontAwesome
  description?: string       // Tooltip d'aide

  // Configuration avancée
  badgeStyles?: BadgeStyle[]  // Styles pour badges/status
  filterConfig?: FilterConfig // Configuration filtre personnalisé
  aggregation?: AggregationConfig // Configuration agrégation

  // Callbacks
  valueFormatter?: (value: any, row: T) => string
  cellRenderer?: (params: CellRendererParams<T>) => VNode
}
```

### Types de Données Supportés

```typescript
type ColumnDataType =
  | 'text'        // Texte simple
  | 'number'      // Nombre avec formatage
  | 'date'        // Date (DD/MM/YYYY)
  | 'datetime'    // Date et heure
  | 'boolean'     // Case à cocher
  | 'select'      // Sélection depuis liste
  | 'email'       // Email avec lien mailto
  | 'url'         // URL avec lien externe
  | 'phone'       // Téléphone avec lien tel
  | 'currency'    // Devise avec symbole
  | 'percentage'  // Pourcentage
  | 'file'        // Fichier avec téléchargement
  | 'image'       // Image avec aperçu
```

### Exemple de Configuration

```typescript
const columns: DataTableColumn[] = [
  {
    headerName: 'Nom',
    field: 'name',
    sortable: true,
    filterable: true,
    dataType: 'text',
    width: 200,
    icon: 'icon-user',
    description: 'Nom complet de l\'utilisateur'
  },
  {
    headerName: 'Statut',
    field: 'status',
    sortable: true,
    dataType: 'select',
    width: 150,
    badgeStyles: [
      { value: 'ACTIVE', class: 'bg-green-100 text-green-800' },
      { value: 'INACTIVE', class: 'bg-red-100 text-red-800' }
    ],
    filterConfig: {
      dataType: 'select',
      operator: 'in',
      options: [
        { value: 'ACTIVE', label: 'Actif' },
        { value: 'INACTIVE', label: 'Inactif' }
      ]
    }
  }
]
```

---

## ⚡ Configuration des Actions

### Interface ActionConfig

```typescript
interface ActionConfig<T = any> {
  label: string | ((item: T) => string)  // Label fixe ou dynamique
  icon: Component                        // Composant icône Vue
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  onClick: (item: T) => void            // Handler du clic
  show?: (item: T) => boolean           // Condition d'affichage
  disabled?: (item: T) => boolean       // Condition de désactivation
  tooltip?: string | ((item: T) => string) // Tooltip d'aide
}
```

### Exemple d'Actions

```typescript
import IconEye from '@/components/icon/icon-eye.vue'
import IconEdit from '@/components/icon/icon-edit.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

const actions: ActionConfig[] = [
  {
    label: 'Voir',
    icon: IconEye,
    color: 'primary',
    onClick: (item) => router.push(`/view/${item.id}`)
  },
  {
    label: 'Modifier',
    icon: IconEdit,
    color: 'secondary',
    onClick: (item) => router.push(`/edit/${item.id}`),
    show: (item) => item.status !== 'ARCHIVED'
  },
  {
    label: 'Supprimer',
    icon: IconTrash,
    color: 'danger',
    onClick: async (item) => {
      if (confirm('Supprimer cet élément ?')) {
        await deleteItem(item.id)
      }
    },
    show: (item) => item.canDelete,
    disabled: (item) => item.isDeleting
  }
]
```

---

## 📡 Événements

### Événements de Navigation

| Événement | Payload | Description |
|-----------|---------|-------------|
| `pagination-changed` | `QueryModel` | Changement de page ou taille de page |
| `sort-changed` | `QueryModel` | Modification du tri |
| `filter-changed` | `QueryModel` | Application d'un filtre |
| `global-search-changed` | `QueryModel` | Saisie dans la recherche globale |

### Événements d'Interaction

| Événement | Payload | Description |
|-----------|---------|-------------|
| `selection-changed` | `Set<string>` | Modification de la sélection |
| `cell-value-changed` | `CellEditEvent` | Modification d'une valeur de cellule |
| `row-clicked` | `any` | Clic sur une ligne |
| `row-double-clicked` | `any` | Double-clic sur une ligne |

### Événements d'Export

| Événement | Payload | Description |
|-----------|---------|-------------|
| `export-csv` | - | Demande d'export CSV |
| `export-excel` | - | Demande d'export Excel |
| `export-pdf` | - | Demande d'export PDF |
| `export-selected-csv` | - | Export CSV des éléments sélectionnés |
| `export-selected-excel` | - | Export Excel des éléments sélectionnés |

---

## 🔄 QueryModel - Format Standard

### Interface QueryModel

```typescript
interface QueryModel {
  // Pagination
  page?: number              // Page actuelle (1-based)
  pageSize?: number          // Nombre d'éléments par page

  // Tri
  sort?: SortModel[]         // Configuration du tri

  // Filtrage
  filters?: Record<string, FilterValue> // Filtres actifs

  // Recherche
  search?: string            // Terme de recherche globale

  // Paramètres personnalisés
  customParams?: any         // Paramètres spécifiques à l'API
}

interface SortModel {
  colId: string              // ID de la colonne
  sort: 'asc' | 'desc'       // Direction du tri
}

interface FilterValue {
  filter: any               // Valeur du filtre
  operator: FilterOperator  // Opérateur de filtrage
  type?: string             // Type de filtre
}
```

### Opérateurs de Filtrage

```typescript
type FilterOperator =
  | 'equals'         // Égal à
  | 'not_equals'     // Différent de
  | 'contains'       // Contient
  | 'not_contains'   // Ne contient pas
  | 'starts_with'    // Commence par
  | 'ends_with'      // Termine par
  | 'greater_than'   // Supérieur à
  | 'less_than'      // Inférieur à
  | 'greater_than_or_equal' // Supérieur ou égal
  | 'less_than_or_equal'    // Inférieur ou égal
  | 'in'             // Dans la liste
  | 'not_in'         // Pas dans la liste
  | 'is_null'        // Est null
  | 'is_not_null'    // N'est pas null
```

---

## 🎛️ Fonctionnalités Avancées

### Virtual Scrolling (Auto-Activé)

**🚀 ACTIVATION AUTOMATIQUE :** Dès 50+ lignes pour éviter les plants !

```vue
<!-- Le virtual scrolling s'active automatiquement -->
<!-- Pas besoin de configuration manuelle -->
<DataTable
  :columns="columns"
  :actions="actions"
  :rowDataProp="largeDataset"  <!-- 50+ lignes = auto-activation -->
/>

<!-- Configuration manuelle si besoin -->
<DataTable
  :enableVirtualScrolling="true"  <!-- Forcer l'activation -->
  :virtualScrollingConfig="{
    itemHeight: 40,        // Hauteur d'une ligne en px
    containerHeight: 400,  // Hauteur du conteneur (auto-ajustée)
    overscan: 5           // Nombre de lignes supplémentaires à rendre
  }" />
```

**Hauteurs auto-ajustées selon le volume :**
- 50-500 lignes → 350px
- 500-1000 lignes → 400px
- 1000-2000 lignes → 450px
- 2000-5000 lignes → 500px
- 5000-10000 lignes → 600px
- 10000+ lignes → 800px

### Épinglage de Colonnes

```vue
<DataTable
  :enableColumnPinning="true"
  :columnPinningConfig="{
    defaultPinnedColumns: [
      { field: 'name', pinned: 'left' },
      { field: 'actions', pinned: 'right' }
    ]
  }" />
```

### Redimensionnement de Colonnes

```vue
<DataTable
  :enableColumnResize="true"
  :columnResizeConfig="{
    minWidth: 80,         // Largeur minimale
    maxWidth: 500,        // Largeur maximale
    defaultWidths: {      // Largeurs par défaut
      'name': 200,
      'email': 250
    }
  }" />
```

### Filtres par Ensemble

```vue
<DataTable
  :enableSetFilters="true"
  :setFiltersConfig="{
    extractUniqueValues: (field, data) => {
      if (field === 'status') {
        return ['ACTIVE', 'INACTIVE', 'PENDING']
      }
      return [...new Set(data.map(item => item[field]))]
    },
    formatValue: (value) => value || '(Vide)'
  }" />
```

---

## 💾 Persistance des Paramètres

Le DataTable sauvegarde automatiquement dans localStorage :

- **Colonnes visibles** - Quelles colonnes afficher/cacher
- **Largeurs de colonnes** - Tailles personnalisées
- **Tri actif** - Colonnes et directions de tri
- **Filtres actifs** - Tous les filtres appliqués
- **Taille de page** - Nombre d'éléments par page
- **Recherche globale** - Terme de recherche actif

```vue
<DataTable
  storageKey="my-data-table"
  :columns="columns"
  :actions="actions" />
```

---

## 🎨 Personnalisation CSS

### Classes Principales

```css
/* Conteneur principal */
.datatable-container {
  /* Styles personnalisés */
}

/* En-tête du tableau */
.datatable-header {
  /* Styles d'en-tête */
}

/* Corps du tableau */
.datatable-body {
  /* Styles du corps */
}

/* Lignes de données */
.datatable-row {
  /* Styles des lignes */
  transition: background-color 0.2s;
}

.datatable-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Cellules */
.datatable-cell {
  /* Styles des cellules */
}

/* Menu d'actions */
.datatable-actions {
  /* Styles du menu d'actions */
}
```

### Variables CSS

```css
:root {
  --datatable-primary-color: #3b82f6;
  --datatable-border-color: #e5e7eb;
  --datatable-hover-color: #f9fafb;
  --datatable-selection-color: #dbeafe;
}
```

---

## 🚀 Performance

### Optimisations Incluses

- ✅ **Memoization** - Cache des calculs coûteux
- ✅ **Lazy Loading** - Chargement à la demande
- ✅ **Virtual Scrolling** - Rendu optimisé pour 1000+ lignes
- ✅ **Debounced Search** - Recherche avec délai
- ✅ **Stable Keys** - Clés de rendu optimisées
- ✅ **Shallow Refs** - Réactivité optimisée

### Recommandations

```typescript
// Pour 1000+ lignes, activez le virtual scrolling
const config = {
  enableVirtualScrolling: true,
  virtualScrollingConfig: {
    itemHeight: 40,
    containerHeight: 600
  }
}

// Pour les gros volumes, utilisez la pagination serveur
const serverConfig = {
  serverSidePagination: true,
  serverSideFiltering: true,
  serverSideSorting: true
}
```

---

## 📝 Exemples d'Usage

### Exemple Simple

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="users"
    :actions="actions"
    @filter-changed="handleFilter" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'

const users = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com' }
])

const columns = [
  { headerName: 'Nom', field: 'name', sortable: true },
  { headerName: 'Email', field: 'email', filterable: true }
]

const actions = [
  {
    label: 'Voir',
    icon: IconEye,
    onClick: (user) => console.log('Voir', user)
  }
]

const handleFilter = (queryModel) => {
  // Traiter les filtres côté serveur
  fetchUsers(queryModel)
}
</script>
```

### Exemple Avancé avec Server-Side

```vue
<template>
  <DataTable
    :columns="columns"
    :actions="actions"
    :serverSidePagination="true"
    :serverSideFiltering="true"
    :serverSideSorting="true"
    :enableVirtualScrolling="true"
    :storageKey="'advanced-table'"
    @filter-changed="onFilterChanged"
    @pagination-changed="onPaginationChanged"
    @sort-changed="onSortChanged" />
</template>

<script setup lang="ts">
import { useInventoryManagement } from '@/composables/useInventoryManagement'

const {
  columns,
  actions,
  handlePaginationChanged,
  handleSortChanged,
  handleFilterChanged
} = useInventoryManagement()
</script>
```

---

## 🔧 Dépannage

### Problèmes Courants

#### "Données ne s'affichent pas"
```typescript
// Vérifiez la configuration serveur
const config = {
  serverSidePagination: true,  // Si vous utilisez une API
  serverSideFiltering: true,
  serverSideSorting: true
}

// Vérifiez les handlers d'événements
const handleFilterChanged = (queryModel) => {
  console.log('QueryModel:', queryModel)  // Debug
  // Appelez votre API ici
}
```

#### "Performance lente avec beaucoup de données"
```vue
// Le virtual scrolling s'active AUTOMATIQUEMENT dès 50+ lignes
// Si vous avez moins de 50 lignes et voulez quand même l'activer :
<DataTable
  :enableVirtualScrolling="true"
  :virtualScrollingConfig="{
    itemHeight: 40,
    containerHeight: 500
  }" />
```

#### "Erreur 'props undefined'"
```vue
// Ajoutez les props manquantes
<DataTable
  :columns="columns"
  :actions="actions"
  :advancedFilters="{}" />
```

#### "Colonnes ne se redimensionnent pas"
```vue
// Vérifiez la configuration
<DataTable
  :enableColumnResize="true"
  :columnResizeConfig="{
    minWidth: 80,
    maxWidth: 400
  }" />
```

---

## 📋 Checklist d'Implémentation

- [x] **Server-Side activé par défaut** (pagination, filtrage, tri)
- [x] **Persistance automatique** (sauvegarde des préférences)
- [x] **Virtual Scrolling automatique** (dès 50+ lignes pour éviter les plants)
- [ ] Définir les colonnes avec `DataTableColumn[]`
- [ ] Configurer les actions avec `ActionConfig[]`
- [ ] Implémenter les handlers d'événements (`@pagination-changed`, etc.)
- [ ] Tester avec des données réelles
- [ ] Activer les fonctionnalités optionnelles si nécessaire :
  - [ ] `rowSelection: true` pour sélection multiple
  - [ ] `inlineEditing: true` pour édition directe
  - [ ] Autres fonctionnalités avancées selon les besoins

---

## 📋 **RÉSUMÉ RAPIDE - Ce qui est ACTIVÉ/DÉSACTIVÉ**

### ✅ **ACTIVÉ PAR DÉFAUT (aucune config nécessaire)**
- **Server-Side Operations** : Pagination, filtrage, tri côté serveur
- **UI Core** : Tri colonnes, filtres, recherche globale, pagination
- **UX Enhancements** : Multi-tri, épinglage colonnes, redimensionnement
- **Performance Auto** : Virtual scrolling dès 50+ lignes (évite les plants)
- **Persistence** : Sauvegarde automatique des préférences utilisateur

### ⚙️ **OPTIONNEL (activation explicite requise)**
- **Sélection multiple** → `rowSelection: true`
- **Édition inline** → `inlineEditing: true`
- **Virtual Scrolling** → `enableVirtualScrolling: true`
- **Groupement** → `enableGrouping: true`
- **Pivot** → `enablePivot: true`
- **Master/Detail** → `enableMasterDetail: true`

### 🔧 **Configuration Minimale Requise**
```vue
<DataTable
  :columns="columns"
  :actions="actions"
  :rowDataProp="[]"
/>
```

**Toutes les fonctionnalités avancées sont automatiquement disponibles !**

---

## 🎯 Migration depuis l'ancienne version

### Changements Majeurs

1. **Props renommées** :
   - `rowData` → `rowDataProp`
   - `currentPage` → `currentPageProp`
   - `totalPages` → `totalPagesProp`

2. **Nouveau format QueryModel** :
   ```typescript
   // Ancien format
   { page: 1, pageSize: 20, sort: 'name', filters: {...} }

   // Nouveau format
   {
     page: 1,
     pageSize: 20,
     sort: [{ colId: 'name', sort: 'asc' }],
     filters: { name: { filter: 'John', operator: 'contains' } }
   }
   ```

3. **Handlers unifiés** :
   ```typescript
   // Au lieu de plusieurs handlers séparés
   @page-changed="handlePage"
   @sort-changed="handleSort"
   @filter-changed="handleFilter"

   // Un seul handler QueryModel
   @filter-changed="handleQueryModel"
   ```

---

**🎉 Le DataTable est maintenant entièrement documenté et prêt à être utilisé !**

Pour toute question supplémentaire, consultez les exemples dans le code source ou contactez l'équipe de développement.
