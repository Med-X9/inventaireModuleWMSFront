# Rapport d'audit — inventaireModuleWMSFront

**Date :** 22 mai 2026  
**Périmètre :** application Vue 3 + Vite + Pinia (module inventaire WMS)  
**Audits couverts :** architecture logicielle, qualité de développement, sécurité applicative

---

## Synthèse exécutive

| Domaine | Note | Verdict |
|---------|------|---------|
| Architecture | **6,5/10** | SPA bien structuré pour le métier inventaire ; dette sur taille des fichiers et cohérence HTTP |
| Qualité dev | **5/10** | Bonne documentation interne ; filet qualité (tests, lint, CI) quasi absent |
| Sécurité | **4,5/10** | JWT lisibles en JS, dépendances vulnérables, risque `.env` versionné |

### Top 5 actions immédiates

1. Retirer `.env` de l'historique Git ; fournir `.env.example` ; rotation des secrets si déjà exposés.
2. Corriger les dépendances critiques (`npm audit fix` + montée `axios`, `js-cookie`, `jspdf`, `xlsx`).
3. Migrer les tokens vers cookies **HttpOnly** côté backend (ou BFF).
4. Supprimer ou sanitiser les `v-html` (notifications dans `Header.vue` / `HeaderActions.vue`).
5. Découper `useJobTracking.ts` (~1600 lignes) et brancher l'API KPI (`USE_INVENTORY_KPI_MOCK = false`).

### Correctifs appliqués (mai 2026)

| Action | Statut |
|--------|--------|
| `AUDIT.md` + `.env.example` | Fait |
| ESLint + Prettier + scripts `lint` / `format` | Fait |
| CI GitHub Actions (build + lint + audit) | Fait |
| `npm audit fix` (32 → 17 vulnérabilités) | Fait |
| Sanitisation `v-html` (`dompurify` + `sanitizeHtml.ts`) | Fait |
| Auth unifiée via `axiosBase` (évite cycle avec intercepteurs) | Fait |
| Cookies HttpOnly | **En attente backend** |

---

## 1. Audit architecture logicielle

### Vue d'ensemble des couches

| Couche | Rôle | Évaluation |
|--------|------|------------|
| **Views** (`src/views/Inventory/…`) | Pages métier | Bonne séparation par domaine |
| **Composables** (31 fichiers) | Logique UI + orchestration | Pattern documenté, fichiers très volumineux |
| **Stores Pinia** (15 stores) | État partagé | Présent, usage hétérogène |
| **Services** (25 fichiers) | HTTP + normalisation | Couche API claire |
| **Usecases** (`CountingDispatcher`) | Règles métier comptage | Bon signal DDD, sous-exploité |
| **API** (`src/api/index.ts`) | Catalogue d'endpoints | Centralisé |

```
Views → Composables → Stores / Services → axiosInstance → API REST (Django)
```

### Points forts

- Routing inventaire cohérent (`reference`, `warehouse`), lazy-loading, garde `requiresAuth`.
- Pattern DataTable documenté (`src/composables/DATATABLE_COMPOSABLE_PATTERN.md`).
- Normalizers API (`dataTableResponseNormalizer`, `inventoryResultNormalizer`).
- `CountingDispatcher` + stratégies par mode de comptage.
- Intercepteur Axios central (refresh, 401/403).

### Faiblesses

| Problème | Impact |
|----------|--------|
| Composables « god objects » | `useJobTracking.ts` ≈ 1600 lignes |
| Services monolithiques | `InventoryService.ts` ≈ 800+ lignes |
| Double stack AG Grid | v32 (`@ag-grid-community`) + v33 (`ag-grid-community`) |
| Auth hors `axiosInstance` | `authService` utilise `axios` brut |
| Dette `main.ts` | Monkey-patch fetch/XHR, `globalThis.useAppStore`, bloc anti-`reasonlabsapi.com` |
| Vues template hors router | `boxed-*`, `cover-*`, `font-icons`, etc. |
| KPI en mock par défaut | `USE_INVENTORY_KPI_MOCK = true` |
| Pas de RBAC front | `requiresAuth` binaire uniquement |

### Recommandations architecture

| Priorité | Action |
|----------|--------|
| P0 | Découper `useJobTracking` et `InventoryService` par domaine (PDF, planning, jobs, résultats) |
| P1 | Unifier AG Grid sur une version |
| P1 | Faire passer tous les appels par `axiosInstance` |
| P2 | Isoler ou supprimer le bloc `reasonlabsapi` dans `main.ts` |
| P2 | Archiver les vues template inutilisées |
| P3 | Étendre le dossier `usecases/` |

---

## 2. Audit qualité de développement

### Outillage

| Élément | État |
|---------|------|
| TypeScript `strict: true` | Oui |
| `noImplicitAny: false` | Affaiblit le typage |
| Tests | **Aucun** |
| ESLint / Prettier | **Absent** |
| CI/CD | **Absent** |
| Stack | Vue 3.2, Vite 3, TS 4.6 — en retard |

### Points positifs

- Documentation interne (patterns DataTable, événements, performance).
- `LoggerService` centralisé.
- Models / interfaces séparés.
- Build `vue-tsc --noEmit` (rapport TS déc. 2025 : 0 erreur).

### Points à améliorer

- Logs résiduels dans services/stores.
- `pinia-plugin-persistedstate` importé dans des composables.
- Typage `any` (ex. IndexedDB).
- Pas de contrat API (OpenAPI / types générés).
- **`.env` potentiellement versionné** malgré `.gitignore`.

### Dépendances (`npm audit`)

**32 vulnérabilités** (3 critical, 9 high, 19 moderate, 1 low) — notamment : `axios`, `js-cookie`, `jspdf`, `xlsx`, `swiper`, `form-data`, `quill`.

### Recommandations qualité

| Priorité | Action |
|----------|--------|
| P0 | `.env` hors Git ; `.env.example` ; rotation secrets |
| P0 | `npm audit fix` + mises à jour ciblées |
| P1 | Vitest sur normalizers, `CountingDispatcher`, `cookieUtils`, garde router |
| P1 | ESLint + Prettier + pre-commit |
| P1 | `noImplicitAny: true` (progressif) |
| P2 | CI : `vue-tsc`, `vite build`, `npm audit --audit-level=high` |
| P2 | Montée Vite 5+ / Vue 3.4+ / TS 5 |
| P3 | Types générés depuis OpenAPI |

---

## 3. Audit sécurité applicative

### Authentification

| Contrôle | Statut |
|----------|--------|
| Garde route (token présent) | Partiel |
| Refresh token | Oui (intercepteur) |
| Stockage JWT | **Risque élevé** — cookie JS `app_tokens`, non HttpOnly |
| `sameSite: strict` | Oui |
| RBAC routes | Non |
| CSRF Django | Désactivé (`initializeCSRF` commenté) |
| `withCredentials` | Production uniquement |

**Risque XSS → vol de session** : un script injecté peut lire les tokens via `js-cookie`.

### XSS et injection

| Vecteur | Risque | Fichiers |
|---------|--------|----------|
| `v-html` notifications | Élevé si contenu serveur | `Header.vue`, `HeaderActions.vue` |
| `xlsx` / `jspdf` | Élevé (fichiers utilisateur) | Imports / exports |
| `quill` / `easymde` | Modéré | Éditeurs riches |
| Messages d'erreur API | Modéré | `alertService` |

### Configuration

- `.env` dans l'historique Git possible → fuite d'URL / secrets.
- `host: '0.0.0.0'` en dev Vite → exposition réseau local.
- Pas de CSP dans `vercel.json`.

### OWASP (résumé)

| Catégorie | Niveau |
|-----------|--------|
| Broken Access Control | Moyen |
| Cryptographic Failures | Moyen |
| Injection | Moyen–Élevé |
| Security Misconfiguration | Élevé |
| Vulnerable Components | Élevé |
| Auth Failures | Moyen |

### Recommandations sécurité

| Priorité | Action |
|----------|--------|
| P0 | Cookies HttpOnly pour tokens (backend) |
| P0 | Retirer `.env` du dépôt ; rotation si exposé |
| P0 | Mise à jour `axios`, `js-cookie`, etc. |
| P1 | Sanitiser / retirer `v-html` |
| P1 | Réactiver CSRF si session Django |
| P1 | Garde `meta.roles` si claims disponibles |
| P1 | Headers CSP, X-Frame-Options, Referrer-Policy |
| P2 | Valider imports XLSX et exports PDF |
| P3 | Dependabot / audit CI récurrent |

---

## Fichiers de référence

| Sujet | Chemin |
|-------|--------|
| Garde auth | `src/router/index.ts` |
| Tokens | `src/utils/cookieUtils.ts` |
| HTTP | `src/utils/axiosConfig.ts` |
| Auth API | `src/services/authService.ts` |
| Pattern DataTable | `src/composables/DATATABLE_COMPOSABLE_PATTERN.md` |
| Mock KPI | `src/mocks/inventoryKpiMock.ts` |

---

*Rapport généré par audit statique du dépôt. Pour une revue runtime (CSP, cookies en prod, flux CSRF), compléter par tests manuels ou e2e sur l'environnement cible.*
