<template>
    <div class="relative flex min-h-screen items-center justify-center bg-gray-200 px-6 py-10 sm:px-16">
        <div class="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
            <div class="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20">
                <div class="mx-auto w-full max-w-[440px]">
                    <div class="mb-5">
                        <h1 class="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Sign in</h1>
                        <p class="text-base font-bold leading-normal text-white-dark">Enter your username and password to login</p>
                    </div>
                    <form class="space-y-5 dark:text-white" @submit.prevent="router.push('/')">
                        <div>
                            <label for="Username">Username</label>
                            <div class="relative text-white-dark">
                                <input id="Username" type="text" placeholder="Enter Username" class="form-input ps-10 placeholder:text-white-dark" />
                                <span class="absolute start-4 top-1/2 -translate-y-1/2">
                                    <icon-mail :fill="true" />
                                </span>
                            </div>
                        </div>
                        <div>
                            <label for="Password">Password</label>
                            <div class="relative text-white-dark">
                                <input id="Password" type="password" placeholder="Enter Password" class="form-input ps-10 placeholder:text-white-dark" />
                                <span class="absolute start-4 top-1/2 -translate-y-1/2">
                                    <icon-lock-dots :fill="true" />
                                </span>
                            </div>
                        </div>
                        <div>
                            <label class="flex cursor-pointer items-center">
                                <input type="checkbox" class="form-checkbox bg-white dark:bg-black" />
                                <span class="text-white-dark">Subscribe to weekly newsletter</span>
                            </label>
                        </div>
                        <button type="submit" class="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
                            Sign in
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import appSetting from '@/app-setting';
import { useAppStore } from '@/stores/index';
import { useRouter } from 'vue-router';
import { useMeta } from '@/composables/use-meta';

import IconMail from '@/components/icon/icon-mail.vue';
import IconLockDots from '@/components/icon/icon-lock-dots.vue';

useMeta({ title: 'Login Boxed' });
const router = useRouter();
const store = useAppStore();

// multi language
const i18n = reactive(useI18n());
const changeLanguage = (item: any) => {
    i18n.locale = item.code;
    appSetting.toggleLanguage(item);
};
const currentFlag = computed(() => {
    return `/assets/images/flags/${i18n.locale.toUpperCase()}.svg`;
});
</script>
