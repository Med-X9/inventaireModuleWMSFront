<template>
    <!--
        Corps de la DataTable avec gestion complète des données
        Inclut le skeleton loader, la table principale, les contrôles d'en-tête
        et la gestion des actions par ligne
    -->
    <div ref="tableContainerRef" class="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 transition-all duration-300 w-full" :class="{ 
        'relative': hasMinHeight,
        'overflow-x-auto overflow-y-auto': !editingCell,
        'overflow-visible': editingCell !== null,
        'editing-mode': editingCell !== null
    }" :style="minHeightStyle">
        <!-- Skeleton loader pendant le chargement -->
        <div v-if="loading" class="w-full">
            <!-- Header skeleton avec animation de shimmer -->
            <div class="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div v-for="col in columns" :key="`header-${col.field}`" class="flex-1 p-3 min-w-[120px]">
                    <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                </div>
                <div v-if="actions && actions.length > 0" class="flex-[0_0_120px] min-w-[120px] p-3">
                    <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                </div>
            </div>

            <!-- Data rows skeleton avec nombre configurable de lignes -->
            <div v-for="rowIndex in skeletonRowsCount" :key="`row-${rowIndex}`" class="flex border-b border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 even:bg-gray-50 dark:even:bg-gray-800">
                <div v-for="col in columns" :key="`cell-${rowIndex}-${col.field}`" class="flex-1 p-3 min-w-[120px] flex items-center">
                    <div class="h-4 w-4/5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                </div>
                <div v-if="actions && actions.length > 0" class="flex-[0_0_120px] min-w-[120px] p-3">
                    <div class="h-4 w-3/5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                </div>
            </div>
        </div>

        <!-- Table normale quand pas de chargement -->
        <table v-else class="w-full border-collapse text-sm table-auto min-w-full whitespace-nowrap" style="border-spacing: 0;" role="table" aria-label="Tableau de données">
            <thead :class="{ 'sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm': props.stickyHeader }" role="rowgroup">
                <tr role="row">
                    <!-- Colonne de sélection multiple si activée -->
                    <th v-if="rowSelection" class="w-10 text-center p-2 border-b border-r border-gray-200 dark:border-gray-700" role="columnheader" scope="col" aria-label="Sélectionner toutes les lignes">
                        <input
                            type="checkbox"
                            :checked="selectAllState === 'all'"
                            @change="(e) => toggleAllSelection()"
                            class="w-4 h-4 accent-primary"
                            :aria-label="selectAllState === 'all' ? 'Désélectionner toutes les lignes' : 'Sélectionner toutes les lignes'"
                            :aria-checked="selectAllState === 'all'"
                        />
                    </th>
                    <!-- Colonne de numéro de ligne (OBLIGATOIRE - toujours visible) -->
                    <th class="overflow-visible relative align-top min-w-[60px] max-w-[60px] w-[60px] p-3 border-b border-r border-gray-200 dark:border-gray-700 text-center whitespace-nowrap bg-gray-50 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-200 sticky z-10 left-0 bg-white dark:bg-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
                        role="columnheader"
                        scope="col"
                        aria-label="Numéro de ligne"
                        :style="{ left: rowSelection ? '40px' : '0px' }">
                        <span class="font-semibold text-gray-700 dark:text-gray-200">#</span>
                    </th>
                    <!-- Colonne responsive expander (si des colonnes sont masquées) -->
                    <th v-if="hasHiddenColumns()" class="overflow-visible relative align-top min-w-[100px] max-w-none w-10 min-w-[40px] max-w-[40px] p-2 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" role="columnheader" scope="col" aria-label="Afficher les colonnes supplémentaires">
                        <!-- Pas de contenu dans le header, juste l'espace pour le bouton -->
                    </th>
                    <!-- En-têtes de colonnes avec contrôles de tri et filtrage -->
                    <th v-for="(col, colIndex) in responsiveColumns" :key="col.field"
                        class="relative align-top min-w-[100px] max-w-none p-3 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap bg-gray-50 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-200"
                        :class="{
                            'text-center': col.align === 'center',
                            'text-right': col.align === 'right',
                            'text-left': !col.align || col.align === 'left',
                            'hidden': !isColumnVisible(col),
                            'overflow-visible': showFilter === col.field,
                            'overflow-hidden': showFilter !== col.field,
                            'sticky z-10': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field),
                            'bg-white dark:bg-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'left',
                            'bg-white dark:bg-gray-900 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_4px_rgba(0,0,0,0.3)]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'right',
                            'whitespace-normal break-words': col.allowWrap === true,
                            'border-r-0': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'left' && !isLastPinnedColumnLeft(col.field),
                            'border-l-0': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'left' && !isFirstPinnedColumnLeft(col.field),
                            'last:border-r-0': colIndex === responsiveColumns.length - 1
                        }"
                        role="columnheader"
                        :scope="'col'"
                        :aria-sort="getAriaSort(col.field)"
                        :aria-label="`Colonne ${col.headerName || col.field}${col.sortable !== false ? ', triable' : ''}${col.filterable !== false ? ', filtrable' : ''}`"
                        :style="{
                            ...getColumnStyle(col),
                            textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left'
                        }">
                        <div class="flex items-center gap-2 relative min-w-fit" :class="{
                            'justify-center': col.align === 'center',
                            'justify-end': col.align === 'right',
                            'justify-between': !col.align || col.align === 'left'
                        }">
                            <span class="font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis" :class="{
                                'text-center flex-1': col.align === 'center',
                                'text-right': col.align === 'right',
                                'text-left flex-1': !col.align || col.align === 'left'
                            }">{{ col.headerName || col.field }}</span>

                            <!-- Contrôles de tri et filtrage dans l'en-tête -->
                            <div class="flex items-center gap-1">
                                <!-- Bouton de tri avec icônes à trois états -->
                                <button
                                    v-if="col.sortable !== false"
                                    @click="handleSort(col.field)"
                                    class="flex items-center justify-center w-6 h-6 border-none bg-transparent rounded cursor-pointer transition-all duration-200 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                                    :class="{
                                        'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200': currentSortField === col.field
                                    }"
                                    :title="getSortTooltip(col.field)"
                                    :aria-label="getSortTooltip(col.field)"
                                    :aria-pressed="currentSortField === col.field"
                                    type="button"
                                >
                                    <IconSortBoth v-if="currentSortField !== col.field" class="w-3 h-3" aria-hidden="true" />
                                    <!-- Icône ascendant -->
                                    <IconSortAsc v-else-if="currentSortDirection === 'asc'" class="w-3 h-3" aria-hidden="true" />
                                    <!-- Icône descendant -->
                                    <IconSortDesc v-else class="w-3 h-3" aria-hidden="true" />
                                </button>

                                <!-- Bouton de filtre avec dropdown -->
                                <button
                                    v-if="col.filterable !== false"
                                    @click.stop="toggleFilter(col.field)"
                                    class="flex items-center justify-center w-6 h-6 border-none bg-transparent rounded cursor-pointer transition-all duration-200 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                                    :class="{ 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200': showFilter === col.field }"
                                    :title="showFilter === col.field ? 'Fermer le filtre' : 'Ouvrir le filtre'"
                                    :aria-label="showFilter === col.field ? 'Fermer le filtre' : `Filtrer la colonne ${col.headerName || col.field}`"
                                    :aria-expanded="showFilter === col.field"
                                    :aria-controls="`filter-${col.field}`"
                                    type="button"
                                >
                                    <IconFilter class="w-3 h-3" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <!-- Filtre inline avec positionnement absolu -->
                        <div v-if="showFilter === col.field" class="absolute left-0 top-full mt-1 z-[10000] w-full min-w-[280px] max-w-[350px]" :id="`filter-${col.field}`" role="dialog" aria-label="Filtre pour la colonne {{ col.headerName || col.field }}">
                            <FilterDropdown
                                :column="col"
                                :isVisible="showFilter === col.field"
                                :currentFilter="activeFilters[col.field]"
                                @apply="applyFilter"
                                @clear="() => clearFilter(col.field)"
                                @close="() => closeFilter(col.field)" />
                        </div>
                    </th>
                    <!-- En-tête des actions -->
                    <th v-if="actions && actions.length > 0" class="w-[120px] text-center border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" role="columnheader" scope="col" aria-label="Actions">Actions</th>
                </tr>
            </thead>
            <tbody role="rowgroup">
                <!-- États conditionnels : Forbidden > Empty State -->
                <EmptyState
                    v-if="forbidden"
                    :colspan="responsiveColumns.filter(col => col.field !== '__rowNumber__').length + 1 + (hasHiddenColumns() ? 1 : 0) + (rowSelection ? 1 : 0) + (actions && actions.length > 0 ? 1 : 0)"
                    :title="forbiddenStateTitle || 'Accès refusé'"
                    :description="forbiddenStateDescription || 'Vous n\'avez pas les permissions nécessaires pour accéder à ces données.'"
                    :icon="forbiddenStateIcon"
                    :type="'forbidden'"
                    :actions="forbiddenStateActions"
                />
                <!-- Empty State amélioré -->
                <EmptyState
                    v-else-if="!paginatedData || !Array.isArray(paginatedData) || paginatedData.length === 0"
                    :colspan="responsiveColumns.filter(col => col.field !== '__rowNumber__').length + 1 + (hasHiddenColumns() ? 1 : 0) + (rowSelection ? 1 : 0) + (actions && actions.length > 0 ? 1 : 0)"
                    :title="emptyStateTitle"
                    :description="emptyStateDescription"
                    :icon="emptyStateIcon"
                    :type="hasActiveFilters || hasActiveSearch ? 'no-results' : 'no-data'"
                    :has-filters="hasActiveFilters"
                    :has-search="hasActiveSearch"
                    :actions="emptyStateActions"
                />
                <!-- Lignes de données avec gestion des actions -->
                <template v-else>
                    <template v-for="(row, rowIndex) in paginatedData" :key="getRowId(row, rowIndex)">
                    <!-- Ligne principale avec v-memo pour optimiser le rendu -->
                    <tr v-memo="[getRowId(row, rowIndex), row, isRowSelected(getRowId(row, rowIndex)), editingCell]"
                        class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors even:bg-gray-50 dark:even:bg-gray-800"
                        :class="{ 'cursor-pointer': props.enableRowClick }"
                        role="row" 
                        :aria-selected="isRowSelected(getRowId(row, rowIndex))"
                        @dblclick="props.enableRowClick ? emit('row-clicked', getRowId(row, rowIndex)) : undefined">
                        <!-- Cellule de sélection -->
                        <td v-if="rowSelection" class="w-10 text-center p-2 sticky z-[5] left-0 bg-white dark:bg-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)] border-b border-r border-gray-200 dark:border-gray-700" role="cell">
                            <input
                                type="checkbox"
                                :checked="isRowSelected(getRowId(row, rowIndex))"
                                @change="(e) => toggleRowSelection(getRowId(row, rowIndex))"
                                :aria-label="`Sélectionner la ligne ${rowIndex + 1}`"
                                :aria-checked="isRowSelected(getRowId(row, rowIndex))"
                            />
                        </td>
                        <!-- Cellule de numéro de ligne (OBLIGATOIRE - toujours visible) -->
                        <td class="relative min-w-[60px] max-w-[60px] w-[60px] whitespace-nowrap text-center p-3 border-b border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 sticky z-[5] bg-white dark:bg-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
                            role="cell"
                            :aria-label="`Numéro de ligne ${globalStartIndex + rowIndex + 1}`"
                            :style="{ left: rowSelection ? '40px' : '0px' }">
                            <span class="font-semibold text-gray-700 dark:text-gray-200">
                                {{ globalStartIndex + rowIndex + 1 }}
                            </span>
                        </td>
                        <!-- Cellule responsive expander (si des colonnes sont masquées) -->
                        <td v-if="hasHiddenColumns()" class="w-10 min-w-[40px] max-w-[40px] p-2 text-center align-middle" role="cell">
                            <ResponsiveExpander
                                :is-expanded="isResponsiveExpanded(getRowId(row, rowIndex))"
                                @toggle="toggleResponsiveExpansion(getRowId(row, rowIndex))"
                            />
                        </td>
                        <!-- Cellules de données avec support des slots personnalisés -->
                        <td
                            v-for="(col, colIndex) in responsiveColumns"
                            :key="col.field"
                            :data-row-index="rowIndex"
                            :data-col-index="colIndex"
                            tabindex="0"
                            class="relative min-w-[80px] whitespace-nowrap text-ellipsis p-3 border-b border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            :class="{
                                'hidden': !isColumnVisible(col),
                                'overflow-hidden': !isEditing(getRowId(row, rowIndex), col.field),
                                'overflow-visible': isEditing(getRowId(row, rowIndex), col.field),
                                'editing-cell': isEditing(getRowId(row, rowIndex), col.field),
                                'text-center': col.align === 'center',
                                'text-right': col.align === 'right',
                                'text-left': !col.align || col.align === 'left',
                                'sticky z-[5]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field),
                                'bg-white dark:bg-gray-900 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'left',
                                'bg-white dark:bg-gray-900 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_4px_rgba(0,0,0,0.3)]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'right',
                                'whitespace-normal break-words': col.allowWrap === true,
                                'border-r-0': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'left' && !isLastPinnedColumnLeft(col.field),
                                'border-l-0': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'left' && !isFirstPinnedColumnLeft(col.field)
                            }"
                            role="cell"
                            :aria-label="`${col.headerName || col.field}: ${renderCell(row[col.field], col, row, getRowId(row, rowIndex))}`"
                            :style="{
                                ...getColumnStyle(col),
                                textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left'
                            }"
                            @click="(e) => { if (!isEditing(getRowId(row, rowIndex), col.field)) { /* keyboard navigation not implemented */ } }"
                            @dblclick="handleCellActivate(rowIndex, colIndex)"
                            @keydown.enter="handleCellActivate(rowIndex, colIndex)"
                            @keydown.space.prevent="handleRowSelect(rowIndex)"
                        >
                                <!-- Rendu conditionnel selon le type de cellule -->
                                <!-- Cellule avec données imbriquées -->
                                <NestedDataCell
                                    v-if="col.nestedData && hasNestedData(row[col.field], col)"
                                    :value="row[col.field]"
                                    :column="col"
                                    :row="row"
                                    :is-expanded="isRowExpanded(getRowId(row, rowIndex))"
                                    @toggle="toggleRowExpansion(getRowId(row, rowIndex))" />

                                <!-- Cellule éditables avancées pour types complexes (select, date, multi-select) -->
                                <AdvancedEditableCell
                                    v-else-if="inlineEditing && col.editable"
                                    :value="row[col.field]"
                                    :column="col"
                                    :row="row"
                                    :is-editing="isEditing(getRowId(row, rowIndex), col.field)"
                                    @start-edit="startEditCell(getRowId(row, rowIndex), col.field)"
                                    @save-edit="saveEditCell($event)"
                                    @cancel-edit="cancelEditCell()" />

                                <!-- Affichage normal avec cache -->
                                <span v-else 
                                    class="block w-full whitespace-nowrap overflow-hidden text-ellipsis"
                                    :class="{
                                        'text-center': col.align === 'center',
                                        'text-right': col.align === 'right',
                                        'text-left': !col.align || col.align === 'left'
                                    }"
                                    :style="{
                                        textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left'
                                    }"
                                    v-html="renderCell(row[col.field], col, row, getRowId(row, rowIndex))"></span>
                        </td>
                        <!-- Cellule des actions avec menu déroulant -->
                        <td v-if="actions && actions.length > 0" class="text-center p-2 w-[120px] border-b border-r border-gray-200 dark:border-gray-700" role="cell" aria-label="Actions pour la ligne">
                            <ActionMenu :actions="actions" :row="row" />
                        </td>
                    </tr>

                    <!-- Lignes de nested tables (affichées seulement si expandées) -->
                    <template v-for="col in responsiveColumns" :key="`nested-${getRowId(row, rowIndex)}-${col.field}`">
                        <tr v-if="col.nestedData && hasNestedData(row[col.field], col) && isRowExpanded(getRowId(row, rowIndex))" class="bg-gray-50 dark:bg-gray-800">
                            <!-- Cellule de sélection vide pour aligner -->
                            <td v-if="rowSelection"></td>

                            <!-- Cellule de numéro de ligne vide pour aligner -->
                            <td></td>

                            <!-- Cellule de nested table qui s'étend sur toutes les colonnes -->
                            <td :colspan="responsiveColumns.filter(col => col.field !== '__rowNumber__').length + (hasHiddenColumns() ? 1 : 0) + (actions && actions.length > 0 ? 1 : 0)" class="p-0">
                                <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                                    <!-- En-tête de la nested table -->
                                    <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                        <h4 class="text-base font-semibold text-gray-700 dark:text-gray-200 m-0">{{ col.nestedData.title || `${col.headerName || col.field} - Détails` }}</h4>
                                        <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ getNestedItems(row[col.field], col).length }} éléments</span>
                                    </div>

                                    <!-- Contenu de la nested table -->
                                    <div class="overflow-x-auto">
                                        <table class="w-full border-collapse text-sm">
                                            <thead>
                                                <tr>
                                                    <th v-for="nestedCol in col.nestedData.columns || []" :key="nestedCol.field" 
                                                        class="font-semibold text-gray-700 dark:text-gray-200 p-2 px-3 border-b border-gray-200 dark:border-gray-700"
                                                        :class="{
                                                            'text-center': nestedCol.align === 'center',
                                                            'text-right': nestedCol.align === 'right',
                                                            'text-left': !nestedCol.align || nestedCol.align === 'left'
                                                        }"
                                                        style="text-align: inherit;">
                                                        {{ nestedCol.headerName || nestedCol.field }}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(item, index) in getNestedItems(row[col.field], col)" :key="`nested-item-${index}`" class="last:border-b-0">
                                                    <td v-for="nestedCol in col.nestedData.columns || []" :key="nestedCol.field" 
                                                        class="p-2 px-3 border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                                                        :class="{
                                                            'text-center': nestedCol.align === 'center',
                                                            'text-right': nestedCol.align === 'right',
                                                            'text-left': !nestedCol.align || nestedCol.align === 'left'
                                                        }">
                                                        <span v-html="renderNestedCell(item[nestedCol.field], nestedCol, item)"></span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>

                    <!-- Ligne nested pour les colonnes responsive masquées -->
                    <tr v-if="hasHiddenColumns() && isResponsiveExpanded(getRowId(row, rowIndex))" class="bg-gray-50 dark:bg-gray-800">
                        <!-- Cellule de sélection vide pour aligner -->
                        <td v-if="rowSelection"></td>

                        <!-- Cellule de numéro de ligne vide pour aligner -->
                        <td></td>

                        <!-- Cellule de nested table qui s'étend sur toutes les colonnes -->
                        <td :colspan="responsiveColumns.filter(col => col.field !== '__rowNumber__').length + (hasHiddenColumns() ? 1 : 0) + (actions && actions.length > 0 ? 1 : 0)" class="p-0">
                            <div class="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                                <div class="w-full">
                                    <dl class="grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 m-0 p-0">
                                        <template v-for="col in hiddenColumns" :key="col.field">
                                            <dt class="font-semibold text-gray-700 dark:text-gray-200 m-0 py-2">{{ (col as any).headerName || (col as any).field }}</dt>
                                            <dd class="m-0 py-2 text-gray-500 dark:text-gray-400 break-words">
                                                <span v-html="renderCell(row[(col as any).field], col as any, row, getRowId(row, rowIndex))"></span>
                                            </dd>
                                        </template>
                                    </dl>
                                </div>
                            </div>
                        </td>
                    </tr>
                    </template>
                </template>
            </tbody>

            <!-- Footer avec agrégations -->
            <tfoot v-if="hasAggregations" class="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600" role="rowgroup">
                <tr role="row" class="font-semibold">
                    <!-- Cellule vide pour la sélection -->
                    <td v-if="rowSelection" class="p-3"></td>
                    <!-- Cellule vide pour le numéro de ligne -->
                    <td class="p-3 text-center sticky z-[5] left-0 bg-gray-100 dark:bg-gray-800">
                        <span class="text-gray-600 dark:text-gray-400">Total</span>
                    </td>
                    <!-- Cellule vide pour responsive expander -->
                    <td v-if="hasHiddenColumns()" class="p-3"></td>
                    <!-- Cellules d'agrégation pour chaque colonne -->
                    <td
                        v-for="col in responsiveColumns"
                        :key="`agg-${col.field}`"
                        class="p-3 border-t border-gray-200 dark:border-gray-700 text-right"
                        :class="{
                            'hidden': !isColumnVisible(col),
                            'sticky z-[5]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field),
                            'bg-gray-100 dark:bg-gray-800 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'left',
                            'bg-gray-100 dark:bg-gray-800 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_4px_rgba(0,0,0,0.3)]': props.enableColumnPinning && props.columnPinning?.getPinDirection(col.field) === 'right',
                        }"
                        :style="getColumnStyle(col)"
                        role="cell"
                    >
                        <span v-if="col.aggregation" class="text-gray-700 dark:text-gray-200">
                            {{ formatAggregation(col.field, getAggregationValue(col.field)) }}
                        </span>
                        <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                    </td>
                    <!-- Cellule vide pour les actions -->
                    <td v-if="actions && actions.length > 0" class="p-3"></td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import ActionMenu from './ActionMenu.vue'
import NestedDataExpander from './cells/NestedDataExpander.vue'
import NestedDataCell from './cells/NestedDataCell.vue'
import SafeEditableCell from './cells/SafeEditableCell.vue'
import AdvancedEditableCell from './cells/AdvancedEditableCell.vue'
import FilterDropdown from './filters/FilterDropdown.vue'
import ResponsiveExpander from './cells/ResponsiveExpander.vue'
import EmptyState from './EmptyState.vue'
import { cellRenderersService } from './services/cellRenderers'
import { logger } from '@/services/loggerService'
import { ref, onMounted, onUnmounted, computed, watch, nextTick, provide, toRef, shallowRef, readonly } from 'vue'
import { useWindowSize } from '@vueuse/core'
import IconSortBoth from '../icon/icon-sort-both.vue'
import IconSortAsc from '../icon/icon-sort-asc.vue'
import IconSortDesc from '../icon/icon-sort-desc.vue'
import IconFilter from '../icon/icon-filter.vue'

/**
 * Interface des props du composant DataTableBody
 * Définit toutes les propriétés nécessaires pour le fonctionnement
 */
interface Props {
    columns: any[]
    paginatedData: any[]
    actions: any[]
    loading?: boolean
    skeletonRowsCount?: number
    currentSortField?: string
    currentSortDirection?: 'asc' | 'desc'
    rowSelection?: boolean
    selectedRows?: Set<string>
    inlineEditing?: boolean
    // Ajout des props pour la pagination :
    currentPage: number
    pageSize: number
    // Ajout de la prop pour l'indexation globale
    globalStartIndex: number
    // Props pour le pinning des colonnes
    columnPinning?: any
    enableColumnPinning?: boolean
    // Prop pour le header sticky
    stickyHeader?: boolean
    // Props pour empty state personnalisé
    emptyStateTitle?: string
    emptyStateDescription?: string
    emptyStateIcon?: any
    emptyStateActions?: Array<{ label: string; onClick: () => void; primary?: boolean; icon?: any }>
    // Props pour forbidden state personnalisé
    forbiddenStateTitle?: string
    forbiddenStateDescription?: string
    forbiddenStateIcon?: any
    forbiddenStateActions?: Array<{ label: string; onClick: () => void; primary?: boolean; icon?: any }>
    // État forbidden (permissions insuffisantes)
    forbidden?: boolean
    // Props pour détecter l'état (filtres, recherche)
    hasActiveFilters?: boolean
    hasActiveSearch?: boolean
    // Nombre de colonnes visibles par défaut (pour le responsive)
    defaultVisibleColumnsCount?: number
    // Colonnes actuellement visibles (pour le calcul du responsive)
    visibleColumnNames?: string[]
    // Active le click sur les lignes (désactivé par défaut)
    /** Active le double-clic sur les lignes (émet l'événement 'row-clicked') */
    enableRowClick?: boolean
}

/**
 * Props avec valeurs par défaut
 */
const props = withDefaults(defineProps<Props>(), {
    loading: false,
    skeletonRowsCount: 10,
    currentSortField: '',
    currentSortDirection: 'asc',
    rowSelection: false,
    selectedRows: () => new Set<string>(),
    inlineEditing: false,
    // Ajout des props pour la pagination :
    currentPage: 1,
    pageSize: 20,
    // Ajout de la prop pour l'indexation globale
    globalStartIndex: 0,
    // PaginatedData doit avoir une valeur par défaut
    paginatedData: () => [],
    // Props pour le pinning
    enableColumnPinning: false,
    // Props pour empty state
    hasActiveFilters: false,
    hasActiveSearch: false,
    // Nombre de colonnes visibles par défaut
    defaultVisibleColumnsCount: 6,
    // Colonnes actuellement visibles
    visibleColumnNames: () => [],
    // Active le click sur les lignes (désactivé par défaut)
    enableRowClick: false
})

// Fournir les données paginées pour les filtres (évite de passer via prop)
// Utiliser computed pour maintenir la réactivité
provide('tableData', computed(() => props.paginatedData))

// === RESPONSIVE ===
// Détecter la taille de la fenêtre pour le responsive
const { width: windowWidth } = useWindowSize()

// Breakpoints Tailwind (en pixels)
const breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
}

// Fonction pour vérifier si une colonne doit être visible selon le breakpoint
// IMPORTANT: props.columns contient déjà finalColumns (filtré selon visibleColumnNames)
// Donc si une colonne est dans props.columns, c'est qu'elle devrait être visible
const isColumnVisible = (col: any): boolean => {
    // __rowNumber__ est TOUJOURS visible (OBLIGATOIRE)
    if (col.field === '__rowNumber__') {
        return true
    }

    // Si la colonne a hide: true, elle est toujours masquée (ne peut jamais être affichée)
    if (col.hide === true) {
        return false
    }

    // Si la colonne est dans props.columns (finalColumns), c'est qu'elle a été explicitement
    // ajoutée via ColumnManager ou qu'elle est visible par défaut, donc on la considère visible
    // Même si elle a visible: false, si elle est dans props.columns, c'est qu'elle est dans visibleColumnNames
    const isInFinalColumns = props.columns.some(c => c.field === col.field)
    if (isInFinalColumns) {
        // La colonne est dans finalColumns, donc elle devrait être visible
        // Vérifier uniquement le responsive
        if (col.responsive) {
            const currentWidth = windowWidth.value

            // Si hideBelow est défini, masquer en dessous de ce breakpoint
            if (col.responsive.hideBelow) {
                const breakpointValue = breakpoints[col.responsive.hideBelow]
                if (currentWidth < breakpointValue) {
                    return false
                }
            }

            // Si showAbove est défini, afficher uniquement au-dessus de ce breakpoint
            if (col.responsive.showAbove) {
                const breakpointValue = breakpoints[col.responsive.showAbove]
                if (currentWidth < breakpointValue) {
                    return false
                }
            }
        }
        
        return true
    }

    // Si la colonne n'est pas dans props.columns, elle n'est pas visible
    return false
}

// Initialiser les agrégations depuis les colonnes
const columnsWithAggregations = computed(() => {
    return props.columns.filter(col => col.aggregation)
})


// Handler pour l'activation d'une cellule (Enter)
const handleCellActivate = (rowIndex: number, colIndex: number) => {
    // Optionnel : action lors de l'activation d'une cellule
    const col = responsiveColumns.value[colIndex]
    if (col && props.inlineEditing && col.editable) {
        const row = props.paginatedData[rowIndex]
        if (row) {
            const rowId = getRowId(row, rowIndex)
            startEditCell(rowId, col.field)
        }
    }
}

// Système d'agrégations pour les colonnes
const aggregations = {
    aggregations: ref<Map<string, any>>(new Map()),
    clearAll() {
        this.aggregations.value.clear()
    },
    addAggregation(config: any) {
        this.aggregations.value.set(config.field, config)
    },
    computedAggregations: computed(() => {
        const result: Record<string, any> = {}
        // Calculer les agrégations ici si nécessaire
        return result
    }),
    formatAggregation(field: string, value: any): string {
        const config = this.aggregations.value.get(field)
        if (config?.formatter) {
            return config.formatter(value)
        }
        return String(value || '')
    }
}

// Handler pour la sélection d'une ligne (Space)
const handleRowSelect = (rowIndex: number) => {
    if (props.rowSelection) {
        const row = props.paginatedData[rowIndex]
        if (row) {
            const rowId = getRowId(row, rowIndex)
            toggleRowSelection(rowId)
        }
    }
}

// Ajouter les agrégations configurées dans les colonnes
watch(() => props.columns, (newColumns) => {
    aggregations.clearAll()
    newColumns.forEach(col => {
        if (col.aggregation) {
            aggregations.addAggregation({
                field: col.field,
                type: col.aggregation.type,
                label: col.aggregation.label,
                formatter: col.aggregation.formatter,
                customAggregator: col.aggregation.customAggregator
            })
        }
    })
}, { immediate: true, deep: true })

// Vérifier s'il y a des agrégations
const hasAggregations = computed(() => {
    return columnsWithAggregations.value.length > 0
})

// Obtenir la valeur d'agrégation pour une colonne
const getAggregationValue = (field: string): any => {
    return aggregations.computedAggregations.value[field]
}

// Formater une agrégation
const formatAggregation = (field: string, value: any): string => {
    return aggregations.formatAggregation(field, value)
}

// Colonnes visibles (pas de limitation responsive)
// Exclure __rowNumber__ car elle est gérée séparément et toujours visible
const responsiveColumns = computed(() => {
    // Utiliser visibleColumnNames si disponible, sinon utiliser props.columns
    const visibleFields = props.visibleColumnNames && props.visibleColumnNames.length > 0
        ? props.visibleColumnNames.filter(field => field !== '__rowNumber__')
        : props.columns
            .filter(col => {
                if (col.field === '__rowNumber__') return false
                return isColumnVisible(col)
            })
            .map(col => col.field)
    
    // Récupérer tous les objets colonnes correspondants (pas de limitation)
    const allVisibleColumns = visibleFields.map(field => {
        const col = props.columns.find(c => c.field === field)
        if (col) return col
        // Si la colonne n'est pas trouvée dans props.columns, c'est qu'elle est peut-être dans visibleColumnNames
        // mais pas encore dans finalColumns. Dans ce cas, on retourne null et on filtre après.
        return null
    }).filter(col => col !== null) as any[]
    
    return allVisibleColumns
})

// Colonnes masquées (pour affichage dans nested row - responsive selon defaultVisibleColumnsCount)
// Les colonnes avec visible: false ou hide: true ne doivent PAS apparaître ici
// Elles ne sont gérées que via ColumnManager
const hiddenColumns = computed(() => {
    // Fonctionnalité responsive désactivée - retourner toujours un tableau vide
    return []
})

// Vérifier si une ligne a des colonnes masquées à afficher
const hasHiddenColumns = (): boolean => {
    return hiddenColumns.value.length > 0
}

// Watch pour forcer la mise à jour quand defaultVisibleColumnsCount change
// Cela garantit que responsiveColumns et hiddenColumns se recalculent
watch(() => props.defaultVisibleColumnsCount, () => {
    // Le computed se recalculera automatiquement car il dépend de props.defaultVisibleColumnsCount
}, { immediate: false })

// Watch pour forcer la mise à jour quand visibleColumnNames change
watch(() => props.visibleColumnNames, () => {
    // Le computed se recalculera automatiquement car il dépend de props.visibleColumnNames
}, { immediate: false, deep: true })

// ===== ÉTAT LOCAL =====

/**
 * État d'édition d'une cellule
 */
const editingCell = ref<{ rowId: string; field: string } | null>(null)

/**
 * Valeur en cours d'édition
 */
const editingValue = ref<any>(null)

/**
 * État d'expansion des lignes avec données imbriquées
 */
const expandedRows = ref<Set<string>>(new Set())

/**
 * État d'expansion des lignes pour les colonnes responsive masquées
 */
const responsiveExpandedRows = ref<Set<string>>(new Set())

/**
 * État de sélection des lignes
 */
const selectedRows = ref<Set<string>>(new Set())

/**
 * Cache pour les résultats de rendu des cellules
 * Structure: Map<`${rowId}-${field}-${valueHash}`, string>
 */
const cellRenderCache = ref<Map<string, string>>(new Map())
const cacheVersion = ref(0) // Version du cache pour invalidation

/**
 * Cache des renderers par colonne (field)
 * Évite de recalculer le renderer à chaque appel
 */
const columnRendererCache = ref<Map<string, ((value: any, column: any, row: any, rowIndex?: number) => string) | null>>(new Map())

/**
 * Fonction de hash simple et rapide pour les valeurs
 */
const hashValue = (value: any): string => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'string') {
        // Pour les strings, limiter la longueur pour le hash
        return value.length > 50 ? `${value.substring(0, 50)}-${value.length}` : value
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }
    if (typeof value === 'object') {
        // Pour les objets, utiliser une représentation simple
        try {
            const keys = Object.keys(value)
            if (keys.length === 0) return '{}'
            // Utiliser seulement les premières clés pour le hash
            const keyStr = keys.slice(0, 3).join(',')
            const valStr = keys.slice(0, 3).map(k => String(value[k])).join('|')
            return `${keyStr}:${valStr.substring(0, 50)}`
        } catch {
            return 'object'
        }
    }
    return String(value)
}

// Obtient tous les IDs de lignes pour la sélection multiple
// Normaliser tous les IDs en strings pour garantir la cohérence
// Optimisé avec shallowRef pour éviter les recalculs inutiles
const allRowIds = computed(() => {
    if (!Array.isArray(props.paginatedData) || props.paginatedData.length === 0) {
        return []
    }
    return props.paginatedData.map((row, index) => String(getRowId(row, index)))
})

// État de sélection "tout sélectionner"
const selectAllState = ref<'all' | 'partial' | 'none'>('none')

// États pour le tri et le filtrage (utiliser les props comme source de vérité)
const currentSortField = computed(() => props.currentSortField)
const currentSortDirection = computed(() => props.currentSortDirection)

// Computed pour déterminer si on doit appliquer une hauteur minimale
// Si moins de 10 lignes, on applique une hauteur minimale pour éviter le scroll lors de l'ouverture du filtre
const hasMinHeight = computed(() => {
    return props.paginatedData && props.paginatedData.length > 0 && props.paginatedData.length < 10
})

// Computed pour calculer la hauteur minimale
// Hauteur = header (~50px) + 10 lignes (~50px chacune) + dropdown (~400px) + padding
const minHeightStyle = computed(() => {
    if (!hasMinHeight.value) {
        return {}
    }
    // Calculer la hauteur minimale : header + 10 lignes + espace pour le dropdown
    const headerHeight = 50 // Hauteur approximative du header
    const rowHeight = 50 // Hauteur approximative d'une ligne
    const dropdownHeight = 400 // Hauteur approximative du dropdown de filtre
    const padding = 20 // Padding supplémentaire
    const minHeight = headerHeight + (10 * rowHeight) + dropdownHeight + padding

    return {
        minHeight: `${minHeight}px`
    }
})

/**
 * Champ actuellement en cours de filtrage
 */
const showFilter = ref<string>('')

/**
 * Filtres actifs par champ
 */
const activeFilters = ref<Record<string, any>>({})

// ===== MÉTHODES D'ÉDITION DE CELLULE =====

/**
 * Vérifie si une cellule est en cours d'édition
 *
 * @param rowId - ID de la ligne
 * @param field - Champ de la cellule
 * @returns true si la cellule est en cours d'édition
 */
const isEditing = (rowId: string, field: string): boolean => {
    return editingCell.value?.rowId === rowId && editingCell.value?.field === field
}

/**
 * Démarre l'édition d'une cellule
 *
 * @param rowId - ID de la ligne
 * @param field - Champ de la cellule
 */
const startEditCell = (rowId: string, field: string) => {
    if (!props.inlineEditing) {
        return
    }

    const normalizedId = String(rowId)
    const row = props.paginatedData.find((r, index) => {
        const rowIdentifier = String(r.id || r.reference || index)
        return rowIdentifier === normalizedId
    })

    if (!row) {
        logger.error('Ligne non trouvée pour l\'édition', {
            rowId: normalizedId,
            field,
            availableIds: props.paginatedData.map((r, i) => String(r.id || r.reference || i))
        })
        return
    }

    // Empêcher l'édition des lignes enfants (nested data)
    if (row.isChild) {
        logger.warn('Édition non autorisée pour les lignes enfants', { rowId: normalizedId, field })
        return
    }

    editingCell.value = { rowId: normalizedId, field }
    editingValue.value = row[field]
}

// saveEditCell sera défini après defineEmits

/**
 * Annule l'édition d'une cellule
 */
const cancelEditCell = () => {
    editingCell.value = null
    editingValue.value = null
}

// ===== MÉTHODES DE SÉLECTION =====

/**
 * Vérifie si une ligne est sélectionnée
 * Utilise un computed par ligne pour garantir la réactivité
 */
const isRowSelected = (rowId: string | number): boolean => {
    const normalizedId = String(rowId)
    // Utiliser selectedRows.value (état local) comme source de vérité UNIQUE pour une réactivité immédiate
    // L'état local est mis à jour immédiatement, puis synchronisé avec props via le watcher
    // Forcer la réactivité en accédant à selectedRows.value
    const currentSelection = selectedRows.value
    return currentSelection.has(normalizedId)
}

/**
 * Bascule la sélection d'une ligne
 *
 * @param rowId - ID de la ligne
 */
// toggleRowSelection sera défini après defineEmits

/**
 * Met à jour l'état "sélectionner tout"
 * Calcule si toutes les lignes de la page actuelle sont sélectionnées
 */
const updateSelectAllState = () => {
    // Compter seulement les sélections de la page actuelle
    // Utiliser selectedRows.value (état local) pour une réactivité immédiate
    const currentSelection = selectedRows.value
    const pageRowIds = allRowIds.value
    // allRowIds retourne déjà des strings, donc pas besoin de conversion
    const selectedInCurrentPage = pageRowIds.filter(id => currentSelection.has(id)).length
    const totalCount = pageRowIds.length

    if (selectedInCurrentPage === 0) {
        selectAllState.value = 'none'
    } else if (selectedInCurrentPage === totalCount && totalCount > 0) {
        selectAllState.value = 'all'
    } else {
        selectAllState.value = 'partial'
    }
}

// toggleAllSelection sera défini après defineEmits

/**
 * Vide toutes les sélections
 */
const clearAllSelections = () => {
    // Créer un nouveau Set vide
    const newSelection = new Set<string>()
    selectedRows.value = newSelection
    selectAllState.value = 'none'

    // Forcer la mise à jour visuelle
    nextTick(() => {
        // Émettre l'événement de changement de sélection avec le Set vide
        emit('selection-changed', new Set(newSelection))
    })
}

// ===== MÉTHODES DE TRI =====

// handleSort sera défini après defineEmits

/**
 * Retourne le tooltip de tri approprié
 *
 * @param field - Champ de la colonne
 * @returns Texte du tooltip
 */
const getSortTooltip = (field: string): string => {
    if (currentSortField.value !== field) return 'Trier par ordre croissant'
    if (currentSortDirection.value === 'asc') return 'Trier par ordre décroissant'
    return 'Annuler le tri'
}

// Fonction pour obtenir l'attribut aria-sort
const getAriaSort = (field: string): 'ascending' | 'descending' | 'none' | undefined => {
    if (currentSortField.value !== field) return 'none'
    return currentSortDirection.value === 'asc' ? 'ascending' : 'descending'
}

// Fonction pour calculer le style d'une colonne (évite scroll horizontal, style DataTables.js)
const getColumnStyle = (col: any) => {
    const styles: Record<string, string> = {}

    // Si la colonne est masquée, ne pas calculer de style (sera masquée par CSS)
    if (!isColumnVisible(col)) {
        return styles
    }

    // Si colonne épinglée, gérer le positionnement
    if (props.enableColumnPinning && props.columnPinning && props.columnPinning.getPinDirection) {
        const direction = props.columnPinning.getPinDirection(col.field)
        if (direction) {
            const offset = getPinnedColumnOffset(col.field, direction)
            styles[direction === 'left' ? 'left' : 'right'] = offset + 'px'
        }
    }

    // Calculer la largeur pour éviter le scroll horizontal (style DataTables.js responsive)
    const containerWidth = tableContainerRef.value?.clientWidth || windowWidth.value || 0
    // __rowNumber__ est toujours présente (1), plus les autres colonnes
    const visibleColumnsCount = responsiveColumns.value.length + 1 + (hasHiddenColumns() ? 1 : 0) + (props.rowSelection ? 1 : 0) + ((props.actions && props.actions.length > 0) ? 1 : 0)

    if (containerWidth > 0 && visibleColumnsCount > 0) {
        // Si la colonne a une largeur fixe, l'utiliser
        if (col.width) {
            styles.width = `${col.width}px`
            styles.minWidth = `${col.minWidth || Math.min(col.width, 80)}px`
            styles.maxWidth = col.maxWidth ? `${col.maxWidth}px` : `${col.width}px`
        }
        // Si la colonne a flex, calculer proportionnellement
        else if (col.flex) {
            const totalFlex = responsiveColumns.value.reduce((sum, c) => sum + (c.flex || 1), 0)
            const flexPercent = (col.flex / totalFlex) * 100
            styles.width = `${flexPercent}%`
            styles.minWidth = col.minWidth ? `${col.minWidth}px` : col.minWidthPercent ? `${col.minWidthPercent}%` : '80px'
            styles.maxWidth = col.maxWidth ? `${col.maxWidth}px` : 'none'
        }
        // Sinon, distribuer équitablement l'espace disponible (style DataTables.js)
        else {
            // Soustraction : checkbox (si présent) + __rowNumber__ (60px) + expander (si présent) + actions (si présent)
            const availableWidth = containerWidth - (props.rowSelection ? 40 : 0) - 60 - (hasHiddenColumns() ? 40 : 0) - ((props.actions && props.actions.length > 0) ? 120 : 0)
            // Calculer la largeur moyenne, mais avec un minimum de 80px
            const avgWidth = Math.max(col.minWidth || 80, Math.floor(availableWidth / visibleColumnsCount))
            styles.width = `${avgWidth}px`
            styles.minWidth = `${col.minWidth || 80}px`
            styles.maxWidth = col.maxWidth ? `${col.maxWidth}px` : 'none'
        }
    }

    return styles
}

/**
 * Calcule la largeur réelle d'une colonne sans récursion
 * Utilise col.width si disponible, sinon calcule depuis les styles
 *
 * @param col - Colonne
 * @returns Largeur en pixels
 */
const getColumnWidth = (col: any): number => {
    // Si la colonne a une largeur fixe, l'utiliser
    if (col.width) {
        return col.width
    }

    // Pour __rowNumber__, utiliser 60px (largeur fixe)
    if (col.field === '__rowNumber__') {
        return 60
    }

    // Sinon, utiliser une largeur par défaut (sera calculée dynamiquement par getColumnStyle)
    // Mais pour le calcul d'offset, on utilise une valeur par défaut raisonnable
    const containerWidth = tableContainerRef.value?.clientWidth || windowWidth.value || 0
    if (containerWidth > 0) {
        const visibleColumnsCount = responsiveColumns.value.length + 1 + (hasHiddenColumns() ? 1 : 0) + (props.rowSelection ? 1 : 0) + ((props.actions && props.actions.length > 0) ? 1 : 0)
        if (visibleColumnsCount > 0) {
            const availableWidth = containerWidth - (props.rowSelection ? 40 : 0) - 60 - (hasHiddenColumns() ? 40 : 0) - ((props.actions && props.actions.length > 0) ? 120 : 0)
            const avgWidth = Math.max(col.minWidth || 80, Math.floor(availableWidth / visibleColumnsCount))
            return avgWidth
        }
    }

    // Fallback : utiliser minWidth ou 150px par défaut
    return col.minWidth || 150
}

/**
 * Calcule l'offset pour une colonne épinglée
 * Les colonnes épinglées doivent être collées les unes aux autres sans espace
 * IMPORTANT : Utilise props.columns pour avoir l'ordre réel des colonnes dans le tableau
 *
 * @param field - Champ de la colonne
 * @param direction - Direction du pinning ('left' ou 'right')
 * @returns Offset en pixels
 */
const getPinnedColumnOffset = (field: string, direction: 'left' | 'right' | null): number => {
    if (!props.enableColumnPinning || !props.columnPinning || !direction) {
        return 0
    }

    // Utiliser props.columns pour avoir l'ordre réel des colonnes (inclut __rowNumber__ et l'ordre de pinning)
    const allColumns = props.columns
    let offset = 0

    if (direction === 'left') {
        // Toujours commencer par l'offset de la colonne de sélection (si présente)
        if (props.rowSelection) {
            offset += 40 // Largeur de la colonne de sélection
        }

        // Si la colonne demandée est __rowNumber__, retourner l'offset actuel (sans inclure __rowNumber__)
        if (field === '__rowNumber__') {
            return offset
        }

        // Trouver l'index de la colonne actuelle dans l'ordre réel
        const currentIndex = allColumns.findIndex(col => col.field === field)
        if (currentIndex === -1) {
            return offset
        }

        // Parcourir toutes les colonnes AVANT la colonne actuelle dans l'ordre réel
        // et additionner les largeurs des colonnes épinglées à gauche
        for (let i = 0; i < currentIndex; i++) {
            const col = allColumns[i]
            const pinDirection = props.columnPinning.getPinDirection(col.field)

            // Si la colonne est épinglée à gauche, ajouter sa largeur
            if (pinDirection === 'left') {
                const colWidth = getColumnWidth(col)
                offset += colWidth
            }
        }
    } else if (direction === 'right') {
        // Trouver l'index de la colonne actuelle dans l'ordre réel
        const currentIndex = allColumns.findIndex(col => col.field === field)
        if (currentIndex === -1) {
            return offset
        }

        // Parcourir toutes les colonnes APRÈS la colonne actuelle dans l'ordre réel
        // et additionner les largeurs des colonnes épinglées à droite
        for (let i = currentIndex + 1; i < allColumns.length; i++) {
            const col = allColumns[i]
            const pinDirection = props.columnPinning.getPinDirection(col.field)

            // Si la colonne est épinglée à droite, ajouter sa largeur
            if (pinDirection === 'right') {
                const colWidth = getColumnWidth(col)
                offset += colWidth
            }
        }

        // Ajouter l'offset pour la colonne d'actions si elle existe
        if (props.actions && props.actions.length > 0) {
            offset += 100 // Largeur approximative de la colonne d'actions
        }
    }

    return offset
}

/**
 * Vérifie si une colonne est la première colonne épinglée à gauche
 * Utilisé pour supprimer la bordure gauche et éviter les espaces entre colonnes épinglées
 * IMPORTANT : Utilise props.columns pour avoir l'ordre réel des colonnes
 *
 * @param field - Champ de la colonne
 * @returns true si c'est la première colonne épinglée à gauche (après __rowNumber__)
 */
const isFirstPinnedColumnLeft = (field: string): boolean => {
    if (!props.enableColumnPinning || !props.columnPinning) {
        return false
    }

    // Utiliser props.columns pour avoir l'ordre réel (inclut __rowNumber__)
    const allColumns = props.columns
    const leftPinnedColumns: any[] = []

    // Collecter toutes les colonnes épinglées à gauche dans l'ordre réel (sauf __rowNumber__)
    for (const col of allColumns) {
        if (col.field !== '__rowNumber__' && props.columnPinning?.getPinDirection(col.field) === 'left') {
            leftPinnedColumns.push(col)
        }
    }

    if (leftPinnedColumns.length === 0) {
        return false
    }

    // La première colonne épinglée à gauche (après __rowNumber__) est celle qui a l'index le plus bas
    const firstPinnedColumn = leftPinnedColumns[0]
    return firstPinnedColumn.field === field
}

/**
 * Vérifie si une colonne est la dernière colonne épinglée à gauche
 * Utilisé pour supprimer la bordure droite et éviter les espaces entre colonnes épinglées
 * IMPORTANT : Utilise props.columns pour avoir l'ordre réel des colonnes
 *
 * @param field - Champ de la colonne
 * @returns true si c'est la dernière colonne épinglée à gauche
 */
const isLastPinnedColumnLeft = (field: string): boolean => {
    if (!props.enableColumnPinning || !props.columnPinning) {
        return false
    }

    // Utiliser props.columns pour avoir l'ordre réel (inclut __rowNumber__)
    const allColumns = props.columns
    const leftPinnedColumns: any[] = []

    // Collecter toutes les colonnes épinglées à gauche dans l'ordre réel (sauf __rowNumber__)
    for (const col of allColumns) {
        if (col.field !== '__rowNumber__' && props.columnPinning?.getPinDirection(col.field) === 'left') {
            leftPinnedColumns.push(col)
        }
    }

    if (leftPinnedColumns.length === 0) {
        return false
    }

    // La dernière colonne épinglée à gauche est celle qui a l'index le plus élevé dans l'ordre réel
    const lastPinnedColumn = leftPinnedColumns[leftPinnedColumns.length - 1]
    return lastPinnedColumn.field === field
}

// ===== MÉTHODES DE FILTRAGE =====

/**
 * Bascule l'affichage du filtre pour une colonne
 *
 * @param field - Champ de la colonne
 */
const toggleFilter = (field: string) => {
    if (showFilter.value === field) {
        showFilter.value = ''
    } else {
        showFilter.value = field
    }
}

// applyFilter et clearFilter seront définis après defineEmits

/**
 * Ferme le dropdown de filtre pour un champ
 *
 * @param field - Champ du filtre à fermer
 */
const closeFilter = (field: string) => {
    if (showFilter.value === field) {
        showFilter.value = ''
    }
}

// ===== CLICK OUTSIDE HANDLER =====
/**
 * Référence au conteneur de la table pour détecter les clics externes
 */
const tableContainerRef = ref<HTMLElement | null>(null)

/**
 * Gère les clics en dehors du dropdown pour le fermer
 */
const handleClickOutside = (event: MouseEvent) => {
    if (!showFilter.value) return

    const target = event.target as HTMLElement

    // Vérifier si le clic est dans le dropdown ou sur le bouton de filtre
    const isClickInDropdown = target.closest('.filter-dropdown')
    const isClickOnFilterButton = target.closest('.filter-btn') || target.closest('.column-header')
    const isClickOnInput = target.closest('input, textarea, select')

    // Si le clic est en dehors du dropdown et du bouton, fermer le dropdown
    // Mais ne pas fermer si on clique sur un champ de saisie (pour éviter de fermer le filtre pendant la saisie)
    if (!isClickInDropdown && !isClickOnFilterButton && !isClickOnInput) {
        showFilter.value = ''
    }
}

// Ajouter le listener au montage
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

// Retirer le listener au démontage
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

// ===== MÉTHODES DE RENDU =====

/**
 * Rend une cellule avec le renderer approprié
 * Optimisé avec cache des renderers et cache des résultats
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @param row - Données de la ligne
 * @param rowId - ID de la ligne pour le cache
 * @returns Contenu rendu de la cellule
 */
const renderCell = (value: any, column: any, row: any, rowId?: string): string => {
    // Vérifier si on peut utiliser le cache
    const columnField = column?.field
    if (!columnField) {
        // Pas de field, pas de cache possible
        return value === null || value === undefined ? '-' : String(value)
    }

    // Créer une clé de cache optimisée avec hash de la valeur
    const valueHash = hashValue(value)
    const cacheKey = rowId ? `${rowId}-${columnField}-${valueHash}` : null

    // Vérifier le cache des résultats si disponible
    if (cacheKey && cellRenderCache.value.has(cacheKey)) {
        const cached = cellRenderCache.value.get(cacheKey)
        if (cached !== undefined) {
            return cached
        }
    }

    // Obtenir ou mettre en cache le renderer pour cette colonne
    let renderer = columnRendererCache.value.get(columnField)
    if (renderer === undefined) {
        // Renderer pas encore en cache, le calculer une fois
        renderer = cellRenderersService.getRenderer(column)
        columnRendererCache.value.set(columnField, renderer)
    }

    // Rendu de la cellule
    let result: string
    if (renderer) {
        result = renderer(value, column, row)
    } else {
        // Fallback : affichage simple (optimisé)
        result = value === null || value === undefined ? '-' : String(value)
    }

    // Mettre en cache le résultat si possible
    // Limiter la taille du cache à 2000 entrées pour de meilleures performances
    if (cacheKey) {
        const cacheSize = cellRenderCache.value.size
        if (cacheSize < 2000) {
            cellRenderCache.value.set(cacheKey, result)
        } else if (cacheSize >= 2000 && cacheSize < 2500) {
            // Nettoyer le cache si on approche la limite (garder les 1500 dernières)
            const entries = Array.from(cellRenderCache.value.entries())
            cellRenderCache.value.clear()
            entries.slice(-1500).forEach(([key, val]) => {
                cellRenderCache.value.set(key, val)
            })
            cellRenderCache.value.set(cacheKey, result)
        }
    }

    return result
}

/**
 * Vérifie si le contenu contient du HTML
 *
 * @param content - Contenu à vérifier
 * @returns true si le contenu contient du HTML
 */
const containsHTML = (content: string): boolean => {
    return content.includes('<') && content.includes('>')
}

// ===== MÉTHODES DE GESTION DES DONNÉES IMBRIQUÉES =====

/**
 * Vérifie si une cellule a des données imbriquées
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @returns true si la cellule a des données imbriquées
 */
const hasNestedData = (value: any, column: any): boolean => {
    if (!value) return false
    const config = column.nestedData
    if (!config) return false

    if (Array.isArray(value)) {
        return value.length > 0
    }

    if (typeof value === 'object' && value !== null) {
        const key = config.key
        const items = value[key]
        return Array.isArray(items) && items.length > 0
    }

    return false
}

/**
 * Obtient les éléments imbriqués pour une colonne donnée
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @returns Tableau d'éléments imbriqués
 */
const getNestedItems = (value: any, column: any): any[] => {
    const config = column.nestedData
    if (!config) return []

    const key = config.key
    if (Array.isArray(value)) {
        return value
    }

    if (typeof value === 'object' && value !== null) {
        const items = value[key]
        return Array.isArray(items) ? items : []
    }

    return []
}

/**
 * Rend une cellule imbriquée avec le renderer approprié
 *
 * @param value - Valeur de la cellule
 * @param column - Configuration de la colonne
 * @param row - Données de la ligne
 * @returns Contenu rendu de la cellule
 */
const renderNestedCell = (value: any, column: any, row: any) => {
    const renderer = cellRenderersService.getRenderer(column)

    if (renderer) {
        const result = renderer(value, column, row)
        return result
    }

    // Fallback : affichage simple
    if (value === null || value === undefined) return '-'
    return String(value)
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Obtient l'ID unique d'une ligne
 * Optimisé avec cache pour éviter les recalculs
 *
 * @param row - Ligne de données
 * @param rowIndex - Index de la ligne
 * @returns ID unique de la ligne
 */
const rowIdCache = new Map<any, string>()
const getRowId = (row: any, rowIndex: number): string => {
    if (!row) return rowIndex.toString()

    // Vérifier le cache (seulement pour les lignes qui ont un id/reference/job)
    if (row.id || row.reference || row.job) {
        const cacheKey = row.id || row.reference || row.job
        if (rowIdCache.has(cacheKey)) {
            return rowIdCache.get(cacheKey)!
        }
        const id = String(row.id || row.reference || row.job)
        rowIdCache.set(cacheKey, id)
        return id
    }

    return rowIndex.toString()
}

/**
 * Bascule l'expansion d'une ligne
 *
 * @param rowId - ID de la ligne
 */
const toggleRowExpansion = (rowId: string) => {
    if (expandedRows.value.has(rowId)) {
        expandedRows.value.delete(rowId)
    } else {
        expandedRows.value.add(rowId)
    }
}

/**
 * Vérifie si une ligne est expandée
 *
 * @param rowId - ID de la ligne
 * @returns true si la ligne est expandée
 */
const isRowExpanded = (rowId: string): boolean => {
    return expandedRows.value.has(rowId)
}

/**
 * Bascule l'expansion responsive d'une ligne
 *
 * @param rowId - ID de la ligne
 */
const toggleResponsiveExpansion = (rowId: string) => {
    if (responsiveExpandedRows.value.has(rowId)) {
        responsiveExpandedRows.value.delete(rowId)
    } else {
        responsiveExpandedRows.value.add(rowId)
    }
}

/**
 * Vérifie si une ligne est expandée pour les colonnes responsive
 *
 * @param rowId - ID de la ligne
 * @returns true si la ligne est expandée
 */
const isResponsiveExpanded = (rowId: string): boolean => {
    return responsiveExpandedRows.value.has(rowId)
}

// ===== MÉTHODES UTILITAIRES =====

/**
 * Formate une date pour l'affichage
 *
 * @param value - Valeur de date
 * @returns Date formatée ou valeur originale
 */
function formatDate(value: any) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('fr-FR');
}

// ===== ÉMISSIONS =====

/**
 * Définit les émissions du composant
 */
const emit = defineEmits<{
    'sort-changed': [sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }]
    'filter-changed': [filters: Record<string, any>]
    'selection-changed': [selectedRows: Set<string>]
    'clear-selections': []
    'cell-value-changed': [event: { data: any; field: string; newValue: any; oldValue: any }]
    'row-clicked': [rowId: string]
}>()

/**
 * Bascule la sélection de toutes les lignes
 */
const toggleAllSelection = () => {
    // Vérifier si toutes les lignes de la page actuelle sont sélectionnées
    // Utiliser selectedRows.value (état local) comme source de vérité pour une réactivité immédiate
    const currentSelection = selectedRows.value
    const pageRowIds = allRowIds.value

    // allRowIds retourne déjà des strings, donc pas besoin de conversion
    const allSelected = pageRowIds.length > 0 && pageRowIds.every(id => currentSelection.has(id))

    // Créer un nouveau Set basé sur selectedRows.value (état local)
    const newSelection = new Set<string>(currentSelection)

    if (allSelected) {
        // Si toutes les lignes de la page actuelle sont sélectionnées, désélectionner toutes les lignes de la page actuelle
        // Garder les sélections des autres pages mais retirer celles de la page actuelle
        pageRowIds.forEach(id => {
            // id est déjà une string (allRowIds retourne des strings)
            newSelection.delete(id)
        })
    } else {
        // Sinon, sélectionner toutes les lignes de la page actuelle
        // Ajouter toutes les lignes de la page actuelle au Set
        pageRowIds.forEach(id => {
            // id est déjà une string (allRowIds retourne des strings)
            if (!newSelection.has(id)) {
                newSelection.add(id)
            }
        })
    }

    // Mettre à jour l'état local immédiatement pour une réactivité immédiate
    // Créer un nouveau Set pour forcer la réactivité
    selectedRows.value = new Set(newSelection)

    // Mettre à jour l'état "sélectionner tout" après la mise à jour
    nextTick(() => {
        updateSelectAllState()
    })

    // Émettre l'événement de changement de sélection avec le nouveau Set complet
    emit('selection-changed', new Set(newSelection))
}

/**
 * Bascule la sélection d'une ligne spécifique
 */
const toggleRowSelection = (rowId: string | number) => {
    const normalizedId = String(rowId)

    // Créer un nouveau Set basé sur selectedRows.value (état local) pour une réactivité immédiate
    const currentSelection = selectedRows.value
    const newSelection = new Set<string>(currentSelection)

    if (newSelection.has(normalizedId)) {
        // Désélectionner
        newSelection.delete(normalizedId)
    } else {
        // Sélectionner
        newSelection.add(normalizedId)
    }

    // Mettre à jour l'état local IMMÉDIATEMENT pour une réactivité immédiate
    // Créer un nouveau Set pour forcer la réactivité
    selectedRows.value = new Set(newSelection)

    // Mettre à jour l'état "sélectionner tout" après la mise à jour
    nextTick(() => {
        updateSelectAllState()
    })

    // Émettre l'événement de changement de sélection avec le nouveau Set
    emit('selection-changed', new Set(newSelection))
}

/**
 * Gère le tri d'une colonne
 * Cycle: asc -> desc -> neutre (pas de tri)
 *
 * @param field - Champ à trier
 */
const handleSort = (field: string) => {
    let newDirection: 'asc' | 'desc' = 'asc'
    let isActive = true

    if (currentSortField.value === field) {
        // Cycle: asc -> desc -> neutre (pas de tri)
        if (currentSortDirection.value === 'asc') {
            newDirection = 'desc'
        } else {
            // Retour à l'état neutre (pas de tri)
            isActive = false
        }
    } else {
        // Nouveau champ, commencer par ascendant
        newDirection = 'asc'
    }

    // Émettre l'événement de tri vers le parent
    emit('sort-changed', {
        field,
        direction: newDirection,
        isActive
    })
}

/**
 * Sauvegarde l'édition d'une cellule
 *
 * @param newValue - Nouvelle valeur
 */
const saveEditCell = (newValue: any) => {
    if (!editingCell.value) return

    const { rowId, field } = editingCell.value
    const row = props.paginatedData.find((r, index) => {
        const rowIdentifier = String(r.id || r.reference || index)
        return rowId === rowIdentifier
    })

    if (!row) {
        logger.error('Ligne non trouvée pour la sauvegarde', {
            rowId,
            field,
            availableIds: props.paginatedData.map((r, i) => String(r.id || r.reference || i))
        })
        return
    }

    const oldValue = row[field]
    row[field] = newValue

    // Émettre l'événement de changement de valeur
    emit('cell-value-changed', {
        data: row,
        field,
        newValue,
        oldValue
    })

    // Arrêter l'édition
    editingCell.value = null
    editingValue.value = null
}

/**
 * Applique un filtre reçu du composant FilterDropdown
 *
 * @param filter - Configuration du filtre
 */
const applyFilter = (filter: any) => {
    // S'assurer que le filtre a la bonne structure
    if (filter && filter.field) {
        activeFilters.value[filter.field] = filter
        showFilter.value = ''

        // Émettre l'événement de filtre vers le parent
        emit('filter-changed', activeFilters.value)
    } else {
        logger.error('Format de filtre invalide', filter)
    }
}

/**
 * Efface un filtre pour un champ spécifique
 *
 * @param field - Champ du filtre à effacer
 */
const clearFilter = (field: string) => {
    delete activeFilters.value[field]

    // Émettre l'événement de filtre vers le parent
    emit('filter-changed', activeFilters.value)
}

// ===== EXPOSITION DE MÉTHODES =====

/**
 * Expose la méthode clearAllSelections pour utilisation externe
 */
defineExpose({
    clearAllSelections
})

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(() => {
    // Logger pour déboguer
    logger.debug('TableBody mounted', {
        paginatedDataLength: Array.isArray(props.paginatedData) ? props.paginatedData.length : 0,
        isArray: Array.isArray(props.paginatedData),
        sample: Array.isArray(props.paginatedData) && props.paginatedData.length > 0
            ? props.paginatedData.slice(0, 2).map((r: any) => ({ id: r?.id, ref: r?.reference }))
            : []
    })

    // Pré-calculer les renderers pour toutes les colonnes au montage
    // Cela évite de les recalculer à chaque rendu de cellule
    props.columns.forEach(column => {
        if (column?.field && !columnRendererCache.value.has(column.field)) {
            const renderer = cellRenderersService.getRenderer(column)
            columnRendererCache.value.set(column.field, renderer)
        }
    })

    // S'assurer que les sélections sont synchronisées au montage
    if (props.selectedRows.size === 0) {
        selectedRows.value = new Set<string>()
        selectAllState.value = 'none'
    } else {
        // Si des sélections existent, les synchroniser
        selectedRows.value = new Set(props.selectedRows)
    }
    // Initialiser l'état de sélection
    updateSelectAllState()
})

// ===== WATCHERS =====

/**
 * Synchronise l'état de sélection avec les props
 * Optimisé: observer la taille et un hash au lieu d'un deep watch
 * Note: Cette synchronisation se fait APRÈS les mises à jour locales pour éviter les conflits
 */
watch(() => {
    // Observer seulement la taille et un hash des sélections pour éviter le deep watch
    const set = props.selectedRows
    if (!set || set.size === 0) return { size: 0, hash: '' }
    // Créer un hash basé sur les premiers éléments pour détecter les changements
    const ids = Array.from(set).slice(0, 20).sort().join(',')
    return { size: set.size, hash: ids }
}, (newVal, oldVal) => {
    // Comparer seulement la taille et le hash pour éviter les comparaisons coûteuses
    if (newVal?.size !== oldVal?.size || newVal?.hash !== oldVal?.hash) {
        const newSet = new Set<string>(props.selectedRows)
    const currentSet = selectedRows.value
    const currentSize = currentSet.size
    const newSize = newSet.size

        // Vérifier si réellement différent
    if (currentSize !== newSize || !allRowIds.value.every(id => currentSet.has(id) === newSet.has(id))) {
        selectedRows.value = newSet
        updateSelectAllState()

        // Logger pour déboguer
        logger.debug('TableBody: selectedRows prop changed', {
            currentSize,
                newSize
            })
        }
    }
}, { immediate: true, flush: 'post' })

/**
 * Watcher pour pré-calculer les renderers quand les colonnes changent
 */
watch(() => props.columns, (newColumns) => {
    // Pré-calculer les renderers pour les nouvelles colonnes
    newColumns.forEach(column => {
        if (column?.field && !columnRendererCache.value.has(column.field)) {
            const renderer = cellRenderersService.getRenderer(column)
            columnRendererCache.value.set(column.field, renderer)
        }
    })
}, { immediate: false })

/**
 * Met à jour l'état "sélectionner tout" quand les données changent
 * Optimisé: pas de deep watch, seulement comparer la longueur et les IDs
 */
watch(() => {
    // Observer seulement la longueur et les IDs pour éviter le deep watch coûteux
    const data = props.paginatedData
    if (!Array.isArray(data)) return { length: 0, ids: [] }
    return {
        length: data.length,
        ids: data.slice(0, 10).map((r, i) => getRowId(r, i)).join(',')
    }
}, (newVal, oldVal) => {
    const newLength = newVal?.length || 0
    const oldLength = oldVal?.length || 0

    logger.debug('TableBody: paginatedData changed', {
        oldLength,
        newLength
    })

    // Invalider le cache des cellules si les données changent
    if (newLength !== oldLength || newVal?.ids !== oldVal?.ids) {
        cacheVersion.value++
        // Nettoyer les caches (cellRenderCache et rowIdCache)
        // Garder seulement les 1000 entrées les plus récentes
        if (cellRenderCache.value.size > 1000) {
            const entries = Array.from(cellRenderCache.value.entries())
            cellRenderCache.value.clear()
            entries.slice(-1000).forEach(([key, value]) => {
                cellRenderCache.value.set(key, value)
            })
        }
        // Nettoyer le cache des IDs de lignes (garder seulement les 200 dernières)
        if (rowIdCache.size > 200) {
            const entries = Array.from(rowIdCache.entries())
            rowIdCache.clear()
            entries.slice(-200).forEach(([key, value]) => {
                rowIdCache.set(key, value)
            })
        }
    }

    // Forcer la mise à jour si les données changent
    if (newLength !== oldLength || (newLength > 0 && oldLength === 0)) {
        nextTick(() => {
            updateSelectAllState()
        })
    } else {
        updateSelectAllState()
    }
}, { immediate: true })
</script>

<style scoped>
/* Animation shimmer pour le skeleton loader */
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}

/* Masquer les colonnes non visibles (responsive) */
.hidden {
    display: none !important;
}

/* Animation shimmer pour Tailwind */
.animate-\[shimmer_1\.5s_infinite\] {
    animation: shimmer 1.5s infinite;
}

/* Style pour les cellules en édition - permettre au dropdown de dépasser les limites */
.editing-cell {
    overflow: visible !important;
    position: relative;
    z-index: 10000;
    /* Créer un nouveau contexte de stacking pour le dropdown */
    isolation: isolate;
}

/* S'assurer que le conteneur parent permet aussi au dropdown de dépasser */
.editing-cell ~ * {
    overflow: visible !important;
}

/* S'assurer que le tbody permet au dropdown de dépasser quand une cellule est en édition */
tbody:has(.editing-cell) {
    overflow: visible !important;
}

/* S'assurer que le table permet au dropdown de dépasser quand une cellule est en édition */
table:has(.editing-cell) {
    overflow: visible !important;
}

/* Style global pour le mode édition - permettre au dropdown de dépasser */
.editing-mode {
    overflow: visible !important;
}

/* S'assurer que tous les dropdowns sont visibles en mode édition */
.editing-mode .vs__dropdown-menu,
.editing-mode .vs__dropdown {
    position: fixed !important;
    z-index: 99999 !important;
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
}

/* Style pour les cellules en édition dans le body du document (pour les dropdowns portés) */
body:has(.editing-cell) .vs__dropdown-menu {
    position: fixed !important;
    z-index: 99999 !important;
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
}
</style>

