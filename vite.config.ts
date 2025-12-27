import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { vueI18n } from '@intlify/vite-plugin-vue-i18n';

export default defineConfig({
    plugins: [
        vue(),
        tsconfigPaths(),
        vueI18n({
            include: path.resolve(__dirname, './src/locales/**'),
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/composables': path.resolve(__dirname, './src/composables'),
            '@/interfaces': path.resolve(__dirname, './src/interfaces'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/services': path.resolve(__dirname, './src/services'),
        },
    },
    optimizeDeps: {
        include: ['quill', 'vue-flatpickr-component', 'flatpickr'],
    },
    define: {
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    server: {
        port: 3000,
        host: '0.0.0.0', // Écouter sur toutes les interfaces réseau pour permettre l'accès via IP
        strictPort: false, // Si le port est occupé, essayer le suivant
        // Optionnel : spécifier l'IP exacte si nécessaire
        // host: '192.168.100.45',
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue', 'vue-router'],
                    ui: ['vue-select', 'flatpickr']
                }
            }
        }
    },
    esbuild: {
        target: 'es2020',
        supported: {
            'top-level-await': true
        }
    }
});
