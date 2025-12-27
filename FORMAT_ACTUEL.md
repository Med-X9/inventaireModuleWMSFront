# 📋 Format Actuel Supporté - QueryModel

## 🎯 Vue d'ensemble

QueryModel supporte **2 méthodes HTTP** et **plusieurs formats** pour les paramètres.

---

## 📤 Méthode 1 : POST avec JSON Body (Recommandé)

### Format de base

```json
{
  "page": 1,
  "pageSize": 10,
  "search": "recherche globale",
  "sort": [...],
  "filters": {...}
}
```

### Exemple complet

```json
{
  "page": 2,
  "pageSize": 20,
  "search": "ink",
  "sort": [
    {"colId": "category", "sort": "asc"},
    {"colId": "created_at", "sort": "desc"}
  ],
  "filters": {
    "status": ["active", "pending"],
    "category": {
      "type": "text",
      "operator": "contains",
      "value": "ink"
    },
    "price": {
      "type": "number",
      "operator": "gte",
      "value": 10
    }
  }
}
```

---

## 📤 Méthode 2 : GET avec Query Parameters

### Format de base

```
GET /api/endpoint/?page=1&pageSize=10&search=...&sort=...&filters=...
```

### Paramètres supportés

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `page` | int | Numéro de page (1-indexed) | `page=1` |
| `pageSize` | int | Taille de page | `pageSize=10` |
| `search` | string | Recherche globale | `search=ink` |
| `sort` | JSON string | Tri multiple (array JSON) | `sort=[{"colId":"name","sort":"asc"}]` |
| `sortBy` | string | Tri simple (colonne) | `sortBy=name` |
| `sortDir` | string | Tri simple (direction) | `sortDir=asc` |
| `filters` | JSON string | Filtres (object JSON) | `filters={"status":["active"]}` |

---

## 🔄 Formats de Tri Supportés

### Format 1 : Tri Multiple (JSON string dans GET)

**GET :**
```
?sort=[{"colId":"category","sort":"asc"},{"colId":"created_at","sort":"desc"}]
```

**POST :**
```json
{
  "sort": [
    {"colId": "category", "sort": "asc"},
    {"colId": "created_at", "sort": "desc"}
  ]
}
```

### Format 2 : Tri Simple (sortBy + sortDir)

**GET :**
```
?sortBy=created_at&sortDir=desc
```

**POST :**
```json
{
  "sortBy": "created_at",
  "sortDir": "desc"
}
```

**Note :** Le tri simple est automatiquement converti en format multiple en interne.

---

## 🔍 Formats de Filtres Supportés

### Format 1 : Filtre Simple (Array)

**GET :**
```
?filters={"status":["active","pending"]}
```

**POST :**
```json
{
  "filters": {
    "status": ["active", "pending"]
  }
}
```

### Format 2 : Filtre Multi (Object avec type)

**GET :**
```
?filters={"status":{"type":"multi","values":["active","pending"]}}
```

**POST :**
```json
{
  "filters": {
    "status": {
      "type": "multi",
      "values": ["active", "pending"]
    }
  }
}
```

### Format 3 : Filtre Texte

**GET :**
```
?filters={"category":{"type":"text","operator":"contains","value":"ink"}}
```

**POST :**
```json
{
  "filters": {
    "category": {
      "type": "text",
      "operator": "contains",
      "value": "ink"
    }
  }
}
```

### Format 4 : Filtre Numérique

**GET :**
```
?filters={"price":{"type":"number","operator":"gte","value":10}}
```

**POST :**
```json
{
  "filters": {
    "price": {
      "type": "number",
      "operator": "gte",
      "value": 10
    }
  }
}
```

### Format 5 : Filtre Date (Range)

**GET :**
```
?filters={"created_at":{"type":"date","operator":"range","from":"2025-01-01","to":"2025-11-30"}}
```

**POST :**
```json
{
  "filters": {
    "created_at": {
      "type": "date",
      "operator": "range",
      "from": "2025-01-01",
      "to": "2025-11-30"
    }
  }
}
```

### Format 6 : Filtre Booléen

**GET :**
```
?filters={"is_available":{"type":"boolean","value":true}}
```

**POST :**
```json
{
  "filters": {
    "is_available": {
      "type": "boolean",
      "value": true
    }
  }
}
```

---

## 📋 Opérateurs de Filtres Supportés

| Opérateur | Description | Exemple |
|-----------|-------------|---------|
| `contains` | Contient (texte) | `{"operator":"contains","value":"ink"}` |
| `startsWith` | Commence par | `{"operator":"startsWith","value":"ink"}` |
| `endsWith` | Se termine par | `{"operator":"endsWith","value":"ink"}` |
| `equals` / `eq` | Égal à | `{"operator":"equals","value":"active"}` |
| `notEqual` / `neq` | Différent de | `{"operator":"notEqual","value":"inactive"}` |
| `gte` | Supérieur ou égal | `{"operator":"gte","value":10}` |
| `lte` | Inférieur ou égal | `{"operator":"lte","value":100}` |
| `gt` | Supérieur à | `{"operator":"gt","value":10}` |
| `lt` | Inférieur à | `{"operator":"lt","value":100}` |
| `range` | Entre deux valeurs | `{"operator":"range","from":"2025-01-01","to":"2025-11-30"}` |

---

## 📥 Format de Réponse

Toutes les réponses suivent ce format :

```json
{
  "rows": [
    {"id": 1, "name": "Item 1", ...},
    {"id": 2, "name": "Item 2", ...}
  ],
  "page": 1,
  "pageSize": 10,
  "total": 100,
  "totalPages": 10
}
```

---

## 🔗 Exemples Complets

### Exemple 1 : Requête Simple (Pagination uniquement)

**GET :**
```
GET /api/inventories/?page=1&pageSize=10
```

**POST :**
```json
{
  "page": 1,
  "pageSize": 10
}
```

### Exemple 2 : Avec Recherche Globale

**GET :**
```
GET /api/inventories/?page=1&pageSize=10&search=ink
```

**POST :**
```json
{
  "page": 1,
  "pageSize": 10,
  "search": "ink"
}
```

### Exemple 3 : Avec Tri Simple

**GET :**
```
GET /api/inventories/?page=1&pageSize=10&sortBy=created_at&sortDir=desc
```

**POST :**
```json
{
  "page": 1,
  "pageSize": 10,
  "sortBy": "created_at",
  "sortDir": "desc"
}
```

### Exemple 4 : Avec Tri Multiple

**GET :**
```
GET /api/inventories/?page=1&pageSize=10&sort=[{"colId":"category","sort":"asc"},{"colId":"created_at","sort":"desc"}]
```

**POST :**
```json
{
  "page": 1,
  "pageSize": 10,
  "sort": [
    {"colId": "category", "sort": "asc"},
    {"colId": "created_at", "sort": "desc"}
  ]
}
```

### Exemple 5 : Avec Filtres

**GET :**
```
GET /api/inventories/?page=1&pageSize=10&filters={"status":["active"],"price":{"type":"number","operator":"gte","value":10}}
```

**POST :**
```json
{
  "page": 1,
  "pageSize": 10,
  "filters": {
    "status": ["active"],
    "price": {
      "type": "number",
      "operator": "gte",
      "value": 10
    }
  }
}
```

### Exemple 6 : Requête Complète

**GET :**
```
GET /api/inventories/?page=2&pageSize=20&search=ink&sort=[{"colId":"category","sort":"asc"}]&filters={"status":["active","pending"],"price":{"type":"number","operator":"gte","value":10}}
```

**POST :**
```json
{
  "page": 2,
  "pageSize": 20,
  "search": "ink",
  "sort": [
    {"colId": "category", "sort": "asc"}
  ],
  "filters": {
    "status": ["active", "pending"],
    "price": {
      "type": "number",
      "operator": "gte",
      "value": 10
    }
  }
}
```

---

## ⚠️ Notes Importantes

1. **GET avec JSON strings** : Les paramètres `sort` et `filters` doivent être encodés en JSON string et URL-encodés
2. **POST recommandé** : Pour les requêtes complexes, POST avec JSON body est plus lisible
3. **Tri simple vs multiple** : Le tri simple (`sortBy`/`sortDir`) est automatiquement converti en format multiple
4. **Filtres array** : Un array simple `["value1", "value2"]` est automatiquement converti en filtre multi
5. **Valeurs par défaut** : `page=1`, `pageSize=10`, `sortDir=asc` si non spécifiés

---

## 🔧 Encodage URL pour GET

Quand vous utilisez GET avec des paramètres JSON, vous devez les encoder :

```javascript
// JavaScript
const sort = JSON.stringify([{"colId":"name","sort":"asc"}]);
const filters = JSON.stringify({"status":["active"]});
const url = `/api/endpoint/?page=1&pageSize=10&sort=${encodeURIComponent(sort)}&filters=${encodeURIComponent(filters)}`;
```

---

## 📚 Référence Rapide

| Paramètre | GET | POST | Type |
|-----------|-----|------|------|
| Pagination | `?page=1&pageSize=10` | `{"page":1,"pageSize":10}` | int |
| Recherche | `?search=ink` | `{"search":"ink"}` | string |
| Tri simple | `?sortBy=name&sortDir=asc` | `{"sortBy":"name","sortDir":"asc"}` | string |
| Tri multiple | `?sort=[{...}]` (JSON) | `{"sort":[{...}]}` | array |
| Filtres | `?filters={...}` (JSON) | `{"filters":{...}}` | object |

