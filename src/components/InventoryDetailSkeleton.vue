<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Header skeleton -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex flex-wrap gap-3 justify-end">
                <div v-for="i in 3" :key="`btn-${i}`" class="h-10 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-lg"></div>
            </div>
        </div>

        <!-- Informations générales skeleton -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div class="flex items-center justify-between">
                    <div class="h-6 w-48 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                    <div class="h-6 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full"></div>
                </div>
            </div>
            <div class="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div v-for="i in 8" :key="`info-${i}`" class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
                        <div class="flex-1 space-y-2">
                            <div class="h-3 w-20 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                            <div class="h-4 w-32 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Paramètres de comptage skeleton -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-primary-light/10 dark:from-primary/20 dark:to-primary-light/20">
                <div class="h-6 w-48 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
            </div>
            <div class="px-6 py-4">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div v-for="i in 3" :key="`comptage-${i}`" class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-slate-200/60 dark:border-slate-600/60">
                        <div class="h-5 w-32 mb-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                        <div class="space-y-3">
                            <div class="h-8 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="j in 3" :key="`badge-${i}-${j}`" class="h-6 w-20 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Magasins skeleton -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div class="flex items-center justify-between">
                    <div class="h-6 w-48 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                    <div class="h-4 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                </div>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="i in 3" :key="`magasin-${i}`" class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                        <div class="flex items-start gap-3">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-5 w-32 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                                <div class="h-4 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Équipes skeleton -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div class="flex items-center justify-between">
                    <div class="h-6 w-48 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                    <div class="h-4 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                </div>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="i in 3" :key="`equipe-${i}`" class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-5 w-32 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                                <div class="h-4 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ressources skeleton -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div class="flex items-center justify-between">
                    <div class="h-6 w-48 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-40 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-lg"></div>
                        <div class="h-4 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                    </div>
                </div>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="i in 3" :key="`ressource-${i}`" class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                        <div class="flex items-start gap-3">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-5 w-32 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                                <div class="h-4 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Composant skeleton loader pour InventoryDetail
 * Affiche une structure de chargement similaire à la page de détails d'inventaire
 */
</script>

<style scoped>
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}

.animate-\[shimmer_1\.5s_infinite\] {
    animation: shimmer 1.5s infinite;
}
</style>

