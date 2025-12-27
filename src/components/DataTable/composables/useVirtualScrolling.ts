import { ref, computed, onMounted, onUnmounted, unref, watch, shallowRef, type Ref, type ComputedRef } from 'vue'
import { useMemoize } from '@vueuse/core'

export type MaybeRef<T> = T | Ref<T>

/**
 * Configuration pour le virtual scrolling
 */
export interface VirtualScrollingConfig {
    itemHeight: number
    containerHeight: number
    overscan?: number // Nombre d'éléments à pré-rendre
    threshold?: number // Seuil pour déclencher le chargement
}

/**
 * État du virtual scrolling
 */
export interface VirtualScrollingState {
    startIndex: number
    endIndex: number
    visibleItems: any[]
    totalHeight: number
    scrollTop: number
    isScrolling: boolean
}

/**
 * Composable pour le virtual scrolling optimisé
 *
 * Bonnes pratiques implémentées :
 * - Debouncing des événements de scroll
 * - Calcul optimisé des indices visibles
 * - Gestion mémoire avec overscan
 * - Performance avec requestAnimationFrame
 */
export function useVirtualScrolling<T>(
    itemsSource: MaybeRef<T[]>,
    config: MaybeRef<VirtualScrollingConfig>
) {
    // Récupérer la configuration de manière réactive
    const configRef = computed(() => unref(config))

    const itemHeight = computed(() => configRef.value.itemHeight)
    const containerHeight = computed(() => configRef.value.containerHeight)
    const overscan = computed(() => configRef.value.overscan ?? 5)
    const threshold = computed(() => configRef.value.threshold ?? 100)

    // État réactif
    const scrollTop = ref(0)
    const isScrolling = ref(false)
    const containerRef = ref<HTMLElement | null>(null)

    // Utiliser shallowRef pour éviter la réactivité profonde sur les grands tableaux
    const items = shallowRef<T[]>([])

    // Synchroniser avec la source
    watch(() => unref(itemsSource), (newItems) => {
        items.value = newItems || []
    }, { immediate: true })

    // === OPTIMISATIONS POUR 1000+ LIGNES ===

    // Seuils adaptatifs selon la taille des données
    const adaptiveConfig = computed(() => {
        const itemCount = items.value.length
        let overscan = configRef.value.overscan ?? 5
        let batchSize = 10

        // Pour 1000+ lignes : overscan plus grand pour éviter les sauts
        if (itemCount >= 1000) {
            overscan = Math.max(overscan, 15)
            batchSize = 20
        } else if (itemCount >= 500) {
            overscan = Math.max(overscan, 10)
            batchSize = 15
        }

        return { overscan, batchSize }
    })

    // Cache avancé pour les calculs d'indices avec gestion de mémoire
    const indicesCache = new Map<string, { startIndex: number; endIndex: number; timestamp: number }>()
    const CACHE_SIZE = 50 // Limiter la taille du cache
    const CACHE_TTL = 5000 // 5 secondes TTL

    const getCachedIndices = (scrollTop: number, itemHeight: number, containerHeight: number, overscan: number, totalItems: number) => {
        const key = `${Math.floor(scrollTop / 10) * 10}-${itemHeight}-${containerHeight}-${overscan}-${totalItems}`
        const now = Date.now()
        const cached = indicesCache.get(key)

        // Vérifier si le cache est valide
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            return cached
        }

        // Calculer les nouveaux indices
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
        const endIndex = Math.min(totalItems - 1, Math.floor((scrollTop + containerHeight) / itemHeight) + overscan)
        const result = { startIndex, endIndex, timestamp: now }

        // Gestion de la taille du cache (LRU simple)
        if (indicesCache.size >= CACHE_SIZE) {
            const oldestKey = indicesCache.keys().next().value
            indicesCache.delete(oldestKey)
        }

        indicesCache.set(key, result)
        return result
    }

    // Cache pour les positions (optimisé pour les grands datasets)
    const positionCache = new Map<number, number>()
    const getItemPosition = (index: number): number => {
        if (positionCache.has(index)) {
            return positionCache.get(index)!
        }
        const position = index * itemHeight.value
        positionCache.set(index, position)
        return position
    }

    // Calculs optimisés avec cache avancé
    const totalHeight = computed(() => items.value.length * itemHeight.value)

    const indices = computed(() => {
        return getCachedIndices(
            scrollTop.value,
            itemHeight.value,
            containerHeight.value,
            adaptiveConfig.value.overscan,
            items.value.length
        )
    })

    const startIndex = computed(() => indices.value.startIndex)
    const endIndex = computed(() => indices.value.endIndex)

    // Rendu différé pour éviter les blocages UI sur gros datasets
    const deferredVisibleItems = ref<any[]>([])
    const isRendering = ref(false)

    const visibleItems = computed(() => {
        const start = startIndex.value
        const end = endIndex.value + 1
        return items.value.slice(start, end)
    })

    // Mettre à jour les éléments visibles de manière différée
    watch(visibleItems, (newItems) => {
        if (isRendering.value) return

        // Pour les grands datasets, différer le rendu
        if (items.value.length >= 1000) {
            isRendering.value = true
            requestAnimationFrame(() => {
                deferredVisibleItems.value = newItems
                requestAnimationFrame(() => {
                    isRendering.value = false
                })
            })
        } else {
            deferredVisibleItems.value = newItems
        }
    }, { immediate: true })

    // Clé stable pour forcer le ré-render uniquement quand nécessaire
    const renderKey = computed(() => {
        const start = startIndex.value
        const end = endIndex.value
        const itemCount = deferredVisibleItems.value.length
        // Inclure les IDs des premiers et derniers éléments pour stabilité
        const firstId = deferredVisibleItems.value[0]?.id || deferredVisibleItems.value[0]?.reference || 'start'
        const lastId = deferredVisibleItems.value[itemCount - 1]?.id || deferredVisibleItems.value[itemCount - 1]?.reference || 'end'
        return `${start}-${end}-${itemCount}-${firstId}-${lastId}`
    })

    const transformY = computed(() => startIndex.value * itemHeight.value)

    // Debouncing pour les événements de scroll
    let scrollTimeout: number | null = null

    const handleScroll = (event: Event) => {
        const target = event.target as HTMLElement
        scrollTop.value = target.scrollTop
        isScrolling.value = true

        // Debounce avec requestAnimationFrame
        if (scrollTimeout) {
            cancelAnimationFrame(scrollTimeout)
        }

        scrollTimeout = requestAnimationFrame(() => {
            isScrolling.value = false
        })
    }

    // Gestion du lazy loading
    const isLoadingMore = ref(false)
    const hasMoreItems = ref(true)

    const checkForMoreItems = () => {
        if (isLoadingMore.value || !hasMoreItems.value) return

        const scrollBottom = scrollTop.value + containerHeight.value
        const totalScrollHeight = totalHeight.value

        if (scrollBottom >= totalScrollHeight - threshold.value) {
            loadMoreItems()
        }
    }

    const loadMoreItems = async () => {
        if (isLoadingMore.value) return

        isLoadingMore.value = true
        try {
            // Événement personnalisé pour charger plus d'éléments
            window.dispatchEvent(new CustomEvent('virtual-scroll-load-more', {
                detail: {
                    currentCount: items.value.length,
                    startIndex: startIndex.value,
                    endIndex: endIndex.value
                }
            }))
        } finally {
            isLoadingMore.value = false
        }
    }

    // Lifecycle hooks
    onMounted(() => {
        if (containerRef.value) {
            containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
        }
    })

    onUnmounted(() => {
        if (containerRef.value) {
            containerRef.value.removeEventListener('scroll', handleScroll)
        }
        if (scrollTimeout) {
            cancelAnimationFrame(scrollTimeout)
        }
    })

    // Méthodes publiques
    const scrollToIndex = (index: number) => {
        if (containerRef.value) {
            const scrollTop = index * itemHeight.value
            containerRef.value.scrollTop = scrollTop
        }
    }

    const scrollToTop = () => {
        scrollToIndex(0)
    }

    const scrollToBottom = () => {
        scrollToIndex(items.value.length - 1)
    }

    return {
        // État
        scrollTop: computed(() => scrollTop.value),
        isScrolling: computed(() => isScrolling.value),
        isLoadingMore: computed(() => isLoadingMore.value),
        hasMoreItems: computed(() => hasMoreItems.value),

        // Calculs optimisés
        startIndex: computed(() => startIndex.value),
        endIndex: computed(() => endIndex.value),
        visibleItems: computed(() => visibleItems.value),
        deferredVisibleItems: computed(() => deferredVisibleItems.value),
        totalHeight: computed(() => totalHeight.value),
        transformY: computed(() => transformY.value),
        renderKey: computed(() => renderKey.value),

        // États optimisés
        isRendering: computed(() => isRendering.value),
        adaptiveConfig: computed(() => adaptiveConfig.value),

        // Références
        containerRef,

        // Méthodes
        scrollToIndex,
        scrollToTop,
        scrollToBottom,
        checkForMoreItems,

        // Setters
        setHasMoreItems: (value: boolean) => { hasMoreItems.value = value },
        setItems: (newItems: T[]) => {
            items.value = newItems
        }
    }
}

/**
 * Utilitaire pour déterminer automatiquement si le virtual scrolling doit être activé
 * basé sur la taille de la page et le nombre d'éléments
 *
 * @param pageSize - Taille actuelle de la page
 * @param threshold - Seuil à partir duquel activer le virtual scrolling (défaut: 100)
 * @returns true si le virtual scrolling doit être activé
 */
export function shouldEnableVirtualScrolling(pageSize: number | ComputedRef<number>, threshold: number = 100): ComputedRef<boolean> {
    return computed(() => unref(pageSize) > threshold)
}

/**
 * Configuration de virtual scrolling optimisée pour les grandes listes
 *
 * @param pageSize - Taille de la page actuelle
 * @param itemHeight - Hauteur d'un élément (défaut: 50px)
 * @param containerHeight - Hauteur du conteneur (défaut: basé sur pageSize)
 * @returns Configuration optimisée pour le virtual scrolling
 */
export function getOptimizedVirtualScrollingConfig(
    pageSize: number | ComputedRef<number>,
    itemHeight: number = 50,
    containerHeight?: number
): ComputedRef<VirtualScrollingConfig> {
    return computed(() => {
        const currentPageSize = unref(pageSize)

        // Hauteur de conteneur par défaut basée sur la pageSize
        const defaultContainerHeight = Math.min(currentPageSize * itemHeight, 600)

        return {
            itemHeight,
            containerHeight: containerHeight || defaultContainerHeight,
            overscan: Math.min(Math.max(5, Math.floor(currentPageSize / 20)), 15), // Overscan adaptatif
            threshold: Math.max(50, Math.floor(currentPageSize / 2)) // Seuil pour lazy loading
        }
    })
}

