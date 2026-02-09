<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div class="max-w-2xl w-full text-center">
            <!-- Code d'erreur -->
            <div class="mb-8">
                <h1 class="text-9xl font-bold text-error dark:text-error-light mb-4 tracking-tight">
                    403
                </h1>
                <div class="w-24 h-1 bg-gradient-to-r from-error to-error-dark mx-auto rounded-full"></div>
            </div>

            <!-- Message principal -->
            <div class="mb-8">
                <h2 class="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Accès interdit
                </h2>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-2">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.
                </p>
                <p class="text-base text-slate-500 dark:text-slate-500">
                    Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
                </p>
            </div>

            <!-- Illustration -->
            <div class="mb-8 flex justify-center">
                <div class="w-64 h-64 bg-gradient-to-br from-error/10 to-error-dark/10 dark:from-error/20 dark:to-error-dark/20 rounded-full flex items-center justify-center">
                    <svg class="w-32 h-32 text-error dark:text-error-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    @click="$router.go(-1)"
                    class="inline-flex items-center justify-center px-6 py-3 bg-error hover:bg-error-dark text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour en arrière
                </button>
                <router-link
                    to="/"
                    class="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-error dark:hover:border-error hover:text-error dark:hover:text-error-light transition-all duration-200"
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
    title: '403 - Accès interdit',
});
</script>

