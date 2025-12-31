# Guide d'Implémentation Générique des DataTables

## Vue d'ensemble

Ce guide présente les patterns et bonnes pratiques pour implémenter des DataTables dans l'application WMS. Les DataTables sont utilisées pour afficher, filtrer, trier et manipuler des données tabulaires avec une interface utilisateur riche.

### Concepts Clés

- **Colonnes dynamiques** : Génération automatique des colonnes selon les données
- **Actions contextuelles** : Menus d'actions par ligne avec conditions d'affichage
- **Événements unifiés** : Gestion centralisée des interactions utilisateur
- **Chargement optimisé** : États de chargement et cache des requêtes
- **Persistance** : Sauvegarde automatique des préférences utilisateur

## Structure des Colonnes

### Types de Colonnes de Base

#### 1. Colonne de Texte Standard
```typescript
{
    field: 'reference',
    headerName: 'Référence',
    sortable: true,
    filterable: true,
    width: 120,
    dataType: 'text',
    description: 'Champ de référence standard'
}
```

#### 2. Colonne avec Badges de Statut
```typescript
{
    field: 'status',
    headerName: 'Statut',
    sortable: true,
    filterable: true,
    width: 100,
    dataType: 'text',
    badgeStyles: [
        { value: 'ACTIVE', class: 'badge-success' },
        { value: 'INACTIVE', class: 'badge-secondary' },
        { value: 'PENDING', class: 'badge-warning' }
    ],
    badgeDefaultClass: 'badge-default',
    cellRenderer: statusCellRenderer,
    filterConfig: {
        dataType: 'select',
        operator: 'equals',
        options: statusOptions
    }
}
```

#### 3. Colonne avec Données Nested (Hiérarchiques)
```typescript
{
    field: 'children',
    headerName: 'Éléments enfants',
    sortable: false,
    filterable: false,
    width: 200,
    nestedData: {
        key: 'children',
        displayKey: 'name',
        countSuffix: 'éléments',
        expandable: true,
        showCount: true,
        title: 'Détails des éléments',
        columns: [
            { field: 'name', headerName: 'Nom', width: 150 },
            { field: 'type', headerName: 'Type', width: 100 }
        ]
    }
}
```

### Colonnes Dynamiques

Pour générer des colonnes dynamiquement selon les données :

```typescript
const generateDynamicColumns = (data: any[]): DataTableColumnAny[] => {
    const columns: DataTableColumnAny[] = []
    const maxCount = Math.max(...data.map(item => item.dynamicFields?.length || 0))

    for (let i = 0; i < maxCount; i++) {
        columns.push({
            field: `dynamicField_${i}`,
            headerName: `Champ ${i + 1}`,
            sortable: true,
            filterable: true,
            width: 150,
            editable: true,
            dataType: 'text',
            cellRenderer: (value) => value || '-'
        })
    }

    return columns
}
```

### Colonnes Éditable avec Sélection
```typescript
{
    field: 'assignedUser',
    headerName: 'Utilisateur assigné',
    sortable: true,
    filterable: true,
    editable: true,
    dataType: 'select',
    editValueFormatter: (value: any) => value || 'Sélectionner...',
    filterConfig: {
        dataType: 'select',
        operator: 'equals',
        options: userOptions
    }
}
```

## Actions et Interactions

### Actions Contextuelles par Ligne

```typescript
const tableActions: ActionConfig<Entity>[] = [
    {
        label: 'Modifier',
        icon: markRaw(IconEdit),
        color: 'primary',
        onClick: async (item: Entity) => {
            // Logique d'édition
            await handleEdit(item)
        },
        show: (item: Entity) => canEdit(item) // Condition d'affichage
    },
    {
        label: 'Supprimer',
        icon: markRaw(IconTrash),
        color: 'danger',
        onClick: async (item: Entity) => {
            const confirmed = await confirmDelete(item)
            if (confirmed) {
                await deleteEntity(item.id)
            }
        },
        show: (item: Entity) => canDelete(item)
    },
    {
        label: 'Dupliquer',
        icon: markRaw(IconCopy),
        color: 'secondary',
        onClick: async (item: Entity) => {
            await duplicateEntity(item)
        },
        show: () => hasPermission('duplicate')
    }
]
```

### Gestion des Permissions

```typescript
const canEdit = (item: Entity): boolean => {
    return item.status !== 'LOCKED' && hasPermission('edit')
}

const canDelete = (item: Entity): boolean => {
    return item.status === 'DRAFT' && hasPermission('delete')
}
```

### Actions Groupées (Bulk Actions)

```typescript
const bulkActions = computed(() => {
    const selectedCount = selectedItems.value.length

    if (selectedCount === 0) return []

    return [
        {
            label: `Supprimer ${selectedCount} élément(s)`,
            icon: markRaw(IconTrash),
            color: 'danger',
            onClick: () => handleBulkDelete(selectedItems.value)
        },
        {
            label: `Exporter ${selectedCount} élément(s)`,
            icon: markRaw(IconDownload),
            color: 'secondary',
            onClick: () => handleBulkExport(selectedItems.value)
        }
    ]
})
```

## Gestion des Événements

### Pattern de Handler Unifié

```typescript
const onTableEvent = async (eventType: string, queryModel: QueryModel) => {
    // Gestion de l'initialisation
    if (!isInitialized.value) {
        pendingEventsQueue.push({ eventType, queryModel })
        return
    }

    // Traitement selon le type d'événement
    switch (eventType) {
        case 'pagination':
        case 'page-size-changed':
        case 'sort':
        case 'filter':
        case 'search':
            await loadDataWithParams(queryModel)
            break
        case 'row-clicked':
            await handleRowClick(queryModel.rowData)
            break
        case 'selection-changed':
            handleSelectionChanged(queryModel.selectedRows)
            break
    }
}
```

### Événements Standard Supportés

| Événement | Description | Action |
|-----------|-------------|--------|
| `pagination` | Changement de page | Rechargement des données |
| `page-size-changed` | Modification taille page | Rechargement avec nouvelle taille |
| `sort` | Tri des colonnes | Tri côté serveur |
| `filter` | Application de filtres | Filtrage côté serveur |
| `search` | Recherche globale | Recherche côté serveur |
| `row-clicked` | Clic sur ligne | Action contextuelle (modal, navigation) |
| `selection-changed` | Changement sélection | Mise à jour état sélection |
| `cell-value-changed` | Édition cellule | Sauvegarde automatique |

### File d'Attente des Événements

Pour gérer les événements qui arrivent avant l'initialisation complète :

```typescript
const pendingEventsQueue: Array<{
    eventType: string
    queryModel: QueryModel
    timestamp: number
}> = []

// Traitement de la file d'attente après initialisation
const processPendingEvents = async () => {
    const events = [...pendingEventsQueue]
    pendingEventsQueue.length = 0 // Vider la file

    for (const event of events) {
        await onTableEvent(event.eventType, event.queryModel)
    }
}
```

### Gestion des Événements d'Édition

```typescript
const handleCellEdit = async (params: CellEditParams) => {
    try {
        setLoading(true)
        await updateEntity(params.id, { [params.field]: params.newValue })
        await alertService.success({ text: 'Modification sauvegardée' })
    } catch (error) {
        await alertService.error({ text: 'Erreur lors de la sauvegarde' })
        // Annuler le changement visuel si nécessaire
        revertCellValue(params)
    } finally {
        setLoading(false)
    }
}
```

## Système de Chargement

### États de Chargement

```typescript
const tableLoading = ref(false)
const isInitialized = ref(false)

// Computed pour l'interface
const isTableLoading = computed(() => tableLoading.value || !isInitialized.value)
```

### Gestion du Loading par Contexte

```typescript
// Loading pour les opérations de données
const loadDataWithParams = async (params: QueryModel) => {
    if (isTableLoading.value) return // Évite les appels simultanés

    try {
        tableLoading.value = true
        const response = await apiService.getData(params)
        updateTableData(response.data)
    } finally {
        tableLoading.value = false
    }
}

// Loading pour les actions individuelles
const performAction = async (action: () => Promise<void>) => {
    try {
        tableLoading.value = true
        await action()
        await refreshData() // Rechargement automatique après action
    } finally {
        tableLoading.value = false
    }
}
```

## Configuration Générique DataTable

### Props Essentielles

```vue
<DataTable
    :key="tableKey"
    :columns="tableColumns"
    :rowDataProp="tableData"
    :actions="rowActions"
    :loading="isTableLoading"
    :enableVirtualScrolling="enableVirtualization"
    :currentPageProp="pagination?.currentPage"
    :totalPagesProp="pagination?.totalPages"
    :totalItemsProp="pagination?.totalItems"
    :pageSizeProp="pagination?.pageSize"
    :rowSelection="enableSelection"
    :enableRowClick="enableRowClick"
    :enableGlobalSearch="enableSearch"
    :enableFiltering="enableFilters"
    :storageKey="storageKey"
    ref="dataTableRef"
    @selection-changed="handleSelectionChange"
    @row-clicked="handleRowClick"
    @pagination-changed="handlePaginationChange"
    @page-size-changed="handlePageSizeChange"
    @sort-changed="handleSortChange"
    @filter-changed="handleFilterChange"
    @global-search-changed="handleSearchChange"
    @cell-value-changed="handleCellEdit">
</DataTable>
```

### Configuration par Cas d'Usage

#### Table de Lecture Seule
```vue
<DataTable
    :columns="readOnlyColumns"
    :loading="isTableLoading"
    :enableGlobalSearch="true"
    :enableFiltering="true"
    storageKey="readonly-table"
    @sort-changed="handleSortChange"
    @filter-changed="handleFilterChange"
    @global-search-changed="handleSearchChange"
/>
```

#### Table avec Édition Inline
```vue
<DataTable
    :columns="editableColumns"
    :loading="isTableLoading"
    :enableRowClick="true"
    storageKey="editable-table"
    @cell-value-changed="handleCellEdit"
    @row-clicked="handleRowClick"
/>
```

#### Table avec Sélection Multiple
```vue
<DataTable
    :columns="selectionColumns"
    :loading="isTableLoading"
    :rowSelection="true"
    :actions="bulkActions"
    storageKey="bulk-table"
    @selection-changed="handleBulkSelection"
/>
```

### Stockage Persistant

```typescript
// Configuration par table
const tableConfigs = {
    users: 'users-table-config',
    products: 'products-table-config',
    orders: 'orders-table-config'
}

// Utilisation
const storageKey = tableConfigs[currentView]
```

## Optimisations de Performance

### Lazy Loading des Données Hiérarchiques

```typescript
const lazyLoadNestedData = async (parentId: string, nestedField: string): Promise<any[]> => {
    if (nestedDataCache.has(`${parentId}-${nestedField}`)) {
        return nestedDataCache.get(`${parentId}-${nestedField}`)!
    }

    try {
        const data = await apiService.getNestedData(parentId, nestedField)
        nestedDataCache.set(`${parentId}-${nestedField}`, data)
        return data
    } catch (error) {
        console.error('Erreur chargement données nested:', error)
        return []
    }
}
```

### Cache des Requêtes API

```typescript
const queryCache = new Map<string, {
    data: any[]
    timestamp: number
    params: QueryModel
}>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const getCachedData = async (params: QueryModel): Promise<any[] | null> => {
    const cacheKey = JSON.stringify(params)
    const cached = queryCache.get(cacheKey)

    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data
    }

    return null
}

const setCachedData = (params: QueryModel, data: any[]) => {
    const cacheKey = JSON.stringify(params)
    queryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        params
    })
}
```

### Gestion du Re-render

```typescript
const tableKey = ref(0)

// Forcer le re-render quand nécessaire
const forceTableUpdate = () => {
    tableKey.value++
}

// Re-render automatique après mutations
watch(tableData, () => {
    forceTableUpdate()
}, { deep: true })
```

## Cell Renderers Personnalisés

### Renderer avec Badges de Statut

```typescript
const statusCellRenderer = (value: any, column?: any, row?: any): string => {
    const status = value || 'UNKNOWN'
    const badgeConfig = column?.badgeStyles?.find((s: any) => s.value === status)
    const badgeClass = badgeConfig?.class || column?.badgeDefaultClass || 'badge-default'

    return `<span class="${badgeClass}">${status}</span>`
}
```

### Renderer pour Valeurs Formatées

```typescript
const currencyCellRenderer = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(value || 0)
}

const dateCellRenderer = (value: string): string => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('fr-FR')
}

const percentageCellRenderer = (value: number): string => {
    return `${(value || 0).toFixed(1)}%`
}
```

### Renderer avec Actions Contextuelles

```typescript
const actionsCellRenderer = (value: any, column: any, row: any): string => {
    const actions = column.actions || []
    const visibleActions = actions.filter((action: any) => action.show(row))

    return visibleActions.map((action: any) =>
        `<button class="action-btn action-btn-${action.color}"
                 onclick="handleAction('${action.key}', '${row.id}')">
            ${action.label}
        </button>`
    ).join('')
}
```

### Renderer pour Données Complexes

```typescript
const userCellRenderer = (value: any): string => {
    if (!value) return '-'

    const user = typeof value === 'object' ? value : { name: value }
    const avatar = user.avatar ? `<img src="${user.avatar}" class="avatar-small">` : ''
    const name = user.name || user.username || 'Utilisateur inconnu'

    return `<div class="user-cell">
        ${avatar}
        <span class="user-name">${name}</span>
    </div>`
}
```

## Gestion des Erreurs

### Pattern de Gestion d'Erreurs

```typescript
const handleApiError = async (error: any, context: string) => {
    console.error(`Erreur ${context}:`, error)

    // Désactiver le loading
    tableLoading.value = false

    // Gestion spécifique selon le type d'erreur
    if (error.response?.status === 403) {
        await alertService.error({
            title: 'Accès refusé',
            text: 'Vous n\'avez pas les permissions nécessaires.'
        })
    } else if (error.response?.status === 404) {
        await alertService.error({
            title: 'Données introuvables',
            text: 'Les données demandées n\'existent pas.'
        })
    } else if (error.response?.data?.message) {
        await alertService.error({
            text: error.response.data.message
        })
    } else {
        await alertService.error({
            title: 'Erreur inattendue',
            text: `Une erreur s'est produite lors de ${context}.`
        })
    }
}
```

### Retry Logic pour les Échecs Temporaires

```typescript
const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            if (attempt === maxRetries) throw error

            // Attendre avant retry (backoff exponentiel)
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
        }
    }
    throw new Error('Max retries exceeded')
}
```

## Intégration avec les Stores

### Pattern de Store Réactif

```typescript
// Store Pinia typique
export const useEntityStore = defineStore('entity', () => {
    const entities = ref<Entity[]>([])
    const pagination = ref<PaginationMetadata | null>(null)
    const loading = ref(false)

    const fetchEntities = async (params: QueryModel) => {
        loading.value = true
        try {
            const response = await apiService.getEntities(params)
            entities.value = response.data
            pagination.value = response.pagination
        } finally {
            loading.value = false
        }
    }

    const updateEntity = async (id: string, updates: Partial<Entity>) => {
        const index = entities.value.findIndex(e => e.id === id)
        if (index >= 0) {
            entities.value[index] = { ...entities.value[index], ...updates }
        }
    }

    return {
        entities: readonly(entities),
        pagination: readonly(pagination),
        loading: readonly(loading),
        fetchEntities,
        updateEntity
    }
})
```

### Utilisation dans le Composable

```typescript
const entityStore = useEntityStore()

const tableData = computed(() => entityStore.entities)
const tablePagination = computed(() => entityStore.pagination)
const tableLoading = computed(() => entityStore.loading)

const loadData = async (params: QueryModel) => {
    await entityStore.fetchEntities(params)
}
```

## Transformation des Données

### Pipeline de Transformation

```typescript
const transformDataPipeline = (rawData: any[]): TableRow[] => {
    return rawData
        .map(normalizeEntity)
        .map(addComputedFields)
        .map(applyPermissions)
        .filter(applyVisibilityRules)
}

const normalizeEntity = (entity: any): NormalizedEntity => ({
    id: entity.id || entity._id,
    name: entity.name || entity.title,
    status: entity.status || 'UNKNOWN',
    createdAt: entity.created_at || entity.createdAt,
    updatedAt: entity.updated_at || entity.updatedAt
})

const addComputedFields = (entity: NormalizedEntity): TableRow => ({
    ...entity,
    displayName: `${entity.name} (${entity.status})`,
    isActive: entity.status === 'ACTIVE',
    daysSinceCreation: calculateDaysSince(entity.createdAt)
})
```

### Structure de Données Normalisée

```typescript
interface TableRow {
    // Identifiant unique
    id: string

    // Champs principaux
    name: string
    status: string

    // Champs calculés
    displayName?: string
    isActive?: boolean

    // Métadonnées
    createdAt?: string
    updatedAt?: string

    // Champs personnalisés selon l'entité
    [key: string]: any
}
```

## Bonnes Pratiques

### 1. Performance
- ✅ Utiliser la pagination côté serveur pour de gros volumes
- ✅ Implémenter le cache des requêtes fréquentes
- ✅ Lazy loading pour les données hiérarchiques
- ✅ Debounce pour la recherche en temps réel

### 2. UX/UI
- ✅ Loading states pour toutes les opérations asynchrones
- ✅ Messages d'erreur informatifs et actionnables
- ✅ Confirmation pour les actions destructrices
- ✅ Feedback visuel pour les actions réussies

### 3. Maintenabilité
- ✅ Séparer la logique métier des composants UI
- ✅ Utiliser des types TypeScript stricts
- ✅ Documenter les interfaces et APIs
- ✅ Tests unitaires pour la logique complexe

### 4. Accessibilité
- ✅ Navigation au clavier complète
- ✅ Labels ARIA appropriés
- ✅ Contraste de couleurs suffisant
- ✅ Support des lecteurs d'écran

Cette implémentation générique fournit une base solide pour toutes les DataTables de l'application, assurant cohérence, performance et maintenabilité.
