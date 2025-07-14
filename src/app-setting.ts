import { $themeConfig } from '../theme.config';
import { useAppStore } from '@/stores/index';

export default {
    init() {
        const store = useAppStore();

        // Theme
        let val: any = localStorage.getItem('theme');
        val = val || $themeConfig.theme;
        store.toggleTheme(val);

        // Menu
        val = localStorage.getItem('menu');
        val = val || $themeConfig.menu;
        store.toggleMenu(val);

        // Layout
        val = localStorage.getItem('layout');
        val = val || $themeConfig.layout;
        store.toggleLayout(val);

        // 👉 Force toujours la langue en français
        const list = store.languageList;
        const item = list.find((item: any) => item.code === 'fr');
        if (item) {
            this.toggleLanguage(item);
        }

        // RTL / LTR
        val = localStorage.getItem('rtlClass');
        val = val || $themeConfig.rtlClass;
        store.toggleRTL(val);

        // Animation
        val = localStorage.getItem('animation');
        val = val || $themeConfig.animation;
        store.toggleAnimation(val);

        // Navbar
        val = localStorage.getItem('navbar');
        val = val || $themeConfig.navbar;
        store.toggleNavbar(val);

        // Semi-dark
        val = localStorage.getItem('semidark');
        val = val === 'true' ? true : $themeConfig.semidark;
        store.toggleSemidark(val);
    },

    toggleLanguage(item: any) {
        const store = useAppStore();

        let lang: any = null;
        if (item) {
            lang = item;
        } else {
            let code = store.locale || null;
            if (!code) {
                code = 'fr'; // Force "fr" ici aussi pour être sûr
            }
            item = store.languageList.find((d: any) => d.code === code);
            if (item) {
                lang = item;
            }
        }

        if (!lang) {
            lang = store.languageList.find((d: any) => d.code === 'fr');
        }

        store.toggleLocale(lang.code);
        return lang;
    },

    changeAnimation(type = 'add') {
        const store = useAppStore();
        if (store.animation) {
            const eleanimation: any = document.querySelector('.animation');
            if (type === 'add') {
                eleanimation?.classList.add('animate__animated');
                eleanimation?.classList.add(store.animation);
            } else {
                eleanimation?.classList.remove('animate__animated');
                eleanimation?.classList.remove(store.animation);
            }
        }
    },
};
