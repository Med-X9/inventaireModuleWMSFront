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
    name: 'inventory-create',
    component: () =>
      import(/* webpackChunkName: "inventory-create" */ '../views/Inventory/InventoryCreation.vue')
},
{
    path: '/inventory/management',
    name: 'inventory-list',
    component: () =>
      import(
        /* webpackChunkName: "inventory-list" */ '../views/Inventory/Management/InventoryManagement.vue'
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
    path: '/inventory/affecter',
    name: 'inventory-affecter',               // <— <-- nouvelle route
    component: () =>
      import(/* webpackChunkName: "inventory-affecter" */ '../views/Inventory/Affecter.vue')
  },
  {
    path: '/inventory/:id/edit',
    name: 'inventory-edit',
    component: () => import('../views/Inventory/InventoryEdit.vue')
  },
    {
      path: '/inventory/:id',
      name: 'inventory-detail',
      component: () => import('../views/Inventory/InventoryDetail.vue')
    },
  {
    path: '/inventory/planning-management',  // Chemin de la route
    name: 'planning-management',  // Nom de la route
    component: () =>
      import(/* webpackChunkName: "planning-management" */ '../views/Inventory/PlanningManagement.vue')  // Charger le composant
  },
  

  {
    path: '/auth/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "auth-login" */ '../views/auth/login.vue'),
    meta: { layout: 'auth' },
},
{
  path: '/inventory/launch-jobs',
  name: 'jobs-launch',
  component: () =>
    import(
      /* webpackChunkName: "jobs-launch" */ '../views/Inventory/LaunchJobs.vue'
    )
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
