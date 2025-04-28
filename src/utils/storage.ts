import { ref, watch } from 'vue'

/**
 * Hook générique pour synchroniser une ref avec localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key)
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue)
  watch(
    data,
    (val) => {
      localStorage.setItem(key, JSON.stringify(val))
    },
    { deep: true }
  )
  return data
}
