<template>
    <div class="container mx-auto">

        <!-- DataTable (master) avec édition par cellule activée -->
        <div class="panel datatable">
            <DataTable ref="agGridRef" :columns="columns" :rowDataProp="displayData" :actions="rowActions" :pagination="true"
                :enableFiltering="true" :rowSelection="true" :inlineEditing="true" @selection-changed="onSelectionChanged"
                @row-clicked="onRowClicked" @cell-value-changed="onCellValueChanged" @grid-ready="onGridReady" storageKey="affecter_table"
                :suppressRowClickSelection="true" :suppressCellFocus="true" :singleClickEdit="false">
                <template #table-actions>
                    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 w-full">
                        <!-- Conteneur principal des boutons -->
                        <div class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 w-full overflow-x-auto">
                            <!-- Dropdown pour les affectations -->
                            <div class="relative flex-shrink-0" ref="assignmentDropdownRef">
                                <button @click="toggleAssignmentDropdown"
                                    class="flex items-center justify-between w-full sm:w-auto p-2.5 btn btn-outline-primary btn-sm min-w-fit">
                                    <span class="flex items-center gap-2">
                                        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.025m13.5-8.5a2.121 2.121 0 00-3-3L7 9l2.025 2.025M13.5 21V9l-6-6" />
                                        </svg>
                                        <span class="whitespace-nowrap">Affecter</span>
                                    </span>
                                    <svg class="w-4 h-4 ml-2 transition-transform flex-shrink-0"
                                        :class="{ 'rotate-180': showAssignmentDropdown }" fill="none"
                                        stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div v-if="showAssignmentDropdown"
                                    class="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-72 max-w-xs sm:max-w-none dark:bg-dark-bg dark:border-dark-border dark:text-white-dark bg-white border rounded shadow-lg z-50 p-2"
                                    @click.stop>
                                    <button @click="handleAffecterPremierComptageClick"
                                        class="flex items-center gap-3 w-full text-sm px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-light/10 rounded text-left transition-colors">
                                        <div
                                            class="w-8 h-8 bg-warning-light rounded-full flex items-center justify-center flex-shrink-0">
                                            <span class="text-warning text-xs font-semibold">1</span>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="font-medium text-gray-900 dark:text-white">Premier Comptage
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">Affecter au
                                                premier comptage</div>
                                        </div>
                                    </button>

                                    <button @click="handleAffecterDeuxiemeComptageClick"
                                        class="flex items-center gap-3 w-full text-sm px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-light/10 rounded text-left transition-colors">
                                        <div
                                            class="w-8 h-8 bg-info-light rounded-full flex items-center justify-center flex-shrink-0">
                                            <span class="text-info text-xs font-semibold">2</span>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="font-medium text-gray-900 dark:text-white">Deuxième Comptage
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">Affecter au
                                                deuxième comptage</div>
                                        </div>
                                    </button>

                                    <button @click="handleActionRessourceClick"
                                        class="flex items-center gap-3 w-full text-sm px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-light/10 rounded text-left transition-colors">
                                        <div
                                            class="w-8 h-8 bg-success-light rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="font-medium text-gray-900 dark:text-white">Ressources</div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">Affecter des
                                                ressources</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <!-- Conteneur pour les boutons d'action -->
                            <div class="flex  flex-col sm:flex-row gap-2 sm:gap-3">
                                <!-- Bouton Sauvegarder -->
                                <button @click="saveAllChanges"
                                    :disabled="!hasUnsavedChanges"
                                    class="btn px-4 sm:px-6 py-2.5 btn-success btn-sm flex items-center justify-center whitespace-nowrap min-w-fit"
                                    :class="{ 'opacity-50 cursor-not-allowed': !hasUnsavedChanges }">
                                    <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Sauvegarder</span>
                                    <span v-if="hasUnsavedChanges" class="ml-2 bg-white text-success px-2 py-0.5 rounded-full text-xs font-bold">
                                        {{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) }}
                                    </span>
                                </button>

                                <!-- Bouton Transférer -->
                                <button @click="handleTransfererClick"
                                    class="btn px-4 sm:px-6 py-2.5 btn-primary btn-sm flex items-center justify-center whitespace-nowrap min-w-fit">
                                    <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    <span>Transférer</span>
                                </button>

                                <!-- Bouton Valider -->
                                <button @click="handleValiderClick"
                                    class="btn px-4 sm:px-6 py-2.5 btn-primary btn-sm flex items-center justify-center whitespace-nowrap min-w-fit">
                                    <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Valider</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Modal d'affectation d'équipe -->
        <Modal v-model="showTeamModal" :title="modalTitle">
            <div class="mt-4">
                <FormBuilder v-model="teamForm" :fields="teamFields" @submit="handleTeamSubmit"
                    submitLabel="Affecter" />
            </div>
        </Modal>

        <!-- Modal d'affectation de ressources -->
        <Modal v-model="showResourceModal" title="Affecter Ressources">
            <div class="mt-4">
                <FormBuilder v-model="resourceForm" :fields="resourceFields" @submit="handleResourceSubmit"
                    submitLabel="Affecter" :columns="1" />
            </div>
        </Modal>

        <!-- Modal de transfert -->
        <Modal v-model="showTransferModal" title="Transférer Jobs">
            <div class="mt-4">
                <FormBuilder v-model="transferForm" :fields="transferFields" @submit="handleTransferSubmit"
                    submitLabel="Transférer" :columns="1" />
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import Modal from '@/components/Modal.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { ColDef, CellClassParams, ValueFormatterParams, RowClickedEvent, CellValueChangedEvent, ValueGetterParams, ValueParserParams, ValueSetterParams } from 'ag-grid-community';
import type { ActionConfig, TableRow } from '@/interfaces/dataTable';
import type { FieldConfig } from '@/interfaces/form';
import { useAffecter } from '@/composables/useAffecter';
import { alertService } from '@/services/alertService';
import { MultiSelectCellEditor } from '@/components/DataTable/MultiSelectCellEditor';

const router = useRouter();

const {
    rows,
    affecterAuPremierComptage,
    affecterAuDeuxiemeComptage,
    affecterRessources,
    validerJobs,
    transfererJobs,
    updateJobField,
    teamOptions,
    resourceOptions
} = useAffecter();

// --- Interface explicite pour chaque ligne (row) de la grille ---
interface RowNode extends TableRow {
    id: string;
    job: string;
    team1: string;
    date1: string;
    team2: string;
    date2: string;
    resources: string;
    resourcesList: string[];
    nbResources: number;
    locations?: string[];
    status: 'planifier' | 'affecter' | 'valider' | 'transfere';
}

// --- État pour garder les IDs des jobs "dépliés" ---
const expandedJobIds = ref<Set<string>>(new Set());
const expandedResourceIds = ref<Set<string>>(new Set());

// --- Système de suivi des modifications ---
const pendingChanges = ref<Map<string, Map<string, any>>>(new Map());
const hasUnsavedChanges = computed(() => pendingChanges.value.size > 0);

// --- Data "aplatie" qui sera envoyée à DataTable.vue ---
const displayData = ref<RowNode[]>([]);

// Référence vers la grille AG Grid pour forcer le rafraîchissement
const agGridRef = ref<any>(null);

/**
 * Reconstruit displayData à partir de rows.value (parent only).
 * Pour chaque parent, on l'ajoute. Puis si son ID est dans expandedJobIds,
 * on insère autant de lignes enfant qu'il y a d'emplacements.
 */
function rebuildDisplayData() {
    console.log('🔄 Rebuild display data...');
    console.log('📊 Expanded resource IDs:', Array.from(expandedResourceIds.value));

    const newData: RowNode[] = [];

    rows.value.forEach((parentRow) => {
        console.log(`📋 Processing job ${parentRow.id}:`, {
            resourcesList: parentRow.resourcesList,
            isExpanded: expandedResourceIds.value.has(parentRow.id)
        });

        // Ligne parent
        newData.push({
            id: parentRow.id,
            job: parentRow.job,
            team1: parentRow.team1,
            date1: parentRow.date1,
            team2: parentRow.team2,
            date2: parentRow.date2,
            resources: parentRow.resources,
            resourcesList: parentRow.resourcesList,
            nbResources: parentRow.nbResources,
            locations: parentRow.locations,
            status: parentRow.status,
            isChild: false,
            parentId: null
        });

        // Si on doit déplier les emplacements de ce job
        if (expandedJobIds.value.has(parentRow.id)) {
            const locs = parentRow.locations || [];
            locs.forEach((location, index) => {
                newData.push({
                    id: `${parentRow.id}--location--${location}`,
                    job: `└─ ${location}`,
                    team1: '',
                    date1: '',
                    team2: '',
                    date2: '',
                    resources: '',
                    resourcesList: [],
                    nbResources: 0,
                    status: parentRow.status,
                    isChild: true,
                    parentId: parentRow.id,
                    childType: 'location'
                });
            });
        }

        // Si on doit déplier les ressources de ce job
        if (expandedResourceIds.value.has(parentRow.id)) {
            const resources = parentRow.resourcesList || [];
            console.log(`🔽 Expanding resources for job ${parentRow.id}:`, resources);

            resources.forEach((resource, index) => {
                newData.push({
                    id: `${parentRow.id}--resource--${resource}`,
                    job: '',
                    team1: '',
                    date1: '',
                    team2: '',
                    date2: '',
                    resources: `└─ ${resource}`,
                    resourcesList: [],
                    nbResources: 0,
                    status: parentRow.status,
                    isChild: true,
                    parentId: parentRow.id,
                    childType: 'resource'
                });
            });
        }
    });

    console.log('📊 Final data length:', newData.length);
    displayData.value = newData;

    // Forcer le rafraîchissement de la grille AG Grid
    if (agGridRef.value && agGridRef.value.api) {
        setTimeout(() => {
            agGridRef.value.api.refreshCells();
            agGridRef.value.api.redrawRows();
        }, 100);
    }
}

// Exécution initiale pour remplir displayData
rebuildDisplayData();

// Fonction pour formater les dates en format ISO pour l'éditeur
const dateValueGetter = (params: ValueGetterParams) => {
    if (!params.data || params.data.isChild) return '';
    const dateStr = params.data[params.colDef.field!];
    if (!dateStr) return '';

    // Si c'est déjà une date ISO, la retourner telle quelle
    if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
    }

    // Sinon, essayer de la convertir
    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    } catch {
        return '';
    }
};

// Fonction pour parser les dates depuis l'éditeur
const dateValueParser = (params: ValueParserParams) => {
    if (!params.newValue) return '';

    // Si c'est un objet Date, le convertir en string YYYY-MM-DD
    const newVal = params.newValue;
    if (
        newVal !== null
        && typeof newVal === 'object'
        && Object.prototype.toString.call(newVal) === '[object Date]'
    ) {
        // ici TS sait que newVal est un Date
        return (newVal as Date).toISOString().split('T')[0];
    }

    // Si c'est déjà une string, vérifier le format
    if (typeof params.newValue === 'string') {
        // Format YYYY-MM-DD
        if (params.newValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return params.newValue;
        }

        // Essayer de parser et reformater
        try {
            const date = new Date(params.newValue);
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }

    return '';
};

// Fonction pour setter les valeurs de date
const dateValueSetter = (params: ValueSetterParams) => {
    if (!params.data || params.data.isChild) return false;

    const parsedValue = dateValueParser(params);
    const field = params.colDef.field!;
    const oldValue = params.data[field];

    if (parsedValue !== oldValue) {
        params.data[field] = parsedValue;
        return true;
    }

    return false;
};

// --- Définition des colonnes avec typage explicite ColDef ---
const columns: ColDef[] = [
    {
        headerName: 'Job',
        field: 'job',
        sortable: true,
        filter: 'agTextColumnFilter',
        flex: 2,
        editable: false,
        cellStyle: (params: CellClassParams) => {
            if (!params.data) return undefined;
            if (params.data.isChild) {
                return { paddingLeft: '20px', color: '#666', fontStyle: 'italic', fontSize: '12px' };
            }
            return undefined;
        },
        cellRenderer: (params) => {
            if (!params.data) return '';
            if (!params.data.isChild) {
                const jobId = params.data.id;
                const isExpanded = expandedJobIds.value.has(jobId);
                const hasLocations = params.data.locations && params.data.locations.length > 0;

                if (!hasLocations) {
                    return `<span>${params.value ?? ''}</span>`;
                }

                const arrow = isExpanded
                    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="6 9 12 15 18 9"/>
             </svg>`
                    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="9 6 15 12 9 18"/>
             </svg>`;

                return `
          <div style="display: flex; align-items: center; width: 100%;">
            <span style="cursor: pointer; display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" data-expand-toggle="${jobId}" title="Cliquer pour afficher/masquer les emplacements">
              ${arrow}
            </span>
            <span>${params.value ?? ''}</span>
            <span style="color: #666; font-size: 11px; margin-left: 8px;">(${params.data.locations.length} emplacements)</span>
          </div>`;
            }
            return `${params.value ?? ''}`;
        },
        onCellClicked: (params) => {
            const target = params.event?.target as HTMLElement;
            const expandToggle = target.closest('[data-expand-toggle]');
            if (expandToggle && !params.data?.isChild) {
                const jobId = expandToggle.getAttribute('data-expand-toggle');
                if (jobId) {
                    if (expandedJobIds.value.has(jobId)) {
                        expandedJobIds.value.delete(jobId);
                    } else {
                        expandedJobIds.value.add(jobId);
                    }
                    rebuildDisplayData();
                }
            }
        }
    },
    {
        headerName: 'Statut',
        field: 'status',
        sortable: true,
        filter: 'agTextColumnFilter',
        flex: 1,
        editable: false,
        cellStyle: (params: CellClassParams) => {
            if (!params.data) return undefined;
            if (params.data.isChild) {
                return { color: '#ccc', fontSize: '11px' };
            }
            return undefined;
        },
        cellRenderer: (params) => {
            if (!params.data || params.data.isChild) return '';
            const status = params.value;
            let badgeClass = '';
            let statusText = '';

            switch (status) {
                case 'planifier':
                    badgeClass = 'bg-warning-light text-warning';
                    statusText = 'Planifier';
                    break;
                case 'affecter':
                    badgeClass = 'bg-info-light text-info';
                    statusText = 'Affecter';
                    break;
                case 'valider':
                    badgeClass = 'bg-success-light text-success';
                    statusText = 'Valider';
                    break;
                case 'transfere':
                    badgeClass = 'bg-purple-100 text-purple-800';
                    statusText = 'Transféré';
                    break;
                default:
                    badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
                    statusText = 'Inconnu';
            }

            return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">${statusText}</span>`;
        }
    },
    {
        headerName: 'Équipe Premier Comptage',
        field: 'team1',
        sortable: true,
        filter: 'agTextColumnFilter',
        flex: 1.2,
        editable: (params) => !params.data?.isChild,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: teamOptions.map(option => option.value),
            allowEmpty: true
        },
        suppressKeyboardEvent: (params) => {
            // Désactiver les confirmations automatiques
            return false;
        },
        cellStyle: (params: CellClassParams) => {
            if (!params.data) return undefined;
            if (params.data.isChild) {
                return { color: '#ccc', fontSize: '11px' };
            }
            return undefined;
        },
        valueFormatter: (params: ValueFormatterParams) => {
            if (!params.data) return '';
            if (params.data.isChild) return '';
            return (params.value as string) || '';
        }
    },
    {
        headerName: 'Date Premier Comptage',
        field: 'date1',
        sortable: true,
        filter: 'agDateColumnFilter',
        flex: 1,
        editable: (params) => !params.data?.isChild,
        cellEditor: 'agDateCellEditor',
        cellEditorParams: {
            useFormatter: true,
            browserDatePicker: true
        },
        valueGetter: dateValueGetter,
        valueParser: dateValueParser,
        valueSetter: dateValueSetter,
        suppressKeyboardEvent: (params) => {
            // Désactiver les confirmations automatiques
            return false;
        },
        cellStyle: (params: CellClassParams) => {
            if (!params.data) return undefined;
            if (params.data.isChild) {
                return { color: '#ccc', fontSize: '11px' };
            }
            return undefined;
        },
        valueFormatter: (params: ValueFormatterParams) => {
            if (!params.data) return '';
            if (params.data.isChild) return '';
            if (!params.value) return '';

            try {
                const date = new Date(params.value as string);
                return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
            } catch {
                return '';
            }
        }
    },
    {
        headerName: 'Équipe Deuxième Comptage',
        field: 'team2',
        sortable: true,
        filter: 'agTextColumnFilter',
        flex: 1.2,
        editable: (params) => !params.data?.isChild,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
            values: teamOptions.map(option => option.value),
            allowEmpty: true
        },
        suppressKeyboardEvent: (params) => {
            // Désactiver les confirmations automatiques
            return false;
        },
        cellStyle: (params: CellClassParams) => {
            if (!params.data) return undefined;
            if (params.data.isChild) {
                return { color: '#ccc', fontSize: '11px' };
            }
            return undefined;
        },
        valueFormatter: (params: ValueFormatterParams) => {
            if (!params.data) return '';
            if (params.data.isChild) return '';
            return (params.value as string) || '';
        }
    },
    {
        headerName: 'Date Deuxième Comptage',
        field: 'date2',
        sortable: true,
        filter: 'agDateColumnFilter',
        flex: 1,
        editable: (params) => !params.data?.isChild,
        cellEditor: 'agDateCellEditor',
        cellEditorParams: {
            useFormatter: true,
            browserDatePicker: true
        },
        valueGetter: dateValueGetter,
        valueParser: dateValueParser,
        valueSetter: dateValueSetter,
        suppressKeyboardEvent: (params) => {
            // Désactiver les confirmations automatiques
            return false;
        },
        cellStyle: (params: CellClassParams) => {
            if (!params.data) return undefined;
            if (params.data.isChild) {
                return { color: '#ccc', fontSize: '11px' };
            }
            return undefined;
        },
        valueFormatter: (params: ValueFormatterParams) => {
            if (!params.data) return '';
            if (params.data.isChild) return '';
            if (!params.value) return '';

            try {
                const date = new Date(params.value as string);
                return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
            } catch {
                return '';
            }
        }
    },
    {
        headerName: 'Ressources',
        field: 'resources',
        sortable: true,
        filter: 'agTextColumnFilter',
        flex: 1.5,
        editable: (params) => !params.data?.isChild,
        cellEditor: MultiSelectCellEditor,
        cellEditorParams: {
            options: resourceOptions.map(option => option.value)
        },
        suppressKeyboardEvent: (params) => {
            // Désactiver les confirmations automatiques
            return false;
        },
        cellStyle: (params: CellClassParams) => {
            if (!params.data) return undefined;
            if (params.data.isChild) {
                return { paddingLeft: '20px', color: '#666', fontStyle: 'italic', fontSize: '12px' };
            }
            return undefined;
        },
        cellRenderer: (params) => {
            if (!params.data) return '';
            if (params.data.isChild) {
                return `${params.value ?? ''}`;
            }

            const jobId = params.data.id;
            const isExpanded = expandedResourceIds.value.has(jobId);
            const hasResources = params.data.resourcesList && params.data.resourcesList.length > 0;

            if (!hasResources) {
                return '<span class="text-gray-400">Aucune ressource</span>';
            }

            const arrow = isExpanded
                ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="6 9 12 15 18 9"/>
           </svg>`
                : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="9 6 15 12 9 18"/>
           </svg>`;

            return `
        <div style="display: flex; align-items: center; width: 100%;">
          <span style="cursor: pointer; display: inline-flex; align-items: center; width: 20px; margin-right: 8px;" data-expand-resource="${jobId}" title="Cliquer pour afficher/masquer les ressources">
            ${arrow}
          </span>
          <span style="cursor: pointer; padding: 2px 4px; border-radius: 3px; transition: background-color 0.2s;"
                data-edit-resources="${jobId}"
                title="Double-cliquer pour éditer les ressources"
                onmouseover="this.style.backgroundColor='#f3f4f6'"
                onmouseout="this.style.backgroundColor='transparent'">
            ${params.data.nbResources} ressource${params.data.nbResources > 1 ? 's' : ''}
            <svg style="width: 12px; height: 12px; margin-left: 4px; opacity: 0.6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </span>
        </div>`;
        },
        onCellClicked: (params) => {
            const target = params.event?.target as HTMLElement;
            const expandToggle = target.closest('[data-expand-resource]');
            if (expandToggle && !params.data?.isChild) {
                const jobId = expandToggle.getAttribute('data-expand-resource');
                if (jobId) {
                    console.log('🖱️ Click on resource expand toggle for job:', jobId);
                    console.log('📊 Current expanded resources:', Array.from(expandedResourceIds.value));

                    if (expandedResourceIds.value.has(jobId)) {
                        expandedResourceIds.value.delete(jobId);
                        console.log('🔽 Collapsing resources for job:', jobId);
                    } else {
                        expandedResourceIds.value.add(jobId);
                        console.log('🔼 Expanding resources for job:', jobId);
                    }

                    console.log('📊 Updated expanded resources:', Array.from(expandedResourceIds.value));
                    rebuildDisplayData();
                }
            }
        },
        onCellDoubleClicked: (params) => {
            // Double-clic pour éditer les ressources
            if (!params.data?.isChild && params.data) {
                console.log('🖱️🖱️ Double-click to edit resources for job:', params.data.id);
                // Démarrer l'édition de la cellule
                if (agGridRef.value && agGridRef.value.api) {
                    agGridRef.value.api.startEditingCell({
                        rowIndex: params.rowIndex,
                        colKey: 'resources'
                    });
                }
            }
        }
    }
];

// Gestion des changements de cellules avec système de modifications en attente
function onCellValueChanged(event: CellValueChangedEvent) {
    const { data, colDef, newValue, oldValue } = event;
    if (!data || data.isChild || !colDef.field) return;

    console.log('🔄 Édition de cellule:', {
        jobId: data.id,
        field: colDef.field,
        oldValue,
        newValue
    });

    // Ajouter la modification aux changements en attente
    addPendingChange(data.id, colDef.field, newValue);

    // Mettre à jour l'affichage immédiatement pour l'UX
    const success = updateJobField(data.id, colDef.field, newValue);
    if (success) {
        rebuildDisplayData();
    }
}

// Fonction pour sauvegarder en base de données (optionnel)
async function saveToDatabase(jobId: string, field: string, value: any) {
    try {
        // Simulation d'un appel API
        console.log('💾 Sauvegarde en base:', { jobId, field, value });

        // Exemple d'appel API réel :
        // await api.updateJobField(jobId, field, value);

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        alertService.error({
            title: 'Erreur de sauvegarde',
            text: 'Les modifications n\'ont pas pu être sauvegardées en base de données.'
        });
    }
}

// --- Actions sur chaque ligne "parent" uniquement ---
const rowActions: ActionConfig[] = [
    {
        label: 'Réaffecter Ressources',
        handler: (row: TableRow) => {
            const rowNode = row as RowNode;
            if (rowNode.isChild) return;
            selectedRows.value = [rowNode];
            showResourceModal.value = true;
        }
    },
    {
        label: 'Réaffecter Premier Comptage',
        handler: (row: TableRow) => {
            const rowNode = row as RowNode;
            if (rowNode.isChild) return;
            selectedRows.value = [rowNode];
            currentTeamType.value = 'premier';
            showTeamModal.value = true;
        }
    },
    {
        label: 'Réaffecter Deuxième Comptage',
        handler: (row: TableRow) => {
            const rowNode = row as RowNode;
            if (rowNode.isChild) return;
            if (!rowNode.team1) {
                alertService.warning({ text: 'Le job doit d\'abord avoir un premier comptage.' });
                return;
            }
            selectedRows.value = [rowNode];
            currentTeamType.value = 'deuxieme';
            showTeamModal.value = true;
        }
    },
];

const selectedRows = ref<RowNode[]>([]);

/**
 * Lorsque l'utilisateur coche une checkbox, AG Grid renvoie un tableau complet
 * (parents + enfants). On ne garde ici que les parents (isChild=false).
 */
function onSelectionChanged(rowsData: TableRow[]) {
    selectedRows.value = rowsData.filter((r): r is RowNode => !r.isChild) as RowNode[];
}

/**
 * Gestion du clic sur une ligne - désactivée car on gère maintenant via onCellClicked
 */
function onRowClicked(event: RowClickedEvent) {
    // Ne rien faire ici, la logique est dans onCellClicked des colonnes
}

// --- Gestion du dropdown d'affectation ---
const showAssignmentDropdown = ref(false);
const assignmentDropdownRef = ref<HTMLElement | null>(null);

const toggleAssignmentDropdown = () => {
    showAssignmentDropdown.value = !showAssignmentDropdown.value;
};

const handleClickOutsideAssignment = (event: MouseEvent) => {
    const wrap = assignmentDropdownRef.value;
    if (wrap && !wrap.contains(event.target as Node)) {
        showAssignmentDropdown.value = false;
    }
};

// --- Boutons d'action ---
const showTeamModal = ref(false);
const currentTeamType = ref<'premier' | 'deuxieme'>('premier');

const modalTitle = computed(() =>
    `Affecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`
);

const teamForm = ref<Record<string, unknown>>({
    team: '',
    date: ''
});

const teamFields: FieldConfig[] = [
    {
        key: 'team',
        label: 'Équipe',
        type: 'select',
        searchable: true,
        options: teamOptions,
        validators: [{ key: 'required', fn: v => !!v, msg: 'Équipe requise' }]
    },
    {
        key: 'date',
        label: 'Date',
        type: 'date',
        validators: [{ key: 'required', fn: v => !!v, msg: 'Date requise' }]
    }
];

function handleAffecterPremierComptageClick() {
    if (!selectedRows.value.length) {
        alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
        return;
    }
    currentTeamType.value = 'premier';
    showTeamModal.value = true;
    showAssignmentDropdown.value = false;
}

function handleAffecterDeuxiemeComptageClick() {
    if (!selectedRows.value.length) {
        alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
        return;
    }
    currentTeamType.value = 'deuxieme';
    showTeamModal.value = true;
    showAssignmentDropdown.value = false;
}

function handleValiderClick() {
    if (!selectedRows.value.length) {
        alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
        return;
    }
    const jobIds = selectedRows.value.map(r => r.id);
    validerJobs(jobIds);
    rebuildDisplayData();
}

// État modal ressources
const showResourceModal = ref(false);
const resourceForm = ref({ resources: [] });

const resourceFields: FieldConfig[] = [
    {
        key: 'resources',
        label: 'Ressources',
        type: 'select',
        options: resourceOptions,
        multiple: true,
        searchable: true,
        clearable: true,
        props: {
            placeholder: 'Sélectionnez une ou plusieurs ressources'
        },
        validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Sélectionnez au moins une ressource' }]
    }
];

function handleActionRessourceClick() {
    if (!selectedRows.value.length) {
        alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
        return;
    }
    showResourceModal.value = true;
    showAssignmentDropdown.value = false;
}

async function handleResourceSubmit(data: Record<string, unknown>) {
    const { resources } = data as { resources: string[] };
    const jobIds = selectedRows.value.map(r => r.id);

    await affecterRessources(jobIds, resources);
    showResourceModal.value = false;
    resourceForm.value = { resources: [] };
    rebuildDisplayData();
}

async function handleTeamSubmit(data: Record<string, unknown>) {
    const { team, date } = data as { team: string; date: string };
    const jobIds = selectedRows.value.map(r => r.id);

    if (currentTeamType.value === 'premier') {
        await affecterAuPremierComptage(team, jobIds, date);
    } else {
        await affecterAuDeuxiemeComptage(team, jobIds, date);
    }

    showTeamModal.value = false;
    teamForm.value = { team: '', date: '' };
    rebuildDisplayData();
}

// --- Gestion du modal de transfert ---
const showTransferModal = ref(false);
const transferForm = ref({
    premierComptage: false,
    deuxiemeComptage: false
});

const transferFields: FieldConfig[] = [
    {
        key: 'premierComptage',
        label: 'Premier Comptage',
        type: 'checkbox',
        props: {
            label: 'Transférer le premier comptage',
            description: 'Transférer les affectations du premier comptage'
        }
    },
    {
        key: 'deuxiemeComptage',
        label: 'Deuxième Comptage',
        type: 'checkbox',
        props: {
            label: 'Transférer le deuxième comptage',
            description: 'Transférer les affectations du deuxième comptage'
        }
    }
];

function handleTransfererClick() {
    if (!selectedRows.value.length) {
        alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
        return;
    }
    showTransferModal.value = true;
}

async function handleTransferSubmit(data: Record<string, unknown>) {
    const { premierComptage, deuxiemeComptage } = data as { premierComptage: boolean; deuxiemeComptage: boolean };

    if (!premierComptage && !deuxiemeComptage) {
        alertService.error({
            title: 'Erreur de validation',
            text: 'Vous devez sélectionner au moins un type de comptage à transférer.'
        });
        return;
    }

    const jobIds = selectedRows.value.map(r => r.id);
    await transfererJobs(jobIds, { premierComptage, deuxiemeComptage });

    showTransferModal.value = false;
    transferForm.value = { premierComptage: false, deuxiemeComptage: false };
    rebuildDisplayData();
}

// Événements pour fermer les dropdowns
onMounted(() => {
    document.addEventListener('click', handleClickOutsideAssignment);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutsideAssignment);
});

// Fonction pour ajouter une modification en attente
function addPendingChange(jobId: string, field: string, value: any) {
    if (!pendingChanges.value.has(jobId)) {
        pendingChanges.value.set(jobId, new Map());
    }
    pendingChanges.value.get(jobId)!.set(field, value);
}

// Fonction pour supprimer une modification en attente
function removePendingChange(jobId: string, field: string) {
    const jobChanges = pendingChanges.value.get(jobId);
    if (jobChanges) {
        jobChanges.delete(field);
        if (jobChanges.size === 0) {
            pendingChanges.value.delete(jobId);
        }
    }
}

// Fonction pour sauvegarder toutes les modifications en attente
async function saveAllChanges() {
    if (!hasUnsavedChanges.value) return;

    try {
        const changesToSave: Array<{ jobId: string; field: string; value: any }> = [];

        // Collecter toutes les modifications
        pendingChanges.value.forEach((jobChanges, jobId) => {
            jobChanges.forEach((value, field) => {
                changesToSave.push({ jobId, field, value });
            });
        });

        // Appliquer toutes les modifications
        for (const change of changesToSave) {
            const success = updateJobField(change.jobId, change.field, change.value);
            if (success) {
                await saveToDatabase(change.jobId, change.field, change.value);
            }
        }

        // Vider les modifications en attente
        pendingChanges.value.clear();

        // Reconstruire les données affichées
        rebuildDisplayData();

        // Afficher un message de succès
        alertService.success({
            text: `${changesToSave.length} modification(s) sauvegardée(s) avec succès.`
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde globale:', error);
        alertService.error({
            title: 'Erreur de sauvegarde',
            text: 'Certaines modifications n\'ont pas pu être sauvegardées.'
        });
    }
}

function onGridReady(params: any) {
    // Référence à la grille AG Grid
    agGridRef.value = params.api;
}
</script>

<style scoped>
/* Styles pour les badges de statut */
:deep(.ag-cell) {
    display: flex;
    align-items: center;
}

/* Styles pour les éléments cliquables dans la colonne ressources */
:deep([data-expand-resource]) {
    transition: transform 0.2s ease;
}

:deep([data-expand-resource]:hover) {
    transform: scale(1.1);
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: 4px;
}

:deep([data-edit-resources]) {
    transition: all 0.2s ease;
}

:deep([data-edit-resources]:hover) {
    background-color: rgba(16, 185, 129, 0.1);
    border-radius: 4px;
}

/* Mode sombre */
.dark :deep([data-expand-resource]:hover) {
    background-color: rgba(59, 130, 246, 0.2);
}

.dark :deep([data-edit-resources]:hover) {
    background-color: rgba(16, 185, 129, 0.2);
}
</style>
