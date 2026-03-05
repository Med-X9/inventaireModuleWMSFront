import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { vueI18n } from '@intlify/vite-plugin-vue-i18n';
import { fixSystemDesignImports } from './vite-plugin-fix-system-design';

export default defineConfig({
    plugins: [
        vue(),
        tsconfigPaths(),
        vueI18n({
            include: path.resolve(__dirname, './src/locales/**'),
        }),
        fixSystemDesignImports(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/composables': path.resolve(__dirname, './src/composables'),
            '@/interfaces': path.resolve(__dirname, './src/interfaces'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/services': path.resolve(__dirname, './src/services'),
            // Alias pour les styles du système de design
            '@SMATCH-Digital-dev/vue-system-design/styles': path.resolve(__dirname, './node_modules/@SMATCH-Digital-dev/vue-system-design/dist/style.css'),
        },
        // Permettre l'import de modules externes même s'ils ont des imports internes problématiques
        dedupe: ['vue', 'vue-router'],
    },
    optimizeDeps: {
        include: ['quill', 'vue-flatpickr-component', 'flatpickr'],
        // Exclure le package mal compilé de l'optimisation
        exclude: ['@SMATCH-Digital-dev/vue-system-design'],
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
