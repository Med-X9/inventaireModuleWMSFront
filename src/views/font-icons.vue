<template>
    <div class="space-y-8">
        <div class="panel flex items-center overflow-x-auto whitespace-nowrap p-3 text-primary">
            <div class="rounded-full bg-primary p-1.5 text-white ring-2 ring-primary/30 ltr:mr-3 rtl:ml-3">
                <MdiIcon name="mdi-information-outline" size="sm" />
            </div>
            <span class="ltr:mr-3 rtl:ml-3">Documentation :</span>
            <a
                href="https://pictogrammers.com/library/mdi/"
                target="_blank"
                rel="noopener noreferrer"
                class="block hover:underline"
            >Material Design Icons (Pictogrammers)</a>
        </div>

        <div class="panel">
            <h5 class="font-semibold text-lg dark:text-white-light mb-2">Material Design Icons</h5>
            <p class="text-white-dark mb-5">
                Icônes fournies par le system design SMATCH via <code>@mdi/font</code>.
                Utilisez <code>&lt;MdiIcon name="mdi-*" /&gt;</code> ou les classes <code>mdi mdi-*</code>.
            </p>
            <div class="flex flex-wrap gap-3">
                <div
                    v-for="name in mdiIcons"
                    :key="name"
                    class="grid place-content-center w-28 h-24 border border-white-dark/20 dark:border-[#191e3a] rounded-md p-2 text-center"
                    :title="name"
                >
                    <MdiIcon :name="name" size="md" class="mx-auto" />
                    <span class="text-[10px] mt-2 truncate w-full text-white-dark">{{ name.replace('mdi-', '') }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import MdiIcon from '@/components/MdiIcon.vue'

/** Icônes MDI utilisées dans l'application */
const mdiIcons = [
    'mdi-view-dashboard-outline',
    'mdi-clipboard-list-outline',
    'mdi-package-variant',
    'mdi-calendar-outline',
    'mdi-account-outline',
    'mdi-account-group-outline',
    'mdi-eye-outline',
    'mdi-pencil-outline',
    'mdi-delete-outline',
    'mdi-plus',
    'mdi-check',
    'mdi-close',
    'mdi-close-circle-outline',
    'mdi-check-circle-outline',
    'mdi-upload-outline',
    'mdi-download-outline',
    'mdi-file-outline',
    'mdi-folder-outline',
    'mdi-refresh',
    'mdi-loading',
    'mdi-menu',
    'mdi-chevron-down',
    'mdi-chevron-right',
    'mdi-arrow-left',
    'mdi-bell-outline',
    'mdi-information-outline',
    'mdi-lock-outline',
    'mdi-logout',
    'mdi-white-balance-sunny',
    'mdi-weather-night',
    'mdi-laptop',
    'mdi-cog-outline',
    'mdi-chart-bar',
    'mdi-play-outline',
    'mdi-clock-outline',
    'mdi-printer-outline',
    'mdi-magnify',
    'mdi-content-copy',
    'mdi-content-save-outline',
    'mdi-format-list-checks',
    'mdi-view-grid-outline',
    'mdi-map-marker-outline',
    'mdi-email-outline',
]
</script>
