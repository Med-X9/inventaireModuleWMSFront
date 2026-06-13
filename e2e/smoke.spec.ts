import { test, expect } from '@playwright/test'

test.describe('Smoke — parcours public', () => {
    test('redirige vers login si non authentifié', async ({ page }) => {
        await page.goto('/inventory/management')
        await expect(page).toHaveURL(/auth\/login/)
    })

    test('affiche la page de login', async ({ page }) => {
        await page.goto('/auth/login')
        await expect(page.locator('body')).toBeVisible()
    })
})
