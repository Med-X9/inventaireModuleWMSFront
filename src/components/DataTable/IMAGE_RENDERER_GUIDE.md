# Guide d'utilisation du Renderer d'Images dans DataTable

## 🖼️ Vue d'ensemble

Le DataTable supporte maintenant l'affichage d'images via le type de colonne `image`. Ce renderer offre de nombreuses options de personnalisation.

---

## 📋 Configuration de base

Pour afficher une image, définissez simplement `dataType: 'image'` dans votre configuration de colonne :

```typescript
const columns = [
    {
        field: 'article_image_url',
        headerName: 'Photo',
        dataType: 'image',
        sortable: false,
        filterable: false
    }
]
```

---

## ⚙️ Options de configuration

### Dimensions

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageWidth: 60,        // Largeur en pixels (défaut: 50)
    imageHeight: 60        // Hauteur en pixels (défaut: 50)
}
```

### Forme de l'image

```typescript
// Image ronde (avatar)
{
    field: 'avatar',
    headerName: 'Avatar',
    dataType: 'image',
    imageRounded: true,     // Image circulaire
    imageWidth: 40,
    imageHeight: 40
}

// Bordures personnalisées
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageBorderRadius: '8px'  // Coins arrondis personnalisés
}
```

### Gestion du contenu

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageObjectFit: 'cover',  // Options: 'cover', 'contain', 'fill', 'none', 'scale-down'
    imageWidth: 80,
    imageHeight: 60
}
```

### Placeholder pour images manquantes

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imagePlaceholder: '/images/no-image.png'  // Image par défaut si valeur vide
}
```

### Gestion des erreurs

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageOnError: '/images/error-image.png'  // Image de secours si erreur de chargement
}
```

### Image cliquable

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageClickable: true,           // Rend l'image cliquable
    imageClickTarget: '_blank'      // Ouvre dans un nouvel onglet
}
```

### Effet zoom au survol

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageZoomOnHover: true,  // Zoom au survol de la souris
    imageWidth: 60,
    imageHeight: 60
}
```

### Styles personnalisés

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageClass: 'shadow-lg border-2 border-gray-300',  // Classes CSS
    imageStyle: 'box-shadow: 0 4px 6px rgba(0,0,0,0.1);' // Style inline additionnel
}
```

### Texte alternatif

```typescript
{
    field: 'photo',
    headerName: 'Photo',
    dataType: 'image',
    imageAlt: 'Photo du produit'  // Texte alternatif pour accessibilité
}
```

---

## 🎨 Exemples complets

### 1. Avatar utilisateur

```typescript
{
    field: 'user_avatar',
    headerName: 'Avatar',
    dataType: 'image',
    imageWidth: 40,
    imageHeight: 40,
    imageRounded: true,
    imageObjectFit: 'cover',
    imageAlt: 'Avatar utilisateur',
    imagePlaceholder: '/images/default-avatar.png'
}
```

### 2. Photo de produit avec zoom

```typescript
{
    field: 'product_image',
    headerName: 'Image',
    dataType: 'image',
    imageWidth: 80,
    imageHeight: 80,
    imageObjectFit: 'cover',
    imageBorderRadius: '8px',
    imageZoomOnHover: true,
    imageClickable: true,
    imageClickTarget: '_blank',
    imageOnError: '/images/no-product.png',
    imageClass: 'shadow-md hover:shadow-lg transition-shadow'
}
```

### 3. Miniature dans une liste d'articles

```typescript
{
    field: 'article_image_url',
    headerName: 'Photo',
    dataType: 'image',
    imageWidth: 50,
    imageHeight: 50,
    imageObjectFit: 'cover',
    imageBorderRadius: '4px',
    imageAlt: 'Photo de l\'article',
    imagePlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle"%3ENo image%3C/text%3E%3C/svg%3E',
    sortable: false,
    filterable: false
}
```

### 4. Logo avec dimensions fixes

```typescript
{
    field: 'company_logo',
    headerName: 'Logo',
    dataType: 'image',
    imageWidth: 120,
    imageHeight: 40,
    imageObjectFit: 'contain',
    imageBorderRadius: '0',
    imageAlt: 'Logo de l\'entreprise',
    sortable: false,
    filterable: false
}
```

---

## 🔧 Utilisation dans un composable

Exemple complet dans `useArticleArchiveeView.ts` :

```typescript
const dtColumns = computed<DataTableColumnConfig[]>(() => [
    {
        field: 'article_image_url',
        headerName: 'Photo',
        sortable: false,
        filterable: false,
        dataType: 'image',
        imageWidth: 50,
        imageHeight: 50,
        imageObjectFit: 'cover',
        imageBorderRadius: '4px',
        imageAlt: 'Photo de l\'article',
        imageOnError: '/images/placeholder-article.png',
        imageZoomOnHover: true
    },
    {
        field: 'article_code_article',
        headerName: 'Code Article',
        sortable: true,
        filterable: true,
        dataType: 'string'
    },
    // ... autres colonnes
])
```

---

## 📝 Notes importantes

1. **Performance** : Pour de grandes listes d'images, pensez à utiliser le virtual scrolling du DataTable
2. **URLs relatives vs absolues** : Assurez-vous que vos URLs d'images sont correctes
3. **CORS** : Si les images proviennent d'un autre domaine, vérifiez les politiques CORS
4. **Accessibilité** : Utilisez toujours `imageAlt` pour améliorer l'accessibilité
5. **Fallbacks** : Configurez `imagePlaceholder` et `imageOnError` pour une meilleure expérience utilisateur

---

## 🐛 Dépannage

### L'image ne s'affiche pas
- Vérifiez que le champ contient une URL valide
- Vérifiez la console pour les erreurs de chargement
- Testez l'URL de l'image dans votre navigateur

### L'image est déformée
- Ajustez `imageObjectFit` (essayez 'cover' ou 'contain')
- Vérifiez que les proportions `imageWidth` / `imageHeight` correspondent à l'image

### Le placeholder ne s'affiche pas
- Vérifiez le chemin du `imagePlaceholder`
- Le placeholder par défaut (SVG inline) est toujours disponible

---

## 🚀 Prochaines améliorations possibles

- [ ] Support du lazy loading des images
- [ ] Lightbox pour agrandir les images
- [ ] Support des images multiples (galerie)
- [ ] Compression/optimisation automatique
- [ ] Support des formats modernes (WebP, AVIF)

