<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Header et Barre d'actions fusionnées -->
        <Card class="mb-8 p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700">
            <!-- Section Header -->
            <div class="flex justify-between items-center gap-8 mb-6">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-4xl font-extrabold text-slate-900 dark:text-slate-100 m-0 mb-2">
                        <IconCalendar class="w-10 h-10 text-primary" />
                        Gestion des Affectations
                    </h1>
                </div>
                <div class="flex justify-end">
                    <ButtonGroup :buttons="adaptedNavigationButtons" justify="end" />
                </div>
            </div>

            <!-- Séparateur -->
            <Divider class="my-6" />

            <!-- Section Barre d'actions -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <!-- Informations de sélection et statut -->
                <div class="flex items-center gap-4 flex-wrap">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {{ selectedJobsCount }} job{{ selectedJobsCount > 1 ? 's' : '' }} sélectionné{{ selectedJobsCount > 1 ? 's' : '' }}
                        </span>
                    </div>
                    <div v-if="hasUnsavedChanges" class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                        <span class="text-sm text-warning-700 dark:text-warning-300 font-medium">
                            {{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) }} modification{{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) > 1 ? 's' : '' }} en attente
                        </span>
                    </div>
                    <div v-else class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span class="text-sm text-green-700 dark:text-green-300 font-medium">
                            À jour
                        </span>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <!-- Dropdown pour les affectations - Utilisation du système de design -->
                    <Dropdown
                        v-model="showDropdown"
                        placement="bottom-end"
                        trigger="click"
                        :offset="8"
                        aria-label="Menu d'affectation">
                        <template #trigger>
                            <Button
                                variant="primary"
                                size="md"
                                class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.025m13.5-8.5a2.121 2.121 0 00-3-3L7 9l2.025 2.025M13.5 21V9l-6-6" />
                            </svg>
                            <span>Affecter</span>
                            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            </Button>
                        </template>
                        <template #menu>
                            <div class="w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                <div v-for="(item, idx) in dropdownItems" :key="item.label">
                                    <DropdownItem
                                        @click="item.action(); showDropdown = false"
                                        class="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                        <span class="w-6 h-6 flex items-center justify-center rounded-lg" :class="{
                                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': item.icon === 'premier',
                                            'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400': item.icon === 'deuxieme',
                                            'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': item.icon === 'ressources'
                                        }">
                                            <svg v-if="item.icon === 'premier'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <svg v-else-if="item.icon === 'deuxieme'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <svg v-else-if="item.icon === 'ressources'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6H3v6zm0 0l9-9a2.828 2.828 0 114 4l-9 9H3v-4.586z" />
                                            </svg>
                                        </span>
                                        <span class="font-medium text-slate-900 dark:text-white">{{ item.label }}</span>
                                    </DropdownItem>
                                    <div v-if="idx < dropdownItems.length - 1" class="border-b border-slate-100 dark:border-slate-700 mx-4 my-1"></div>
                                </div>
                    </div>
                        </template>
                    </Dropdown>

                    <!-- ButtonGroup pour les autres boutons -->
                    <ButtonGroup :buttons="adaptedActionButtons" justify="end" />
                </div>
            </div>
        </Card>

        <!-- DataTable -->
        <Card class="overflow-hidden">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 m-0">Liste des jobs</h3>
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

            <!-- DataTable des jobs - config harmonisée avec InventoryResults.vue -->
            <DataTable
                :key="jobsKey"
                :columns="adaptedStoreJobsColumns"
                :rowDataProp="jobs"
                :actions="[]"
                :enableVirtualScrolling="undefined"
                :currentPageProp="jobPaginationMetadata?.page"
                :totalPagesProp="jobPaginationMetadata?.totalPages"
                :totalItemsProp="jobPaginationMetadata?.total"
                :pageSizeProp="jobPaginationMetadata?.pageSize"
                :rowSelection="true"
                :loading="jobsLoading"
                :customDataTableParams="jobsCustomParams"
                @query-model-changed="(queryModel) => onJobsTableEvent('query-model-changed', queryModel)"
                storageKey="affecter_table"
                ref="jobsTableRef"
                :enableDynamicColumns="false"
                :debounceFilter="300"
                :debounceSearch="300"
                :pagination="true"
                @selection-changed="onJobSelectionChanged"
                @row-clicked="onRowClicked"
            />

        </Card>

        <!-- Modals -->
        <Dialog v-model="showTeamModal" :title="modalTitle">
            <div class="mt-4">
                <FormBuilder
                    v-model="teamForm"
                    :fields="teamFields"
                    @submit="handleTeamSubmit"
                    submitLabel="Affecter" />
            </div>
        </Dialog>

        <Dialog v-model="showResourceModal" title="Affecter Ressources">
            <div class="mt-4">
                <FormBuilder
                    v-model="resourceForm"
                    :fields="resourceFields"
                    @submit="handleResourceSubmit"
                    submitLabel="Affecter"
                    :columns="1" />
            </div>
        </Dialog>

        <!-- Dialog d'affectation de job (package SMATCH) -->
        <JobAffectationDialog
            :key="modalKey"
            v-model="showJobAffectationModal"
            :selected-job="selectedJobForModal"
            :team-options="modalTeamOptions"
            :team-options-by-counting-order="modalTeamOptionsByCountingOrder"
            :inventory-id="inventoryId"
            :saving-assignment="assignmentSavingInModal"
            @team-changed="handleJobAffectationModalTeamChanged"
            @finish="handleJobAffectationModalFinish"
        />

        <Dialog v-model="showTransferModal" :title="`Transférer ${eligibleJobsForTransfer.length} Job(s)`" :size="'xl'">
            <div class="flex flex-col" style="height: 75vh; max-height: 75vh;">
                <!-- Section 1: Header et alert -->
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
                                class="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 text-xs font-medium rounded-full">
                                {{ selectedJobs.length - eligibleJobsForTransfer.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <!-- Alert pour les jobs exclus -->
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

                <!-- Section 2: Liste des jobs -->
                <div class="flex-1 min-h-0 mb-4">
                    <div class="h-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div class="h-full overflow-y-auto custom-scrollbar">
                            <div class="divide-y divide-slate-200 dark:divide-slate-700">
                                <div
                                    v-for="job in eligibleJobsForTransfer"
                                    :key="job.id"
                                    class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div class="flex items-center justify-between gap-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-slate-900 dark:text-white truncate">{{ job.job }}</div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <span class="text-xs text-slate-500 dark:text-slate-400">
                                                    <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                    </svg>
                                                    {{ job.locations?.length || 0 }} emplacement(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                                :class="{
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': job.status === 'AFFECTE',
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': job.status === 'VALIDE',
                                                    'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400': job.status === 'PRET',
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
                </div>

                <!-- Divider -->
                <Divider class="my-4" />

                <!-- Formulaire de sélection du comptage -->
                <div class="flex-shrink-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
                    <FormBuilder
                        v-model="transferForm"
                        :fields="transferFields"
                        @submit="handleTransferSubmit"
                        submitLabel="Sauvegarder"
                        :columns="1" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model="showManualModal" :title="`Lancer manuellement ${eligibleJobsForManual.length} Job(s)`" :size="'xl'">
            <div class="flex flex-col" style="height: 75vh; max-height: 75vh;">
                <!-- Section 1: Header et alert -->
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
                                class="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 text-xs font-medium rounded-full">
                                {{ selectedJobs.length - eligibleJobsForManual.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <!-- Alert pour les jobs exclus -->
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

                <!-- Section 2: Liste des jobs -->
                <div class="flex-1 min-h-0 mb-4">
                    <div class="h-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div class="h-full overflow-y-auto custom-scrollbar">
                            <div class="divide-y divide-slate-200 dark:divide-slate-700">
                                <div
                                    v-for="job in eligibleJobsForManual"
                                    :key="job.id"
                                    class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div class="flex items-center justify-between gap-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-slate-900 dark:text-white truncate">{{ job.job }}</div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <span class="text-xs text-slate-500 dark:text-slate-400">
                                                    <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                    </svg>
                                                    {{ job.locations?.length || 0 }} emplacement(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                                :class="{
                                                    'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400': job.status === 'PRET',
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
                </div>

                <!-- Divider -->
                <Divider class="my-4" />

                <!-- Formulaire de sélection du comptage -->
                <div class="flex-shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
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
 * Vue Affecter - Gestion des affectations de jobs
 *
 * Cette vue permet de :
 * - Visualiser les jobs validés avec pagination, tri et filtrage côté serveur
 * - Affecter des équipes aux jobs (1er et 2e comptage)
 * - Affecter des ressources aux jobs
 * - Transférer des jobs entre comptages
 * - Éditer inline les données dans le DataTable
 *
 * @component Affecter
 */

// ===== IMPORTS VUE =====
import { ref, computed, nextTick, Teleport, watch } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute } from 'vue-router'

// ===== IMPORTS COMPOSANTS =====
import { Dialog, Button, Badge, Card, Dropdown, DropdownItem, DataTable, Divider, Alert } from '@SMATCH-Digital-dev/vue-system-design'
// ButtonGroup n'est pas encore implémenté dans le package (seulement les types), utilisation du composant local
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import JobAffectationDialog from '@/components/JobAffectationDialog.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'

// ===== IMPORTS COMPOSABLES =====
import { useAffecter } from '@/composables/useAffecter'

// ===== IMPORTS ICÔNES =====
import IconCalendar from '@/components/icon/icon-calendar.vue'

// ===== IMPORTS TYPES =====
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'

// ===== ROUTE =====
const route = useRoute()

// ===== COMPOSABLE =====
/**
 * Initialisation du composable useAffecter
 * Gère toute la logique métier de la page
 */
const affecter = useAffecter({
    inventoryReference: route.params.reference as string,
    warehouseReference: route.params.warehouse as string
})

// ===== TOOLTIP STATUTS =====
const showStatusLegend = ref(false)
const statusLegendTooltip = ref<HTMLElement | null>(null)
const tooltipElement = ref<HTMLElement | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
let tooltipTimeoutId: number | null = null

// ===== MODAL D'AFFECTATION =====
// Utiliser les propriétés du composable useAffecter
const { showJobAffectationModal, selectedJobForModal, modalTeamOptions, modalTeamOptionsByCountingOrder, assignmentSavingInModal } = affecter

// Clé pour forcer le re-render de la modal
const modalKey = ref(0)

// Forcer le re-render de la modal quand les options changent
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

    // Positionner le tooltip en bas à droite du bouton
    let top = containerRect.bottom + 8
    let left = containerRect.right - tooltipRect.width

    // Ajuster si le tooltip dépasse de l'écran
    if (left < 8) left = 8
    if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8
    }
    if (top + tooltipRect.height > viewportHeight - 8) {
        top = containerRect.top - tooltipRect.height - 8
    }

    tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`
    }
}

// Utiliser les handlers du composable useAffecter
const { handleJobAffectationModalTeamChanged, handleJobAffectationModalFinish } = affecter

// ===== HANDLERS DATATABLE =====
// Handlers harmonisés avec usePlanning.ts - plus besoin de wrapper

// ===== DESTRUCTURATION =====
const {
    // Données harmonisées avec usePlanning.ts
    jobs,
    selectedJobs,
    selectedJobsCount,
    hasSelectedJobs,
    pendingChanges,
    hasUnsavedChanges,

    // Références harmonisées avec usePlanning.ts
    jobsTableRef,
    jobsKey,

    // État des modales
    showDropdown,
    showTeamModal,
    showResourceModal,
    showTransferModal,
    showManualModal,
    modalTitle,

    // Formulaires
    teamForm,
    teamFields,
    resourceForm,
    resourceFields,
    transferForm,
    transferFields,
    manualForm,
    manualFields,

    // Dropdown
    dropdownItems,
    resetAllChanges,
    resetAllSelections,
    resetDataTableSelections,
    onCellValueChanged,
    onJobSelectionChanged,
    onRowClicked,

    // Handlers d'actions
    handleValiderClick,
    handleResourceSubmit,
    handleTeamSubmit,
    handleTransferSubmit,
    handleManualSubmit,
    handleReadyClick,
    handleReadyAll,
    handleGoToInventoryDetail,
    handleGoToAffectation,
    handleGoToResults,
    handleGoToJobTracking,
    handleGoToImportTracking,
    handleTransferClick,
    handleManualClick,
    handleTransferAll,
    handleAffectAll,

    // Pagination et métadonnées harmonisées avec usePlanning.ts
    jobPaginationMetadata,

    // Handler DataTable unifié
    onJobsTableEvent,

    // CustomParams pour les DataTables
    jobsCustomParams,

    // Gestion des IDs
    initializeIdsFromReferences,
    refreshIdsFromReferences,
    inventoryId,
    warehouseId,
    inventoryReference,
    warehouseReference,

    // Computed
    eligibleJobsForTransfer,
    eligibleJobsForManual,
    resourceOptions,
    showTransferButton,
    showManualButton,
    showReadyButton,
    actionButtons,
    navigationButtons,
    jobsColumns,
    adaptedStoreJobsColumns,
    jobsActions,

    // Utilitaires
    dateValueParser,
    dateValueSetter,
    getTransformedLocations,

    // Export handlers
    handleExportCsv,
    handleExportExcel,

    // États de chargement
    jobsLoading,

    // QueryModel pour synchronisation DataTable
    jobsQueryModel,

    // Méthodes de chargement
    loadJobs,
    refreshJobs
} = affecter

// ===== ADAPTATION DES BOUTONS POUR BUTTONGROUP DU PACKAGE =====
/**
 * Adapte les boutons de navigation au format ButtonGroup local
 * Le composant ButtonGroup du package n'est pas encore implémenté, utilisation du composant local
 */
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

/**
 * Adapte les boutons d'action au format ButtonGroup local
 * Le composant ButtonGroup du package n'est pas encore implémenté, utilisation du composant local
 */
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
</script>

<style scoped>
/* Scrollbar personnalisé pour le modal */
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
