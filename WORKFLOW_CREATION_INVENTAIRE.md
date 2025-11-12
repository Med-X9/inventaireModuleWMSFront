# 📋 Workflow de Création d'Inventaire

## 🎯 Vue d'ensemble

Le processus de création d'inventaire se fait via un **Wizard en 4 étapes** qui guide l'utilisateur à travers la configuration complète d'un inventaire avec ses 3 comptages.

---

## 🔄 Flux Principal

```
┌─────────────────────────────────────────────────────────────┐
│  1. INITIALISATION                                           │
│     - Chargement des magasins (fetchWarehouses)             │
│     - Chargement des comptes (fetchAccounts)                │
│     - Initialisation du state réactif                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  2. ÉTAPE 0 : INFORMATIONS GÉNÉRALES                        │
│     - Libellé (obligatoire)                                 │
│     - Date (obligatoire)                                    │
│     - Type d'inventaire (GENERAL / TOURNANT)                │
│     - Compte (obligatoire)                                  │
│     - Magasins (multi-sélection avec dates)                 │
│                                                              │
│     Validation : Validators.validateHeader()                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  3. ÉTAPE 1 : COMPTAGE 1                                    │
│     - Mode de comptage (obligatoire)                        │
│       • Image de stock                                      │
│       • En vrac                                             │
│       • Par article                                         │
│                                                              │
│     Options selon le mode :                                │
│     • En vrac : Méthode opératoire + options               │
│     • Par article : Options (numéro série, lot, DLC, etc.) │
│                                                              │
│     Validation :                                            │
│     - Validators.validateComptage()                         │
│     - validateComptage() via CountingDispatcher             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  4. ÉTAPE 2 : COMPTAGE 2                                    │
│     - Mode de comptage (obligatoire)                        │
│       • En vrac (disponible)                                │
│       • Par article (disponible)                            │
│       • Image de stock (INTERDIT)                           │
│                                                              │
│     Options selon le mode (identique à l'étape 1)          │
│                                                              │
│     Validation :                                            │
│     - Validators.validateComptage()                         │
│     - validateComptage() via CountingDispatcher             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  5. ÉTAPE 3 : COMPTAGE 3                                    │
│     - Mode de comptage (obligatoire)                        │
│       • Dépend des comptages précédents                     │
│                                                              │
│     RÈGLE MÉTIER :                                          │
│     - Si comptage 1 = "Image de stock"                       │
│       → Comptage 3 doit correspondre au comptage 2          │
│     - Si comptage 1 ≠ "Image de stock"                      │
│       → Comptage 3 doit correspondre au comptage 1 OU 2     │
│                                                              │
│     Validation :                                            │
│     - Validators.validateComptage()                         │
│     - Validators.validateThirdComptage()                    │
│     - Validators.validateBusinessRules()                    │
│     - validateComptage() via CountingDispatcher             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  6. VALIDATION FINALE & CRÉATION                            │
│     - Validation des règles métier                          │
│     - Transformation des données                            │
│     - Appel API createInventory()                           │
│     - Affichage du résultat                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Détails des Étapes

### **ÉTAPE 0 : Informations Générales**

#### Champs du formulaire :
```typescript
{
  libelle: string;           // Obligatoire
  date: string;              // Obligatoire (format date)
  inventory_type: string;    // 'GENERAL' | 'TOURNANT'
  compte: string;            // ID du compte (obligatoire)
  magasin: Array<{          // Multi-sélection avec dates
    id: number;
    date: string;
  }>;
}
```

#### Validation :
- **Validators.validateHeader()** vérifie :
  - Libellé non vide
  - Date valide
  - Type d'inventaire valide
  - Compte sélectionné
  - Au moins un magasin sélectionné

#### Code de validation :
```typescript
// Dans InventoryCreation.vue
async function validateStep(step: number): Promise<boolean> {
  if (step === 0) {
    const headerErrors = Validators.validateHeader(state.header);
    if (headerErrors.length > 0) {
      throw new Error(headerErrors.join(' | '));
    }
    return true;
  }
}
```

---

### **ÉTAPE 1 : Comptage 1**

#### Modes disponibles :
- ✅ **Image de stock**
- ✅ **En vrac**
- ✅ **Par article**

#### Configuration selon le mode :

##### **Mode "En vrac"** :
```typescript
{
  mode: 'en vrac';
  inputMethod: 'saisie' | 'scanner';  // OBLIGATOIRE
  saisieQuantite?: boolean;            // Auto-sync avec inputMethod
  scannerUnitaire?: boolean;           // Auto-sync avec inputMethod
  guideQuantite?: boolean;             // Optionnel (indépendant)
}
```

**Règles** :
- La méthode opératoire (`inputMethod`) est **obligatoire**
- Si `inputMethod = 'saisie'` → `saisieQuantite = true`
- Si `inputMethod = 'scanner'` → `scannerUnitaire = true`
- **Guide quantité** (`guideQuantite`) est **optionnelle** et **indépendante** des autres options

##### **Mode "Par article"** :
```typescript
{
  mode: 'par article';
  numeroSerie?: boolean;      // Optionnel
  numeroLot?: boolean;        // Optionnel
  dlc?: boolean;             // Optionnel
  isVariante?: boolean;       // Optionnel
  guideQuantite?: boolean;   // Optionnel (HORS règles de combinaison)
  guideArticle?: boolean;     // Optionnel (HORS règles de combinaison)
}
```

**Règles de combinaison** (applicables uniquement à `numeroSerie`, `numeroLot`, `dlc`, `isVariante`) :
- ❌ Numéro de série **NE PEUT PAS** coexister avec :
  - Numéro de lot
  - DLC
- ✅ Numéro de série **PEUT** coexister avec :
  - Variante (`isVariante`)
- ✅ Autres combinaisons valides :
  - Numéro de lot + DLC
  - Numéro de lot + DLC + Variante
  - DLC + Variante
  - etc.

**Options indépendantes** (non soumises aux règles de combinaison) :
- ✅ **Guide quantité** (`guideQuantite`) : Optionnelle, peut être combinée avec n'importe quelle autre option
- ✅ **Guide article** (`guideArticle`) : Optionnelle, peut être combinée avec n'importe quelle autre option

> **Note** : `guideQuantite` et `guideArticle` sont **toujours disponibles** et ne sont **jamais désactivées** par les règles de combinaison. Elles peuvent être sélectionnées indépendamment des autres options.

##### **Mode "Image de stock"** :
```typescript
{
  mode: 'image de stock';
  // Options automatiquement gérées par CountingDispatcher
  // stock_situation = true (automatique)
}
```

#### Validation :
```typescript
// 1. Validation des champs obligatoires
const comptageErrors = Validators.validateComptage(comptage, 0);

// 2. Validation via CountingDispatcher
if (!validateComptage(0)) {
  throw new Error('Configuration du comptage invalide selon les règles métier');
}
```

---

### **ÉTAPE 2 : Comptage 2**

#### Modes disponibles :
- ❌ **Image de stock** (INTERDIT)
- ✅ **En vrac**
- ✅ **Par article**

#### Configuration :
Identique à l'étape 1, mais **sans** le mode "Image de stock".

#### Validation :
```typescript
// Même validation que l'étape 1
const comptageErrors = Validators.validateComptage(comptage, 1);
if (!validateComptage(1)) {
  throw new Error('Configuration du comptage invalide selon les règles métier');
}
```

---

### **ÉTAPE 3 : Comptage 3**

#### Modes disponibles :
Dépend des comptages précédents selon les **règles métier** :

**Règle 1** : Si comptage 1 = "Image de stock"
```
Comptage 1 = "Image de stock"
  ↓
Comptage 3 DOIT correspondre au Comptage 2
  (même mode + mêmes options)
```

**Règle 2** : Si comptage 1 ≠ "Image de stock"
```
Comptage 1 = "En vrac" ou "Par article"
  ↓
Comptage 3 DOIT correspondre au Comptage 1 OU au Comptage 2
  (même mode + mêmes options)
```

#### Validation :
```typescript
// 1. Validation standard
const comptageErrors = Validators.validateComptage(comptage, 2);
if (!validateComptage(2)) {
  throw new Error('Configuration du comptage invalide selon les règles métier');
}

// 2. Validation spécifique du 3e comptage
const thirdComptageErrors = Validators.validateThirdComptage(state.comptages);
if (thirdComptageErrors.length > 0) {
  throw new Error(thirdComptageErrors.join(' | '));
}

// 3. Validation des règles métier globales
const businessErrors = Validators.validateBusinessRules(state.comptages);
if (businessErrors.length > 0) {
  throw new Error(businessErrors.join(' | '));
}
```

---

## 🔧 Transformation des Données

### **1. Transformation des magasins** :
```typescript
// Format UI → Format API
const warehouseData = state.header.magasin.map((m: any) => {
  // Gestion de différents formats possibles
  if (typeof m === 'object' && m.item) {
    return { id: Number(m.item), date: m.date || '' };
  }
  if (typeof m === 'object' && m.value) {
    return { id: Number(m.value), date: m.date || '' };
  }
  if (typeof m === 'string') {
    return { id: Number(m), date: '' };
  }
  // ... autres formats
}).filter(w => w.id > 0);
```

### **2. Transformation des comptages** :
```typescript
// ComptageConfig → CreateCountRequest
function createCountRequest(comptage: ComptageConfig, order: number) {
  const options = getComptageOptions(comptage);
  
  return {
    order: order,
    count_mode: comptage.mode,
    unit_scanned: options.includes('scanner_unitaire'),
    entry_quantity: options.includes('saisie_quantite'),
    is_variant: options.includes('is_variante'),
    n_lot: options.includes('numero_lot'),
    n_serie: options.includes('numero_serie'),
    dlc: options.includes('dlc'),
    show_product: options.includes('guide_article'),
    stock_situation: options.includes('guide_quantite') || options.includes('stock_situation'),
    quantity_show: options.includes('guide_quantite')
  };
}
```

### **3. Structure finale pour l'API** :
```typescript
const inventoryData: CreateInventoryRequest = {
  label: state.header.libelle,
  date: state.header.date,
  inventory_type: state.header.inventory_type,
  account_id: Number(state.header.compte),
  warehouse: warehouseData,
  comptages: comptages.map((c, idx) => createCountRequest(c, idx + 1))
};
```

---

## ✅ Validations Finales

### **1. Validation des comptages** :
```typescript
// Dans createInventory()
inventoryCreationService.validateAllCounts(comptages);
```

Vérifie :
- Exactement 3 comptages
- Ordres 1, 2, 3
- Modes valides
- Règles de combinaison

### **2. Validation métier complète** :
```typescript
// Dans createInventory()
inventoryCreationService.validateInventoryData(inventoryData);
```

Vérifie :
- Champs obligatoires
- Formats valides
- Cohérence des données
- Règles métier globales

---

## 🚀 Appel API

### **Fonction de création** :
```typescript
// Dans useInventoryCreation.ts
async function createInventory() {
  // ... transformations et validations ...
  
  const result = await inventoryStore.createInventory(inventoryData);
  return result;
}
```

### **Dans le composant** :
```typescript
// Dans InventoryCreation.vue
async function handleCreateInventory() {
  try {
    // Validation métier avant création
    const businessErrors = Validators.validateBusinessRules(state.comptages);
    if (businessErrors.length > 0) {
      wizardValidationError.value = businessErrors.join(' | ');
      throw new Error(businessErrors.join(' | '));
    }

    const result = await createInventory();

    // Afficher le message de succès
    creationSuccess.value = `L'inventaire "${state.header.libelle}" a été créé avec succès !`;
    creationError.value = null;
    wizardValidationError.value = null;

  } catch (error) {
    if (!wizardValidationError.value) {
      creationError.value = error instanceof Error ? error.message : 'Erreur lors de la création';
    }
    throw error;
  }
}
```

---

## 🎨 Interface Utilisateur

### **Composants utilisés** :
1. **Wizard** : Composant multi-étapes avec navigation
2. **FormBuilder** : Générateur de formulaires dynamiques
3. **InventoryCreationRecap** : Récapitulatif en temps réel
4. **AlertMessage** : Affichage des erreurs/succès

### **Gestion des erreurs** :
- **Erreurs de validation** : Affichées via `AlertMessage` (type "warning")
- **Erreurs de création** : Affichées via `AlertMessage` (type "error")
- **Succès** : Affiché via `AlertMessage` (type "success")

### **Watchers réactifs** :
```typescript
// Synchronisation inputMethod ↔ saisieQuantite/scannerUnitaire
watch(() => state.comptages.map(c => c.inputMethod), ...)

// Règles de combinaison pour "par article"
// Note: guideQuantite et guideArticle ne sont PAS dans ce watcher
// car elles ne sont pas soumises aux règles de combinaison
watch(() => state.comptages.map(c => ({
  mode: c.mode,
  numeroSerie: c.numeroSerie,
  numeroLot: c.numeroLot,
  dlc: c.dlc,
  isVariante: c.isVariante
  // guideQuantite et guideArticle sont exclus car indépendantes
})), ...)
```

---

## 📊 Règles Métier Résumées

### **Règles de comptage** :

1. **Comptage 1** :
   - Doit toujours avoir un mode défini
   - Tous les modes disponibles

2. **Comptage 2** :
   - Ne peut pas être "Image de stock"
   - Seulement "En vrac" ou "Par article"

3. **Comptage 3** :
   - Si comptage 1 = "Image de stock" → doit correspondre au comptage 2
   - Si comptage 1 ≠ "Image de stock" → doit correspondre au comptage 1 OU 2

### **Règles de combinaison "Par article"** :

**Options soumises aux règles** (`numeroSerie`, `numeroLot`, `dlc`, `isVariante`) :
- ❌ Numéro de série + Numéro de lot (interdit)
- ❌ Numéro de série + DLC (interdit)
- ✅ Numéro de série + Variante (autorisé)
- ✅ Numéro de lot + DLC (autorisé)
- ✅ Toutes les autres combinaisons entre ces 4 options (autorisées)

**Options indépendantes** (`guideQuantite`, `guideArticle`) :
- ✅ **Guide quantité** et **Guide article** sont **optionnelles** et **indépendantes**
- ✅ Elles peuvent être combinées avec **n'importe quelle autre option**
- ✅ Elles ne sont **jamais désactivées** par les règles de combinaison
- ✅ Elles ne font **pas partie** de la validation des règles de combinaison

### **Règles "En vrac"** :

- ✅ Méthode opératoire obligatoire (Saisie ou Scanner)
- ✅ Options optionnelles (Guide quantité, etc.)

---

## 🔍 Points d'Attention

1. **Synchronisation automatique** :
   - `inputMethod` ↔ `saisieQuantite`/`scannerUnitaire` (mode "en vrac")
   - Désactivation automatique des options incompatibles (mode "par article")

2. **Validation en temps réel** :
   - Les erreurs sont affichées lors de la navigation entre étapes
   - Les règles métier sont vérifiées à chaque étape

3. **Gestion des formats** :
   - Les magasins peuvent avoir différents formats (objet avec `item`, `value`, `id`, ou string)
   - Transformation automatique vers le format API

4. **Mode "Image de stock"** :
   - Options automatiquement gérées par `CountingDispatcher`
   - `stock_situation = true` et `quantity_show = false` (automatique)

---

## 📚 Fichiers Clés

- **Vue** : `src/views/Inventory/InventoryCreation.vue`
- **Composable** : `src/composables/useInventoryCreation.ts`
- **Service** : `src/services/inventoryCreationService.ts`
- **Validators** : `src/utils/validators.ts`
- **Store** : `src/stores/inventory.ts`
- **Interfaces** : `src/interfaces/inventoryCreation.ts`
- **Modèles** : `src/models/Inventory.ts`

---

## 🎯 Résumé du Workflow

```
1. Initialisation → Chargement des données
2. Étape 0 → Informations générales (header)
3. Étape 1 → Configuration du comptage 1
4. Étape 2 → Configuration du comptage 2
5. Étape 3 → Configuration du comptage 3 (avec règles métier)
6. Validation finale → Vérification de toutes les règles
7. Transformation → Conversion des données UI → API
8. Création → Appel API et affichage du résultat
```

---

**Fin du document**

