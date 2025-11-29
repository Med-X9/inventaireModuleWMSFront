# 💾 Sauvegarde de Configuration du DataTable

Le DataTable peut maintenant sauvegarder automatiquement la configuration de l'utilisateur dans le `localStorage` du navigateur.

## 📋 Fonctionnalités Sauvegardées

La configuration suivante est automatiquement sauvegardée et restaurée :

- ✅ **Colonnes visibles** : Quelles colonnes sont affichées
- ✅ **Ordre des colonnes** : L'ordre dans lequel les colonnes apparaissent
- ✅ **Largeurs des colonnes** : La largeur personnalisée de chaque colonne
- ✅ **Colonnes épinglées** : Les colonnes fixées à gauche ou à droite
- ✅ **Header sticky** : Si le header est fixé en haut lors du scroll
- ✅ **Taille de page** : Le nombre d'éléments par page

## 🚀 Utilisation

### Activation Basique

Pour activer la sauvegarde, il suffit de fournir une `storageKey` unique au composant DataTable :

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    storageKey="inventory-results"
    :enableColumnPinning="true"
    ...
  />
</template>
```

### Clé de Stockage

La `storageKey` doit être **unique** pour chaque DataTable dans votre application. Elle est utilisée pour créer une clé dans le `localStorage` :

- Format de la clé : `datatable_config_${storageKey}`
- Exemple : `datatable_config_inventory-results`

### Exemples de Clés Recommandées

```vue
<!-- Résultats d'inventaire -->
<DataTable storageKey="inventory-results" ... />

<!-- Gestion des jobs -->
<DataTable storageKey="job-management" ... />

<!-- Planning -->
<DataTable storageKey="planning-jobs" ... />

<!-- Emplacements -->
<DataTable storageKey="locations" ... />
```

## 🔧 Utilisation Avancée

### Accès Programmatique à la Configuration

Si vous avez besoin d'accéder ou de modifier la configuration programmatiquement, vous pouvez utiliser le composable `useDataTableConfig` directement :

```typescript
import { useDataTableConfig } from '@/components/DataTable/composables/useDataTableConfig'

const tableConfig = useDataTableConfig('my-table-key', {
  visibleColumns: ['id', 'name', 'status'],
  columnWidths: { id: 100, name: 200 },
  stickyHeader: true,
  pageSize: 20
})

// Charger la configuration
tableConfig.loadConfig()

// Réinitialiser aux valeurs par défaut
tableConfig.resetConfig()

// Mettre à jour manuellement
tableConfig.updateVisibleColumns(['id', 'name'])
tableConfig.updateStickyHeader(true)
```

## 📦 Structure des Données Sauvegardées

La configuration est sauvegardée au format JSON dans le `localStorage` :

```json
{
  "visibleColumns": ["__rowNumber__", "id", "name", "status"],
  "columnOrder": ["__rowNumber__", "id", "name", "status"],
  "columnWidths": {
    "id": 100,
    "name": 200,
    "status": 150
  },
  "pinnedColumns": [
    { "field": "id", "pinned": "left" }
  ],
  "stickyHeader": true,
  "pageSize": 20,
  "filters": {},
  "sort": []
}
```

## 🔄 Comportement

### Chargement Automatique

- La configuration est **automatiquement chargée** au montage du composant
- Si aucune configuration n'existe, les valeurs par défaut sont utilisées
- Les modifications sont **automatiquement sauvegardées** en temps réel

### Synchronisation

- Les changements de colonnes visibles sont sauvegardés immédiatement
- Les changements de largeurs sont sauvegardés immédiatement
- Les changements de pinning sont sauvegardés immédiatement
- Les changements de sticky header sont sauvegardés immédiatement

## 🗑️ Réinitialisation

Pour réinitialiser la configuration d'un DataTable, vous pouvez :

1. **Via le gestionnaire de colonnes** : Cliquer sur "Réinitialiser"
2. **Via le code** : Utiliser `tableConfig.resetConfig()`
3. **Manuellement** : Supprimer la clé du `localStorage` :
   ```javascript
   localStorage.removeItem('datatable_config_inventory-results')
   ```

## ⚠️ Notes Importantes

1. **Clé Unique** : Chaque DataTable doit avoir une `storageKey` unique
2. **localStorage** : Les données sont stockées dans le navigateur de l'utilisateur
3. **Par Utilisateur** : Chaque utilisateur a sa propre configuration
4. **Par Navigateur** : La configuration est spécifique au navigateur
5. **Limite de Taille** : Le `localStorage` a une limite de ~5-10MB

## 🎯 Exemple Complet

```vue
<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import type { DataTableColumn } from '@/components/DataTable/types/dataTable'

const columns = ref<DataTableColumn[]>([
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'name', headerName: 'Nom', width: 200 },
  { field: 'status', headerName: 'Statut', width: 150 }
])

const data = ref([
  { id: 1, name: 'Item 1', status: 'Actif' },
  { id: 2, name: 'Item 2', status: 'Inactif' }
])
</script>

<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    storageKey="my-custom-table"
    :enableColumnPinning="true"
    :enableFiltering="true"
    :pagination="true"
  />
</template>
```

## 🔍 Débogage

Pour voir la configuration sauvegardée dans le navigateur :

1. Ouvrir les **Outils de développement** (F12)
2. Aller dans l'onglet **Application** (Chrome) ou **Stockage** (Firefox)
3. Sélectionner **Local Storage**
4. Chercher la clé `datatable_config_${yourStorageKey}`

