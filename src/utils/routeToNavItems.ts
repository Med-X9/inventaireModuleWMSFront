/**
 * Utilitaires de navigation — requis par @SMATCH-Digital-dev/vue-system-design
 * (le bundle importe `@/utils/routeToNavItems` sans inclure le fichier).
 */

import type { RouteRecordNormalized } from 'vue-router'

export interface NavItemFromRoute {
    path: string
    label: string
    icon?: unknown
    children?: NavItemFromRoute[]
    meta?: Record<string, unknown>
}

export interface RoutesNavConfig {
    /** Préfixe de chemin à exclure (ex. /auth) */
    excludePathPrefixes?: string[]
    /** N'inclure que les routes avec meta.sidebar === true si défini */
    requireSidebarMeta?: boolean
}

const DEFAULT_EXCLUDE = ['/auth', '/401', '/403', '/404']

function isNavRoute(route: RouteRecordNormalized, config?: RoutesNavConfig): boolean {
    if (!route.path || route.path.includes(':pathMatch')) {
        return false
    }
    if (route.meta?.layout === 'auth') {
        return false
    }
    if (route.meta?.hidden === true || route.meta?.hideInNav === true) {
        return false
    }
    const prefixes = config?.excludePathPrefixes ?? DEFAULT_EXCLUDE
    if (prefixes.some((p) => route.path === p || route.path.startsWith(`${p}/`))) {
        return false
    }
    if (config?.requireSidebarMeta && route.meta?.sidebar !== true) {
        return false
    }
    return Boolean(route.name)
}

function routeLabel(route: RouteRecordNormalized): string {
    const title = route.meta?.title
    if (typeof title === 'string' && title.trim()) {
        return title
    }
    const name = route.name
    if (typeof name === 'string') {
        return name
    }
    return route.path
}

function mapRouteToNavItem(route: RouteRecordNormalized): NavItemFromRoute {
    return {
        path: route.path,
        label: routeLabel(route),
        icon: route.meta?.icon,
        meta: route.meta as Record<string, unknown>,
    }
}

function collectRoutes(routes: RouteRecordNormalized[], config?: RoutesNavConfig): RouteRecordNormalized[] {
    const out: RouteRecordNormalized[] = []
    for (const route of routes) {
        if (isNavRoute(route, config)) {
            out.push(route)
        }
        if (route.children?.length) {
            out.push(...collectRoutes(route.children as RouteRecordNormalized[], config))
        }
    }
    return out
}

export function generateSidebarItemsFromRoutes(
    routes: RouteRecordNormalized[],
    config?: RoutesNavConfig
): NavItemFromRoute[] {
    return collectRoutes(routes, config).map(mapRouteToNavItem)
}

export function generateNavbarItemsFromRoutes(
    routes: RouteRecordNormalized[],
    config?: RoutesNavConfig
): NavItemFromRoute[] {
    return collectRoutes(routes, config)
        .filter((r) => r.meta?.navbar === true)
        .map(mapRouteToNavItem)
}

export function generateSubNavItemsFromRoutes(
    routes: RouteRecordNormalized[],
    config?: RoutesNavConfig
): NavItemFromRoute[] {
    return collectRoutes(routes, config)
        .filter((r) => r.meta?.subNav === true)
        .map(mapRouteToNavItem)
}
