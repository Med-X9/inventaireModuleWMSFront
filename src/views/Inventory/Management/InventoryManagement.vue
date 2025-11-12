<template>
    <div class="inventory-management-page">
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <i class="icon-inventory"></i>
                    Gestion des inventaires
                </h1>
                <div class="header-actions">
                    <button @click="redirectToAdd" class="btn btn-primary">
                        <i class="icon-plus"></i>
                        Nouvel inventaire
                    </button>
                </div>
            </div>
        </div>

        <div class="page-content">
            <div class="stats-cards">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="icon-preparation"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ getStatusCount('EN PREPARATION') }}</div>
                        <div class="stat-label">En préparation</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="icon-realisation"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ getStatusCount('EN REALISATION') }}</div>
                        <div class="stat-label">En réalisation</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="icon-termine"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ getStatusCount('TERMINE') }}</div>
                        <div class="stat-label">Terminés</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="icon-cloture"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ getStatusCount('CLOTURE') }}</div>
                        <div class="stat-label">Clôturés</div>
                    </div>
                </div>
            </div>

            <div class="datatable-container">
                <DataTable
                    :columns="columns as DataTableColumnAny[]"
                    :rowDataProp="inventories"
                    :actions="actions as ActionConfigAny[]"
                    :pagination="true"
                    :rowSelection="false"
                    :enableFiltering="true"
                    :showColumnSelector="true"
                    :enableGlobalSearch="true"
                    :actionsHeaderName="'Actions'"
                    :exportTitle="'Export des inventaires'"
                    :storageKey="'inventory_management_table'"
                    :maxRowsForDynamicHeight="10"
                    :pageSizeProp="pageSize"
                    :currentPageProp="currentPage"
                    :totalPagesProp="pagination.total_pages"
                    :totalItemsProp="pagination.total"
                    :hasNextPage="pagination.has_next"
                    :hasPreviousPage="pagination.has_previous"
                    :loading="loading"
                    :inlineEditing="false"
                    :enableLazyLoading="true"
                    :enableOptimizations="true"
                    :enableAdvancedEditing="false"
                    :lazyLoadingConfig="{
                        pageSize: 50,
                        debounceDelay: 300,
                        threshold: 0.8
                    }"
                    :optimizationConfig="{
                        rendering: {
                            enableVirtualScrolling: true,
                            enableCellCaching: true,
                            enableDataCompression: true,
                            enablePreRendering: true,
                            enableImageOptimization: true,
                            optimizationThreshold: 100
                        },
                        maxItemsBeforeOptimization: 500,
                        debounceDelay: 16,
                        cellCacheSize: 1000
                    }"
                    @pagination-changed="handlePaginationChanged"
                    @sort-changed="handleSortChanged"
                    @filter-changed="handleFilterChanged"
                    @global-search-changed="handleGlobalSearchChanged"
                    @cell-value-changed="handleCellValueChanged" />
            </div>
        </div>

        <Modal
            v-if="showImportModal"
            v-model="showImportModal"
            title=""
            size="fullscreen">
            <div class="import-modal-content">
                <!-- En-tête professionnel avec gradient -->
                <div class="import-header">
                    <div class="header-background"></div>
                    <div class="header-content-wrapper">
                        <div class="inventory-info">
                            <div class="info-icon">
                                <IconBox />
                            </div>
                            <div class="info-content">
                                <h1 class="info-title">Import de stock image</h1>
                                <div class="info-subtitle-wrapper" v-if="currentImportInventory">
                                    <p class="info-subtitle">{{ currentImportInventory.label }}</p>
                                    <span class="info-badge">{{ currentImportInventory.status }}</span>
                                </div>
                                <div class="info-meta" v-if="currentImportInventory">
                                    <span class="meta-item">
                                        <IconCalendar class="meta-icon" />
                                        {{ formatDate(currentImportInventory.date) }}
                                    </span>
                                    <span class="meta-item" v-if="currentImportInventory.reference">
                                        <span class="meta-icon">#</span>
                                        {{ currentImportInventory.reference }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            @click="closeImportModalWithCleanup"
                            class="btn-close-modal"
                            :disabled="isImporting">
                            <IconX />
                        </button>
                    </div>
                </div>

                <!-- Contenu principal avec layout en deux colonnes -->
                <div class="import-main-content">
                    <!-- Colonne principale - Zone d'upload -->
                    <div class="import-primary-column">

                        <!-- Zone de dépôt de fichier améliorée -->
                        <div
                            class="upload-zone"
                            :class="{
                                'is-dragover': isDragging,
                                'has-file': selectedFile,
                                'is-uploading': isImporting
                            }"
                            @dragover.prevent="handleDragOver"
                            @dragleave.prevent="handleDragLeave"
                            @drop.prevent="handleDrop">
                            <div class="upload-zone-content">
                                <div class="upload-icon-wrapper">
                                    <div class="upload-icon">
                                        <IconUpload />
                                    </div>
                                    <div class="upload-progress-ring" v-if="isImporting">
                                        <svg class="progress-ring" viewBox="0 0 120 120">
                                            <circle class="progress-ring-circle" cx="60" cy="60" r="54" />
                                        </svg>
                                    </div>
                                </div>

                                <div v-if="!selectedFile && !isImporting" class="upload-text">
                                    <h4 class="upload-title">Glissez-déposez votre fichier ici</h4>
                                    <p class="upload-subtitle">ou</p>
                                    <button
                                        @click="() => (fileInput as any)?.click()"
                                        class="btn btn-primary btn-large">
                                        <IconFolder class="icon-inline" />
                                        Parcourir les fichiers
                                    </button>
                                    <p class="upload-hint">
                                        Formats acceptés : .xlsx, .xls (Taille max : 10 MB)
                                    </p>
                                </div>

                                <div v-if="selectedFile && !isImporting" class="file-preview">
                                    <div class="file-icon-large">
                                        <IconFile />
                                    </div>
                                    <div class="file-details">
                                        <h4 class="file-name">{{ selectedFile.name }}</h4>
                                        <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                                        <p class="file-type">{{ getFileType(selectedFile.name) }}</p>
                                    </div>
                                    <button
                                        @click="selectedFile = null"
                                        class="btn-remove-file"
                                        :disabled="isImporting">
                                        <IconX />
                                    </button>
                                </div>

                                <div v-if="isImporting" class="upload-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                                    </div>
                                    <p class="progress-text">
                                        <IconLoader class="icon-spinner" />
                                        Import en cours... {{ uploadProgress }}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Message de succès -->
                        <transition name="slide-up">
                            <div v-if="importSuccess && importSuccessMessage" class="success-message-enhanced">
                                <div class="success-icon">
                                    <IconCircleCheck />
                                </div>
                                <div class="success-content">
                                    <h4 class="success-title">Import réussi</h4>
                                    <p class="success-text">{{ importSuccessMessage }}</p>
                                </div>
                            </div>
                        </transition>

                        <!-- Messages d'erreur améliorés avec détails API -->
                        <transition name="slide-up">
                            <div v-if="importError && importErrorDetails" class="error-message-enhanced">
                                <div class="error-icon">
                                    <IconXCircle />
                                </div>
                                <div class="error-content">
                                    <h4 class="error-title">Erreur lors de l'import</h4>
                                    <p class="error-text">{{ importErrorDetails.message }}</p>

                                    <!-- Informations sur l'inventaire -->
                                    <div v-if="importErrorDetails.inventory_type || importErrorDetails.existing_stocks_count !== null" class="error-info-section">
                                        <div v-if="importErrorDetails.inventory_type" class="error-info-item">
                                            <strong>Type d'inventaire :</strong>
                                            <span class="error-badge-type">{{ importErrorDetails.inventory_type }}</span>
                                        </div>
                                        <div v-if="importErrorDetails.existing_stocks_count !== null" class="error-info-item">
                                            <strong>Stocks existants :</strong>
                                            <span>{{ importErrorDetails.existing_stocks_count }}</span>
                                        </div>
                                    </div>

                                    <!-- Action requise -->
                                    <div v-if="importErrorDetails.action_required" class="error-action-required">
                                        <div class="action-header">
                                            <IconInfoCircle class="action-icon" />
                                            <strong>Action requise :</strong>
                                        </div>
                                        <div class="action-content">
                                            <span v-if="importErrorDetails.action_required === 'DELETE_AND_RECREATE'">
                                                Cet inventaire de type TOURNANT a déjà des stocks importés.
                                                Vous devez supprimer cet inventaire et en créer un nouveau pour importer de nouveaux stocks.
                                            </span>
                                            <span v-else-if="importErrorDetails.action_required === 'FIX_LOCATIONS'">
                                                Problème de configuration des emplacements.
                                                Vérifiez qu'un compte est lié à l'inventaire, qu'un regroupement d'emplacement existe pour ce compte,
                                                et que des emplacements actifs sont disponibles.
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Résumé de l'import -->
                                    <div v-if="importErrorDetails.summary" class="error-summary">
                                        <div class="summary-header">
                                            <strong>Résumé de l'import :</strong>
                                        </div>
                                        <div class="summary-stats">
                                            <div class="stat-item">
                                                <span class="stat-label">Total lignes :</span>
                                                <span class="stat-value">{{ importErrorDetails.summary.total_rows }}</span>
                                            </div>
                                            <div class="stat-item stat-valid">
                                                <span class="stat-label">Lignes valides :</span>
                                                <span class="stat-value">{{ importErrorDetails.summary.valid_rows }}</span>
                                            </div>
                                            <div class="stat-item stat-invalid">
                                                <span class="stat-label">Lignes invalides :</span>
                                                <span class="stat-value">{{ importErrorDetails.summary.invalid_rows }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Liste des erreurs de validation -->
                                    <div v-if="importErrorDetails.errors && importErrorDetails.errors.length > 0" class="error-validation-list">
                                        <div class="validation-header">
                                            <strong>Erreurs de validation ({{ importErrorDetails.errors.length }} ligne(s)) :</strong>
                                        </div>
                                        <div class="validation-errors">
                                            <div
                                                v-for="(errorItem, index) in importErrorDetails.errors"
                                                :key="index"
                                                class="validation-error-item">
                                                <div class="error-row-header">
                                                    <span class="error-row-number">Ligne {{ errorItem.row }}</span>
                                                    <span class="error-count">{{ errorItem.errors.length }} erreur(s)</span>
                                                </div>
                                                <div class="error-messages">
                                                    <div
                                                        v-for="(errorMsg, msgIndex) in errorItem.errors"
                                                        :key="msgIndex"
                                                        class="error-message-item">
                                                        <IconXCircle class="error-msg-icon" />
                                                        <span>{{ errorMsg }}</span>
                                                    </div>
                                                </div>
                                                <div v-if="errorItem.data" class="error-row-data">
                                                    <strong>Données de la ligne :</strong>
                                                    <div class="error-data-grid">
                                                        <div v-if="errorItem.data.article !== undefined" class="data-item">
                                                            <span class="data-label">Article :</span>
                                                            <span class="data-value">{{ errorItem.data.article || '(vide)' }}</span>
                                                        </div>
                                                        <div v-if="errorItem.data.emplacement !== undefined" class="data-item">
                                                            <span class="data-label">Emplacement :</span>
                                                            <span class="data-value">{{ errorItem.data.emplacement || '(vide)' }}</span>
                                                        </div>
                                                        <div v-if="errorItem.data.quantite !== undefined" class="data-item">
                                                            <span class="data-label">Quantité :</span>
                                                            <span class="data-value">{{ errorItem.data.quantite !== null ? errorItem.data.quantite : '(vide)' }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- Colonne secondaire - Instructions et actions -->
                    <div class="import-sidebar-column">
                        <!-- Instructions et informations -->
                        <div class="import-instructions">
                            <div class="instructions-header">
                                <div class="instructions-icon">
                                    <IconInfoCircle />
                                </div>
                                <h4>Instructions d'import</h4>
                            </div>
                            <ul class="instructions-list">
                                <li>
                                    <div class="instruction-icon">
                                        <IconCircleCheck />
                                    </div>
                                    <div class="instruction-text">
                                        <strong>Format requis</strong>
                                        <span>Le fichier Excel doit contenir les colonnes requises pour l'import</span>
                                    </div>
                                </li>
                                <li>
                                    <div class="instruction-icon">
                                        <IconCircleCheck />
                                    </div>
                                    <div class="instruction-text">
                                        <strong>Validation des données</strong>
                                        <span>Assurez-vous que les données sont correctement formatées</span>
                                    </div>
                                </li>
                                <li>
                                    <div class="instruction-icon">
                                        <IconCircleCheck />
                                    </div>
                                    <div class="instruction-text">
                                        <strong>Durée d'import</strong>
                                        <span>L'import peut prendre quelques minutes selon la taille du fichier</span>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- Actions rapides -->
                        <div class="import-actions-card">
                            <h4 class="actions-title">Actions</h4>
                            <div class="actions-buttons">
                                <button
                                    @click="closeImportModalWithCleanup"
                                    class="btn btn-secondary btn-full"
                                    :disabled="isImporting">
                                    <IconX class="icon-inline" />
                                    Annuler
                                </button>
                                <button
                                    @click="() => selectedFile && processImportExcelWithProgress(selectedFile)"
                                    :disabled="!selectedFile || isImporting"
                                    class="btn btn-primary btn-full btn-large">
                                    <IconLoader v-if="isImporting" class="icon-inline icon-spinner" />
                                    <IconDownload v-else class="icon-inline" />
                                    {{ isImporting ? 'Import en cours...' : 'Lancer l\'import' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Input file caché -->
                <input
                    type="file"
                    ref="fileInput"
                    @change="handleFileChange"
                    accept=".xlsx,.xls"
                    class="file-input-hidden" />
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref} from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import Modal from '@/components/Modal.vue';
import { useInventoryManagement } from '@/composables/useInventoryManagement';
import { useInventoryDataTable } from '@/composables/useInventoryDataTable';
import type { DataTableColumnAny, ActionConfigAny } from '@/types/dataTable';

// Import des composants d'icônes
import IconBox from '@/components/icon/icon-box.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconFile from '@/components/icon/icon-file.vue';
import IconLoader from '@/components/icon/icon-loader.vue';
import IconXCircle from '@/components/icon/icon-x-circle.vue';
import IconUpload from '@/components/icon/icon-upload.vue';
import IconFolder from '@/components/icon/icon-folder.vue';
import IconInfoCircle from '@/components/icon/icon-info-circle.vue';
import IconCircleCheck from '@/components/icon/icon-circle-check.vue';
import IconDownload from '@/components/icon/icon-download.vue';

// Utiliser le composable de gestion des inventaires
const {
    columns,
    actions,
    redirectToAdd,
    lazyLoading,
    optimizations,
    showImportModal,
    isImporting,
    importError,
    importErrorDetails,
    importSuccess,
    importSuccessMessage,
    currentImportInventory,
    processImportExcel,
    closeImportModal,
    importStockImageWithModal,
    alertService,
    getStatusCount
} = useInventoryManagement();

// Utiliser le composable spécialisé pour DataTable
const {
    data: inventories,
    loading,
    currentPage,
    pageSize,
    searchQuery,
    sortModel,
    pagination,
    handleFilterChanged,
    handleSortChanged,
    handleSearchChanged: handleGlobalSearchChanged,
    handlePaginationChanged,
    resetFilters,
    refresh
} = useInventoryDataTable();

// État local pour l'import
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement>();
const isDragging = ref(false);
const uploadProgress = ref(0);

// Les handlers sont maintenant gérés par useInventoryDataTable

// Handler pour l'édition des cellules
const handleCellValueChanged = (event: { data: any; field: string; newValue: any; oldValue: any }) => {
    // Ici vous pouvez ajouter la logique pour sauvegarder les modifications
    // Par exemple, appeler une API pour mettre à jour l'inventaire
    // await inventoryStore.updateInventory(event.data.id, { [event.field]: event.newValue });
};

// Handler pour le changement de fichier
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0];
        uploadProgress.value = 0;
    }
};

// Handlers pour le drag & drop
const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragging.value = true;
};

const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    isDragging.value = false;
};

const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    isDragging.value = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        // Vérifier le type de fichier
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            selectedFile.value = file;
            uploadProgress.value = 0;
        } else {
            alertService.error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés');
        }
    }
};

// Fonctions utilitaires de formatage
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toUpperCase();
    return extension ? `Fichier ${extension}` : 'Fichier inconnu';
};

const formatDate = (date: string | Date): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Wrapper pour processImportExcel avec gestion de progression
const processImportExcelWithProgress = async (file: File) => {
    uploadProgress.value = 0

    // Simuler la progression pendant l'upload
    const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
            uploadProgress.value += 10
        }
    }, 200)

    try {
        await processImportExcel(file)
        clearInterval(progressInterval)
        uploadProgress.value = 100
        await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
        clearInterval(progressInterval)
        uploadProgress.value = 0
        throw error
    }
}

// Wrapper pour closeImportModal avec nettoyage
const closeImportModalWithCleanup = () => {
    if (isImporting.value) return // Empêcher la fermeture pendant l'import

    selectedFile.value = null
    uploadProgress.value = 0
    isDragging.value = false
    closeImportModal()
}

// Fonction pour gérer les erreurs de chargement
const handleLoadError = (error: any) => {
    alertService.error('Erreur lors du chargement des inventaires');
};

// Initialisation
onMounted(async () => {
    try {
        // Charger les données initiales
        await refresh();
    } catch (error) {
        handleLoadError(error);
    }
});
</script>

<style scoped>
/* Page principale */
.inventory-management-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    padding: 2rem;
}

.dark .inventory-management-page {
    background: linear-gradient(135deg, #1a202c, #2d3748);
}

/* En-tête de page */
.page-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0;
}

.dark .page-title {
    color: #f7fafc;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

/* Contenu de la page */
.page-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Cartes de statistiques */
.stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: linear-gradient(135deg, #ffffff, #f8fafc);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.dark .stat-card {
    background: linear-gradient(135deg, #2d3748, #4a5568);
    border-color: #4a5568;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.dark .stat-card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #ffffff;
    background: linear-gradient(135deg, #FDCC1D, #fbbf24);
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    line-height: 1;
}

.dark .stat-value {
    color: #f7fafc;
}

.stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
}

.dark .stat-label {
    color: #a0aec0;
}

/* Container du DataTable */
.datatable-container {
    background: #ffffff;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.dark .datatable-container {
    background: #2d3748;
    border-color: #4a5568;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

/* Modal d'import - Design professionnel fullscreen */
.import-modal-content {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.dark .import-modal-content {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}

/* Assurer que le contenu principal ne dépasse pas */
.import-modal-content > * {
    flex-shrink: 0;
}

/* En-tête professionnel avec gradient - réduit */
.import-header {
    position: relative;
    background: linear-gradient(135deg, #FFCC11 0%, #e0ac06 100%);
    padding: 1rem 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    z-index: 10;
    flex-shrink: 0;
}

.dark .import-header {
    background: linear-gradient(135deg, #1b2e4b 0%, #3b3f5c 100%);
}

.header-background {
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
    opacity: 0.1;
}

.header-content-wrapper {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
}

.inventory-info {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    flex: 1;
}

.info-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.info-icon svg {
    width: 1.5rem;
    height: 1.5rem;
}

.info-content {
    flex: 1;
}

.info-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    letter-spacing: -0.01em;
}

.info-subtitle-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}

.info-subtitle {
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
}

.info-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.875rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.8125rem;
}

.meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
}

.meta-icon {
    width: 1rem;
    height: 1rem;
    opacity: 0.8;
    flex-shrink: 0;
}

.btn-close-modal {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.btn-close-modal svg {
    width: 1.25rem;
    height: 1.25rem;
}

.btn-close-modal:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

.btn-close-modal:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Contenu principal en deux colonnes */
.import-main-content {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1rem;
    padding: 1rem 1.5rem;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    max-height: calc(100vh - 150px);
}

@media (max-width: 1024px) {
    .import-main-content {
        grid-template-columns: 1fr;
    }
}

.import-primary-column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
    overflow: hidden;
}

/* Permettre à la zone d'erreur de grandir si nécessaire */
.upload-zone {
    flex-shrink: 0;
}

.error-message-enhanced,
.success-message-enhanced {
    flex: 1 1 auto;
    min-height: 0;
}

.import-sidebar-column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
    overflow: hidden;
}

/* Zone de dépôt de fichier améliorée */
.upload-zone {
    min-height: 0;
    height: 280px;
    border: 3px dashed #d1d5db;
    border-radius: 1rem;
    background: linear-gradient(135deg, #ffffff, #f9fafb);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
}

.upload-zone::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(253, 204, 29, 0.05), rgba(251, 191, 36, 0.05));
    opacity: 0;
    transition: opacity 0.3s ease;
}

.upload-zone.is-dragover {
    border-color: #FFCC11;
    background: linear-gradient(135deg, #FFF3C7, rgba(255, 255, 255, 0.5));
    transform: scale(1.01);
    box-shadow:
        0 20px 25px -5px rgba(255, 204, 17, 0.3),
        0 10px 10px -5px rgba(255, 204, 17, 0.2);
    border-width: 4px;
}

.upload-zone.is-dragover::before {
    opacity: 1;
}

.upload-zone.has-file {
    border-color: #22c55e;
    background: linear-gradient(135deg, #ddf5f0, rgba(255, 255, 255, 0.5));
    box-shadow:
        0 10px 15px -3px rgba(34, 197, 94, 0.2),
        0 4px 6px -2px rgba(34, 197, 94, 0.1);
}

.upload-zone.is-uploading {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #e7f7ff, rgba(255, 255, 255, 0.5));
    box-shadow:
        0 10px 15px -3px rgba(59, 130, 246, 0.2),
        0 4px 6px -2px rgba(59, 130, 246, 0.1);
}

.dark .upload-zone {
    border-color: #4b5563;
    background: linear-gradient(135deg, #1f2937, #111827);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.dark .upload-zone.is-dragover {
    border-color: #FDCC1D;
    background: linear-gradient(135deg, rgba(253, 204, 29, 0.2), rgba(251, 191, 36, 0.15));
}

.upload-zone-content {
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
}

.upload-icon-wrapper {
    position: relative;
    margin-bottom: 1rem;
}

.upload-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFCC11, #e0ac06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0e1726;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 20px -5px rgba(255, 204, 17, 0.4);
}

.upload-icon svg {
    width: 2rem;
    height: 2rem;
}

.upload-zone.is-dragover .upload-icon {
    transform: scale(1.1) rotate(10deg);
    box-shadow: 0 12px 30px -5px rgba(255, 204, 17, 0.5);
}

.upload-progress-ring {
    position: absolute;
    top: -10px;
    left: -10px;
    width: calc(100% + 20px);
    height: calc(100% + 20px);
}

.progress-ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
}

.progress-ring-circle {
    fill: none;
    stroke: #3b82f6;
    stroke-width: 4;
    stroke-dasharray: 339.292;
    stroke-dashoffset: 339.292;
    transition: stroke-dashoffset 0.3s ease;
    animation: progress-ring 2s linear infinite;
}

@keyframes progress-ring {
    0% {
        stroke-dashoffset: 339.292;
    }
    50% {
        stroke-dashoffset: 169.646;
    }
    100% {
        stroke-dashoffset: 0;
    }
}

.upload-text {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}

.upload-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0;
    letter-spacing: -0.01em;
}

.dark .upload-title {
    color: #f7fafc;
}

.upload-subtitle {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
}

.dark .upload-subtitle {
    color: #9ca3af;
}

.upload-hint {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 1rem 0 0 0;
}

.dark .upload-hint {
    color: #6b7280;
}

/* Prévisualisation du fichier améliorée */
.file-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: linear-gradient(135deg, #ffffff, #f1f5f9);
    border: 2px solid #22c55e;
    border-radius: 0.75rem;
    padding: 1rem;
    width: 100%;
    max-width: 600px;
    box-shadow:
        0 8px 12px -3px rgba(34, 197, 94, 0.2),
        0 4px 6px -2px rgba(34, 197, 94, 0.1);
    animation: slideInFile 0.3s ease-out;
}

@keyframes slideInFile {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dark .file-preview {
    background: linear-gradient(135deg, #1b2e4b, #3b3f5c);
    border-color: #22c55e;
}

.file-icon-large {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, #22c55e, #22c55e);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
    box-shadow: 0 6px 12px rgba(34, 197, 94, 0.3);
}

.file-icon-large svg {
    width: 1.5rem;
    height: 1.5rem;
}

.file-details {
    flex: 1;
    min-width: 0;
}

.file-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 0.25rem 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dark .file-name {
    color: #f7fafc;
}

.file-size {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0 0 0.125rem 0;
}

.dark .file-size {
    color: #9ca3af;
}

.file-type {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
}

.dark .file-type {
    color: #6b7280;
}

.btn-remove-file {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.btn-remove-file:hover:not(:disabled) {
    background: #fee2e2;
    transform: scale(1.1);
}

.btn-remove-file:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.dark .btn-remove-file {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fca5a5;
}

/* Barre de progression */
.upload-progress {
    width: 100%;
    max-width: 600px;
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
    margin-bottom: 1rem;
}

.dark .progress-bar {
    background: #374151;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #3b82f6);
    border-radius: 9999px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.progress-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.dark .progress-text {
    color: #9ca3af;
}

/* Instructions améliorées */
.import-instructions {
    background: linear-gradient(135deg, #e7f7ff, rgba(255, 255, 255, 0.8));
    border: 2px solid #e7f7ff;
    border-radius: 0.5rem;
    padding: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    max-height: fit-content;
}

.dark .import-instructions {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), #1b2e4b);
    border-color: #3b82f6;
}

.instructions-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(2, 132, 199, 0.2);
}

.instructions-header h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
}

.instructions-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    background: linear-gradient(135deg, #3b82f6, #3b82f6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    flex-shrink: 0;
}

.instructions-icon svg {
    width: 1.25rem;
    height: 1.25rem;
}

.dark .instructions-header h4 {
    color: #bfdbfe;
}

.instructions-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.instructions-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 0.375rem;
    transition: all 0.2s ease;
}

.instructions-list li:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateX(4px);
}

.dark .instructions-list li {
    background: rgba(30, 58, 95, 0.5);
    color: #93c5fd;
}

.dark .instructions-list li:hover {
    background: rgba(30, 58, 95, 0.8);
}

.instruction-icon {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.375rem;
    background: linear-gradient(135deg, #22c55e, #22c55e);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
}

.instruction-icon svg {
    width: 0.875rem;
    height: 0.875rem;
}

.instruction-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
}

.instruction-text strong {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #075985;
    margin-bottom: 0.125rem;
    line-height: 1.3;
}

.dark .instruction-text strong {
    color: #bfdbfe;
}

.instruction-text span {
    font-size: 0.75rem;
    color: #0369a1;
    line-height: 1.4;
}

.dark .instruction-text span {
    color: #93c5fd;
}

/* Messages d'erreur améliorés */
.error-message-enhanced {
    display: flex;
    gap: 0.75rem;
    background: #fef2f2;
    border: 2px solid #fecaca;
    border-radius: 0.75rem;
    padding: 0.875rem;
    animation: slideIn 0.3s ease;
    margin-top: 0.5rem;
    flex: 0 1 auto;
    min-height: 0;
    max-height: calc(100vh - 420px);
    overflow-y: auto;
    overflow-x: hidden;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dark .error-message-enhanced {
    background: #7f1d1d;
    border-color: #991b1b;
}

.error-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: #fee2e2;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #dc2626;
    flex-shrink: 0;
}

.error-icon svg {
    width: 1.25rem;
    height: 1.25rem;
}

.dark .error-icon {
    background: #991b1b;
    color: #fca5a5;
}

.error-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
}

.error-title {
    font-size: 1rem;
    font-weight: 600;
    color: #991b1b;
    margin: 0;
}

.dark .error-title {
    color: #fca5a5;
}

.error-text {
    font-size: 0.875rem;
    color: #dc2626;
    margin: 0;
    font-weight: 500;
    line-height: 1.4;
}

.dark .error-text {
    color: #fca5a5;
}

/* Section d'information sur l'inventaire */
.error-info-section {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem;
    background: rgba(254, 226, 226, 0.5);
    border-radius: 0.5rem;
    margin-top: 0.25rem;
}

.dark .error-info-section {
    background: rgba(153, 27, 27, 0.3);
}

.error-info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: #991b1b;
}

.dark .error-info-item {
    color: #fca5a5;
}

.error-badge-type {
    padding: 0.25rem 0.5rem;
    background: #dc2626;
    color: #ffffff;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

/* Action requise */
.error-action-required {
    padding: 0.75rem;
    background: #fff7ed;
    border: 2px solid #fed7aa;
    border-radius: 0.5rem;
    margin-top: 0.25rem;
}

.dark .error-action-required {
    background: rgba(154, 52, 18, 0.3);
    border-color: #fb923c;
}

.action-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #9a3412;
    margin-bottom: 0.375rem;
}

.dark .action-header {
    color: #fb923c;
}

.action-icon {
    width: 1rem;
    height: 1rem;
}

.action-content {
    font-size: 0.8125rem;
    color: #7c2d12;
    line-height: 1.4;
}

.dark .action-content {
    color: #fdba74;
}

/* Résumé de l'import */
.error-summary {
    padding: 0.75rem;
    background: rgba(254, 226, 226, 0.5);
    border-radius: 0.5rem;
    margin-top: 0.25rem;
}

.dark .error-summary {
    background: rgba(153, 27, 27, 0.3);
}

.summary-header {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 0.5rem;
}

.dark .summary-header {
    color: #fca5a5;
}

.summary-stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
}

.stat-label {
    color: #991b1b;
    font-weight: 500;
}

.dark .stat-label {
    color: #fca5a5;
}

.stat-value {
    font-weight: 700;
    color: #dc2626;
}

.dark .stat-value {
    color: #fca5a5;
}

.stat-valid .stat-value {
    color: #22c55e;
}

.stat-invalid .stat-value {
    color: #dc2626;
}

/* Liste des erreurs de validation */
.error-validation-list {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 2px solid #fecaca;
}

.dark .error-validation-list {
    border-top-color: #991b1b;
}

.validation-header {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 0.75rem;
}

.dark .validation-header {
    color: #fca5a5;
}

.validation-errors {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
}

.validation-error-item {
    padding: 0.75rem;
    background: #ffffff;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
}

.dark .validation-error-item {
    background: #1f2937;
    border-color: #991b1b;
}

.error-row-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    padding-bottom: 0.375rem;
    border-bottom: 1px solid #fee2e2;
}

.dark .error-row-header {
    border-bottom-color: #991b1b;
}

.error-row-number {
    font-weight: 700;
    color: #dc2626;
    font-size: 0.875rem;
}

.dark .error-row-number {
    color: #fca5a5;
}

.error-count {
    font-size: 0.75rem;
    color: #991b1b;
    padding: 0.25rem 0.5rem;
    background: #fee2e2;
    border-radius: 0.25rem;
}

.dark .error-count {
    color: #fca5a5;
    background: rgba(153, 27, 27, 0.3);
}

.error-messages {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
}

.error-message-item {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: #dc2626;
    line-height: 1.4;
}

.dark .error-message-item {
    color: #fca5a5;
}

.error-msg-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.error-row-data {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #fee2e2;
    font-size: 0.8125rem;
}

.dark .error-row-data {
    border-top-color: #991b1b;
}

.error-row-data strong {
    display: block;
    margin-bottom: 0.375rem;
    color: #991b1b;
    font-size: 0.8125rem;
}

.dark .error-row-data strong {
    color: #fca5a5;
}

.error-data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
}

.data-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.data-label {
    font-size: 0.75rem;
    color: #991b1b;
    font-weight: 500;
}

.dark .data-label {
    color: #fca5a5;
}

.data-value {
    font-size: 0.8125rem;
    color: #374151;
    padding: 0.25rem 0.375rem;
    background: #f9fafb;
    border-radius: 0.25rem;
    font-family: monospace;
}

.dark .data-value {
    color: #d1d5db;
    background: #111827;
}

/* Message de succès */
.success-message-enhanced {
    display: flex;
    gap: 0.75rem;
    background: #f0fdf4;
    border: 2px solid #86efac;
    border-radius: 0.75rem;
    padding: 0.875rem;
    animation: slideIn 0.3s ease;
    margin-top: 0.5rem;
    flex-shrink: 0;
}

.dark .success-message-enhanced {
    background: rgba(20, 83, 45, 0.3);
    border-color: #22c55e;
}

.success-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #22c55e;
    flex-shrink: 0;
}

.success-icon svg {
    width: 1.25rem;
    height: 1.25rem;
}

.dark .success-icon {
    background: rgba(22, 101, 52, 0.3);
    color: #4ade80;
}

.success-content {
    flex: 1;
}

.success-title {
    font-size: 1rem;
    font-weight: 600;
    color: #166534;
    margin: 0 0 0.25rem 0;
}

.dark .success-title {
    color: #4ade80;
}

.success-text {
    font-size: 0.875rem;
    color: #16a34a;
    margin: 0;
    font-weight: 500;
    line-height: 1.4;
}

.dark .success-text {
    color: #4ade80;
}

/* Carte d'actions */
.import-actions-card {
    background: linear-gradient(135deg, #ffffff, #f1f5f9);
    border: 2px solid #f1f5f9;
    border-radius: 0.5rem;
    padding: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.dark .import-actions-card {
    background: linear-gradient(135deg, #1b2e4b, #3b3f5c);
    border-color: #253b5c;
}

.actions-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 0.75rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.dark .actions-title {
    color: #f7fafc;
    border-bottom-color: #4b5563;
}

.actions-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.btn-full {
    width: 100%;
    justify-content: center;
}

/* Styles pour icônes inline */
.icon-inline {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
}

.icon-spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.file-input-hidden {
    display: none;
}

/* Transitions améliorées */
.slide-up-enter-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Boutons */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.btn-primary {
    background: linear-gradient(135deg, #FDCC1D, #fbbf24);
    color: #1a202c;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    transform: translateY(-1px);
}

.btn-secondary {
    background: #6b7280;
    color: #ffffff;
}

.btn-secondary:hover {
    background: #4b5563;
}

.btn-outline {
    background: transparent;
    color: #374151;
    border: 1px solid #d1d5db;
}

.btn-outline:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}

.btn-danger {
    background: #ef4444;
    color: #ffffff;
}

.btn-danger:hover {
    background: #dc2626;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
}

/* Icônes */
.page-title i {
    margin-right: 0.5rem;
    font-size: 1.5rem;
    color: #FDCC1D;
}

.stat-icon i {
    font-size: 1.5rem;
    color: #ffffff;
}

.import-section h3 i {
    margin-right: 0.5rem;
    color: #FDCC1D;
}

.import-section p i {
    margin-right: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
}

.selected-file i {
    color: #FDCC1D;
    font-size: 1.25rem;
}

.error-message i {
    color: #dc2626;
    font-size: 1.25rem;
}

/* Animations */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .inventory-management-page {
        padding: 1rem;
    }

    .header-content {
        flex-direction: column;
        align-items: stretch;
    }

    .stats-cards {
        grid-template-columns: 1fr;
    }

    .import-actions {
        flex-direction: column;
    }
}

@media (max-width: 640px) {
    .page-title {
        font-size: 1.5rem;
    }

    .stat-card {
        padding: 1rem;
    }

    .stat-value {
        font-size: 1.5rem;
    }
}
</style>
