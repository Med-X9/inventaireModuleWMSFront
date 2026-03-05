# 🎨 Installation du Thème

Le thème est maintenant inclus dans le package `@SMATCH-Digital-dev/vue-system-design` et peut être appliqué automatiquement dans votre application.

## 📦 Installation

### 1. Importer les styles du thème

Dans votre fichier `main.ts` (ou votre point d'entrée principal), importez les styles :

```typescript
import { createApp } from 'vue'
import App from './App.vue'

// Importer les styles du package (inclut le thème)
import '@SMATCH-Digital-dev/vue-system-design/styles'

// Optionnel : Installer le thème programmatiquement
import { installTheme } from '@SMATCH-Digital-dev/vue-system-design/theme/install'

const app = createApp(App)

// Installer le thème (optionnel, les styles CSS sont déjà appliqués)
installTheme()

app.mount('#app')
```

### 2. Utilisation simple (recommandé)

Si vous importez déjà les styles du package, le thème est automatiquement appliqué :

```typescript
import { createApp } from 'vue'
import App from './App.vue'

// Les styles incluent automatiquement le thème
import '@SMATCH-Digital-dev/vue-system-design/styles'

const app = createApp(App)
app.mount('#app')
```

## 🎯 Utilisation du thème dans votre code

### Importer les constantes du thème

```typescript
import { 
  colors, 
  spacing, 
  typography,
  shadows,
  breakpoints,
  theme 
} from '@SMATCH-Digital-dev/vue-system-design/theme'

// Utiliser les couleurs
const primaryColor = colors.primary.DEFAULT // '#4F46E5'

// Utiliser les espacements
const padding = spacing[4] // '1rem'

// Utiliser la typographie
const headingFont = typography.fontFamilies.heading
```

### Utiliser les variables CSS

Le thème expose des variables CSS que vous pouvez utiliser dans vos composants :

```vue
<template>
  <div class="my-component">
    <h1 class="text-primary">Titre</h1>
    <p class="bg-card p-4">Contenu</p>
  </div>
</template>

<style scoped>
.my-component {
  background-color: var(--color-bg-app);
  color: var(--color-text);
  padding: var(--spacing-4);
}
</style>
```

## 🎨 Variables CSS disponibles

### Couleurs
- `--color-primary`, `--color-primary-light`, `--color-primary-dark`
- `--color-secondary`, `--color-secondary-light`, `--color-secondary-dark`
- `--color-error`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
- `--color-text`, `--color-text-light`, `--color-text-dark`, `--color-text-muted`
- `--color-bg-app`, `--color-bg-card`, `--color-bg-hover`
- `--color-border`, `--color-border-light`, `--color-border-dark`

### Typographie
- `--font-heading` : Police pour les titres
- `--font-body` : Police pour le texte
- `--font-mono` : Police monospace

## 🌙 Mode sombre

Le thème supporte automatiquement le mode sombre via la classe `.dark` :

```vue
<template>
  <div :class="{ dark: isDarkMode }">
    <!-- Votre contenu -->
  </div>
</template>
```

Les variables CSS s'adaptent automatiquement en mode sombre.

## 📚 Documentation complète

Pour plus de détails sur le thème, consultez :
- Les exports TypeScript : `@SMATCH-Digital-dev/vue-system-design/theme`
- Les constantes disponibles dans `src/theme/` du package

