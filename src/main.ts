import { createApp } from 'vue';
import App from '@/App.vue';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// main.ts ou équivalent




// pinia store
import { createPinia } from 'pinia';
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)
const app = createApp(App);
app.use(pinia);

// router
import router from '@/router';
app.use(router);

// global CSS
import '@/assets/css/app.css';

// perfect scrollbar
import PerfectScrollbar from 'vue3-perfect-scrollbar';
app.use(PerfectScrollbar);

// vue-meta
import { createHead } from '@vueuse/head';
const head = createHead();
app.use(head);

// default app settings
import appSetting from '@/app-setting';
appSetting.init();

// i18n
import i18n from '@/i18n';
app.use(i18n);

// tooltips, masks, markdown, popper...
import { TippyPlugin } from 'tippy.vue';
import Maska from 'maska';
import VueEasymde from 'vue3-easymde';
import 'easymde/dist/easymde.min.css';
import Popper from 'vue3-popper';
import vue3JsonExcel from 'vue3-json-excel';

app.use(TippyPlugin);
app.use(Maska);
app.use(VueEasymde);
app.component('Popper', Popper);
app.use(vue3JsonExcel);

// --- AG Grid modules ---
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  RowSelectionModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  PaginationModule,
  ValidationModule,
  EventApiModule,
  CellStyleModule,
  CsvExportModule,
  TooltipModule,
  TextEditorModule,
  SelectEditorModule,
  NumberEditorModule,
  DateEditorModule,
} from 'ag-grid-community'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  RowSelectionModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  PaginationModule,
  ValidationModule,
  EventApiModule,
  CellStyleModule,
  CsvExportModule,
  TooltipModule,
  TextEditorModule,     
  SelectEditorModule,
  NumberEditorModule,
  DateEditorModule
])

// montez l'app après avoir enregistré vos modules
app.mount('#app');