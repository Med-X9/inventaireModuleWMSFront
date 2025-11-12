# Service de Transformation des Filtres

## Vue d'ensemble

Le `FilterTransformService` est un service centralisé qui transforme les filtres du DataTable vers les formats attendus par les différents stores de l'application. **Il respecte les opérateurs de filtrage standard** et inclut un **générateur automatique** pour une utilisation simplifiée dans n'importe quel fichier.

## 🚀 Générateur Automatique

### Utilisation Simple

```typescript
import { FilterTransformService } from '@/services/filterTransformService';

// Générateur automatique pour les jobs
const jobFilters = FilterTransformService.generateJobFilters(filterModel);

// Générateur automatique pour les locations
const locationFilters = FilterTransformService.generateLocationFilters(filterModel);

// Générateur automatique pour les inventaires
const inventoryFilters = FilterTransformService.generateInventoryFilters(filterModel);

// Générateur automatique pour les entrepôts
const warehouseFilters = FilterTransformService.generateWarehouseFilters(filterModel);
```

### Configuration Personnalisée

```typescript
// Configuration personnalisée pour vos données
const customFieldConfig = {
    name: { type: 'string', operator: 'icontains' },
    age: { type: 'number', operator: 'gte' },
    birthDate: { type: 'date', operator: 'range' },
    isActive: { type: 'boolean', operator: 'exact' }
};

// Utiliser le générateur personnalisé
const customFilters = FilterTransformService.generateCustomFilters(
    filterModel, 
    customFieldConfig, 
    'userStore'
);
```

### Utilisation dans n'importe quel fichier

```typescript
// Dans useProductManagement.ts
const handleProductFilterChanged = async (filterModel) => {
    const productFieldConfig = {
        name: { type: 'string', operator: 'icontains' },
        price: { type: 'number', operator: 'range' },
        category: { type: 'string', operator: 'exact' }
    };

    const queryParams = FilterTransformService.generateCustomFilters(
        filterModel, 
        productFieldConfig, 
        'productStore'
    );

    await productStore.fetchProducts(queryParams);
};
```

## Opérateurs de Filtrage Standard Supportés

### 🔤 Opérateurs pour les Chaînes (StringFilter)
- `exact` - Correspondance exacte
- `contains` - Contient le terme
- `startswith` - Commence par
- `endswith` - Termine par
- `icontains` - Contient (insensible à la casse) ⭐ **Par défaut**
- `istartswith` - Commence par (insensible à la casse)
- `iendswith` - Termine par (insensible à la casse)
- `regex` - Expression régulière
- `iregex` - Expression régulière (insensible à la casse)

### 📅 Opérateurs pour les Dates (DateFilter)
- `exact` - Date exacte
- `gte` - Plus grand ou égal
- `lte` - Plus petit ou égal
- `gt` - Plus grand que
- `lt` - Plus petit que
- `range` - Plage de dates
- `year` - Par année
- `month` - Par mois
- `day` - Par jour
- `week` - Par semaine
- `quarter` - Par trimestre

### 🔢 Opérateurs pour les Nombres (NumberFilter)
- `exact` - Valeur exacte
- `gte` - Plus grand ou égal
- `lte` - Plus petit ou égal
- `gt` - Plus grand que
- `lt` - Plus petit que
- `range` - Plage de valeurs

### ✅ Opérateurs pour les Booléens (BooleanField)
- `exact` - Valeur exacte
- `true` - Égal à True
- `false` - Égal à False

## Utilisation

### Import du service

```typescript
import { FilterTransformService } from '@/services/filterTransformService';
```

### Méthodes disponibles

#### 1. `generateJobFilters(filterModel)` ⭐ **NOUVEAU**
Générateur automatique pour les jobs avec configuration prédéfinie.

```typescript
const transformedFilters = FilterTransformService.generateJobFilters(filterModel);
await jobStore.fetchJobs(inventoryId, warehouseId, { filter: transformedFilters });
```

**Configuration automatique :**
- `id` → `number`, `exact`
- `reference` → `string`, `icontains`
- `status` → `string`, `exact`
- `created_at` → `date`, `range`
- `updated_at` → `date`, `range`

#### 2. `generateLocationFilters(filterModel)` ⭐ **NOUVEAU**
Générateur automatique pour les locations avec configuration prédéfinie.

```typescript
const queryParams = FilterTransformService.generateLocationFilters(filterModel);
await locationStore.fetchUnassignedLocations(accountId, inventoryId, warehouseId, queryParams);
```

**Configuration automatique :**
- `reference` → `string`, `icontains`
- `location_reference` → `string`, `icontains`
- `sous_zone` → `string`, `icontains`, `apiField: 'sous_zone_name'`
- `zone` → `string`, `icontains`, `apiField: 'zone_name'`
- `warehouse` → `string`, `icontains`, `apiField: 'warehouse_name'`

#### 3. `generateInventoryFilters(filterModel)` ⭐ **NOUVEAU**
Générateur automatique pour les inventaires avec configuration prédéfinie.

```typescript
const queryParams = FilterTransformService.generateInventoryFilters(filterModel);
await inventoryStore.fetchInventories({ ...queryParams, page, pageSize });
```

**Configuration automatique :**
- `id` → `number`, `exact`
- `reference` → `string`, `icontains`
- `label` → `string`, `icontains`
- `status` → `string`, `exact`
- `date` → `date`, `exact`
- `warehouse` → `string`, `icontains`

#### 4. `generateWarehouseFilters(filterModel)` ⭐ **NOUVEAU**
Générateur automatique pour les entrepôts avec configuration prédéfinie.

```typescript
const queryParams = FilterTransformService.generateWarehouseFilters(filterModel);
await warehouseStore.fetchWarehouses(queryParams);
```

**Configuration automatique :**
- `reference` → `string`, `icontains`
- `warehouse_name` → `string`, `icontains`
- `warehouse_type` → `string`, `exact`
- `status` → `string`, `exact`

#### 5. `generateCustomFilters(filterModel, fieldConfig, storeName)` ⭐ **NOUVEAU**
Générateur personnalisé avec configuration définie par l'utilisateur.

```typescript
const customFieldConfig = {
    name: { type: 'string', operator: 'icontains' },
    age: { type: 'number', operator: 'gte' },
    birthDate: { type: 'date', operator: 'range' },
    isActive: { type: 'boolean', operator: 'exact' }
};

const queryParams = FilterTransformService.generateCustomFilters(
    filterModel, 
    customFieldConfig, 
    'userStore'
);
```

#### 6. `transformForJobStore(filterModel)`
Transforme les filtres pour le store des jobs avec les opérateurs standard.

```typescript
const transformedFilters = FilterTransformService.transformForJobStore(filterModel);
await jobStore.fetchJobs(inventoryId, warehouseId, { filter: transformedFilters });
```

**Mapping des opérateurs :**
- `status` → `exact`
- `reference` → `icontains`
- `created_at` → `range`
- `id` → `exact`

#### 7. `transformForLocationStore(filterModel)`
Transforme les filtres pour le store des locations avec les opérateurs standard.

```typescript
const queryParams = FilterTransformService.transformForLocationStore(filterModel);
await locationStore.fetchUnassignedLocations(accountId, inventoryId, warehouseId, queryParams);
```

**Mapping des opérateurs :**
- `reference` → `reference_icontains`
- `location_reference` → `location_reference_icontains`
- `sous_zone` → `sous_zone_name_icontains`
- `zone` → `zone_name_icontains`
- `warehouse` → `warehouse_name_icontains`

#### 8. `transformForInventoryStore(filterModel)`
Transforme les filtres pour le store des inventaires avec les opérateurs standard.

```typescript
const queryParams = FilterTransformService.transformForInventoryStore(filterModel);
await inventoryStore.fetchInventories({ ...queryParams, page, pageSize });
```

**Mapping des opérateurs :**
- `reference` → `reference_icontains`
- `label` → `label_icontains`
- `status` → `status_exact`
- `date` → `date_exact`
- `id` → `id_exact`

#### 9. `transformForWarehouseStore(filterModel)`
Transforme les filtres pour le store des entrepôts avec les opérateurs standard.

```typescript
const queryParams = FilterTransformService.transformForWarehouseStore(filterModel);
await warehouseStore.fetchWarehouses(queryParams);
```

**Mapping des opérateurs :**
- `reference` → `reference_icontains`
- `warehouse_name` → `warehouse_name_icontains`
- `warehouse_type` → `warehouse_type_exact`
- `status` → `status_exact`

#### 10. `transformForGenericAPI(filterModel, fieldMappings?, operatorMappings?)`
Transforme les filtres vers un format générique API avec mapping personnalisé.

```typescript
const fieldMappings = {
    'reference': 'ref',
    'status': 'state'
};
const operatorMappings = {
    'reference': 'icontains',
    'status': 'exact',
    'date': 'range'
};
const queryParams = FilterTransformService.transformForGenericAPI(filterModel, fieldMappings, operatorMappings);
```

#### 11. `transformWithOperators(filterModel, operatorMappings?)`
Transforme les filtres avec des opérateurs spécifiques.

```typescript
const operatorMappings = {
    'status': 'exact',
    'reference': 'icontains',
    'date': 'range'
};
const transformedFilters = FilterTransformService.transformWithOperators(filterModel, operatorMappings);
```

#### 12. `transformWithAdvancedOperators(filterModel, fieldTypeMappings?)` ⭐ **NOUVEAU**
Transforme les filtres avec des opérateurs avancés selon la documentation.

```typescript
const fieldTypeMappings = {
    'reference': 'string',
    'status': 'string',
    'date': 'date',
    'id': 'number',
    'is_active': 'boolean'
};
const queryParams = FilterTransformService.transformWithAdvancedOperators(filterModel, fieldTypeMappings);
```

### Exemples d'utilisation dans les composables

#### Dans `usePlanning.ts`

```typescript
// Handler pour les filtres des jobs
const onJobFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
    const transformedFilters = FilterTransformService.generateJobFilters(filterModel);
    await loadJobsFromStore({ filter: transformedFilters });
};

// Handler pour les filtres des locations
const onLocationFilterChanged = async (model: Record<string, { filter: string }>) => {
    const queryParams = FilterTransformService.generateLocationFilters(model);
    await loadLocations({ ...queryParams, ordering });
};
```

#### Dans `useInventoryManagement.ts`

```typescript
const handleInventoryFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
    const queryParams = FilterTransformService.generateInventoryFilters(filterModel);
    await inventoryStore.fetchInventories({
        ...queryParams,
        page: dataTable.currentPage.value,
        pageSize: dataTable.pageSize.value
    });
};
```

## Exemples d'URLs générées

### JobStore
```typescript
// Input: { status: { filter: 'EN ATTENTE' } }
// Output: { status_exact: 'EN ATTENTE' }
// URL: /api/jobs/?status_exact=EN%20ATTENTE

// Input: { reference: { filter: 'JOB' } }
// Output: { reference_icontains: 'JOB' }
// URL: /api/jobs/?reference_icontains=JOB
```

### LocationStore
```typescript
// Input: { reference: { filter: 'LOC' } }
// Output: { reference_icontains: 'LOC' }
// URL: /api/locations/?reference_icontains=LOC

// Input: { zone: { filter: 'ZONE1' } }
// Output: { zone_name_icontains: 'ZONE1' }
// URL: /api/locations/?zone_name_icontains=ZONE1
```

### InventoryStore
```typescript
// Input: { label: { filter: 'INV' } }
// Output: { label_icontains: 'INV' }
// URL: /api/inventory/?label_icontains=INV

// Input: { status: { filter: 'EN PREPARATION' } }
// Output: { status_exact: 'EN PREPARATION' }
// URL: /api/inventory/?status_exact=EN%20PREPARATION
```

## Logs de débogage

Le service inclut des logs détaillés pour faciliter le débogage :

- `🔍 Générateur automatique pour [store]:` - Affiche les filtres reçus
- `🔍 Paramètres générés pour [store]:` - Affiche les paramètres générés
- `🔍 Transformation des filtres pour [store]:` - Affiche les filtres reçus
- `🔍 Filtres transformés pour [store]:` - Affiche les filtres transformés
- `🔍 Paramètres de requête pour [store]:` - Affiche les paramètres finaux

## Avantages

1. **Générateur automatique** : Configuration prédéfinie pour les stores courants
2. **Flexibilité** : Configuration personnalisée pour n'importe quel type de données
3. **Simplicité** : Une seule ligne de code pour transformer les filtres
4. **Réutilisabilité** : Utilisable dans n'importe quel fichier
5. **Maintenabilité** : Configuration centralisée et facile à modifier
6. **Cohérence** : Format uniforme dans toute l'application
7. **Débogage** : Logs détaillés pour identifier les problèmes
8. **Performance** : Optimisé pour les transformations fréquentes 
