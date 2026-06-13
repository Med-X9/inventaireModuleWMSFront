<template>
    <div class="login-page flex min-h-screen w-full bg-app text-text dark:bg-bg-dark dark:text-slate-100">
        <!-- Panneau marque (desktop) -->
        <aside
            class="login-brand relative hidden overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 lg:flex lg:w-[46%] xl:w-[52%] flex-col justify-between p-10 xl:p-14"
            aria-hidden="false"
        >
            <div class="login-brand__glow pointer-events-none absolute inset-0" />
            <div class="login-brand__grid pointer-events-none absolute inset-0 opacity-[0.07]" />

            <div class="relative z-10">
                <img :src="APP_LOGO_URL" :alt="APP_BRAND_NAME" class="h-12 w-auto max-w-[200px] object-contain" />
            </div>

            <div class="relative z-10 max-w-md">
                <p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Plateforme WMS
                </p>
                <h1 class="text-3xl font-bold leading-tight text-white xl:text-4xl">
                    Pilotez vos inventaires en toute confiance
                </h1>
                <p class="mt-4 text-base leading-relaxed text-white/80">
                    Centralisez la gestion, le suivi des jobs et les résultats de comptage pour vos entrepôts.
                </p>

                <ul class="mt-10 space-y-4" role="list">
                    <li v-for="item in highlights" :key="item" class="flex items-start gap-3 text-sm text-white/90">
                        <span
                            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
                        >
                            <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                <path
                                    d="M2.5 6l2.5 2.5 4.5-5"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </span>
                        {{ item }}
                    </li>
                </ul>
            </div>

            <p class="relative z-10 text-xs text-white/50">
                © {{ currentYear }} — Module inventaire WMS
            </p>
        </aside>

        <!-- Panneau formulaire -->
        <main class="relative flex flex-1 flex-col">
            <div class="absolute end-4 top-4 z-20 sm:end-6 sm:top-6">
                <button
                    type="button"
                    class="login-theme-toggle flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/90 text-text-light shadow-sm backdrop-blur-sm transition hover:border-accent-500/40 hover:text-accent-500 dark:border-navy-700 dark:bg-navy-800/90 dark:text-slate-300 dark:hover:border-accent-500/50 dark:hover:text-accent-300"
                    :aria-label="isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'"
                    @click="cycleTheme"
                >
                    <MdiIcon v-if="isDarkMode" name="mdi-white-balance-sunny" size="sm" />
                    <MdiIcon v-else name="mdi-weather-night" size="sm" />
                </button>
            </div>

            <div class="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
                <div class="w-full max-w-[420px]">
                    <!-- En-tête mobile -->
                    <div class="mb-8 text-center lg:hidden">
                        <img :src="APP_LOGO_URL" :alt="APP_BRAND_NAME" class="mx-auto mb-5 h-14 w-auto max-w-[220px] object-contain" />
                        <h2 class="text-2xl font-bold text-text dark:text-white">Connexion</h2>
                        <p class="mt-1 text-sm text-text-light dark:text-slate-400">
                            Accédez à votre espace inventaire
                        </p>
                    </div>

                    <div
                        class="login-card rounded-2xl border border-border bg-card p-6 shadow-xl shadow-navy-100/60 dark:border-navy-700 dark:bg-navy-800/90 dark:shadow-none sm:p-8"
                    >
                        <div class="mb-8 hidden lg:block">
                            <h2 class="text-2xl font-bold tracking-tight text-text dark:text-white">
                                Connexion
                            </h2>
                            <p class="mt-1.5 text-sm text-text-light dark:text-slate-400">
                                Identifiez-vous pour accéder au module inventaire
                            </p>
                        </div>

                        <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
                            <div>
                                <label
                                    for="username"
                                    class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Nom d'utilisateur
                                </label>
                                <div class="relative">
                                    <input
                                        id="username"
                                        v-model="form.username"
                                        type="text"
                                        autocomplete="username"
                                        placeholder="ex. prenom.nom"
                                        class="login-input form-input w-full rounded-xl border-slate-200 bg-slate-50/80 ps-11 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
                                        :class="{ 'border-error focus:border-error focus:ring-error/20': errors.username }"
                                        :aria-invalid="!!errors.username"
                                        :aria-describedby="errors.username ? 'username-error' : undefined"
                                        @blur="validateField('username')"
                                    />
                                    <span
                                        class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                                        aria-hidden="true"
                                    >
                                        <MdiIcon name="mdi-account-outline" size="sm" />
                                    </span>
                                </div>
                                <p v-if="errors.username" id="username-error" class="mt-1.5 text-sm text-error" role="alert">
                                    {{ errors.username }}
                                </p>
                            </div>

                            <div>
                                <label
                                    for="password"
                                    class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Mot de passe
                                </label>
                                <div class="relative">
                                    <input
                                        id="password"
                                        v-model="form.password"
                                        :type="showPassword ? 'text' : 'password'"
                                        autocomplete="current-password"
                                        placeholder="••••••••"
                                        class="login-input form-input w-full rounded-xl border-slate-200 bg-slate-50/80 ps-11 pe-11 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
                                        :class="{ 'border-error focus:border-error focus:ring-error/20': errors.password }"
                                        :aria-invalid="!!errors.password"
                                        :aria-describedby="errors.password ? 'password-error' : undefined"
                                        @blur="validateField('password')"
                                    />
                                    <span
                                        class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                                        aria-hidden="true"
                                    >
                                        <MdiIcon name="mdi-lock-outline" size="sm" />
                                    </span>
                                    <button
                                        type="button"
                                        class="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                        :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                                        tabindex="-1"
                                        @click="showPassword = !showPassword"
                                    >
                                        <MdiIcon name="mdi-eye-outline" size="sm" />
                                    </button>
                                </div>
                                <p v-if="errors.password" id="password-error" class="mt-1.5 text-sm text-error" role="alert">
                                    {{ errors.password }}
                                </p>
                            </div>

                            <div class="flex items-center justify-between gap-4 pt-1">
                                <label class="flex cursor-pointer items-center gap-2.5 select-none">
                                    <input
                                        id="remember"
                                        v-model="form.remember"
                                        type="checkbox"
                                        class="form-checkbox h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30 dark:border-slate-600"
                                    />
                                    <span class="text-sm text-slate-600 dark:text-slate-400">Se souvenir de moi</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                :disabled="isSubmitting"
                                class="btn btn-primary login-submit relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide shadow-lg shadow-primary/25 transition hover:shadow-primary/35 disabled:pointer-events-none disabled:opacity-60"
                            >
                                <span
                                    v-if="isSubmitting"
                                    class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                    aria-hidden="true"
                                />
                                {{ isSubmitting ? 'Connexion en cours…' : 'Se connecter' }}
                            </button>
                        </form>
                    </div>

                    <p class="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        Accès réservé au personnel autorisé. En cas de problème, contactez votre administrateur.
                    </p>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MdiIcon from '@/components/MdiIcon.vue'
import { useAuth } from '@/composables/useAuth'
import { useMeta } from '@/composables/use-meta'
import { useAppStore } from '@/stores/index'
import { APP_LOGO_URL, APP_BRAND_NAME } from '@/constants/brand'

const router = useRouter()
const appStore = useAppStore()
const { form, errors, isSubmitting, validateField, handleLogin } = useAuth()

const showPassword = ref(false)
const currentYear = new Date().getFullYear()

const highlights = [
    'Gestion et suivi des inventaires multi-sites',
    'Affectation des équipes et jobs en temps réel',
    'Tableaux de bord et résultats de comptage',
]

const isDarkMode = computed(() => appStore.isDarkMode)

useMeta({ title: 'Connexion — Inventaire WMS' })

function cycleTheme() {
    const next = appStore.theme === 'light' ? 'dark' : 'light'
    appStore.toggleTheme(next)
}

async function handleSubmit() {
    const success = await handleLogin()
    if (success) {
        await router.push('/')
    }
}
</script>

<style scoped>
.login-brand__glow {
    background:
        radial-gradient(ellipse 80% 60% at 20% 20%, rgba(255, 255, 255, 0.18), transparent),
        radial-gradient(ellipse 50% 40% at 80% 80%, rgba(99, 102, 241, 0.4), transparent);
}

.login-brand__grid {
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 48px 48px;
}

.login-card {
    animation: login-fade-in 0.45s ease-out;
}

@keyframes login-fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-input:focus {
    outline: none;
}

@media (prefers-reduced-motion: reduce) {
    .login-card {
        animation: none;
    }
}
</style>
