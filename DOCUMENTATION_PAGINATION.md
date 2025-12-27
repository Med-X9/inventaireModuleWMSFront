# 📖 Documentation : Navigation de Pagination dans DataTable

## 🔄 Flux complet de la navigation de pagination

### 1️⃣ **Composant Pagination.vue** (Interface utilisateur)

Le composant `Pagination.vue` fournit l'interface utilisateur avec les boutons de navigation :

```142:144:src/components/DataTable/Pagination.vue
const goToPage = (page: number) => {
    emit('page-changed', page)
}
```

**Actions disponibles :**
- `«` : Aller à la première page (page 1)
- `‹` : Page précédente
- `›` : Page suivante  
- `»` : Aller à la dernière page
- **Sélecteur de taille de page** : Change le nombre d'éléments par page

**Événements émis :**
- `@page-changed` : Émis quand l'utilisateur change de page (paramètre: `page: number`)
- `@page-size-changed` : Émis quand l'utilisateur change la taille de page (paramètre: `size: number`)

---

### 2️⃣ **DataTable.vue** (Gestionnaire central)

Le composant `DataTable.vue` reçoit les événements du composant `Pagination` et les transforme en `QueryModel` :

```502:519:src/components/DataTable/DataTable.vue
// Handler pour les changements de pagination
const handlePaginationChanged = async (page: number) => {
    // Si gestion automatique activée, utiliser le handler automatique
    if (autoDataTable && shouldUseAutoHandlers.value) {
        const queryModel = createQueryModelFromCurrentState()
        await autoDataTable.handlePaginationChanged(queryModel)
        return
    }
    
    // Émettre directement le QueryModel
    const queryModel = createQueryModelFromCurrentState()
    emit('pagination-changed', queryModel)
    
    // Si pas de pagination serveur, mettre à jour localement aussi
    if (!props.serverSidePagination) {
        dataTable?.goToPage?.(page)
    }
}
```

**Fonction clé : `createQueryModelFromCurrentState()`**

Cette fonction construit un `QueryModel` complet en préservant l'état actuel (tri, filtres, recherche) :

```248:260:src/components/DataTable/DataTable.vue
const createQueryModelFromCurrentState = (): QueryModel => {
    return createQueryModelFromDataTableParams({
        page: dataTable?.effectiveCurrentPage || 1,
        pageSize: dataTable?.effectivePageSize || 10,
        sort: currentSortModel.value?.map(s => ({
            colId: s.colId,
            sort: s.sort
        })),
        filters: dataTable?.filterState || {},
        search: dataTable?.globalSearchTerm || undefined,
        customParams: props.customDataTableParams || {}
    })
}
```

**Événements émis par DataTable :**
- `@pagination-changed` : Émis avec un `QueryModel` complet
- `@sort-changed` : Émis lors d'un changement de tri
- `@filter-changed` : Émis lors d'un changement de filtre
- `@global-search-changed` : Émis lors d'une recherche globale

---

### 3️⃣ **usePlanning.ts** (Composable - Logique métier)

Le composable `usePlanning.ts` reçoit les événements du DataTable et gère la logique métier :

#### **Handler `onJobPaginationChanged`**

```957:996:src/composables/usePlanning.ts
const onJobPaginationChanged = async (queryModel: QueryModel) => {
    try {
        // Vérifier que queryModel existe
        if (!queryModel || typeof queryModel !== 'object') {
            return
        }

        // Construire un QueryModel complet en préservant l'état actuel
        const completeQueryModel: QueryModel = {
            page: queryModel.page ?? jobsCurrentPage.value ?? 1,
            pageSize: queryModel.pageSize ?? jobsPageSize.value ?? 20,
            // Préserver le tri actuel si non fourni
            sort: queryModel.sort ?? jobsSortModel.value.map(s => ({
                colId: s.field || '',
                sort: s.direction || 'asc'
            })),
            // Préserver les filtres actuels si non fournis
            filters: queryModel.filters ?? (jobsFilters.value && Object.keys(jobsFilters.value).length > 0
                ? Object.fromEntries(
                    Object.entries(jobsFilters.value).map(([field, filter]) => [field, filter.filter])
                )
                : undefined),
            // Préserver la recherche actuelle si non fournie
            search: queryModel.search !== undefined ? queryModel.search : (jobsSearchQuery.value || undefined)
        }

        // Mettre à jour l'état réactif uniquement avec les nouvelles valeurs
        if (queryModel.page !== undefined) {
            setJobsPage(queryModel.page)
        }
        if (queryModel.pageSize !== undefined) {
            setJobsPageSize(queryModel.pageSize)
        }

        // Passer le QueryModel complet au store
        await loadJobs(completeQueryModel)
    } catch (error) {
        await alertService.error({ text: 'Erreur lors du changement de pagination' })
    }
}
```

**Points importants :**
- ⚠️ **Préserve l'état actuel** : Le handler préserve le tri, les filtres et la recherche actuels
- 📝 **Met à jour l'état réactif** : Met à jour `jobsCurrentPage` et `jobsPageSize`
- 🔄 **Appelle `loadJobs()`** : Charge les nouvelles données depuis le backend

#### **Méthode `loadJobs`**

```734:761:src/composables/usePlanning.ts
const loadJobs = async (params?: StandardDataTableParams | QueryModel) => {
    if (!inventoryId.value || !warehouseId.value) {
        return
    }

    try {
        let finalParams: QueryModel | StandardDataTableParams

        if (params && (('page' in params) || ('sort' in params) || ('filters' in params) || ('search' in params))) {
            // C'est un QueryModel (format recommandé pour le backend actuel)
            finalParams = params as QueryModel
        } else if (params && 'start' in params && 'length' in params) {
            // Ancien format StandardDataTableParams (fallback)
            finalParams = params as StandardDataTableParams
        } else {
            // Aucun param fourni : construire un QueryModel minimal à partir de l'état actuel
            finalParams = {
                page: jobsCurrentPage.value || 1,
                pageSize: jobsPageSize.value || 20
            } as QueryModel
        }

        await jobStore.fetchJobs(inventoryId.value, warehouseId.value, finalParams)
        await nextTick()
    } catch (error) {
        await alertService.error({ text: 'Erreur lors du chargement des jobs' })
    }
}
```

**Cette méthode :**
- Vérifie que les IDs de contexte sont disponibles
- Convertit les paramètres au format approprié (`QueryModel` recommandé)
- Appelle `jobStore.fetchJobs()` pour charger les données depuis le backend

---

### 4️⃣ **Store Pinia** (JobStore)

Le store Pinia (`jobStore`) fait l'appel API au backend avec les paramètres de pagination :

```typescript
await jobStore.fetchJobs(inventoryId.value, warehouseId.value, finalParams)
```

Le store :
- Convertit le `QueryModel` en paramètres de requête HTTP
- Fait l'appel API GET avec les paramètres de pagination
- Met à jour `paginationMetadata` avec les valeurs retournées par le backend
- Stocke les données dans `jobs`

---

### 5️⃣ **Retour au DataTable** (Mise à jour de l'affichage)

Une fois les données chargées :
- Le store met à jour les jobs réactifs
- Le DataTable reçoit les nouvelles données via la prop `rowDataProp`
- Le composant `Pagination` reçoit les nouvelles valeurs via les props :
  - `currentPageProp` : Page actuelle
  - `totalPagesProp` : Nombre total de pages
  - `totalItemsProp` : Nombre total d'éléments

```79:86:src/components/DataTable/DataTable.vue
<Pagination
    :currentPage="props.currentPageProp ?? dataTable?.effectiveCurrentPage ?? 1"
    :totalPages="props.totalPagesProp ?? dataTable?.effectiveTotalPages ?? 1"
    :totalItems="dataTable?.effectiveTotalItems || 0"
    :pageSize="dataTable?.effectivePageSize || 10" :total="dataTable?.effectiveTotalItems || 0"
    :start="dataTable?.start || 0" :end="dataTable?.end || 0" :loading="dataTable?.loading || false"
    @page-changed="handlePaginationChanged"
    @page-size-changed="handlePageSizeChanged" />
```

---

## 📊 Schéma du flux complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Pagination.vue (Interface utilisateur)                      │
│    └─> Utilisateur clique sur "Page suivante"                  │
│        └─> emit('page-changed', 2)                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. DataTable.vue (Gestionnaire central)                        │
│    └─> handlePaginationChanged(2)                              │
│        └─> createQueryModelFromCurrentState()                  │
│            └─> Crée QueryModel avec:                           │
│                - page: 2                                        │
│                - pageSize: 20                                   │
│                - sort: [tri actuel]                            │
│                - filters: {filtres actuels}                    │
│                - search: "recherche actuelle"                  │
│        └─> emit('pagination-changed', QueryModel)              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Planning.vue (Vue)                                          │
│    └─> @pagination-changed="onJobPaginationChanged"            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. usePlanning.ts (Composable)                                 │
│    └─> onJobPaginationChanged(QueryModel)                      │
│        └─> Construit QueryModel complet                        │
│            (préserve tri, filtres, recherche)                  │
│        └─> setJobsPage(2)                                      │
│        └─> setJobsPageSize(20)                                 │
│        └─> loadJobs(completeQueryModel)                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. JobStore (Pinia Store)                                      │
│    └─> fetchJobs(inventoryId, warehouseId, QueryModel)         │
│        └─> Convertit QueryModel en paramètres HTTP             │
│        └─> Appel API GET /jobs?page=2&pageSize=20&...          │
│        └─> Met à jour paginationMetadata                       │
│        └─> Stocke les données dans jobs                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Retour réactif                                              │
│    └─> jobs.value mis à jour                                   │
│    └─> DataTable reçoit nouvelles données                      │
│    └─> Pagination affiche nouvelles valeurs                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Points clés

### ✅ **Préservation de l'état**

Le système préserve toujours l'état actuel (tri, filtres, recherche) lors d'un changement de pagination. Cela garantit que :
- Les filtres restent actifs
- Le tri reste appliqué
- La recherche reste active

### ✅ **Format QueryModel standard**

Tous les événements utilisent le format `QueryModel` standard :

```typescript
interface QueryModel {
    page: number
    pageSize: number
    sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>
    filters?: Record<string, any>
    search?: string
    customParams?: Record<string, any>
}
```

### ✅ **Pagination serveur vs client**

- **Pagination serveur** (`serverSidePagination: true`) : Les données sont chargées depuis le backend à chaque changement de page
- **Pagination client** (`serverSidePagination: false`) : Toutes les données sont chargées une fois, la pagination est gérée localement

### ✅ **Mise à jour de l'état réactif**

Le composable met à jour l'état réactif (`jobsCurrentPage`, `jobsPageSize`) qui est ensuite utilisé pour :
- Afficher la page actuelle dans le composant `Pagination`
- Construire le `QueryModel` suivant
- Synchroniser l'état entre les composants

---

## 🎯 Exemple concret

**Scénario :** L'utilisateur est à la page 2, avec un filtre "status: VALIDE" et un tri par "date: desc".

1. L'utilisateur clique sur "Page suivante" (page 3)
2. `Pagination.vue` émet `page-changed` avec `page: 3`
3. `DataTable.vue` crée un `QueryModel` avec :
   - `page: 3`
   - `pageSize: 20`
   - `filters: { status: 'VALIDE' }`
   - `sort: [{ colId: 'date', sort: 'desc' }]`
4. `usePlanning.ts` reçoit le `QueryModel`, préserve les filtres/tri/recherche, et appelle `loadJobs()`
5. Le store fait l'appel API : `GET /jobs?page=3&pageSize=20&filters[status]=VALIDE&sort[0][colId]=date&sort[0][sort]=desc`
6. Les nouvelles données sont affichées dans le DataTable

---

## 📝 Note importante

Le même flux s'applique pour :
- **Changement de taille de page** : `handlePageSizeChanged()` → émet `pagination-changed`
- **Changement de tri** : `handleSortChanged()` → émet `sort-changed` (réinitialise la page à 1)
- **Changement de filtre** : `handleFilterChanged()` → émet `filter-changed` (réinitialise la page à 1)
- **Recherche globale** : `handleGlobalSearchUpdate()` → émet `global-search-changed` (réinitialise la page à 1)

