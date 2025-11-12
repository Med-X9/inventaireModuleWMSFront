# 🧪 Test des Filtres DataTable

## 🔍 Étapes de Test

### 1. **Ouvrir la Console du Navigateur**
- Aller sur `http://localhost:3000/inventory/management`
- Ouvrir les outils de développement (F12)
- Aller dans l'onglet Console

### 2. **Appliquer un Filtre**
- Cliquer sur l'icône de filtre de la colonne "Statut"
- Saisir "EN PREPARATION"
- Cliquer sur "Appliquer"

### 3. **Vérifier les Logs Attendus**

**Logs dans l'ordre :**
```
🔍 InventoryManagement.vue - Filtres reçus du DataTable: { status: { filter: "EN PREPARATION" } }
🔍 useInventoryManagement - Filtres reçus du DataTable: { status: { filter: "EN PREPARATION" } }
🔍 useInventoryManagement - Filtres transformés: { status: { value: "EN PREPARATION", operator: "contains" } }
🔍 useBackendDataTable - Filtres avant envoi au store: { status: { value: "EN PREPARATION", operator: "contains" } }
🔍 useBackendDataTable - URL générée: ?draw=1&start=0&length=20&search[value]=&search[regex]=false&status_contains=EN PREPARATION
🔍 useBackendDataTable - Paramètres Pinia: { page: 1, pageSize: 20, globalSearch: "", filters: {...}, sort: undefined }
🔍 Store Inventory - Filtres reçus: { filters: {...}, filter: undefined, globalSearch: "", sort: undefined }
🔍 Store Inventory - Paramètres DataTable générés: draw=1&start=0&length=20&search[value]=&search[regex]=false&status_contains=EN PREPARATION
```

### 4. **Vérifier l'URL de l'API**
L'URL de l'API doit contenir les paramètres de filtre :
```
GET /web/api/inventory/?draw=1&start=0&length=20&search[value]=&search[regex]=false&status_contains=EN PREPARATION
```

## 🚨 Problèmes Possibles

### **Problème 1: Aucun log n'apparaît**
- **Cause**: Le filtre n'est pas appliqué
- **Solution**: Vérifier que l'icône de filtre est cliquée et la valeur saisie

### **Problème 2: Logs s'arrêtent à "Filtres reçus du DataTable"**
- **Cause**: Problème dans `useInventoryManagement`
- **Solution**: Vérifier la transformation des filtres

### **Problème 3: Logs s'arrêtent à "Filtres avant envoi au store"**
- **Cause**: Problème dans `useBackendDataTable`
- **Solution**: Vérifier la construction des paramètres Pinia

### **Problème 4: Logs s'arrêtent à "Filtres reçus"**
- **Cause**: Problème dans le store Inventory
- **Solution**: Vérifier la construction des paramètres DataTable

### **Problème 5: URL ne contient pas les filtres**
- **Cause**: Problème dans la construction de l'URL
- **Solution**: Vérifier `buildDataTableParams`

## 🔧 Debug Manuel

### **Test 1: Vérifier les filtres dans useBackendDataTable**
```javascript
// Dans la console du navigateur
// Vérifier si les filtres sont bien stockés
console.log('Filtres dans useBackendDataTable:', window.inventoryManagement?.filters);
```

### **Test 2: Vérifier les paramètres Pinia**
```javascript
// Dans la console du navigateur
// Vérifier les paramètres passés au store
console.log('Paramètres Pinia:', window.inventoryManagement?.piniaParams);
```

### **Test 3: Vérifier l'URL générée**
```javascript
// Dans la console du navigateur
// Vérifier l'URL générée
console.log('URL générée:', window.inventoryManagement?.finalUrl);
```

## 🎯 Résultat Attendu

- ✅ **Tous les logs** apparaissent dans l'ordre
- ✅ **URL de l'API** contient les paramètres de filtre
- ✅ **Filtres appliqués** correctement dans le DataTable
- ✅ **Données filtrées** affichées

## 🚀 Prochaines Étapes

1. **Exécuter le test** avec différents types de filtres
2. **Vérifier les logs** pour identifier le problème
3. **Corriger le problème** identifié
4. **Supprimer les logs** une fois le problème résolu

**Le test doit révéler exactement où les filtres se perdent dans la chaîne !** 🔍
