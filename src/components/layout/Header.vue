<template>
    <header class="z-40" :class="{ dark: store.semidark && store.menu === 'horizontal' }">
        <div class="shadow-sm">
            <div class="relative bg-white flex w-full items-center px-5 py-2.5 dark:bg-[#0e1726]">
                <div class="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
                    <Logo class="ltr:-ml-1 rtl:-mr-1" />

                    <a href="javascript:;"
                        class="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
                        @click="store.toggleSidebar()">
                        <MdiIcon name="mdi-menu" size="sm" />
                    </a>
                </div>
                <div
                    class="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
                    <div class="sm:ltr:ml-auto sm:rtl:mr-auto">
                        <a href="javascript:;" v-show="store.theme === 'light'"
                            class="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                            @click="store.toggleTheme('dark')">
                            <MdiIcon name="mdi-white-balance-sunny" size="sm" />
                        </a>
                        <a href="javascript:;" v-show="store.theme === 'dark'"
                            class="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                            @click="store.toggleTheme('system')">
                            <MdiIcon name="mdi-weather-night" size="sm" />
                        </a>
                        <a href="javascript:;" v-show="store.theme === 'system'"
                            class="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                            @click="store.toggleTheme('light')">
                            <MdiIcon name="mdi-laptop" size="sm" />
                        </a>
                    </div>

                    <div class="dropdown shrink-0">
                        <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-end' : 'bottom-start'"
                            offsetDistance="8">
                            <button type="button"
                                class="relative block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                                <MdiIcon name="mdi-bell-outline" size="sm" />

                                <span class="flex absolute w-3 h-3 ltr:right-0 rtl:left-0 top-0">
                                    <span
                                        class="animate-ping absolute ltr:-left-[3px] rtl:-right-[3px] -top-[3px] inline-flex h-full w-full rounded-full bg-success/50 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full w-[6px] h-[6px] bg-success"></span>
                                </span>
                            </button>
                            <template #content="{ close }">
                                <ul
                                    class="!py-0 text-dark dark:text-white-dark w-[300px] sm:w-[350px] divide-y dark:divide-white/10">
                                    <li>
                                        <div class="flex items-center px-4 py-2 justify-between font-semibold">
                                            <h4 class="text-lg">Notification</h4>
                                            <template v-if="notifications.length">
                                                <span class="badge bg-primary/80"
                                                    v-text="notifications.length + 'New'"></span>
                                            </template>
                                        </div>
                                    </li>
                                    <template v-for="notification in notifications" :key="notification.id">
                                        <li class="dark:text-white-light/90">
                                            <div class="group flex items-center px-4 py-2">
                                                <div class="grid place-content-center rounded">
                                                    <div class="w-12 h-12 relative">
                                                        <img class="w-12 h-12 rounded-full object-cover"
                                                            :src="`/assets/images/${notification.profile}`" alt="" />
                                                        <span
                                                            class="bg-success w-2 h-2 rounded-full block absolute right-[6px] bottom-0"></span>
                                                    </div>
                                                </div>
                                                <div class="ltr:pl-3 rtl:pr-3 flex flex-auto">
                                                    <div class="ltr:pr-3 rtl:pl-3">
                                                        <h6 v-html="sanitizeHtml(notification.message)"></h6>
                                                        <span class="text-xs block font-normal dark:text-gray-500"
                                                            v-text="notification.time"></span>
                                                    </div>
                                                    <button type="button"
                                                        class="ltr:ml-auto rtl:mr-auto text-neutral-300 hover:text-danger opacity-0 group-hover:opacity-100"
                                                        @click="removeNotification(notification.id)">
                                                        <MdiIcon name="mdi-close-circle-outline" size="sm" />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    </template>
                                    <template v-if="notifications.length">
                                        <li>
                                            <div class="p-4">
                                                <button class="btn btn-primary block w-full btn-small"
                                                    @click="close()">Read All Notifications</button>
                                            </div>
                                        </li>
                                    </template>
                                    <template v-if="!notifications.length">
                                        <li>
                                            <div
                                                class="!grid place-content-center hover:!bg-transparent text-lg min-h-[200px]">
                                                <div
                                                    class="mx-auto ring-4 ring-primary/30 rounded-full mb-4 text-primary">
                                                    <MdiIcon name="mdi-information-outline" size="lg" />
                                                </div>
                                                No data available.
                                            </div>
                                        </li>
                                    </template>
                                </ul>
                            </template>
                        </Popper>
                    </div>

                    <div class="dropdown shrink-0">
                        <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-end' : 'bottom-start'" offsetDistance="8"
                            class="!block">
                            <button type="button" class="relative group block">
                                <img class="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100"
                                    :src="APP_LOGO_URL" :alt="APP_BRAND_NAME" />
                            </button>
                            <template #content="{ close }">
                                <ul
                                    class="text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90">
                                    <li>
                                        <div class="flex items-center px-4 py-4">
                                            <div class="flex-none">
                                                <img class="rounded-md w-10 h-10 object-contain"
                                                    :src="APP_LOGO_URL" :alt="APP_BRAND_NAME" />
                                            </div>
                                            <div class="ltr:pl-4 rtl:pr-4 truncate">
                                                <h4 class="text-base">
                                                    John Doe<span
                                                        class="text-xs bg-success-light rounded text-success px-1 ltr:ml-2 rtl:ml-2">Pro</span>
                                                </h4>
                                                <a class="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white"
                                                    href="javascript:;">johndoe@gmail.com</a>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <router-link to="" class="dark:hover:text-white" @click="close()">
                                            <MdiIcon name="mdi-account-outline" size="sm" class="ltr:mr-2 rtl:ml-2 shrink-0 inline-flex" />
                                            Profile
                                        </router-link>
                                    </li>
                                    <li>
                                        <router-link to="" class="dark:hover:text-white" @click="close()">
                                            <MdiIcon name="mdi-lock-outline" size="sm" class="ltr:mr-2 rtl:ml-2 shrink-0 inline-flex" />
                                            Lock Screen
                                        </router-link>
                                    </li>
                                    <li class="border-t border-white-light dark:border-white-light/10">
                                        <a href="javascript:;" class="text-danger !py-3" @click="handleLogout">
                                            <MdiIcon name="mdi-logout" size="sm" class="ltr:mr-2 rtl:ml-2 rotate-90 shrink-0 inline-flex" />
                                            Sign Out
                                        </a>
                                    </li>
                                </ul>
                            </template>
                        </Popper>
                    </div>
                </div>
            </div>

            <ul
                class="horizontal-menu hidden py-1.5 font-semibold px-6 lg:space-x-1.5 xl:space-x-8 rtl:space-x-reverse bg-white border-t border-[#ebedf2] dark:border-[#191e3a] dark:bg-[#0e1726] text-black dark:text-white-dark">
                <li class="nav-item">
                    <router-link to="/" exact
                        class="nav-link flex items-center hover:text-primary dark:hover:text-white"
                        @click="closeDropdown">
                        <MdiIcon name="mdi-view-dashboard-outline" size="sm" class="shrink-0" />
                        <span class="px-2">{{ $t('dashboard') }}</span>
                    </router-link>
                </li>

                <li class="nav-item">
                    <router-link to="/inventory/management" exact
                        class="nav-link flex items-center hover:text-primary dark:hover:text-white"
                        @click="closeDropdown">
                        <MdiIcon name="mdi-clipboard-list-outline" size="sm" class="shrink-0" />
                        <span class="px-2">{{ $t('inventaire') }}</span>
                    </router-link>
                </li>
            </ul>

            <div v-if="shouldShowBreadcrumb || shouldShowSteps"
                class="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <SubNavbar :items="breadcrumbItems" />
            </div>
        </div>
    </header>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/index';
import { useAuthStore } from '@/stores/auth';
import { useBreadcrumb } from '@/composables/useBreadcrumb';
import { useInventoryStatus } from '../../composables/useInventoryStatus';
import SubNavbar from './SubNavbar.vue';
import MdiIcon from '@/components/MdiIcon.vue';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import Logo from '@/components/layout/Logo.vue';
import { APP_LOGO_URL, APP_LOGO_ASSET, APP_BRAND_NAME } from '@/constants/brand';

const store = useAppStore();
const authStore = useAuthStore();
const route = useRoute();
const search = ref(false);
const { breadcrumbItems, shouldShowBreadcrumb } = useBreadcrumb();
const { shouldShowSteps } = useInventoryStatus();
const activeDropdown = ref<string | null>(null);

function toggleDropdown(name: string) {
    activeDropdown.value = activeDropdown.value === name ? null : name;
}

function closeDropdown() {
    activeDropdown.value = null;
}

function handleLogout() {
    authStore.logout();
}

const notifications = ref([
    {
        id: 1,
        profile: APP_LOGO_ASSET,
        message: '<strong class="text-sm mr-1">John Doe</strong>invite you to <strong>Prototyping</strong>',
        time: '45 min ago',
    },
    {
        id: 2,
        profile: APP_LOGO_ASSET,
        message: '<strong class="text-sm mr-1">Adam Nolan</strong>mentioned you to <strong>UX Basics</strong>',
        time: '9h Ago',
    },
    {
        id: 3,
        profile: APP_LOGO_ASSET,
        message: '<strong class="text-sm mr-1">Anna Morgan</strong>Upload a file',
        time: '9h Ago',
    },
]);

onMounted(() => {
    setActiveDropdown();
});

watch(route, () => {
    setActiveDropdown();
});

const setActiveDropdown = () => {
    const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
    if (selector) {
        selector.classList.add('active');
        const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
        for (let i = 0; i < all.length; i++) {
            all[0]?.classList.remove('active');
        }
        const ul: any = selector.closest('ul.sub-menu');
        if (ul) {
            let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
            if (ele) {
                ele = ele[0];
                setTimeout(() => {
                    ele?.classList.add('active');
                });
            }
        }
    }
};

const removeNotification = (value: number) => {
    notifications.value = notifications.value.filter((d) => d.id !== value);
};
</script>
