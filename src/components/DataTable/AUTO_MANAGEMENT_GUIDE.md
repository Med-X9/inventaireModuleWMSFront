# 🚀 Guide : DataTable avec Gestion Automatique

## Vue d'ensemble

Le DataTable peut maintenant gérer **automatiquement** tout en interne :
- ✅ Sélection des lignes
- ✅ Filtres
- ✅ Tri (simple et multi-colonnes)
- ✅ Recherche globale
- ✅ Pagination (côté client et serveur)
- ✅ QueryModel

**Aucune configuration nécessaire** - tout est géré automatiquement !

## 🎯 Utilisation Simple

### Exemple Minimal

```vue
<template>
    <DataTable
        :columns="columns"
        :rowDataProp="data"
        :actions="actions"
        :enableAutoManagement="true"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'

const columns = [
    { field: 'name', headerName: 'Nom', sortable: true, filterable: true },
    { field: 'status', headerName: 'Statut', sortable: true, filterable: true }
]

const data = ref([
    { id: 1, name: 'Item 1', status: 'ACTIF' },
    { id: 2, name: 'Item 2', status: 'INACTIF' }
])

const actions = [
    { label: 'Voir', onClick: (row) => console.log(row) }
]
</script>
```

**C'est tout !** Le DataTable gère automatiquement :
- La sélection des lignes
- Les filtres
- Le tri
- La recherche globale
- La pagination

## 🔧 Configuration Avancée (Optionnelle)

### Avec Pagination Côté Serveur

```vue
<DataTable
    :columns="columns"
    :rowDataProp="data"
    :actions="actions"
    :enableAutoManagement="true"
    :autoManagementConfig="{
        endpoint: '/api/inventories',
        defaultPageSize: 20,
        enableRowSelection: true,
        enableMultiSort: true
    }"
/>
```

### Avec Pinia Store

```vue
<DataTable
    :columns="columns"
    :rowDataProp="data"
    :actions="actions"
    :enableAutoManagement="true"
    :autoManagementConfig="{
        piniaStore: inventoryStore,
        storeAction: 'fetchInventories',
        defaultPageSize: 20
    }"
/>
```

## 📋 Fonctionnalités Automatiques

### 1. Sélection des Lignes

**Activée automatiquement** si `enableRowSelection: true` dans la config.

- Checkbox dans l'en-tête pour sélectionner tout
- Checkbox par ligne
- Gestion automatique de l'état de sélection

### 2. Filtres

**Activés automatiquement** selon la configuration des colonnes (`filterable: true`).

- Filtres texte pour `dataType: 'text'`
- Filtres nombre pour `dataType: 'number'`
- Filtres date pour `dataType: 'date'`
- Filtres Set (checkboxes) pour `dataType: 'select'` avec `filterConfig.options`

### 3. Tri

**Activé automatiquement** selon la configuration des colonnes (`sortable: true`).

- Tri simple : un clic = tri asc, deux clics = tri desc, trois clics = pas de tri
- Tri multi-colonnes : si `enableMultiSort: true`, jusqu'à 3 colonnes triables simultanément

### 4. Recherche Globale

**Activée automatiquement** si `enableGlobalSearch: true` (par défaut).

- Recherche dans toutes les colonnes
- Debounce automatique
- Réinitialise la pagination à la page 1

### 5. Pagination

**Activée automatiquement** si `pagination: true` (par défaut).

- Pagination côté client si pas d'endpoint/store
- Pagination côté serveur si endpoint/store fourni
- Taille de page configurable (10, 20, 50, 100, 200, 500)

## 🎨 Exemple Complet

```vue
<template>
    <DataTable
        :columns="columns"
        :rowDataProp="inventories"
        :actions="actions"
        
        <!-- Gestion automatique complète -->
        :enableAutoManagement="true"
        :autoManagementConfig="{
            piniaStore: inventoryStore,
            storeAction: 'fetchInventories',
            defaultPageSize: 20,
            enableRowSelection: true,
            enableMultiSort: true,
            enableSetFilters: true
        }"
        
        <!-- Fonctionnalités optionnelles -->
        :enableFiltering="true"
        :enableGlobalSearch="true"
        :showColumnSelector="true"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import { useInventoryStore } from '@/stores/inventory'

const inventoryStore = useInventoryStore()

const columns = [
    { 
        field: 'label', 
        headerName: 'Libellé', 
        sortable: true, 
        filterable: true,
        dataType: 'text'
    },
    { 
        field: 'status', 
        headerName: 'Statut', 
        sortable: true, 
        filterable: true,
        dataType: 'select',
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
    }
]

const inventories = ref([])
const actions = [
    { label: 'Détail', onClick: (row) => console.log(row) }
]
</script>
```

## 🔄 Flux Automatique

```
Utilisateur interagit (tri, filtre, recherche, pagination)
    ↓
DataTable détecte l'événement
    ↓
useAutoDataTable gère automatiquement
    ↓
QueryModel mis à jour
    ↓
Données rechargées (côté client ou serveur)
    ↓
Interface mise à jour automatiquement
```

## ✅ Avantages

1. **Zéro configuration** : Tout fonctionne automatiquement
2. **Type-safe** : Typage TypeScript complet
3. **QueryModel intégré** : Format unifié pour toutes les requêtes
4. **Flexible** : Support pagination côté client et serveur
5. **Performant** : Optimisations automatiques

## 📚 Documentation Complète

- QueryModel : `QUERYMODEL_DOCUMENTATION.md`
- Fonctionnalités AG-Grid : `AG_GRID_FEATURES.md`
- DataTable : `DATATABLE_DOCUMENTATION.md`

