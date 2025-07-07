import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { vueI18n } from '@intlify/vite-plugin-vue-i18n';

export default defineConfig({
  plugins: [
    vue(),                            // support des SFC Vue :contentReference[oaicite:1]{index=1}
    tsconfigPaths(),                  // résolution des alias TS (@"*/src/*") :contentReference[oaicite:2]{index=2}
    vueI18n({                         // internationalisation, inclut vos json de locales :contentReference[oaicite:3]{index=3}
      include: path.resolve(__dirname, './src/locales/**'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['quill'],
  },
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
});
