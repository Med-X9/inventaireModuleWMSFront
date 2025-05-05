import { ref, watch } from 'vue'

/**
 * Hook générique pour synchroniser une ref avec localStorage.
 * Garantit que les tableaux restent des Array lors de la lecture.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key)
  let initial: T

  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // Si defaultValue est un array mais parsed ne l’est pas, on retombe sur defaultValue
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        initial = defaultValue
      } else {
        initial = parsed as T
      }
    } catch {
      initial = defaultValue
    }
  } else {
    initial = defaultValue
  }

  const data = ref<T>(initial)
  watch(
    data,
    (val) => {
      localStorage.setItem(key, JSON.stringify(val))
    },
    { deep: true }
  )
  return data
}
