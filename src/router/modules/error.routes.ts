import type { RouteRecordRaw } from 'vue-router'

export const errorRoutes: RouteRecordRaw[] = [
    {
        path: '/401',
        name: 'error-401',
        component: () => import(/* webpackChunkName: "error-401" */ '@/views/errors/Error401.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
    {
        path: '/403',
        name: 'error-403',
        component: () => import(/* webpackChunkName: "error-403" */ '@/views/errors/Error403.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
    {
        path: '/404',
        name: 'error-404',
        component: () => import(/* webpackChunkName: "error-404" */ '@/views/errors/Error404.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import(/* webpackChunkName: "error-404" */ '@/views/errors/Error404.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
]
