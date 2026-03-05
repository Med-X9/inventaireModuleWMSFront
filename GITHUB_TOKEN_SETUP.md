# Configuration du token GitHub pour npm

## Problème
L'erreur `401 Unauthorized` indique que le token GitHub dans `.npmrc` est invalide ou expiré.

## Solution

### 1. Créer un nouveau token GitHub

1. Allez sur GitHub : https://github.com/settings/tokens
2. Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
3. Donnez un nom au token (ex: "npm-packages-access")
4. Sélectionnez les permissions :
   - ✅ **`read:packages`** (pour lire les packages)
   - ✅ **`write:packages`** (si vous devez publier des packages)
5. Cliquez sur **"Generate token"**
6. **⚠️ IMPORTANT** : Copiez le token immédiatement (il ne sera plus visible après)

### 2. Configurer le token dans votre environnement

#### Option A : Variable d'environnement (recommandé)

**Windows PowerShell :**
```powershell
# Pour la session actuelle
$env:GITHUB_TOKEN = "votre_nouveau_token_ici"

# Pour rendre permanent (ajoutez à votre profil PowerShell)
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "votre_nouveau_token_ici", "User")
```

**Windows CMD :**
```cmd
setx GITHUB_TOKEN "votre_nouveau_token_ici"
```

**Linux/Mac :**
```bash
# Ajoutez à ~/.bashrc ou ~/.zshrc
export GITHUB_TOKEN="votre_nouveau_token_ici"
```

#### Option B : Fichier .npmrc avec token direct (moins sécurisé)

Si vous préférez mettre le token directement dans `.npmrc` :

```ini
@SMATCH-Digital-dev:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_votre_nouveau_token_ici
```

⚠️ **Attention** : Ne commitez jamais le fichier `.npmrc` avec un token en dur dans Git !

### 3. Vérifier la configuration

Après avoir configuré le token, testez l'installation :

```bash
npm install @SMATCH-Digital-dev/vue-system-design
```

### 4. Si le problème persiste

- Vérifiez que le token a bien la permission `read:packages`
- Vérifiez que le token n'a pas expiré
- Vérifiez que vous avez accès au repository `@SMATCH-Digital-dev/vue-system-design`
- Vérifiez que le scope `@SMATCH-Digital-dev` est correctement configuré dans `.npmrc`

