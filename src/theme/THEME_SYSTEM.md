# 🎨 Système de Thème Unifié - Documentation

## 📋 Vue d'ensemble

Le système de thème est maintenant **unifié** avec `src/theme/` comme **source unique de vérité** pour toutes les couleurs, polices et styles de l'application.

## 🏗️ Architecture

```
src/theme/
├── colors.ts          # Source TypeScript - Palette de couleurs
├── typography.ts      # Source TypeScript - Configuration typographie
├── index.ts           # Point d'entrée TypeScript (exports)
├── theme.bridge.cjs   # Pont CommonJS → Tailwind (source unique)
├── theme.css          # Variables CSS (synchronisé avec colors.ts)
└── theme.config.js    # Ancien fichier (à supprimer)

tailwind.config.cjs    # Utilise theme.bridge.cjs comme source unique
```

## 🔄 Flux de données

```
src/theme/colors.ts + typography.ts
          ↓
src/theme/theme.bridge.cjs (pont CommonJS)
          ↓
tailwind.config.cjs → Classes Tailwind (bg-primary, text-text-dark, etc.)
          ↓
Composants & Vues → Utilisent uniquement Tailwind
```

## ✅ Source unique de vérité

**TOUTES les valeurs de couleurs et polices proviennent de :**
- `src/theme/colors.ts` - Couleurs
- `src/theme/typography.ts` - Polices

Ces valeurs sont ensuite :
1. Exportées via `theme.bridge.cjs` (CommonJS pour Tailwind)
2. Configurées dans `tailwind.config.cjs`
3. Synchronisées dans `theme.css` (fallback/variables CSS)

## 🎯 Utilisation dans les composants

### ✅ Utiliser Tailwind (Recommandé)

```vue
<template>
  <div class="bg-app text-text-dark font-body">
    <h1 class="text-primary font-heading text-2xl">Titre</h1>
    <p class="text-text-muted">Texte secondaire</p>
    <button class="bg-primary text-card hover:bg-primary-dark">
      Action
    </button>
  </div>
</template>
```

### Classes Tailwind disponibles

#### Couleurs de fond
- `bg-app` - Arrière-plan principal
- `bg-card` - Arrière-plan carte
- `bg-primary` - Couleur primaire
- `bg-success`, `bg-error`, `bg-warning`, `bg-info` - Couleurs d'état
- `bg-bg-app`, `bg-bg-card` - Structure imbriquée (compatibilité)

#### Couleurs de texte
- `text-text-dark` - Texte principal
- `text-text-muted` - Texte secondaire
- `text-primary` - Texte primaire
- `text-success`, `text-error`, `text-warning`, `text-info` - Couleurs d'état

#### Polices
- `font-heading` - Montserrat (titres)
- `font-body` - Roboto (texte)
- `font-mono` - Roboto Mono (code)

#### Bordures
- `border-border` - Bordure par défaut
- `border-primary` - Bordure primaire

## 🔧 Modification du thème

Pour modifier une couleur ou une police :

1. **Éditer la source** : `src/theme/colors.ts` ou `src/theme/typography.ts`
2. **Synchroniser le bridge** : Mettre à jour `src/theme/theme.bridge.cjs` avec les mêmes valeurs
3. **Synchroniser CSS** : Mettre à jour `src/theme/theme.css` (optionnel, pour compatibilité)

**⚠️ IMPORTANT** : Les valeurs dans `theme.bridge.cjs` doivent correspondre EXACTEMENT à celles dans `colors.ts` et `typography.ts`.

## 📝 Migration en cours

### ✅ Terminé
- [x] Création de `theme.bridge.cjs` comme pont CommonJS
- [x] `tailwind.config.cjs` utilise maintenant le thème unifié
- [x] Variables CSS synchronisées
- [x] `Planning.vue` migré vers Tailwind uniquement

### 🔄 En cours
- [ ] Migration de tous les composants vers Tailwind uniquement
- [ ] Migration de toutes les vues vers Tailwind uniquement
- [ ] Suppression des styles CSS scoped inutiles

## 🚫 À éviter

### ❌ CSS natif avec couleurs codées en dur
```vue
<style scoped>
.my-class {
  background: #4F46E5; /* ❌ Mauvais */
  color: #0F172A; /* ❌ Mauvais */
}
</style>
```

### ❌ Variables CSS directement dans les composants
```vue
<style scoped>
.my-class {
  background: var(--color-primary); /* ❌ Utiliser Tailwind à la place */
}
</style>
```

## ✅ À faire

### ✅ Utiliser uniquement Tailwind
```vue
<template>
  <div class="bg-primary text-card"> <!-- ✅ Bon -->
    Content
  </div>
</template>
```

## 🔍 Vérification

Pour vérifier que tout utilise le thème unifié :

```bash
# Chercher les couleurs codées en dur dans les composants
grep -r "#[0-9a-fA-F]\{6\}" src/components/

# Chercher les styles scoped avec couleurs
grep -r "style scoped" src/components/ src/views/
```

## 📚 Références

- [Documentation Tailwind](https://tailwindcss.com/docs)
- [Variables CSS personnalisées](https://tailwindcss.com/docs/customizing-colors)
- Fichiers du thème : `src/theme/`

