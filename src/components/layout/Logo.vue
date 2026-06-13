<template>

    <router-link to="/" class="main-logo flex items-center shrink-0 group">

        <img

            class="h-10 w-auto max-w-[160px] flex-none object-contain transition-transform duration-300 group-hover:scale-105"

            :src="APP_LOGO_URL"

            :alt="APP_BRAND_NAME"

        />

    </router-link>

</template>



<script setup lang="ts">

import { APP_LOGO_URL, APP_BRAND_NAME } from '@/constants/brand';



withDefaults(

    defineProps<{

        showLabel?: boolean;

    }>(),

    { showLabel: true },

);

</script>

