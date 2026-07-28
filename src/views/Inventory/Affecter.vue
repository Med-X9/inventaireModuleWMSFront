<template>
    <div class="affecter-page min-h-screen bg-app dark:bg-bg-dark p-4 md:p-6 lg:p-8 font-body">
        <!-- En-tête + barre d'actions (composants SDS) -->
        <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
            <div class="flex flex-col gap-6 p-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex items-center gap-4 min-w-0">
                        <div class="flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-primary/10 dark:bg-primary/20">
                            <MdiIcon name="mdi-calendar-outline" size="lg" class="text-primary" />
                        </div>
                        <div class="min-w-0">
                            <h1 class="text-2xl sm:text-3xl font-bold font-heading text-text dark:text-white m-0">
                                Gestion des Affectations
                            </h1>
                            <p class="text-sm text-muted mt-1 m-0">
                                Affectez des équipes et ressources aux jobs validés
                            </p>
                        </div>
                    </div>
                    <ButtonGroup :buttons="navigationButtons" justify="end" />
                </div>

                <Divider />

                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div class="flex items-center gap-4 flex-wrap">
                        <div class="flex items-center gap-2">
                            <MdiIcon name="mdi-clipboard-list-outline" size="sm" class="text-muted shrink-0" />
                            <span class="text-sm font-medium text-text">
                                {{ selectedJobsCount }} job{{ selectedJobsCount > 1 ? 's' : '' }} sélectionné{{ selectedJobsCount > 1 ? 's' : '' }}
                            </span>
                        </div>
                        <div v-if="hasUnsavedChanges" class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-warning animate-pulse" aria-hidden="true" />
                            <span class="text-sm font-medium text-warning dark:text-warning-light">
                                {{ pendingChangesCount }} modification{{ pendingChangesCount > 1 ? 's' : '' }} en attente
                            </span>
                        </div>
                        <div v-else class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                            <span class="text-sm font-medium text-success dark:text-success-light">À jour</span>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <Dropdown
                            v-if="showReadyButton"
                            v-model="showDropdown"
                            placement="bottom-end"
                            trigger="click"
                            :offset="8"
                            aria-label="Menu d'affectation">
                            <template #trigger>
                                <Button variant="primary" size="md" class="flex items-center justify-center gap-2">
                                    <MdiIcon name="mdi-account-multiple-plus-outline" size="sm" />
                                    <span>Affecter</span>
                                    <MdiIcon
                                        name="mdi-chevron-down"
                                        size="sm"
                                        class="transition-transform duration-200"
                                        :class="{ 'rotate-180': showDropdown }" />
                                </Button>
                            </template>
                            <template #menu>
                                <DropdownItem
                                    v-for="item in dropdownItems"
                                    :key="item.label"
                                    @click="item.action(); showDropdown = false">
                                    <span class="flex items-center gap-2">
                                        <MdiIcon v-if="item.icon" :name="item.icon" size="sm" />
                                        {{ item.label }}
                                    </span>
                                </DropdownItem>
                            </template>
                        </Dropdown>

                        <ButtonGroup :buttons="actionButtons" justify="end" />
                    </div>
                </div>
            </div>
        </Card>

        <!-- DataTable -->
        <Card v-if="isDataLoaded" class="shadow-sm border-0 rounded-xl overflow-hidden">
            <div class="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
                <h3 class="text-lg font-semibold font-heading text-text dark:text-white m-0">Liste des jobs</h3>
                <JobStatusLegendTooltip />
            </div>

            <!-- DataTable des jobs - config harmonisée avec InventoryResults.vue -->
            <!-- ⚡ FIX : :key volatile supprimé (remount complet à chaque refresh, perte de
                 scroll). Voir fix cellRendererPool côté package. -->
            <DataTable
                :columns="adaptedStoreJobsColumns"
                :rowDataProp="jobs"
                :actions="[]"
                :currentPageProp="jobPaginationMetadata?.page"
                :totalPagesProp="jobPaginationMetadata?.totalPages"
                :totalItemsProp="jobPaginationMetadata?.total"
                :pageSizeProp="jobPaginationMetadata?.pageSize"
                :rowSelection="true"
                :loading="jobsLoading"
                :customDataTableParams="jobsCustomParams"
                v-on="jobsTableEvents"
                storageKey="affecter_table"
                ref="jobsTableRef"
                :enableDynamicColumns="false"
                :debounceFilter="300"
                :debounceSearch="500"
                :pagination="true"
                :enableFiltering="true"
                :enableGlobalSearch="true"
                :enable-row-click="true"
                @selection-changed="onJobSelectionChanged"
                @row-clicked="onRowClicked"
            />

        </Card>

        <Card
            v-else
            class="shadow-sm border-0 rounded-xl overflow-hidden flex items-center justify-center min-h-[400px]">
            <div class="flex flex-col items-center gap-4 p-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p class="text-text dark:text-text">Chargement des affectations...</p>
            </div>
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
            <div class="flex flex-col h-[75vh] max-h-[75vh]">
                <!-- Section 1: Header et alert -->
                <div class="flex-shrink-0 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold font-heading text-text">
                            Jobs éligibles au transfert
                        </h3>
                        <div class="flex items-center gap-2">
                            <Badge variant="success" size="sm">
                                {{ eligibleJobsForTransfer.length }} éligible(s)
                            </Badge>
                            <Badge
                                v-if="selectedJobs.length - eligibleJobsForTransfer.length > 0"
                                variant="warning"
                                size="sm">
                                {{ selectedJobs.length - eligibleJobsForTransfer.length }} exclu(s)
                            </Badge>
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
                    <div class="h-full overflow-hidden rounded-lg border border-border bg-card">
                        <div class="h-full overflow-y-auto">
                            <div class="divide-y divide-border">
                                <div
                                    v-for="job in eligibleJobsForTransfer"
                                    :key="job.id"
                                    class="px-4 py-3 hover:bg-hover transition-colors">
                                    <div class="flex items-center justify-between gap-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-text truncate">{{ job.job }}</div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <span class="inline-flex items-center gap-1 text-xs text-muted">
                                                    <MdiIcon name="mdi-map-marker-outline" size="xs" />
                                                    {{ job.locations?.length || 0 }} emplacement(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <Badge :variant="getJobStatusBadgeVariant(job.status)" size="sm">
                                                {{ job.status }}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider class="my-4" />

                <div class="flex-shrink-0 rounded-lg bg-hover p-4 mb-4">
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
            <div class="flex flex-col h-[75vh] max-h-[75vh]">
                <!-- Section 1: Header et alert -->
                <div class="flex-shrink-0 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold font-heading text-text">
                            Jobs éligibles pour le lancement manuel
                        </h3>
                        <div class="flex items-center gap-2">
                            <Badge variant="success" size="sm">
                                {{ eligibleJobsForManual.length }} éligible(s)
                            </Badge>
                            <Badge
                                v-if="selectedJobs.length - eligibleJobsForManual.length > 0"
                                variant="warning"
                                size="sm">
                                {{ selectedJobs.length - eligibleJobsForManual.length }} exclu(s)
                            </Badge>
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
                    <div class="h-full overflow-hidden rounded-lg border border-border bg-card">
                        <div class="h-full overflow-y-auto">
                            <div class="divide-y divide-border">
                                <div
                                    v-for="job in eligibleJobsForManual"
                                    :key="job.id"
                                    class="px-4 py-3 hover:bg-hover transition-colors">
                                    <div class="flex items-center justify-between gap-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-text truncate">{{ job.job }}</div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <span class="inline-flex items-center gap-1 text-xs text-muted">
                                                    <MdiIcon name="mdi-map-marker-outline" size="xs" />
                                                    {{ job.locations?.length || 0 }} emplacement(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <Badge :variant="getJobStatusBadgeVariant(job.status)" size="sm">
                                                {{ job.status }}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider class="my-4" />

                <div class="flex-shrink-0 rounded-lg bg-hover p-4 mb-4">
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

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// ===== IMPORTS COMPOSANTS =====
import { Dialog, Button, Card, Badge, Dropdown, DropdownItem, DataTable, Divider, Alert } from '@SMATCH-Digital-dev/vue-system-design'
// ButtonGroup n'est pas encore implémenté dans le package (seulement les types), utilisation du composant local
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import JobAffectationDialog from '@/components/JobAffectationDialog.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'
import JobStatusLegendTooltip from '@/components/JobStatusLegendTooltip.vue'

// ===== IMPORTS COMPOSABLES =====
import { useAffecter } from '@/composables/useAffecter'
import { bindDataTableServerEvents } from '@/composables/dataTable/bindDataTableServerEvents'

// ===== IMPORTS ICÔNES =====
import MdiIcon from '@/components/MdiIcon.vue'

const route = useRoute()

const {
    jobs,
    selectedJobs,
    selectedJobsCount,
    pendingChanges,
    hasUnsavedChanges,
    jobsTableRef,
    showDropdown,
    showTeamModal,
    showResourceModal,
    showTransferModal,
    showManualModal,
    showJobAffectationModal,
    selectedJobForModal,
    modalTeamOptions,
    modalTeamOptionsByCountingOrder,
    assignmentSavingInModal,
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
    handleJobAffectationModalTeamChanged,
    handleJobAffectationModalFinish,
    jobPaginationMetadata,
    onJobsTableEvent,
    jobsCustomParams,
    inventoryId,
    eligibleJobsForTransfer,
    eligibleJobsForManual,
    actionButtons,
    navigationButtons,
    showReadyButton,
    adaptedStoreJobsColumns,
    jobsLoading,
    isDataLoaded,
    initializeWithData,
} = useAffecter({
    inventoryReference: route.params.reference as string,
    warehouseReference: route.params.warehouse as string,
})

const jobsTableEvents = bindDataTableServerEvents(onJobsTableEvent)

const modalKey = ref(0)

watch(
    () => modalTeamOptionsByCountingOrder,
    (newVal) => {
        if (newVal && Object.keys(newVal).length > 0) {
            modalKey.value++
        }
    },
    { immediate: true },
)

const pendingChangesCount = computed(() =>
    Array.from(pendingChanges.value.values()).reduce((total, changes) => total + changes.size, 0),
)

const mountAffecter = async () => {
    try {
        await initializeWithData()
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des affectations:', error)
        isDataLoaded.value = true
    }
}

onMounted(() => {
    void mountAffecter()
})

watch(
    () => [route.params.reference, route.params.warehouse] as const,
    ([reference, warehouse], previous) => {
        if (!previous) return
        if (reference === previous[0] && warehouse === previous[1]) return
        void mountAffecter()
    },
)

type JobStatusBadgeVariant = 'primary' | 'success' | 'warning' | 'info'

function getJobStatusBadgeVariant(status: string): JobStatusBadgeVariant {
    switch (status) {
        case 'VALIDE':
            return 'success'
        case 'PRET':
            return 'warning'
        case 'AFFECTE':
        case 'ENTAME':
            return 'primary'
        case 'TRANSFERT':
            return 'info'
        default:
            return 'info'
    }
}

</script>

