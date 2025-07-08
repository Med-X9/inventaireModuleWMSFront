<template>
    <div class="container mx-auto">

        <!-- DataTable (master) avec édition par cellule activée -->
        <div class="panel datatable">
            <DataTable ref="agGridRef" :columns="columns" :rowDataProp="affecter.displayData.value" :actions="rowActions"
                :pagination="true" :enableFiltering="true" :rowSelection="true" :inlineEditing="true"
                @selection-changed="affecter.onSelectionChanged" @row-clicked="onRowClicked"
                @cell-value-changed="onCellValueChanged" @grid-ready="onGridReady" storageKey="affecter_table"
                :suppressRowClickSelection="true" :suppressCellFocus="true" :singleClickEdit="false">
                <template #table-actions>
                    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 w-full">
                        <!-- Conteneur principal des boutons -->
                        <div class="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 w-full">
                            <!-- Dropdown pour les affectations -->
                            <div class="relative" ref="dropdownRef">
                                <button
                                    @click="toggleDropdown"
                                    @keydown.down.prevent="focusFirstItem"
                                    class="flex items-center justify-end w-full sm:w-auto p-2.5 btn btn-outline-primary btn-sm min-w-fit"
                                    aria-haspopup="true"
                                    :aria-expanded="showDropdown"
                                    type="button"
                                >
                                    <span class="flex items-center gap-2">
                                        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.025m13.5-8.5a2.121 2.121 0 00-3-3L7 9l2.025 2.025M13.5 21V9l-6-6" />
                                        </svg>
                                        <span class="whitespace-nowrap">Affecter</span>
                                    </span>
                                    <svg class="w-4 h-4 ml-2 transition-transform flex-shrink-0" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <transition name="fade">
                                    <ul
                                        v-if="showDropdown"
                                        class="absolute right-0 z-50 mt-2 w-56 bg-white border rounded-xl shadow-lg focus:outline-none max-h-60 overflow-y-auto py-2"
                                        role="menu"
                                        tabindex="-1"
                                        @keydown.esc="closeDropdown"
                                        @keydown.down.prevent="focusNextItem"
                                        @keydown.up.prevent="focusPrevItem"
                                    >
                                        <li v-for="(item, idx) in dropdownItems" :key="item.label">
                                            <button
                                                ref="el => setDropdownItemRef(el, idx)"
                                                class="w-full flex items-center gap-3 text-left px-4 py-2 hover:bg-primary/10 focus:bg-primary/20 transition rounded-lg"
                                                @click="item.action(); closeDropdown()"
                                                @keydown.enter.prevent="item.action(); closeDropdown()"
                                                role="menuitem"
                                            >
                                                <span class="w-5 h-5 flex items-center justify-center">
  <svg v-if="item.icon === 'premier'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 text-primary"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
  <svg v-else-if="item.icon === 'deuxieme'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 text-info"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/><text x="12" y="18" text-anchor="middle" font-size="10" fill="#3b82f6">2</text></svg>
  <svg v-else-if="item.icon === 'ressources'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 text-success"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6H3v6zm0 0l9-9a2.828 2.828 0 114 4l-9 9H3v-4.586z"/></svg>
</span>
                                                <span>{{ item.label }}</span>
                                            </button>
                                            <div v-if="idx < dropdownItems.length - 1" class="border-b border-gray-100 mx-4"></div>
                                        </li>
                                    </ul>
                                </transition>
                            </div>

                            <!-- Conteneur pour les boutons d'action -->
                            <div class="flex  flex-col sm:flex-row gap-2 sm:gap-3">
                                <!-- Bouton Sauvegarder -->
                                <button @click="saveAllChanges" :disabled="!hasUnsavedChanges"
                                    class="btn px-4 sm:px-6 py-2.5 btn-success btn-sm flex items-center justify-center whitespace-nowrap min-w-fit"
                                    :class="{ 'opacity-50 cursor-not-allowed': !hasUnsavedChanges }">
                                    <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Sauvegarder</span>
                                    <span v-if="hasUnsavedChanges"
                                        class="ml-2 bg-white text-success px-2 py-0.5 rounded-full text-xs font-bold">
                                        {{Array.from(pendingChanges.values()).reduce((total, changes) => total +
                                        changes.size, 0) }}
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

                                <!-- Bouton VALIDE -->
                                <button @click="handleVALIDEClick"
                                    class="btn px-4 sm:px-6 py-2.5 btn-primary btn-sm flex items-center justify-center whitespace-nowrap min-w-fit">
                                    <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>VALIDE</span>
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
                <FormBuilder v-model="transferForm" :fields="transferFields" submitLabel="Transférer" :columns="1" />
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import Modal from '@/components/Modal.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { ColDef, CellClassParams, ValueFormatterParams, RowClickedEvent, CellValueChangedEvent, ValueGetterParams, ValueParserParams, ValueSetterParams } from 'ag-grid-community';
import type { ActionConfig, TableRow } from '@/interfaces/dataTable';
import type { FieldConfig } from '@/interfaces/form';
import { useAffecter } from '@/composables/useAffecter';
import { alertService } from '@/services/alertService';
import { MultiSelectCellEditor } from '@/components/DataTable/MultiSelectCellEditor';
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue';

const router = useRouter();
const route = useRoute();
const inventoryReference = route.params.reference as string;
const warehouseReference = route.params.warehouse as string;

const affecter = useAffecter(inventoryReference, warehouseReference);

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
    status: 'planifier' | 'affecter' | 'VALIDE' | 'transfere';
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

    affecter.rows.value.forEach((parentRow) => {
        console.log(`📋 Processing job ${parentRow.id}:`, {
            resourcesList: parentRow.resourcesList,
            isExpanded: expandedResourceIds.value.has(String(parentRow.id))
        });

        // Ligne parent
        newData.push({
            id: String(parentRow.id),
            job: parentRow.job,
            team1: parentRow.team1,
            date1: parentRow.date1,
            team2: parentRow.team2,
            date2: parentRow.date2,
            resources: parentRow.resources,
            resourcesList: parentRow.resourcesList,
            nbResources: parentRow.nbResources,
            locations: parentRow.locations,
            status: (['planifier','affecter','VALIDE','transfere'].includes(String(parentRow.status)) ? String(parentRow.status) : 'planifier') as 'planifier' | 'affecter' | 'VALIDE' | 'transfere',
            isChild: false,
            parentId: null
        });

        // Si on doit déplier les emplacements de ce job
        if (expandedJobIds.value.has(String(parentRow.id))) {
            const locs = parentRow.locations || [];
            locs.forEach((location, index) => {
                newData.push({
                    id: `${String(parentRow.id)}--location--${location}`,
                    job: `└─ ${location}`,
                    team1: '',
                    date1: '',
                    team2: '',
                    date2: '',
                    resources: '',
                    resourcesList: [],
                    nbResources: 0,
                    status: (['planifier','affecter','VALIDE','transfere'].includes(String(parentRow.status)) ? String(parentRow.status) : 'planifier') as 'planifier' | 'affecter' | 'VALIDE' | 'transfere',
                    isChild: true,
                    parentId: String(parentRow.id),
                    childType: 'location'
                });
            });
        }

        // Si on doit déplier les ressources de ce job
        if (expandedResourceIds.value.has(String(parentRow.id))) {
            const resources = parentRow.resourcesList || [];
            console.log(`🔽 Expanding resources for job ${parentRow.id}:`, resources);

            resources.forEach((resource, index) => {
                newData.push({
                    id: `${String(parentRow.id)}--resource--${resource}`,
                    job: '',
                    team1: '',
                    date1: '',
                    team2: '',
                    date2: '',
                    resources: `└─ ${resource}`,
                    resourcesList: [],
                    nbResources: 0,
                    status: (['planifier','affecter','VALIDE','transfere'].includes(String(parentRow.status)) ? String(parentRow.status) : 'planifier') as 'planifier' | 'affecter' | 'VALIDE' | 'transfere',
                    isChild: true,
                    parentId: String(parentRow.id),
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
                case 'VALIDE':
                    badgeClass = 'bg-success-light text-success';
                    statusText = 'VALIDE';
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
            values: ['Team A', 'Team B', 'Team C'] // Placeholder, replace with actual options
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
            values: ['Team X', 'Team Y', 'Team Z'] // Placeholder, replace with actual options
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
            options: ['Resource A', 'Resource B', 'Resource C'] // Placeholder, replace with actual options
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
    // const success = updateJobField(data.id, colDef.field, newValue); // Supprimé
    // if (success) {
        rebuildDisplayData();
    // }
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
const showDropdown = ref(false);

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
};

const focusFirstItem = () => {
    if (dropdownRef.value) {
        const firstItem = dropdownRef.value.querySelector('button');
        if (firstItem) {
            (firstItem as HTMLElement).focus();
        }
    }
};

const closeDropdown = () => {
    showDropdown.value = false;
};

const focusNextItem = () => {
    if (dropdownRef.value) {
        const currentActive = dropdownRef.value.querySelector('.focus-visible');
        const nextButton = currentActive?.nextElementSibling?.querySelector('button');
        if (nextButton) {
            (nextButton as HTMLElement).focus();
        }
    }
};

const focusPrevItem = () => {
    if (dropdownRef.value) {
        const currentActive = dropdownRef.value.querySelector('.focus-visible');
        const prevButton = currentActive?.previousElementSibling?.querySelector('button');
        if (prevButton) {
            (prevButton as HTMLElement).focus();
        }
    }
};

const dropdownItems = ref([
    { label: 'Affecter Premier Comptage', icon: 'premier', action: handleAffecterPremierComptageClick },
    { label: 'Affecter Deuxième Comptage', icon: 'deuxieme', action: handleAffecterDeuxiemeComptageClick },
    { label: 'Affecter Ressources', icon: 'ressources', action: handleActionRessourceClick },
]);

const setDropdownItemRef = (el: HTMLElement, index: number) => {
    // This function is not directly used in the template,
    // but it's part of the original code and should be kept.
    // The template uses v-for to set the ref.
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
        options: [{ value: 'Team A', label: 'Team A' }, { value: 'Team B', label: 'Team B' }, { value: 'Team C', label: 'Team C' }], // Placeholder, replace with actual options
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
    showDropdown.value = false;
}

function handleAffecterDeuxiemeComptageClick() {
    if (!selectedRows.value.length) {
        alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
        return;
    }
    currentTeamType.value = 'deuxieme';
    showTeamModal.value = true;
    showDropdown.value = false;
}

function handleVALIDEClick() {
    if (!selectedRows.value.length) {
        alertService.warning({ text: 'Veuillez sélectionner au moins un job.' });
        return;
    }
    alertService.info({ text: 'La fonction de validation est désactivée pour l\'instant.' });
    // const jobIds = selectedRows.value.map(r => r.id);
    // VALIDEJobs(jobIds); // Supprimé
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
        options: [{ value: 'Resource A', label: 'Resource A' }, { value: 'Resource B', label: 'Resource B' }, { value: 'Resource C', label: 'Resource C' }], // Placeholder, replace with actual options
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
    showDropdown.value = false;
}

async function handleResourceSubmit(data: Record<string, unknown>) {
    const { resources } = data as { resources: string[] };
    const jobIds = selectedRows.value.map(r => r.id);

    alertService.info({ text: 'La fonction d\'affectation de ressources est désactivée pour l\'instant.' });
    // await affecterRessources(jobIds, resources); // Supprimé
    showResourceModal.value = false;
    resourceForm.value = { resources: [] };
    rebuildDisplayData();
}

async function handleTeamSubmit(data: Record<string, unknown>) {
    const { team, date } = data as { team: string; date: string };
    const jobIds = selectedRows.value.map(r => r.id);

    alertService.info({ text: 'La fonction d\'affectation de comptage est désactivée pour l\'instant.' });
    // if (currentTeamType.value === 'premier') {
    //     await affecterAuPremierComptage(team, jobIds, date); // Supprimé
    // } else {
    //     await affecterAuDeuxiemeComptage(team, jobIds, date); // Supprimé
    // }

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
    alertService.info({ text: 'La fonction de transfert de comptage est désactivée pour l\'instant.' });
    // const jobIds = selectedRows.value.map(r => r.id);
    // await transfererJobs(jobIds, { premierComptage, deuxiemeComptage }); // Supprimé

    showTransferModal.value = false;
    transferForm.value = { premierComptage: false, deuxiemeComptage: false };
    rebuildDisplayData();
}

// Événements pour fermer les dropdowns
const dropdownRef = ref<HTMLElement | null>(null);
onMounted(() => {
    affecter.rebuildDisplayData();
});

onUnmounted(() => {
    // document.removeEventListener('click', handleClickOutsideAssignment); // Supprimé
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
            // const success = updateJobField(change.jobId, change.field, change.value); // Supprimé
            // if (success) {
                await saveToDatabase(change.jobId, change.field, change.value);
            // }
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
