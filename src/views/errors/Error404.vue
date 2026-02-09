<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div class="max-w-2xl w-full text-center">
            <!-- Code d'erreur -->
            <div class="mb-8">
                <h1 class="text-9xl font-bold text-primary dark:text-primary-light mb-4 tracking-tight">
                    404
                </h1>
                <div class="w-24 h-1 bg-gradient-to-r from-primary to-primary-light mx-auto rounded-full"></div>
            </div>

            <!-- Message principal -->
            <div class="mb-8">
                <h2 class="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Page introuvable
                </h2>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-2">
                    La page que vous recherchez n'existe pas ou a été déplacée.
                </p>
                <p class="text-base text-slate-500 dark:text-slate-500">
                    Vérifiez l'URL ou retournez à la page d'accueil.
                </p>
            </div>

            <!-- Illustration -->
            <div class="mb-8 flex justify-center">
                <div class="w-64 h-64 bg-gradient-to-br from-primary/10 to-primary-light/10 dark:from-primary/20 dark:to-primary-light/20 rounded-full flex items-center justify-center">
                    <svg class="w-32 h-32 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    @click="$router.go(-1)"
                    class="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:text-primary dark:hover:text-primary-light transition-all duration-200"
                >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour en arrière
                </button>
                <router-link
                    to="/"
                    class="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Retour à l'accueil
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useMeta } from '@/composables/use-meta';
import { useRouter } from 'vue-router';

const router = useRouter();

useMeta({
    title: '404 - Page introuvable',
});
</script>

