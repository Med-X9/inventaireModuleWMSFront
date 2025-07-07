# Configuration des Variables d'Environnement

Ce projet utilise des variables d'environnement pour configurer l'API et d'autres paramètres.

## Configuration

1. Copiez le fichier `env.example` vers `.env` :
```bash
cp env.example .env
```

2. Modifiez les valeurs dans le fichier `.env` selon votre environnement.

## Variables Disponibles

### Configuration de l'API

- `VITE_API_BASE_URL` : URL de base de l'API (défaut: `http://127.0.0.1:8000`)
- `VITE_API_TIMEOUT` : Timeout des requêtes API en millisecondes (défaut: `30000`)

### Configuration de l'Environnement

- `VITE_APP_ENV` : Environnement de l'application (`development`, `production`, `staging`)

### Endpoints API (Optionnels)

Ces variables permettent de personnaliser les endpoints si nécessaire :

- `VITE_API_AUTH_LOGIN` : Endpoint de connexion
- `VITE_API_AUTH_REFRESH` : Endpoint de rafraîchissement du token
- `VITE_API_AUTH_LOGOUT` : Endpoint de déconnexion
- `VITE_API_INVENTORY_BASE` : Endpoint de base pour les inventaires
- `VITE_API_WAREHOUSE_BASE` : Endpoint de base pour les entrepôts
- `VITE_API_ACCOUNT_BASE` : Endpoint de base pour les comptes
- `VITE_API_JOB_BASE` : Endpoint de base pour les jobs
- `VITE_API_RESOURCE_BASE` : Endpoint de base pour les ressources
- `VITE_API_LOCATION_BASE` : Endpoint de base pour les emplacements

## Exemples de Configuration

### Développement Local
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000
```

### Production
```env
VITE_API_BASE_URL=https://api.votre-domaine.com
VITE_APP_ENV=production
VITE_API_TIMEOUT=60000
```

### Staging
```env
VITE_API_BASE_URL=https://staging-api.votre-domaine.com
VITE_APP_ENV=staging
VITE_API_TIMEOUT=45000
```

## Sécurité

⚠️ **Important** : Ne committez jamais le fichier `.env` dans le repository. Il contient des informations sensibles.

Le fichier `.env` est déjà ajouté au `.gitignore` pour éviter les commits accidentels.

## Utilisation dans le Code

Les variables d'environnement sont accessibles via `import.meta.env` :

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const timeout = import.meta.env.VITE_API_TIMEOUT;
```

## Redémarrage Requis

Après avoir modifié le fichier `.env`, redémarrez le serveur de développement pour que les changements prennent effet :

```bash
npm run dev
``` 
