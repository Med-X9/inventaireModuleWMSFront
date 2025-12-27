<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Skeleton loader pendant le chargement -->
        <InventoryDetailSkeleton v-if="loading || (!inventory && !error)" />

        <!-- Contenu principal -->
        <template v-else-if="inventory">
        <!-- Header avec boutons d'action -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-lg border border-slate-200 dark:border-slate-700 flex justify-end">
            <ButtonGroup :buttons="actionButtons" justify="end" />
        </div>

        <!-- Container principal -->
        <div v-if="inventory" class="space-y-6">
            <!-- Informations générales -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div class="flex items-center gap-3 mb-2 sm:mb-0">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Informations générales
                        </h2>
                    </div>
                    <span :class="[
                        'px-3 py-1 rounded-full text-sm font-semibold',
                        getStatusClass(inventory?.status)
                    ]">
                        {{ inventory.status }}
                    </span>
                </div>
                <div class="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Référence -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    Référence
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block truncate">
                                    {{ inventory.reference || 'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Libellé -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    Libellé
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block truncate">
                                    {{ inventory.label || 'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Date d'inventaire -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    Date d'inventaire
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block">
                                    {{ formatDate(inventory.date) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Type -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    Type
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block truncate">
                                    {{ inventory.inventory_type || 'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Compte -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    Compte
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block truncate">
                                    {{ inventory.account_name || 'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- En préparation -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    En préparation
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block">
                                    {{ inventory.en_preparation_status_date ?
                                        formatDate(inventory.en_preparation_status_date) :
                                        'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- En réalisation -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    En réalisation
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block">
                                    {{ inventory.en_realisation_status_date ?
                                        formatDate(inventory.en_realisation_status_date) :
                                        'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Terminé -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    Terminé
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block">
                                    {{ inventory.termine_status_date ? formatDate(inventory.termine_status_date) : 'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Clôturé -->
                    <div class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-1">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                    Clôturé
                                </span>
                                <span class="text-base font-semibold text-slate-800 dark:text-slate-100 block">
                                    {{ inventory.cloture_status_date ? formatDate(inventory.cloture_status_date) : 'Non défini' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paramètres de comptage -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-primary-light/10 dark:from-primary/20 dark:to-primary-light/20">
                    <div class="flex items-center gap-3">
                        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Paramètres de comptage
                        </h3>
                    </div>
                </div>
                <div class="px-6 py-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div
                            v-for="(comptage, i) in inventory.comptages"
                            :key="i"
                            class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 group">
                            <!-- Numéro de comptage -->
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="font-normal dark:text-slate-100 text-base">
                                    {{ i + 1 }}{{ i === 0 ? 'er' : 'ème' }} comptage
                                </h4>
                            </div>

                            <!-- Mode de comptage -->
                            <div class="mb-4">
                                <div class="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            Mode de comptage
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <!-- Icône selon le mode -->
                                        <div
                                            v-if="comptage.count_mode === 'image de stock'"
                                            class="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <svg class="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div
                                            v-else-if="comptage.count_mode === 'en vrac'"
                                            class="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <svg class="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                            </svg>
                                        </div>
                                        <div
                                            v-else-if="comptage.count_mode === 'par article'"
                                            class="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <svg class="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                                            </svg>
                                        </div>

                                        <!-- Badge avec couleur selon le mode -->
                                        <span :class="getCountModeBadgeClass(comptage.count_mode)"
                                            class="px-3 py-1 rounded-full text-xs font-medium">
                                            {{ getCountModeLabel(comptage.count_mode) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Options avec badges colorés -->
                            <div class="space-y-2">
                                <div class="flex flex-wrap gap-2">
                                    <!-- Afficher les champs actifs de l'API -->
                                    <template
                                        v-if="(comptage as any).champs_actifs && Array.isArray((comptage as any).champs_actifs)">
                                        <span
                                            v-for="champ in (comptage as any).champs_actifs"
                                            :key="champ"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            {{ champ }}
                                        </span>
                                    </template>

                                    <!-- Fallback pour l'ancienne structure -->
                                    <template v-else>
                                        <span
                                            v-if="(comptage as any).is_variant"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            Variantes
                                        </span>
                                        <span
                                            v-if="(comptage as any).show_product"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            Guide Article
                                        </span>
                                        <span
                                            v-if="(comptage as any).quantity_show"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            Guide Quantité
                                        </span>
                                        <span
                                            v-if="(comptage as any).unit_scanned"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            Scanner unitaire
                                        </span>
                                        <span
                                            v-if="(comptage as any).entry_quantity"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            Saisie quantité
                                        </span>
                                        <span
                                            v-if="(comptage as any).dlc"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            DLC
                                        </span>
                                        <span
                                            v-if="(comptage as any).n_serie"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            N° Série
                                        </span>
                                        <span
                                            v-if="(comptage as any).n_lot"
                                            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            N° Lot
                                        </span>
                                    </template>
                                </div>

                                <!-- Indicateur si aucune option -->
                                <div
                                    v-if="!hasAnyOption(comptage)"
                                    class="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                    <svg class="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                    </svg>
                                    <span class="text-sm text-slate-500 dark:text-slate-400">
                                        Configuration de base
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Magasins associés -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                <IconBox class="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    Magasins associés
                                </h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">
                                    Magasins concernés par l'inventaire
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-slate-500 dark:text-slate-400">
                                {{ inventory.magasins.length }} magasin(s)
                            </span>
                            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <!-- Grille des magasins -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            v-for="(magasin, index) in inventory.magasins"
                            :key="index"
                            class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:-translate-y-1">
                            <!-- Badge de statut -->
                            <div class="absolute top-3 right-3">
                                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>

                            <!-- Icône et informations principales -->
                            <div class="flex items-start gap-3 mb-3">
                                <div class="relative">
                                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                        <IconBox class="w-6 h-6 text-white" />
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-base truncate">
                                        {{ magasin.nom }}
                                    </h4>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        Magasin {{ index + 1 }}
                                    </p>
                                </div>
                            </div>

                            <!-- Date du magasin -->
                            <div class="space-y-2 mb-3">
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                    </svg>
                                    <span class="text-sm text-slate-600 dark:text-slate-300">
                                        {{ magasin.date ? formatDate(magasin.date) : 'Non définie' }}
                                    </span>
                                </div>
                            </div>

                            <!-- Bouton de lancement -->
                            <button
                                @click="goToWarehousePlanning(magasin.nom)"
                                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                                <IconLaunch class="w-4 h-4" />
                                <span>Lancer</span>
                            </button>
                        </div>
                    </div>

                    <!-- Message si aucun magasin -->
                    <div v-if="inventory.magasins.length === 0" class="text-center py-8">
                        <div class="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <IconBox class="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                            Aucun magasin associé
                        </h4>
                        <p class="text-slate-500 dark:text-slate-400">
                            Aucun magasin n'a été associé à cet inventaire pour le moment.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Équipes assignées -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    Équipes assignées
                                </h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">
                                    Équipes responsables de l'inventaire
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-slate-500 dark:text-slate-400">
                                {{ (inventory.equipe && Array.isArray(inventory.equipe) ? inventory.equipe.length : 0) }} équipe(s)
                            </span>
                            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            v-for="(team, index) in paginatedTeam"
                            :key="index"
                            class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1">
                            <div class="absolute top-3 right-3">
                                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>

                            <div class="flex items-start gap-3 mb-3">
                                <div class="relative">
                                    <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                        </svg>
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-base truncate">
                                        {{ getTeamUserName(team) }}
                                    </h4>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {{ team.nombre_comptage ? `${team.nombre_comptage} comptage(s)` : `Équipe ${(teamCurrentPage - 1) * teamItemsPerPage + index + 1}` }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination pour l'équipe -->
                    <div
                        v-if="inventory.equipe && Array.isArray(inventory.equipe) && inventory.equipe.length > teamItemsPerPage"
                        class="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div class="text-sm text-slate-500 dark:text-slate-400">
                            Affichage de {{ (teamCurrentPage - 1) * teamItemsPerPage + 1 }} à
                            {{ Math.min(teamCurrentPage * teamItemsPerPage, inventory.equipe.length) }}
                            sur {{ inventory.equipe.length }} équipe(s)
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                @click="teamCurrentPage = Math.max(1, teamCurrentPage - 1)"
                                :disabled="teamCurrentPage === 1"
                                class="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                Précédent
                            </button>
                            <div class="flex items-center gap-1">
                                <button
                                    v-for="page in teamTotalPages"
                                    :key="page"
                                    @click="teamCurrentPage = page"
                                    :class="[
                                        'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                        teamCurrentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    ]">
                                    {{ page }}
                                </button>
                            </div>
                            <button
                                @click="teamCurrentPage = Math.min(teamTotalPages, teamCurrentPage + 1)"
                                :disabled="teamCurrentPage === teamTotalPages"
                                class="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                Suivant
                            </button>
                        </div>
                    </div>

                    <!-- Message si aucune équipe -->
                    <div
                        v-if="!inventory.equipe || !Array.isArray(inventory.equipe) || inventory.equipe.length === 0"
                        class="text-center py-8">
                        <div class="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <svg class="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                        </div>
                        <h4 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                            Aucune équipe assignée
                        </h4>
                        <p class="text-slate-500 dark:text-slate-400">
                            Aucune équipe n'a été assignée à cet inventaire pour le moment.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Ressources -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    Ressources (Optionnel)
                                </h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">
                                    Ressources nécessaires pour l'inventaire
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button
                                @click="openAddResourceModal"
                                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                </svg>
                                Ajouter des ressources
                            </button>
                            <span class="text-sm text-slate-500 dark:text-slate-400">
                                {{ (inventory.ressources && Array.isArray(inventory.ressources) ? inventory.ressources.length : 0) }} ressource(s)
                            </span>
                            <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <!-- Grille des ressources -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            v-for="(ressource, index) in (inventory.ressources && Array.isArray(inventory.ressources) ? inventory.ressources : [])"
                            :key="index"
                            class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:-translate-y-1">
                            <!-- Badge de quantité -->
                            <div class="absolute top-3 right-3">
                                <div class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                    <span class="text-xs font-bold text-purple-600 dark:text-purple-400">
                                        {{ ressource.quantity || 0 }}
                                    </span>
                                </div>
                            </div>

                            <!-- Icône et informations principales -->
                            <div class="flex items-start gap-3 mb-3">
                                <div class="relative">
                                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                        </svg>
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-base truncate">
                                        {{ ressource.ressource_nom || 'Ressource sans nom' }}
                                    </h4>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {{ ressource.reference || 'Référence non définie' }}
                                    </p>
                                </div>
                            </div>

                            <!-- Détails de la ressource -->
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-slate-500 dark:text-slate-400">Quantité</span>
                                    <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                        {{ ressource.quantity || 0 }}
                                    </span>
                                </div>
                                <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500" style="width: 100%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Message si aucune ressource -->
                    <div
                        v-if="!inventory.ressources || !Array.isArray(inventory.ressources) || inventory.ressources.length === 0"
                        class="text-center py-8">
                        <div class="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <svg class="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                        </div>
                        <h4 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                            Aucune ressource
                        </h4>
                        <p class="text-slate-500 dark:text-slate-400">
                            Aucune ressource n'a été assignée à cet inventaire pour le moment.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal d'ajout de ressources -->
        <Modal v-model="showAddResourceModal" title="Ajouter des ressources" size="lg">
            <div class="space-y-6">
                <!-- Liste des lignes de ressources -->
                <div class="space-y-4">
                    <div
                        v-for="(line, index) in resourceLines"
                        :key="index"
                        class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <FormBuilder
                            v-model="resourceLines[index]"
                            :fields="resourceFields(index)"
                            :columns="2"
                            hide-submit />
                        <button
                            v-if="resourceLines.length > 1"
                            @click="removeResourceLine(index)"
                            type="button"
                            class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Bouton ajouter une ligne -->
                <div class="flex justify-center">
                    <button
                        @click="addResourceLine"
                        type="button"
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                        Ajouter une ressource
                    </button>
                </div>

                <!-- Boutons d'action -->
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <button
                        @click="showAddResourceModal = false"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Annuler
                    </button>
                    <button
                        @click="onAddResources"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 border border-transparent rounded-md hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
                        Ajouter les ressources
                    </button>
                </div>
            </div>
        </Modal>

        <!-- Composant d'alerte de validation -->
        <ValidationAlert
            :show="validationAlert.showAlert.value"
            :title="validationAlert.alertData.value.title"
            :subtitle="validationAlert.alertData.value.subtitle"
            :message="validationAlert.alertData.value.message"
            :errors="validationErrors"
            :infos="validationInfos"
            @close="validationAlert.hide"
        />
        </template>

        <!-- Message d'erreur si aucun inventaire et erreur -->
        <div v-else-if="error" class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="text-center py-8">
                <div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h4 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Erreur de chargement
                </h4>
                <p class="text-slate-500 dark:text-slate-400">
                    {{ error }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue InventoryDetail - Détails d'un inventaire
 *
 * Cette vue permet de :
 * - Visualiser les informations générales d'un inventaire
 * - Gérer les actions sur l'inventaire (lancer, modifier, annuler, terminer, clôturer)
 * - Visualiser les paramètres de comptage, magasins, équipes et ressources
 * - Ajouter des ressources à l'inventaire
 * - Exporter l'inventaire en PDF
 *
 * @component InventoryDetail
 */

// ===== IMPORTS VUE =====
import { onMounted, ref, computed, toRaw } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'
import { useValidationAlert } from '@/services/validationAlertService'

// ===== IMPORTS COMPOSANTS =====
import Modal from '@/components/Modal.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'
import ValidationAlert from '@/components/ValidationAlert.vue'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'

// ===== IMPORTS COMPOSABLES =====
import { useInventoryDetail } from '@/composables/useInventoryDetail'

// ===== IMPORTS COMPOSANTS =====
import InventoryDetailSkeleton from '@/components/InventoryDetailSkeleton.vue'

// ===== IMPORTS STORES =====
import { useResourceStore } from '@/stores/resource'

// ===== IMPORTS TYPES =====
import type { FieldConfig } from '@/interfaces/form'

// ===== IMPORTS ICÔNES =====
import IconDownload from '@/components/icon/icon-download.vue'
import IconFile from '@/components/icon/icon-file.vue'
import IconPlay from '@/components/icon/icon-play.vue'
import IconEdit from '@/components/icon/icon-edit.vue'
import IconCancel from '@/components/icon/icon-cancel.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconLock from '@/components/icon/icon-lock.vue'
import IconBox from '@/components/icon/icon-box.vue'
import IconLaunch from '@/components/icon/icon-launch.vue'
import IconUpload from '@/components/icon/icon-upload.vue'

// ===== ROUTE =====
const route = useRoute()
const router = useRouter()
const inventoryReference = route.params.reference as string

// ===== COMPOSABLE =====
/**
 * Initialisation du composable useInventoryDetail
 * Gère toute la logique métier de la page
 */
const {
    inventory,
    loading,
    error,
    inventoryId,
    magasins,
    launchInventory,
    editInventory,
    cancelInventory,
    terminateInventory,
    closeInventory,
    formatDate,
    getStatusClass,
    handleGoToImportTracking,
    loadDetailData,
    initializeInventory,
    assignResourceToInventory,
    getAvailableResources,
    exportToPDF,
    exportJobsToPDF
} = useInventoryDetail(inventoryReference)

// ===== STORES =====
const resourceStore = useResourceStore()

// ===== ÉTAT LOCAL =====
/**
 * État d'ouverture du modal d'ajout de ressources
 */
const showAddResourceModal = ref(false)

/**
 * Lignes de ressources dans le formulaire
 */
const resourceLines = ref([{ resource: '', quantity: 1 }])

/**
 * Ressources disponibles
 */
const availableResources = ref<any[]>([])

/**
 * Pagination pour l'équipe
 */
const teamCurrentPage = ref(1)
const teamItemsPerPage = ref(6)

// ===== COMPOSABLES SERVICES =====
/**
 * Service d'alerte de validation
 */
const validationAlert = useValidationAlert()

// ===== COMPUTED =====
/**
 * Erreurs de validation
 */
const validationErrors = computed(() => toRaw(validationAlert.alertData.value.errors || []))

/**
 * Informations de validation
 */
const validationInfos = computed(() => toRaw(validationAlert.alertData.value.infos || []))

/**
 * Équipe paginée
 */
const paginatedTeam = computed(() => {
    const teamList = inventory.value?.equipe && Array.isArray(inventory.value.equipe)
        ? inventory.value.equipe
        : []

    const start = (teamCurrentPage.value - 1) * teamItemsPerPage.value
    const end = start + teamItemsPerPage.value
    return teamList.slice(start, end)
})

/**
 * Nombre total de pages pour l'équipe
 */
const teamTotalPages = computed(() => {
    const teamList = inventory.value?.equipe && Array.isArray(inventory.value.equipe)
        ? inventory.value.equipe
        : []
    return Math.ceil(teamList.length / teamItemsPerPage.value)
})

/**
 * Options de ressources pour les selects
 */
const resourceOptions = computed(() => {
    return resourceStore.getResources
        .filter(resource => resource.id)
        .map(resource => ({
            value: resource.id!.toString(),
            label: resource.ressource_nom || resource.libelle
        }))
})

/**
 * Classe CSS commune pour les boutons d'action
 * Bordure primaire et fond blanc avec effet hover
 */
const ACTION_BUTTON_CLASS =
    'bg-white text-primary border border-primary hover:bg-primary hover:text-white ' +
    'dark:bg-slate-900 dark:text-primary dark:border-primary dark:hover:bg-primary ' +
    'dark:hover:text-white transition-all duration-200'

/**
 * Boutons d'action selon le statut de l'inventaire
 */
const actionButtons = computed<ButtonGroupButton[]>(() => {
    const buttons: ButtonGroupButton[] = []

    // Boutons selon le statut
    if (inventory.value?.status === 'EN PREPARATION') {
        buttons.push(
            {
                id: 'launch',
                label: 'Lancer',
                icon: IconPlay,
                onClick: async () => { await launchInventory() },
                variant: 'default',
                class: ACTION_BUTTON_CLASS
            },
            {
                id: 'edit',
                label: 'Modifier',
                icon: IconEdit,
                onClick: editInventory,
                variant: 'default',
                class: ACTION_BUTTON_CLASS
            }
        )
    } else if (inventory.value?.status === 'EN REALISATION') {
        buttons.push(
            {
                id: 'cancel',
                label: 'Annuler',
                icon: IconCancel,
                onClick: async () => { await cancelInventory() },
                variant: 'default',
                class: ACTION_BUTTON_CLASS
            },
            {
                id: 'terminate',
                label: 'Terminer',
                icon: IconCheck,
                onClick: async () => { await terminateInventory() },
                variant: 'default',
                class: ACTION_BUTTON_CLASS
            }
        )
    } else if (inventory.value?.status === 'TERMINE') {
        buttons.push({
            id: 'close',
            label: 'Clôturer',
            icon: IconLock,
            onClick: async () => { await closeInventory() },
            variant: 'default',
            class: ACTION_BUTTON_CLASS
        })
    }

    // Bouton Suivi Import
    buttons.push({
        id: 'import-tracking',
        label: 'Suivi Import',
        icon: IconUpload,
        onClick: () => { handleGoToImportTracking() },
        variant: 'default',
        class: ACTION_BUTTON_CLASS
    })

    // Boutons d'export toujours visibles (sauf si statut CLOTURE)
    if (inventory.value?.status !== 'CLOTURE' && inventory.value?.status !== 'CLOTUREE') {
        buttons.push({
            id: 'export-detail',
            label: 'Exporter Détail',
            icon: IconFile,
            onClick: exportToPDF,
            variant: 'default',
            class: ACTION_BUTTON_CLASS
        })

        if (inventoryId.value) {
            buttons.push({
                id: 'export-jobs',
                label: 'PDF Jobs',
                icon: IconDownload,
                onClick: exportJobsToPDF,
                variant: 'default',
                class: ACTION_BUTTON_CLASS
            })
        }
    }

    return buttons
})

// ===== MÉTHODES UTILITAIRES =====

/**
 * Vérifie si un comptage a des options activées
 *
 * @param comptage - Objet comptage à vérifier
 * @returns true si au moins une option est activée
 */
const hasAnyOption = (comptage: any): boolean => {
    if (comptage.champs_actifs && Array.isArray(comptage.champs_actifs)) {
        return comptage.champs_actifs.length > 0
    }

    return (comptage as any).isVariante ||
        (comptage as any).guideArticle ||
        (comptage as any).guideQuantite ||
        (comptage as any).dlc ||
        (comptage as any).numeroSerie ||
        (comptage as any).numeroLot ||
        (comptage as any).inputMethod === 'scanner' ||
        (comptage as any).inputMethod === 'saisie' ||
        (comptage as any).scannerUnitaire ||
        (comptage as any).saisieQuantite ||
        (comptage as any).is_variant ||
        (comptage as any).show_product ||
        (comptage as any).quantity_show ||
        (comptage as any).unit_scanned ||
        (comptage as any).entry_quantity
}

/**
 * Retourne la classe CSS pour le badge de mode de comptage
 *
 * @param countMode - Mode de comptage
 * @returns Classe CSS pour le badge
 */
const getCountModeBadgeClass = (countMode: string): string => {
    switch (countMode) {
        case 'image de stock':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
        case 'en vrac':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
        case 'par article':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
    }
}

/**
 * Retourne le label affiché pour le mode de comptage
 *
 * @param countMode - Mode de comptage
 * @returns Label à afficher
 */
const getCountModeLabel = (countMode: string): string => {
    switch (countMode) {
        case 'image de stock':
            return 'Image de stock'
        case 'en vrac':
            return 'En vrac'
        case 'par article':
            return 'Par article'
        default:
            return countMode || 'Non défini'
    }
}

// ===== GESTION DES RESSOURCES =====

/**
 * Ajoute une ligne de ressource au formulaire
 */
const addResourceLine = () => {
    resourceLines.value.push({ resource: '', quantity: 1 })
}

/**
 * Supprime une ligne de ressource du formulaire
 *
 * @param index - Index de la ligne à supprimer
 */
const removeResourceLine = (index: number) => {
    if (resourceLines.value.length > 1) {
        resourceLines.value.splice(index, 1)
    }
}

/**
 * Filtre les options disponibles pour chaque ligne (éviter les doublons)
 *
 * @param currentIndex - Index de la ligne actuelle
 * @returns Options de ressources disponibles
 */
const getAvailableResourceOptions = (currentIndex: number) => {
    const selected = resourceLines.value
        .map((line, idx) => idx !== currentIndex ? line.resource : null)
        .filter((value): value is string => value !== null && value !== '')
    return resourceOptions.value.filter(opt => !selected.includes(opt.value))
}

/**
 * Champs dynamiques pour FormBuilder (select + input number)
 *
 * @param index - Index de la ligne
 * @returns Configuration des champs
 */
const resourceFields = (index: number): FieldConfig[] => [
    {
        key: 'resource',
        label: 'Ressource',
        type: 'select',
        options: getAvailableResourceOptions(index),
        required: true,
        props: { placeholder: 'Choisissez une ressource' }
    },
    {
        key: 'quantity',
        label: 'Quantité',
        type: 'number',
        required: true,
        props: { min: 1, type: 'number', inputmode: 'numeric', placeholder: 'Quantité' }
    }
]

/**
 * Charge les ressources disponibles
 */
const loadAvailableResources = async () => {
    try {
        const resources = await getAvailableResources()
        availableResources.value = resources || []
    } catch (error) {
        logger.error('Erreur lors du chargement des ressources disponibles', error)
        availableResources.value = []
    }
}

/**
 * Gère l'ajout de ressources
 */
const onAddResources = async () => {
    try {
        const validLines = resourceLines.value.filter(line => line.resource && line.quantity > 0)

        if (validLines.length === 0) {
            alert('Veuillez sélectionner au moins une ressource avec une quantité valide.')
            return
        }

        const resourcesToAssign = validLines.map(line => ({
            resource_id: parseInt(line.resource),
            quantity: line.quantity
        }))

        await assignResourceToInventory(resourcesToAssign)

        showAddResourceModal.value = false
        resourceLines.value = [{ resource: '', quantity: 1 }]

        await loadDetailData()
    } catch (error) {
        logger.error('Erreur lors de l\'ajout des ressources', error)
    }
}

/**
 * Ouvre le modal d'ajout de ressources
 */
const openAddResourceModal = async () => {
    // Ne charger les ressources que si elles ne sont pas déjà chargées
    if (resourceStore.getResources.length === 0) {
        await resourceStore.fetchResources()
    }
    await loadAvailableResources()
    resourceLines.value = [{ resource: '', quantity: 1 }]
    showAddResourceModal.value = true
}


/**
 * Récupère le nom d'utilisateur d'une équipe
 *
 * @param team - Objet équipe
 * @returns Nom d'utilisateur
 */
const getTeamUserName = (team: any): string => {
    if (team.user) {
        return team.user
    }
    if (team.userObject?.username) {
        return team.userObject.username
    }
    return 'Utilisateur inconnu'
}

/**
 * Navigue vers la page de planning d'un warehouse
 *
 * @param warehouseName - Nom du warehouse
 */
const goToWarehousePlanning = (warehouseName: string) => {
    router.push({
        name: 'inventory-planning',
        params: {
            reference: inventoryReference,
            warehouse: warehouseName
        }
    })
}

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(async () => {
    // Ne charger les ressources que si elles ne sont pas déjà chargées
    if (resourceStore.getResources.length === 0) {
        await resourceStore.fetchResources()
    }
    // Initialiser l'inventaire (récupération de l'ID puis chargement des détails)
    await initializeInventory()
})
</script>
