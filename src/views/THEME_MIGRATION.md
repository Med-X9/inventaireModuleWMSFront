# 🎨 Migration vers le Système de Thème

## ✅ Fichiers Migrés

### Planning.vue
- ✅ `#1e293b` → `var(--color-text-dark)`
- ✅ `#64748b` → `var(--color-text-muted)`
- ✅ `#e5e7eb` → `var(--color-border)`
- ✅ `#ffffff` → `var(--color-bg-card)`
- ✅ `#ef4444` → `var(--color-error)`
- ✅ `rgba(250, 204, 21, 0.3)` → `rgba(79, 70, 229, 0.3)` (couleur primaire)
- ✅ Backgrounds remplacés par `var(--color-bg-app)` et `var(--color-bg-card)`

### InventoryManagement.vue
- ✅ `#FFCC11` et `#e0ac06` → `from-primary to-primary-dark` (classes Tailwind)
- ✅ `#3b82f6` → `var(--color-info)`

## 📋 Mapping des Couleurs

### Couleurs de Texte
- `#1e293b` → `var(--color-text-dark)`
- `#64748b` → `var(--color-text-muted)`
- `#475569` → `var(--color-text-light)`
- `#0F172A` → `var(--color-text)`

### Arrière-plans
- `#ffffff` → `var(--color-bg-card)`
- `#F8FAFC` → `var(--color-bg-app)`
- `#E0E7FF` → `var(--color-bg-hover)`

### Bordures
- `#e5e7eb` → `var(--color-border)`
- `#E2E8F0` → `var(--color-border)`
- `#F1F5F9` → `var(--color-border-light)`

### Couleurs d'État
- `#ef4444` → `var(--color-error)`
- `#10B981` → `var(--color-success)`
- `#FBBF24` → `var(--color-warning)`
- `#3B82F6` → `var(--color-info)`
- `#DC2626` → `var(--color-danger)`

## 🔄 Fichiers Restants à Migrer

- [ ] `Affecter.vue`
- [ ] `JobTracking.vue`
- [ ] `InventoryCreation.vue`
- [ ] `JobManagement.vue`
- [ ] `InventoryResults.vue`
- [ ] `LaunchJobs.vue`

## 📝 Guide de Migration

### Étape 1 : Identifier les couleurs codées en dur
```bash
grep -r "#[0-9a-fA-F]\{3,6\}" src/views/
```

### Étape 2 : Remplacer par les variables du thème
Utiliser le mapping ci-dessus pour remplacer chaque couleur.

### Étape 3 : Vérifier les classes Tailwind
Si des classes Tailwind sont utilisées, s'assurer qu'elles utilisent les couleurs du thème :
- `text-slate-900` → `text-primary` ou utiliser `var(--color-text-dark)`
- `bg-white` → `bg-card` ou utiliser `var(--color-bg-card)`

### Étape 4 : Tester le mode sombre
Vérifier que les couleurs s'adaptent correctement au mode sombre grâce aux variables CSS.

## 🎯 Avantages

1. **Cohérence** : Toutes les couleurs utilisent le même système
2. **Maintenabilité** : Changement centralisé dans `theme.css`
3. **Mode sombre** : Support automatique via les variables CSS
4. **Accessibilité** : Contraste garanti par le thème

