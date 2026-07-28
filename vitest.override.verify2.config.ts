import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fixSystemDesignImports } from './vite-plugin-fix-system-design'

export default defineConfig({
  cacheDir: '/tmp/wmsfront-vite-cache3',
  plugins: [vue(), fixSystemDesignImports()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/composables': path.resolve(__dirname, './src/composables'),
      '@/interfaces': path.resolve(__dirname, './src/interfaces'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/services': path.resolve(__dirname, './src/services'),
    },
    dedupe: ['vue', 'vue-router', '@vueuse/core', '@vueuse/shared']
  },
  optimizeDeps: {
    exclude: ['@SMATCH-Digital-dev/vue-system-design']
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/__verify_basic_reactivity.spec.ts']
  }
})
