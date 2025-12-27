# 📋 Guide d'Utilisation DataTable - Nouvelle Version

## 🎯 Vue d'ensemble

Le DataTable a été refactorisé pour supporter tous les usages (simple ou complexe) avec **QueryModel obligatoire**. Le composant détecte automatiquement le mode d'usage et applique les optimisations appropriées.

## 🚀 Démarrage Rapide

### **Mode Simple (Server-Side)**
```vue
<template>
  <DataTable
    :columns="columns"
    :data-url="apiEndpoint"
    storage-key="my-table"
    @query-model-changed="handleQueryChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'

const columns = ref([
  { field: 'id', headerName: 'ID', dataType: 'number' },
  { field: 'name', headerName: 'Nom', dataType: 'text' },
  { field: 'email', headerName: 'Email', dataType: 'email' }
])

const handleQueryChange = (queryModel: QueryModel) => {
  console.log('QueryModel changé:', queryModel)
  // Envoyer à votre API pour récupérer les données filtrées/triées/paginées
}
</script>
```

### **Mode Advanced (Toutes fonctionnalités)**
```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="clientData"
    :enable-row-selection="true"
    :enable-column-resize="true"
    :enable-export="true"
    :export-formats="['csv', 'excel']"
    storage-key="advanced-table"
    @query-model-changed="handleQueryChange"
    @selection-changed="handleSelection"
  >
    <!-- Actions personnalisées -->
    <template #actions="{ row }">
      <button @click="editRow(row)" class="btn btn-primary btn-sm">
        Modifier
      </button>
    </template>
  </DataTable>
</template>
```

## 🎭 Modes d'Usage Automatiques

### **Mode Simple** 🔰
- **Détection** : Configuration basique, peu de props activées
- **Optimisations** :
  - Server-side activé par défaut si `dataUrl` fourni
  - Features avancées désactivées
  - Bundle optimisé
- **Usage** : Tables simples avec pagination/tri/filtrage

### **Mode Advanced** ⚡
- **Détection** : Features étendues activées (resize, pinning, export, etc.)
- **Optimisations** :
  - Toutes les features essentielles activées
  - Performance équilibrée
  - Persistance automatique
- **Usage** : Applications métier avec fonctionnalités avancées

### **Mode Enterprise** 🚀
- **Détection** : Features complexes (pivot, virtual scrolling, master-detail)
- **Optimisations** :
  - Toutes les features disponibles
  - Optimisations performance maximales
  - Lazy-loading des composants lourds
- **Usage** : Applications complexes avec de gros volumes

## 🔄 QueryModel Obligatoire

### **Structure du QueryModel**
```typescript
interface QueryModel {
  pagination: {
    page: number
    pageSize: number
  }
  sort: Array<{
    field: string
    direction: 'asc' | 'desc'
  }>
  filters: Array<{
    field: string
    operator: FilterOperator
    value: any
  }>
  search?: string
  customParams?: Record<string, any>
}
```

### **Utilisation dans l'API**
```javascript
// Dans votre gestionnaire @query-model-changed
const handleQueryChange = async (queryModel) => {
  try {
    // Construire les paramètres pour votre API
    const params = {
      page: queryModel.pagination.page,
      pageSize: queryModel.pagination.pageSize,
      sort: queryModel.sort,
      filters: queryModel.filters,
      search: queryModel.search,
      ...queryModel.customParams
    }

    // Appel API
    const response = await api.get('/data', { params })
    const data = response.data

    // Mettre à jour vos données
    tableData.value = data.items
    totalItems.value = data.total

  } catch (error) {
    console.error('Erreur chargement données:', error)
  }
}
```

## 🎨 Personnalisation

### **Colonnes**
```typescript
const columns = ref([
  {
    field: 'name',
    headerName: 'Nom',
    dataType: 'text',
    sortable: true,
    filterable: true,
    width: 200,
    valueFormatter: (value) => value?.toUpperCase()
  },
  {
    field: 'status',
    headerName: 'Statut',
    dataType: 'select',
    filterable: true,
    badgeStyles: [
      { value: 'active', class: 'bg-green-100 text-green-800' },
      { value: 'inactive', class: 'bg-red-100 text-red-800' }
    ]
  }
])
```

### **Actions Personnalisées**
```vue
<template #actions="{ row }">
  <div class="flex space-x-2">
    <button @click="viewRow(row)" class="btn btn-info btn-sm">
      👁️ Voir
    </button>
    <button @click="editRow(row)" class="btn btn-primary btn-sm">
      ✏️ Modifier
    </button>
    <button @click="deleteRow(row)" class="btn btn-danger btn-sm">
      🗑️ Supprimer
    </button>
  </div>
</template>
```

## 🔧 Configuration Avancée

### **Persistance Automatique**
```vue
<DataTable
  :columns="columns"
  :data-url="apiEndpoint"
  storage-key="user-preferences"
  @query-model-changed="handleQueryChange"
/>
```
- Sauvegarde automatique des préférences utilisateur
- Restauration à la prochaine visite
- Stockage local sécurisé

### **Virtual Scrolling (Grandes Listes)**
```vue
<DataTable
  :columns="columns"
  :data-url="apiEndpoint"
  :enable-virtual-scrolling="true"
  :virtual-scrolling-config="{
    itemHeight: 50,
    containerHeight: 600
  }"
  storage-key="large-table"
/>
```

### **Master-Detail**
```vue
<DataTable
  :columns="columns"
  :data-url="apiEndpoint"
  :enable-master-detail="true"
  :master-detail-config="{
    detailComponent: 'OrderDetails',
    detailHeight: 300
  }"
  storage-key="master-detail-table"
/>
```

## 🔄 Migration depuis l'Ancienne Version

### **Compatibilité Maintenue**
L'ancienne API fonctionne toujours mais émet des warnings :
```vue
<!-- Ancienne API (toujours supportée) -->
<DataTable
  :columns="columns"
  :rowDataProp="data"
  :pagination="true"
  :enableFiltering="true"
  @pagination-changed="handlePagination"  <!-- ⚠️ Deprecated -->
  @sort-changed="handleSort"              <!-- ⚠️ Deprecated -->
  @filter-changed="handleFilter"          <!-- ⚠️ Deprecated -->
/>

<!-- Nouvelle API recommandée -->
<DataTable
  :columns="columns"
  :data-url="apiEndpoint"
  storage-key="my-table"
  @query-model-changed="handleQueryModel"  <!-- ✅ Recommandé -->
/>
```

### **Migration Étape par Étape**
1. **Étape 1** : Ajouter `@query-model-changed` à côté des anciens events
2. **Étape 2** : Migrer la logique vers QueryModel
3. **Étape 3** : Supprimer les anciens events (optionnel)

## 🚨 Dépannage

### **Problèmes Courants**

#### **QueryModel pas reçu**
```javascript
// Vérifier que l'event est bien écouté
<DataTable @query-model-changed="handleQueryChange" />

// Vérifier que la fonction existe
const handleQueryChange = (queryModel) => {
  console.log('QueryModel:', queryModel) // Debug
}
```

#### **Données pas mises à jour**
```javascript
// S'assurer que les données sont réactives
const tableData = ref([])
const totalItems = ref(0)

const handleQueryChange = async (queryModel) => {
  const response = await api.get('/data', { params: queryModel })
  tableData.value = response.data.items
  totalItems.value = response.data.total
}
```

#### **Mode non détecté correctement**
```javascript
// Forcer un mode spécifique si nécessaire
<DataTable
  :columns="columns"
  :data-url="apiEndpoint"
  :enable-row-selection="true"  <!-- Force mode Advanced -->
  :enable-export="true"         <!-- Force mode Advanced -->
/>
```

## 📊 Métriques et Optimisations

Le DataTable fournit automatiquement des métriques d'usage :

```javascript
// Accéder aux métriques via l'expose du composant
const dataTableRef = ref()
const metrics = dataTableRef.value.modes.detectedMode
console.log('Mode détecté:', metrics.mode)
console.log('Complexité:', metrics.complexity)
console.log('Optimisations recommandées:', metrics.recommendedOptimizations)
```

## 🎉 Prêt à l'Emploi !

Le nouveau DataTable est maintenant **prêt pour tous vos usages** :

- ✅ **Simple** : Configuration minimale, performant
- ✅ **Advanced** : Fonctionnalités complètes, équilibré
- ✅ **Enterprise** : Hautes performances, toutes features
- ✅ **QueryModel** : Communication unifiée
- ✅ **Rétrocompatible** : Migration progressive
- ✅ **Auto-optimisé** : Détection automatique des besoins

Commencez par le **mode Simple** et activez les features selon vos besoins ! 🚀
