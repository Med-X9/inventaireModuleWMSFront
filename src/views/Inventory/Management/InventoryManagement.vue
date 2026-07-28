<template>
    <div class="inventory-management min-h-screen bg-app dark:bg-bg-dark">
        <!-- En-tête -->
        <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
                <div class="flex items-center gap-4">
                    <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20">
                        <MdiIcon name="mdi-package-variant" size="md" class="text-primary" />
                    </div>
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white m-0">
                            Gestion des inventaires
                        </h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 m-0">
                            Consultez, importez une image de stock ou ajoutez une planification
                        </p>
                    </div>
                </div>
                <Button variant="primary" @click="redirectToAdd" class="flex items-center gap-2 shrink-0">
                    <MdiIcon name="mdi-plus" size="sm" />
                    <span>Nouveau inventaire</span>
                </Button>
            </div>
        </Card>

        <!-- Table des inventaires -->
        <!-- ⚡ FIX : pas de :key ici. Un :key volatile force Vue à détruire/recréer tout le
             composant à chaque action (perte du scroll, du tri, des filtres ouverts...). Le
             composant DataTable patche déjà réactivement `rowDataProp` sans avoir besoin d'être
             remonté ; voir DIAGNOSTIC-PERFORMANCE-DATATABLE.md et le fix cellRendererPool. -->
        <DataTable
            :columns="columns"
            :rowDataProp="inventories"
            :actions="actions"
            :enableVirtualScrolling="undefined"
            :currentPageProp="pagination.current_page"
            :totalPagesProp="pagination.total_pages"
            :totalItemsProp="pagination.total"
            :pageSizeProp="pagination.page_size"
            v-on="inventoryTableEvents"
            storageKey="inventory-management"
            ref="inventoryTableRef"
            :loading="inventoryLoading"
            :enableDynamicColumns="false"
            :debounceFilter="300"
            :debounceSearch="300"
            :pagination="true"
            :enableFiltering="true"
            :enableGlobalSearch="true"
        />

        <!-- Modal d'import d'image de stock (Dialog fullscreen) -->
        <Dialog
            v-model="showImportModal"
            :title="importModalTitle"
            :size="dialogSizeFullscreen"
            @update:model-value="onImportModalVisibilityChange"
        >
            <div class="dialog-fullscreen-content inventory-management-dialog-fullscreen">
                <div v-if="currentImportInventory" class="inventory-context-bar">
                    <span class="font-semibold text-gray-800 dark:text-gray-200">{{ currentImportInventory.label }}</span>
                    <span v-if="currentImportInventory.date" class="text-sm text-gray-600 dark:text-gray-400">
                        {{ formatDate(currentImportInventory.date) }}
                    </span>
                </div>
                <div class="dialog-fullscreen-grid">
                    <div class="dialog-main">
                        <FileInputUpload
                            :is-dragging="isDragging"
                            :is-uploading="isImporting"
                            :selected-file="selectedFile"
                            :upload-progress="uploadProgress"
                            uploading-label="Import en cours..."
                            empty-title="Glissez-déposez votre fichier ici"
                            empty-description="ou"
                            browse-button-label="Parcourir les fichiers"
                            accept-description="Formats acceptés : .xlsx, .xls"
                            :file-type-label="selectedFile ? getFileType(selectedFile.name) : ''"
                            @browse-click="() => (fileInput as any)?.click()"
                            @dragover="handleDragOver"
                            @dragleave="handleDragLeave"
                            @drop="handleDrop"
                            @clear-file="() => (selectedFile = null)"
                        />
                        <Alert v-if="importSuccess && importSuccessMessage" variant="success" class="mt-4">
                            <template #icon>
                                <MdiIcon name="mdi-check-circle-outline" size="sm" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Import réussi</h4>
                                <p class="text-sm m-0">{{ importSuccessMessage }}</p>
                            </div>
                        </Alert>
                        <Alert v-if="importError && importErrorDetails" variant="error" class="mt-4">
                            <template #icon>
                                <MdiIcon name="mdi-close-circle-outline" size="sm" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Erreur lors de l'import</h4>
                                <p class="text-sm m-0">{{ importErrorDetails.message }}</p>
                                <div v-if="importErrorDetails.errors" class="text-xs font-semibold mt-2">
                                    {{ importErrorDetails.errors.length }} erreur(s) de validation
                                </div>
                            </div>
                        </Alert>
                    </div>
                    <div class="dialog-sidebar">
                        <div class="instructions">
                            <h4>Instructions d'import</h4>
                            <ul>
                                <li>Format Excel requis (.xlsx, .xls)</li>
                                <li>Validation des données obligatoire</li>
                                <li>Import peut prendre plusieurs minutes</li>
                            </ul>
                        </div>
                        <div class="actions">
                            <Button variant="secondary" @click="closeImportModalWithCleanup" :disabled="isImporting" class="w-full">
                                Annuler
                            </Button>
                            <Button
                                variant="primary"
                                @click="() => selectedFile && processImportExcelWithProgress(selectedFile)"
                                :disabled="!selectedFile || isImporting"
                                class="w-full"
                            >
                                {{ isImporting ? 'Import en cours...' : "Lancer l'import" }}
                            </Button>
                        </div>
                    </div>
                </div>
                <input type="file" ref="fileInput" @change="handleFileChange" accept=".xlsx,.xls" class="hidden" />
            </div>
        </Dialog>

        <!-- Modal d'ajout de planification (Dialog fullscreen) -->
        <Dialog
            v-model="showPlanningModal"
            :title="planningModalTitle"
            :size="dialogSizeFullscreen"
            @update:model-value="onPlanningModalVisibilityChange"
        >
            <div class="dialog-fullscreen-content inventory-management-dialog-fullscreen">
                <div v-if="currentPlanningInventory" class="inventory-context-bar">
                    <span class="font-semibold text-gray-800 dark:text-gray-200">{{ currentPlanningInventory.label }}</span>
                    <span v-if="currentPlanningInventory.date" class="text-sm text-gray-600 dark:text-gray-400">
                        {{ formatDate(currentPlanningInventory.date) }}
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
                            @browse-click="() => (planningFileInput as any)?.click()"
                            @dragover="handlePlanningDragOver"
                            @dragleave="handlePlanningDragLeave"
                            @drop="handlePlanningDrop"
                            @clear-file="() => (planningFile = null)"
                        />
                        <Alert v-if="planningSuccess && planningSuccessMessage" variant="success" class="mt-4">
                            <template #icon>
                                <MdiIcon name="mdi-check-circle-outline" size="sm" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Planification ajoutée avec succès</h4>
                                <p class="text-sm m-0">{{ planningSuccessMessage }}</p>
                            </div>
                        </Alert>
                        <Alert v-if="planningInfoMessage" variant="info" class="mt-4">
                            <template #icon>
                                <MdiIcon name="mdi-loading" size="sm" class="animate-spin" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Import en cours</h4>
                                <p class="text-sm m-0">{{ planningInfoMessage }}</p>
                            </div>
                        </Alert>
                        <Alert v-if="planningError" variant="error" class="mt-4">
                            <template #icon>
                                <MdiIcon name="mdi-close-circle-outline" size="sm" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Erreur</h4>
                                <p class="text-sm m-0">{{ planningError }}</p>
                                <div v-if="planningErrorDetails?.length" class="text-xs font-semibold mt-2">
                                    {{ planningErrorDetails.length }} erreur(s) détaillées
                                </div>
                            </div>
                        </Alert>
                    </div>
                    <div class="dialog-sidebar">
                        <div class="instructions">
                            <h4>Instructions</h4>
                            <ul>
                                <li>Format Excel requis (.xlsx, .xls)</li>
                                <li>Validation des données obligatoire</li>
                                <li>Upload peut prendre plusieurs minutes</li>
                            </ul>
                        </div>
                        <div class="actions">
                            <Button variant="secondary" @click="closePlanningModal" :disabled="isUploadingPlanning" class="w-full">
                                Annuler
                            </Button>
                            <Button
                                variant="primary"
                                @click="handlePlanningUpload"
                                :disabled="!planningFile || isUploadingPlanning"
                                class="w-full"
                            >
                                {{ isUploadingPlanning ? 'Upload en cours...' : 'Lancer l\'upload' }}
                            </Button>
                        </div>
                    </div>
                </div>
                <input type="file" ref="planningFileInput" @change="handlePlanningFileChange" accept=".xlsx,.xls" class="hidden" />
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
/**
 * Page de gestion des inventaires
 *
 * Affiche une table des inventaires avec possibilité de :
 * - Consulter les détails d'un inventaire
 * - Importer une image de stock
 * - Ajouter une planification
 * - Modifier ou supprimer un inventaire
 *
 * @component InventoryManagement
 */

// ===== IMPORTS =====
import { onMounted, ref, computed } from 'vue'
// Composants du package @SMATCH-Digital-dev/vue-system-design
import { DataTable, Card, Button, Alert, Dialog } from '@SMATCH-Digital-dev/vue-system-design'
import FileInputUpload from '@/components/Upload/FileInputUpload.vue'
import { useInventoryManagement } from '@/composables/useInventoryManagement'
import { bindDataTableServerEvents } from '@/composables/dataTable/bindDataTableServerEvents'

// ===== IMPORTS ICÔNES =====
import MdiIcon from '@/components/MdiIcon.vue'

// ===== COMPOSABLES =====

/**
 * Composable pour la gestion des inventaires
 * Fournit les colonnes, actions, et la logique d'import
 */
const {
    columns,
    actions,
    pagination,
    inventoryTableRef,
    inventoryLoading,
    redirectToAdd,
    onInventoryTableEvent,
    handleCellValueChanged,
    handleExportCsv,
    handleExportExcel,
    showImportModal,
    showPlanningModal,
    currentImportInventory,
    currentPlanningInventory,
    isImporting,
    importError,
    importErrorDetails,
    importSuccess,
    importSuccessMessage,
    selectedFile,
    uploadProgress,
    isDragging,
    planningFile,
    isDraggingPlanning,
    isUploadingPlanning,
    planningUploadProgress,
    planningSuccess,
    planningSuccessMessage,
    planningError,
    planningErrorDetails,
    planningInfoMessage,
    closeImportModal,
    closePlanningModal,
    processImportExcel,
    processPlanningUpload,
    processImportExcelWithProgress,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePlanningFileChange,
    handlePlanningDragOver,
    handlePlanningDragLeave,
    handlePlanningDrop,
    alertService,
    inventories,
    initializeInventoryTable,
} = useInventoryManagement()

const inventoryTableEvents = bindDataTableServerEvents(onInventoryTableEvent)

// Titres des modals fullscreen
const importModalTitle = computed(() =>
    currentImportInventory.value
        ? `Import de stock image — ${currentImportInventory.value.label}`
        : 'Import de stock image'
)
const planningModalTitle = computed(() =>
    currentPlanningInventory.value
        ? `Ajouter planification — ${currentPlanningInventory.value.label}`
        : 'Ajouter planification'
)
/** Taille fullscreen pour Dialog (assertion de type pour accepter fullscreen) */
const dialogSizeFullscreen = 'fullscreen' as 'xl'

// ===== HANDLERS =====

/**
 * Handler pour lancer l'upload de planification
 */
const handlePlanningUpload = async () => {
    if (planningFile.value) {
        try {
            await processPlanningUpload(planningFile.value)
        } catch {
            // Erreur gérée dans le composable / alerts
        }
    }
}

// ===== RÉFÉRENCES DOM =====
const fileInput = ref<HTMLInputElement>()
const planningFileInput = ref<HTMLInputElement>()

// ===== UTILITAIRES =====

/**
 * Formate le type d'un fichier
 */
const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toUpperCase()
    return extension ? `Fichier ${extension}` : 'Fichier inconnu'
}

/**
 * Formate une date en français
 */
const formatDate = (date: string | Date): string => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

/**
 * Ferme la modal d'import avec nettoyage
 */
const closeImportModalWithCleanup = () => {
    closeImportModal()
}

function onImportModalVisibilityChange(open: boolean) {
    if (!open) {
        closeImportModalWithCleanup()
    }
}

function onPlanningModalVisibilityChange(open: boolean) {
    if (!open) {
        closePlanningModal()
    }
}

// ===== LIFECYCLE =====
onMounted(async () => {
    await initializeInventoryTable()
})
</script>

<style scoped>
.inventory-management {
    padding: 1.5rem;
}
@media (min-width: 768px) {
    .inventory-management {
        padding: 2rem;
    }
}

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
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: #1e3a8a;
}
.dark .instructions li {
    background: rgba(15, 23, 42, 0.5);
    color: #bfdbfe;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--color-bg-card, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    flex-shrink: 0;
}
.dark .actions {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(71, 85, 105, 0.5);
}

.actions :deep(button) {
    justify-content: center;
}

/* Dialog fullscreen : plein écran (100vw x 100vh) — cible le panneau téléporté */
.inventory-management :deep([role="dialog"]),
.inventory-management :deep(.dialog-panel) {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    display: flex !important;
    flex-direction: column !important;
}
.inventory-management :deep([role="dialog"] > div),
.inventory-management :deep(.dialog-panel > div) {
    flex: 1;
    min-height: 0;
    overflow: auto;
}
.inventory-management :deep(.fixed.inset-0) {
    position: fixed !important;
    inset: 0 !important;
}
</style>
