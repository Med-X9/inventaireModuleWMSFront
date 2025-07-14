<template>
    <div class="space-y-2">
        <!-- En-tête -->
        <div class="flex flex-wrap gap-2 mb-4 justify-end">
            <!-- Buttons for "En préparation" status -->
            <template v-if="inventory?.status == 'EN PREPARATION'">
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="launchInventory">
                    <IconPlay class="w-4 h-4" />
                    Lancer
                </button>
                <button class="btn btn-outline-primary p-2 px-4 flex items-center gap-2" @click="editInventory">
                    <IconEdit class="w-4 h-4" />
                    Modifier
                </button>
            </template>

            <!-- Buttons for "En réalisation" status -->
            <template v-else-if="inventory?.status === 'EN REALISATION'">
                <button class="btn btn-danger p-2 px-4 flex items-center gap-2" @click="cancelInventory">
                    <IconCancel class="w-4 h-4" />
                    Annuler
                </button>
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="terminateInventory">
                    <IconCheck class="w-4 h-4" />
                    Terminer
                </button>
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="closeInventory">
                    <IconLock class="w-4 h-4" />
                    Clôturer
                </button>
            </template>

            <!-- Buttons for "Terminé" status -->
            <template v-else-if="inventory?.status === 'TERMINE'">
                <button class="btn btn-primary p-2 px-4 flex items-center gap-2" @click="closeInventory">
                    <IconLock class="w-4 h-4" />
                    Clôturer
                </button>
            </template>

            <!-- PDF button - always visible except for "Clôturé" status where it's the only button -->
            <button type="button" @click="exportToPDF" class="btn btn-secondary p-2 px-4 flex items-center gap-2">
                <IconDownload class="w-4 h-4" />
                PDF
            </button>
        </div>

        <!-- Container principal -->
        <div v-if="inventory" class="panel">
            <!-- Onglets -->
            <div class="border-b border-gray-200 overflow-x-auto md:overflow-hidden">
                <nav class="flex py-3 gap-6 sm:gap-12 -mb-px min-w-max">
                    <button v-for="tab in tabs" :key="tab.id" @click="currentTab = tab.id" :class="[
                        'font-medium whitespace-nowrap pb-2',
                        currentTab === tab.id
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-secondary dark:text-white-dark hover:text-secondary-600 hover:border-secondary-light'
                    ]">
                        {{ tab.label }}
                    </button>
                </nav>
            </div>

            <div>
                <!-- Informations générales -->
                <div v-if="currentTab === 'general'" class="space-y-6 py-8">
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div
                            class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 dark:border-gray-700">
                            <h2 class="text-lg text-gray-800 dark:text-white-light mb-2 sm:mb-0">Informations générales
                            </h2>
                            <span :class="[
                                'px-3 py-1 rounded-full text-sm font-semibold',
                                getStatusClass(inventory?.status)
                            ]">
                                {{ inventory.status }}
                            </span>
                        </div>
                        <div class="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            <!-- Référence -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Référence</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.reference || 'Non défini' }}
                                </span>
                            </div>
                            <!-- Libellé -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Libellé</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.label || 'Non défini' }}
                                </span>
                            </div>
                            <!-- Date d'inventaire -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Date d'inventaire</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ formatDate(inventory.date) }}
                                </span>
                            </div>
                            <!-- Type -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Type</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.inventory_type || 'Non défini' }}
                                </span>
                            </div>
                            <!-- Compte -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Compte</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.account_name || 'Non défini' }}
                                </span>
                            </div>
                            <!-- Dates de statut -->
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">En préparation</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.en_preparation_status_date ?
                                        formatDate(inventory.en_preparation_status_date) :
                                        'Non défini' }}
                                </span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">En réalisation</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.en_realisation_status_date ?
                                        formatDate(inventory.en_realisation_status_date) :
                                        'Non défini' }}
                                </span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Terminé</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.termine_status_date ? formatDate(inventory.termine_status_date) : 'Non défini' }}
                                </span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-sm text-gray-500 dark:text-gray-400">Clôturé</span>
                                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                                    {{ inventory.cloture_status_date ? formatDate(inventory.cloture_status_date) : 'Non défini'}}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Card : Paramètres de comptage -->
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div
                            class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                            <div class="flex items-center gap-3">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-white-light">Paramètres de
                                    comptage
                                </h3>
                            </div>
                        </div>
                        <div class="px-4 sm:px-4 py-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <div v-for="(comptage, i) in inventory.comptages" :key="i"
                                    class="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-1 group">
                                    <!-- Numéro de comptage avec badge -->
                                    <div class="flex items-center justify-between mb-4">
                                        <div class="flex items-center gap-3">
                                            <h4 class="font-normal dark:text-gray-100 text-base">
                                                {{ i + 1 }}{{ i === 0 ? 'er' : 'ème' }} comptage
                                            </h4>
                                        </div>
                                    </div>

                                    <!-- Mode de comptage avec style amélioré -->
                                    <div class="mb-4">
                                        <div
                                            class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div class="flex items-center gap-3">
                                                <span
                                                    class="text-sm font-semibold text-gray-700 dark:text-gray-200">Mode
                                                    de
                                                    comptage</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <!-- Icône selon le mode -->
                                                <div v-if="comptage.count_mode === 'image de stock'"
                                                    class="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                    <svg class="w-3 h-3 text-blue-600 dark:text-blue-400"
                                                        fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd"
                                                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                                            clip-rule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div v-else-if="comptage.count_mode === 'en vrac'"
                                                    class="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                    <svg class="w-3 h-3 text-green-600 dark:text-green-400"
                                                        fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                    </svg>
                                                </div>
                                                <div v-else-if="comptage.count_mode === 'par article'"
                                                    class="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                    <svg class="w-3 h-3 text-purple-600 dark:text-purple-400"
                                                        fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                        <path fill-rule="evenodd"
                                                            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                                            clip-rule="evenodd" />
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
                                                <span v-for="champ in (comptage as any).champs_actifs" :key="champ"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    {{ champ }}
                                                </span>
                                            </template>

                                            <!-- Fallback pour l'ancienne structure -->
                                            <template v-else>
                                                <span v-if="(comptage as any).is_variant"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    Variantes
                                                </span>

                                                <span v-if="(comptage as any).show_product"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    Guide Article
                                                </span>

                                                <span v-if="(comptage as any).quantity_show"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    Guide Quantité
                                                </span>

                                                <span v-if="(comptage as any).unit_scanned"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    Scanner unitaire
                                                </span>

                                                <span v-if="(comptage as any).entry_quantity"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    Saisie quantité
                                                </span>

                                                <span v-if="(comptage as any).dlc"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    DLC
                                                </span>

                                                <span v-if="(comptage as any).n_serie"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    N° Série
                                                </span>

                                                <span v-if="(comptage as any).n_lot"
                                                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-primary-600 bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    N° Lot
                                                </span>
                                            </template>
                                        </div>

                                        <!-- Indicateur si aucune option -->
                                        <div v-if="!hasAnyOption(comptage)"
                                            class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clip-rule="evenodd" />
                                            </svg>
                                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                                Configuration de base
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card : Magasins associés -->
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd"
                                                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white-light">Magasins
                                            associés
                                        </h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Magasins concernés par
                                            l'inventaire
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm text-gray-500 dark:text-gray-400">{{ inventory.magasins.length
                                    }}
                                        magasin(s)</span>
                                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <div class="p-6">
                            <!-- Grille des magasins avec design moderne -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="(magasin, index) in inventory.magasins" :key="index"
                                    class="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:-translate-y-1">

                                    <!-- Badge de statut -->
                                    <div class="absolute top-3 right-3">
                                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>

                                    <!-- Icône et informations principales -->
                                    <div class="flex items-start gap-3 mb-3">
                                        <div class="relative">
                                            <!-- Icône avec gradient -->
                                            <div
                                                class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd"
                                                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </div>
                                            <!-- Indicateur de statut -->
                                            <div
                                                class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                                            </div>
                                        </div>

                                        <div class="flex-1 min-w-0">
                                            <h4
                                                class="font-semibold text-gray-800 dark:text-white-light text-base truncate">
                                                {{ magasin.nom }}
                                            </h4>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                Magasin {{ index + 1 }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Date du magasin -->
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd"
                                                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                                    clip-rule="evenodd" />
                                            </svg>
                                            <span class="text-sm text-gray-600 dark:text-gray-300">
                                                {{ formatDate(magasin.date) }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Actions au survol -->
                                    <div
                                        class="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div class="flex gap-2">
                                            <button
                                                class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                                                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fill-rule="evenodd"
                                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                                                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd"
                                                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Message si aucun magasin -->
                            <div v-if="inventory.magasins.length === 0" class="text-center py-8">
                                <div
                                    class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd"
                                            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <h4 class="text-lg font-medium text-gray-900 dark:text-white-light mb-2">Aucun magasin
                                    associé
                                </h4>
                                <p class="text-gray-500 dark:text-gray-400">Aucun magasin n'a été associé à cet inventaire pour
                                    le moment.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Card : Équipes assignées -->
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 bg-gradient-to-br bg-blue-100 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white-light">Équipes
                                            assignées
                                        </h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Équipes responsables de l'inventaire
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm text-gray-500 dark:text-gray-400">{{ (inventory.equipe &&
                                        Array.isArray(inventory.equipe) ? inventory.equipe.length : 0) }}
                                        équipe(s)</span>
                                    <div class="w-2 h-2 bg-primary rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="(team, index) in (inventory.equipe && Array.isArray(inventory.equipe) ? inventory.equipe : [])"
                                    :key="index"
                                    class="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:-translate-y-1">

                                    <div class="absolute top-3 right-3">
                                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>

                                    <div class="flex items-start gap-3 mb-3">
                                        <div class="relative">
                                            <!-- Avatar avec gradient -->
                                            <div
                                                class="w-8 h-8 w-8 h-8 bg-gradient-to-br bg-blue-100 bg-blue-400 rounded-lg flex items-center justify-center">
                                                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                                </svg>
                                            </div>
                                            <!-- Indicateur de statut -->
                                            <div
                                                class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                                            </div>
                                        </div>

                                        <div class="flex-1 min-w-0">
                                            <h4
                                                class="font-semibold text-gray-800 dark:text-white-light text-base truncate">
                                                {{ team.user && team.user.username ? team.user.username : 'Équipe sans nom' }}
                                            </h4>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                Équipe {{ index + 1 }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Actions au survol -->
                                    <div
                                        class="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div class="flex gap-2">
                                            <button
                                                class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                                                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fill-rule="evenodd"
                                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                                                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd"
                                                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Message si aucune équipe -->
                            <div v-if="!inventory.equipe || !Array.isArray(inventory.equipe) || inventory.equipe.length === 0"
                                class="text-center py-8">
                                <div
                                    class="w-8 h-8 w-8 h-8 bg-gradient-to-br bg-blue-100 bg-blue-400 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                    </svg>
                                </div>
                                <h4 class="text-lg font-medium text-gray-900 dark:text-white-light mb-2">Aucune équipe
                                    assignée
                                </h4>
                                <p class="text-gray-500 dark:text-gray-400">Aucune équipe n'a été assignée à cet
                                    inventaire pour
                                    le moment.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Card : Ressources -->
                    <div
                        class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white-light">Ressources
                                            (Optionnel)
                                        </h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Ressources nécessaires pour
                                            l'inventaire</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <button @click="openAddResourceModal"
                                        class="btn btn-primary p-2 px-4 flex items-center gap-2">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd"
                                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                clip-rule="evenodd" />
                                        </svg>
                                        Ajouter des ressources
                                    </button>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">{{
                                        (inventory.ressources && Array.isArray(inventory.ressources) ?
                                        inventory.ressources.length : 0) }}
                                        ressource(s)</span>
                                    <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <div class="p-6">
                            <!-- Grille des ressources avec design moderne -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="(ressource, index) in (inventory.ressources && Array.isArray(inventory.ressources) ? inventory.ressources : [])"
                                    :key="index"
                                    class="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:-translate-y-1">
                                    <!-- Badge de quantité -->
                                    <div class="absolute top-3 right-3">
                                        <div class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                            <span class="text-xs font-bold text-purple-600 dark:text-purple-400">{{
                                                ressource.quantity || 0 }}</span>
                                        </div>
                                    </div>
                                    <!-- Icône et informations principales -->
                                    <div class="flex items-start gap-3 mb-3">
                                        <div class="relative">
                                            <!-- Icône avec gradient -->
                                            <div
                                                class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                                </svg>
                                            </div>
                                            <!-- Indicateur de statut -->
                                            <div
                                                class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                                            </div>
                                        </div>

                                        <div class="flex-1 min-w-0">
                                            <h4
                                                class="font-semibold text-gray-800 dark:text-white-light text-base truncate">
                                                {{ ressource.ressource_nom || 'Ressource sans nom' }}
                                            </h4>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {{ ressource.reference || 'Référence non définie' }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Détails de la ressource -->
                                    <div class="space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs text-gray-500 dark:text-gray-400">Quantité</span>
                                            <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">{{
                                                ressource.quantity || 0 }}</span>
                                        </div>
                                        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                                style="width: 100%"></div>
                                        </div>
                                    </div>

                                    <!-- Actions au survol -->
                                    <div
                                        class="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div class="flex gap-2">
                                            <button
                                                class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                                                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fill-rule="evenodd"
                                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                                                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd"
                                                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Message si aucune ressource -->
                            <div v-if="!inventory.ressources || !Array.isArray(inventory.ressources) || inventory.ressources.length === 0"
                                class="text-center py-8">
                                <div
                                    class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                    </svg>
                                </div>
                                <h4 class="text-lg font-medium text-gray-900 dark:text-white-light mb-2">Aucune
                                    ressource</h4>
                                <p class="text-gray-500 dark:text-gray-400">Aucune ressource n'a été assignée à cet
                                    inventaire
                                    pour le moment.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Comptages détaillés -->
                <div v-else class="py-5">
                    <template v-for="tab in tabs.filter(t => t.id !== 'general')" :key="tab.id">
                        <div v-if="currentTab === tab.id">
                            <div class="space-y-1">
                                <!-- Statistiques au-dessus de la table -->
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-4">
                                    <!-- En attente -->
                                    <div
                                        class="flex items-center justify-between bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg px-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.3 h-9.5">
                                        <div class="flex items-center">
                                            <div class="flex items-center space-x-1">
                                                <div class="w-2 h-2 bg-primary rounded-full animate-pulse">
                                                </div>
                                                <div class="w-1 h-1 bg-primary rounded-full opacity-60">
                                                </div>
                                                <div class="w-1 h-1 bg-primary rounded-full opacity-30">
                                                </div>
                                            </div>
                                            <span class="text-sm font-medium text-gray-600 ml-3">En
                                                attente</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-lg font-medium text-gray-800 mr-2">{{
                                                getRemainingJobsCount(tab.id) }}</span>
                                        </div>
                                    </div>

                                    <!-- En cours -->
                                    <div
                                        class="flex items-center justify-between bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg px-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.3 h-9.5">
                                        <div class="flex items-center">
                                            <div class="flex items-center space-x-1">
                                                <div class="w-1.5 h-1.5 bg-info rounded-full animate-bounce">
                                                </div>
                                                <div class="w-1.5 h-1.5 bg-info rounded-full animate-bounce"
                                                    style="animation-delay: 0.1s"></div>
                                                <div class="w-1.5 h-1.5 bg-info rounded-full animate-bounce"
                                                    style="animation-delay: 0.2s"></div>
                                            </div>
                                            <span class="text-sm font-medium text-gray-600 ml-3">En
                                                cours</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-lg font-medium text-gray-800 mr-2">{{
                                                getInProgressJobsCount(tab.id) }}</span>
                                        </div>
                                    </div>

                                    <!-- Terminés -->
                                    <div
                                        class="flex items-center justify-between bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg px-4 h-9.5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.3">
                                        <div class="flex items-center">
                                            <div class="flex items-center">
                                                <div class="w-2 h-2 bg-success rounded-full relative">
                                                    <div
                                                        class="absolute inset-0 w-2 h-2 bg-success rounded-full animate-ping opacity-40">
                                                    </div>
                                                </div>
                                                <div class="w-2 h-0.5 bg-success ml-1"></div>
                                            </div>
                                            <span class="text-sm font-medium text-gray-600 ml-3">Terminés</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-lg font-medium text-gray-800 mr-2">{{
                                                getCompletedJobsCount(tab.id) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Table view -->
                                <div class="overflow-hidden">
                                    <DataTableNew :columns="jobColumns" :rowDataProp="getJobsForTab(tab.id)"
                                        :pagination="true" :showColumnSelector="true"
                                        :storageKey="'inventory_jobs_' + tab.id" :actions="[]" />
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal d'ajout de ressources -->
    <Modal v-model="showAddResourceModal" title="Ajouter des ressources" size="lg">
        <div class="space-y-6">
            <!-- Liste des lignes de ressources -->
            <div class="space-y-4">
                <div v-for="(line, index) in resourceLines" :key="index"
                    class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">

                    <FormBuilder
                        v-model="resourceLines[index]"
                        :fields="resourceFields(index)"
                        :columns="2"
                        hide-submit
                    />
                    <button v-if="resourceLines.length > 1" @click="removeResourceLine(index)" type="button"
                        class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Bouton ajouter une ligne -->
            <div class="flex justify-center">
                <button @click="addResourceLine" type="button"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clip-rule="evenodd" />
                    </svg>
                    Ajouter une ressource
                </button>
            </div>

            <!-- Boutons d'action -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button @click="showAddResourceModal = false" type="button"
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Annuler
                </button>
                <button @click="onAddResources" type="button"
                    class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                    Ajouter les ressources
                </button>
            </div>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DataTableNew from '@/components/DataTable/DataTableNew.vue';
import Modal from '@/components/Modal.vue';
import { useInventoryDetail } from '@/composables/useInventoryDetail';
import IconDownload from '@/components/icon/icon-download.vue';
import IconPlay from '@/components/icon/icon-play.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconCancel from '@/components/icon/icon-cancel.vue';
import IconCheck from '@/components/icon/icon-check.vue';
import IconLock from '@/components/icon/icon-lock.vue';
import { useResourceStore } from '@/stores/resource';
import { computed } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { FieldConfig } from '@/interfaces/form';

const route = useRoute();
const inventoryReference = route.params.reference as string;

// État local pour le modal d'ajout de ressources
const showAddResourceModal = ref(false);
const resourceLines = ref([{ resource: '', quantity: 1 }]);
const availableResources = ref<any[]>([]);

const {
    currentTab,
    inventory,
    tabs,
    jobColumns,
    magasins,
    teamsGridData,
    magasinsGridData,
    resourcesGridData,
    teamActions,
    storeActions,
    resourceActions,
    launchInventory,
    editInventory,
    cancelInventory,
    terminateInventory,
    closeInventory,
    formatDate,
    getStatusClass,
    getJobsForTab,
    loadDetailData,
    getCompletedJobsCount,
    getInProgressJobsCount,
    getRemainingJobsCount,
    getTotalJobsCount,
    exportToPDF,
    // Fonctions pour les ressources
    resources,
    resourcesLoading,
    resourcesError,
    assignResourceToInventory,
    updateResourceQuantity,
    removeResourceFromInventory,
    getAvailableResources
} = useInventoryDetail(inventoryReference);

const resourceStore = useResourceStore();

const resourceOptions = computed(() => {
    return resourceStore.getResources.map(resource => ({
        value: resource.id?.toString() || resource.reference,
        label: resource.ressource_nom || resource.reference || `Ressource ${resource.reference}`
    }));
});

// Helper function to check if comptage has any option enabled
const hasAnyOption = (comptage: any): boolean => {
    // Pour la nouvelle structure de l'API, on vérifie les champs_actifs
    if (comptage.champs_actifs && Array.isArray(comptage.champs_actifs)) {
        return comptage.champs_actifs.length > 0;
    }

    // Fallback pour l'ancienne structure
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
        (comptage as any).entry_quantity;
};

// Méthode pour obtenir la classe CSS du badge selon le mode de comptage
const getCountModeBadgeClass = (countMode: string): string => {
    switch (countMode) {
        case 'image de stock':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
        case 'en vrac':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700';
        case 'par article':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
    }
};

// Méthode pour obtenir le label affiché selon le mode de comptage
const getCountModeLabel = (countMode: string): string => {
    switch (countMode) {
        case 'image de stock':
            return 'Image de stock';
        case 'en vrac':
            return 'En vrac';
        case 'par article':
            return 'Par article';
        default:
            return countMode || 'Non défini';
    }
};

// Fonctions pour gérer le modal d'ajout de ressources
const addResourceLine = () => {
    resourceLines.value.push({ resource: '', quantity: 1 });
};

const removeResourceLine = (index: number) => {
    if (resourceLines.value.length > 1) {
        resourceLines.value.splice(index, 1);
    }
};

// Exemple d'options pour le select (à remplacer par les vraies ressources du store)
// resourceOptions est déjà utilisé dans le projet, on suppose qu'il est accessible

// Fonction pour filtrer les options disponibles pour chaque ligne (éviter les doublons)
const getAvailableResourceOptions = (currentIndex) => {
  const selected = resourceLines.value.map((line, idx) => idx !== currentIndex ? line.resource : null).filter(Boolean);
  return resourceOptions.value.filter(opt => !selected.includes(opt.value));
};

// Champs dynamiques pour FormBuilder (select + input number)
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
];

// Fonction pour charger les ressources disponibles
const loadAvailableResources = async () => {
    try {
        availableResources.value = await getAvailableResources();
    } catch (error) {
        console.error('Erreur lors du chargement des ressources disponibles:', error);
    }
};

// Fonction pour gérer l'ajout de ressources
const onAddResources = async () => {
    try {
        // Valider les données
        const validLines = resourceLines.value.filter(line => line.resource && line.quantity > 0);

        if (validLines.length === 0) {
            alert('Veuillez sélectionner au moins une ressource avec une quantité valide.');
            return;
        }

        // Préparer le tableau de ressources à assigner
        const resourcesToAssign = validLines.map(line => ({
            resource_id: parseInt(line.resource),
            quantity: line.quantity
        }));

        // Assigner toutes les ressources en une seule fois
        await assignResourceToInventory(resourcesToAssign);

        // Réinitialiser le modal
        showAddResourceModal.value = false;
        resourceLines.value = [{ resource: '', quantity: 1 }];

        // Recharger les données de l'inventaire
        await loadDetailData();

    } catch (error) {
        console.error('Erreur lors de l\'ajout des ressources:', error);
    }
};

// Fonction pour ouvrir le modal d'ajout de ressources
const openAddResourceModal = async () => {
    await resourceStore.fetchResources(); // S'assurer que les ressources sont chargées
    await loadAvailableResources();
    // Toujours réinitialiser à une seule ligne vide à chaque ouverture
    resourceLines.value = [{ resource: '', quantity: 1 }];
    showAddResourceModal.value = true;
};

onMounted(async () => {
    await resourceStore.fetchResources(); // Charger les ressources au montage
    loadDetailData();
});
</script>
