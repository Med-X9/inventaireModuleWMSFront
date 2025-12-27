<template>
    <div class="flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 animate-[inventoryModalIn_0.25s_ease-out]">
        <!-- Header -->
        <div class="relative bg-gradient-to-r from-primary to-primary-dark px-5 py-4 md:px-8 md:py-5 shadow-md z-10 flex-shrink-0">
            <div
                class="absolute inset-0 opacity-10"
                style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
            ></div>
            <div class="relative z-10 flex items-center justify-between gap-8">
                <div class="flex items-start gap-6 flex-1">
                    <div
                        class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                    >
                        <IconBox class="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div class="flex-1">
                        <h1 class="text-lg md:text-2xl font-extrabold text-white m-0 mb-1 md:mb-2 tracking-tight text-shadow-sm">
                            {{ title }}
                        </h1>
                        <div v-if="inventory" class="flex flex-col gap-1.5 md:gap-2 mb-1 md:mb-2">
                            <div class="flex items-center gap-3 flex-wrap">
                                <p class="text-sm md:text-base font-semibold text-white/95 m-0">
                                    {{ inventory.label }}
                                </p>
                                <span
                                    v-if="inventory.status"
                                    class="inline-flex items-center px-3.5 py-1.5 bg-white/20 backdrop-blur-md border border-white/40 rounded-full text-[0.68rem] md:text-[0.72rem] font-semibold text-white uppercase tracking-wide"
                                >
                                    {{ inventory.status }}
                                </span>
                            </div>
                            <!-- Ligne méta: Compte + Type d'inventaire -->
                            <div class="flex items-center gap-2 flex-wrap text-[0.70rem] md:text-xs text-white/90 font-medium">
                                <span
                                    v-if="inventory.account_name"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/15 border border-white/30"
                                >
                                    <span class="uppercase tracking-wide opacity-80">Compte</span>
                                    <span class="font-semibold truncate max-w-[140px] md:max-w-[200px]">{{ inventory.account_name }}</span>
                                </span>
                                <span
                                    v-if="inventory.inventory_type"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/15 border border-white/30"
                                >
                                    <span class="uppercase tracking-wide opacity-80">Type d'inventaire</span>
                                    <span class="font-semibold">{{ inventory.inventory_type }}</span>
                                </span>
                            </div>
                        </div>
                        <div v-if="inventory" class="flex items-center gap-4 flex-wrap text-xs md:text-sm text-white/90">
                            <span
                                v-if="inventory.date"
                                class="inline-flex items-center gap-2 text-white/90 font-medium"
                            >
                                <IconCalendar class="w-4 h-4 opacity-80" />
                                {{ formatDate ? formatDate(inventory.date) : inventory.date }}
                            </span>
                            <span
                                v-if="inventory.reference"
                                class="inline-flex items-center gap-2 text-white/90 font-medium"
                            >
                                <span class="opacity-80">#</span>
                                {{ inventory.reference }}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    @click="emit('close')"
                    class="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/30 hover:scale-105 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="closeDisabled"
                >
                    <IconX class="w-5 h-5" />
                </button>
            </div>
        </div>

        <!-- Contenu principal -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 md:gap-5 p-4 md:p-6 flex-1 overflow-hidden min-h-0 max-h-[calc(100vh-150px)]">
            <!-- Colonne principale -->
            <div class="flex flex-col gap-3 min-h-0 overflow-hidden">
                <slot name="main" />
            </div>

            <!-- Colonne secondaire -->
            <div class="flex flex-col gap-3 min-h-0 overflow-hidden">
                <slot name="sidebar" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import IconBox from '@/components/icon/icon-box.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconInfoCircle from '@/components/icon/icon-info-circle.vue';
import IconX from '@/components/icon/icon-x.vue';

interface InventoryHeaderLike {
    label?: string;
    status?: string;
    date?: string | Date | null;
    reference?: string | null;
    inventory_type?: string | null;
    account_name?: string | null;
}

interface Props {
    title: string;
    inventory?: InventoryHeaderLike | null;
    closeDisabled?: boolean;
    formatDate?: (value: string | Date) => string;
}

const props = withDefaults(defineProps<Props>(), {
    inventory: null,
    closeDisabled: false,
    formatDate: undefined,
});

const emit = defineEmits<{
    close: [];
}>();
</script>

<style scoped>
@keyframes inventoryModalIn {
    from {
        opacity: 0;
        transform: translateY(8px) scale(0.99);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>

