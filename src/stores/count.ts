import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Count } from '@/models/Count';
import type { AxiosResponse } from 'axios';

export const useCountStore = defineStore('count', () => {
  // State
  const counts = ref<Count[]>([]);
  const currentCount = ref<Count | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const getCounts = computed(() => counts.value);
  const getCurrentCount = computed(() => currentCount.value);
  const isLoading = computed(() => loading.value);
  const getError = computed(() => error.value);

  // Actions
  const setCounts = (newCounts: Count[]) => {
    counts.value = newCounts;
  };

  const addCount = (count: Count) => {
    counts.value.push(count);
  };

  const updateCount = (id: number, updatedCount: Count) => {
    const index = counts.value.findIndex(c => c.id === id);
    if (index !== -1) {
      counts.value[index] = updatedCount;
    }
  };

  const removeCount = (id: number) => {
    counts.value = counts.value.filter(c => c.id !== id);
  };

  const setCurrentCount = (count: Count | null) => {
    currentCount.value = count;
  };

  const setLoading = (loadingState: boolean) => {
    loading.value = loadingState;
  };

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const clearCounts = () => {
    counts.value = [];
  };

  return {
    // State
    counts,
    currentCount,
    loading,
    error,

    // Getters
    getCounts,
    getCurrentCount,
    isLoading,
    getError,

    // Actions
    setCounts,
    addCount,
    updateCount,
    removeCount,
    setCurrentCount,
    setLoading,
    setError,
    clearError,
    clearCounts,
  };
});
