import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAppStore } from '@/stores/index';
import appSetting from '@/app-setting';
import { getTokens } from '@/utils/cookieUtils';

import HomeView from '../views/index.vue';

const routes: RouteRecordRaw[] = [
    // Dashboard
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true },
    },

    // Inventaire
    {
        path: '/inventory/create',
        name: 'inventory-create',
        component: () =>
            import(/* webpackChunkName: "inventory-create" */ '../views/Inventory/InventoryCreation.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/management',
        name: 'inventory-list',
        component: () =>
            import(/* webpackChunkName: "inventory-list" */ '../views/Inventory/Management/InventoryManagement.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/results',
        name: 'inventory-results',
        component: () => import(/* webpackChunkName: "inventory-results" */ '@/views/Inventory/Results/InventoryResults.vue'),
        props: route => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/job-tracking',
        name: 'inventory-job-tracking',
        component: () => import(/* webpackChunkName: "inventory-job-tracking" */ '@/views/Inventory/Results/JobTracking.vue'),
        props: route => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true }
    },
    {
        path: '/inventory/:reference/import-tracking',
        name: 'inventory-import-tracking',
        component: () => import(/* webpackChunkName: "inventory-import-tracking" */ '@/views/Inventory/ImportTracking.vue'),
        props: route => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true }
    },

    {
        path: '/inventory/:reference/detail',
        name: 'inventory-detail',
        component: () => import('@/views/Inventory/InventoryDetail.vue'),
        props: route => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },

    {
        path: '/inventory/:reference/:warehouse/planning',
        name: 'inventory-planning',
        component: () =>
            import(/* webpackChunkName: "inventory-planning" */ '../views/Inventory/Planning.vue'),
        props: route => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/affecter',
        name: 'inventory-affecter',
        component: () =>
            import(/* webpackChunkName: "inventory-affecter" */ '../views/Inventory/Affecter.vue'),
        props: route => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/edit',
        name: 'inventory-edit',
        component: () => import('../views/Inventory/InventoryCreation.vue'),
        props: route => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },

    {
        path: '/inventory/:reference/planning-management',
        name: 'planning-management',
        component: () =>
            import(/* webpackChunkName: "planning-management" */ '../views/Inventory/PlanningManagement.vue'),
        props: route => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/launch-jobs',
        name: 'jobs-launch',
        component: () =>
            import(/* webpackChunkName: "jobs-launch" */ '../views/Inventory/LaunchJobs.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/grid-demo',
        name: 'inventory-grid-demo',
        component: () =>
            import(/* webpackChunkName: "inventory-grid-demo" */ '../views/Inventory/InventoryGridDemo.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/job-management',
        name: 'inventory-job-management',
        component: () =>
            import(/* webpackChunkName: "inventory-job-management" */ '../views/Inventory/JobManagement.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:inventoryId/:warehouseId/monitoring/pivot',
        name: 'inventory-monitoring-pivot',
        component: () =>
            import(/* webpackChunkName: "inventory-monitoring-pivot" */ '../views/Inventory/MonitoringPivotTable.vue'),
        props: route => ({
            inventoryId: route.params.inventoryId as string,
            warehouseId: route.params.warehouseId as string
        }),
        meta: { requiresAuth: true, layout: 'monitoring' },
    },
    {
        path: '/inventory/:reference/:warehouse/monitoring',
        name: 'inventory-monitoring',
        component: () =>
            import(/* webpackChunkName: "inventory-monitoring" */ '../views/Inventory/Monitoring.vue'),
        props: route => ({
            inventoryReference: route.params.reference as string,
            warehouseReference: route.params.warehouse as string
        }),
        meta: { requiresAuth: true, layout: 'monitoring' },
    },

    // Auth (login)
    {
        path: '/auth/login',
        name: 'login',
        component: () => import(/* webpackChunkName: "auth-login" */ '../views/auth/login.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },

    // Error pages
    {
        path: '/401',
        name: 'error-401',
        component: () => import(/* webpackChunkName: "error-401" */ '../views/errors/Error401.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
    {
        path: '/403',
        name: 'error-403',
        component: () => import(/* webpackChunkName: "error-403" */ '../views/errors/Error403.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
    {
        path: '/404',
        name: 'error-404',
        component: () => import(/* webpackChunkName: "error-404" */ '../views/errors/Error404.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import(/* webpackChunkName: "error-404" */ '../views/errors/Error404.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
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

// Avant chaque navigation : gestion du layout (auth vs app) et auth guard
router.beforeEach((to, from, next) => {
    const store = useAppStore();

    // Choix du layout (ex. « auth » pour la page de login)
    if (to.meta.layout === 'auth') {
        store.setMainLayout('auth');
    } else {
        store.setMainLayout('app');
    }

    // Vérification du token pour les routes protégées
    const tokens = getTokens();
    const isAuthenticated = !!tokens?.access;

    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            return next({ name: 'login' });
        }
        return next();
    } else {
        // Si utilisateur est déjà loggé et essaie d'aller sur /auth/login, on le redirige vers '/'
        if (isAuthenticated && to.name === 'login') {
            return next({ path: '/' });
        }
        return next();
    }
});

// Après chaque navigation : déclenchement de l'animation (optionnel)
router.afterEach((to, from) => {
    appSetting.changeAnimation();
});

export default router;
