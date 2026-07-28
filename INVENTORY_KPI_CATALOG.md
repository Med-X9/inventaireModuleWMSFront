# API KPIs inventaire & magasin

Documentation des indicateurs KPI.

**Préfixe API :** `/web/api/`  
**Auth :** utilisateur authentifié  
**Méthode :** `GET` uniquement  
**Temps réel :** pas de cache — recalcul à chaque appel

---

## 1. Deux scopes

| Scope | URL | Agrégation |
|-------|-----|------------|
| **Inventaire** (tous magasins) | `/inventory/{inventory_id}/kpis/{slug}/` | Tous les Settings / jobs / assignments de l’inventaire |
| **Magasin** | `/inventory/{inventory_id}/warehouses/{warehouse_id}/kpis/{slug}/` | Un seul magasin |

Réponse type :

```json
{
  "success": true,
  "message": "...",
  "data": { "...": "..." },
  "meta": {
    "inventory_id": 22,
    "scope": "inventory",
    "aggregation": "all_warehouses",
    "warehouse_id": null,
    "warehouse_name": null,
    "kpi": "nombre-jobs-total",
    "label": "Nombre total de jobs",
    "generated_at": "2026-07-27T18:00:00+00:00"
  }
}
```

Pour le scope magasin, `meta.scope = "warehouse"` et `warehouse_id` / `warehouse_name` sont renseignés (pas de `aggregation`).

---

## 2. KPIs inventaire — catalogue complet

Préfixe : `/web/api/inventory/{inventory_id}/kpis/`

### 2.1 Volume (A)

| Slug | URL | Description |
|------|-----|-------------|
| `nombre-jobs-total` | `.../kpis/nombre-jobs-total/` | Jobs de **tous** les magasins |
| `nombre-jobs-affectes` | `.../kpis/nombre-jobs-affectes/` | Jobs ayant au moins un assignment |
| `nombre-emplacements-couverts` | `.../kpis/nombre-emplacements-couverts/` | Emplacements distincts couverts |

### 2.2 Taux jobs terminés (B)

| Slug | URL |
|------|-----|
| `taux-jobs-termines-1er-comptage` | `.../kpis/taux-jobs-termines-1er-comptage/` |
| `taux-jobs-termines-2e-comptage` | `.../kpis/taux-jobs-termines-2e-comptage/` |

`data` : `{ counting_order, jobs_termines, jobs_eligibles, percent }`

### 2.3 Répartition assignments (C)

| Slug | URL |
|------|-----|
| `repartition-assignments-1er-comptage` | `.../kpis/repartition-assignments-1er-comptage/` |
| `repartition-assignments-2e-comptage` | `.../kpis/repartition-assignments-2e-comptage/` |
| `repartition-assignments-3e-comptage` | `.../kpis/repartition-assignments-3e-comptage/` |
| `repartition-assignments-nieme-comptage` | `.../kpis/repartition-assignments-nieme-comptage/` (ordre ≥ 4) |

Buckets : `en_attente` / `en_cours` / `termine` (count + percent)

### 2.4 Écarts de comptage (D)

| Slug | URL |
|------|-----|
| `nombre-ecarts` | `.../kpis/nombre-ecarts/` |
| `nombre-jobs-avec-ecart` | `.../kpis/nombre-jobs-avec-ecart/` |
| `nombre-emplacements-avec-ecart` | `.../kpis/nombre-emplacements-avec-ecart/` |
| `nombre-ecarts-ouverts` | `.../kpis/nombre-ecarts-ouverts/` (`resolved=false`) |

### 2.5 Équipes (T)

| Slug | URL |
|------|-----|
| `nombre-equipes` | `.../kpis/nombre-equipes/` |
| `taux-termine-1er-comptage-par-equipe` | `.../kpis/taux-termine-1er-comptage-par-equipe/` |
| `taux-termine-2e-comptage-par-equipe` | `.../kpis/taux-termine-2e-comptage-par-equipe/` |
| `repartition-1er-comptage-par-equipe` | `.../kpis/repartition-1er-comptage-par-equipe/` |
| `repartition-2e-comptage-par-equipe` | `.../kpis/repartition-2e-comptage-par-equipe/` |
| `equipes-multi-ecarts` | `.../kpis/equipes-multi-ecarts/` |
| `jobs-avec-ecart-par-equipe` | `.../kpis/jobs-avec-ecart-par-equipe/` |

### 2.6 Magasins / workflow Setting (S) — inventaire uniquement

| Slug | URL | Description |
|------|-----|-------------|
| `nombre-magasins` | `.../kpis/nombre-magasins/` | Nombre de Settings liés à l’inventaire |
| `repartition-magasins-par-statut` | `.../kpis/repartition-magasins-par-statut/` | Répartition `EN ATTENTE` / `LANCEE` / `TERMINEE` / `ANALYSER` / `CLOTURE` |

Exemple `repartition-magasins-par-statut` :

```json
{
  "repartition_magasins_par_statut": {
    "total_magasins": 27,
    "by_status": {
      "EN ATTENTE": { "count": 2, "percent": 7.41 },
      "LANCEE": { "count": 10, "percent": 37.04 },
      "TERMINEE": { "count": 5, "percent": 18.52 },
      "ANALYSER": { "count": 8, "percent": 29.63 },
      "CLOTURE": { "count": 2, "percent": 7.41 }
    }
  }
}
```

### 2.7 Écarts stock théorique/pratique (E) — inventaire uniquement

Agrège la table `EcartStockTheorique` sur **tous** les magasins (après ANALYSER).

| Slug | URL | Description |
|------|-----|-------------|
| `nombre-ecarts-stock` | `.../kpis/nombre-ecarts-stock/` | Total lignes + lignes avec écart ≠ 0 |
| `nombre-ecarts-stock-valides` | `.../kpis/nombre-ecarts-stock-valides/` | Lignes `valide=true` + % |

---

## 3. KPIs magasin (rappel)

Préfixe : `/web/api/inventory/{inventory_id}/warehouses/{warehouse_id}/kpis/`

Mêmes slugs A / B / C / D / T que la section 2.1–2.5 (pas de S / E au niveau magasin).

Exemples :

```http
GET /web/api/inventory/22/warehouses/5/kpis/nombre-jobs-total/
GET /web/api/inventory/22/warehouses/5/kpis/nombre-ecarts-ouverts/
```

---

## 4. Tableau récap inventaire vs magasin

| Indicateur | Inventaire (tous magasins) | Magasin |
|------------|----------------------------|---------|
| A01–A03 Volume | Oui | Oui |
| B01–B02 Taux jobs | Oui | Oui |
| C01–C04 Répartition assignments | Oui | Oui |
| D01–D04 Écarts comptage | Oui | Oui |
| T01–T07 Équipes | Oui | Oui |
| S01 Nombre magasins | Oui | Non |
| S02 Répartition magasins / statut | Oui | Non |
| E01–E02 Écarts stock | Oui | Non |

---

## 5. Exemples inventaire complet

```http
# Dashboard progression magasins
GET /web/api/inventory/22/kpis/nombre-magasins/
GET /web/api/inventory/22/kpis/repartition-magasins-par-statut/

# Volume global
GET /web/api/inventory/22/kpis/nombre-jobs-total/
GET /web/api/inventory/22/kpis/taux-jobs-termines-1er-comptage/

# Après analyses stock
GET /web/api/inventory/22/kpis/nombre-ecarts-stock/
GET /web/api/inventory/22/kpis/nombre-ecarts-stock-valides/
```

---

## 6. Codes HTTP

| Code | Cas |
|------|-----|
| 200 | Succès |
| 400 | Inventaire / entrepôt introuvable (erreur métier) |
| 401 | Non authentifié |
| 500 | Erreur inattendue |
