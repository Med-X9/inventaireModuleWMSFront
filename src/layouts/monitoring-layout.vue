<template>
    <div class="monitoring-layout-container">
        <router-view></router-view>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/index'

const store = useAppStore()

// Désactiver la sidebar et navbar pour le monitoring
onMounted(() => {
  // S'assurer que sidebar et navbar sont désactivés
  if (store.sidebar) {
    store.toggleSidebar()
  }
})
</script>

<style scoped>
.monitoring-layout-container {
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background-color: rgb(241 245 249);
}

.monitoring-layout-container :deep(> *) {
  width: 100% !important;
  height: 100% !important;
}
</style>

