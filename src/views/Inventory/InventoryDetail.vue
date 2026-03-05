<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Skeleton loader pendant le chargement -->
        <InventoryDetailSkeleton v-if="loading || (!inventory && !error)" />

        <!-- Contenu principal -->
        <template v-else-if="inventory">
        <!-- Header avec boutons d'action -->
        <Card class="mb-8 p-6 flex justify-end">
            <ButtonGroup :buttons="actionButtons" justify="end" />
        </Card>

        <!-- Container principal -->
        <div v-if="inventory" class="space-y-6">
            <!-- Paramètres de comptage -->
            <Card class="overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 ">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Paramètres de comptage
                        </h3>
                    <Badge :variant="getStatusBadgeVariant(inventory?.status)">
                        {{ inventory.status }}
                    </Badge>
                </div>
                            </div>
                <div class="px-6 py-4">
                    <!-- Informations générales -->
                    <div class="mb-6">
                        <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
                            Informations générales
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <!-- Référence -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    Référence
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                    {{ inventory.reference || 'Non défini' }}
                                </span>
                    </div>

                    <!-- Libellé -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    Libellé
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                    {{ inventory.label || 'Non défini' }}
                                </span>
                    </div>

                    <!-- Date d'inventaire -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    Date d'inventaire
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                    {{ formatDate(inventory.date) }}
                                </span>
                    </div>

                    <!-- Type -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    Type
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                    {{ inventory.inventory_type || 'Non défini' }}
                                </span>
                    </div>

                    <!-- Compte -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    Compte
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                    {{ inventory.account_name || 'Non défini' }}
                                </span>
                    </div>

                    <!-- En préparation -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    En préparation
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                    {{ inventory.en_preparation_status_date ?
                                        formatDate(inventory.en_preparation_status_date) :
                                        'Non défini' }}
                                </span>
                    </div>

                    <!-- En réalisation -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    En réalisation
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                    {{ inventory.en_realisation_status_date ?
                                        formatDate(inventory.en_realisation_status_date) :
                                        'Non défini' }}
                                </span>
                    </div>

                    <!-- Terminé -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    Terminé
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                    {{ inventory.termine_status_date ? formatDate(inventory.termine_status_date) : 'Non défini' }}
                                </span>
                    </div>

                    <!-- Clôturé -->
                            <div class="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/60">
                                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2">
                                    Clôturé
                                </span>
                                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                    {{ inventory.cloture_status_date ? formatDate(inventory.cloture_status_date) : 'Non défini' }}
                                </span>
                    </div>
                </div>
            </div>
                </div>
            </Card>

            <!-- Section Comptages -->
            <Card class="overflow-hidden">
                <div class="px-6 py-4">
                        <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
                            Comptages
                        </h4>
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
            </Card>

            <!-- Magasins associés -->
            <Card class="overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                <IconBox class="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    Magasins associés
                                </h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">
                                    Gérer les opérations pour chaque magasin
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {{ inventory.magasins.length }}
                            </span>
                            <span class="text-sm text-slate-500 dark:text-slate-400">
                                magasin{{ inventory.magasins.length > 1 ? 's' : '' }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <!-- Grille des magasins -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div
                            v-for="(magasin, index) in inventory.magasins"
                            :key="index"
                            class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-xl hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:-translate-y-1">
                            <!-- Badge de statut -->
                            <div class="absolute top-4 right-4">
                                <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                            </div>

                            <!-- Header du magasin -->
                            <div class="flex items-start gap-3 mb-4">
                                <div class="relative">
                                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                        <IconBox class="w-7 h-7 text-white" />
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-md"></div>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <h4 class="font-bold text-slate-800 dark:text-slate-100 text-lg truncate mb-1">
                                        {{ magasin.nom }}
                                    </h4>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
                                        Magasin #{{ index + 1 }}
                                    </p>
                                </div>
                            </div>

                            <!-- Date du magasin -->
                            <div class="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                                    </svg>
                                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {{ magasin.date ? formatDate(magasin.date) : 'Date non définie' }}
                                    </span>
                                </div>
                            </div>

                            <!-- Actions du magasin - Utilisation du composant ButtonGroup -->
                            <ButtonGroup
                                :buttons="getWarehouseButtons(magasin)"
                                justify="start"
                                class="gap-0"
                            />
                        </div>
                    </div>

                    <!-- Message si aucun magasin -->
                    <div v-if="inventory.magasins.length === 0" class="text-center py-12">
                        <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center shadow-lg">
                            <IconBox class="w-10 h-10 text-slate-400" />
                        </div>
                        <h4 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            Aucun magasin associé
                        </h4>
                        <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Aucun magasin n'a été associé à cet inventaire pour le moment. Ajoutez des magasins pour commencer.
                        </p>
                    </div>
                </div>
            </Card>

            <!-- Équipes assignées -->
            <Card class="overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
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
                        <div class="flex items-center gap-3">
                            <Badge variant="info" class="px-3 py-1">
                                {{ (inventory.equipe && Array.isArray(inventory.equipe) ? inventory.equipe.length : 0) }} équipe(s)
                            </Badge>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <!-- Grille des équipes -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            v-for="(team, index) in paginatedTeam"
                            :key="index"
                            class="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border border-slate-200/60 dark:border-slate-600/60 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1">

                            <!-- Badge de comptage (calme, sans animation) -->
                            <div v-if="team.nombre_comptage" class="absolute top-4 right-4">
                                <div class="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-sm border border-blue-200 dark:border-blue-700">
                                    <span class="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                        {{ team.nombre_comptage }} comptage{{ team.nombre_comptage > 1 ? 's' : '' }}
                                    </span>
                                </div>
                            </div>

                            <!-- Contenu principal -->
                            <div class="flex items-start gap-4 pt-2">
                                <div class="relative flex-shrink-0">
                                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-md"></div>
                                </div>

                                <div class="flex-1 min-w-0 pt-1">
                                    <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {{ getTeamUserName(team) }}
                                    </h4>
                                    <!-- Indicateur visuel supplémentaire -->
                                    <div class="mt-2 flex items-center gap-2">
                                        <div class="flex items-center gap-1.5">
                                            <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            <span class="text-xs text-slate-600 dark:text-slate-400 font-medium">Actif</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination pour l'équipe -->
                    <div
                        v-if="inventory.equipe && Array.isArray(inventory.equipe) && inventory.equipe.length > teamItemsPerPage"
                        class="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 gap-4">
                        <div class="text-sm text-slate-500 dark:text-slate-400">
                            Affichage de <span class="font-semibold text-slate-700 dark:text-slate-300">{{ (teamCurrentPage - 1) * teamItemsPerPage + 1 }}</span> à
                            <span class="font-semibold text-slate-700 dark:text-slate-300">{{ Math.min(teamCurrentPage * teamItemsPerPage, inventory.equipe.length) }}</span>
                            sur <span class="font-semibold text-slate-700 dark:text-slate-300">{{ inventory.equipe.length }}</span> équipe(s)
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                @click="teamCurrentPage = Math.max(1, teamCurrentPage - 1)"
                                :disabled="teamCurrentPage === 1"
                                class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                                Précédent
                            </button>
                            <div class="flex items-center gap-1">
                                <button
                                    v-for="page in teamTotalPages"
                                    :key="page"
                                    @click="teamCurrentPage = page"
                                    :class="[
                                        'px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 min-w-[2.5rem]',
                                        teamCurrentPage === page
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                                            : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600'
                                    ]">
                                    {{ page }}
                                </button>
                            </div>
                            <button
                                @click="teamCurrentPage = Math.min(teamTotalPages, teamCurrentPage + 1)"
                                :disabled="teamCurrentPage === teamTotalPages"
                                class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2">
                                Suivant
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Message si aucune équipe -->
                    <div
                        v-if="!inventory.equipe || !Array.isArray(inventory.equipe) || inventory.equipe.length === 0"
                        class="text-center py-12">
                        <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <svg class="w-10 h-10 text-blue-400 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </div>
                        <h4 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            Aucune équipe assignée
                        </h4>
                        <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Aucune équipe n'a été assignée à cet inventaire pour le moment. Les équipes peuvent être assignées depuis la page d'affectation.
                        </p>
                    </div>
                </div>
            </Card>

            <!-- Ressources -->
            <Card class="overflow-hidden">
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
            </Card>
        </div>

        <!-- Modal d'ajout de ressources -->
        <Dialog v-model="showAddResourceModal" title="Ajouter des ressources" size="lg">
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
        </Dialog>

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
        <Card v-else-if="error" class="p-6">
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
        </Card>
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
 * Toute la logique TypeScript est déléguée au composable useInventoryDetail.
 *
 * @component InventoryDetail
 */

// ===== IMPORTS VUE =====
import { onMounted, computed, toRaw } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { useValidationAlert } from '@/services/validationAlertService'

// ===== IMPORTS COMPOSANTS PACKAGE =====
import { Dialog, Card, Badge } from '@SMATCH-Digital-dev/vue-system-design'

// ===== IMPORTS COMPOSANTS LOCAUX =====
import FormBuilder from '@/components/Form/FormBuilder.vue'
import ValidationAlert from '@/components/ValidationAlert.vue'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'

// ===== IMPORTS COMPOSABLES =====
import { useInventoryDetail } from '@/composables/useInventoryDetail'

// ===== IMPORTS COMPOSANTS =====
import InventoryDetailSkeleton from '@/components/InventoryDetailSkeleton.vue'

// ===== IMPORTS STORES =====
import { useResourceStore } from '@/stores/resource'

// ===== IMPORTS ICÔNES (template uniquement) =====
import IconBox from '@/components/icon/icon-box.vue'

// ===== ROUTE =====
const route = useRoute()
const inventoryReference = route.params.reference as string

// ===== COMPOSABLE =====
const {
    inventory,
    loading,
    error,
    inventoryId,
    magasins,
    launchInventory,
    launchInventoryByWarehouseName,
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
    exportJobsToPDF,
    // Pagination équipe
    teamCurrentPage,
    teamItemsPerPage,
    paginatedTeam,
    teamTotalPages,
    getTeamUserName,
    // Boutons
    actionButtons,
    getWarehouseButtons,
    getStatusBadgeVariant,
    hasAnyOption,
    getCountModeBadgeClass,
    getCountModeLabel,
    // Modal ressources
    showAddResourceModal,
    resourceLines,
    addResourceLine,
    removeResourceLine,
    resourceFields,
    onAddResources,
    openAddResourceModal
} = useInventoryDetail(inventoryReference)

// ===== STORES =====
const resourceStore = useResourceStore()

// ===== COMPOSABLES SERVICES =====
const validationAlert = useValidationAlert()

// ===== COMPUTED =====
const validationErrors = computed(() => toRaw(validationAlert.alertData.value.errors || []))
const validationInfos = computed(() => toRaw(validationAlert.alertData.value.infos || []))

// ===== LIFECYCLE =====
onMounted(async () => {
    if (resourceStore.getResources.length === 0) {
        await resourceStore.fetchResources()
    }
    await initializeInventory()
})
</script>
