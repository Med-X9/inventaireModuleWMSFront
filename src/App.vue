<template>
    <div
        class="main-section antialiased relative font-nunito text-sm font-normal"
        :class="[!store.sidebar ? 'toggle-sidebar' : '', store.menu, store.layout, store.rtlClass, route.meta.layout === 'monitoring' ? 'h-screen w-screen overflow-hidden' : '']"
    >
        <component v-bind:is="mainLayout"></component>
    </div>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';

    import appLayout from '@/layouts/app-layout.vue';
    import authLayout from '@/layouts/auth-layout.vue';
    import monitoringLayout from '@/layouts/monitoring-layout.vue';

    import { useAppStore } from '@/stores/index';
    import { useMeta } from '@/composables/use-meta';
    import { useRoute } from 'vue-router';

    const store = useAppStore();
    const route = useRoute();

    // meta
    useMeta({ title: 'Inventaire' });

    const mainLayout = computed(() => {
        if (route.meta.layout === 'monitoring') {
            return monitoringLayout;
        }
        return store.mainLayout === 'auth' ? authLayout : appLayout;
    });
</script>

<style>


</style>
