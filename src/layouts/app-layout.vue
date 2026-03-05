<template>
    <!--  BEGIN MAIN CONTAINER  -->
    <div class="relative">
        <!-- sidebar menu overlay -->
        <div class="fixed inset-0 bg-[black]/60 z-50 lg:hidden" :class="{ hidden: !store.sidebar }" @click="store.toggleSidebar()"></div>

        <!-- screen loader -->
        <div
            v-show="store.isShowMainLoader"
            class="screen_loader fixed inset-0 bg-[#fafafa] dark:bg-[#060818] z-[60] grid place-content-center animate__animated"
        >
            <svg width="64" height="64" viewBox="0 0 135 135" xmlns="http://www.w3.org/2000/svg" fill="#4361ee">
                <path
                    d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z"
                >
                    <animateTransform attributeName="transform" type="rotate" from="0 67 67" to="-360 67 67" dur="2.5s" repeatCount="indefinite" />
                </path>
                <path
                    d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z"
                >
                    <animateTransform attributeName="transform" type="rotate" from="0 67 67" to="360 67 67" dur="8s" repeatCount="indefinite" />
                </path>
            </svg>
        </div>

        <!-- Bouton retour en haut -->
        <!-- <div class="fixed bottom-6 ltr:right-6 rtl:left-6 z-50">
            <template v-if="showTopButton">
                <button
                    type="button"
                    class="btn btn-outline-primary rounded-full p-2 animate-pulse bg-[#fafafa] dark:bg-[#060818] dark:hover:bg-primary"
                    @click="goToTop"
                >
                    <svg width="24" height="24" class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            opacity="0.5"
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M12 20.75C12.4142 20.75 12.75 20.4142 12.75 20L12.75 10.75L11.25 10.75L11.25 20C11.25 20.4142 11.5858 20.75 12 20.75Z"
                            fill="currentColor"
                        />
                        <path
                            d="M6.00002 10.75C5.69667 10.75 5.4232 10.5673 5.30711 10.287C5.19103 10.0068 5.25519 9.68417 5.46969 9.46967L11.4697 3.46967C11.6103 3.32902 11.8011 3.25 12 3.25C12.1989 3.25 12.3897 3.32902 12.5304 3.46967L18.5304 9.46967C18.7449 9.68417 18.809 10.0068 18.6929 10.287C18.5768 10.5673 18.3034 10.75 18 10.75L6.00002 10.75Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </template>
        </div> -->

        <!-- BEGIN APP SETTING LAUNCHER -->

        <!-- END APP SETTING LAUNCHER -->

        <!-- Utilisation de AppLayout du package -->
        <AppLayout
            :show-header="true"
            :show-sidebar="true"
            :show-footer="true"
            :show-navbar="true"
            :show-sub-nav="true"
            :sidebar-items="sidebarItems"
            :show-sidebar-toggle="true"
            header-title=""
            :logo="LogoComponent"
            class="main-container text-black dark:text-white-dark"
        >
            <!-- Slot par défaut : Contenu principal avec Header local personnalisé -->
            <template #default>
                <div class="main-content flex flex-col min-h-screen">
                    <!-- Zone de contenu avec animation -->
                    <div class="animation flex-1">
                        <router-view></router-view>
                    </div>
                </div>
            </template>

            <!-- Slot pour le header de la sidebar (logo + bouton toggle personnalisé) -->
            <template #sidebar-header>
                <div class="flex justify-between items-center px-4 py-6 border-b border-gray-200 dark:border-gray-700">
                    <router-link to="/" class="main-logo flex items-center shrink-0 group">
                        <img class="w-10 h-10 flex-none rounded-lg transition-transform duration-300 group-hover:scale-105" src="/assets/images/logo/logo.png" alt="Logo" />
                    </router-link>
                    <button
                        type="button"
                        class="collapse-icon w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white-light transition-all duration-300 rtl:rotate-180 hover:text-primary hover:scale-110"
                        @click="store.toggleSidebar()"
                        aria-label="Fermer la sidebar"
                    >
                        <component :is="IconMenuComponent" class="w-5 h-5" />
                    </button>
                </div>
            </template>
        </AppLayout>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, computed, markRaw } from 'vue';
    // Composant AppLayout du package
    import { AppLayout } from '@SMATCH-Digital-dev/vue-system-design';
    import type { SidebarItem } from '@SMATCH-Digital-dev/vue-system-design';
    // Composants locaux
    import Logo from '@/components/layout/Logo.vue';
    // Icônes - marquer comme non réactives avec markRaw
    import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard.vue';
    import IconMenuInventory from '@/components/icon/menu/icon-menu-inventory.vue';
    import IconMenu from '@/components/icon/icon-menu.vue';
    // i18n
    import { useI18n } from 'vue-i18n';
    import appSetting from '@/app-setting';

    import { useAppStore } from '@/stores/index';
    const store = useAppStore();
    const { t } = useI18n();
    const showTopButton = ref(false);

    // Composant Logo marqué comme non réactif
    const LogoComponent = markRaw(Logo);

    // Composant IconMenu marqué comme non réactif pour le toggle de la sidebar
    const IconMenuComponent = markRaw(IconMenu);

    /**
     * Items de navigation pour la Sidebar du package
     * Les composants d'icônes sont marqués comme non réactifs avec markRaw pour éviter les avertissements Vue
     */
    const sidebarItems = computed<SidebarItem[]>(() => [
        {
            path: '/',
            label: t('dashboard'),
            icon: markRaw(IconMenuDashboard),
        },
        {
            path: '/inventory/management',
            label: t('inventaire'),
            icon: markRaw(IconMenuInventory),
        },
    ]);

    onMounted(() => {
        window.onscroll = () => {
            if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
                showTopButton.value = true;
            } else {
                showTopButton.value = false;
            }
        };

        const eleanimation: any = document.querySelector('.animation');
        if (eleanimation) {
            eleanimation.addEventListener('animationend', function () {
                appSetting.changeAnimation('remove');
            });
        }
        store.toggleMainLoader();
    });

    const goToTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };
</script>
