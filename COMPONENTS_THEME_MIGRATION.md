# 🎨 Migration des Composants vers le Système de Thème Unifié

## ✅ Composants Migrés

### 1. **Modal.vue**
- ✅ Remplacé `bg-gray-500` → `bg-text-dark`
- ✅ Remplacé `text-gray-500/700/900` → `text-text-muted/text-text-dark`
- ✅ Ajouté `font-heading` pour les titres
- ✅ Remplacé `background: white` → `background: var(--color-bg-card)`

### 2. **AlertMessage.vue**
- ✅ Remplacé toutes les couleurs Tailwind standard (`red-*`, `orange-*`, etc.) par les couleurs du thème :
  - `bg-red-50` → `bg-alert-error`
  - `bg-orange-100` → `bg-warning-light`
  - `text-red-600` → `text-error`
  - `bg-red-500` → `bg-error`
  - etc.
- ✅ Ajouté `font-heading` pour les titres
- ✅ Remplacé `bg-white` → `bg-card`
- ✅ Remplacé `bg-gray-500` → `bg-text-muted`

### 3. **ValidationAlert.vue**
- ✅ Remplacé `bg-black` → `bg-text-dark`
- ✅ Remplacé `bg-white` → `bg-card`
- ✅ Remplacé `bg-gray-*` → `bg-bg-dark` / `bg-card` / `bg-border`
- ✅ Remplacé `text-gray-*` → `text-text-dark` / `text-text` / `text-text-muted`
- ✅ Remplacé `bg-red-*` → `bg-error` / `bg-error-light` / `bg-alert-error`
- ✅ Remplacé `bg-blue-*` → `bg-info` / `bg-info-50`
- ✅ Ajouté `font-heading` et `font-body` pour la typographie
- ✅ Remplacé `border-gray-*` → `border-border` / `border-border-dark`

### 4. **Tooltip.vue**
- ✅ Remplacé `text-white` → `text-card`
- ✅ Ajouté `font-body` pour la typographie
- ✅ `bg-primary` était déjà utilisé (correct)

## 📋 Classes du Thème Utilisées

### Couleurs de fond
- `bg-app` - Arrière-plan principal
- `bg-card` - Arrière-plan carte
- `bg-primary` - Couleur primaire
- `bg-error`, `bg-success`, `bg-warning`, `bg-info` - Couleurs d'état
- `bg-alert-error`, `bg-alert-warning`, `bg-alert-success` - Arrière-plans d'alertes
- `bg-text-dark` - Pour overlays

### Couleurs de texte
- `text-text-dark` - Texte principal
- `text-text` - Texte (mode sombre)
- `text-text-muted` - Texte secondaire
- `text-text-light` - Texte clair
- `text-primary`, `text-error`, `text-success`, `text-warning`, `text-info` - Couleurs d'état
- `text-card` - Texte sur fond coloré

### Polices
- `font-heading` - Montserrat (titres)
- `font-body` - Roboto (texte)

### Bordures
- `border-border` - Bordure par défaut
- `border-border-dark` - Bordure sombre

## 🔄 Prochaines Étapes

- [ ] Migrer les composants Form/ vers le système de thème
- [ ] Migrer les composants DataTable/ vers le système de thème
- [ ] Migrer les composants layout/ vers le système de thème

## 📝 Notes

- Toutes les classes utilisent maintenant le système de thème unifié via Tailwind
- Les valeurs proviennent de `src/theme/colors.ts` et `src/theme/typography.ts`
- Les classes sont disponibles directement via Tailwind (ex: `bg-primary`, `text-error`)
- Support du mode sombre via les classes `dark:*`

