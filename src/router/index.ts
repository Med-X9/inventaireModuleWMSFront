import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/index'
import appSetting from '@/app-setting'
import { getTokens } from '@/utils/cookieUtils'
import { hasRequiredRoles } from '@/utils/rbac'
import { inventoryRoutes } from '@/router/modules/inventory.routes'
import { authRoutes } from '@/router/modules/auth.routes'
import { errorRoutes } from '@/router/modules/error.routes'

import HomeView from '@/views/index.vue'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true },
    },
    ...inventoryRoutes,
    ...authRoutes,
    ...errorRoutes,
]

const router = createRouter({
    history: createWebHistory(),
    linkExactActiveClass: 'active',
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { left: 0, top: 0 }
    },
})

router.beforeEach((to, from, next) => {
    const store = useAppStore()

    if (to.meta.layout === 'auth') {
        store.setMainLayout('auth')
    } else {
        store.setMainLayout('app')
    }

    const tokens = getTokens()
    const isAuthenticated = !!tokens?.access

    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            return next({ name: 'login' })
        }

        const requiredRoles = to.matched
            .map((record) => record.meta.roles as string[] | undefined)
            .filter(Boolean)
            .flat() as string[] | undefined

        if (!hasRequiredRoles(requiredRoles)) {
            return next({ name: 'error-403' })
        }

        return next()
    }

    if (isAuthenticated && to.name === 'login') {
        return next({ path: '/' })
    }
    return next()
})

router.afterEach(() => {
    appSetting.changeAnimation()
})

export default router
