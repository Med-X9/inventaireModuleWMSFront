# Catalogue KPI — Suivi du déroulement d’inventaire par magasin

## 1. Objectif du document

Définir **20 indicateurs (KPI)** pour suivre l’avancement d’un inventaire **par magasin** (`inventory_id` + `warehouse_id`), avec un focus **équipes terrain**, des taux **séparés 1er / 2e comptage**, et le suivi des **écarts** au niveau jobs et emplacements.

**Hors périmètre de ce catalogue :** KPI par zone (E) et statut Setting magasin (F).

**Granularité principale :** magasin  
**Granularité équipes :** `session_id` ou `(personne_id, personne_two_id)`

---

## 2. Conventions

### 2.1 Filtres communs

| Filtre | Source |
|--------|--------|
| Inventaire | `Job.inventory_id`, `EcartComptage.inventory_id` |
| Magasin | `Job.warehouse_id` |
| Actifs | `is_deleted = false` |

### 2.2 Job « terminé » pour un ordre de comptage N

Aligné sur `MonitoringService.get_global_monitoring` :

> Un **job** est **terminé pour le comptage d’ordre N** si l’**assignment** lié à ce comptage a `status = 'TERMINE'` (pas le statut global du `Job`).

```text
jobs_termines_N = COUNT(DISTINCT Job.id)
  WHERE Job.inventory_id = X AND Job.warehouse_id = Y
    AND EXISTS Assigment
      JOIN Counting ON counting_id
      WHERE Assigment.job_id = Job.id
        AND Counting.order = N
        AND Assigment.status = 'TERMINE'
```

**Dénominateur recommandé pour le taux :**

```text
jobs_eligibles_N = COUNT(DISTINCT Job.id)
  WHERE … AND EXISTS Assigment pour Counting.order = N
```

**Formule :** `taux_jobs_termines_N = jobs_termines_N / jobs_eligibles_N × 100` (0 si dénominateur = 0)

### 2.3 Buckets assignment (en attente / en cours / terminé)

| Bucket | Statuts `Assigment.status` |
|--------|----------------------------|
| En attente | `EN ATTENTE`, `AFFECTE`, `PRET`, `TRANSFERT` |
| En cours | `ENTAME`, `DEBLOQUE`, `BLOQUE` |
| Terminé | `TERMINE` |

### 2.4 Identification d’une équipe (`team_key`)

| Cas | Clé |
|-----|-----|
| Session mobile | `session:{session_id}` |
| Sans session | `persons:{personne_id}:{personne_two_id}` |

**Username affiché :** `UserApp.username` via `Assigment.session_id`.

### 2.5 Lien écart → job → emplacement

```text
EcartComptage
  ← ComptageSequence.ecart_comptage_id
  ← CountingDetail (product_id, location_id, job_id)
  ← Job (warehouse_id, inventory_id)
```

| Entité | Règle « contient un écart » |
|--------|------------------------------|
| **Job** | Au moins un `EcartComptage` de l’inventaire relié via `ComptageSequence` à un `CountingDetail` de ce job, job du magasin |
| **Emplacement** | Au moins un `CountingDetail.location_id` distinct lié à un `EcartComptage` (même chaîne), job du magasin |

Par défaut : **tout écart** (`resolved` true ou false). Variante optionnelle **écarts ouverts uniquement** : `EcartComptage.resolved = false` (noté dans les KPI concernés).

---

## 3. Architecture

```
Dashboard Vue.js (magasin)
        │
        ▼
GET /web/api/inventory/{id}/warehouses/{wh_id}/kpis/
        │
        ▼
InventoryKpiService
        ├── volume / jobs / emplacements
        ├── taux jobs terminés (ordre 1, 2)
        ├── répartition assignments par ordre
        ├── écarts (jobs, emplacements, compteur)
        └── bloc teams[] (KPI par équipe + agrégats)
```

**Réutilisation :** `MonitoringService` pour les taux jobs terminés ordres 1–3.

---

## 4. Liste des 20 KPI — classés

### Catégorie A — Volume magasin (3 KPI)

| ID | KPI | Formule | Unité |
|----|-----|---------|-------|
| **KPI-A01** | Nombre total de jobs | `COUNT(DISTINCT Job)` filtré magasin | entier |
| **KPI-A02** | Nombre de jobs affectés | Jobs avec ≥ 1 `Assigment` | entier |
| **KPI-A03** | Nombre d’emplacements couverts | `COUNT(DISTINCT JobDetail.location_id)` | entier |

---

### Catégorie B — Taux de jobs terminés par passe (2 KPI)

| ID | KPI | Formule | Unité |
|----|-----|---------|-------|
| **KPI-B01** | Taux jobs terminés — **1er comptage** | `jobs_termines_1 / jobs_eligibles_1 × 100` (cf. §2.2, N=1) | % |
| **KPI-B02** | Taux jobs terminés — **2e comptage** | Idem N=2 | % |

**Exemple JSON :**

```json
{
  "KPI-B01": {
    "counting_order": 1,
    "jobs_termines": 30,
    "jobs_eligibles": 45,
    "percent": 66.67
  },
  "KPI-B02": {
    "counting_order": 2,
    "jobs_termines": 10,
    "jobs_eligibles": 45,
    "percent": 22.22
  }
}
```

---

### Catégorie C — Avancement assignments par ordre (4 KPI)

Répartition **en attente / en cours / terminé** sur les **assignments** (pas les jobs), par ordre de comptage.

| ID | KPI | Périmètre |
|----|-----|-----------|
| **KPI-C01** | Répartition 1er comptage | `Counting.order = 1` |
| **KPI-C02** | Répartition 2e comptage | `Counting.order = 2` |
| **KPI-C03** | Répartition 3e comptage | `Counting.order = 3` |
| **KPI-C04** | Répartition n-ième comptage | `Counting.order ≥ 4` |

**Structure par KPI :**

```json
{
  "counting_order": 1,
  "total_assignments": 45,
  "en_attente": { "count": 10, "percent": 22.2 },
  "en_cours":   { "count": 15, "percent": 33.3 },
  "termine":    { "count": 20, "percent": 44.4 }
}
```

---

### Catégorie D — Écarts (4 KPI)

| ID | KPI | Formule | Unité |
|----|-----|---------|-------|
| **KPI-D01** | Nombre d’écarts (inventaire / magasin) | `COUNT(EcartComptage)` liés au magasin via §2.5 | entier |
| **KPI-D02** | **Nombre de jobs contenant un écart** | `COUNT(DISTINCT Job.id)` avec ≥ 1 écart (§2.5) | entier |
| **KPI-D03** | **Nombre d’emplacements contenant un écart** | `COUNT(DISTINCT CountingDetail.location_id)` via §2.5 | entier |
| **KPI-D04** | Nombre d’écarts ouverts | `KPI-D01` avec `resolved = false` | entier |

**Variantes dashboard :**

| Libellé UI | Filtre |
|------------|--------|
| Jobs avec écart (tous) | KPI-D02 |
| Jobs avec écart ouvert | jobs distincts liés à `resolved=false` |
| Emplacements avec écart (tous) | KPI-D03 |
| Emplacements avec écart ouvert | `location_id` distincts, `resolved=false` |

---

### Catégorie T — Équipes (7 KPI)

| ID | KPI | Définition | Sortie |
|----|-----|------------|--------|
| **KPI-T01** | Nombre d’équipes distinctes | Comptage `team_key` sur assignments du magasin (§2.4) | entier |
| **KPI-T02** | Taux assignments terminés — 1er comptage | Par équipe : `TERMINE / total assignments ordre 1` | % + `teams[]` |
| **KPI-T03** | Taux assignments terminés — 2e comptage | Idem ordre 2 | % + `teams[]` |
| **KPI-T04** | Répartition 1er comptage par équipe | Buckets §2.3 pour ordre 1, groupé par `team_key` | tableau |
| **KPI-T05** | Répartition 2e comptage par équipe | Idem ordre 2 | tableau |
| **KPI-T06** | Équipes avec **plusieurs écarts** | `team_key` avec **≥ 2** écarts ouverts (`resolved=false`) | entier + liste |
| **KPI-T07** | Jobs avec écart **par équipe** | `COUNT(DISTINCT job_id)` avec écart, rattaché à l’équipe via `Assigment` du comptage concerné | tableau |

#### Détail KPI-T06 (équipes multi-écarts)

1. Écarts `resolved=false` pour `inventory_id`.
2. Remonter job + magasin via `ComptageSequence → CountingDetail → Job`.
3. Associer l’écart à `team_key` de l’`Assigment` sur le `Counting` de la séquence.
4. Garder les équipes où `count(ecarts) >= 2`.

#### Détail KPI-T07 (jobs avec écart par équipe)

Même chaîne §2.5 ; pour chaque job avec écart, attribuer à la ou les équipes ayant un assignment sur le comptage lié à l’écart (si plusieurs, compter le job une fois par équipe concernée).

**Exemple bloc `teams` dans la réponse API :**

```json
{
  "teams": [
    {
      "team_key": "session:3",
      "username": "equipe-2001",
      "KPI-T02": { "percent": 72.0, "termines": 18, "total": 25 },
      "KPI-T03": { "percent": 40.0, "termines": 10, "total": 25 },
      "KPI-T04": {
        "counting_order": 1,
        "en_attente": { "count": 2, "percent": 8.0 },
        "en_cours": { "count": 5, "percent": 20.0 },
        "termine": { "count": 18, "percent": 72.0 }
      },
      "KPI-T06": { "open_discrepancies_count": 4, "is_multi_discrepancy": true },
      "KPI-T07": { "jobs_with_discrepancy_count": 3 }
    }
  ]
}
```

---

## 5. Synthèse des 20 KPI

| # | ID | Libellé court |
|---|-----|---------------|
| 1 | KPI-A01 | Nb jobs total |
| 2 | KPI-A02 | Nb jobs affectés |
| 3 | KPI-A03 | Nb emplacements couverts |
| 4 | KPI-B01 | Taux jobs terminés — 1er comptage |
| 5 | KPI-B02 | Taux jobs terminés — 2e comptage |
| 6 | KPI-C01 | Répartition assignments — 1er comptage |
| 7 | KPI-C02 | Répartition assignments — 2e comptage |
| 8 | KPI-C03 | Répartition assignments — 3e comptage |
| 9 | KPI-C04 | Répartition assignments — n-ième |
| 10 | KPI-D01 | Nb écarts (magasin) |
| 11 | KPI-D02 | Nb jobs avec écart |
| 12 | KPI-D03 | Nb emplacements avec écart |
| 13 | KPI-D04 | Nb écarts ouverts |
| 14 | KPI-T01 | Nb équipes |
| 15 | KPI-T02 | Taux terminé 1er comptage / équipe |
| 16 | KPI-T03 | Taux terminé 2e comptage / équipe |
| 17 | KPI-T04 | Répartition 1er comptage / équipe |
| 18 | KPI-T05 | Répartition 2e comptage / équipe |
| 19 | KPI-T06 | Équipes multi-écarts (≥ 2 ouverts) |
| 20 | KPI-T07 | Jobs avec écart / équipe |

---

## 6. Matrice besoins ↔ KPI

| Besoin | KPI |
|--------|-----|
| Nombre des jobs | A01, A02 |
| Nombre équipes | T01 |
| Taux jobs terminés **1er** / **2e** comptage | **B01**, **B02** |
| Taux comptage (attente, cours, terminé) | C01, C02, C03, C04 |
| Nombre jobs avec écart | **D02**, T07 |
| Nombre emplacements avec écart | **D03** |
| Équipes avec plusieurs écarts | **T06** |
| Suivi par équipe | **T01–T07** |

---

## 7. Exemple de payload API agrégé

```json
{
  "success": true,
  "message": "KPI magasin récupérés",
  "meta": {
    "inventory_id": 1,
    "warehouse_id": 1,
    "warehouse_name": "B3",
    "generated_at": "2026-04-28T15:00:00Z"
  },
  "data": {
    "volume": {
      "KPI-A01": 48,
      "KPI-A02": 45,
      "KPI-A03": 320
    },
    "jobs_termines_by_counting": {
      "KPI-B01": { "counting_order": 1, "jobs_termines": 30, "jobs_eligibles": 45, "percent": 66.67 },
      "KPI-B02": { "counting_order": 2, "jobs_termines": 10, "jobs_eligibles": 45, "percent": 22.22 }
    },
    "assignments_by_counting": {
      "KPI-C01": { "counting_order": 1, "en_attente": { "count": 5, "percent": 11.1 }, "en_cours": { "count": 10, "percent": 22.2 }, "termine": { "count": 30, "percent": 66.7 } },
      "KPI-C02": { "counting_order": 2, "en_attente": { "count": 20, "percent": 44.4 }, "en_cours": { "count": 15, "percent": 33.3 }, "termine": { "count": 10, "percent": 22.2 } }
    },
    "discrepancies": {
      "KPI-D01": 25,
      "KPI-D02": 12,
      "KPI-D03": 18,
      "KPI-D04": 8
    },
    "teams_summary": {
      "KPI-T01": 5,
      "KPI-T06": { "count": 2, "team_keys": ["session:3", "session:2"] }
    },
    "teams": []
  }
}
```

---

## 8. Recommandations dashboard Vue.js

| Zone UI | KPIs |
|---------|------|
| Cartes synthèse magasin | A01, B01, B02, D02, D03, T01 |
| Graphiques barres empilées | C01, C02 (attente / cours / terminé) |
| Tableau principal **Équipes** | T02, T03, T04, T05, T06, T07 |
| Alertes | T06 > 0, D04 élevé, écart B01 − B02 > 30 pts |

**Rafraîchissement :** 30–60 s (polling).

---

## 9. Priorisation implémentation

| Phase | KPIs |
|-------|------|
| **MVP** | A01–A03, B01–B02, C01–C02, D02–D04, T01, T06 |
| **V2** | C03–C04, T02–T05, T07 |
| **Hors scope** | Zones (ex-E), Setting magasin (ex-F) |

---

*Catalogue KPI — InventaireModuleWMS. Modèles : `Job`, `Assigment`, `Counting`, `CountingDetail`, `EcartComptage`, `ComptageSequence`.*
