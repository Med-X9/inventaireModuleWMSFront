# 🔍 Diagnostic de l'erreur CORS : ab.reasonlabsapi.com

## ❌ Problème
```
Access to resource at 'https://ab.reasonlabsapi.com/sub/sdk-QtSYWOMLlkHBbNMB' 
from origin 'http://147.93.55.221' has been blocked by CORS policy
```

## 🔎 Analyse
Le domaine `ab.reasonlabsapi.com` **n'existe PAS** dans votre code source. Cela signifie qu'il est injecté depuis une source externe.

## 🎯 Causes possibles

### 1. **Extension de navigateur** (Le plus probable)
Certaines extensions de navigateur injectent des scripts :
- Bloqueurs de publicité
- Outils de développement
- Extensions malveillantes
- Extensions de productivité

**Solution :**
1. Ouvrir le site en **mode navigation privée** (sans extensions)
2. Tester avec un autre navigateur
3. Désactiver toutes les extensions une par une

### 2. **Script injecté par le serveur/proxy**
Nginx ou un autre proxy pourrait injecter des scripts.

**Vérification :**
```bash
# Sur le serveur, vérifier les fichiers HTML servis
curl http://147.93.55.221 | grep -i "reasonlabsapi"
```

### 3. **Dépendance npm malveillante**
Une dépendance pourrait charger des scripts externes.

**Vérification :**
```bash
# Chercher dans node_modules
grep -r "reasonlabsapi" node_modules/
```

### 4. **Fichiers de build corrompus**
Les fichiers dans `dist/` pourraient contenir des scripts injectés.

**Vérification :**
```bash
# Après build, vérifier les fichiers générés
grep -r "reasonlabsapi" dist/
```

## 🛠️ Solutions

### Solution 1 : Vérifier les extensions de navigateur
1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet **Network**
3. Filtrer par "reasonlabsapi"
4. Voir quelle requête initie cette connexion
5. Vérifier l'onglet **Sources** pour voir d'où vient le script

### Solution 2 : Ajouter un Content Security Policy (CSP)
Ajouter dans `index.html` ou via nginx :

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data: https:;
               connect-src 'self' https://fonts.googleapis.com;">
```

### Solution 3 : Bloquer via nginx
Ajouter dans `config/nginx.conf` :

```nginx
# Bloquer les requêtes vers reasonlabsapi
location ~* reasonlabsapi {
    return 444; # Fermer la connexion
}

# Ou rediriger vers une page d'erreur
location ~* reasonlabsapi {
    return 403;
}
```

### Solution 4 : Vérifier les fichiers de build
```bash
# Rebuild propre
rm -rf dist/ node_modules/
npm install
npm run build

# Vérifier le contenu
grep -r "reasonlabsapi" dist/
```

### Solution 5 : Ajouter un filtre dans le code
Dans `src/main.ts`, ajouter un intercepteur pour bloquer ces requêtes :

```typescript
// Bloquer les requêtes vers reasonlabsapi
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0]?.toString() || '';
    if (url.includes('reasonlabsapi')) {
        console.warn('🚫 Requête bloquée vers reasonlabsapi:', url);
        return Promise.reject(new Error('Requête bloquée'));
    }
    return originalFetch.apply(this, args);
};
```

## 🔍 Commandes de diagnostic

### Sur le serveur
```bash
# Vérifier le HTML servi
curl -s http://147.93.55.221 | grep -i "reasonlabsapi"

# Vérifier les logs nginx
tail -f /var/log/nginx/access.log | grep reasonlabsapi
tail -f /var/log/nginx/error.log

# Vérifier les processus
ps aux | grep nginx
```

### Dans le navigateur (Console)
```javascript
// Vérifier tous les scripts chargés
Array.from(document.scripts).forEach(script => {
    if (script.src.includes('reasonlabsapi')) {
        console.log('Script trouvé:', script);
    }
});

// Vérifier les requêtes réseau
performance.getEntriesByType('resource')
    .filter(r => r.name.includes('reasonlabsapi'))
    .forEach(r => console.log('Requête:', r));
```

## 📋 Checklist de diagnostic

- [ ] Tester en mode navigation privée
- [ ] Tester avec un autre navigateur
- [ ] Désactiver toutes les extensions
- [ ] Vérifier les fichiers HTML servis par nginx
- [ ] Vérifier les fichiers dans `dist/` après build
- [ ] Vérifier les dépendances npm
- [ ] Vérifier les logs nginx
- [ ] Vérifier la console du navigateur pour voir l'origine de la requête

## 🎯 Action immédiate recommandée

1. **Ouvrir Chrome DevTools (F12)**
2. **Onglet Network** → Filtrer "reasonlabsapi"
3. **Onglet Sources** → Chercher "reasonlabsapi" dans tous les fichiers
4. **Onglet Console** → Exécuter les commandes de diagnostic ci-dessus

Cela vous dira **exactement** d'où vient cette requête.

