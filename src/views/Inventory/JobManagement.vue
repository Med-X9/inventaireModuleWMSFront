<template>
    <div class="job-management">
        <!-- En-tête -->
        <div class="page-header">
            <h1 class="page-title">Gestion des Jobs</h1>
        </div>

        <div class="filters-section">
            <div class="filter-group">
                <label for="warehouse-select" class="filter-label">Magasin :</label>
                <select
                    id="warehouse-select"
                    v-model="selectedWarehouse"
                    @change="onWarehouseChange"
                    class="warehouse-select"
                >
                    <option value="">Tous les magasins</option>
                    <option
                        v-for="warehouse in warehouses"
                        :key="warehouse.id"
                        :value="warehouse.id"
                    >
                        {{ warehouse.name }}
                    </option>
                </select>
            </div>

            <div class="filter-group">
                <label for="status-filter" class="filter-label">Statut :</label>
                <select
                    id="status-filter"
                    v-model="selectedStatus"
                    @change="onStatusChange"
                    class="status-select"
                >
                    <option value="">Tous les statuts</option>
                    <option value="TRANSFERE">Transféré</option>
                    <option value="ENTAME">Entamé</option>
                    <option value="CLOTURE">Clôturé</option>
                </select>
            </div>
        </div>

        <div class="jobs-table-container">
            <DataTable
                ref="jobsTable"
                :columns="jobsColumns"
                :actions="jobsActions"
                :rowDataProp="jobs"
                :loading="loading"
                :pagination="true"
                :serverSidePagination="false"
                :currentPageProp="pagination.page"
                :totalItemsProp="pagination.total"
                :pageSizeProp="pagination.pageSize"
                :rowSelection="true"
                :enableFiltering="true"
                :enableGlobalSearch="true"
                @pagination-changed="onPaginationChanged"
                @sort-changed="onSortChanged"
                @filter-changed="onFilterChanged"
                @selection-changed="onSelectionChanged"
            />
        </div>

        <div v-if="selectedJobs.length > 0" class="bulk-actions">
            <div class="bulk-info">
                {{ selectedJobs.length }} job(s) sélectionné(s)
            </div>
            <div class="bulk-buttons">
                <button @click="bulkValidate" class="btn btn-success">
                    Valider la sélection
                </button>
                <button @click="bulkAssign" class="btn btn-primary">
                    Affecter des opérateurs
                </button>
            </div>
        </div>

        <!-- Modal d'affectation d'opérateurs -->
        <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Affecter des opérateurs</h3>
                    <button @click="closeAssignModal" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Premier opérateur :</label>
                        <select v-model="assignForm.firstOperator" class="form-select">
                            <option value="">Sélectionner un opérateur</option>
                            <option
                                v-for="operator in operators"
                                :key="operator.id"
                                :value="operator.id"
                            >
                                {{ operator.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Deuxième opérateur :</label>
                        <select v-model="assignForm.secondOperator" class="form-select">
                            <option value="">Sélectionner un opérateur</option>
                            <option
                                v-for="operator in operators"
                                :key="operator.id"
                                :value="operator.id"
                            >
                                {{ operator.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="closeAssignModal" class="btn btn-secondary">
                        Annuler
                    </button>
                    <button @click="confirmAssign" class="btn btn-primary">
                        Affecter
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import DataTable from '@/components/DataTable/DataTable.vue'
import { useJobManagementPage } from '@/composables/useJobManagementPage'

// Utilisation du composable pour toute la logique
const {
    // État réactif
    jobs,
    warehouses,
    operators,
    selectedWarehouse,
    selectedStatus,
    selectedJobs,
    loading,
    showAssignModal,
    pagination,
    assignForm,

    // Propriétés calculées
    jobsColumns,
    jobsActions,

    // Gestionnaires d'événements
    onWarehouseChange,
    onStatusChange,
    onPaginationChanged,
    onSortChanged,
    onFilterChanged,
    onSelectionChanged,

    // Actions
    bulkValidate,
    bulkAssign,
    closeAssignModal,
    confirmAssign
} = useJobManagementPage()
</script>

<style scoped>
.job-management {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
}

.btn-primary {
    background-color: #FECD1C;
    border-color: #FECD1C;
    color: #1f2937;
}

.btn-primary:hover {
    background-color: #f59e0b;
}

.btn-secondary {
    background-color: #6b7280;
    border-color: #6b7280;
    color: white;
}

.btn-secondary:hover {
    background-color: #4b5563;
}

.btn-success {
    background-color: #10b981;
    border-color: #10b981;
    color: white;
}

.btn-success:hover {
    background-color: #059669;
}

.filters-section {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.warehouse-select,
.status-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: white;
    color: #1f2937;
    min-width: 200px;
    font-size: 0.875rem;
}

.warehouse-select:focus,
.status-select:focus {
    outline: none;
    border-color: #FECD1C;
    box-shadow: 0 0 0 2px rgba(254, 205, 28, 0.2);
}

.jobs-table-container {
    margin-bottom: 1.5rem;
}

.bulk-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.5rem;
    margin-top: 1rem;
}

.bulk-info {
    font-size: 0.875rem;
    color: #1e40af;
    font-weight: 500;
}

.bulk-buttons {
    display: flex;
    gap: 0.75rem;
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
    margin: 1rem;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
}

.modal-close:hover {
    background-color: #f3f4f6;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
}

.form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: white;
    color: #1f2937;
    font-size: 0.875rem;
}

.form-select:focus {
    outline: none;
    border-color: #FECD1C;
    box-shadow: 0 0 0 2px rgba(254, 205, 28, 0.2);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
}

/* Styles pour le bouton d'action saisie dans le DataTable */
:deep(.action-saisie-btn) {
    background-color: #FECD1C;
    border: 1px solid #FECD1C;
    color: #1f2937;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

:deep(.action-saisie-btn:hover) {
    background-color: #f59e0b;
    border-color: #f59e0b;
}

/* Responsive */
@media (max-width: 768px) {
    .job-management {
        padding: 1rem;
    }

    .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .header-actions {
        justify-content: space-between;
    }

    .filters-section {
        flex-direction: column;
        gap: 1rem;
    }

    .warehouse-select,
    .status-select {
        min-width: auto;
    }

    .bulk-actions {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .bulk-buttons {
        justify-content: space-between;
    }

    .modal-content {
        margin: 0.5rem;
    }
}

@media (max-width: 480px) {

    .modal-header,
    .modal-body,
    .modal-footer {
        padding: 1rem;
    }

    .modal-footer {
        flex-direction: column;
    }
}
</style>
