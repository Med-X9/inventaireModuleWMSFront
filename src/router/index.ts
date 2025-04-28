import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAppStore } from '@/stores/index';
import appSetting from '@/app-setting';

import HomeView from '../views/index.vue';

const routes: RouteRecordRaw[] = [
    // dashboard
    { path: '/', name: 'home', component: HomeView },

    // apps
  // Inventaire
  {
    path: '/inventory/creation',
    name: 'inventory-creation',
    component: () =>
      import(/* webpackChunkName: "inventory-creation" */ '../views/Inventory/InventoryCreation.vue')
},
{
    path: '/inventory/management',
    name: 'inventory-management',
    component: () =>
      import(
        /* webpackChunkName: "inventory-management" */ '../views/Inventory/Management/InventoryManagement.vue'
      )
  },  
  {
    path: '/inventory/results',
    name: 'inventory-results', // Nom de la route
    component: () =>
      import(/* webpackChunkName: "inventory-results" */ '../views/Inventory/Results/InventoryResults.vue'), // Import de la page des résultats
  },
{
    path: '/inventory/planning',
    name: 'inventory-planning',
    component: () =>
      import(/* webpackChunkName: "inventory-planning" */ '../views/Inventory/Planning.vue')
  },
  {
    path: '/inventaire/:id/edit',
    name: 'inventory-edit',
    component: () =>
        import(/* webpackChunkName: "inventory-edit" */ '../views/Inventory/InventoryEdit.vue')
    },
  
  {
    path: '/inventory/gestion-des-plannings',  // Chemin de la route
    name: 'gestion-des-plannings',  // Nom de la route
    component: () =>
      import(/* webpackChunkName: "gestion-des-plannings" */ '../views/Inventory/GestionDesPlannings.vue')  // Charger le composant
  },
  

  {
    path: '/auth/boxed-signin',
    name: 'boxed-signin',
    component: () => import(/* webpackChunkName: "auth-boxed-signin" */ '../views/auth/boxed-signin.vue'),
    meta: { layout: 'auth' },
},


];

const router = createRouter({
    history: createWebHistory(),
    linkExactActiveClass: 'active',
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { left: 0, top: 0 };
        }
    },
});

router.beforeEach((to, from, next) => {
    const store = useAppStore();

    if (to?.meta?.layout == 'auth') {
        store.setMainLayout('auth');
    } else {
        store.setMainLayout('app');
    }
    next(true);
});
router.afterEach((to, from, next) => {
    appSetting.changeAnimation();
});
export default router;
