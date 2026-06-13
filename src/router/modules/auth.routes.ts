import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
    {
        path: '/login',
        redirect: { name: 'login' },
    },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import(/* webpackChunkName: "auth-login" */ '@/views/auth/login.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
    },
]
