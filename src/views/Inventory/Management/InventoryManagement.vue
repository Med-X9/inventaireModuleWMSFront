<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Header -->
        <div class="mb-8">
            <div class="flex justify-between items-center flex-wrap gap-4">
                <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 m-0">
                    <i class="icon-inventory mr-2 text-primary"></i>
                    Gestion des inventaires
                </h1>
                <div class="flex gap-4 items-center">
                    <button @click="redirectToAdd"
                        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-dark hover:to-primary transition-all duration-200 hover:-translate-y-0.5">
                        <i class="icon-plus"></i>
                        Nouvel inventaire
                    </button>
                </div>
            </div>
        </div>

        <!-- Statistiques -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                    <i class="icon-preparation"></i>
                </div>
                <div class="flex-1">
                    <div class="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-none">{{ getStatusCount('EN PREPARATION') }}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">En préparation</div>
                </div>
            </div>
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                    <i class="icon-realisation"></i>
                </div>
                <div class="flex-1">
                    <div class="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-none">{{ getStatusCount('EN REALISATION') }}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">En réalisation</div>
                </div>
            </div>
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                    <i class="icon-termine"></i>
                </div>
                <div class="flex-1">
                    <div class="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-none">{{ getStatusCount('TERMINE') }}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">Terminés</div>
                </div>
            </div>
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                    <i class="icon-cloture"></i>
                </div>
                <div class="flex-1">
                    <div class="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-none">{{ getStatusCount('CLOTURE') }}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">Clôturés</div>
                </div>
            </div>
        </div>

        <!-- DataTable -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
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
                :pageSizeProp="pageSize"
                :totalItemsProp="pagination.total"
                :loading="loading"
                :inlineEditing="false"
                :serverSidePagination="true"
                :serverSideFiltering="true"
                :serverSideSorting="true"
                @pagination-changed="handlePaginationChanged"
                @sort-changed="handleSortChanged"
                @filter-changed="handleFilterChanged"
                @global-search-changed="handleGlobalSearchChanged"
                @cell-value-changed="handleCellValueChanged" />
        </div>

        <!-- Modal d'import -->
        <Modal
            v-if="showImportModal"
            v-model="showImportModal"
            title=""
            size="fullscreen">
            <div class="flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <!-- Header du modal -->
                <div class="relative bg-gradient-to-r from-[#FFCC11] to-[#e0ac06] p-4 shadow-md z-10 flex-shrink-0">
                    <div class="absolute inset-0 opacity-10"
                        style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
                    <div class="relative z-10 flex items-center justify-between gap-8">
                        <div class="flex items-start gap-6 flex-1">
                            <div class="w-12 h-12 rounded-xl bg-white/25 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                <IconBox class="w-6 h-6" />
                            </div>
                            <div class="flex-1">
                                <h1 class="text-xl font-bold text-white m-0 mb-2 text-shadow-sm">Import de stock image</h1>
                                <div v-if="currentImportInventory" class="flex items-center gap-3 mb-2 flex-wrap">
                                    <p class="text-[0.9375rem] font-semibold text-white/95 m-0">{{ currentImportInventory.label }}</p>
                                    <span class="inline-flex items-center px-3.5 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-sm font-semibold text-white uppercase tracking-wide">
                                        {{ currentImportInventory.status }}
                                    </span>
                                </div>
                                <div v-if="currentImportInventory" class="flex items-center gap-4 flex-wrap text-sm">
                                    <span class="inline-flex items-center gap-2 text-white/90 font-medium">
                                        <IconCalendar class="w-4 h-4 opacity-80" />
                                        {{ formatDate(currentImportInventory.date) }}
                                    </span>
                                    <span v-if="currentImportInventory.reference" class="inline-flex items-center gap-2 text-white/90 font-medium">
                                        <span class="opacity-80">#</span>
                                        {{ currentImportInventory.reference }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            @click="closeImportModalWithCleanup"
                            class="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/30 hover:scale-105 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            :disabled="isImporting">
                            <IconX class="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <!-- Contenu principal -->
                <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 p-6 flex-1 overflow-hidden min-h-0 max-h-[calc(100vh-150px)]">
                    <!-- Colonne principale -->
                    <div class="flex flex-col gap-3 min-h-0 overflow-hidden">
                        <!-- Zone d'upload -->
                        <div
                            class="h-[280px] border-3 border-dashed rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 transition-all duration-400 relative overflow-hidden shadow-md flex-shrink-0"
                            :class="{
                                'border-primary bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 scale-[1.01] shadow-2xl shadow-primary-500/30 border-4': isDragging,
                                'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg shadow-green-500/20': selectedFile && !isDragging,
                                'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20': isImporting
                            }"
                            @dragover.prevent="handleDragOver"
                            @dragleave.prevent="handleDragLeave"
                            @drop.prevent="handleDrop">
                            <div class="p-8 flex flex-col items-center justify-center h-full relative">
                                <div class="relative mb-4">
                                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white transition-all duration-400 shadow-xl"
                                        :class="{ 'scale-110 rotate-12': isDragging }">
                                        <IconUpload class="w-8 h-8 text-white" />
                                    </div>
                                    <div v-if="isImporting" class="absolute -top-2.5 -left-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)]">
                                        <svg class="w-full h-full progress-ring" viewBox="0 0 120 120" style="transform: rotate(-90deg);">
                                            <circle class="progress-ring-circle" cx="60" cy="60" r="54" fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="339.292" stroke-dashoffset="339.292" style="animation: progress-ring 2s linear infinite;" />
                                        </svg>
                                    </div>
                                </div>

                                <div v-if="!selectedFile && !isImporting" class="text-center flex flex-col items-center gap-3">
                                    <h4 class="text-xl font-bold text-slate-900 dark:text-slate-100 m-0">Glissez-déposez votre fichier ici</h4>
                                    <p class="text-base text-slate-600 dark:text-slate-400 m-0">ou</p>
                                    <button
                                        @click="() => (fileInput as any)?.click()"
                                        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-dark hover:to-primary transition-all duration-200">
                                        <IconFolder class="w-4 h-4 text-white" />
                                        Parcourir les fichiers
                                    </button>
                                    <p class="text-sm text-slate-500 dark:text-slate-500 mt-4 m-0">
                                        Formats acceptés : .xlsx, .xls (Taille max : 10 MB)
                                    </p>
                                </div>

                                <div v-if="selectedFile && !isImporting" class="flex items-center gap-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-green-500 rounded-xl p-4 w-full max-w-2xl shadow-lg animate-[slideInFile_0.3s_ease-out]">
                                    <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                        <IconFile class="w-6 h-6" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-base font-semibold text-slate-900 dark:text-slate-100 m-0 mb-1 truncate">{{ selectedFile.name }}</h4>
                                        <p class="text-xs text-slate-600 dark:text-slate-400 m-0 mb-0.5">{{ formatFileSize(selectedFile.size) }}</p>
                                        <p class="text-xs text-slate-500 dark:text-slate-500 m-0">{{ getFileType(selectedFile.name) }}</p>
                                    </div>
                                    <button
                                        @click="selectedFile = null"
                                        class="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-100 hover:scale-110 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                                        :disabled="isImporting">
                                        <IconX class="w-5 h-5" />
                                    </button>
                                </div>

                                <div v-if="isImporting" class="w-full max-w-2xl text-center">
                                    <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                        <div class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 shadow-lg" :style="{ width: uploadProgress + '%' }"></div>
                                    </div>
                                    <p class="text-sm text-slate-600 dark:text-slate-400 m-0 flex items-center justify-center gap-2">
                                        <IconLoader class="w-4 h-4 animate-spin" />
                                        Import en cours... {{ uploadProgress }}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Message de succès -->
                        <Transition name="slide-up">
                            <div v-if="importSuccess && importSuccessMessage" class="flex gap-3 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-3.5 mt-2 flex-shrink-0">
                                <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                                    <IconCircleCheck class="w-5 h-5" />
                                </div>
                                <div class="flex-1">
                                    <h4 class="text-base font-semibold text-green-900 dark:text-green-100 m-0 mb-1">Import réussi</h4>
                                    <p class="text-sm text-green-700 dark:text-green-300 m-0 font-medium leading-relaxed">{{ importSuccessMessage }}</p>
                                </div>
                            </div>
                        </Transition>

                        <!-- Message d'erreur -->
                        <Transition name="slide-up">
                            <div v-if="importError && importErrorDetails" class="flex gap-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-3.5 mt-2 flex-1 min-h-0 max-h-[calc(100vh-420px)] overflow-y-auto overflow-x-hidden">
                                <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                                    <IconXCircle class="w-5 h-5" />
                                </div>
                                <div class="flex-1 flex flex-col gap-3 min-w-0">
                                    <h4 class="text-base font-semibold text-red-900 dark:text-red-100 m-0">Erreur lors de l'import</h4>
                                    <p class="text-sm text-red-700 dark:text-red-300 m-0 font-medium leading-relaxed">{{ importErrorDetails.message }}</p>

                                    <!-- Informations sur l'inventaire -->
                                    <div v-if="importErrorDetails.inventory_type || importErrorDetails.existing_stocks_count !== null" class="flex flex-col gap-1.5 p-2 bg-red-100/50 dark:bg-red-900/20 rounded-lg mt-1">
                                        <div v-if="importErrorDetails.inventory_type" class="flex items-center gap-2 text-xs text-red-900 dark:text-red-100">
                                            <strong>Type d'inventaire :</strong>
                                            <span class="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold uppercase">{{ importErrorDetails.inventory_type }}</span>
                                        </div>
                                        <div v-if="importErrorDetails.existing_stocks_count !== null" class="flex items-center gap-2 text-xs text-red-900 dark:text-red-100">
                                            <strong>Stocks existants :</strong>
                                            <span>{{ importErrorDetails.existing_stocks_count }}</span>
                                        </div>
                                    </div>

                                    <!-- Action requise -->
                                    <div v-if="importErrorDetails.action_required" class="p-3 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg mt-1">
                                        <div class="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1.5">
                                            <IconInfoCircle class="w-4 h-4" />
                                            <strong>Action requise :</strong>
                                        </div>
                                        <div class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
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
                                    <div v-if="importErrorDetails.summary" class="p-3 bg-red-100/50 dark:bg-red-900/20 rounded-lg mt-1">
                                        <div class="text-xs font-semibold text-red-900 dark:text-red-100 mb-2">
                                            <strong>Résumé de l'import :</strong>
                                        </div>
                                        <div class="flex gap-4 flex-wrap">
                                            <div class="flex items-center gap-2 text-xs">
                                                <span class="text-red-900 dark:text-red-100 font-medium">Total lignes :</span>
                                                <span class="font-bold text-red-700 dark:text-red-300">{{ importErrorDetails.summary.total_rows }}</span>
                                            </div>
                                            <div class="flex items-center gap-2 text-xs">
                                                <span class="text-red-900 dark:text-red-100 font-medium">Lignes valides :</span>
                                                <span class="font-bold text-green-600 dark:text-green-400">{{ importErrorDetails.summary.valid_rows }}</span>
                                            </div>
                                            <div class="flex items-center gap-2 text-xs">
                                                <span class="text-red-900 dark:text-red-100 font-medium">Lignes invalides :</span>
                                                <span class="font-bold text-red-700 dark:text-red-300">{{ importErrorDetails.summary.invalid_rows }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Liste des erreurs de validation -->
                                    <div v-if="importErrorDetails.errors && importErrorDetails.errors.length > 0" class="mt-3 pt-3 border-t-2 border-red-200 dark:border-red-800">
                                        <div class="text-xs font-semibold text-red-900 dark:text-red-100 mb-3">
                                            <strong>Erreurs de validation ({{ importErrorDetails.errors.length }} ligne(s)) :</strong>
                                        </div>
                                        <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                                            <div
                                                v-for="(errorItem, index) in importErrorDetails.errors"
                                                :key="index"
                                                class="p-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg">
                                                <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-red-100 dark:border-red-900">
                                                    <span class="font-bold text-red-700 dark:text-red-300 text-sm">Ligne {{ errorItem.row }}</span>
                                                    <span class="text-xs text-red-900 dark:text-red-100 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded">{{ errorItem.errors.length }} erreur(s)</span>
                                                </div>
                                                <div class="flex flex-col gap-1.5 mb-2">
                                                    <div
                                                        v-for="(errorMsg, msgIndex) in errorItem.errors"
                                                        :key="msgIndex"
                                                        class="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                                                        <IconXCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                        <span>{{ errorMsg }}</span>
                                                    </div>
                                                </div>
                                                <div v-if="errorItem.data" class="mt-2 pt-2 border-t border-red-100 dark:border-red-900 text-xs">
                                                    <strong class="block mb-1.5 text-red-900 dark:text-red-100">Données de la ligne :</strong>
                                                    <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                                                        <div v-if="errorItem.data.article !== undefined" class="flex flex-col gap-1">
                                                            <span class="text-xs text-red-900 dark:text-red-100 font-medium">Article :</span>
                                                            <span class="text-xs text-slate-700 dark:text-slate-300 px-1.5 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono">{{ errorItem.data.article || '(vide)' }}</span>
                                                        </div>
                                                        <div v-if="errorItem.data.emplacement !== undefined" class="flex flex-col gap-1">
                                                            <span class="text-xs text-red-900 dark:text-red-100 font-medium">Emplacement :</span>
                                                            <span class="text-xs text-slate-700 dark:text-slate-300 px-1.5 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono">{{ errorItem.data.emplacement || '(vide)' }}</span>
                                                        </div>
                                                        <div v-if="errorItem.data.quantite !== undefined" class="flex flex-col gap-1">
                                                            <span class="text-xs text-red-900 dark:text-red-100 font-medium">Quantité :</span>
                                                            <span class="text-xs text-slate-700 dark:text-slate-300 px-1.5 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono">{{ errorItem.data.quantite !== null ? errorItem.data.quantite : '(vide)' }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <!-- Colonne secondaire -->
                    <div class="flex flex-col gap-3 min-h-0 overflow-hidden">
                        <!-- Instructions -->
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-slate-800 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-3 shadow-md flex-shrink-0 max-h-fit">
                            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-blue-300/20 dark:border-blue-700">
                                <div class="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                    <IconInfoCircle class="w-5 h-5" />
                                </div>
                                <h4 class="text-sm font-semibold m-0 dark:text-blue-100">Instructions d'import</h4>
                            </div>
                            <ul class="list-none p-0 m-0 flex flex-col gap-2">
                                <li class="flex items-start gap-2 p-2 bg-white/60 dark:bg-slate-800/50 rounded-md transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/80 hover:translate-x-1">
                                    <div class="w-6 h-6 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                                        <IconCircleCheck class="w-3.5 h-3.5" />
                                    </div>
                                    <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                                        <strong class="text-xs font-semibold text-blue-900 dark:text-blue-100 leading-tight mb-0.5">Format requis</strong>
                                        <span class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">Le fichier Excel doit contenir les colonnes requises pour l'import</span>
                                    </div>
                                </li>
                                <li class="flex items-start gap-2 p-2 bg-white/60 dark:bg-slate-800/50 rounded-md transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/80 hover:translate-x-1">
                                    <div class="w-6 h-6 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                                        <IconCircleCheck class="w-3.5 h-3.5" />
                                    </div>
                                    <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                                        <strong class="text-xs font-semibold text-blue-900 dark:text-blue-100 leading-tight mb-0.5">Validation des données</strong>
                                        <span class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">Assurez-vous que les données sont correctement formatées</span>
                                    </div>
                                </li>
                                <li class="flex items-start gap-2 p-2 bg-white/60 dark:bg-slate-800/50 rounded-md transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/80 hover:translate-x-1">
                                    <div class="w-6 h-6 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                                        <IconCircleCheck class="w-3.5 h-3.5" />
                                    </div>
                                    <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                                        <strong class="text-xs font-semibold text-blue-900 dark:text-blue-100 leading-tight mb-0.5">Durée d'import</strong>
                                        <span class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">L'import peut prendre quelques minutes selon la taille du fichier</span>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- Actions -->
                        <div class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-md flex-shrink-0">
                            <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">Actions</h4>
                            <div class="flex flex-col gap-2">
                                <button
                                    @click="closeImportModalWithCleanup"
                                    class="w-full justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-slate-600 text-white hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    :disabled="isImporting">
                                    <IconX class="w-4 h-4" />
                                    Annuler
                                </button>
                                <button
                                    @click="() => selectedFile && processImportExcelWithProgress(selectedFile)"
                                    :disabled="!selectedFile || isImporting"
                                    class="w-full justify-center inline-flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-dark hover:to-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <IconLoader v-if="isImporting" class="w-4 h-4 animate-spin text-white" />
                                    <IconDownload v-else class="w-4 h-4 text-white" />
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
                    class="hidden" />
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue InventoryManagement - Gestion des inventaires
 *
 * Cette vue permet de :
 * - Visualiser la liste des inventaires avec pagination, tri et filtrage côté serveur
 * - Afficher les statistiques par statut
 * - Importer des images de stock via un fichier Excel
 * - Gérer les actions sur les inventaires (détail, modification, suppression, etc.)
 *
 * @component InventoryManagement
 */

// ===== IMPORTS VUE =====
import { onMounted, ref } from 'vue'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import Modal from '@/components/Modal.vue'

// ===== IMPORTS COMPOSABLES =====
import { useInventoryManagement } from '@/composables/useInventoryManagement'
import { useInventoryDataTable } from '@/composables/useInventoryDataTable'

// ===== IMPORTS TYPES =====
import type { DataTableColumnAny, ActionConfigAny } from '@/types/dataTable'

// ===== IMPORTS ICÔNES =====
import IconBox from '@/components/icon/icon-box.vue'
import IconX from '@/components/icon/icon-x.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconFile from '@/components/icon/icon-file.vue'
import IconLoader from '@/components/icon/icon-loader.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'
import IconUpload from '@/components/icon/icon-upload.vue'
import IconFolder from '@/components/icon/icon-folder.vue'
import IconInfoCircle from '@/components/icon/icon-info-circle.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'
import IconDownload from '@/components/icon/icon-download.vue'

// ===== COMPOSABLES =====

/**
 * Composable pour la gestion des inventaires
 * Fournit les colonnes, actions, et la logique d'import
 */
const {
    columns,
    actions,
    redirectToAdd,
    showImportModal,
    isImporting,
    importError,
    importErrorDetails,
    importSuccess,
    importSuccessMessage,
    currentImportInventory,
    processImportExcel,
    closeImportModal,
    alertService,
    getStatusCount
} = useInventoryManagement()

/**
 * Composable spécialisé pour le DataTable des inventaires
 * Gère la pagination, le tri et le filtrage côté serveur avec format standard
 */
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
} = useInventoryDataTable()

// ===== ÉTAT LOCAL =====

/** Fichier sélectionné pour l'import */
const selectedFile = ref<File | null>(null)

/** Référence à l'input file */
const fileInput = ref<HTMLInputElement>()

/** État de drag & drop */
const isDragging = ref(false)

/** Progression de l'upload */
const uploadProgress = ref(0)

// ===== HANDLERS =====

/**
 * Handler pour les changements de valeur de cellule
 *
 * @param event - Événement contenant les données, le champ, l'ancienne et la nouvelle valeur
 */
const handleCellValueChanged = (event: { data: any; field: string; newValue: any; oldValue: any }) => {
    // TODO: Implémenter la logique de sauvegarde des modifications
    // await inventoryStore.updateInventory(event.data.id, { [event.field]: event.newValue })
}

/**
 * Handler pour le changement de fichier
 *
 * @param event - Événement de changement de fichier
 */
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0]
        uploadProgress.value = 0
    }
}

/**
 * Handler pour le survol lors du drag & drop
 *
 * @param event - Événement de drag over
 */
const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = true
}

/**
 * Handler pour la sortie du drag & drop
 *
 * @param event - Événement de drag leave
 */
const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = false
}

/**
 * Handler pour le dépôt de fichier
 *
 * @param event - Événement de drop
 */
const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = false

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0]
        // Vérifier le type de fichier
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            selectedFile.value = file
            uploadProgress.value = 0
        } else {
            alertService.error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés')
        }
    }
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Formater la taille d'un fichier en unités lisibles
 *
 * @param bytes - Taille en bytes
 * @returns Taille formatée (ex: "1.5 MB")
 */
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Obtenir le type de fichier depuis son nom
 *
 * @param fileName - Nom du fichier
 * @returns Type de fichier formaté
 */
const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toUpperCase()
    return extension ? `Fichier ${extension}` : 'Fichier inconnu'
}

/**
 * Formater une date en français
 *
 * @param date - Date à formater
 * @returns Date formatée en français
 */
const formatDate = (date: string | Date): string => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

/**
 * Wrapper pour processImportExcel avec gestion de progression
 *
 * @param file - Fichier à importer
 */
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

/**
 * Wrapper pour closeImportModal avec nettoyage
 * Réinitialise tous les états liés à l'import
 */
const closeImportModalWithCleanup = () => {
    if (isImporting.value) return // Empêcher la fermeture pendant l'import

    selectedFile.value = null
    uploadProgress.value = 0
    isDragging.value = false
    closeImportModal()
}

/**
 * Handler pour les erreurs de chargement
 *
 * @param error - Erreur survenue
 */
const handleLoadError = (error: any) => {
    alertService.error('Erreur lors du chargement des inventaires')
}

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(async () => {
    try {
        // Charger les données initiales
        await refresh()
    } catch (error) {
        handleLoadError(error)
    }
})
</script>

<style scoped>
/* Animations pour les transitions */
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

.animate-\[slideInFile_0\.3s_ease-out\] {
    animation: slideInFile 0.3s ease-out;
}

.progress-ring-circle {
    animation: progress-ring 2s linear infinite;
}

/* Transitions pour les messages */
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
</style>
