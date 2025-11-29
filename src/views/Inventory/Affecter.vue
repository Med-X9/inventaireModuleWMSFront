<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Header -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-center gap-8">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-4xl font-extrabold text-slate-900 dark:text-slate-100 m-0 mb-2">
                        <IconCalendar class="w-10 h-10 text-primary" />
                        Gestion des Affectations
                    </h1>
                </div>
                <div class="flex gap-4 mb-4">
                    <button
                        @click="handleGoToInventoryDetail"
                        class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-r from-primary to-primary-light text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                        <IconEye class="w-4 h-4 text-white" />
                    </button>
                    <button
                        @click="handleGoToAffectation"
                        class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-r from-primary to-primary-light text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                        <IconCalendar class="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Barre d'actions -->
        <div class="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <!-- Informations de sélection et statut -->
                <div class="flex items-center gap-4 flex-wrap">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {{ selectedRows.length }} job{{ selectedRows.length > 1 ? 's' : '' }} sélectionné{{ selectedRows.length > 1 ? 's' : '' }}
                        </span>
                    </div>
                    <div v-if="hasUnsavedChanges" class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                        <span class="text-sm text-warning-700 dark:text-warning-300 font-medium">
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
                        <button
                            @click="toggleDropdown"
                            @keydown.down.prevent="focusFirstItem"
                            class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-haspopup="true"
                            :aria-expanded="showDropdown"
                            type="button">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.025m13.5-8.5a2.121 2.121 0 00-3-3L7 9l2.025 2.025M13.5 21V9l-6-6" />
                            </svg>
                            <span>Affecter</span>
                            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <Transition name="dropdown" appear>
                            <ul
                                v-if="showDropdown"
                                class="absolute right-0 z-50 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl focus:outline-none max-h-60 overflow-y-auto py-2"
                                role="menu"
                                tabindex="-1"
                                @keydown.esc="closeDropdown"
                                @keydown.down.prevent="focusNextItem"
                                @keydown.up.prevent="focusPrevItem">
                                <li v-for="(item, idx) in dropdownItems" :key="item.label">
                                    <button
                                        ref="el => setDropdownItemRef(el, idx)"
                                        class="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-100 dark:focus:bg-blue-900/30 transition-colors duration-150 rounded-lg mx-2"
                                        @click="item.action(); closeDropdown()"
                                        @keydown.enter.prevent="item.action(); closeDropdown()"
                                        role="menuitem">
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
                                        <span class="font-medium text-slate-900 dark:text-white">{{ item.label }}</span>
                                    </button>
                                    <div v-if="idx < dropdownItems.length - 1" class="border-b border-slate-100 dark:border-slate-700 mx-4 my-1"></div>
                                </li>
                            </ul>
                        </Transition>
                    </div>

                    <!-- Bouton Manuel -->
                    <button
                        v-if="showManualButton"
                        @click="handleManualClick"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Manuel</span>
                    </button>

                    <!-- Bouton Transférer -->
                    <button
                        v-if="showTransferButton"
                        @click="handleTransferClick"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Transférer</span>
                    </button>

                    <!-- Bouton Sauvegarder -->
                    <button
                        @click="saveAllChanges"
                        :disabled="!hasUnsavedChanges"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        :class="hasUnsavedChanges
                            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg focus:ring-green-500'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Sauvegarder</span>
                        <span v-if="hasUnsavedChanges" class="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) }}
                        </span>
                    </button>

                    <!-- Bouton Réinitialiser -->
                    <button
                        @click="resetAllChanges"
                        :disabled="!hasUnsavedChanges"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        :class="hasUnsavedChanges
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-500'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Réinitialiser</span>
                        <span v-if="hasUnsavedChanges" class="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {{ Array.from(pendingChanges.values()).reduce((total, changes) => total + changes.size, 0) }}
                        </span>
                    </button>

                    <!-- Bouton Pret -->
                    <button
                        v-if="showReadyButton"
                        @click="handleReadyClick"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary-dark text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pret</span>
                    </button>

                    <!-- Bouton Annuler -->
                    <button
                        v-if="showResetButton"
                        @click="handleResetClick"
                        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Annuler</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- DataTable -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <DataTable
                ref="dataTableRef"
                :columns="columns"
                :rowDataProp="displayData"
                :actions="[]"
                :pagination="true"
                :enableFiltering="true"
                :rowSelection="true"
                :inlineEditing="true"
                :serverSidePagination="true"
                :serverSideFiltering="true"
                :serverSideSorting="true"
                :debounceFilter="500"
                :loading="loading"
                :pageSizeProp="pageSize"
                @selection-changed="onSelectionChanged"
                @row-clicked="onRowClicked"
                @cell-value-changed="onCellValueChanged"
                @pagination-changed="handlePaginationChanged"
                @sort-changed="handleSortChanged"
                @filter-changed="handleFilterChanged"
                @global-search-changed="handleGlobalSearchChanged"
                storageKey="affecter_table"
                :exportTitle="'Affecter_Jobs'" />
        </div>

        <!-- Modals -->
        <Modal v-model="showTeamModal" :title="modalTitle">
            <div class="mt-4">
                <FormBuilder
                    v-model="teamForm"
                    :fields="teamFields"
                    @submit="handleTeamSubmit"
                    submitLabel="Affecter" />
            </div>
        </Modal>

        <Modal v-model="showResourceModal" title="Affecter Ressources">
            <div class="mt-4">
                <FormBuilder
                    v-model="resourceForm"
                    :fields="resourceFields"
                    @submit="handleResourceSubmit"
                    submitLabel="Affecter"
                    :columns="1" />
            </div>
        </Modal>

        <Modal v-model="showTransferModal" :title="`Transférer ${eligibleJobsForTransfer.length} Job(s)`" :size="'xl'">
            <div class="flex flex-col" style="height: 75vh; max-height: 75vh;">
                <!-- Section 1: Header et alert -->
                <div class="flex-shrink-0 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-300">
                            Jobs éligibles au transfert
                        </h3>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                                {{ eligibleJobsForTransfer.length }} éligible(s)
                            </span>
                            <span
                                v-if="selectedRows.length - eligibleJobsForTransfer.length > 0"
                                class="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 text-xs font-medium rounded-full">
                                {{ selectedRows.length - eligibleJobsForTransfer.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <!-- Alert pour les jobs exclus -->
                    <div
                        v-if="selectedRows.length - eligibleJobsForTransfer.length > 0"
                        class="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                        <div class="flex items-start">
                            <svg class="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-warning-800 dark:text-warning-300">
                                    {{ selectedRows.length - eligibleJobsForTransfer.length }} job(s) ne sont pas éligibles au transfert
                                </p>
                                <p class="text-xs text-warning-700 dark:text-warning-400 mt-1">
                                    Seuls les jobs en statut TRANSFERT ou PRET, ou les jobs ENTAME avec au moins un assignment TRANSFERT ou PRET peuvent être transférés.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Liste des jobs -->
                <div class="flex-1 min-h-0 mb-4">
                    <div class="h-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div class="h-full overflow-y-auto custom-scrollbar">
                            <div class="divide-y divide-slate-200 dark:divide-slate-700">
                                <div
                                    v-for="job in eligibleJobsForTransfer"
                                    :key="job.id"
                                    class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div class="flex items-center justify-between gap-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-slate-900 dark:text-white truncate">{{ job.job }}</div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <span class="text-xs text-slate-500 dark:text-slate-400">
                                                    <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                    </svg>
                                                    {{ job.locations?.length || 0 }} emplacement(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                                :class="{
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': job.status === 'AFFECTE',
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': job.status === 'VALIDE',
                                                    'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400': job.status === 'PRET',
                                                    'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400': job.status === 'TRANSFERT'
                                                }">
                                                {{ job.status }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-slate-200 dark:border-slate-700 my-4"></div>

                <!-- Formulaire de sélection du comptage -->
                <div class="flex-shrink-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
                    <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                        </svg>
                        Sélectionner le(s) comptage(s) à transférer
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label class="flex items-center p-3 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-pointer hover:border-purple-300 dark:hover:border-purple-700"
                            :class="transferForm.premierComptage ? 'border-purple-500 dark:border-purple-600' : 'border-slate-200 dark:border-slate-700'">
                            <input
                                type="checkbox"
                                v-model="transferForm.premierComptage"
                                class="w-5 h-5 text-purple-600 bg-slate-100 border-slate-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-2 dark:bg-slate-700 dark:border-slate-600">
                            <div class="ml-3 flex-1">
                                <div class="text-sm font-medium text-slate-900 dark:text-white">1er Comptage</div>
                                <div class="text-xs text-slate-500 dark:text-slate-400">Transfert du premier comptage</div>
                            </div>
                        </label>
                        <label class="flex items-center p-3 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-pointer hover:border-purple-300 dark:hover:border-purple-700"
                            :class="transferForm.deuxiemeComptage ? 'border-purple-500 dark:border-purple-600' : 'border-slate-200 dark:border-slate-700'">
                            <input
                                type="checkbox"
                                v-model="transferForm.deuxiemeComptage"
                                class="w-5 h-5 text-purple-600 bg-slate-100 border-slate-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-2 dark:bg-slate-700 dark:border-slate-600">
                            <div class="ml-3 flex-1">
                                <div class="text-sm font-medium text-slate-900 dark:text-white">2e Comptage</div>
                                <div class="text-xs text-slate-500 dark:text-slate-400">Transfert du deuxième comptage</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        @click="showTransferModal = false"
                        class="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors">
                        Annuler
                    </button>
                    <button
                        @click="handleTransferSubmit({
                            premierComptage: transferForm.premierComptage,
                            deuxiemeComptage: transferForm.deuxiemeComptage
                        })"
                        :disabled="!transferForm.premierComptage && !transferForm.deuxiemeComptage"
                        class="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105 shadow-md hover:shadow-lg">
                        Transférer {{ eligibleJobsForTransfer.length }} Job(s)
                    </button>
                </div>
            </div>
        </Modal>

        <Modal v-model="showManualModal" :title="`Lancer manuellement ${eligibleJobsForManual.length} Job(s)`" :size="'xl'">
            <div class="flex flex-col" style="height: 75vh; max-height: 75vh;">
                <!-- Section 1: Header et alert -->
                <div class="flex-shrink-0 mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-300">
                            Jobs éligibles pour le lancement manuel
                        </h3>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                                {{ eligibleJobsForManual.length }} éligible(s)
                            </span>
                            <span
                                v-if="selectedRows.length - eligibleJobsForManual.length > 0"
                                class="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 text-xs font-medium rounded-full">
                                {{ selectedRows.length - eligibleJobsForManual.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <!-- Alert pour les jobs exclus -->
                    <div
                        v-if="selectedRows.length - eligibleJobsForManual.length > 0"
                        class="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                        <div class="flex items-start">
                            <svg class="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-warning-800 dark:text-warning-300">
                                    {{ selectedRows.length - eligibleJobsForManual.length }} job(s) ne sont pas éligibles pour le lancement manuel
                                </p>
                                <p class="text-xs text-warning-700 dark:text-warning-400 mt-1">
                                    Seuls les jobs en statut PRET, TRANSFERT ou ENTAME peuvent être lancés manuellement.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Liste des jobs -->
                <div class="flex-1 min-h-0 mb-4">
                    <div class="h-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div class="h-full overflow-y-auto custom-scrollbar">
                            <div class="divide-y divide-slate-200 dark:divide-slate-700">
                                <div
                                    v-for="job in eligibleJobsForManual"
                                    :key="job.id"
                                    class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div class="flex items-center justify-between gap-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-slate-900 dark:text-white truncate">{{ job.job }}</div>
                                            <div class="flex items-center gap-3 mt-1">
                                                <span class="text-xs text-slate-500 dark:text-slate-400">
                                                    <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                    </svg>
                                                    {{ job.locations?.length || 0 }} emplacement(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                                :class="{
                                                    'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400': job.status === 'PRET',
                                                    'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400': job.status === 'TRANSFERT',
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': job.status === 'ENTAME'
                                                }">
                                                {{ job.status }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-slate-200 dark:border-slate-700 my-4"></div>

                <!-- Formulaire de sélection du comptage -->
                <div class="flex-shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
                    <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                        </svg>
                        Sélectionner le(s) comptage(s) à lancer manuellement
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label class="flex items-center p-3 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700"
                            :class="manualForm.premierComptage ? 'border-indigo-500 dark:border-indigo-600' : 'border-slate-200 dark:border-slate-700'">
                            <input
                                type="checkbox"
                                v-model="manualForm.premierComptage"
                                class="w-5 h-5 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:ring-2 dark:bg-slate-700 dark:border-slate-600">
                            <div class="ml-3 flex-1">
                                <div class="text-sm font-medium text-slate-900 dark:text-white">1er Comptage</div>
                                <div class="text-xs text-slate-500 dark:text-slate-400">Lancement du premier comptage</div>
                            </div>
                        </label>
                        <label class="flex items-center p-3 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700"
                            :class="manualForm.deuxiemeComptage ? 'border-indigo-500 dark:border-indigo-600' : 'border-slate-200 dark:border-slate-700'">
                            <input
                                type="checkbox"
                                v-model="manualForm.deuxiemeComptage"
                                class="w-5 h-5 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:ring-2 dark:bg-slate-700 dark:border-slate-600">
                            <div class="ml-3 flex-1">
                                <div class="text-sm font-medium text-slate-900 dark:text-white">2e Comptage</div>
                                <div class="text-xs text-slate-500 dark:text-slate-400">Lancement du deuxième comptage</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        @click="showManualModal = false"
                        class="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors">
                        Annuler
                    </button>
                    <button
                        @click="handleManualSubmit({
                            premierComptage: manualForm.premierComptage,
                            deuxiemeComptage: manualForm.deuxiemeComptage
                        })"
                        :disabled="!manualForm.premierComptage && !manualForm.deuxiemeComptage"
                        class="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105 shadow-md hover:shadow-lg">
                        Lancer {{ eligibleJobsForManual.length }} Job(s)
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue Affecter - Gestion des affectations de jobs
 *
 * Cette vue permet de :
 * - Visualiser les jobs validés avec pagination, tri et filtrage côté serveur
 * - Affecter des équipes aux jobs (1er et 2e comptage)
 * - Affecter des ressources aux jobs
 * - Transférer des jobs entre comptages
 * - Éditer inline les données dans le DataTable
 *
 * @component Affecter
 */

// ===== IMPORTS ROUTER =====
import { useRoute } from 'vue-router'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import Modal from '@/components/Modal.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'

// ===== IMPORTS COMPOSABLES =====
import { useAffecter } from '@/composables/useAffecter'

// ===== IMPORTS ICÔNES =====
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconEye from '@/components/icon/icon-eye.vue'

// ===== ROUTE =====
const route = useRoute()

// ===== COMPOSABLE =====
/**
 * Initialisation du composable useAffecter
 * Gère toute la logique métier de la page
 */
const affecter = useAffecter({
    inventoryReference: route.params.reference as string,
    warehouseReference: route.params.warehouse as string
})

// ===== DESTRUCTURATION =====
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
    showManualModal,
    modalTitle,
    teamForm,
    teamFields,
    resourceForm,
    resourceFields,
    transferForm,
    transferFields,
    manualForm,
    dropdownItems,
    saveAllChanges,
    resetAllChanges,
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
    handleTransferSubmit,
    handleManualSubmit,
    handleReadyClick,
    handleResetClick,
    handleGoToInventoryDetail,
    handleGoToAffectation,
    handleTransferClick,
    handleManualClick,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    loading,
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    handleGlobalSearchChanged,
    loadSessionsIfNeeded,
    inventoryReference,
    warehouseReference,
    eligibleJobsForTransfer,
    eligibleJobsForManual,
    columns,
    sessionOptions,
    resourceOptions,
    showTransferButton,
    showManualButton,
    showReadyButton,
    showResetButton,
    dateValueParser,
    dateValueSetter,
} = affecter
</script>

<style scoped>
/* Scrollbar personnalisé pour le modal */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
    background: #1e293b;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #475569;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}

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
</style>
