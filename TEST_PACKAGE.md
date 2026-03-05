# ✅ Test du Package @SMATCH-Digital-dev/vue-system-design

## 📋 Vérification de l'Installation

### 1. Vérifier que le package est installé

```powershell
npm list @SMATCH-Digital-dev/vue-system-design
```

**Résultat attendu :**
```
inventaire@0.0.0
`-- @SMATCH-Digital-dev/vue-system-design@1.0.0
```

### 2. Vérifier le package.json

Le package doit apparaître dans `package.json` :
```json
{
  "dependencies": {
    "@SMATCH-Digital-dev/vue-system-design": "^1.0.0"
  }
}
```

### 3. Vérifier node_modules

Le package doit être présent dans :
```
node_modules/@SMATCH-Digital-dev/vue-system-design/
```

## 🧪 Test d'Import

### Test 1 : Importer des composants de base

Créez un fichier de test (ex: `src/components/TestPackage.vue`) :

```vue
<template>
  <div class="p-4">
    <h1>Test du Package</h1>
    
    <!-- Test Button -->
    <Button variant="primary">Bouton Test</Button>
    
    <!-- Test Card -->
    <Card class="mt-4">
      <p>Ceci est une carte de test</p>
    </Card>
    
    <!-- Test Badge -->
    <Badge variant="success" class="mt-4">Badge Test</Badge>
  </div>
</template>

<script setup lang="ts">
import { Button, Card, Badge } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

### Test 2 : Importer le DataTable

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
  />
</template>

<script setup lang="ts">
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const columns = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Nom' }
]

const data = [
  { id: 1, name: 'Test 1' },
  { id: 2, name: 'Test 2' }
]
</script>
```

### Test 3 : Importer les styles

Dans votre `main.ts` ou dans un composant :

```typescript
import '@SMATCH-Digital-dev/vue-system-design/styles'
```

## 🚀 Test Rapide dans la Console

Ouvrez la console du navigateur (F12) et testez :

```javascript
// Vérifier que le package est chargé
console.log('Package test:', import('@SMATCH-Digital-dev/vue-system-design'))
```

## ✅ Checklist de Vérification

- [x] Package installé dans `node_modules`
- [x] Package présent dans `package.json`
- [x] Version correcte : `1.0.0`
- [ ] Import des composants fonctionne
- [ ] Import des styles fonctionne
- [ ] Composants s'affichent correctement

## 🆘 En cas d'Erreur

### Erreur : "Cannot find module"

1. Vérifier que le package est installé : `npm list @SMATCH-Digital-dev/vue-system-design`
2. Réinstaller : `npm install @SMATCH-Digital-dev/vue-system-design`
3. Vérifier le token GitHub : `echo $env:GITHUB_TOKEN`

### Erreur : "401 Unauthorized"

1. Vérifier le fichier `.npmrc` existe
2. Vérifier que `GITHUB_TOKEN` est défini
3. Vérifier que le token a la permission `read:packages`

## 📚 Documentation

Pour plus d'informations, consultez :
- `vue-system-design/README.md` dans le package
- `vue-system-design/INSTALLATION_PROJET.md`

