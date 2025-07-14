import { createI18n } from 'vue-i18n';

export default createI18n({
    legacy: false,
    allowComposition: true,
    locale: 'fr',
    globalInjection: true,
    fallbackLocale: 'fr',
    messages: {},
});
