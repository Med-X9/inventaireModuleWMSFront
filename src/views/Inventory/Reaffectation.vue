<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
        <!-- Header -->
        <Card class="mb-6 md:mb-8 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
                            <IconEdit class="w-6 h-6" />
                        </div>
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 m-0 tracking-tight">
                                Réaffectation
                            </h1>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Modifier l'affectation des équipes sur les jobs
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex shrink-0">
                    <ButtonGroup :buttons="adaptedNavigationButtons" justify="end" />
                </div>
            </div>
        </Card>

        <!-- DataTable -->
        <Card class="overflow-hidden rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                <div class="flex items-center gap-2">
                    <h3 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 m-0">Liste des jobs</h3>
                    <span v-if="jobPaginationMetadata?.total != null" class="text-sm text-slate-500 dark:text-slate-400">
                        ({{ jobPaginationMetadata.total }} au total)
                    </span>
                </div>
                <div class="relative inline-block" ref="statusLegendTooltip">
                    <Button
                        @mouseenter="showStatusTooltip"
                        @mouseleave="hideStatusTooltip"
                        variant="ghost"
                        size="sm"
                        class="w-6 h-6 rounded-full p-0 cursor-help"
                        type="button"
                        aria-label="Signification des statuts">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </Button>
                    <Teleport to="body">
                        <div
                            v-if="showStatusLegend"
                            ref="tooltipElement"
                            :style="tooltipStyle"
                            class="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 pointer-events-none max-w-sm"
                            style="min-width: 280px;">
                            <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Signification des statuts</h4>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <Badge variant="primary" size="sm" class="bg-slate-200 text-slate-900">EN ATTENTE</Badge>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job en attente de validation</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Badge variant="primary" size="sm" class="bg-slate-700 text-white">VALIDE</Badge>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job validé</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Badge variant="success" size="sm">AFFECTE</Badge>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job affecté à une équipe</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Badge variant="warning" size="sm" class="bg-purple-500 text-white">PRET</Badge>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job prêt pour le comptage</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Badge variant="warning" size="sm" class="bg-amber-500 text-white">TRANSFERT</Badge>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job en transfert</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Badge variant="info" size="sm">ENTAME</Badge>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Comptage entamé</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Badge variant="success" size="sm" class="bg-green-600 text-white">TERMINE</Badge>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Comptage terminé</span>
                                </div>
                            </div>
                            <div class="absolute w-2 h-2 bg-white dark:bg-slate-800 border-l border-b border-slate-200 dark:border-slate-700 transform rotate-45 -bottom-1 right-4"></div>
                        </div>
                    </Teleport>
                </div>
            </div>

            <!-- DataTable des jobs avec actions (Valider, Réaffecter) -->
            <!-- Monté uniquement quand le total serveur est connu pour afficher "1-50 sur 75" -->
            <DataTable
                v-if="hasServerTotal"
                :key="`${jobsKey}-total-${jobsTableTotalItems}`"
                :columns="adaptedStoreJobsColumns"
                :rowDataProp="jobs"
                :actions="jobsActions"
                v-bind="jobsDataTableConfig"
                :enableVirtualScrolling="undefined"
                :currentPageProp="jobPaginationMetadata?.page"
                :totalPagesProp="jobPaginationMetadata?.totalPages"
                :totalItemsProp="jobsTableTotalItems"
                :pageSizeProp="jobPaginationMetadata?.pageSize"
                :loading="jobsLoading"
                :customDataTableParams="jobsCustomParams"
                @query-model-changed="(queryModel) => onJobsTableEvent('query-model-changed', queryModel)"
                ref="jobsTableRef"
                @selection-changed="onJobSelectionChanged"
                @row-clicked="onRowClicked"
            />
            <div v-else-if="jobsLoading" class="p-8 text-center text-slate-500 dark:text-slate-400">
                Chargement de la liste...
            </div>
            <div v-else class="p-8 text-center text-slate-500 dark:text-slate-400">
                Sélectionnez un inventaire et un magasin pour afficher les jobs.
            </div>

        </Card>

        <!-- Modals -->
        <Dialog v-model="showTeamModal" :title="modalTitle" size="md">
            <div class="py-2">
                <FormBuilder
                    v-model="teamForm"
                    :fields="teamFields"
                    @submit="handleTeamSubmit"
                    submitLabel="Affecter" />
            </div>
        </Dialog>


        <JobAffectationDialog
            :key="modalKey"
            v-model="showJobAffectationModal"
            :selected-job="selectedJobForModal"
            :team-options="modalTeamOptions"
            :team-options-by-counting-order="modalTeamOptionsByCountingOrder"
            :inventory-id="inventoryId"
            :reaffectation-mode="true"
            :saving-assignment="assignmentSavingInModal"
            @team-changed="handleJobAffectationModalTeamChanged"
            @finish="handleJobAffectationModalFinish"
        />

        <Dialog v-model="showTransferModal" :title="`Transférer ${eligibleJobsForTransfer.length} job(s)`" :size="'xl'">
            <div class="flex flex-col py-2" style="height: 70vh; max-height: 70vh;">
                <div class="flex-shrink-0 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-300">
                            Jobs éligibles au transfert
                        </h3>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                                {{ eligibleJobsForTransfer.length }} éligible(s)
                            </span>
                            <span
                                v-if="selectedJobs.length - eligibleJobsForTransfer.length > 0"
                                class="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-medium rounded-full">
                                {{ selectedJobs.length - eligibleJobsForTransfer.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <Alert
                        v-if="selectedJobs.length - eligibleJobsForTransfer.length > 0"
                        type="warning"
                        size="sm"
                        class="mt-3">
                        <p class="text-sm font-medium">
                            {{ selectedJobs.length - eligibleJobsForTransfer.length }} job(s) ne sont pas éligibles au transfert
                        </p>
                        <p class="text-xs mt-1">
                            Seuls les jobs en statut TRANSFERT, PRET ou ENTAME peuvent être transférés.
                        </p>
                    </Alert>
                </div>

                <div class="flex-1 min-h-0 mb-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50/50 dark:bg-slate-800/50">
                    <div class="h-full overflow-y-auto custom-scrollbar p-2">
                        <div class="divide-y divide-slate-200 dark:divide-slate-700">
                            <div
                                v-for="job in eligibleJobsForTransfer"
                                :key="job.id"
                                class="px-4 py-3 hover:bg-white dark:hover:bg-slate-700/50 transition-colors rounded-lg">
                                <div class="flex items-center justify-between gap-4">
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-slate-900 dark:text-white truncate">{{ job.job }}</div>
                                        <div class="flex items-center gap-3 mt-1">
                                            <span class="text-xs text-slate-500 dark:text-slate-400">
                                                {{ job.locations?.length || 0 }} emplacement(s)
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                            :class="{
                                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': job.status === 'AFFECTE',
                                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': job.status === 'VALIDE',
                                                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400': job.status === 'PRET',
                                                'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400': job.status === 'TRANSFERT'
                                            }">
                                            {{ job.status }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider class="my-4" />

                <div class="flex-shrink-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4">
                    <FormBuilder
                        v-model="transferForm"
                        :fields="transferFields"
                        @submit="handleTransferSubmit"
                        submitLabel="Sauvegarder"
                        :columns="1" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model="showManualModal" :title="`Lancer manuellement ${eligibleJobsForManual.length} job(s)`" :size="'xl'">
            <div class="flex flex-col py-2" style="height: 70vh; max-height: 70vh;">
                <div class="flex-shrink-0 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-300">
                            Jobs éligibles pour le lancement manuel
                        </h3>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                                {{ eligibleJobsForManual.length }} éligible(s)
                            </span>
                            <span
                                v-if="selectedJobs.length - eligibleJobsForManual.length > 0"
                                class="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-medium rounded-full">
                                {{ selectedJobs.length - eligibleJobsForManual.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <Alert
                        v-if="selectedJobs.length - eligibleJobsForManual.length > 0"
                        type="warning"
                        size="sm"
                        class="mt-3">
                        <p class="text-sm font-medium">
                            {{ selectedJobs.length - eligibleJobsForManual.length }} job(s) ne sont pas éligibles pour le lancement manuel
                        </p>
                        <p class="text-xs mt-1">
                            Seuls les jobs en statut PRET, TRANSFERT ou ENTAME peuvent être lancés manuellement.
                        </p>
                    </Alert>
                </div>

                <div class="flex-1 min-h-0 mb-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50/50 dark:bg-slate-800/50">
                    <div class="h-full overflow-y-auto custom-scrollbar p-2">
                        <div class="divide-y divide-slate-200 dark:divide-slate-700">
                            <div
                                v-for="job in eligibleJobsForManual"
                                :key="job.id"
                                class="px-4 py-3 hover:bg-white dark:hover:bg-slate-700/50 transition-colors rounded-lg">
                                <div class="flex items-center justify-between gap-4">
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-slate-900 dark:text-white truncate">{{ job.job }}</div>
                                        <div class="flex items-center gap-3 mt-1">
                                            <span class="text-xs text-slate-500 dark:text-slate-400">
                                                {{ job.locations?.length || 0 }} emplacement(s)
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                            :class="{
                                                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400': job.status === 'PRET',
                                                'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400': job.status === 'TRANSFERT',
                                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': job.status === 'ENTAME'
                                            }">
                                            {{ job.status }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider class="my-4" />

                <div class="flex-shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4">
                    <FormBuilder
                        v-model="manualForm"
                        :fields="manualFields"
                        @submit="handleManualSubmit"
                        submitLabel="Lancer"
                        :columns="1" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue Réaffectation - Réaffectation des jobs
 *
 * Même tableau et mêmes actions store que Affecter, avec en plus l'action "Réaffecter"
 * dans le menu d'actions de chaque ligne.
 * Les paramètres (reference, warehouse) sont lus depuis la route par le composable.
 *
 * @component Reaffectation
 */

import { ref, computed, nextTick, Teleport, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Dialog, Button, Badge, Card, DataTable, Divider, Alert } from '@SMATCH-Digital-dev/vue-system-design'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import JobAffectationDialog from '@/components/JobAffectationDialog.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'
import { useReaffectation } from '@/composables/useReaffectation'
import { useJobStore } from '@/stores/job'
import IconEdit from '@/components/icon/icon-edit.vue'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'

// Sans options : le composable lit reference et warehouse depuis la route courante
const affecter = useReaffectation()

// Total serveur lu directement du store pour le DataTable (évite "1-50 sur 50" au lieu de "1-50 sur 75")
const jobStore = useJobStore()
const { paginationMetadata: jobStorePagination } = storeToRefs(jobStore)
const jobsTableTotalItems = ref(0)
watch(
    () => jobStorePagination.value?.total,
    (total) => {
        const n = total != null && typeof total === 'number' && !Number.isNaN(total) ? total : 0
        jobsTableTotalItems.value = n
    },
    { immediate: true, flush: 'sync' }
)

const showStatusLegend = ref(false)
const statusLegendTooltip = ref<HTMLElement | null>(null)
const tooltipElement = ref<HTMLElement | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
let tooltipTimeoutId: number | null = null

const { showJobAffectationModal, selectedJobForModal, modalTeamOptions, modalTeamOptionsByCountingOrder, assignmentSavingInModal } = affecter
const modalKey = ref(0)

watch(() => modalTeamOptionsByCountingOrder, (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
        modalKey.value++
    }
}, { immediate: true })

const showStatusTooltip = async () => {
    if (tooltipTimeoutId) clearTimeout(tooltipTimeoutId)
    tooltipTimeoutId = window.setTimeout(async () => {
        showStatusLegend.value = true
        await nextTick()
        positionStatusTooltip()
    }, 300)
}

const hideStatusTooltip = () => {
    if (tooltipTimeoutId) {
        clearTimeout(tooltipTimeoutId)
        tooltipTimeoutId = null
    }
    showStatusLegend.value = false
}

const positionStatusTooltip = () => {
    if (!statusLegendTooltip.value || !tooltipElement.value) return
    const containerRect = statusLegendTooltip.value.getBoundingClientRect()
    const tooltipRect = tooltipElement.value.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    let top = containerRect.bottom + 8
    let left = containerRect.right - tooltipRect.width
    if (left < 8) left = 8
    if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8
    }
    if (top + tooltipRect.height > viewportHeight - 8) {
        top = containerRect.top - tooltipRect.height - 8
    }
    tooltipStyle.value = { top: `${top}px`, left: `${left}px` }
}

const { handleJobAffectationModalTeamChanged, handleJobAffectationModalFinish } = affecter

const {
    jobs,
    selectedJobs,
    selectedJobsCount,
    hasSelectedJobs,
    pendingChanges,
    hasUnsavedChanges,
    jobsTableRef,
    jobsKey,
    jobsLoading,
    showDropdown,
    showTeamModal,
    showResourceModal,
    showTransferModal,
    showManualModal,
    modalTitle,
    teamForm,
    teamFields,
    resourceForm,
    resourceFields,
    transferForm,
    transferFields,
    manualForm,
    manualFields,
    dropdownItems,
    onJobSelectionChanged,
    onRowClicked,
    handleResourceSubmit,
    handleTeamSubmit,
    handleTransferSubmit,
    handleManualSubmit,
    jobPaginationMetadata,
    onJobsTableEvent,
    jobsCustomParams,
    inventoryId,
    eligibleJobsForTransfer,
    eligibleJobsForManual,
    actionButtons,
    navigationButtons,
    adaptedStoreJobsColumns,
    jobsActions,
    jobsDataTableConfig,
} = affecter

const adaptedNavigationButtons = computed<ButtonGroupButton[]>(() => {
    return navigationButtons.value.map(button => ({
        id: button.id,
        label: button.label,
        icon: button.icon,
        onClick: button.onClick,
        variant: button.variant,
        type: button.type || 'button',
        disabled: button.disabled,
        visible: button.visible,
        class: button.class
    }))
})

const adaptedActionButtons = computed<ButtonGroupButton[]>(() => {
    return actionButtons.value.map(button => ({
        id: button.id,
        label: button.label,
        icon: button.icon,
        onClick: button.onClick,
        variant: button.variant,
        type: button.type || 'button',
        disabled: button.disabled,
        visible: button.visible,
        class: button.class
    }))
})

/** Total serveur pour la pagination du DataTable (évite d'afficher "1-50 sur 50" au lieu de "1-50 sur 75") */
// jobsTableTotalItems est une ref synchronisée avec le store ci-dessus ; on l'utilise pour la clé et le v-if
const hasServerTotal = computed(() => jobStorePagination.value?.total != null)
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
    background: #1e293b;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #475569;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>
