import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    persistent?: boolean;
}

export const useAppStore = defineStore('app', () => {
    // State
    const theme = ref<'light' | 'dark' | 'system'>('system');
    const sidebarCollapsed = ref(false);
    const notifications = ref<Notification[]>([]);
    const globalLoading = ref(false);
    const currentPage = ref('');
    const breadcrumbs = ref<Array<{ label: string; path?: string }>>([]);

    // Getters
    const getTheme = computed(() => theme.value);
    const isSidebarCollapsed = computed(() => sidebarCollapsed.value);
    const getNotifications = computed(() => notifications.value);
    const isGlobalLoading = computed(() => globalLoading.value);
    const getCurrentPage = computed(() => currentPage.value);
    const getBreadcrumbs = computed(() => breadcrumbs.value);

    // Actions
    const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
        theme.value = newTheme;
        // Sauvegarder dans localStorage
        localStorage.setItem('theme', newTheme);

        // Appliquer le thème au document
        if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleSidebar = () => {
        sidebarCollapsed.value = !sidebarCollapsed.value;
    };

    const addNotification = (notification: Omit<Notification, 'id'>) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = {
            id,
            ...notification,
            duration: notification.duration || 5000,
        };

        notifications.value.push(newNotification);

        // Auto-remove notification after duration (unless persistent)
        if (!notification.persistent && newNotification.duration) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }
    };

    const removeNotification = (id: string) => {
        const index = notifications.value.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications.value.splice(index, 1);
        }
    };

    const clearNotifications = () => {
        notifications.value = [];
    };

    const setGlobalLoading = (loading: boolean) => {
        globalLoading.value = loading;
    };

    const setCurrentPage = (page: string) => {
        currentPage.value = page;
    };

    const setBreadcrumbs = (crumbs: Array<{ label: string; path?: string }>) => {
        breadcrumbs.value = crumbs;
    };

    const addBreadcrumb = (crumb: { label: string; path?: string }) => {
        breadcrumbs.value.push(crumb);
    };

    const clearBreadcrumbs = () => {
        breadcrumbs.value = [];
    };

    // Initialisation
    const initializeApp = () => {
        // Récupérer le thème depuis localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
        if (savedTheme) {
            setTheme(savedTheme);
        }

        // Écouter les changements de préférence système
        if (theme.value === 'system') {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (theme.value === 'system') {
                    if (e.matches) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            });
        }
    };

    return {
        // State
        theme,
        sidebarCollapsed,
        notifications,
        globalLoading,
        currentPage,
        breadcrumbs,

        // Getters
        getTheme,
        isSidebarCollapsed,
        getNotifications,
        isGlobalLoading,
        getCurrentPage,
        getBreadcrumbs,

        // Actions
        setTheme,
        toggleSidebar,
        addNotification,
        removeNotification,
        clearNotifications,
        setGlobalLoading,
        setCurrentPage,
        setBreadcrumbs,
        addBreadcrumb,
        clearBreadcrumbs,
        initializeApp,
    };
});
