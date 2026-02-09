/**
 * Composable pour sauvegarder et charger la configuration du DataTable
 * Persiste les préférences utilisateur dans localStorage
 */

import { ref, watch, computed, nextTick, type Ref } from 'vue'
import { useLocalStorage } from '@/utils/storage'
import type { ColumnPinState } from './useColumnPinning'

export interface DataTableConfig {
    /** Colonnes visibles (noms des champs) */
    visibleColumns: string[]
    /** Ordre des colonnes */
    columnOrder: string[]
    /** Largeurs des colonnes (en pixels) */
    columnWidths: Record<string, number>
    /** Colonnes épinglées */
    pinnedColumns: ColumnPinState[]
    /** Header sticky activé */
    stickyHeader: boolean
    /** Taille de page */
    pageSize?: number
    /** Page actuelle (optionnel) */
    page?: number
    /** Filtres actifs (optionnel) */
    filters?: Record<string, any>
    /** Tri actif (optionnel) */
    sort?: { field: string; direction: 'asc' | 'desc' }[]
    /** Recherche globale (optionnel) */
    search?: string
}

/**
 * Composable pour gérer la configuration persistante d'un DataTable
 *
 * @param storageKey - Clé unique pour identifier cette configuration dans localStorage
 * @param defaultConfig - Configuration par défaut
 * @returns Objet avec la configuration réactive et les méthodes de sauvegarde/chargement
 */
export function useDataTableConfig(
    storageKey: string,
    defaultConfig: Partial<DataTableConfig> = {}
) {
    // Configuration par défaut
    const defaultConfigValue: DataTableConfig = {
        visibleColumns: defaultConfig.visibleColumns || [],
        columnOrder: defaultConfig.columnOrder || [],
        columnWidths: defaultConfig.columnWidths || {},
        pinnedColumns: defaultConfig.pinnedColumns || [],
        stickyHeader: defaultConfig.stickyHeader ?? false,
        pageSize: defaultConfig.pageSize || 20,
        page: defaultConfig.page || 1,
        filters: defaultConfig.filters || {},
        sort: defaultConfig.sort || [],
        search: defaultConfig.search || undefined
    }

    // ⚡ FLAG : Désactiver la sauvegarde automatique pendant le chargement ET l'initialisation
    // ⚡ CRITIQUE : Initialiser à true pour empêcher la sauvegarde lors de l'initialisation des refs
    // Cela empêche le watch de sauvegarder les valeurs par défaut avant que loadConfig() ne soit appelé
    const isLoadingConfig = ref(true)

    // ⚡ CRITIQUE : Initialiser les refs avec les valeurs par défaut
    // On ne charge PAS depuis storedConfig pour éviter que useLocalStorage sauvegarde automatiquement
    // La configuration sera chargée explicitement dans loadConfig()
    const visibleColumns = ref<string[]>(defaultConfigValue.visibleColumns)
    const columnOrder = ref<string[]>(defaultConfigValue.columnOrder)
    const columnWidths = ref<Record<string, number>>(defaultConfigValue.columnWidths)
    const pinnedColumns = ref<ColumnPinState[]>(defaultConfigValue.pinnedColumns)
    const stickyHeader = ref<boolean>(defaultConfigValue.stickyHeader)
    const pageSize = ref<number>(defaultConfigValue.pageSize || 20)
    const page = ref<number>(defaultConfigValue.page || 1)
    const filters = ref<Record<string, any>>(defaultConfigValue.filters || {})
    const sort = ref<{ field: string; direction: 'asc' | 'desc' }[]>(defaultConfigValue.sort || [])
    const search = ref<string | undefined>(defaultConfigValue.search || undefined)

    // ⚡ CRITIQUE : Créer storedConfig APRÈS les refs pour éviter la sauvegarde automatique
    // On utilise useLocalStorage uniquement pour la sauvegarde, pas pour le chargement initial
    const storedConfig = useLocalStorage<DataTableConfig>(
        `datatable_config_${storageKey}`,
        defaultConfigValue
    )

    /**
     * Sauvegarde la configuration complète
     * 
     * ⚡ IMPORTANT : Ne sauvegarde que si on n'est pas en train de charger
     */
    const saveConfig = () => {
        // ⚡ NE PAS sauvegarder pendant le chargement
        if (isLoadingConfig.value) {
            return
        }

        const config: DataTableConfig = {
            visibleColumns: visibleColumns.value,
            columnOrder: columnOrder.value,
            columnWidths: columnWidths.value,
            pinnedColumns: pinnedColumns.value,
            stickyHeader: stickyHeader.value,
            pageSize: pageSize.value,
            page: page.value,
            filters: filters.value,
            sort: sort.value,
            search: search.value
        }
        
        // ⚡ DEBUG : Vérifier ce qui est sauvegardé
        console.log('[useDataTableConfig] Sauvegarde de la configuration:', {
            pageSize: config.pageSize,
            page: config.page,
            search: config.search,
            filters: config.filters,
            fullConfig: config
        })
        
        // ⚡ IMPORTANT : Mettre à jour storedConfig.value déclenche le watch de useLocalStorage
        // qui sauvegarde automatiquement. Mais on a déjà vérifié isLoadingConfig, donc c'est OK.
        storedConfig.value = config
    }

    /**
     * Charge la configuration depuis localStorage
     * 
     * ⚡ VÉRIFICATION : Vérifie si la configuration existe vraiment dans localStorage
     * avant de la charger. Si aucune configuration n'existe, retourne false.
     * 
     * @returns {Promise<boolean>} True si une configuration valide a été trouvée et chargée
     */
    const loadConfig = async (): Promise<boolean> => {
        try {
            // ⚡ DÉSACTIVER la sauvegarde automatique AVANT toute modification
            // Utiliser nextTick pour s'assurer que le flag est bien défini avant que le watch se déclenche
            isLoadingConfig.value = true
            await nextTick()

            // ⚡ VÉRIFICATION CRITIQUE : Vérifier si la configuration existe vraiment dans localStorage
            const configStorageKey = `datatable_config_${storageKey}`
            const stored = localStorage.getItem(configStorageKey)
            
            // ⚡ DEBUG : Vérifier la clé et le contenu brut
            console.log('[useDataTableConfig] Tentative de chargement:', {
                storageKey,
                configStorageKey,
                stored: stored ? stored.substring(0, 200) : null, // Afficher les 200 premiers caractères
                storedLength: stored ? stored.length : 0
            })
            
            // Si aucune configuration n'existe dans localStorage, ne pas charger
            if (!stored) {
                console.warn('[useDataTableConfig] Aucune configuration trouvée dans localStorage pour:', configStorageKey)
                isLoadingConfig.value = false
                return false
            }
            
            // Parser la configuration
            let config: DataTableConfig
            try {
                config = JSON.parse(stored) as DataTableConfig
                // ⚡ DEBUG : Vérifier le JSON parsé
                console.log('[useDataTableConfig] JSON parsé depuis localStorage:', {
                    pageSize: config.pageSize,
                    page: config.page,
                    search: config.search,
                    filters: config.filters,
                    fullConfig: config,
                    storedFull: stored // ⚡ Afficher le JSON complet pour vérifier
                })
            } catch (parseError) {
                // Configuration invalide dans localStorage
                console.error('[useDataTableConfig] Erreur lors du parsing JSON:', parseError, {
                    stored: stored.substring(0, 200)
                })
                isLoadingConfig.value = false
                return false
            }
            
            // Vérifier que la configuration est un objet valide
            if (!config || typeof config !== 'object') {
                console.warn('[useDataTableConfig] Configuration invalide (pas un objet):', config)
                isLoadingConfig.value = false
                return false
            }
            
            // ⚡ CRITIQUE : Charger les valeurs EXACTES de la configuration sauvegardée
            // Ne pas utiliser || pour éviter de remplacer des valeurs vides/undefined par des valeurs par défaut
            // Cela préserve la configuration exacte telle qu'elle a été sauvegardée
            // ⚡ IMPORTANT : Modifier toutes les refs en une seule fois pour éviter plusieurs déclenchements du watch
            const newVisibleColumns = Array.isArray(config.visibleColumns) ? config.visibleColumns : []
            const newColumnOrder = Array.isArray(config.columnOrder) ? config.columnOrder : []
            const newColumnWidths = config.columnWidths && typeof config.columnWidths === 'object' ? config.columnWidths : {}
            const newPinnedColumns = Array.isArray(config.pinnedColumns) ? config.pinnedColumns : []
            const newStickyHeader = typeof config.stickyHeader === 'boolean' ? config.stickyHeader : false
            // ⚡ CRITIQUE : Charger la pageSize exacte depuis la config (même si c'est la valeur par défaut)
            // ⚡ IMPORTANT : Si config.pageSize existe et est valide, l'utiliser directement
            // Sinon, utiliser la valeur par défaut (mais seulement si elle n'existe pas dans la config)
            const newPageSize = (config.pageSize !== undefined && 
                                 config.pageSize !== null && 
                                 typeof config.pageSize === 'number' && 
                                 config.pageSize > 0)
                ? config.pageSize 
                : (defaultConfigValue.pageSize || 20)
            
            // ⚡ CRITIQUE : Charger la page exacte depuis la config (même si c'est 1)
            const newPage = (config.page !== undefined && 
                            config.page !== null && 
                            typeof config.page === 'number' && 
                            config.page > 0)
                ? config.page 
                : (defaultConfigValue.page || 1)
            
            // ⚡ CRITIQUE : Charger les filtres exacts depuis la config (même si c'est un objet vide)
            const newFilters = (config.filters !== undefined && 
                               config.filters !== null && 
                               typeof config.filters === 'object')
                ? config.filters 
                : (defaultConfigValue.filters || {})
            
            const newSort = Array.isArray(config.sort) ? config.sort : []
            
            // ⚡ CRITIQUE : Charger la recherche exacte depuis la config (même si c'est une chaîne vide)
            // ⚡ IMPORTANT : Si config.search existe (même si c'est une chaîne vide ""), l'utiliser
            // Ne pas utiliser || undefined car cela remplacerait une chaîne vide sauvegardée
            const newSearch = config.search !== undefined && config.search !== null
                ? (typeof config.search === 'string' ? config.search : undefined)
                : undefined
            
            // ⚡ MODIFIER toutes les refs en une seule opération atomique
            // Cela réduit le nombre de déclenchements du watch
            visibleColumns.value = newVisibleColumns
            columnOrder.value = newColumnOrder
            columnWidths.value = newColumnWidths
            pinnedColumns.value = newPinnedColumns
            stickyHeader.value = newStickyHeader
            pageSize.value = newPageSize
            page.value = newPage
            filters.value = newFilters
            sort.value = newSort
            search.value = newSearch
            
            // ⚡ DEBUG : Vérifier que les valeurs sont bien chargées
            console.log('[useDataTableConfig] Valeurs chargées depuis localStorage:', {
                rawConfig: config, // ⚡ Afficher la config brute parsée
                pageSize: pageSize.value,
                page: page.value,
                search: search.value,
                filters: filters.value,
                configPageSize: config.pageSize,
                configSearch: config.search,
                newPageSize: newPageSize,
                newSearch: newSearch,
                storedFull: stored // ⚡ Afficher le JSON complet
            })
            
            // ⚡ IMPORTANT : Ne PAS mettre à jour storedConfig.value ici car cela déclencherait
            // le watch de useLocalStorage qui sauvegarderait immédiatement, ce qui pourrait
            // écraser la configuration avec des valeurs par défaut si certaines valeurs sont vides.
            // Les valeurs sont déjà chargées dans les refs ci-dessus, et le watch sur ces refs
            // sauvegardera automatiquement si nécessaire (mais seulement si les valeurs changent).
            
            // ⚡ RÉACTIVER la sauvegarde automatique après le chargement
            // Utiliser nextTick pour s'assurer que toutes les modifications sont terminées
            await nextTick()
            isLoadingConfig.value = false
            
            return true
        } catch (error) {
            // Erreur lors du chargement - retourner false
            isLoadingConfig.value = false
            return false
        }
    }

    /**
     * Réinitialise la configuration aux valeurs par défaut
     */
    const resetConfig = () => {
        visibleColumns.value = defaultConfigValue.visibleColumns
        columnOrder.value = defaultConfigValue.columnOrder
        columnWidths.value = defaultConfigValue.columnWidths
        pinnedColumns.value = defaultConfigValue.pinnedColumns
        stickyHeader.value = defaultConfigValue.stickyHeader
        pageSize.value = defaultConfigValue.pageSize || 20
        filters.value = defaultConfigValue.filters || {}
        sort.value = defaultConfigValue.sort || []
        search.value = defaultConfigValue.search || undefined
        saveConfig()
    }

    /**
     * Met à jour les colonnes visibles
     */
    const updateVisibleColumns = (columns: string[]) => {
        visibleColumns.value = columns
        saveConfig()
    }

    /**
     * Met à jour l'ordre des colonnes
     */
    const updateColumnOrder = (order: string[]) => {
        columnOrder.value = order
        saveConfig()
    }

    /**
     * Met à jour la largeur d'une colonne
     */
    const updateColumnWidth = (field: string, width: number) => {
        columnWidths.value[field] = width
        saveConfig()
    }

    /**
     * Met à jour toutes les largeurs des colonnes
     */
    const updateColumnWidths = (widths: Record<string, number>) => {
        columnWidths.value = { ...widths }
        saveConfig()
    }

    /**
     * Met à jour les colonnes épinglées
     */
    const updatePinnedColumns = (pinned: ColumnPinState[]) => {
        pinnedColumns.value = pinned
        saveConfig()
    }

    /**
     * Met à jour l'état du sticky header
     */
    const updateStickyHeader = (enabled: boolean) => {
        stickyHeader.value = enabled
        saveConfig()
    }

    /**
     * Met à jour la taille de page
     */
    const updatePageSize = (size: number) => {
        pageSize.value = size
        saveConfig()
    }

    /**
     * Met à jour la page actuelle
     */
    const updatePage = (newPage: number) => {
        if (newPage > 0) {
            page.value = newPage
            saveConfig()
        }
    }

    /**
     * Met à jour les filtres
     */
    const updateFilters = (newFilters: Record<string, any>) => {
        // Créer une copie profonde pour s'assurer que la réactivité fonctionne
        const filtersCopy = JSON.parse(JSON.stringify(newFilters || {}))
        filters.value = filtersCopy
        saveConfig()
    }

    /**
     * Met à jour le tri
     */
    const updateSort = (newSort: { field: string; direction: 'asc' | 'desc' }[]) => {
        sort.value = [...newSort]
        saveConfig()
    }

    /**
     * Met à jour la recherche globale
     */
    const updateSearch = (newSearch: string | undefined) => {
        search.value = newSearch
        saveConfig()
    }

    // Sauvegarder automatiquement lors des changements (sauf pendant le chargement)
    watch([visibleColumns, columnOrder, columnWidths, pinnedColumns, stickyHeader, pageSize, page, filters, sort, search], () => {
        // ⚡ NE PAS sauvegarder pendant le chargement pour éviter d'écraser la configuration
        if (!isLoadingConfig.value) {
        saveConfig()
        }
    }, { deep: true })

    return {
        // État réactif
        visibleColumns,
        columnOrder,
        columnWidths,
        pinnedColumns,
        stickyHeader,
        pageSize,
        page,
        filters,
        sort,
        search,

        // Configuration complète (computed)
        config: computed(() => ({
            visibleColumns: visibleColumns.value,
            columnOrder: columnOrder.value,
            columnWidths: columnWidths.value,
            pinnedColumns: pinnedColumns.value,
            stickyHeader: stickyHeader.value,
            pageSize: pageSize.value,
            filters: filters.value,
            sort: sort.value,
            search: search.value
        })),

        // Méthodes
        saveConfig,
        loadConfig,
        resetConfig,
        updateVisibleColumns,
        updateColumnOrder,
        updateColumnWidth,
        updateColumnWidths,
        updatePinnedColumns,
        updateStickyHeader,
        updatePageSize,
        updatePage,
        updateFilters,
        updateSort,
        updateSearch
    }
}

