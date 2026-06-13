import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasRequiredRoles } from '../rbac'

vi.mock('@/utils/cookieUtils', () => ({
    getTokens: vi.fn(),
}))

import { getTokens } from '@/utils/cookieUtils'

describe('hasRequiredRoles', () => {
    beforeEach(() => {
        vi.mocked(getTokens).mockReturnValue(null)
    })

    it('autorise si aucun rôle requis', () => {
        expect(hasRequiredRoles()).toBe(true)
        expect(hasRequiredRoles([])).toBe(true)
    })

    it('autorise si pas de rôles dans le token (fallback)', () => {
        expect(hasRequiredRoles(['admin'])).toBe(true)
    })
})
