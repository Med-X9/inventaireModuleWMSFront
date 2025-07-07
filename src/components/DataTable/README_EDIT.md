# Édition par Cellule - DataTable

## 🎯 **Fonctionnalités Ajoutées**

Le composant `DataTable.vue` supporte maintenant l'édition par cellule avec les fonctionnalités suivantes :

### **1. Activation de l'Édition**
```vue
<DataTable 
    :inlineEditing="true"
    :columns="editableColumns"
    :rowDataProp="data"
    @cell-value-changed="handleCellChange"
/>
```

### **2. Configuration des Colonnes Éditables**
```typescript
const editableColumns = [
    {
        field: 'name',
        headerName: 'Nom',
        editable: true,                    // Rendre éditable
        cellEditor: 'agTextCellEditor'     // Éditeur de texte
    },
    {
        field: 'quantity',
        headerName: 'Quantité',
        editable: true,
        cellEditor: 'agNumberCellEditor'   // Éditeur numérique
    },
    {
        field: 'status',
        headerName: 'Statut',
        editable: true,
        cellEditor: 'agSelectCellEditor',  // Éditeur de sélection
        cellEditorParams: {
            values: ['Actif', 'Inactif', 'En attente']
        }
    },
    {
        field: 'date',
        headerName: 'Date',
        editable: true,
        cellEditor: 'agDateCellEditor'     // Éditeur de date
    }
]
```

### **3. Types d'Éditeurs Disponibles**

| Éditeur | Description | Exemple |
|---------|-------------|---------|
| `agTextCellEditor` | Texte simple | `{ cellEditor: 'agTextCellEditor' }` |
| `agNumberCellEditor` | Nombres | `{ cellEditor: 'agNumberCellEditor' }` |
| `agDateCellEditor` | Dates | `{ cellEditor: 'agDateCellEditor' }` |
| `agSelectCellEditor` | Sélection | `{ cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['A', 'B', 'C'] } }` |
| `agCheckboxCellEditor` | Checkbox | `{ cellEditor: 'agCheckboxCellEditor' }` |
| `agLargeTextCellEditor` | Texte long | `{ cellEditor: 'agLargeTextCellEditor' }` |

### **4. Gestion des Événements**
```typescript
// Événement quand une cellule change de valeur
const handleCellValueChanged = (event: CellValueChangedEvent) => {
    console.log('Cellule modifiée:', {
        row: event.rowIndex,
        column: event.column.getColId(),
        oldValue: event.oldValue,
        newValue: event.newValue,
        data: event.data
    })
    
    // Sauvegarder les modifications
    saveChanges(event)
}

// Événement quand l'édition s'arrête
const handleCellEditingStopped = (event: CellEditingStoppedEvent) => {
    console.log('Édition terminée:', event)
}
```

### **5. Validation Personnalisée**
```typescript
{
    field: 'email',
    headerName: 'Email',
    editable: true,
    cellEditor: 'agTextCellEditor',
    cellEditorParams: {
        // Validation en temps réel
        validator: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(value) ? true : 'Email invalide'
        }
    }
}
```

### **6. Navigation Clavier**
- **Enter** : Commencer l'édition ou naviguer vers le bas
- **Tab** : Naviguer vers la droite
- **Shift+Tab** : Naviguer vers la gauche
- **Escape** : Annuler l'édition

### **7. Exemple Complet**
```vue
<template>
    <div>
        <h2>Tableau avec Édition</h2>
        <DataTable 
            :columns="columns"
            :rowDataProp="tableData"
            :inlineEditing="true"
            :rowSelection="true"
            @cell-value-changed="handleCellChange"
            @selection-changed="handleSelectionChange"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import type { CellValueChangedEvent } from 'ag-grid-community'

// Données du tableau
const tableData = ref([
    { id: 1, name: 'Produit A', price: 100, quantity: 50, status: 'Actif' },
    { id: 2, name: 'Produit B', price: 200, quantity: 30, status: 'Inactif' },
    { id: 3, name: 'Produit C', price: 150, quantity: 75, status: 'En attente' }
])

// Configuration des colonnes
const columns = [
    {
        field: 'id',
        headerName: 'ID',
        editable: false // Non éditable
    },
    {
        field: 'name',
        headerName: 'Nom',
        editable: true,
        cellEditor: 'agTextCellEditor'
    },
    {
        field: 'price',
        headerName: 'Prix',
        editable: true,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
            min: 0,
            max: 1000
        }
    },
    {
        field: 'quantity',
        headerName: 'Quantité',
        editable: true,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
            min: 0
        }
    },
    {
        field: 'status',
        headerName: 'Statut',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: ['Actif', 'Inactif', 'En attente']
        }
    }
]

// Gestion des changements de cellules
const handleCellChange = (event: CellValueChangedEvent) => {
    console.log('🔄 Cellule modifiée:', {
        row: event.rowIndex,
        column: event.column.getColId(),
        oldValue: event.oldValue,
        newValue: event.newValue
    })
    
    // Mettre à jour les données locales
    const rowIndex = event.rowIndex
    const field = event.column.getColId()
    tableData.value[rowIndex][field] = event.newValue
    
    // Optionnel : Sauvegarder en base de données
    saveToDatabase(event)
}

// Gestion de la sélection
const handleSelectionChange = (selectedRows) => {
    console.log('📋 Lignes sélectionnées:', selectedRows)
}

// Fonction de sauvegarde (exemple)
const saveToDatabase = async (event) => {
    try {
        // Appel API pour sauvegarder
        await api.updateRow(event.data.id, {
            [event.column.getColId()]: event.newValue
        })
        console.log('✅ Données sauvegardées')
    } catch (error) {
        console.error('❌ Erreur de sauvegarde:', error)
    }
}
</script>
```

### **8. Styles Visuels**

Le composant inclut automatiquement :
- **Bordures colorées** pour les champs en édition
- **Animation de pulsation** lors de l'édition
- **Indicateurs visuels** au survol des cellules éditables
- **Support du mode sombre**

### **9. Propriétés Disponibles**

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `inlineEditing` | `boolean` | `false` | Active l'édition par cellule |
| `columns` | `DataTableColumn[]` | `[]` | Configuration des colonnes |
| `rowDataProp` | `T[]` | `[]` | Données du tableau |

### **10. Événements Disponibles**

| Événement | Description | Paramètres |
|-----------|-------------|------------|
| `cell-value-changed` | Cellule modifiée | `CellValueChangedEvent` |
| `cell-editing-stopped` | Édition terminée | `CellEditingStoppedEvent` |
| `selection-changed` | Sélection modifiée | `T[]` |

## 🚀 **Utilisation Rapide**

```vue
<DataTable 
    :inlineEditing="true"
    :columns="[
        { field: 'name', headerName: 'Nom', editable: true },
        { field: 'price', headerName: 'Prix', editable: true, cellEditor: 'agNumberCellEditor' }
    ]"
    :rowDataProp="data"
    @cell-value-changed="saveChanges"
/>
```

L'édition par cellule est maintenant complètement intégrée dans votre DataTable ! 🎉 
