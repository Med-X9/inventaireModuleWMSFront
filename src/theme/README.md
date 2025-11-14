# 🎨 Système de Thème WMS

Ce dossier contient la configuration complète du thème pour l'application WMS / Gestion d'inventaire, avec un style **Tech & Industrielle**.

## 📁 Structure

```
src/theme/
├── colors.ts          # Palette de couleurs complète
├── typography.ts      # Configuration de la typographie
├── theme.css          # Variables CSS pour le thème
├── index.ts           # Point d'entrée (exports)
└── README.md          # Documentation
```

## 🎨 Palette de Couleurs

### Couleurs Principales

- **Primaire** : `#4F46E5` (Indigo) - Boutons principaux, titres
- **Secondaire** : `#6366F1` (Indigo clair) - Hover, accents

### Couleurs d'État

- **Error** : `#EF4444` (Rouge vif) - Alertes et erreurs importantes
- **Success** : `#10B981` (Vert émeraude) - Statuts OK, confirmations
- **Warning** : `#FBBF24` (Jaune/Orange) - Alertes modérées
- **Danger** : `#DC2626` (Rouge sombre) - Situations critiques
- **Info** : `#3B82F6` (Bleu clair) - Messages informatifs

### Arrière-plans

- **App** : `#F8FAFC` (Gris très clair)
- **Card** : `#FFFFFF` (Blanc)
- **Hover** : `#E0E7FF` (Indigo très clair)
- **Dark** : `#1E293B` (Bleu nuit)

### Typographie

- **Texte principal** : `#0F172A` (Bleu nuit très foncé)
- **Texte light** : `#475569`
- **Texte muted** : `#64748B`

## 📝 Typographie

### Polices

- **Titres (H1-H6)** : `Montserrat` - Moderne, industriel, lisible
- **Corps de texte** : `Roboto` - Standard, lisible pour dashboards
- **Code** : `Roboto Mono` - Monospace

### Tailles

- `xs`: 12px
- `sm`: 14px
- `base`: 16px
- `lg`: 18px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 30px
- `4xl`: 36px
- `5xl`: 48px
- `6xl`: 60px

## 🚀 Utilisation

### Dans les composants Vue

```vue
<template>
  <div class="bg-bg-card text-text">
    <h1 class="font-heading text-primary">Titre</h1>
    <p class="font-body text-text-muted">Texte</p>
  </div>
</template>
```

### Avec Tailwind CSS

```html
<!-- Couleurs -->
<div class="bg-primary text-white">Bouton principal</div>
<div class="bg-success text-white">Succès</div>
<div class="bg-error text-white">Erreur</div>

<!-- Typographie -->
<h1 class="font-heading text-4xl font-bold">Titre</h1>
<p class="font-body text-base">Paragraphe</p>
```

### Variables CSS

```css
.my-element {
  background-color: var(--color-primary);
  color: var(--color-text);
  font-family: var(--font-heading);
}
```

### Import TypeScript

```typescript
import { colors, typography } from '@/theme'

const primaryColor = colors.primary.DEFAULT
const headingFont = typography.fontFamilies.heading
```

## 🔧 Configuration Tailwind

Le thème est intégré dans `tailwind.config.cjs`. Toutes les couleurs sont disponibles via les classes Tailwind :

- `bg-primary`, `text-primary`, `border-primary`
- `bg-success`, `text-success`, `border-success`
- `bg-error`, `text-error`, `border-error`
- `bg-warning`, `text-warning`, `border-warning`
- `bg-info`, `text-info`, `border-info`
- `bg-bg-app`, `bg-bg-card`, `bg-bg-hover`
- `text-text`, `text-text-light`, `text-text-muted`
- `font-heading`, `font-body`, `font-mono`

## 🌙 Mode Sombre

Le mode sombre est automatiquement géré via les variables CSS dans `theme.css`. Les couleurs s'adaptent automatiquement quand la classe `.dark` est appliquée.

## 📚 Exemples

### Bouton Principal

```vue
<button class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded">
  Action
</button>
```

### Carte d'Information

```vue
<div class="bg-bg-card border border-border rounded-lg p-6 shadow-lg">
  <h3 class="font-heading text-xl font-semibold text-text mb-2">Titre</h3>
  <p class="font-body text-text-muted">Description</p>
</div>
```

### Badge de Statut

```vue
<span class="bg-success-light text-success px-3 py-1 rounded-full text-sm font-medium">
  Actif
</span>
```

## 🔄 Migration depuis l'ancien thème

L'ancien thème utilisait `#FACC15` (jaune) comme couleur principale. La nouvelle palette utilise l'indigo (`#4F46E5`) pour un style plus professionnel et industriel.

Les couleurs legacy sont toujours disponibles pour la compatibilité :
- `primary` (ancien jaune) → maintenant indigo
- `secondary` (ancien gris) → maintenant indigo clair

## 📖 Référence Complète

Voir les fichiers :
- `colors.ts` pour toutes les couleurs disponibles
- `typography.ts` pour tous les styles de typographie
- `theme.css` pour les variables CSS

