import { createI18n } from 'vue-i18n'

type LocaleModule = {
    default: Record<string, string>
}

const localeModules = import.meta.glob('./locales/*.json', { eager: true }) as Record<string, LocaleModule>

const messages = Object.fromEntries(
    Object.entries(localeModules).map(([path, module]) => {
        const locale = path.split('/').pop()?.replace('.json', '') ?? path
        return [locale, module.default]
    })
)

export default createI18n({
    legacy: false,
    allowComposition: true,
    locale: 'fr',
    globalInjection: true,
    fallbackLocale: 'fr',
    messages
})
