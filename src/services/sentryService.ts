/**
 * Observabilité Sentry — stub léger sans dépendance npm obligatoire.
 * Installer @sentry/vue et brancher initSentry dans main.ts pour activer en production.
 */

export async function initSentry(): Promise<void> {
    const dsn = import.meta.env.VITE_SENTRY_DSN
    if (!dsn) {
        return
    }
    console.info('[sentryService] VITE_SENTRY_DSN défini — installer @sentry/vue pour activer Sentry')
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN
    if (!dsn) {
        return
    }
    console.error('[sentryService]', error, context)
}
