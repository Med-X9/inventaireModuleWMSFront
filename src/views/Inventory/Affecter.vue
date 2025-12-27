<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Header et Barre d'actions fusionnées -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <!-- Section Header -->
            <div class="flex justify-between items-center gap-8 mb-6">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-4xl font-extrabold text-slate-900 dark:text-slate-100 m-0 mb-2">
                        <IconCalendar class="w-10 h-10 text-primary" />
                        Gestion des Affectations
                    </h1>
                </div>
                <div class="flex justify-end">
                    <ButtonGroup :buttons="navigationButtons" justify="end" />
                </div>
            </div>

            <!-- Séparateur -->
            <hr class="border-slate-200 dark:border-slate-700 my-6" />

            <!-- Section Barre d'actions -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <!-- Informations de sélection et statut -->
                <div class="flex items-center gap-4 flex-wrap">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {{ selectedJobsCount }} job{{ selectedJobsCount > 1 ? 's' : '' }} sélectionné{{ selectedJobsCount > 1 ? 's' : '' }}
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
                <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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

                    <!-- ButtonGroup pour les autres boutons -->
                    <ButtonGroup :buttons="actionButtons" justify="end" />
                </div>
            </div>
        </div>

        <!-- DataTable -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 m-0">Liste des jobs</h3>
                <div class="relative inline-block" ref="statusLegendTooltip">
                    <button
                        @mouseenter="showStatusTooltip"
                        @mouseleave="hideStatusTooltip"
                        class="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 flex items-center justify-center transition-colors cursor-help"
                        type="button"
                        aria-label="Signification des statuts">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </button>
                    <Teleport to="body">
                        <div
                            v-if="showStatusLegend"
                            ref="tooltipElement"
                            :style="tooltipStyle"
                            class="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 pointer-events-none max-w-sm"
                            style="min-width: 280px;">
                            <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Signification des statuts</h4>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-900 ring-1 ring-slate-300/20 ring-inset">EN ATTENTE</span>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job en attente de validation</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset">VALIDE</span>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job validé</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-teal-600/20 ring-inset">AFFECTE</span>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job affecté à une équipe</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-purple-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-purple-600/20 ring-inset">PRET</span>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job prêt pour le comptage</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset">TRANSFERT</span>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Job en transfert</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset">ENTAME</span>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Comptage entamé</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset">TERMINE</span>
                                    <span class="text-xs text-slate-600 dark:text-slate-400">Comptage terminé</span>
                                </div>
                            </div>
                            <div class="absolute w-2 h-2 bg-white dark:bg-slate-800 border-l border-b border-slate-200 dark:border-slate-700 transform rotate-45 -bottom-1 right-4"></div>
                        </div>
                    </Teleport>
                </div>
            </div>

            <!-- DataTable des jobs harmonisée avec Planning.vue -->
            <DataTable
                :key="jobsKey"
                :columns="adaptedStoreJobsColumns"
                :rowDataProp="jobs"
                :actions="[]"
                :enableVirtualScrolling="false"
                :totalPagesProp="jobPaginationMetadata?.totalPages"
                :totalItemsProp="jobPaginationMetadata?.total"
                :rowSelection="true"
                @selection-changed="onJobSelectionChanged"
                @pagination-changed="(queryModel) => onJobsTableEvent('pagination', queryModel)"
                @sort-changed="(queryModel) => onJobsTableEvent('sort', queryModel)"
                @filter-changed="(queryModel) => onJobsTableEvent('filter', queryModel)"
                @global-search-changed="(queryModel) => onJobsTableEvent('search', queryModel)"
                storageKey="affecter_table"
                ref="jobsTableRef">
            </DataTable>

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
                                v-if="selectedJobs.length - eligibleJobsForTransfer.length > 0"
                                class="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 text-xs font-medium rounded-full">
                                {{ selectedJobs.length - eligibleJobsForTransfer.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <!-- Alert pour les jobs exclus -->
                    <div
                        v-if="selectedJobs.length - eligibleJobsForTransfer.length > 0"
                        class="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                        <div class="flex items-start">
                            <svg class="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-warning-800 dark:text-warning-300">
                                    {{ selectedJobs.length - eligibleJobsForTransfer.length }} job(s) ne sont pas éligibles au transfert
                                </p>
                                <p class="text-xs text-warning-700 dark:text-warning-400 mt-1">
                                    Seuls les jobs en statut TRANSFERT, PRET ou ENTAME peuvent être transférés.
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
                    <FormBuilder
                        v-model="transferForm"
                        :fields="transferFields"
                        @submit="handleTransferSubmit"
                        submitLabel="Sauvegarder"
                        :columns="1" />
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
                                v-if="selectedJobs.length - eligibleJobsForManual.length > 0"
                                class="px-3 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 text-xs font-medium rounded-full">
                                {{ selectedJobs.length - eligibleJobsForManual.length }} exclu(s)
                            </span>
                        </div>
                    </div>
                    <!-- Alert pour les jobs exclus -->
                    <div
                        v-if="selectedJobs.length - eligibleJobsForManual.length > 0"
                        class="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                        <div class="flex items-start">
                            <svg class="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-warning-800 dark:text-warning-300">
                                    {{ selectedJobs.length - eligibleJobsForManual.length }} job(s) ne sont pas éligibles pour le lancement manuel
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
                    <FormBuilder
                        v-model="manualForm"
                        :fields="manualFields"
                        @submit="handleManualSubmit"
                        submitLabel="Lancer"
                        :columns="1" />
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

// ===== IMPORTS VUE =====
import { ref, nextTick, Teleport } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute } from 'vue-router'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import Modal from '@/components/Modal.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'

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

// ===== TOOLTIP STATUTS =====
const showStatusLegend = ref(false)
const statusLegendTooltip = ref<HTMLElement | null>(null)
const tooltipElement = ref<HTMLElement | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
let tooltipTimeoutId: number | null = null

const showStatusTooltip = async () => {
    if (tooltipTimeoutId) clearTimeout(tooltipTimeoutId)
    tooltipTimeoutId = window.setTimeout(async () => {
        showStatusLegend.value = true
        await nextTick()
        positionStatusTooltip()
    }, 300)
}

const hideStatusTooltip = () => {
    if (tooltipTimeoutId) {
        clearTimeout(tooltipTimeoutId)
        tooltipTimeoutId = null
    }
    showStatusLegend.value = false
}

const positionStatusTooltip = () => {
    if (!statusLegendTooltip.value || !tooltipElement.value) return

    const containerRect = statusLegendTooltip.value.getBoundingClientRect()
    const tooltipRect = tooltipElement.value.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Positionner le tooltip en bas à droite du bouton
    let top = containerRect.bottom + 8
    let left = containerRect.right - tooltipRect.width

    // Ajuster si le tooltip dépasse de l'écran
    if (left < 8) left = 8
    if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8
    }
    if (top + tooltipRect.height > viewportHeight - 8) {
        top = containerRect.top - tooltipRect.height - 8
    }

    tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`
    }
}

// ===== HANDLERS DATATABLE =====
// Handlers harmonisés avec usePlanning.ts - plus besoin de wrapper

// ===== DESTRUCTURATION =====
const {
    // Données harmonisées avec usePlanning.ts
    jobs,
    selectedJobs,
    selectedJobsCount,
    hasSelectedJobs,
    pendingChanges,
    hasUnsavedChanges,

    // Références harmonisées avec usePlanning.ts
    jobsTableRef,
    jobsKey,
    dropdownRef,

    // État des modales
    showDropdown,
    showTeamModal,
    showResourceModal,
    showTransferModal,
    showManualModal,
    modalTitle,

    // Formulaires
    teamForm,
    teamFields,
    resourceForm,
    resourceFields,
    transferForm,
    transferFields,
    manualForm,
    manualFields,

    // Dropdown
    dropdownItems,
    saveAllChanges,
    resetAllChanges,
    resetAllSelections,
    resetDataTableSelections,
    onCellValueChanged,
    onJobSelectionChanged,
    onRowClicked,
    toggleDropdown,
    focusFirstItem,
    closeDropdown,
    focusNextItem,
    focusPrevItem,
    setDropdownItemRef,

    // Handlers d'actions
    handleValiderClick,
    handleResourceSubmit,
    handleTeamSubmit,
    handleTransferSubmit,
    handleManualSubmit,
    handleReadyClick,
    handleReadyAll,
    handleResetClick,
    handleGoToInventoryDetail,
    handleGoToAffectation,
    handleGoToResults,
    handleGoToJobTracking,
    handleGoToImportTracking,
    handleTransferClick,
    handleManualClick,
    handleTransferAll,
    handleAffectAll,

    // Pagination et métadonnées harmonisées avec usePlanning.ts
    jobPaginationMetadata,

    // États de chargement
    jobsLoading,
    loading,

    // Paramètres personnalisés DataTable
    jobsCustomParams,

    // Handlers DataTable harmonisés avec usePlanning.ts
    onJobsTableEvent,
    onJobPaginationChanged,
    onJobSortChanged,
    onJobFilterChanged,
    onJobSearchChanged,

    // Gestion des IDs
    initializeIdsFromReferences,
    refreshIdsFromReferences,
    inventoryId,
    warehouseId,
    inventoryReference,
    warehouseReference,

    // Computed
    eligibleJobsForTransfer,
    eligibleJobsForManual,
    sessionOptions,
    resourceOptions,
    showTransferButton,
    showManualButton,
    showReadyButton,
    showResetButton,
    actionButtons,
    navigationButtons,
    jobsColumns,
    adaptedStoreJobsColumns,
    jobsActions,

    // Utilitaires
    loadSessionsIfNeeded,
    dateValueParser,
    dateValueSetter,
    getTransformedLocations,

    // Export handlers
    handleExportCsv,
    handleExportExcel,

    // Méthodes de chargement
    loadJobs,
    refreshJobs
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
