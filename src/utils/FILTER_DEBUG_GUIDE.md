# 🔍 Guide de Debug - Filtres DataTable

## 🚨 Problème Identifié

Les filtres DataTable ne se transmettent pas correctement dans l'URL de l'API.

## 🔍 Analyse du Problème

### 1. **Chaîne de Transmission des Filtres**

```
DataTable.vue → useInventoryManagement → useBackendDataTable → Store Pinia → API
```

### 2. **Points de Rupture Identifiés**

#### **Point 1: Transformation des Filtres**
- **Problème**: `FilterTransformService.generateFilters()` retourne des paramètres API
- **Attendu**: `setFilters()` attend des filtres au format DataTable
- **Solution**: Transformer les filtres avant d'appeler `setFilters()`

#### **Point 2: Format des Filtres**
- **Problème**: Incohérence entre `filters` et `filter` dans les paramètres
- **Attendu**: Format uniforme pour les filtres
- **Solution**: Support des deux formats dans le store

## 🔧 Corrections Apportées

### 1. **useInventoryManagement.ts**

**Avant:**
```typescript
const handleInventoryFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
    const queryParams = FilterTransformService.generateFilters(filterModel, 'inventory');
    setFilters(queryParams); // ❌ Mauvais format
    await refresh();
};
```

**Après:**
```typescript
const handleInventoryFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
    // Transformer les filtres du DataTable vers le format attendu
    const transformedFilters: Record<string, { value: any; operator?: string }> = {};
    
    Object.keys(filterModel).forEach(key => {
        const filter = filterModel[key];
        if (filter && filter.filter) {
            transformedFilters[key] = {
                value: filter.filter,
                operator: 'contains'
            };
        }
    });

    setFilters(transformedFilters); // ✅ Bon format
    await refresh();
};
```

### 2. **Store Inventory**

**Avant:**
```typescript
filter: params?.filter // ❌ Un seul format
```

**Après:**
```typescript
filter: params?.filters || params?.filter // ✅ Support des deux formats
```

### 3. **Logs de Debug Ajoutés**

**useBackendDataTable:**
```typescript
console.log('🔍 useBackendDataTable - Filtres avant envoi au store:', filters.value);
console.log('🔍 useBackendDataTable - URL générée:', finalUrl);
console.log('🔍 useBackendDataTable - Paramètres Pinia:', piniaParams);
```

**Store Inventory:**
```typescript
console.log('🔍 Store Inventory - Filtres reçus:', {
    filters: params?.filters,
    filter: params?.filter,
    globalSearch: params?.globalSearch,
    sort: params?.sort
});
console.log('🔍 Store Inventory - Paramètres DataTable générés:', queryParams.toString());
```

**useInventoryManagement:**
```typescript
console.log('🔍 useInventoryManagement - Filtres reçus du DataTable:', filterModel);
console.log('🔍 useInventoryManagement - Filtres transformés:', transformedFilters);
```

## 🧪 Test de la Solution

### 1. **Ouvrir la Console du Navigateur**
- Aller sur la page de gestion des inventaires
- Ouvrir les outils de développement (F12)
- Aller dans l'onglet Console

### 2. **Appliquer un Filtre**
- Cliquer sur l'icône de filtre d'une colonne
- Saisir une valeur de filtre
- Cliquer sur "Appliquer"

### 3. **Vérifier les Logs**
Les logs suivants doivent apparaître dans l'ordre :

```
🔍 useInventoryManagement - Filtres reçus du DataTable: { status: { filter: "EN PREPARATION" } }
🔍 useInventoryManagement - Filtres transformés: { status: { value: "EN PREPARATION", operator: "contains" } }
🔍 useBackendDataTable - Filtres avant envoi au store: { status: { value: "EN PREPARATION", operator: "contains" } }
🔍 useBackendDataTable - URL générée: ?draw=1&start=0&length=20&search[value]=&search[regex]=false&status_contains=EN PREPARATION
🔍 useBackendDataTable - Paramètres Pinia: { page: 1, pageSize: 20, search: "", filters: {...}, sort: undefined }
🔍 Store Inventory - Filtres reçus: { filters: {...}, filter: undefined, globalSearch: "", sort: undefined }
🔍 Store Inventory - Paramètres DataTable générés: draw=1&start=0&length=20&search[value]=&search[regex]=false&status_contains=EN PREPARATION
```

### 4. **Vérifier l'URL de l'API**
L'URL de l'API doit contenir les paramètres de filtre :
```
GET /web/api/inventory/?draw=1&start=0&length=20&search[value]=&search[regex]=false&status_contains=EN PREPARATION
```

## 🎯 Résultat Attendu

- ✅ **Filtres transmis** dans l'URL de l'API
- ✅ **Logs de debug** pour tracer le flux
- ✅ **Format uniforme** des filtres
- ✅ **Support des deux formats** (filters/filter)

## 🚀 Prochaines Étapes

1. **Tester** avec différents types de filtres
2. **Supprimer les logs** une fois le problème résolu
3. **Appliquer la même correction** aux autres stores si nécessaire

## 🔧 Code de Test

Pour tester manuellement, ajoutez ce code dans la console du navigateur :

```javascript
// Simuler un changement de filtre
const filterModel = { status: { filter: "EN PREPARATION" } };
// Le composant devrait maintenant transmettre les filtres correctement
```

**Les filtres DataTable devraient maintenant se transmettre correctement dans l'URL !** 🎉
