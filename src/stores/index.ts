import { defineStore } from 'pinia';
import i18n from '@/i18n';
import appSetting from '@/app-setting';
import type { ViewModeType } from '@/interfaces/planningManagement';
export const useAppStore = defineStore('app', {
    state: () => ({
        viewMode: (localStorage.getItem('viewMode') as ViewModeType) || 'table',
        inventoryCurrentTab: localStorage.getItem('inventoryCurrentTab') || 'general',
        inventoryViewMode: (localStorage.getItem('inventoryViewMode') as ViewModeType) || 'table',
        planningViewModeAll: (localStorage.getItem('planningViewModeAll') as ViewModeType) || 'table',
        planningTeamsFullscreen: localStorage.getItem('planningTeamsFullscreen') === 'true',
        planningJobsFullscreen: localStorage.getItem('planningJobsFullscreen') === 'true',
        isDarkMode: false,
        mainLayout: 'app',
        theme: 'light',
        menu: 'vertical',
        layout: 'full',
        rtlClass: 'ltr',
        animation: '',
        navbar: 'navbar-sticky',
        locale: 'fr',
        sidebar: false,
        languageList: [
            { code: 'zh', name: 'Chinese' },
            { code: 'da', name: 'Danish' },
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'el', name: 'Greek' },
            { code: 'hu', name: 'Hungarian' },
            { code: 'it', name: 'Italian' },
            { code: 'ja', name: 'Japanese' },
            { code: 'pl', name: 'Polish' },
            { code: 'pt', name: 'Portuguese' },
            { code: 'ru', name: 'Russian' },
            { code: 'es', name: 'Spanish' },
            { code: 'sv', name: 'Swedish' },
            { code: 'tr', name: 'Turkish' },
            { code: 'ae', name: 'Arabic' },
        ],
        isShowMainLoader: true,
        semidark: false,
    }),

    actions: {
        setPlanningTeamsFullscreen(isFullscreen: boolean) {
            this.planningTeamsFullscreen = isFullscreen;
            localStorage.setItem('planningTeamsFullscreen', isFullscreen.toString());
        },
        setPlanningJobsFullscreen(isFullscreen: boolean) {
            this.planningJobsFullscreen = isFullscreen;
            localStorage.setItem('planningJobsFullscreen', isFullscreen.toString());
        },
        setViewMode(mode: ViewModeType) {
            this.viewMode = mode;
            localStorage.setItem('viewMode', mode);
        },
        setInventoryCurrentTab(tab: string) {
            this.inventoryCurrentTab = tab;
            localStorage.setItem('inventoryCurrentTab', tab);
        },
        setInventoryViewMode(mode: ViewModeType) {
            this.inventoryViewMode = mode;
            localStorage.setItem('inventoryViewMode', mode);
        },
        setPlanningViewModeAll(mode: ViewModeType) {
            this.planningViewModeAll = mode;
            localStorage.setItem('planningViewModeAll', mode);
        },
        setMainLayout(payload: any = null) {
            this.mainLayout = payload;
        },
        toggleTheme(payload: any = null) {
            payload = payload || this.theme;
            localStorage.setItem('theme', payload);
            this.theme = payload;
            if (payload == 'light') {
                this.isDarkMode = false;
            } else if (payload == 'dark') {
                this.isDarkMode = true;
            } else if (payload == 'system') {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    this.isDarkMode = true;
                } else {
                    this.isDarkMode = false;
                }
            }

            if (this.isDarkMode) {
                document.querySelector('body')?.classList.add('dark');
            } else {
                document.querySelector('body')?.classList.remove('dark');
            }
        },
        toggleMenu(payload: any = null) {
            payload = payload || this.menu;
            this.sidebar = false;
            localStorage.setItem('menu', payload);
            this.menu = payload;
        },
        toggleLayout(payload: any = null) {
            payload = payload || this.layout;
            localStorage.setItem('layout', payload);
            this.layout = payload;
        },
        toggleRTL(payload: any = null) {
            payload = payload || this.rtlClass;
            localStorage.setItem('rtlClass', payload);
            this.rtlClass = payload;
            document.querySelector('html')?.setAttribute('dir', this.rtlClass || 'ltr');
        },
        toggleAnimation(payload: any = null) {
            payload = payload || this.animation;
            payload = payload?.trim();
            localStorage.setItem('animation', payload);
            this.animation = payload;
            appSetting.changeAnimation();
        },
        toggleNavbar(payload: any = null) {
            payload = payload || this.navbar;
            localStorage.setItem('navbar', payload);
            this.navbar = payload;
        },
        toggleSemidark(payload: any = null) {
            payload = payload || false;
            localStorage.setItem('semidark', payload);
            this.semidark = payload;
        },
        toggleLocale(payload: any = null) {
            payload = payload || this.locale;
            i18n.global.locale.value = payload;
            localStorage.setItem('i18n_locale', payload);
            this.locale = payload;
            if(this.locale?.toLowerCase() === 'ae') {
                this.toggleRTL('rtl');
            } else {
                this.toggleRTL('ltr');
            }
        },
        toggleSidebar(state: boolean = false) {
            this.sidebar = !this.sidebar;
        },
        toggleMainLoader(state: boolean = false) {
            this.isShowMainLoader = true;
            setTimeout(() => {
                this.isShowMainLoader = false;
            }, 500);
        },
    },
    getters: {},
});