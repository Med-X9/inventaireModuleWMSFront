# Workflow inventaire MAGASIN — Setting & écarts stock

Documentation des actions **unitaire (single)** et **multi-magasins** pour le cycle magasin.

**Préfixe API :** `/web/api/`  
**Auth :** Bearer / session (utilisateur authentifié)

---

## 1. Cycle de statuts (Setting)

```
EN ATTENTE → LANCEE → TERMINEE → ANALYSER → CLOTURE
                 ↑
                 └── cancel-launch (retour EN ATTENTE)
```

| Statut | Signification |
|--------|----------------|
| `EN ATTENTE` | Magasin non lancé |
| `LANCEE` | Comptages / jobs en cours |
| `TERMINEE` | Tous les jobs du magasin sont `TERMINE` |
| `ANALYSER` | Écarts théorique/pratique calculés et persistés |
| `CLOTURE` | Magasin clôturé |

**Dates associées :** `status_date_lancement`, `status_date_termine`, `status_date_analyse`, `status_date_cloture`

> Scope des nouvelles étapes (`TERMINEE` / `ANALYSER`) : inventaire type **`MAGASIN`**.  
> GENERAL / TOURNANT : clôture historique depuis `LANCEE` (tous jobs `TERMINE`).

---

## 2. Actions Setting — single vs multi

| Action | Single | Multi | Transition |
|--------|--------|-------|------------|
| Lancer | Oui | Oui | `EN ATTENTE` → `LANCEE` |
| Annuler lancement | Oui | Non | `LANCEE` → `EN ATTENTE` |
| Terminer | Oui | Oui | `LANCEE` → `TERMINEE` |
| Analyser | Oui | Non | `TERMINEE` → `ANALYSER` (+ sync table) |
| Clôturer | Oui | Non | `ANALYSER` → `CLOTURE` (MAGASIN) |

Body multi (là où applicable) :

```json
{
  "warehouse_ids": [5, 6, 7]
}
```

Succès partiel possible : certains magasins OK, d’autres en erreur (`failed` / `failed_count`).

---

## 3. Endpoints Setting

### 3.1 Lancer — single

```http
POST /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/launch/
```

**Prérequis :** Setting `EN ATTENTE`, inventaire `EN PREPARATION` ou `EN REALISATION`, règles de couverture jobs selon type.

---

### 3.2 Lancer — multi

```http
POST /web/api/inventory/{inventory_id}/warehouses/launch/
Content-Type: application/json

{
  "warehouse_ids": [5, 6, 7]
}
```

**Réponse (extrait) :** `launched_count`, `failed_count`, `launched[]`, `failed[]`, `success`

---

### 3.3 Annuler lancement — single

```http
POST /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/cancel-launch/
```

**Prérequis :** Setting `LANCEE`  
Si plus aucun magasin lancé → inventaire repasse éventuellement en `EN PREPARATION`.

---

### 3.4 Terminer — single

```http
POST /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/termine/
```

**Prérequis (MAGASIN) :**
- Setting `LANCEE`
- Inventaire `EN REALISATION`
- ≥ 1 job pour le couple inventaire/magasin
- **Tous** les jobs au statut `TERMINE`

**Succès :** Setting → `TERMINEE`, `status_date_termine` renseignée  

**Échec métier (jobs incomplets) :** HTTP 400 + liste `jobs_not_completed`

---

### 3.5 Terminer — multi

```http
POST /web/api/inventory/{inventory_id}/warehouses/termine/
Content-Type: application/json

{
  "warehouse_ids": [5, 6, 7]
}
```

Même règles que le single, appliquées magasin par magasin.

**Réponse (extrait) :**

| Champ | Rôle |
|-------|------|
| `requested_count` | Magasins demandés |
| `completed_count` | Passés en `TERMINEE` |
| `failed_count` | Échecs |
| `completed[]` | Détail succès |
| `failed[]` | `{ warehouse_id, error, jobs_not_completed? }` |
| `success` | `true` si aucun échec et ≥ 1 succès |

---

### 3.6 Analyser — single

```http
POST /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/analyser/
```

**Prérequis (MAGASIN) :** Setting `TERMINEE`

**Effets :**
1. Calcul des écarts (`StockGapService.compute_stock_gaps`)
2. Upsert dans la table `EcartStockTheorique`
3. Setting → `ANALYSER`, `status_date_analyse` renseignée

**Règle `resultat_final` à la sync :**
- si `qte_theorique == qte_pratique` → `resultat_final = qte_pratique`
- sinon → `resultat_final = null` (à saisir)
- lignes déjà `valide=true` : `resultat_final` / `valide` non écrasés

**Réponse (extrait) :** `status`, `sync.created`, `sync.updated`, `sync.skipped_validated`

> Pas d’endpoint multi-analyser pour l’instant (uniquement single).

---

### 3.7 Clôturer — single

```http
POST /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/close/
```

| Type inventaire | Prérequis | Effet |
|-----------------|-----------|--------|
| **MAGASIN** | Setting `ANALYSER` | → `CLOTURE` |
| **GENERAL / TOURNANT** | Setting `LANCEE` + tous jobs `TERMINE` | → `CLOTURE` |

> Pas d’endpoint multi-clôture pour l’instant (uniquement single).

---

## 4. Écarts stock — table & APIs

### 4.1 Flux

```
[termine] → TERMINEE
    → [analyser] calcule + enregistre → table EcartStockTheorique + statut ANALYSER
        → GET stock-gaps lit la table (pas de recalcul)
        → PATCH resultat_final / POST valider (ligne par ligne)
            → [close] → CLOTURE
```

### 4.2 Sync technique (optionnel)

Disponible indépendamment du bouton métier « analyser » :

```http
POST /web/api/inventory/{inventory_id}/warehouses/{warehouse_id}/ecarts-stock/sync/
Content-Type: application/json

{
  "only_nonzero": false
}
```

Le parcours UI MAGASIN recommandé passe par **`/analyser/`**.

---

### 4.3 Liste écarts persistés (DataTable)

```http
GET|POST /web/api/inventory/{inventory_id}/warehouses/{warehouse_id}/ecarts-stock/?page=1&pageSize=20
```

---

### 4.4 Liste stock-gaps (lit la table)

```http
GET|POST /web/api/inventory/{inventory_id}/warehouses/{warehouse_id}/stock-gaps/?page=1&pageSize=20&only_nonzero=true
```

- **Source :** table `EcartStockTheorique` (`source: "ecart_stock_theorique"`)
- **Pas de recalcul** à la lecture
- Si pas encore analysé → liste vide / total 0
- Mapping colonnes front : `article_cle` → `cle`, `qte_pratique` → `qte_inventoriee`

---

### 4.5 Saisie résultat final — single (ligne)

```http
PATCH /web/api/ecarts-stock/{ecart_id}/
Content-Type: application/json

{
  "resultat_final": 42
}
```

**Bloqué** si `valide=true` → HTTP 400

---

### 4.6 Valider une ligne — single

```http
POST /web/api/ecarts-stock/{ecart_id}/valider/
```

**Prérequis :** `resultat_final` non null  
**Effet :** `valide=true`, `validated_at`, `validated_by`

---

## 5. Tableau récapitulatif complet

| # | Action | Single | Multi | Méthode | URL |
|---|--------|--------|-------|---------|-----|
| 1 | Lancer magasin | Oui | — | POST | `/inventory/{id}/warehouse/{wid}/launch/` |
| 2 | Lancer magasins | — | Oui | POST | `/inventory/{id}/warehouses/launch/` |
| 3 | Annuler lancement | Oui | — | POST | `/inventory/{id}/warehouse/{wid}/cancel-launch/` |
| 4 | Terminer magasin | Oui | — | POST | `/inventory/{id}/warehouse/{wid}/termine/` |
| 5 | Terminer magasins | — | Oui | POST | `/inventory/{id}/warehouses/termine/` |
| 6 | Analyser (sync + statut) | Oui | — | POST | `/inventory/{id}/warehouse/{wid}/analyser/` |
| 7 | Clôturer magasin | Oui | — | POST | `/inventory/{id}/warehouse/{wid}/close/` |
| 8 | Sync écarts (tech.) | Oui | — | POST | `/inventory/{id}/warehouses/{wid}/ecarts-stock/sync/` |
| 9 | Liste écarts persistés | Oui | — | GET/POST | `/inventory/{id}/warehouses/{wid}/ecarts-stock/` |
| 10 | Liste stock-gaps (table) | Oui | — | GET/POST | `/inventory/{id}/warehouses/{wid}/stock-gaps/` |
| 11 | Patch `resultat_final` | Oui (ligne) | — | PATCH | `/ecarts-stock/{ecart_id}/` |
| 12 | Valider ligne écart | Oui (ligne) | — | POST | `/ecarts-stock/{ecart_id}/valider/` |

---

## 6. Exemple enchaînement (1 magasin)

```http
# 1. Lancer
POST /web/api/inventory/22/warehouse/5/launch/

# 2. … jobs passent à TERMINE côté mobile …

# 3. Terminer
POST /web/api/inventory/22/warehouse/5/termine/

# 4. Analyser (calcule + enregistre)
POST /web/api/inventory/22/warehouse/5/analyser/

# 5. Consulter les écarts
GET /web/api/inventory/22/warehouses/5/stock-gaps/?only_nonzero=true

# 6. Saisir / valider une ligne
PATCH /web/api/ecarts-stock/123/   {"resultat_final": 10}
POST  /web/api/ecarts-stock/123/valider/

# 7. Clôturer
POST /web/api/inventory/22/warehouse/5/close/
```

## 7. Exemple multi (lancement + terminaison)

```http
POST /web/api/inventory/22/warehouses/launch/
{"warehouse_ids": [5, 6, 7]}

POST /web/api/inventory/22/warehouses/termine/
{"warehouse_ids": [5, 6, 7]}
```

Puis pour chaque magasin terminé :

```http
POST /web/api/inventory/22/warehouse/5/analyser/
POST /web/api/inventory/22/warehouse/6/analyser/
…
POST /web/api/inventory/22/warehouse/5/close/
```

---

## 8. Codes HTTP usuels

| Code | Cas |
|------|-----|
| 200 | Succès (y compris succès partiel multi si ≥ 1 OK) |
| 400 | Statut incorrect, jobs non terminés, validation, multi 0 succès |
| 404 | Inventaire / magasin / Setting introuvable |
| 401 | Non authentifié |
