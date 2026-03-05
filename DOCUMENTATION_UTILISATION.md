# 📚 Documentation d'Utilisation

## @SMATCH-Digital-dev/vue-system-design

Guide complet pour utiliser le système de design Vue.js dans votre projet.

---

## 📦 Installation

### Prérequis

- Node.js 16+ 
- Vue 3.2.37+
- Vue Router 4.1.5+

### Installation

```bash
npm install @SMATCH-Digital-dev/vue-system-design
```

### Configuration

1. **Créer un fichier `.npmrc`** à la racine de votre projet :
```
@SMATCH-Digital-dev:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. **Définir le token GitHub** :
```powershell
$env:GITHUB_TOKEN="ghp_votre_token"
```

---

## 🚀 Configuration Initiale

### 1. Importer les Styles

Dans votre `main.ts` ou fichier CSS principal :

```typescript
import '@SMATCH-Digital-dev/vue-system-design/styles'
```

### 2. Enregistrer le Plugin (Optionnel)

Si vous voulez enregistrer tous les composants globalement :

```typescript
import { createApp } from 'vue'
import VueSystemDesign from '@SMATCH-Digital-dev/vue-system-design'
import App from './App.vue'

const app = createApp(App)
app.use(VueSystemDesign)
app.mount('#app')
```

### 3. Import Manuel (Recommandé)

Importez uniquement les composants dont vous avez besoin :

```typescript
import { Button, Card, DataTable } from '@SMATCH-Digital-dev/vue-system-design'
```

---

## 🎨 Composants de Base

### Button

```vue
<template>
  <div>
    <!-- Variants -->
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="success">Success</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="warning">Warning</Button>
    
    <!-- Tailles -->
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
    
    <!-- États -->
    <Button :disabled="true">Disabled</Button>
    <Button :loading="true">Loading</Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

### Input

```vue
<template>
  <Input
    v-model="value"
    type="text"
    placeholder="Entrez votre texte"
    :error="hasError"
    error-message="Ce champ est requis"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@SMATCH-Digital-dev/vue-system-design'

const value = ref('')
const hasError = ref(false)
</script>
```

### Card

```vue
<template>
  <Card>
    <template #header>
      <h3>Titre de la carte</h3>
    </template>
    
    <p>Contenu de la carte</p>
    
    <template #footer>
      <Button variant="primary">Action</Button>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { Card, Button } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

### Alert

```vue
<template>
  <Alert variant="info" :dismissible="true">
    Message d'information
  </Alert>
  
  <Alert variant="success">
    Opération réussie
  </Alert>
  
  <Alert variant="warning">
    Attention requise
  </Alert>
  
  <Alert variant="danger">
    Erreur détectée
  </Alert>
</template>

<script setup lang="ts">
import { Alert } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

### Badge

```vue
<template>
  <Badge variant="success">Actif</Badge>
  <Badge variant="warning">En attente</Badge>
  <Badge variant="danger">Inactif</Badge>
</template>

<script setup lang="ts">
import { Badge } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

### Form

```vue
<template>
  <Form @submit="handleSubmit">
    <FormGroup>
      <FormLabel>Nom</FormLabel>
      <Input v-model="form.name" />
      <FormHelper>Entrez votre nom complet</FormHelper>
      <FormError v-if="errors.name">{{ errors.name }}</FormError>
    </FormGroup>
    
    <FormGroup>
      <FormLabel>Email</FormLabel>
      <Input v-model="form.email" type="email" />
    </FormGroup>
    
    <Button type="submit">Envoyer</Button>
  </Form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Form, FormGroup, FormLabel, FormHelper, FormError, Input, Button } from '@SMATCH-Digital-dev/vue-system-design'

const form = ref({ name: '', email: '' })
const errors = ref({})

const handleSubmit = () => {
  // Logique de soumission
}
</script>
```

---

## 📊 DataTable

Le DataTable est le composant principal pour afficher des données tabulaires.

### Utilisation Basique

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
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'name', headerName: 'Nom', width: 200 },
  { field: 'email', headerName: 'Email', width: 250 },
  { field: 'status', headerName: 'Statut', width: 150 }
]

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Actif' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactif' }
]
</script>
```

### DataTable avec Pagination

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :pagination="true"
    :pageSize="10"
    @page-changed="handlePageChange"
  />
</template>

<script setup lang="ts">
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const handlePageChange = (page: number) => {
  console.log('Page changée:', page)
}
</script>
```

### DataTable avec Tri

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :sortable="true"
    @sort-changed="handleSortChange"
  />
</template>

<script setup lang="ts">
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const handleSortChange = (sortModel: any) => {
  console.log('Tri changé:', sortModel)
}
</script>
```

### DataTable avec Filtres

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :filterable="true"
    @filter-changed="handleFilterChange"
  />
</template>

<script setup lang="ts">
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const handleFilterChange = (filters: any) => {
  console.log('Filtres changés:', filters)
}
</script>
```

### DataTable avec Actions

```vue
<template>
  <DataTable
    :columns="columns"
    :rowDataProp="data"
    :actions="actions"
  />
</template>

<script setup lang="ts">
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const actions = [
  {
    label: 'Éditer',
    icon: 'edit',
    onClick: (row: any) => console.log('Éditer', row)
  },
  {
    label: 'Supprimer',
    icon: 'trash',
    variant: 'danger',
    onClick: (row: any) => console.log('Supprimer', row)
  }
]
</script>
```

### DataTable avec API (Server-Side)

```vue
<template>
  <DataTable
    :columns="columns"
    :dataUrl="'/api/users'"
    :serverSidePagination="true"
    @data-loaded="handleDataLoaded"
  />
</template>

<script setup lang="ts">
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

const handleDataLoaded = (data: any) => {
  console.log('Données chargées:', data)
}
</script>
```

---

## 📈 Charts

### BarChart

```vue
<template>
  <BarChart
    :data="chartData"
    :options="chartOptions"
  />
</template>

<script setup lang="ts">
import { BarChart } from '@SMATCH-Digital-dev/vue-system-design'

const chartData = {
  categories: ['Jan', 'Feb', 'Mar', 'Apr'],
  series: [
    {
      name: 'Ventes',
      data: [120, 200, 150, 180]
    }
  ]
}

const chartOptions = {
  title: 'Ventes Mensuelles',
  height: 400
}
</script>
```

### PieChart

```vue
<template>
  <PieChart
    :data="pieData"
    :options="chartOptions"
  />
</template>

<script setup lang="ts">
import { PieChart } from '@SMATCH-Digital-dev/vue-system-design'

const pieData = [
  { name: 'Chrome', value: 45 },
  { name: 'Firefox', value: 30 },
  { name: 'Safari', value: 15 },
  { name: 'Edge', value: 10 }
]
</script>
```

### LineChart

```vue
<template>
  <LineChart
    :data="lineData"
    :options="chartOptions"
  />
</template>

<script setup lang="ts">
import { LineChart } from '@SMATCH-Digital-dev/vue-system-design'

const lineData = {
  categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    {
      name: 'Visiteurs',
      data: [820, 932, 901, 934, 1290]
    }
  ]
}
</script>
```

---

## 🏗️ Composants de Layout

### Header

```vue
<template>
  <Header>
    <template #logo>
      <img src="/logo.png" alt="Logo" />
    </template>
    
    <template #actions>
      <Button variant="primary">Connexion</Button>
    </template>
  </Header>
</template>

<script setup lang="ts">
import { Header, Button } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

### Sidebar

```vue
<template>
  <Sidebar :items="sidebarItems" />
</template>

<script setup lang="ts">
import { Sidebar } from '@SMATCH-Digital-dev/vue-system-design'

const sidebarItems = [
  { label: 'Dashboard', icon: 'home', path: '/dashboard' },
  { label: 'Utilisateurs', icon: 'users', path: '/users' },
  { label: 'Paramètres', icon: 'settings', path: '/settings' }
]
</script>
```

### Container

```vue
<template>
  <Container width="lg">
    <h1>Contenu de la page</h1>
  </Container>
</template>

<script setup lang="ts">
import { Container } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

### Grid

```vue
<template>
  <Grid :columns="3" :gap="4">
    <Card>Colonne 1</Card>
    <Card>Colonne 2</Card>
    <Card>Colonne 3</Card>
  </Grid>
</template>

<script setup lang="ts">
import { Grid, Card } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

---

## 🎯 Composants Overlay

### Dialog

```vue
<template>
  <Dialog
    v-model="isOpen"
    title="Confirmation"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <p>Êtes-vous sûr de vouloir continuer ?</p>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Dialog } from '@SMATCH-Digital-dev/vue-system-design'

const isOpen = ref(false)

const handleConfirm = () => {
  console.log('Confirmé')
  isOpen.value = false
}

const handleCancel = () => {
  isOpen.value = false
}
</script>
```

### Tooltip

```vue
<template>
  <Tooltip content="Ceci est un tooltip">
    <Button>Survolez-moi</Button>
  </Tooltip>
</template>

<script setup lang="ts">
import { Tooltip, Button } from '@SMATCH-Digital-dev/vue-system-design'
</script>
```

---

## 🔧 Composables

### useToast

```vue
<template>
  <Button @click="showToast">Afficher Toast</Button>
  <ToastContainer />
</template>

<script setup lang="ts">
import { Button } from '@SMATCH-Digital-dev/vue-system-design'
import { ToastContainer } from '@SMATCH-Digital-dev/vue-system-design'
// Note: useToast doit être importé depuis le package si disponible
</script>
```

---

## 📝 Types TypeScript

Le package exporte tous les types nécessaires :

```typescript
import type {
  ButtonVariant,
  ButtonSize,
  DataTableColumn,
  DataTableProps,
  AlertType,
  BadgeVariant
} from '@SMATCH-Digital-dev/vue-system-design'
```

---

## 🎨 Styles Personnalisés

Les styles sont inclus automatiquement avec l'import :

```typescript
import '@SMATCH-Digital-dev/vue-system-design/styles'
```

Pour personnaliser les styles, vous pouvez surcharger les variables CSS :

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

---

## 📦 Exports Disponibles

### Export Principal

```typescript
import {
  // Composants de base
  Button, Input, Card, Alert, Badge, Form,
  // DataTable
  DataTable,
  // Charts
  BarChart, PieChart, LineChart,
  // Layout
  Header, Sidebar, Footer, Container,
  // Overlay
  Dialog, Tooltip, Popover
} from '@SMATCH-Digital-dev/vue-system-design'
```

### Export par Catégorie

```typescript
// Composants uniquement
import { Button, Card } from '@SMATCH-Digital-dev/vue-system-design/components'

// Composables uniquement
import { useToast } from '@SMATCH-Digital-dev/vue-system-design/composables'

// Utilitaires uniquement
import { formatDate } from '@SMATCH-Digital-dev/vue-system-design/utils'

// Styles uniquement
import '@SMATCH-Digital-dev/vue-system-design/styles'
```

---

## 🆘 Dépannage

### Erreur : "Cannot find module"

1. Vérifier que le package est installé : `npm list @SMATCH-Digital-dev/vue-system-design`
2. Vérifier le token GitHub : `echo $env:GITHUB_TOKEN`
3. Réinstaller : `npm install @SMATCH-Digital-dev/vue-system-design`

### Erreur : "401 Unauthorized"

1. Vérifier le fichier `.npmrc`
2. Vérifier que `GITHUB_TOKEN` est défini
3. Vérifier que le token a la permission `read:packages`

### Styles non appliqués

1. Vérifier que les styles sont importés : `import '@SMATCH-Digital-dev/vue-system-design/styles'`
2. Vérifier que Tailwind CSS est configuré dans votre projet

---

## 📚 Ressources

- **Repository** : https://github.com/SMATCH-Digital-dev/smatch-system-design-vue
- **Package** : `@SMATCH-Digital-dev/vue-system-design@1.0.0`
- **Version** : 1.0.0

---

## 💡 Exemples Complets

### Formulaire Complet

```vue
<template>
  <Container width="md">
    <Card>
      <template #header>
        <h2>Créer un utilisateur</h2>
      </template>
      
      <Form @submit="handleSubmit">
        <FormGroup>
          <FormLabel>Nom</FormLabel>
          <Input v-model="form.name" :error="errors.name" />
          <FormError v-if="errors.name">{{ errors.name }}</FormError>
        </FormGroup>
        
        <FormGroup>
          <FormLabel>Email</FormLabel>
          <Input v-model="form.email" type="email" />
        </FormGroup>
        
        <div class="flex gap-2">
          <Button type="submit" variant="primary">Créer</Button>
          <Button type="button" variant="secondary" @click="handleCancel">Annuler</Button>
        </div>
      </Form>
    </Card>
  </Container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Container, Card, Form, FormGroup, FormLabel,
  FormError, Input, Button
} from '@SMATCH-Digital-dev/vue-system-design'

const form = ref({ name: '', email: '' })
const errors = ref({})

const handleSubmit = () => {
  // Validation et soumission
}

const handleCancel = () => {
  // Annulation
}
</script>
```

### Dashboard avec DataTable et Charts

```vue
<template>
  <Container>
    <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
    
    <Grid :columns="2" :gap="4" class="mb-6">
      <Card>
        <h3>Ventes</h3>
        <BarChart :data="salesData" />
      </Card>
      
      <Card>
        <h3>Répartition</h3>
        <PieChart :data="distributionData" />
      </Card>
    </Grid>
    
    <Card>
      <template #header>
        <h3>Liste des commandes</h3>
      </template>
      
      <DataTable
        :columns="orderColumns"
        :rowDataProp="orders"
        :pagination="true"
        :pageSize="10"
      />
    </Card>
  </Container>
</template>

<script setup lang="ts">
import {
  Container, Card, Grid, DataTable,
  BarChart, PieChart
} from '@SMATCH-Digital-dev/vue-system-design'

const salesData = { /* ... */ }
const distributionData = [ /* ... */ ]
const orderColumns = [ /* ... */ ]
const orders = [ /* ... */ ]
</script>
```

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024

