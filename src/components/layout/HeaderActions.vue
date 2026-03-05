<template>
    <div class="flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
        <!-- Notifications -->
        <div class="dropdown shrink-0">
            <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-end' : 'bottom-start'" offsetDistance="8">
                <button type="button"
                    class="relative block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                    <icon-bell-bing />

                    <span class="flex absolute w-3 h-3 ltr:right-0 rtl:left-0 top-0">
                        <span
                            class="animate-ping absolute ltr:-left-[3px] rtl:-right-[3px] -top-[3px] inline-flex h-full w-full rounded-full bg-success/50 opacity-75"></span>
                        <span class="relative inline-flex rounded-full w-[6px] h-[6px] bg-success"></span>
                    </span>
                </button>
                <template #content="{ close }">
                    <ul class="!py-0 text-dark dark:text-white-dark w-[300px] sm:w-[350px] divide-y dark:divide-white/10">
                        <li>
                            <div class="flex items-center px-4 py-2 justify-between font-semibold">
                                <h4 class="text-lg">Notification</h4>
                                <template v-if="notifications.length">
                                    <span class="badge bg-primary/80" v-text="notifications.length + 'New'"></span>
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
                                            <h6 v-html="notification.message"></h6>
                                            <span class="text-xs block font-normal dark:text-gray-500"
                                                v-text="notification.time"></span>
                                        </div>
                                        <button type="button"
                                            class="ltr:ml-auto rtl:mr-auto text-neutral-300 hover:text-danger opacity-0 group-hover:opacity-100"
                                            @click="removeNotification(notification.id)">
                                            <icon-x-circle />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        </template>
                        <template v-if="notifications.length">
                            <li>
                                <div class="p-4">
                                    <button class="btn btn-primary block w-full btn-small" @click="close()">Read All
                                        Notifications</button>
                                </div>
                            </li>
                        </template>
                        <template v-if="!notifications.length">
                            <li>
                                <div class="!grid place-content-center hover:!bg-transparent text-lg min-h-[200px]">
                                    <div class="mx-auto ring-4 ring-primary/30 rounded-full mb-4 text-primary">
                                        <icon-info-circle :fill="true" class="w-10 h-10" />
                                    </div>
                                    No data available.
                                </div>
                            </li>
                        </template>
                    </ul>
                </template>
            </Popper>
        </div>

        <!-- Profil utilisateur -->
        <div class="dropdown shrink-0">
            <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-end' : 'bottom-start'" offsetDistance="8"
                class="!block">
                <button type="button" class="relative group block">
                    <img class="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100"
                        src="/assets/images/user-profile.jpeg" alt="" />
                </button>
                <template #content="{ close }">
                    <ul class="text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90">
                        <li>
                            <div class="flex items-center px-4 py-4">
                                <div class="flex-none">
                                    <img class="rounded-md w-10 h-10 object-cover"
                                        src="/assets/images/user-profile.jpeg" alt="" />
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
                                <icon-user class="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                                Profile
                            </router-link>
                        </li>
                        <li>
                            <router-link to="" class="dark:hover:text-white" @click="close()">
                                <icon-lock-dots class="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                                Lock Screen
                            </router-link>
                        </li>
                        <li class="border-t border-white-light dark:border-white-light/10">
                            <a href="javascript:;" class="text-danger !py-3" @click="handleLogout">
                                <icon-logout class="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 rotate-90 shrink-0" />
                                Sign Out
                            </a>
                        </li>
                    </ul>
                </template>
            </Popper>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/stores/index';
import { useAuthStore } from '@/stores/auth';
import Popper from 'vue3-popper';
import IconBellBing from '@/components/icon/icon-bell-bing.vue';
import IconXCircle from '@/components/icon/icon-x-circle.vue';
import IconInfoCircle from '@/components/icon/icon-info-circle.vue';
import IconUser from '@/components/icon/icon-user.vue';
import IconLockDots from '@/components/icon/icon-lock-dots.vue';
import IconLogout from '@/components/icon/icon-logout.vue';

const store = useAppStore();
const authStore = useAuthStore();

const notifications = ref([
    {
        id: 1,
        profile: 'user-profile.jpeg',
        message: '<strong class="text-sm mr-1">John Doe</strong>invite you to <strong>Prototyping</strong>',
        time: '45 min ago',
    },
    {
        id: 2,
        profile: 'profile-34.jpeg',
        message: '<strong class="text-sm mr-1">Adam Nolan</strong>mentioned you to <strong>UX Basics</strong>',
        time: '9h Ago',
    },
    {
        id: 3,
        profile: 'profile-16.jpeg',
        message: '<strong class="text-sm mr-1">Anna Morgan</strong>Upload a file',
        time: '9h Ago',
    },
]);

function handleLogout() {
    authStore.logout();
}

function removeNotification(value: number) {
    notifications.value = notifications.value.filter((d) => d.id !== value);
}
</script>

