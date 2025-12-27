<template>
    <div class="min-h-screen bg-app dark:bg-[#0e1726] p-8">
        <!-- En-tête -->
        <div class="bg-card dark:bg-[#1b2e4b] rounded-[20px] p-8 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-gray-700">
            <div class="flex justify-between items-center gap-8">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-[2.5rem] font-extrabold text-text-dark dark:text-white-light m-0 mb-2">
                        <IconBox class="w-10 h-10 text-primary" />
                        Gestion des inventaires
                    </h1>
                </div>
                <div class="flex gap-4 items-center ml-auto">
                    <button @click="redirectToAdd"
                        class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                        <IconPlus class="w-4 h-4" />
                        <span>Nouveau inventaire</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Table des inventaires -->
        <div v-if="isDataLoaded" class="bg-card dark:bg-[#1b2e4b] rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-gray-700 overflow-hidden md:p-4">
            <DataTable
                :columns="columns"
                :actions="actions"
                :rowDataProp="inventories"
                :serverSidePagination="false"
                :pagination="true"
                storageKey="inventory-management"
                @filter-changed="handleFilterChanged"
                @pagination-changed="handlePaginationChanged"
                @sort-changed="handleSortChanged"
                @global-search-changed="handleGlobalSearchChanged"
            />
        </div>

        <!-- État de chargement -->
        <div v-else class="bg-card dark:bg-[#1b2e4b] rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-gray-700 overflow-hidden md:p-4 flex items-center justify-center min-h-[400px]">
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="text-text-dark dark:text-white-light">Chargement des inventaires...</p>
            </div>
        </div>

        <!--
        Modal d'import d'image de stock
        Note: Cette modal complexe (200+ lignes) pourrait être extraite dans un composant séparé
        pour améliorer la lisibilité et la maintenabilité du fichier principal
        -->
        <div v-if="showImportModal" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-stretch justify-center px-0 h-full text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-text-dark opacity-75" @click="closeImportModalWithCleanup"></div>
                <div class="relative w-full h-full">
                    <InventoryFullscreenModal
                        title="Import de stock image"
                        :inventory="currentImportInventory"
                        :close-disabled="isImporting"
                        :format-date="formatDate"
                        @close="closeImportModalWithCleanup"
                    >
                        <template #main>
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

                            <!-- Messages de feedback -->
                            <div v-if="importSuccess && importSuccessMessage" class="success-message">
                                <IconCircleCheck class="w-5 h-5" />
                                <div>
                                    <h4>Import réussi</h4>
                                    <p>{{ importSuccessMessage }}</p>
                                </div>
                            </div>

                            <div v-if="importError && importErrorDetails" class="error-message">
                                <IconXCircle class="w-5 h-5" />
                                <div>
                                    <h4>Erreur lors de l'import</h4>
                                    <p>{{ importErrorDetails.message }}</p>
                                    <!-- Détails d'erreur simplifiés pour la lisibilité -->
                                    <div v-if="importErrorDetails.errors" class="error-details">
                                        {{ importErrorDetails.errors.length }} erreur(s) de validation
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #sidebar>
                            <div class="instructions">
                                <h4>Instructions d'import</h4>
                                <ul>
                                    <li>Format Excel requis (.xlsx, .xls)</li>
                                    <li>Validation des données obligatoire</li>
                                    <li>Import peut prendre plusieurs minutes</li>
                                </ul>
                            </div>

                            <div class="actions">
                                <button @click="closeImportModalWithCleanup" :disabled="isImporting">
                                    Annuler
                                </button>
                                <button
                                    @click="() => selectedFile && processImportExcelWithProgress(selectedFile)"
                                    :disabled="!selectedFile || isImporting"
                                >
                                    {{ isImporting ? 'Import en cours...' : 'Lancer l\'import' }}
                                </button>
                            </div>
                        </template>
                    </InventoryFullscreenModal>

                    <input type="file" ref="fileInput" @change="handleFileChange" accept=".xlsx,.xls" class="hidden" />
                </div>
            </div>
        </div>

        <!--
        Modal d'ajout de planification
        Note: Cette modal complexe pourrait aussi être extraite dans un composant séparé
        -->
        <div v-if="showPlanningModal" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-stretch justify-center px-0 h-full text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-text-dark opacity-75" @click="closePlanningModal"></div>
                <div class="relative w-full h-full">
                    <InventoryFullscreenModal
                        title="Ajouter planification"
                        :inventory="currentPlanningInventory"
                        :close-disabled="isUploadingPlanning"
                        :format-date="formatDate"
                        @close="closePlanningModal"
                    >
                        <template #main>
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

                            <!-- Messages de feedback simplifiés -->
                            <div v-if="planningSuccess && planningSuccessMessage" class="success-message">
                                <IconCircleCheck class="w-5 h-5" />
                                <div>
                                    <h4>Planification ajoutée avec succès</h4>
                                    <p>{{ planningSuccessMessage }}</p>
                                </div>
                            </div>

                            <div v-if="planningInfoMessage" class="info-message">
                                <IconLoader class="w-5 h-5 animate-spin" />
                                <div>
                                    <h4>Import en cours</h4>
                                    <p>{{ planningInfoMessage }}</p>
                                </div>
                            </div>

                            <div v-if="planningError" class="error-message">
                                <IconXCircle class="w-5 h-5" />
                                <div>
                                    <h4>Erreur</h4>
                                    <p>{{ planningError }}</p>
                                    <div v-if="planningErrorDetails?.length" class="error-details">
                                        {{ planningErrorDetails.length }} erreur(s) détaillées
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #sidebar>
                            <div class="instructions">
                                <h4>Instructions</h4>
                                <ul>
                                    <li>Format Excel requis (.xlsx, .xls)</li>
                                    <li>Validation des données obligatoire</li>
                                    <li>Upload peut prendre plusieurs minutes</li>
                                </ul>
                            </div>

                            <div class="actions">
                                <button @click="closePlanningModal" :disabled="isUploadingPlanning">
                                    Annuler
                                </button>
                                <button
                                    @click="handlePlanningUpload"
                                    :disabled="!planningFile || isUploadingPlanning"
                                >
                                    {{ isUploadingPlanning ? 'Upload en cours...' : 'Lancer l\'upload' }}
                                </button>
                            </div>
                        </template>
                    </InventoryFullscreenModal>

                    <input type="file" ref="planningFileInput" @change="handlePlanningFileChange" accept=".xlsx,.xls" class="hidden" />
                </div>
            </div>
        </div>


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
import DataTable from '@/components/DataTable/DataTable.vue'
import InventoryFullscreenModal from '@/components/Inventory/InventoryFullscreenModal.vue'
import FileInputUpload from '@/components/Upload/FileInputUpload.vue'
import { useInventoryManagement } from '@/composables/useInventoryManagement'

// ===== IMPORTS ICÔNES =====
import IconBox from '@/components/icon/icon-box.vue'
import IconPlus from '@/components/icon/icon-plus.vue'
import IconX from '@/components/icon/icon-x.vue'
import IconLoader from '@/components/icon/icon-loader.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'
import IconInfoCircle from '@/components/icon/icon-info-circle.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'
import IconDownload from '@/components/icon/icon-download.vue'

// ===== COMPOSABLES =====

/**
 * Composable pour la gestion des inventaires
 * Fournit les colonnes, actions, et la logique d'import
 */
const {
    columns,
    actions,
    redirectToAdd,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    handleGlobalSearchChanged,
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

// ===== COMPUTED =====

/**
 * État de débogage pour le bouton d'upload
 */
const uploadButtonDebug = computed(() => {
    const hasFile = !!planningFile.value
    const isUploading = isUploadingPlanning.value
    const isDisabled = !hasFile || isUploading

    console.log('[DEBUG] uploadButtonDebug:', {
        planningFile: planningFile.value,
        hasFile,
        isUploading,
        isDisabled,
        currentPlanningInventory: currentPlanningInventory.value
    })

    return { hasFile, isUploading, isDisabled }
})

// ===== HANDLERS =====

/**
 * Handler pour lancer l'upload de planification
 */
const handlePlanningUpload = async () => {
    console.log('[handlePlanningUpload] >>>>>>>>>>>>> CLIC SUR LE BOUTON DETECTE <<<<<<<<<<<<<')
    console.log('[handlePlanningUpload] Début de la fonction')
    console.log('[handlePlanningUpload] planningFile:', planningFile.value)
    console.log('[handlePlanningUpload] planningFile exists:', !!planningFile.value)
    console.log('[handlePlanningUpload] isUploadingPlanning:', isUploadingPlanning.value)
    console.log('[handlePlanningUpload] currentPlanningInventory:', currentPlanningInventory.value)

    if (planningFile.value) {
        console.log('[handlePlanningUpload] Appel de processPlanningUpload avec le fichier:', planningFile.value.name)
        try {
            await processPlanningUpload(planningFile.value)
            console.log('[handlePlanningUpload] processPlanningUpload terminé avec succès')
        } catch (error) {
            console.error('[handlePlanningUpload] Erreur lors de processPlanningUpload:', error)
        }
    } else {
        console.warn('[handlePlanningUpload] Aucun fichier sélectionné')
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
/* Messages de feedback */
.success-message {
    @apply flex gap-3 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-3.5 mt-2 flex-shrink-0;
}

.success-message h4 {
    @apply text-base font-semibold text-green-900 dark:text-green-100 m-0 mb-1;
}

.success-message p {
    @apply text-sm text-green-700 dark:text-green-300 m-0 font-medium leading-relaxed;
}

.info-message {
    @apply flex gap-3 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-3.5 mt-2 flex-shrink-0;
}

.info-message h4 {
    @apply text-base font-semibold text-blue-900 dark:text-blue-100 m-0 mb-1;
}

.error-message {
    @apply flex gap-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-3.5 mt-2 flex-shrink-0;
}

.error-message h4 {
    @apply text-base font-semibold text-red-900 dark:text-red-100 m-0 mb-1;
}

.error-message p {
    @apply text-sm text-red-700 dark:text-red-300 m-0 font-medium leading-relaxed;
}

.error-details {
    @apply text-xs font-semibold text-red-900 dark:text-red-100 m-0 mb-2;
}

/* Instructions */
.instructions {
    @apply bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-900/30 dark:to-slate-800 border-2 border-blue-200/80 dark:border-blue-800 rounded-xl p-3.5 shadow-md flex-shrink-0 max-h-fit;
}

.instructions h4 {
    @apply text-sm font-semibold m-0 dark:text-blue-100;
}

.instructions ul {
    @apply list-none p-0 m-0 flex flex-col gap-2;
}

.instructions li {
    @apply flex items-start gap-2 p-2 bg-white/60 dark:bg-slate-800/50 rounded-md transition-all duration-200;
}

/* Actions */
.actions {
    @apply bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-md flex-shrink-0;
}

.actions h4 {
    @apply text-sm font-semibold text-slate-900 dark:text-slate-100 m-0 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700;
}

.actions {
    @apply flex flex-col gap-2;
}

.actions button {
    @apply w-full justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm;
}

.actions button:first-child {
    @apply bg-slate-600 text-white hover:bg-slate-700;
}

.actions button:last-child {
    @apply bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-dark hover:to-primary;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
    @apply transition-all duration-300;
}

.slide-up-enter-from {
    @apply opacity-0 transform translate-y-5;
}

.slide-up-leave-to {
    @apply opacity-0 -translate-y-2;
}
</style>
