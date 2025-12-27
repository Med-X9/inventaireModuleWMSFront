/**
 * Composable pour gérer le scroll infini
 * Charge les données progressivement lors du scroll
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

export interface InfiniteScrollConfig {
  /** Nombre d'éléments à charger par batch */
  batchSize?: number
  /** Distance du bas avant de charger (en pixels) */
  threshold?: number
  /** Activer le scroll infini */
  enabled?: boolean
  /** Fonction pour charger plus de données */
  loadMore?: (startIndex: number, endIndex: number) => Promise<any[]>
}

/**
 * Composable pour gérer le scroll infini
 */
export function useInfiniteScroll(
  containerRef: Ref<HTMLElement | null>,
  config: InfiniteScrollConfig = {}
) {
  const { 
    batchSize = 50, 
    threshold = 200,
    enabled = true,
    loadMore 
  } = config

  // État
  const isLoading = ref(false)
  const hasMore = ref(true)
  const loadedItems = ref<any[]>([])
  const currentIndex = ref(0)
  const error = ref<Error | null>(null)

  /**
   * Charge un batch de données
   */
  const loadBatch = async () => {
    if (!enabled || isLoading.value || !hasMore.value || !loadMore) return

    isLoading.value = true
    error.value = null

    try {
      const startIndex = currentIndex.value
      const endIndex = startIndex + batchSize
      
      const newItems = await loadMore(startIndex, endIndex)
      
      if (newItems && newItems.length > 0) {
        loadedItems.value = [...loadedItems.value, ...newItems]
        currentIndex.value = endIndex
        
        // Si on a reçu moins d'éléments que demandés, on a atteint la fin
        if (newItems.length < batchSize) {
          hasMore.value = false
        }
      } else {
        hasMore.value = false
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Erreur lors du chargement')
      console.error('Erreur lors du chargement infini:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Gère le scroll et charge plus de données si nécessaire
   */
  const handleScroll = () => {
    if (!enabled || !containerRef.value || isLoading.value || !hasMore.value) return

    const container = containerRef.value
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    // Distance du bas
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Si on est proche du bas, charger plus
    if (distanceFromBottom < threshold) {
      loadBatch()
    }
  }

  /**
   * Réinitialise le scroll infini
   */
  const reset = () => {
    loadedItems.value = []
    currentIndex.value = 0
    hasMore.value = true
    error.value = null
    if (loadMore) {
      loadBatch()
    }
  }

  /**
   * Charge le premier batch
   */
  const initialize = async () => {
    if (enabled && loadMore) {
      await loadBatch()
    }
  }

  // Écouter les événements de scroll
  onMounted(() => {
    if (enabled && containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
      // Charger le premier batch
      initialize()
    }
  })

  onUnmounted(() => {
    if (enabled && containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    // État
    loadedItems: computed(() => loadedItems.value),
    isLoading: computed(() => isLoading.value),
    hasMore: computed(() => hasMore.value),
    error: computed(() => error.value),
    
    // Méthodes
    loadBatch,
    reset,
    initialize,
    handleScroll
  }
}

