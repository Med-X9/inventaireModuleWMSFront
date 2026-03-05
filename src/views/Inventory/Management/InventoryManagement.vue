<template>
    <div class="inventory-management min-h-screen bg-gray-50 dark:bg-[#0e1726]">
        <!-- En-tête -->
        <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
                <div class="flex items-center gap-4">
                    <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20">
                        <IconBox class="w-6 h-6 text-primary" />
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
                    <IconPlus class="w-4 h-4" />
                    <span>Nouveau inventaire</span>
                </Button>
            </div>
        </Card>

        <!-- Table des inventaires -->
        <Card v-if="isDataLoaded" class="overflow-hidden rounded-xl shadow-sm border-0">
            <DataTable
                :columns="columns"
                :rowDataProp="inventories"
                :actions="actions"
                :enableVirtualScrolling="undefined"
                :currentPageProp="pagination.current_page"
                :totalPagesProp="pagination.total_pages"
                :totalItemsProp="pagination.total"
                :pageSizeProp="pagination.page_size"
                @query-model-changed="(queryModel) => onInventoryTableEvent('query-model-changed', queryModel)"
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
        </Card>

        <!-- État de chargement -->
        <Card v-else class="overflow-hidden rounded-xl shadow-sm flex items-center justify-center min-h-[400px]">
            <div class="flex flex-col items-center gap-4 py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
                <p class="text-gray-600 dark:text-gray-300 font-medium">Chargement des inventaires...</p>
            </div>
        </Card>

        <!-- Modal d'import d'image de stock (Dialog fullscreen) -->
        <Dialog
            v-model="showImportModal"
            :title="importModalTitle"
            :size="dialogSizeFullscreen"
            class="inventory-management-dialog-fullscreen"
            @update:model-value="(v) => !v && closeImportModalWithCleanup()"
        >
            <div class="dialog-fullscreen-content">
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
                                <IconCircleCheck class="w-5 h-5" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Import réussi</h4>
                                <p class="text-sm m-0">{{ importSuccessMessage }}</p>
                            </div>
                        </Alert>
                        <Alert v-if="importError && importErrorDetails" variant="error" class="mt-4">
                            <template #icon>
                                <IconXCircle class="w-5 h-5" />
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
                                {{ isImporting ? 'Import en cours...' : 'Lancer l\'import' }}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <input type="file" ref="fileInput" @change="handleFileChange" accept=".xlsx,.xls" class="hidden" />
        </Dialog>

        <!-- Modal d'ajout de planification (Dialog fullscreen) -->
        <Dialog
            v-model="showPlanningModal"
            :title="planningModalTitle"
            :size="dialogSizeFullscreen"
            class="inventory-management-dialog-fullscreen"
            @update:model-value="(v) => !v && closePlanningModal()"
        >
            <div class="dialog-fullscreen-content">
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
                                <IconCircleCheck class="w-5 h-5" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Planification ajoutée avec succès</h4>
                                <p class="text-sm m-0">{{ planningSuccessMessage }}</p>
                            </div>
                        </Alert>
                        <Alert v-if="planningInfoMessage" variant="info" class="mt-4">
                            <template #icon>
                                <IconLoader class="w-5 h-5 animate-spin" />
                            </template>
                            <div>
                                <h4 class="text-base font-semibold m-0 mb-1">Import en cours</h4>
                                <p class="text-sm m-0">{{ planningInfoMessage }}</p>
                            </div>
                        </Alert>
                        <Alert v-if="planningError" variant="error" class="mt-4">
                            <template #icon>
                                <IconXCircle class="w-5 h-5" />
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
            </div>
            <input type="file" ref="planningFileInput" @change="handlePlanningFileChange" accept=".xlsx,.xls" class="hidden" />
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

// ===== IMPORTS ICÔNES =====
import IconBox from '@/components/icon/icon-box.vue'
import IconPlus from '@/components/icon/icon-plus.vue'
import IconLoader from '@/components/icon/icon-loader.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'

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
    loadInventories
} = useInventoryManagement()

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

// ===== ÉTATS LOCAUX =====
const isDataLoaded = ref(false)

// ===== LIFECYCLE =====
onMounted(async () => {
    await loadInventories()
    isDataLoaded.value = true
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

/* Dialog fullscreen : plein écran (100vw x 100vh) */
.inventory-management-dialog-fullscreen :deep([role="dialog"]),
.inventory-management-dialog-fullscreen :deep(.dialog-panel) {
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
.inventory-management-dialog-fullscreen :deep([role="dialog"] > div),
.inventory-management-dialog-fullscreen :deep(.dialog-panel > div) {
    flex: 1;
    min-height: 0;
    overflow: auto;
}
.inventory-management-dialog-fullscreen :deep(.fixed.inset-0) {
    position: fixed !important;
    inset: 0 !important;
}
</style>
