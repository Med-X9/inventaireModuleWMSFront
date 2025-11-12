import { ref, computed, onMounted, onUnmounted } from 'vue'

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
    items: T[],
    config: VirtualScrollingConfig
) {
    // Configuration avec valeurs par défaut
    const {
        itemHeight,
        containerHeight,
        overscan = 5,
        threshold = 100
    } = config

    // État réactif
    const scrollTop = ref(0)
    const isScrolling = ref(false)
    const containerRef = ref<HTMLElement | null>(null)

    // Calculs optimisés avec computed
    const totalHeight = computed(() => items.length * itemHeight)

    const startIndex = computed(() => {
        const index = Math.floor(scrollTop.value / itemHeight)
        return Math.max(0, index - overscan)
    })

    const endIndex = computed(() => {
        const index = Math.floor((scrollTop.value + containerHeight) / itemHeight)
        return Math.min(items.length - 1, index + overscan)
    })

    const visibleItems = computed(() => {
        return items.slice(startIndex.value, endIndex.value + 1)
    })

    const transformY = computed(() => startIndex.value * itemHeight)

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

        const scrollBottom = scrollTop.value + containerHeight
        const totalScrollHeight = totalHeight.value

        if (scrollBottom >= totalScrollHeight - threshold) {
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
                    currentCount: items.length,
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
            const scrollTop = index * itemHeight
            containerRef.value.scrollTop = scrollTop
        }
    }

    const scrollToTop = () => {
        scrollToIndex(0)
    }

    const scrollToBottom = () => {
        scrollToIndex(items.length - 1)
    }

    return {
        // État
        scrollTop: computed(() => scrollTop.value),
        isScrolling: computed(() => isScrolling.value),
        isLoadingMore: computed(() => isLoadingMore.value),
        hasMoreItems: computed(() => hasMoreItems.value),

        // Calculs
        startIndex: computed(() => startIndex.value),
        endIndex: computed(() => endIndex.value),
        visibleItems: computed(() => visibleItems.value),
        totalHeight: computed(() => totalHeight.value),
        transformY: computed(() => transformY.value),

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
            // Optimisation : ne recalculer que si nécessaire
            if (newItems.length !== items.length) {
                items.splice(0, items.length, ...newItems)
            }
        }
    }
}
