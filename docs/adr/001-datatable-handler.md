# ADR 001 — Handler DataTable server-side unifié

**Date :** 2026-05-22  
**Statut :** Accepté

## Contexte

Plusieurs composables (`useInventoryManagement`, `usePlanning`, `useAffecter`) implémentaient chacun leur propre logique de handler `@query-model-changed` avec déduplication JSON, sanitization et gestion du loading.

## Décision

Extraire un module partagé `src/composables/dataTable/` :

- `sanitizeQueryModel.ts` — valeurs par défaut QueryModel
- `createDataTableOperationHandler.ts` — factory handler avec déduplication
- `useDataTableInitQueue.ts` — file d'attente pré-initialisation
- `constants.ts` — `DEFAULT_PAGE_SIZE`, debounce

## Conséquences

- Comportement homogène sur les écrans server-side
- Tests unitaires sur le handler (Vitest)
- Les composables ne manipulent pas la config interne du DataTable

## Références

- `DATATABLE.md`
- `src/composables/DATATABLE_COMPOSABLE_PATTERN.md`
