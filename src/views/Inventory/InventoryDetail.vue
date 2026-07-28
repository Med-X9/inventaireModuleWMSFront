<template>
    <div class="inventory-detail min-h-screen bg-app dark:bg-bg-dark">
        <div class="container-fluid py-6">
            <InventoryDetailSkeleton v-if="loading || (!inventory && !error)" />

            <template v-else-if="inventory">
                <!-- En-tête -->
                <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
                    <div class="flex flex-col gap-4 p-6">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div class="min-w-0">
                                <div class="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 class="text-2xl sm:text-3xl font-bold text-text dark:text-white m-0">
                                        {{ inventory.label }}
                                    </h1>
                                    <Badge :variant="getStatusBadgeVariant(inventory.status)">
                                        {{ inventory.status }}
                                    </Badge>
                                </div>
                                <p class="text-sm text-muted m-0">
                                    {{ inventory.reference }}
                                    <span class="mx-2 text-border">·</span>
                                    {{ inventory.inventory_type }}
                                    <span class="mx-2 text-border">·</span>
                                    {{ formatDate(inventory.date) }}
                                </p>
                            </div>
                            <ButtonGroup :buttons="actionButtons" justify="end" />
                        </div>
                    </div>
                </Card>

                <!-- Contenu par onglets -->
                <Card class="shadow-sm border-0 rounded-xl overflow-hidden">
                    <Tabs v-model="activeTab" :tabs="detailTabs" class="px-4 sm:px-6 pt-4">
                        <!-- Onglet Détail -->
                        <template #detail>
                            <div class="space-y-8 pb-4">
                                <!-- Paramètres de comptage -->
                                <section>
                                    <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
                                        Informations générales
                                    </h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        <div
                                            v-for="info in generalInfoItems"
                                            :key="info.label"
                                            class="rounded-xl p-4 border border-border bg-surface dark:bg-surface-dark"
                                        >
                                            <span class="text-xs font-medium text-muted uppercase tracking-wide block mb-2">
                                                {{ info.label }}
                                            </span>
                                            <span class="text-sm font-semibold text-text truncate block">
                                                {{ info.value }}
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                <Divider />

                                <!-- Comptages -->
                                <section>
                                    <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
                                        Comptages
                                    </h3>
                                    <div
                                        v-if="inventory.comptages?.length"
                                        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                                    >
                                        <div
                                            v-for="(comptage, i) in inventory.comptages"
                                            :key="i"
                                            class="rounded-xl p-5 border border-border bg-surface dark:bg-surface-dark"
                                        >
                                            <h4 class="font-medium text-text text-base mb-4">
                                                {{ i + 1 }}{{ i === 0 ? 'er' : 'ème' }} comptage
                                            </h4>

                                            <div class="flex items-center justify-between p-2 bg-hover rounded-xl mb-4">
                                                <span class="text-sm font-semibold text-text">Mode de comptage</span>
                                                <span
                                                    :class="getCountModeBadgeClass(comptage.count_mode)"
                                                    class="px-3 py-1 rounded-full text-xs font-medium"
                                                >
                                                    {{ getCountModeLabel(comptage.count_mode) }}
                                                </span>
                                            </div>

                                            <div class="flex flex-wrap gap-2">
                                                <template
                                                    v-if="(comptage as any).champs_actifs && Array.isArray((comptage as any).champs_actifs)"
                                                >
                                                    <Tag
                                                        v-for="champ in (comptage as any).champs_actifs"
                                                        :key="champ"
                                                        variant="neutral"
                                                    >
                                                        {{ champ }}
                                                    </Tag>
                                                </template>
                                                <template v-else>
                                                    <Tag v-if="(comptage as any).is_variant" variant="neutral">Variantes</Tag>
                                                    <Tag v-if="(comptage as any).show_product" variant="neutral">Guide Article</Tag>
                                                    <Tag v-if="(comptage as any).quantity_show" variant="neutral">Guide Quantité</Tag>
                                                    <Tag v-if="(comptage as any).unit_scanned" variant="neutral">Scanner unitaire</Tag>
                                                    <Tag v-if="(comptage as any).entry_quantity" variant="neutral">Saisie quantité</Tag>
                                                    <Tag v-if="(comptage as any).dlc" variant="neutral">DLC</Tag>
                                                    <Tag v-if="(comptage as any).n_serie" variant="neutral">N° Série</Tag>
                                                    <Tag v-if="(comptage as any).n_lot" variant="neutral">N° Lot</Tag>
                                                </template>
                                                <span
                                                    v-if="!hasAnyOption(comptage)"
                                                    class="text-sm text-muted"
                                                >
                                                    Configuration de base
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Alert
                                        v-else
                                        type="info"
                                        title="Aucun comptage"
                                        message="Aucun comptage configuré pour cet inventaire."
                                    />
                                </section>
                            </div>
                        </template>

                        <!-- Onglet Magasins -->
                        <template #magasins>
                            <div class="pb-4">
                                <div class="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 class="text-lg font-semibold text-text m-0">Magasins associés</h3>
                                        <p class="text-sm text-muted m-0 mt-1">
                                            Gérer les opérations pour chaque magasin
                                        </p>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-2">
                                        <Button
                                            v-if="canLaunchMultipleWarehouses"
                                            variant="success"
                                            size="sm"
                                            :disabled="loading"
                                            @click="launchMultipleWarehouses"
                                        >
                                            <MdiIcon name="mdi-play-outline" size="sm" class="mr-1" />
                                            Lancer
                                            <span v-if="selectedMagasins.length" class="ml-1">
                                                ({{ selectedMagasins.length }})
                                            </span>
                                        </Button>
                                        <Button
                                            v-if="canTermineMultipleWarehouses"
                                            variant="warning"
                                            size="sm"
                                            :disabled="loading"
                                            @click="termineMultipleWarehouses"
                                        >
                                            <MdiIcon name="mdi-check-circle-outline" size="sm" class="mr-1" />
                                            Terminer
                                            <span v-if="selectedMagasins.length" class="ml-1">
                                                ({{ selectedMagasins.length }})
                                            </span>
                                        </Button>
                                    </div>
                                </div>

                                <DataTable
                                    v-if="magasinsTableRows.length"
                                    :columns="magasinsColumns"
                                    :rowDataProp="magasinsTableRows"
                                    :actions="magasinsActions"
                                    :rowSelection="true"
                                    :loading="loading"
                                    :pagination="magasinsTableRows.length > 10"
                                    :pageSizeProp="10"
                                    :enableDynamicColumns="false"
                                    :enableFiltering="true"
                                    :enableGlobalSearch="true"
                                    :debounceFilter="200"
                                    :debounceSearch="300"
                                    storageKey="inventory_detail_magasins"
                                    exportTitle="Magasins inventaire"
                                    @selection-changed="onMagasinsSelectionChanged"
                                />
                                <Alert
                                    v-else
                                    type="info"
                                    title="Aucun magasin associé"
                                    message="Aucun magasin n'a été associé à cet inventaire pour le moment."
                                />
                            </div>
                        </template>

                        <!-- Onglet Équipes -->
                        <template #equipes>
                            <div class="pb-4">
                                <div class="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 class="text-lg font-semibold text-text m-0">Équipes assignées</h3>
                                        <p class="text-sm text-muted m-0 mt-1">
                                            Équipes responsables de l'inventaire
                                        </p>
                                    </div>
                                    <Badge variant="info">{{ equipesTableRows.length }} équipe(s)</Badge>
                                </div>

                                <DataTable
                                    v-if="equipesTableRows.length"
                                    :columns="equipesColumns"
                                    :rowDataProp="equipesTableRows"
                                    :actions="[]"
                                    :rowSelection="false"
                                    :loading="loading"
                                    :pagination="equipesTableRows.length > 10"
                                    :pageSizeProp="10"
                                    :enableDynamicColumns="false"
                                    :enableFiltering="true"
                                    :enableGlobalSearch="true"
                                    :debounceFilter="200"
                                    :debounceSearch="300"
                                    storageKey="inventory_detail_equipes"
                                    exportTitle="Équipes inventaire"
                                />
                                <Alert
                                    v-else
                                    type="info"
                                    title="Aucune équipe assignée"
                                    message="Aucune équipe n'a été assignée à cet inventaire pour le moment."
                                />
                            </div>
                        </template>

                        <!-- Onglet Ressources -->
                        <template #resources>
                            <div class="pb-4">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 class="text-lg font-semibold text-text m-0">Ressources</h3>
                                        <p class="text-sm text-muted m-0 mt-1">
                                            Ressources nécessaires pour l'inventaire (optionnel)
                                        </p>
                                    </div>
                                    <Button variant="primary" size="sm" @click="openAddResourceModal">
                                        <MdiIcon name="mdi-plus" size="sm" class="mr-1" />
                                        Ajouter des ressources
                                    </Button>
                                </div>

                                <DataTable
                                    v-if="resourcesTableRows.length"
                                    :columns="resourcesColumns"
                                    :rowDataProp="resourcesTableRows"
                                    :actions="[]"
                                    :rowSelection="false"
                                    :loading="loading"
                                    :pagination="resourcesTableRows.length > 10"
                                    :pageSizeProp="10"
                                    :enableDynamicColumns="false"
                                    :enableFiltering="true"
                                    :enableGlobalSearch="true"
                                    :debounceFilter="200"
                                    :debounceSearch="300"
                                    storageKey="inventory_detail_resources"
                                    exportTitle="Ressources inventaire"
                                />
                                <Alert
                                    v-else
                                    type="info"
                                    title="Aucune ressource"
                                    message="Aucune ressource n'a été assignée à cet inventaire pour le moment."
                                />
                            </div>
                        </template>
                    </Tabs>
                </Card>

                <!-- Modal d'ajout de ressources -->
                <Dialog v-model="showAddResourceModal" title="Ajouter des ressources" size="lg">
                    <div class="space-y-6">
                        <div class="space-y-4">
                            <div
                                v-for="(line, index) in resourceLines"
                                :key="index"
                                class="flex items-center gap-4 p-4 bg-hover rounded-lg"
                            >
                                <FormBuilder
                                    v-model="resourceLines[index]"
                                    :fields="resourceFields(index)"
                                    :columns="2"
                                    hide-submit
                                />
                                <button
                                    v-if="resourceLines.length > 1"
                                    @click="removeResourceLine(index)"
                                    type="button"
                                    class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                >
                                    <MdiIcon name="mdi-delete-outline" size="sm" />
                                </button>
                            </div>
                        </div>

                        <div class="flex justify-center">
                            <Button variant="secondary" size="sm" @click="addResourceLine">
                                <MdiIcon name="mdi-plus" size="sm" class="mr-1" />
                                Ajouter une ressource
                            </Button>
                        </div>

                        <div class="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button variant="secondary" @click="showAddResourceModal = false">
                                Annuler
                            </Button>
                            <Button variant="primary" @click="onAddResources">
                                Ajouter les ressources
                            </Button>
                        </div>
                    </div>
                </Dialog>

                <ValidationAlert
                    :show="validationAlert.showAlert.value"
                    :title="validationAlert.alertData.value.title"
                    :subtitle="validationAlert.alertData.value.subtitle"
                    :message="validationAlert.alertData.value.message"
                    :errors="validationErrors"
                    :infos="validationInfos"
                    @close="validationAlert.hide"
                />

                <InventoryJobsPdfExportModal
                    v-model="showJobsPdfExportModal"
                    export-mode="inventory"
                    :inventory-id="inventoryIdResolved"
                    :inventory-reference="inventory?.reference ?? null"
                />

                <!-- Modal import planning (MAGASIN) — même API que Gestion inventaire -->
                <Dialog
                    v-model="showPlanningModal"
                    :title="planningModalTitle"
                    :size="dialogSizeFullscreen"
                    @update:model-value="onPlanningModalVisibilityChange"
                >
                    <div class="dialog-fullscreen-content inventory-detail-planning-dialog">
                        <div v-if="inventory" class="inventory-context-bar">
                            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ inventory.label }}</span>
                            <span v-if="inventory.date" class="text-sm text-gray-600 dark:text-gray-400">
                                {{ formatDate(inventory.date) }}
                            </span>
                        </div>
                        <div class="dialog-fullscreen-grid">
                            <div class="dialog-main">
                                <FileInputUpload
                                    :is-dragging="isDraggingPlanning"
                                    :is-uploading="isUploadingPlanning"
                                    :selected-file="planningFile"
                                    :upload-progress="planningUploadProgress"
                                    uploading-label="Upload en cours..."
                                    empty-title="Glissez-déposez votre fichier de planification ici"
                                    empty-description="ou"
                                    browse-button-label="Parcourir les fichiers"
                                    accept-description="Formats acceptés : .xlsx, .xls"
                                    :file-type-label="planningFile ? getFileType(planningFile.name) : ''"
                                    @browse-click="() => planningFileInput?.click()"
                                    @dragover="handlePlanningDragOver"
                                    @dragleave="handlePlanningDragLeave"
                                    @drop="handlePlanningDrop"
                                    @clear-file="clearPlanningFile"
                                />
                                <Alert v-if="planningSuccess && planningSuccessMessage" type="success" class="mt-4" :message="planningSuccessMessage" title="Planification importée" />
                                <Alert v-if="planningInfoMessage" type="info" class="mt-4" :message="planningInfoMessage" title="Import en cours" />
                                <Alert v-if="planningError" type="error" class="mt-4" :message="planningError" title="Erreur" />
                            </div>
                            <div class="dialog-sidebar">
                                <div class="instructions">
                                    <h4>Instructions</h4>
                                    <ul>
                                        <li>Format Excel requis (.xlsx, .xls)</li>
                                        <li>Import asynchrone (suivi disponible après lancement)</li>
                                        <li>API : location-jobs/import-async</li>
                                    </ul>
                                </div>
                                <div class="actions">
                                    <Button variant="secondary" class="w-full" :disabled="isUploadingPlanning" @click="closePlanningModal">
                                        Annuler
                                    </Button>
                                    <Button
                                        variant="primary"
                                        class="w-full"
                                        :disabled="!planningFile || isUploadingPlanning"
                                        @click="handlePlanningUpload"
                                    >
                                        {{ isUploadingPlanning ? 'Upload en cours...' : 'Lancer l\'upload' }}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <input
                            ref="planningFileInput"
                            type="file"
                            accept=".xlsx,.xls"
                            class="hidden"
                            @change="handlePlanningFileChange"
                        />
                    </div>
                </Dialog>
            </template>

            <Card v-else-if="error" class="p-6">
                <Alert type="error" title="Erreur de chargement" :message="error" />
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue InventoryDetail - Détails d'un inventaire (onglets + DataTables)
 *
 * @component InventoryDetail
 */

import { onMounted, computed, toRaw } from 'vue'
import { useRoute } from 'vue-router'
import { useValidationAlert } from '@/services/validationAlertService'
import {
    Dialog,
    Card,
    Badge,
    Tabs,
    DataTable,
    Button,
    Divider,
    Alert,
    Tag,
} from '@SMATCH-Digital-dev/vue-system-design'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'
import ValidationAlert from '@/components/ValidationAlert.vue'
import FileInputUpload from '@/components/Upload/FileInputUpload.vue'
import { useInventoryDetail } from '@/composables/useInventoryDetail'
import InventoryDetailSkeleton from '@/components/InventoryDetailSkeleton.vue'
import InventoryJobsPdfExportModal from '@/components/Inventory/InventoryJobsPdfExportModal.vue'
import { useResourceStore } from '@/stores/resource'
import MdiIcon from '@/components/MdiIcon.vue'

const route = useRoute()
const inventoryReference = route.params.reference as string
const dialogSizeFullscreen = 'fullscreen' as 'xl'

const {
    inventory,
    loading,
    error,
    inventoryIdResolved,
    formatDate,
    initializeInventory,
    actionButtons,
    getStatusBadgeVariant,
    hasAnyOption,
    getCountModeBadgeClass,
    getCountModeLabel,
    activeTab,
    detailTabs,
    magasinsTableRows,
    equipesTableRows,
    resourcesTableRows,
    magasinsColumns,
    equipesColumns,
    resourcesColumns,
    magasinsActions,
    selectedMagasins,
    onMagasinsSelectionChanged,
    canLaunchMultipleWarehouses,
    canTermineMultipleWarehouses,
    launchMultipleWarehouses,
    termineMultipleWarehouses,
    showAddResourceModal,
    showJobsPdfExportModal,
    resourceLines,
    addResourceLine,
    removeResourceLine,
    resourceFields,
    onAddResources,
    openAddResourceModal,
    showPlanningModal,
    planningModalTitle,
    planningFile,
    planningFileInput,
    isDraggingPlanning,
    isUploadingPlanning,
    planningUploadProgress,
    planningSuccess,
    planningSuccessMessage,
    planningError,
    planningInfoMessage,
    closePlanningModal,
    onPlanningModalVisibilityChange,
    handlePlanningFileChange,
    handlePlanningDragOver,
    handlePlanningDragLeave,
    handlePlanningDrop,
    handlePlanningUpload,
    clearPlanningFile,
    getFileType,
} = useInventoryDetail(inventoryReference)

const resourceStore = useResourceStore()
const validationAlert = useValidationAlert()

const validationErrors = computed(() => toRaw(validationAlert.alertData.value.errors || []))
const validationInfos = computed(() => toRaw(validationAlert.alertData.value.infos || []))

const generalInfoItems = computed(() => {
    if (!inventory.value) return []
    const inv = inventory.value
    return [
        { label: 'Référence', value: inv.reference || 'Non défini' },
        { label: 'Libellé', value: inv.label || 'Non défini' },
        { label: "Date d'inventaire", value: formatDate(inv.date) },
        { label: 'Type', value: inv.inventory_type || 'Non défini' },
        { label: 'Compte', value: inv.account_name || 'Non défini' },
        {
            label: 'En préparation',
            value: inv.en_preparation_status_date ? formatDate(inv.en_preparation_status_date) : 'Non défini',
        },
        {
            label: 'En réalisation',
            value: inv.en_realisation_status_date ? formatDate(inv.en_realisation_status_date) : 'Non défini',
        },
        { label: 'Terminé', value: inv.termine_status_date ? formatDate(inv.termine_status_date) : 'Non défini' },
        { label: 'Clôturé', value: inv.cloture_status_date ? formatDate(inv.cloture_status_date) : 'Non défini' },
    ]
})

onMounted(async () => {
    if (resourceStore.getResources.length === 0) {
        await resourceStore.fetchResources()
    }
    await initializeInventory()
})
</script>

<style scoped>
.dialog-fullscreen-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 60vh;
    padding: 0.5rem;
}
@media (min-width: 1024px) {
    .dialog-fullscreen-content {
        padding: 1rem;
    }
}

.inventory-context-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
    background: var(--color-bg-subtle, #f3f4f6);
    border-radius: 0.5rem;
    font-size: 0.875rem;
}
.dark .inventory-context-bar {
    background: rgba(30, 41, 59, 0.5);
}

.dialog-fullscreen-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    flex: 1;
    min-height: 0;
}
@media (min-width: 1024px) {
    .dialog-fullscreen-grid {
        grid-template-columns: 1fr 360px;
        gap: 1.5rem;
    }
}

.dialog-main,
.dialog-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
}

.dialog-sidebar {
    gap: 1rem;
}

.instructions {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    flex-shrink: 0;
}
.dark .instructions {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(30, 64, 175, 0.3) 100%);
    border-color: rgba(96, 165, 250, 0.3);
}

.instructions h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    color: #1e40af;
}
.dark .instructions h4 {
    color: #93c5fd;
}

.instructions ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.instructions li {
    font-size: 0.8125rem;
    color: #1e3a8a;
    padding-left: 1.25rem;
    position: relative;
}
.dark .instructions li {
    color: #bfdbfe;
}

.instructions li::before {
    content: '•';
    position: absolute;
    left: 0.25rem;
    color: #3b82f6;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: auto;
}
</style>
