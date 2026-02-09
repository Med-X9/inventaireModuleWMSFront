<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <!-- Toolbar normale - toujours visible -->
    <div class="actions-container flex items-center justify-end">

        <!-- Bouton de gestion des colonnes -->
        <div class="action-group" v-if="showColumnSelector">
            <button @click="toggleColumnManager" class="action-btn" title="Gérer les colonnes">
                <IconLayout class="w-3.5 h-3.5" />
                <span>Colonnes</span>
            </button>
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
                        <button @click="exportToSpreadsheet" :class="['dropdown-item', { 'loading': exportLoading.spreadsheet }]"
                            :disabled="exportLoading.spreadsheet">
                            <IconFile class="w-3.5 h-3.5 mr-2" />
                            {{ exportLoading.spreadsheet ? 'Export...' : 'Tableur' }}
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
                        <button @click="exportSelectedToSpreadsheet"
                            :class="['dropdown-item', { 'loading': exportLoading.spreadsheetSelection }]"
                            :disabled="exportLoading.spreadsheetSelection">
                            <IconFile class="w-3.5 h-3.5 mr-2" />
                            {{ exportLoading.spreadsheetSelection ? 'Export...' : 'Tableur (Sélection)' }}
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

interface Props {
    columns: any[]
    visibleColumns: string[]
    columnWidths: Record<string, number>
    rowSelection: boolean
    selectedRows: Set<string>
    exportLoading: {
        csv: boolean
        spreadsheet: boolean
        pdf: boolean
        csvSelection: boolean
        spreadsheetSelection: boolean
    }
    loading?: boolean
    enableColumnPinning?: boolean
    columnPinning?: any
    stickyHeader?: boolean
    defaultVisibleColumnsCount?: number
    showColumnSelector?: boolean
}

interface Emits {
    (e: 'export-csv'): void
    (e: 'export-spreadsheet'): void
    (e: 'export-pdf'): void
    (e: 'export-selected-csv'): void
    (e: 'export-selected-spreadsheet'): void
    (e: 'deselect-all'): void
    (e: 'open-column-manager'): void
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    showColumnSelector: true
})
const emit = defineEmits<Emits>()

const showExportDropdown = ref(false)

const toggleColumnManager = () => {
    emit('open-column-manager')
}

const toggleExportDropdown = () => {
    showExportDropdown.value = !showExportDropdown.value
}


const exportToCsv = () => {
    emit('export-csv')
    showExportDropdown.value = false
}

const exportToSpreadsheet = () => {
    emit('export-spreadsheet')
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

const exportSelectedToSpreadsheet = () => {
    emit('export-selected-spreadsheet')
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
/* Style boutons d'action avec couleurs du thème */
.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    color: var(--color-primary);
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    line-height: 1.5;
    white-space: nowrap;
}

.dark .action-btn {
    background-color: var(--color-bg-card);
    border-color: var(--color-border);
    color: var(--color-primary-light);
}

.action-btn:hover {
    color: var(--color-primary-dark);
    background-color: var(--color-bg-hover);
    border-color: var(--color-border);
}

.dark .action-btn:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-border);
    color: var(--color-primary);
}

.action-btn:active {
    color: var(--color-primary-dark);
    background-color: var(--color-bg-hover);
    border-color: var(--color-border);
    box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
}

.dark .action-btn:active {
    background-color: var(--color-bg-hover);
    border-color: var(--color-border);
}

/* Bouton d'export avec couleurs du thème */
.export-btn {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
}

.dark .export-btn {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
}

.export-btn:hover {
    background-color: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
    color: #fff;
}

.dark .export-btn:hover {
    background-color: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
    color: #fff;
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

/* Export container */
.export-container {
    position: relative;
    display: inline-block;
}

/* Popup du gestionnaire de colonnes */
.column-manager-popup-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
}

.column-manager-popup {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    width: 100%;
    animation: popup-scale 0.2s ease-out;
    overflow: auto;
}

@media (max-width: 640px) {
    .column-manager-popup-overlay {
        padding: 0.5rem;
    }

    .column-manager-popup {
        max-width: 100vw;
        max-height: 100vh;
    }
}

@keyframes popup-scale {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Transitions pour le popup */
.popup-fade-enter-active,
.popup-fade-leave-active {
    transition: opacity 0.2s ease;
}

.popup-fade-enter-active .column-manager-popup,
.popup-fade-leave-active .column-manager-popup {
    transition: transform 0.2s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
    opacity: 0;
}

.popup-fade-enter-from .column-manager-popup,
.popup-fade-leave-to .column-manager-popup {
    transform: scale(0.95);
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
