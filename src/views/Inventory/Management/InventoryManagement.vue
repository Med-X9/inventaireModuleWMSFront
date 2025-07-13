<template>
    <div class="inventory-management-page">
        <div class="page-header">
            <div class="header-content">
                <div class="header-left">
                    <h1 class="page-title">
                        <IconBox class="title-icon" />
                        Gestion des inventaires
                    </h1>
                </div>
                <div class="header-right">
                    <button class="create-btn" @click="redirectToAdd">
                        <IconPlus class="btn-icon" />
                        <span>Créer un inventaire</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <template v-if="loading">
                <div v-for="i in 4" :key="`stat-skeleton-${i}`" class="stat-card small skeleton-stat">
                    <div class="skeleton-stat-icon"></div>
                    <div class="skeleton-stat-content">
                        <div class="skeleton-stat-value"></div>
                        <div class="skeleton-stat-label"></div>
                    </div>
                </div>
            </template>

            <template v-else>
                <div class="stat-card small">
                    <div class="stat-header">
                        <div class="stat-icon stat-total">
                            <IconInfo class="w-4 h-4" />
                        </div>
                        <div class="stat-value">{{ totalItems }}</div>
                    </div>
                    <div class="stat-label">Total inventaires</div>
                </div>

                <div class="stat-card small">
                    <div class="stat-header">
                        <div class="stat-icon stat-preparation">
                            <IconCalendar class="w-4 h-4" />
                        </div>
                        <div class="stat-value">{{ getStatusCount('EN PREPARATION') }}</div>
                    </div>
                    <div class="stat-label">En préparation</div>
                </div>

                <div class="stat-card small">
                    <div class="stat-header">
                        <div class="stat-icon stat-realisation">
                            <IconCheck class="w-4 h-4" />
                        </div>
                        <div class="stat-value">{{ getStatusCount('EN REALISATION') }}</div>
                    </div>
                    <div class="stat-label">En réalisation</div>
                </div>

                <div class="stat-card small">
                    <div class="stat-header">
                        <div class="stat-icon stat-completed">
                            <IconLock class="w-4 h-4" />
                        </div>
                        <div class="stat-value">{{ getStatusCount('TERMINE') + getStatusCount('CLOTURE') }}</div>
                    </div>
                    <div class="stat-label">Terminés</div>
                </div>
            </template>
        </div>

        <div class="datatable-container">
            <DataTableNew :columns="columns as DataTableColumnAny[]" :rowDataProp="inventories"
                :actions="actions as ActionConfigAny[]" :pagination="true" :rowSelection="false" :enableFiltering="true"
                :showColumnSelector="true" :enableGlobalSearch="true" :actionsHeaderName="'Actions'"
                :exportTitle="'Export des inventaires'" :storageKey="'inventory_management_table'"
                :maxRowsForDynamicHeight="10" :pageSizeProp="10" :currentPageProp="currentPage"
                :totalPagesProp="totalPages" :totalItemsProp="totalItems" :loading="loading"
                :serverSidePagination="true" :serverSideFiltering="true" :serverSideSorting="true" :debounceFilter="500"
                :iconMap="iconMap" @pagination-changed="handlePaginationChanged" @sort-changed="handleSortChanged"
                @filter-changed="handleFilterChanged" @global-search-changed="handleGlobalSearchChanged">
            </DataTableNew>
        </div>

        <Modal v-if="showImportModal" :model-value="showImportModal" @update:modelValue="showImportModal = $event"
            title="Import d'image de stock" size="md">
            <div v-if="isImporting" class="import-loading">
                <div class="loading-spinner">
                    <svg class="animate-spin h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                </div>
                <div class="loading-text">
                    <h3 class="loading-title">Import en cours...</h3>
                    <p class="loading-subtitle">Veuillez patienter pendant le traitement du fichier</p>
                </div>
            </div>
            <template v-else-if="importError">
                <div v-if="typeof importError === 'string'" class="error-content">
                    <div class="error-icon">
                        <IconError class="w-8 h-8" />
                    </div>
                    <div class="error-message">{{ importError }}</div>
                </div>
                <div v-else class="error-details">
                    <div class="error-header">
                        <IconError class="w-6 h-6" />
                        <span class="error-title">{{ (importError as any).message }}</span>
                    </div>
                    <div class="error-table-container">
                        <table class="error-table">
                            <thead>
                                <tr>
                                    <th>Ligne</th>
                                    <th>Article</th>
                                    <th>Emplacement</th>
                                    <th>Quantité</th>
                                    <th>Erreur(s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="err in (importError as any).errors.slice(0, 100)" :key="err.row">
                                    <td>{{ err.row }}</td>
                                    <td>{{ err.data.article }}</td>
                                    <td>{{ err.data.emplacement }}</td>
                                    <td>{{ err.data.quantite }}</td>
                                    <td>
                                        <ul class="error-list">
                                            <li v-for="e in err.errors" :key="e">{{ e }}</li>
                                        </ul>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="(importError as any).errors.length > 100" class="error-footer">
                            ... {{ (importError as any).errors.length - 100 }} autres erreurs non affichées ...
                        </div>
                    </div>
                </div>
            </template>
            <div v-else class="success-content">
                <div class="success-icon">
                    <IconCheck class="w-8 h-8" />
                </div>
                <div class="success-message">Import réussi !</div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-primary" @click="showImportModal = false">Fermer</button>
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useInventoryManagement } from '@/composables/useInventoryManagement';
import DataTableNew from '@/components/DataTable/DataTableNew.vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import Modal from '@/components/Modal.vue';
import type { InventoryTable } from '@/models/Inventory';
import type { DataTableColumnAny, ActionConfigAny } from '@/types/dataTable';

// Import des icônes pour les actions
import IconEye from '@/components/icon/icon-eye.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconTrash from '@/components/icon/icon-trash.vue';
import IconUpload from '@/components/icon/icon-upload.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconCheck from '@/components/icon/icon-check.vue';
import IconBox from '@/components/icon/icon-box.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import IconInfo from '@/components/icon/icon-info-circle.vue';
import IconError from '@/components/icon/icon-x-circle.vue';
import IconCircleCheck from '@/components/icon/icon-circle-check.vue';
import IconLock from '@/components/icon/icon-lock.vue';
import IconSortBoth from '@/components/icon/icon-sort-both.vue';
import IconSortAsc from '@/components/icon/icon-sort-asc.vue';
import IconSortDesc from '@/components/icon/icon-sort-desc.vue';

const {
    inventories,
    loading,
    columns,
    actions,
    redirectToAdd,
    dataTable,
    importStockImageWithModal,
    alertService,
    currentPage,
    totalPages,
    totalItems,
} = useInventoryManagement();

// Extraire les handlers du composable générique
const {
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    handleGlobalSearchChanged
} = dataTable;

// Map d'icônes pour les actions
const iconMap = {
    'icon-eye': IconEye,
    'icon-edit': IconEdit,
    'icon-trash': IconTrash,
    'icon-upload': IconUpload,
    'icon-calendar': IconCalendar,
    'icon-check': IconCheck,
    'icon-plus': IconPlus,
    'icon-settings': IconBox, // Changed from IconSettings to IconBox
    'icon-download': IconDownload,
    'icon-info': IconInfo,
    'icon-error': IconError,
    'icon-circle-check': IconCircleCheck,
    'icon-lock': IconLock,
    'icon-sort-both': IconSortBoth,
    'icon-sort-asc': IconSortAsc,
    'icon-sort-desc': IconSortDesc,
};

// Fonction pour compter les inventaires par statut
const getStatusCount = (status: string) => {
    return inventories.value.filter(inv => inv.status === status).length;
};

// Loader et gestion d'erreur pour l'import Excel
const showImportModal = ref(false);
const isImporting = ref(false);
const importError = ref('');
let currentImportId: number | null = null;

function handleImportExcel(inv: InventoryTable) {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.display = 'none';
    input.addEventListener('change', async (event) => {
        const target = event.target as HTMLInputElement;
        if (!target || !target.files || target.files.length === 0) return;
        const file = target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        showImportModal.value = true;
        isImporting.value = true;
        importError.value = '';
        currentImportId = inv.id;
        await importStockImageWithModal(inv.id, formData, {
            onStart: () => {
                isImporting.value = true;
                importError.value = '';
            },
            onSuccess: async () => {
                isImporting.value = false;
                showImportModal.value = false;
                currentImportId = null;
                await alertService.success({ text: 'Import Excel réussi !' });
                await dataTable.refresh(); // Use dataTable.refresh
            },
            onError: (errMsg) => {
                isImporting.value = false;
                importError.value = errMsg;
            }
        });
        target.value = '';
    });
    document.body.appendChild(input);
    input.click();
}

// Charger les données une fois le composant monté
onMounted(async () => {
    console.log('🚀 Chargement initial des inventaires...');
    await dataTable.refresh(); // Use dataTable.refresh
});

// Fonction pour tester le skeleton loader
const testLoading = async () => {
    console.log('🧪 Test du skeleton loader...');
    await dataTable.refresh(); // Use dataTable.refresh
};
</script>

<style scoped>
/* Page principale */
.inventory-management-page {
    min-height: 100vh;
    background: #ffffff;
    padding: 2rem;
}

/* Header de la page */
.page-header {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
}

.header-left {
    flex: 1;
}

.page-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 2.5rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
}

.title-icon {
    width: 2.5rem;
    height: 2.5rem;
    color: #FACC15;
}

.page-subtitle {
    font-size: 1.1rem;
    color: #64748b;
    margin: 0;
    font-weight: 500;
}

.create-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%);
    color: #1e293b;
    border: none;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(250, 204, 21, 0.3);
    position: relative;
    overflow: hidden;
}

.create-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
}

.create-btn:hover::before {
    left: 100%;
}

.create-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(250, 204, 21, 0.4);
}

.btn-icon {
    width: 1.25rem;
    height: 1.25rem;
}

/* Bouton de test pour le skeleton loader */
.test-loading-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    margin-right: 1rem;
}

.test-loading-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
}

.test-loading-btn:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Grille de statistiques */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--stat-color), var(--stat-color-light));
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-card:nth-child(1),
.stat-card:nth-child(2),
.stat-card:nth-child(3),
.stat-card:nth-child(4) {
    --stat-color: #FACC15;
    --stat-color-light: #EAB308;
    grid-column: span 1;
}

/* Variantes de taille pour les cartes */
.stat-card.small {
    grid-column: span 1;
    padding: 1rem;
    min-height: 70px;
}

.stat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--stat-color) 0%, var(--stat-color-light) 100%);
    color: #1e293b;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.stat-content {
    text-align: left;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 0.25rem;
    line-height: 1;
}

.stat-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

/* Skeleton pour les statistiques */
.skeleton-stat {
    background: #ffffff;
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 70px;
    position: relative;
    overflow: hidden;
}

.skeleton-stat::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FACC15, #EAB308);
}

.skeleton-stat-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
}

.skeleton-stat-content {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
}

.skeleton-stat-value {
    width: 80%;
    height: 1.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
    margin: 0 auto 0.25rem auto;
}

.skeleton-stat-label {
    width: 60%;
    height: 0.75rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
    margin: 0 auto;
}

/* Animation shimmer pour les skeletons */
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}

/* Container du tableau */
.datatable-container {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
}

/* Modale d'import améliorée */
.import-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
}

.loading-spinner {
    margin-bottom: 1.5rem;
}

.loading-text {
    text-align: center;
}

.loading-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.loading-subtitle {
    color: #64748b;
    font-size: 1rem;
}

/* Contenu d'erreur */
.error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    text-align: center;
}

.error-icon {
    color: #ef4444;
    margin-bottom: 1rem;
}

.error-message {
    color: #ef4444;
    font-size: 1rem;
    line-height: 1.6;
    white-space: pre-line;
}

.error-details {
    padding: 1rem;
}

.error-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-radius: 12px;
    border: 1px solid #fecaca;
}

.error-header .error-icon {
    color: #ef4444;
    margin: 0;
}

.error-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #dc2626;
}

.error-table-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #f9fafb;
}

.error-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.error-table th {
    background: #f3f4f6;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
}

.error-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    color: #6b7280;
}

.error-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.error-list li {
    padding: 0.25rem 0;
    color: #ef4444;
    font-size: 0.8rem;
}

.error-footer {
    padding: 1rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.875rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

/* Contenu de succès */
.success-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 2rem;
    text-align: center;
}

.success-icon {
    color: #10b981;
    margin-bottom: 1rem;
}

.success-message {
    font-size: 1.25rem;
    font-weight: 600;
    color: #059669;
}

/* Actions de la modale */
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
}

.modal-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
}

.modal-btn-primary {
    background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%);
    color: #1e293b;
    box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
}

.modal-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(250, 204, 21, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
    .inventory-management-page {
        padding: 1rem;
    }

    .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }

    .page-title {
        font-size: 2rem;
        justify-content: center;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .stat-card {
        padding: 1.5rem;
    }

    .stat-value {
        font-size: 1.75rem;
    }

    .datatable-container {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .page-title {
        font-size: 1.75rem;
    }

    .create-btn {
        padding: 0.75rem 1.5rem;
        font-size: 0.9rem;
    }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    .inventory-management-page {
        background: #ffffff;
    }

    .page-header,
    .stat-card,
    .datatable-container {
        background: #ffffff;
        border-color: #e5e7eb;
    }

    .page-title {
        color: #1e293b;
    }

    .page-subtitle {
        color: #64748b;
    }

    .stat-value {
        color: #1e293b;
    }

    .stat-label {
        color: #64748b;
    }
}
</style>
