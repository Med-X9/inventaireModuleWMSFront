<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <!-- Skeleton loader pour la toolbar pendant le chargement -->
    <div v-if="loading" class="toolbar-skeleton">
        <div class="skeleton-toolbar">
            <div class="skeleton-action-group">
                <div class="skeleton-action-btn"></div>
                <div class="skeleton-action-btn"></div>
            </div>
            <div class="skeleton-action-group">
                <div class="skeleton-action-btn"></div>
                <div class="skeleton-action-btn"></div>
                <div class="skeleton-action-btn"></div>
            </div>
        </div>
    </div>

    <!-- Toolbar normale quand pas de chargement -->
    <div v-else class="actions-container flex items-center justify-end">
        <!-- Gestionnaire de colonnes en premier -->
        <div class="action-group">
            <div class="column-manager-container">
                <button @click="toggleColumnManager" class="action-btn" title="Afficher/Masquer les colonnes">
                    <IconLayout class="w-3.5 h-3.5" />
                </button>
                <div v-if="showColumnManager" class="column-manager-modal">
                    <ColumnManager :columns="columns" :visibleColumns="visibleColumns" :columnWidths="columnWidths"
                        @columns-changed="handleColumnsChanged" @reorder-columns="handleReorderColumns" @close="showColumnManager = false" />
                </div>
            </div>
        </div>

        <!-- Export avec dropdown amélioré en second -->
        <div class="action-group">
            <div class="export-container">
                <button @click="toggleExportDropdown" class="action-btn export-btn" title="Exporter les données">
                    <IconDownload class="w-3.5 h-3.5" />
                    <IconChevronDown class="w-3.5 h-3.5 ml-1 transition-transform" :class="{ 'rotate-180': showExportDropdown }" />
                </button>

                <div v-if="showExportDropdown" class="export-dropdown">
                    <div class="dropdown-header">
                        <IconSettings class="w-3.5 h-3.5" />
                        <span>Format d'export</span>
                    </div>

                    <!-- Export de toutes les données -->
                    <div class="dropdown-section">
                        <div class="dropdown-section-title">Toutes les données</div>
                        <button @click="exportToCsv" :class="['dropdown-item', { 'loading': exportLoading.csv }]"
                            :disabled="exportLoading.csv">
                            <IconFile class="w-3.5 h-3.5 mr-2" />
                            {{ exportLoading.csv ? 'Export...' : 'CSV' }}
                        </button>
                        <button @click="exportToExcel" :class="['dropdown-item', { 'loading': exportLoading.excel }]"
                            :disabled="exportLoading.excel">
                            <IconFile class="w-3.5 h-3.5 mr-2" />
                            {{ exportLoading.excel ? 'Export...' : 'Excel' }}
                        </button>
                        <button @click="exportToPdf" :class="['dropdown-item', { 'loading': exportLoading.pdf }]"
                            :disabled="exportLoading.pdf">
                            <IconFile class="w-3.5 h-3.5 mr-2" />
                            {{ exportLoading.pdf ? 'Export...' : 'PDF' }}
                        </button>
                    </div>

                    <!-- Export de la sélection -->
                    <div v-if="rowSelection && selectedRows.size > 0" class="dropdown-section">
                        <div class="dropdown-section-title">Sélection ({{ selectedRows.size }})</div>
                        <button @click="exportSelectedToCsv"
                            :class="['dropdown-item', { 'loading': exportLoading.csvSelection }]"
                            :disabled="exportLoading.csvSelection">
                            <IconFile class="w-3.5 h-3.5 mr-2" />
                            {{ exportLoading.csvSelection ? 'Export...' : 'CSV (Sélection)' }}
                        </button>
                        <button @click="exportSelectedToExcel"
                            :class="['dropdown-item', { 'loading': exportLoading.excelSelection }]"
                            :disabled="exportLoading.excelSelection">
                            <IconFile class="w-3.5 h-3.5 mr-2" />
                            {{ exportLoading.excelSelection ? 'Export...' : 'Excel (Sélection)' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions de sélection -->
        <div v-if="rowSelection && selectedRows.size > 0" class="selection-actions">
            <div class="selection-info">
                <IconCheck class="w-3.5 h-3.5" />
                <span class="selection-count">{{ selectedRows.size }} sélectionné(s)</span>
            </div>
            <button @click="deselectAll" class="selection-clear-btn">
                <IconX class="w-3.5 h-3.5" />
                <span>Effacer</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { ref } from 'vue'
import IconSettings from '../icon/icon-settings.vue'
import IconCheck from '../icon/icon-check.vue'
import IconX from '../icon/icon-x.vue'
import IconLayout from '../icon/icon-layout.vue'
import IconDownload from '../icon/icon-download.vue'
import IconChevronDown from '../icon/icon-chevron-down.vue'
import IconFile from '../icon/icon-file.vue'
import ColumnManager from './ColumnManager.vue'

interface Props {
    columns: any[]
    visibleColumns: string[]
    columnWidths: Record<string, number>
    rowSelection: boolean
    selectedRows: Set<string>
    exportLoading: {
        csv: boolean
        excel: boolean
        pdf: boolean
        csvSelection: boolean
        excelSelection: boolean
    }
    loading?: boolean
}

interface Emits {
    (e: 'columns-changed', visibleColumns: string[], columnWidths: Record<string, number>): void
    (e: 'reorder-columns', fromIndex: number, toIndex: number): void
    (e: 'export-csv'): void
    (e: 'export-excel'): void
    (e: 'export-pdf'): void
    (e: 'export-selected-csv'): void
    (e: 'export-selected-excel'): void
    (e: 'deselect-all'): void
}

const props = withDefaults(defineProps<Props>(), {
    loading: false
})
const emit = defineEmits<Emits>()

const showColumnManager = ref(false)
const showExportDropdown = ref(false)

const toggleColumnManager = () => {
    showColumnManager.value = !showColumnManager.value
}

const toggleExportDropdown = () => {
    showExportDropdown.value = !showExportDropdown.value
}

const handleColumnsChanged = (newVisibleColumns: string[], newColumnWidths: Record<string, number>) => {
    emit('columns-changed', newVisibleColumns, newColumnWidths)
}

const handleReorderColumns = (fromIndex: number, toIndex: number) => {
    emit('reorder-columns', fromIndex, toIndex)
}

const exportToCsv = () => {
    emit('export-csv')
    showExportDropdown.value = false
}

const exportToExcel = () => {
    emit('export-excel')
    showExportDropdown.value = false
}

const exportToPdf = () => {
    emit('export-pdf')
    showExportDropdown.value = false
}

const exportSelectedToCsv = () => {
    emit('export-selected-csv')
    showExportDropdown.value = false
}

const exportSelectedToExcel = () => {
    emit('export-selected-excel')
    showExportDropdown.value = false
}

const deselectAll = () => {
    emit('deselect-all')
}
</script>

<style scoped>
/* Actions container */
.actions-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.action-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Boutons d'action améliorés */
.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: #ffffff;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.dark .action-btn {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #f7fafc;
}

.action-btn:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .action-btn:hover {
    background-color: #374151;
    border-color: #6b7280;
}

.action-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

/* Bouton d'export spécial */
.export-btn {
    background: linear-gradient(135deg, #FECD1C 0%, #F59E0B 100%);
    border-color: #FECD1C;
    color: #1f2937;
}

.dark .export-btn {
    background: linear-gradient(135deg, #FECD1C 0%, #F59E0B 100%);
    border-color: #FECD1C;
    color: #1f2937;
}

.export-btn:hover {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    border-color: #F59E0B;
    color: #1f2937;
}

.dark .export-btn:hover {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    border-color: #F59E0B;
    color: #1f2937;
}

/* Dropdown d'export amélioré */
.export-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    z-index: 50;
    min-width: 280px;
    max-width: 350px;
    padding: 0;
    overflow: hidden;
}

.dark .export-dropdown {
    background-color: #2d3748;
    border-color: #4a5568;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f8fafc;
}

.dark .dropdown-header {
    border-color: #4a5568;
    background-color: #374151;
}

.dropdown-section {
    padding: 0.5rem 0;
}

.dropdown-section:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
}

.dark .dropdown-section:not(:last-child) {
    border-color: #4a5568;
}

.dropdown-section-title {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.dark .dropdown-section-title {
    color: #9ca3af;
}

.dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.75rem;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
    color: #374151;
}

.dark .dropdown-item {
    color: #f7fafc;
}

.dropdown-item:hover {
    background-color: #f3f4f6;
    color: #1f2937;
}

.dark .dropdown-item:hover {
    background-color: #374151;
    color: #f9fafb;
}

/* Actions de sélection améliorées */
.selection-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 0.5rem;
}

.dark .selection-actions {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    border-color: #3b82f6;
}

.selection-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #0369a1;
    font-weight: 500;
}

.dark .selection-info {
    color: #93c5fd;
}

.selection-count {
    font-size: 0.875rem;
    font-weight: 600;
}

.selection-clear-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: none;
    border: 1px solid #fca5a5;
    border-radius: 0.375rem;
    color: #dc2626;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.dark .selection-clear-btn {
    border-color: #f87171;
    color: #fca5a5;
}

.selection-clear-btn:hover {
    background-color: #fef2f2;
    border-color: #f87171;
    color: #b91c1c;
}

.dark .selection-clear-btn:hover {
    background-color: #7f1d1d;
    border-color: #fca5a5;
    color: #fecaca;
}

/* Gestionnaire de colonnes */
.column-manager-container {
    position: relative;
    display: inline-block;
}

/* Export container */
.export-container {
    position: relative;
    display: inline-block;
}

.column-manager-modal {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    margin-top: 0.5rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 300px;
    max-width: 500px;
}

.dark .column-manager-modal {
    background-color: #2d3748;
    border-color: #4a5568;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

/* Transitions */
.transition-transform {
    transition: transform 0.2s ease-in-out;
}

.rotate-180 {
    transform: rotate(180deg);
}

/* Responsive */
@media (max-width: 768px) {
    .actions-container {
        flex-direction: column;
        width: 100%;
        gap: 0.75rem;
    }

    .action-group {
        justify-content: center;
        width: 100%;
    }

    .action-btn {
        flex: 1;
        justify-content: center;
    }

    .selection-actions {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
    }
}

/* Skeleton pour la toolbar */
.toolbar-skeleton {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    overflow: hidden;
}

.dark .toolbar-skeleton {
    background-color: #1a202c;
    border-color: #4a5568;
}

.skeleton-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #ffffff;
    border-bottom: 1px solid #e9ecef;
}

.dark .skeleton-toolbar {
    background-color: #1a202c;
    border-color: #4a5568;
}

.skeleton-action-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.skeleton-action-btn {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.375rem;
}

.dark .skeleton-action-btn {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

/* Animation shimmer */
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}
</style>
