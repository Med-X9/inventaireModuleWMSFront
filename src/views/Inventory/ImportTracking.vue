<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Header -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-4xl font-extrabold text-slate-900 dark:text-slate-100 m-0 mb-2">
                        <IconUpload class="w-10 h-10 text-primary" />
                        Suivi d'importation du planning
                    </h1>
                    <p class="text-slate-600 dark:text-slate-400 mt-2">
                        Inventaire : <span class="font-semibold text-primary">{{ inventoryReference }}</span>
                    </p>
                </div>
                <div class="flex gap-3">
                    <button
                        @click="refreshStatus"
                        :disabled="loading"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <IconRefresh class="w-5 h-5" :class="{ 'animate-spin': loading }" />
                        <span>Actualiser</span>
                    </button>
                    <button
                        @click="goBack"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                        <IconArrowLeft class="w-5 h-5" />
                        <span>Retour</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Contenu principal -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <!-- État de chargement -->
            <div v-if="loading && !importTask" class="flex flex-col items-center justify-center py-16">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                <p class="text-slate-600 dark:text-slate-400">Chargement du statut...</p>
            </div>

            <!-- Aucune tâche d'import ou erreur -->
            <div v-else-if="!importTask && !loading" class="flex flex-col items-center justify-center py-16">
                <IconXCircle class="w-16 h-16 mb-4" :class="error ? 'text-red-400' : 'text-slate-400'" />

                <!-- Affichage avec code d'erreur -->
                <div v-if="error" class="text-center">
                    <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <span v-if="errorCode" class="text-red-600 dark:text-red-400">Erreur {{ errorCode }}</span>
                        <span v-else>Erreur</span>
                    </h3>
                    <p class="text-slate-600 dark:text-slate-400 max-w-md">
                        {{ error }}
                    </p>
                </div>

                <!-- Affichage sans erreur -->
                <div v-else class="text-center">
                    <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Aucune importation en cours
                    </h3>
                    <p class="text-slate-600 dark:text-slate-400 max-w-md">
                        Aucune tâche d'import n'a été trouvée pour cet inventaire.
                    </p>
                </div>
            </div>

            <!-- Affichage du statut d'import -->
            <div v-else-if="importTask">
                <!-- Indicateur de statut -->
                <div class="mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            Statut de l'importation
                        </h2>
                        <div class="flex items-center gap-2 px-4 py-2 rounded-full" :class="statusBadgeClass">
                            <div class="w-2 h-2 rounded-full" :class="[statusDotClass, { 'animate-pulse': isProcessing }]"></div>
                            <span class="font-semibold text-sm uppercase">{{ statusLabel }}</span>
                        </div>
                    </div>

                </div>

                <!-- Statistiques -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-slate-600 dark:text-slate-400">Total lignes</span>
                            <IconListCheck class="w-5 h-5 text-slate-500" />
                        </div>
                        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {{ formatNumber(importTask.total_rows) }}
                        </p>
                    </div>

                    <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-green-700 dark:text-green-400">Créés</span>
                            <IconCircleCheck class="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <p class="text-3xl font-bold text-green-700 dark:text-green-400 tabular-nums transition-all duration-300">
                            {{ formatNumber(animatedImportedCount) }}
                        </p>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-blue-700 dark:text-blue-400">Mis à jour</span>
                            <IconEdit class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p class="text-3xl font-bold text-blue-700 dark:text-blue-400 tabular-nums transition-all duration-300">
                            {{ formatNumber(animatedUpdatedCount) }}
                        </p>
                    </div>

                    <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-red-700 dark:text-red-400">Erreurs</span>
                            <IconXCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <p class="text-3xl font-bold text-red-700 dark:text-red-400 tabular-nums transition-all duration-300">
                            {{ formatNumber(animatedErrorCount) }}
                        </p>
                    </div>
                </div>

                <!-- Informations du fichier -->
                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-600">
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        Informations du fichier
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span class="text-sm text-slate-600 dark:text-slate-400">Nom du fichier</span>
                            <p class="text-slate-900 dark:text-slate-100 font-medium mt-1">
                                {{ importTask.file_name || 'N/A' }}
                            </p>
                        </div>
                        <div>
                            <span class="text-sm text-slate-600 dark:text-slate-400">Date de création</span>
                            <p class="text-slate-900 dark:text-slate-100 font-medium mt-1">
                                {{ importTask.created_at ? formatDate(importTask.created_at) : 'N/A' }}
                            </p>
                        </div>
                        <div>
                            <span class="text-sm text-slate-600 dark:text-slate-400">Dernière mise à jour</span>
                            <p class="text-slate-900 dark:text-slate-100 font-medium mt-1">
                                {{ importTask.updated_at ? formatDate(importTask.updated_at) : 'N/A' }}
                            </p>
                        </div>
                        <div>
                            <span class="text-sm text-slate-600 dark:text-slate-400">ID de la tâche</span>
                            <p class="text-slate-900 dark:text-slate-100 font-medium mt-1">
                                #{{ importTask.import_task_id }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Message d'erreur global -->
                <div v-if="importTask.error_message" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 mb-8">
                    <div class="flex items-start gap-3">
                        <IconXCircle class="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                                Erreur d'importation
                            </h3>
                            <p class="text-red-700 dark:text-red-300">
                                {{ importTask.error_message }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Liste des erreurs détaillées -->
                <div v-if="importTask.errors && importTask.errors.length > 0" class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div class="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-700">
                        <h3 class="text-lg font-semibold text-red-900 dark:text-red-100">
                            Erreurs détaillées ({{ importTask.errors.length }})
                        </h3>
                    </div>
                    <div class="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                        <div
                            v-for="(error, index) in importTask.errors"
                            :key="index"
                            class="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <div class="flex items-start gap-4">
                                <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold text-sm">
                                    {{ error.row_number }}
                                </span>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="px-2 py-1 rounded text-xs font-medium" :class="getErrorTypeClass(error.error_type)">
                                            {{ error.error_type }}
                                        </span>
                                        <span class="text-sm text-slate-600 dark:text-slate-400">
                                            Champ: <span class="font-semibold">{{ error.field_name }}</span>
                                        </span>
                                    </div>
                                    <p class="text-slate-900 dark:text-slate-100 mb-2">
                                        {{ error.error_message }}
                                    </p>
                                    <div class="text-sm text-slate-600 dark:text-slate-400">
                                        Valeur: <code class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-xs">{{ error.field_value }}</code>
                                    </div>
                                </div>
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
 * Vue ImportTracking - Suivi d'importation du planning
 *
 * Cette vue permet de :
 * - Visualiser le statut d'une importation en temps réel
 * - Suivre la progression avec barre de progression
 * - Consulter les statistiques (créés, mis à jour, erreurs)
 * - Voir les erreurs détaillées par ligne
 * - Actualiser manuellement le statut
 *
 * @component ImportTracking
 */

// ===== IMPORTS VUE =====
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS COMPOSABLES =====
import { useImportTracking } from '@/composables/useImportTracking'

// ===== IMPORTS ICÔNES =====
import IconUpload from '@/components/icon/icon-upload.vue'
import IconRefresh from '@/components/icon/icon-refresh.vue'
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'
import IconListCheck from '@/components/icon/icon-list-check.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'
import IconEdit from '@/components/icon/icon-edit.vue'

// ===== ROUTE =====
const route = useRoute()
const router = useRouter()
const inventoryReference = route.params.reference as string

// ===== COMPOSABLE =====
/**
 * Initialisation du composable useImportTracking
 * Toute la logique est gérée dans le composable
 */
const {
    // État
    loading,
    importTask,
    error,
    errorCode,

    // Valeurs animées
    animatedImportedCount,
    animatedUpdatedCount,
    animatedErrorCount,

    // Computed
    isProcessing,
    statusLabel,
    statusBadgeClass,
    statusDotClass,
    estimatedTimeRemaining,

    // Méthodes
    refreshStatus,
    formatNumber,
    formatDate,
    getErrorTypeClass
} = useImportTracking(inventoryReference)

// ===== NAVIGATION =====

/**
 * Retour à la page précédente
 */
const goBack = () => {
    router.back()
}
</script>

<style scoped>
/* Animation de pulsation pour le point de statut */
@keyframes ping {
    75%, 100% {
        transform: scale(2);
        opacity: 0;
    }
}

.animate-ping {
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
