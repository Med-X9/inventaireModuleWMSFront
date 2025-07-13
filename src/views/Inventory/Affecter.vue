<template>
    <div class="container mx-auto p-4">
        <!-- Header avec titre et statistiques -->
        <div class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Gestion des Affectations
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        Affectez les équipes et ressources aux jobs d'inventaire
                    </p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {{displayData.filter(row => !row.isChild).length}} jobs
                        </span>
                    </div>
                    <div class="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-medium text-green-700 dark:text-green-300">
                            {{ hasUnsavedChanges ? 'Modifications en attente' : 'À jour' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- DataTableNew avec édition par cellule activée -->


        <!-- Barre d'actions fusionnée -->
        <div class="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <!-- Informations de sélection et statut -->
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ selectedRows.length }} job{{ selectedRows.length > 1 ? 's' : '' }} sélectionné{{ selectedRows.length > 1 ? 's' : '' }}
                        </span>
                    </div>
                    <div v-if="hasUnsavedChanges" class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span class="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                            {{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) }} modification{{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) > 1 ? 's' : '' }} en attente
                        </span>
                    </div>
                    <div v-else class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span class="text-sm text-green-700 dark:text-green-300 font-medium">
                            À jour
                        </span>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex flex-col sm:flex-row gap-3">
                    <!-- Dropdown pour les affectations -->
                    <div class="relative" ref="dropdownRef">
                        <button @click="toggleDropdown" @keydown.down.prevent="focusFirstItem"
                            class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-haspopup="true" :aria-expanded="showDropdown" type="button">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.025m13.5-8.5a2.121 2.121 0 00-3-3L7 9l2.025 2.025M13.5 21V9l-6-6" />
                            </svg>
                            <span>Affecter</span>
                            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <transition name="dropdown" appear>
                            <ul v-if="showDropdown"
                                class="absolute right-0 z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl focus:outline-none max-h-60 overflow-y-auto py-2"
                                role="menu" tabindex="-1" @keydown.esc="closeDropdown"
                                @keydown.down.prevent="focusNextItem" @keydown.up.prevent="focusPrevItem">
                                <li v-for="(item, idx) in dropdownItems" :key="item.label">
                                    <button ref="el => setDropdownItemRef(el, idx)"
                                        class="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-100 dark:focus:bg-blue-900/30 transition-colors duration-150 rounded-lg mx-2"
                                        @click="item.action(); closeDropdown()"
                                        @keydown.enter.prevent="item.action(); closeDropdown()" role="menuitem">
                                        <span class="w-6 h-6 flex items-center justify-center rounded-lg" :class="{
                                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': item.icon === 'premier',
                                            'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400': item.icon === 'deuxieme',
                                            'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': item.icon === 'ressources'
                                        }">
                                            <svg v-if="item.icon === 'premier'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <svg v-else-if="item.icon === 'deuxieme'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <svg v-else-if="item.icon === 'ressources'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6H3v6zm0 0l9-9a2.828 2.828 0 114 4l-9 9H3v-4.586z" />
                                            </svg>
                                        </span>
                                        <span class="font-medium text-gray-900 dark:text-white">{{ item.label }}</span>
                                    </button>
                                    <div v-if="idx < dropdownItems.length - 1" class="border-b border-gray-100 dark:border-gray-700 mx-4 my-1"></div>
                                </li>
                            </ul>
                        </transition>
                    </div>

                    <!-- Bouton Pret -->
                    <button @click="handleValiderClick"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pret</span>
                    </button>

                    <!-- Bouton Sauvegarder -->
                    <button @click="saveAllChanges" :disabled="!hasUnsavedChanges"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        :class="hasUnsavedChanges
                            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg focus:ring-green-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Sauvegarder</span>
                        <span v-if="hasUnsavedChanges" class="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) }}
                        </span>
                    </button>
                </div>
            </div>
        </div>
        <div
            class="panel datatable bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTableNew ref="dataTableRef" :columns="columns" :rowDataProp="displayData" :actions="[]"
                :pagination="true" :enableFiltering="true" :rowSelection="true" :inlineEditing="true"
                :serverSidePagination="true" :serverSideFiltering="true" :serverSideSorting="true" :debounceFilter="500"
                :currentPageProp="currentPage" :totalPagesProp="totalPages" :totalItemsProp="totalItems"
                :loading="loading" @selection-changed="onSelectionChanged" @row-clicked="onRowClicked"
                @cell-value-changed="onCellValueChanged" @pagination-changed="handlePaginationChanged"
                @sort-changed="handleSortChanged" @filter-changed="handleFilterChanged"
                @global-search-changed="handleGlobalSearchChanged" storageKey="affecter_table"
                :exportTitle="'Affecter_Jobs'" />
        </div>

        <!-- Modals avec styles améliorés -->
        <Modal v-model="showTeamModal" :title="modalTitle" class="modern-modal">
            <div class="mt-4">
                <FormBuilder v-model="teamForm" :fields="teamFields" @submit="handleTeamSubmit"
                    submitLabel="Affecter" />
            </div>
        </Modal>

        <Modal v-model="showResourceModal" title="Affecter Ressources" class="modern-modal">
            <div class="mt-4">
                <FormBuilder v-model="resourceForm" :fields="resourceFields" @submit="handleResourceSubmit"
                    submitLabel="Affecter" :columns="1" />
            </div>
        </Modal>

        <Modal v-model="showTransferModal" title="Transférer Jobs" class="modern-modal">
            <div class="mt-4">
                <FormBuilder v-model="transferForm" :fields="transferFields" submitLabel="Transférer" :columns="1" />
            </div>
        </Modal>
    </div>
</template>


<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import DataTableNew from '@/components/DataTable/DataTableNew.vue';
import Modal from '@/components/Modal.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { DataTableColumn } from '@/types/dataTable';
import { useAffecter } from '@/composables/useAffecter';
import { useSessionStore } from '@/stores/session';
import { useResourceStore } from '@/stores/resource';
import { computed, onMounted, watch } from 'vue';

const route = useRoute();
const inventoryReference = route.params.reference as string;
const warehouseReference = route.params.warehouse as string;

// Utilisation du composable migré
const affecter = useAffecter(inventoryReference, warehouseReference);

// Destructuration des propriétés du composable
const {
    displayData,
    selectedRows,
    pendingChanges,
    hasUnsavedChanges,
    dataTableRef,
    dropdownRef,
    showDropdown,
    showTeamModal,
    showResourceModal,
    showTransferModal,
    modalTitle,
    teamForm,
    teamFields,
    resourceForm,
    resourceFields,
    transferForm,
    transferFields,
    dropdownItems,
    saveAllChanges,
    onCellValueChanged,
    onSelectionChanged,
    onRowClicked,
    toggleDropdown,
    focusFirstItem,
    closeDropdown,
    focusNextItem,
    focusPrevItem,
    handleValiderClick,
    handleResourceSubmit,
    handleTeamSubmit,
    // Pagination et filtrage
    currentPage,
    totalPages,
    totalItems,
    loading,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    handleGlobalSearchChanged,
    loadSessionsIfNeeded,
} = affecter;

// Utilisation du store pour les sessions
const sessionStore = useSessionStore();

// Utilisation du store pour les ressources
const resourceStore = useResourceStore();

// Computed réactif pour les options des sessions
const sessionOptions = computed(() => {
    return sessionStore.getAllSessions.map(session => ({
        value: session.username,
        label: session.username
    }));
});

const resourceOptions = computed(() => {
    return resourceStore.getResources.map(resource => ({
        value: resource.reference,
        label: resource.ressource_nom || resource.reference || `Ressource ${resource.reference}`
    }));
});



// Computed réactif pour les colonnes qui se met à jour quand les sessions changent
const columns = computed((): DataTableColumn[] => [
    {
        field: 'job',
        headerName: 'Job',
        sortable: true,
        filterable: true,
        width: 80,
        flex: 1,
        editable: false,
        dataType: 'text',
        nestedData: {
            key: 'locations',
            displayKey: 'location_reference',
            countSuffix: 'emplacements',
            expandable: true,
        }
    },
    {
        field: 'status',
        headerName: 'Statut',
        sortable: true,
        filterable: true,
        width: 40,
        flex: 1,
        editable: false,
        dataType: 'select',
        editValueFormatter: (value: any, row: any) => {
            if (!value || value === '') {
                return 'Sélectionner un statut...';
            }
            return value;
        },
        filterConfig: {
            dataType: 'select',
            operator: 'equals',
            options: [
                { value: 'AFFECTE', label: 'AFFECTE' },
                { value: 'VALIDE', label: 'VALIDE' },
                { value: 'TRANSFERE', label: 'TRANSFERE' }
            ]
        },
        badgeStyles: [
            { value: 'VALIDE', class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset' },
            { value: 'AFFECTE', class: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset' },
            { value: 'TRANSFERE', class: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset' },
        ],
        badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
    },
    {
        field: 'team1',
        headerName: 'Équipe 1er Comptage',
        sortable: true,
        filterable: true,
        width: 80,
        flex: 1,
        editable: true,
        dataType: 'select',
        editValueFormatter: (value: any, row: any) => {
            if (!value || value === '') {
                return 'Sélectionner une équipe...';
            }
            return value;
        },
        filterConfig: {
            dataType: 'select',
            operator: 'equals',
            options: sessionOptions.value
        }
    },
    {
        field: 'date1',
        headerName: 'Date 1er Comptage',
        sortable: true,
        filterable: true,
        width: 80,
        flex: 1,
        editable: true,
        dataType: 'date',
        editValueFormatter: (value: any, row: any) => {
            if (!value || value === '') {
                return 'Choisir une date...';
            }
            // Formater la date pour l'affichage pendant l'édition
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return '';
                return date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            } catch {
                return value;
            }
        }
    },
    {
        field: 'team2',
        headerName: 'Équipe 2e Comptage',
        sortable: true,
        filterable: true,
        width: 80,
        flex: 1,
        editable: true,
        dataType: 'select',
        editValueFormatter: (value: any, row: any) => {
            if (!value || value === '') {
                return 'Sélectionner une équipe...';
            }
            return value;
        },
        filterConfig: {
            dataType: 'select',
            operator: 'equals',
            options: sessionOptions.value
        }
    },
    {
        field: 'date2',
        headerName: 'Date 2e Comptage',
        sortable: true,
        filterable: true,
        width: 100,
        flex: 1,
        editable: true,
        dataType: 'date',
        editValueFormatter: (value: any, row: any) => {
            if (!value || value === '') {
                return 'Choisir une date...';
            }
            // Formater la date pour l'affichage pendant l'édition
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return '';
                return date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            } catch {
                return value;
            }
        }
    },
    {
        field: 'resources',
        headerName: 'Ressources',
        sortable: true,
        filterable: true,
        width: 100,
        flex: 1,
        editable: true,
        dataType: 'select',
        multiple: true, // Sélection multiple activée
        editValueFormatter: (value: any, row: any) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                return 'Sélectionner des ressources...';
            }
            // Pour les sélections multiples, afficher les valeurs séparées par des virgules
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return value;
        },
        filterConfig: {
            dataType: 'select',
            operator: 'equals',
            options: resourceOptions.value
        },
        nestedData: {
            key: 'resourcesList',
            displayKey: 'name',
            countSuffix: 'ressources',
            expandable: true,
        }
    }
]);

// Charger les sessions au montage du composant
onMounted(async () => {
    await loadSessionsIfNeeded();

    // Charger les ressources si elles ne sont pas déjà chargées
    if (resourceStore.getResources.length === 0) {
        await resourceStore.fetchResources();
    }
});

// Watcher pour forcer la mise à jour du DataTable quand les sessions changent
watch(sessionOptions, (newOptions) => {
    // Les colonnes sont déjà réactives grâce au computed, pas besoin de forcer la mise à jour
}, { deep: true });

// Watcher pour les ressources
watch(resourceOptions, (newOptions) => {
    // Les colonnes se mettent à jour automatiquement grâce au computed
}, { deep: true });


// Fonction pour parser les dates depuis l'éditeur
const dateValueParser = (params: any) => {
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
const dateValueSetter = (params: any) => {
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



</script>

<style scoped>
/* Animations pour le dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* Styles pour les modals modernes */
.modern-modal :deep(.modal-content) {
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modern-modal :deep(.modal-header) {
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem 1.5rem 1rem;
}

.modern-modal :deep(.modal-body) {
    padding: 1rem 1.5rem 1.5rem;
}

/* Animations pour les boutons */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Styles pour les gradients et ombres */
.bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

/* Responsive design amélioré */
@media (max-width: 640px) {
    .container {
        padding: 1rem;
    }

    .flex-col {
        flex-direction: column;
    }

    .gap-4 {
        gap: 1rem;
    }
}
</style>
