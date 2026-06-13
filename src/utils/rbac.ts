import { getTokens } from '@/utils/cookieUtils'

/**
 * Décode le payload JWT (sans vérification de signature — usage front uniquement).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.')
        if (parts.length < 2) return null
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(
            atob(payload)
                .split('')
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join('')
        )
        return JSON.parse(json)
    } catch {
        return null
    }
}

/**
 * Rôles utilisateur extraits du JWT (claims `roles`, `groups` ou `role`).
 */
export function getUserRoles(): string[] {
    const tokens = getTokens()
    if (!tokens?.access) return []

    const payload = decodeJwtPayload(tokens.access)
    if (!payload) return []

    if (Array.isArray(payload.roles)) {
        return payload.roles.map(String)
    }
    if (Array.isArray(payload.groups)) {
        return payload.groups.map(String)
    }
    if (typeof payload.role === 'string') {
        return [payload.role]
    }
    return []
}

/**
 * Vérifie si l'utilisateur possède au moins un des rôles requis.
 * Si aucun rôle requis, accès autorisé.
 */
export function hasRequiredRoles(requiredRoles?: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
        return true
    }
    const userRoles = getUserRoles()
    if (userRoles.length === 0) {
        return true
    }
    return requiredRoles.some((role) => userRoles.includes(role))
}
