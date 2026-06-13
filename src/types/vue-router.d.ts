import 'vue-router'

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean
        layout?: 'auth' | 'app' | 'monitoring'
        roles?: string[]
    }
}
