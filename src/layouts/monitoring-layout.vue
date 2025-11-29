<template>
    <div class="min-h-screen bg-slate-50">
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

