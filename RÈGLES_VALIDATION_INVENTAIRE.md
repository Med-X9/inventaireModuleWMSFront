# ⚖️ Règles de Validation et Combinaison - Création d'Inventaires

## 📋 Table des matières
1. [Règles de comptage](#règles-de-comptage)
2. [Règles de combinaison](#règles-de-combinaison)
3. [Validation des données](#validation-des-données)
4. [Messages d'erreur](#messages-derreur)
5. [Code de validation](#code-de-validation)

---

## 🔢 Règles de comptage

### Mode "En vrac"
- ✅ **Méthode de saisie obligatoire** : `saisie` ou `scanner`
- ✅ **Options disponibles** :
  - `saisieQuantite` : Saisie manuelle des quantités
  - `scannerUnitaire` : Scanner article par article
  - `guideQuantite` : Guide pour la quantité
  - ❌ **`guideArticle` : Non disponible pour le mode "en vrac"**

### Mode "Par article"
- ✅ **Options optionnelles** parmi :
  - `numeroSerie` : Numéro de série
  - `numeroLot` : Numéro de lot
  - `dlc` : Date limite de consommation
  - `isVariante` : Gestion des variantes
- ✅ **Options supplémentaires** :
  - `guideQuantite` : Guide pour la quantité
  - `guideArticle` : Guide pour l'article

### Mode "Image de stock"
- ✅ **Aucune option supplémentaire** requise
- ✅ **Mode simplifié** pour photographie rapide du stock

---

## ⚖️ Règles de combinaison

### Combinaisons interdites
```typescript
// ❌ Numéro de série ne peut être combiné qu'avec Variante
if (numeroSerie && (numeroLot || dlc)) {
    throw new Error('Le "Numéro de série" ne peut être combiné qu\'avec "Variante"');
}

// ❌ Numéro de série et Numéro de lot ne peuvent pas coexister
if (numeroSerie && numeroLot) {
    // Désactiver automatiquement numéroSerie
}

// ❌ Numéro de série et DLC ne peuvent pas coexister
if (numeroSerie && dlc) {
    // Désactiver automatiquement numéroSerie
}
```

### Combinaisons valides
```typescript
// ✅ Simples
numeroSerie
numeroLot
dlc
isVariante

// ✅ Doubles
numeroSerie + isVariante
numeroLot + dlc
numeroLot + isVariante
dlc + isVariante

// ✅ Triples
numeroLot + dlc + isVariante

// ✅ Quadruples
numeroSerie + numeroLot + dlc + isVariante
```

---

## 🎯 Règles métier pour les 3 comptages

### Règle principale : Options du 3e comptage
```typescript
// Les options du 3e comptage doivent être soit celles du 1er OU du 2e comptage
function validateThirdComptageOptions(comptages: Comptage[]): boolean {
    const firstOptions = getComptageOptions(comptages[0]);
    const secondOptions = getComptageOptions(comptages[1]);
    const thirdOptions = getComptageOptions(comptages[2]);
    
    // Le 3e comptage doit avoir les mêmes options que le 1er OU le 2e
    return areOptionsIdentical(thirdOptions, firstOptions) || 
           areOptionsIdentical(thirdOptions, secondOptions);
}
```

### Scénarios possibles

1. **En vrac + En vrac + En vrac** 
   - Options différentes dans 1er et 2e comptages
   - Les options du 3e doivent être soit celles du 1er OU du 2e

2. **Par article + Par article + Par article** 
   - Options différentes dans 1er et 2e comptages
   - Les options du 3e doivent être soit celles du 1er OU du 2e

3. **En vrac + Par article + En vrac** 
   - Les options du 3e doivent être soit celles du 1er OU du 2e

4. **En vrac + En vrac + Par article** 
   - Les options du 3e doivent être soit celles du 1er OU du 2e

5. **Par article + En vrac + En vrac** 
   - Les options du 3e doivent être soit celles du 1er OU du 2e

6. **Par article + En vrac + Par article** 
   - Les options du 3e doivent être soit celles du 1er OU du 2e

### Validation des options du 3e comptage
```typescript
function validateThirdComptage(comptages: Comptage[]): string[] {
    const errors: string[] = [];
    
    const firstOptions = getComptageOptions(comptages[0]);
    const secondOptions = getComptageOptions(comptages[1]);
    const thirdOptions = getComptageOptions(comptages[2]);
    
    // Vérifier que les options du 3e correspondent à celles du 1er ou du 2e
    if (!areOptionsIdentical(thirdOptions, firstOptions) && 
        !areOptionsIdentical(thirdOptions, secondOptions)) {
        errors.push('Les options du 3e comptage doivent être identiques à celles du 1er OU du 2e comptage');
    }
    
    return errors;
}

function getComptageOptions(comptage: Comptage): string[] {
    const options: string[] = [];
    
    if (comptage.mode === 'en vrac') {
        if (comptage.saisieQuantite) options.push('saisieQuantite');
        if (comptage.scannerUnitaire) options.push('scannerUnitaire');
        if (comptage.guideQuantite) options.push('guideQuantite');
        // guideArticle n'est pas disponible pour le mode "en vrac"
    } else if (comptage.mode === 'par article') {
        if (comptage.numeroSerie) options.push('numeroSerie');
        if (comptage.numeroLot) options.push('numeroLot');
        if (comptage.dlc) options.push('dlc');
        if (comptage.isVariante) options.push('isVariante');
        if (comptage.guideQuantite) options.push('guideQuantite');
        if (comptage.guideArticle) options.push('guideArticle');
    }
    
    return options.sort();
}

function areOptionsIdentical(options1: string[], options2: string[]): boolean {
    if (options1.length !== options2.length) return false;
    return options1.every((option, index) => option === options2[index]);
}
```

---

## ✅ Validation des données

### En-tête obligatoire
```typescript
const headerErrors = [
    'Le libellé est obligatoire',
    'La date est obligatoire',
    'Le type d\'inventaire est obligatoire',
    'Le compte est obligatoire',
    'Au moins un magasin doit être sélectionné'
];
```

### Validation par étape
```typescript
// Étape 0 : Informations générales
validateHeader(state.header)

// Étape 1-3 : Comptages
validateComptage(comptage, index)
validateBusinessRules(comptages)
```

### Validation finale
```typescript
// Vérifier les règles métier avant création
const businessErrors = validateBusinessRules(state.comptages);
if (businessErrors.length > 0) {
    throw new Error(businessErrors.join(' | '));
}
```

---

## 🚨 Messages d'erreur

### Erreurs de validation d'en-tête
```typescript
const headerErrors = [
    'Le libellé est obligatoire',
    'La date est obligatoire',
    'Le type d\'inventaire est obligatoire',
    'Le compte est obligatoire',
    'Au moins un magasin doit être sélectionné'
];
```

### Erreurs de validation de comptage
```typescript
const comptageErrors = [
    'Le mode de comptage X est obligatoire',
    'La méthode de saisie est obligatoire pour le mode "en vrac"',
    'Au moins une option doit être sélectionnée pour le mode "par article"',
    'Le "Numéro de série" ne peut être combiné qu\'avec "Variante"'
];
```

### Erreurs de règles métier
```typescript
const businessErrors = [
    'Les options du 3e comptage doivent être identiques à celles du 1er OU du 2e comptage',
    'Un inventaire doit contenir exactement 3 comptages',
    'Si le premier comptage n\'est pas \'image de stock\', tous les comptages doivent être \'en vrac\' ou \'par article\''
];
```

---

## 💻 Code de validation

### Service de validation (`src/utils/validators.ts`)
```typescript
export class Validators {
    // Validation de l'en-tête
    static validateHeader(header: InventoryHeader): string[]
    
    // Validation d'un comptage
    static validateComptage(comptage: Comptage, index: number): string[]
    
    // Comparaison de comptages
    static areComptagesIdentical(comptage1: Comptage, comptage2: Comptage): boolean
    
    // Validation des règles métier
    static validateBusinessRules(comptages: Comptage[]): string[]
    
    // Validation spécifique du 3e comptage
    static validateThirdComptage(comptages: Comptage[]): string[]
    
    // Extraction des options d'un comptage
    static getComptageOptions(comptage: Comptage): string[]
    
    // Comparaison d'options
    static areOptionsIdentical(options1: string[], options2: string[]): boolean
}
```

### Validation en temps réel
```typescript
// Dans le composable useInventoryCreation.ts
watch(
    () => state.comptages.map(c => ({ 
        mode: c.mode, 
        numeroSerie: c.numeroSerie, 
        numeroLot: c.numeroLot, 
        dlc: c.dlc, 
        isVariante: c.isVariante,
        saisieQuantite: c.saisieQuantite,
        scannerUnitaire: c.scannerUnitaire,
        guideQuantite: c.guideQuantite,
        guideArticle: c.guideArticle
    })),
    (comptages) => {
        // Application automatique des règles de combinaison
        // Validation des options du 3e comptage
    },
    { deep: true }
);
```

### Validation par étape
```typescript
async function validateStep(step: number): Promise<boolean> {
    if (step === 0) {
        // Validation de l'en-tête
        const headerErrors = Validators.validateHeader(state.header);
        if (headerErrors.length > 0) {
            throw new Error(headerErrors.join(' | '));
        }
    } else {
        // Validation des comptages
        const comptageErrors = Validators.validateComptage(comptage, comptageIndex);
        if (comptageErrors.length > 0) {
            throw new Error(comptageErrors.join(' | '));
        }
        
        // Validation spécifique du 3e comptage
        if (step === 3) {
            const thirdComptageErrors = Validators.validateThirdComptage(state.comptages);
            if (thirdComptageErrors.length > 0) {
                throw new Error(thirdComptageErrors.join(' | '));
            }
        }
    }
}
```

---

## 🎯 Règles de formatage

### Formatage des modes
```typescript
const modes = {
    'en vrac': 'En vrac',
    'par article': 'Par article',
    'image de stock': 'Image de stock'
};
```

### Formatage des méthodes de saisie
```typescript
const methods = {
    'saisie': 'Saisie manuelle',
    'scanner': 'Scanner'
};
```

### Formatage des types d'inventaire
```typescript
const types = {
    'GENERAL': 'Général',
    'TOURNANT': 'Tournant'
};
```

---

## 📊 Structure des données

### Interface InventoryHeader
```typescript
interface InventoryHeader {
    libelle?: string;
    date?: string;
    inventory_type?: string;
    compte?: Account | string;
    magasin?: Warehouse[];
}
```

### Interface Comptage
```typescript
interface Comptage {
    mode?: string;
    inputMethod?: string;
    saisieQuantite?: boolean;
    scannerUnitaire?: boolean;
    numeroSerie?: boolean;
    numeroLot?: boolean;
    dlc?: boolean;
    isVariante?: boolean;
    guideQuantite?: boolean;
    guideArticle?: boolean;
}
```

---

## 🔄 Flux de validation

1. **Saisie utilisateur** → Validation en temps réel
2. **Changement d'étape** → Validation de l'étape actuelle
3. **Validation finale** → Vérification complète avant création
4. **Création** → Envoi à l'API avec validation côté serveur

---

## 📝 Notes importantes

- ✅ **Validation en temps réel** : Les règles sont appliquées automatiquement
- ✅ **Messages d'erreur clairs** : Chaque erreur est expliquée
- ✅ **Validation par étape** : Impossible de continuer sans validation
- ✅ **Validation finale** : Double vérification avant création
- ✅ **Règles métier strictes** : Garantie de la cohérence des données
- ✅ **Validation du 3e comptage** : Les options doivent correspondre au 1er OU 2e comptage

---

*Dernière mise à jour : 2024* 
