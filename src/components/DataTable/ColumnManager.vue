<template>
    <!--
        Gestionnaire de colonnes pour DataTable
        Permet de configurer la visibilité, l'ordre et la largeur des colonnes
        Supporte le drag & drop pour réorganiser les colonnes
    -->
    <div class="column-manager" :class="{ 'minimized': props.minimized }">
        <!-- Header avec titre et actions -->
        <div class="manager-header">
            <h3 class="manager-title">Gestion des colonnes</h3>
            <div class="header-actions">
                <button @click="toggleMinimized" class="btn-minimize" :title="props.minimized ? 'Agrandir' : 'Réduire'">
                    {{ props.minimized ? '⤢' : '⤡' }}
                </button>
                <button @click="resetColumns" class="btn-secondary">Réinitialiser</button>
                <button @click="$emit('close')" class="btn-close">×</button>
            </div>
        </div>

        <!-- Options globales -->
        <div class="global-options">
            <!-- Contrôle du nombre de colonnes visibles par défaut -->
            <div class="option-group">
                <label class="option-label">
                    <span>Nombre de colonnes visibles :</span>
                    <input
                        type="number"
                        :value="defaultVisibleColumnsCount"
                        @input="handleDefaultVisibleColumnsChange"
                        :min="4"
                        :max="totalAvailableColumns"
                        class="number-input"
                    />
                    <span class="option-hint">(Min: 4, Max: {{ totalAvailableColumns }})</span>
                </label>
                <div class="option-description">
                    Toutes les colonnes visibles sont affichées (pas de limitation responsive)
                </div>
            </div>

            <!-- Option sticky header si pinning activé -->
            <div v-if="enableColumnPinning" class="option-group">
                <label class="option-label">
                    <input type="checkbox" :checked="stickyHeader" @change="toggleStickyHeader" />
                    <span>Fixer le header (sticky)</span>
                </label>
            </div>
        </div>

        <!-- Liste des colonnes visibles avec drag & drop -->
        <div class="columns-list" ref="columnsList">
            <div
                v-for="(column, index) in visibleColumnsData"
                :key="`column-${column?.field || index}`"
                :draggable="column?.draggable !== false && column?.field !== '__rowNumber__'"
                @dragstart="onDragStart($event, index)"
                @dragover.prevent="onDragOver($event, index)"
                @dragenter.prevent="onDragEnter($event, index)"
                @dragleave="onDragLeave($event)"
                @drop.prevent="onDrop($event, index)"
                @dragend="onDragEnd"
                class="column-item"
                :class="{
                    'dragging': draggedIndex === index,
                    'not-draggable': column?.field === '__rowNumber__' || column?.draggable === false
                }"
            >
                <!-- Handle de drag avec icône -->
                <div class="drag-handle" v-if="column?.draggable !== false">
                    <IconDrag class="w-4 h-4 text-gray-400" />
                </div>

                <!-- Icône de la colonne si définie -->
                <div class="column-icon" v-if="column?.icon && getIconComponent(column.icon)">
                    <component :is="getIconComponent(column.icon)" class="w-4 h-4" />
                </div>

                <!-- Informations de la colonne (nom et champ) -->
                <div class="column-info">
                    <div class="column-name">
                        {{ column?.headerName || column?.field || 'Colonne inconnue' }}
                        <span v-if="column?.hide" class="hidden-indicator" title="Masquée par défaut">🔒</span>
                    </div>
                    <div class="column-field">{{ column?.field || 'field' }}</div>
                </div>

                <!-- Contrôles de la colonne (visibilité, pinning) -->
                <div class="column-controls">
                    <!-- Toggle de visibilité -->
                    <label class="visibility-toggle">
                        <input
                            type="checkbox"
                            :checked="isColumnVisible(column?.field || '')"
                            @change="toggleColumnVisibility(column?.field || '')"
                            :disabled="column?.field === '__rowNumber__' || (isColumnVisible(column?.field || '') && props.visibleColumns.length <= 1)"
                        />
                        <span class="toggle-slider"></span>
                    </label>

                    <!-- Contrôle de pinning (fixation) si activé -->
                    <div v-if="enableColumnPinning" class="pinning-control">
                        <select
                            :value="getColumnPinDirection(column?.field || '')"
                            @change="handlePinChange(column?.field || '', $event)"
                            class="pin-select"
                            :title="'Fixer la colonne ' + (column?.headerName || column?.field)"
                            :disabled="column?.field === '__rowNumber__'"
                        >
                            <option value="">Non fixée</option>
                            <option value="left">← Gauche</option>
                            <option value="right">Droite →</option>
                        </select>
                    </div>

                </div>
            </div>
        </div>

        <!-- Section des colonnes masquées -->
        <div v-if="hiddenColumns.length > 0" class="hidden-section">
            <h4 class="hidden-title">Colonnes masquées</h4>
            <div class="hidden-list">
                <div
                    v-for="column in hiddenColumns"
                    :key="column?.field || 'unknown'"
                    class="hidden-item"
                >
                    <div class="column-info">
                        <div class="column-name">
                            {{ column?.headerName || column?.field || 'Colonne inconnue' }}
                            <span v-if="column?.hide" class="hidden-indicator" title="Masquée par défaut">🔒</span>
                        </div>
                        <div class="column-field">{{ column?.field || 'field' }}</div>
                    </div>
                    <!-- Bouton pour afficher la colonne -->
                    <button
                        @click.stop="showColumn(column?.field || '')"
                        class="show-btn"
                        :title="'Afficher ' + (column?.headerName || column?.field)"
                    >
                        <IconEye class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { ref, computed } from 'vue'
import { logger } from '@/services/loggerService'
import type { DataTableColumn } from '@/components/DataTable/types/dataTable'
import IconDrag from '../icon/icon-drag.vue'
import IconResize from '../icon/icon-resize.vue'
import IconEye from '../icon/icon-eye.vue'

/**
 * Props du composant ColumnManager
 *
 * @param columns - Configuration complète des colonnes
 * @param visibleColumns - Liste des champs des colonnes visibles
 * @param columnWidths - Map des largeurs par champ de colonne
 * @param enableColumnPinning - Active le contrôle de pinning des colonnes
 * @param columnPinning - Instance du composable useColumnPinning
 * @param stickyHeader - État du header sticky
 */
const props = defineProps<{
    columns: DataTableColumn[]
    visibleColumns: string[]
    columnWidths: Record<string, number>
    enableColumnPinning?: boolean
    columnPinning?: any
    stickyHeader?: boolean
    defaultVisibleColumnsCount?: number
    minimized?: boolean
}>()

/**
 * Émissions du composant
 *
 * @param columns-changed - Émis quand les colonnes ou largeurs changent
 * @param reorder-columns - Émis lors du réordonnancement par drag & drop
 * @param close - Émis pour fermer le composant
 * @param pin-column - Émis quand une colonne est épinglée/désépinglée
 * @param sticky-header-changed - Émis quand l'état du header sticky change
 */
const emit = defineEmits<{
    'columns-changed': [visibleColumns: string[], columnWidths: Record<string, number>]
    'reorder-columns': [fromIndex: number, toIndex: number]
    'close': []
    'pin-column': [field: string, direction: 'left' | 'right' | null]
    'sticky-header-changed': [enabled: boolean]
    'default-visible-columns-changed': [count: number]
    'toggle-minimized': []
}>()

// ===== ÉTAT LOCAL =====

/**
 * Index de la colonne en cours de drag
 */
const draggedIndex = ref<number | null>(null)

/**
 * Référence vers la liste des colonnes
 */
const columnsList = ref<HTMLElement | null>(null)

// ===== COMPUTED PROPERTIES =====

/**
 * Nombre total de colonnes disponibles (exclut hide: true et __rowNumber__)
 */
const totalAvailableColumns = computed(() => {
    return props.columns.filter(col =>
        col?.field &&
        col.hide !== true &&
        col.field !== '__rowNumber__'
    ).length
})

/**
 * Nombre de colonnes visibles par défaut (avec valeur par défaut de 6)
 */
const defaultVisibleColumnsCount = computed(() => {
    return props.defaultVisibleColumnsCount ?? 6
})

/**
 * Colonnes visibles avec leurs données complètes
 * Affiche toutes les colonnes disponibles (pas seulement les visibles)
 * Exclut __rowNumber__ car elle est gérée automatiquement et toujours visible
 * Exclut UNIQUEMENT les colonnes avec hide: true (toujours masquées)
 * Les colonnes avec visible: false peuvent être affichées via ColumnManager
 */
const visibleColumnsData = computed(() => {
    // Afficher toutes les colonnes disponibles (pas seulement les visibles)
    // Mais exclure UNIQUEMENT les colonnes marquées comme toujours masquées (hide: true)
    // visible: false est autorisé car l'utilisateur peut l'afficher via ColumnManager
    // ET exclure __rowNumber__ car elle est toujours visible et gérée automatiquement
    const allColumns = props.columns.filter(col =>
        col?.field &&
        col.hide !== true &&
        col.field !== '__rowNumber__'
    )

    // Trier les colonnes : d'abord les visibles, puis les masquées
    const visibleCols = allColumns.filter(col => props.visibleColumns.includes(col.field))
    const hiddenCols = allColumns.filter(col => !props.visibleColumns.includes(col.field))

    return [...visibleCols, ...hiddenCols]
})

/**
 * Colonnes masquées (non visibles mais pas toujours masquées)
 * Exclut les colonnes marquées comme toujours masquées (hide: true)
 * Inclut les colonnes avec visible: false (peuvent être affichées)
 * Exclut __rowNumber__ car elle est toujours visible et gérée automatiquement
 */
const hiddenColumns = computed(() =>
    props.columns.filter(col =>
        col?.field &&
        !props.visibleColumns.includes(col.field) &&
        col.hide !== true &&
        col.field !== '__rowNumber__'
    )
)

// ===== MÉTHODES UTILITAIRES =====

/**
 * Récupère le composant icône par nom
 *
 * @param iconName - Nom de l'icône
 * @returns Composant Vue ou null
 */
const getIconComponent = (iconName: string) => {
    if (!iconName) return null

    // Mapping des icônes disponibles
    const iconMap: Record<string, any> = {
        'icon-drag': IconDrag,
        'icon-resize': IconResize,
        'icon-eye': IconEye,
    }

    return iconMap[iconName] || null
}

/**
 * Vérifie si une colonne est visible
 *
 * @param field - Champ de la colonne
 * @returns true si la colonne est visible
 */
const isColumnVisible = (field: string) => {
    if (!field) return false
    return props.visibleColumns.includes(field)
}

/**
 * Bascule la visibilité d'une colonne
 * Empêche de masquer la dernière colonne visible
 * Empêche de masquer __rowNumber__
 * Empêche UNIQUEMENT de réactiver les colonnes avec hide: true (toujours masquées)
 * Les colonnes avec visible: false peuvent être affichées/masquées
 *
 * @param field - Champ de la colonne
 */
const toggleColumnVisibility = (field: string) => {
    if (!field) return

    // Empêcher de masquer __rowNumber__
    if (field === '__rowNumber__') {
        return
    }

    // Trouver la définition de la colonne
    const columnDef = props.columns.find(col => col.field === field)
    if (columnDef) {

        // Empêcher UNIQUEMENT de réactiver les colonnes avec hide: true (toujours masquées)
        // visible: false est autorisé car l'utilisateur peut l'afficher via ColumnManager
        if (columnDef.hide === true) {
            console.warn(`🚫 [ColumnManager] Impossible de réactiver la colonne ${field} car elle a hide: true (toujours masquée)`)
            logger.warn(`Impossible de réactiver la colonne ${field} car elle a hide: true (toujours masquée)`)
            return
        }
    }

    const newVisibleColumns = [...props.visibleColumns]
    const index = newVisibleColumns.indexOf(field)

    if (index > -1) {
        // Empêcher de masquer la dernière colonne visible
        const visibleCount = newVisibleColumns.length
        if (visibleCount <= 1) {
            console.warn('🚫 [ColumnManager] Impossible de masquer la dernière colonne visible')
            logger.warn('Impossible de masquer la dernière colonne visible')
            return
        }
        newVisibleColumns.splice(index, 1)
    } else {
        newVisibleColumns.push(field)
    }

    emit('columns-changed', newVisibleColumns, props.columnWidths)
}

/**
 * Affiche une colonne masquée
 * Empêche UNIQUEMENT de réactiver les colonnes avec hide: true (toujours masquées)
 * Les colonnes avec visible: false peuvent être affichées
 *
 * @param field - Champ de la colonne à afficher
 */
const showColumn = (field: string) => {
    if (!field) return

    // Trouver la définition de la colonne
    const columnDef = props.columns.find(col => col.field === field)
    if (columnDef) {
        // Empêcher UNIQUEMENT de réactiver les colonnes avec hide: true (toujours masquées)
        // visible: false est autorisé car l'utilisateur peut l'afficher via ColumnManager
        if (columnDef.hide === true) {
            logger.warn(`Impossible de réactiver la colonne ${field} car elle a hide: true (toujours masquée)`)
            return
        }
    }

    // Ajouter la colonne à la liste des colonnes visibles
    const newVisibleColumns = [...props.visibleColumns, field]

    emit('columns-changed', newVisibleColumns, props.columnWidths)
}


/**
 * Réinitialise toutes les colonnes à leur état par défaut
 * Affiche toutes les colonnes avec leurs largeurs par défaut
 * Exclut __rowNumber__ car elle est toujours visible et gérée automatiquement
 * Exclut UNIQUEMENT les colonnes avec hide: true (toujours masquées)
 * Les colonnes avec visible: false sont incluses (peuvent être affichées)
 */

/**
 * Bascule l'état réduit/agrandi du modal
 */
const toggleMinimized = () => {
    emit('toggle-minimized')
}

const resetColumns = () => {
    // Récupérer toutes les colonnes qui ne sont pas toujours masquées
    // Exclure __rowNumber__ car elle est toujours visible et gérée automatiquement
    // Exclure UNIQUEMENT les colonnes avec hide: true (toujours masquées)
    // visible: false est autorisé car l'utilisateur peut l'afficher via ColumnManager
    const allFields = props.columns
        .filter(col =>
            col.field &&
            col.hide !== true &&
            col.field !== '__rowNumber__'
        )
        .map(col => col.field!)

    const defaultWidths: Record<string, number> = {}

    props.columns.forEach(column => {
        if (column.field && column.field !== '__rowNumber__' && column.hide !== true) {
            defaultWidths[column.field] = column.width || 150
        }
    })

    emit('columns-changed', allFields, defaultWidths)
}

// ===== GESTION DU DRAG & DROP =====

/**
 * Début du drag d'une colonne
 *
 * @param event - Événement de drag
 * @param index - Index de la colonne
 */
const onDragStart = (event: DragEvent, index: number) => {
    const column = visibleColumnsData.value[index]
    draggedIndex.value = index

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        // Ajouter des données pour le transfert
        event.dataTransfer.setData('text/plain', index.toString())
        // Créer une image de drag personnalisée
        const dragImage = event.target as HTMLElement
        if (dragImage) {
            event.dataTransfer.setDragImage(dragImage, 0, 0)
        }
    }
}

/**
 * Gestion du survol pendant le drag
 *
 * @param event - Événement de drag
 * @param index - Index de la colonne cible
 */
const onDragOver = (event: DragEvent, index: number) => {
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
    }

    // Ajouter une classe visuelle pour indiquer la zone de drop
    const target = event.currentTarget as HTMLElement
    if (target && draggedIndex.value !== null && draggedIndex.value !== index) {
        target.classList.add('drag-over')
    }
}

/**
 * Entrée dans une zone de drop
 *
 * @param event - Événement de drag
 * @param index - Index de la colonne cible
 */
const onDragEnter = (event: DragEvent, index: number) => {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    if (target && draggedIndex.value !== null && draggedIndex.value !== index) {
        target.classList.add('drag-over')
    }
}

/**
 * Sortie d'une zone de drop
 *
 * @param event - Événement de drag
 */
const onDragLeave = (event: DragEvent) => {
    const target = event.currentTarget as HTMLElement
    if (target) {
        target.classList.remove('drag-over')
    }
}

/**
 * Drop d'une colonne
 * Émet l'événement de réordonnancement
 *
 * @param event - Événement de drop
 * @param index - Index de la colonne cible
 */
const onDrop = (event: DragEvent, index: number) => {
    event.preventDefault()
    event.stopPropagation()

    // Retirer la classe visuelle
    const target = event.currentTarget as HTMLElement
    if (target) {
        target.classList.remove('drag-over')
    }

    if (draggedIndex.value !== null && draggedIndex.value !== index) {
        // Empêcher de déplacer __rowNumber__
        const draggedCol = visibleColumnsData.value[draggedIndex.value]
        const targetCol = visibleColumnsData.value[index]

        if (!draggedCol || !targetCol) {
            return
        }

        if (draggedCol.field === '__rowNumber__' || targetCol.field === '__rowNumber__') {
            return // Ne pas permettre de déplacer __rowNumber__
        }

        // Trouver les index dans la liste des colonnes visibles (props.visibleColumns)
        const fromIndexInVisible = props.visibleColumns.indexOf(draggedCol.field || '')
        const toIndexInVisible = props.visibleColumns.indexOf(targetCol.field || '')

        if (fromIndexInVisible !== -1 && toIndexInVisible !== -1 && fromIndexInVisible !== toIndexInVisible) {
            // Émettre l'événement de réordonnancement avec les index des colonnes visibles
            emit('reorder-columns', fromIndexInVisible, toIndexInVisible)
        }
    }
}

/**
 * Fin du drag
 * Nettoie les classes visuelles
 */
const onDragEnd = () => {
    // Retirer toutes les classes visuelles
    const items = document.querySelectorAll('.column-item')
    items.forEach(item => item.classList.remove('drag-over'))
    draggedIndex.value = null
}


// ===== MÉTHODES DE PINNING =====

/**
 * Obtient la direction de pinning d'une colonne
 *
 * @param field - Champ de la colonne
 * @returns Direction du pinning ('left', 'right' ou '')
 */
const getColumnPinDirection = (field: string): string => {
    if (!props.enableColumnPinning || !props.columnPinning || !field) return ''
    return props.columnPinning.getPinDirection(field) || ''
}

/**
 * Gère le changement de pinning d'une colonne
 *
 * @param field - Champ de la colonne
 * @param event - Événement de changement
 */
const handlePinChange = (field: string, event: Event) => {
    if (!field || !props.enableColumnPinning) return

    // Empêcher de modifier le pinning de __rowNumber__
    if (field === '__rowNumber__') {
        return
    }

    const target = event.target as HTMLSelectElement
    const direction = target.value as 'left' | 'right' | null

    emit('pin-column', field, direction || null)
}

/**
 * Bascule l'état du header sticky
 */
const toggleStickyHeader = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('sticky-header-changed', target.checked)
}

/**
 * Gère le changement du nombre de colonnes visibles par défaut
 */
const handleDefaultVisibleColumnsChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = parseInt(target.value, 10)

    if (isNaN(value)) return

    // Valider les limites
    const min = 4
    const max = totalAvailableColumns.value
    const clampedValue = Math.max(min, Math.min(max, value))

    emit('default-visible-columns-changed', clampedValue)
}
</script>

<style scoped>
/*
    Styles pour le composant ColumnManager
    Interface moderne avec drag & drop et contrôles intuitifs
*/

.column-manager {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    width: 100%;
    min-width: 360px;
    max-width: 480px;
    max-height: 95vh; /* Augmenté de 85vh à 95vh */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: auto;
}

.column-manager.minimized {
    max-height: 60px;
}

.column-manager.minimized .manager-header {
    border-bottom: none;
}

.column-manager.minimized .global-options,
.column-manager.minimized .columns-list,
.column-manager.minimized .hidden-section {
    display: none;
}

.dark .column-manager {
    background: #1f2937;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
}

@media (max-width: 640px) {
    .column-manager {
        min-width: 100%;
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }
}

/* Header avec titre et actions */
.manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 2px solid #e5e7eb;
    background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
}

.manager-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.025em;
}

.header-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-secondary,
.btn-primary,
.btn-minimize,
.btn-close {
    padding: 0.5rem 0.875rem;
    border: 1.5px solid #d1d5db;
    border-radius: 0.5rem;
    background: white;
    color: #374151;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: #f3f4f6;
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.btn-primary:hover {
    background: #2563eb;
}

.btn-minimize {
    padding: 0.25rem 0.5rem;
    font-size: 1.25rem;
    line-height: 1;
    min-width: 2rem;
    text-align: center;
}

.btn-close {
    padding: 0.25rem 0.5rem;
    font-size: 1.25rem;
    line-height: 1;
}

/* Liste des colonnes */
.columns-list {
    padding: 0.75rem;
    max-height: 600px; /* Augmenté de 400px à 600px */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) rgba(0, 0, 0, 0.1);
}

.columns-list::-webkit-scrollbar {
    width: 6px;
}

.columns-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
}

.columns-list::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: 3px;
}

.columns-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary-dark);
}

.column-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    background: white;
    transition: all 0.2s;
    cursor: move;
    min-width: 0;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
}

.column-item:hover {
    background: #f9fafb;
    border-color: #d1d5db;
}

.column-item.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    z-index: 1000;
}

.column-item.drag-over {
    border-color: #3b82f6;
    background-color: #eff6ff;
    transform: scale(1.02);
    box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.3);
}

.dark .column-item.drag-over {
    background-color: #1e3a8a;
    border-color: #3b82f6;
}

.drag-handle {
    cursor: grab;
    padding: 0.5rem;
    color: #9ca3af;
    transition: color 0.2s;
    flex-shrink: 0;
}

.drag-handle:hover {
    color: var(--color-primary);
}

.drag-handle:active {
    cursor: grabbing;
    color: var(--color-primary);
}

.column-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    color: #6b7280;
    flex-shrink: 0;
}

.column-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.column-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hidden-indicator {
    font-size: 0.75rem;
    opacity: 0.6;
}

.column-field {
    font-size: 0.7rem;
    color: #6b7280;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.column-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

/* Toggle de visibilité */
.visibility-toggle {
    position: relative;
    display: inline-block;
    width: 2rem;
    height: 1rem;
}

.visibility-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 1rem;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 0.75rem;
    width: 0.75rem;
    left: 0.125rem;
    bottom: 0.125rem;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .toggle-slider {
    background-color: #3b82f6;
}

input:checked + .toggle-slider:before {
    transform: translateX(1rem);
}



/* Options globales */
.global-options {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.option-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.option-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    flex-wrap: wrap;
}

.option-label input[type="checkbox"] {
    cursor: pointer;
}

.option-label .number-input {
    width: 60px;
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    text-align: center;
}

.option-label .number-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.15);
}

.option-hint {
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
}

.option-description {
    font-size: 0.75rem;
    color: #6b7280;
    margin-left: 0;
    padding-left: 0;
}

/* Contrôle de pinning */
.pinning-control {
    display: flex;
    align-items: center;
}

.pin-select {
    padding: 0.5rem 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    font-weight: 500;
    background: white;
    color: #374151;
    cursor: pointer;
    min-width: 100px;
    transition: all 0.2s;
}

.pin-select:hover {
    border-color: var(--color-primary);
    background: #fefce8;
}

.pin-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.15);
    background: #ffffff;
}

.dark .pin-select {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

.dark .pin-select:hover {
    border-color: var(--color-primary);
    background: #2d3748;
}

/* Section des colonnes masquées */
.hidden-section {
    padding: 1rem;
    border-top: 2px solid #e5e7eb;
    background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
}

.hidden-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.hidden-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px; /* Augmenté de 200px à 400px */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) rgba(0, 0, 0, 0.1);
}

.hidden-list::-webkit-scrollbar {
    width: 6px;
}

.hidden-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
}

.hidden-list::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: 3px;
}

.hidden-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary-dark);
}

.hidden-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: white;
    border: 1.5px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: all 0.2s;
    min-width: 0;
    overflow: hidden;
}

.hidden-item:hover {
    border-color: var(--color-primary);
    background: #fefce8;
    transform: translateX(2px);
}

.show-btn {
    padding: 0.25rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    border-radius: 0.25rem;
}

.show-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

/* Dark mode */
.dark .column-manager {
    background: #1f2937;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
}

.dark .manager-header {
    background: #111827;
    border-color: #374151;
}

.dark .manager-title {
    color: #f9fafb;
}

.dark .column-item {
    background: #374151;
    border-color: #4b5563;
}

.dark .column-item:hover {
    background: #4b5563;
}

.dark .column-name {
    color: #f9fafb;
}

.dark .hidden-section {
    background: #111827;
    border-color: #374151;
}

.dark .hidden-item {
    background: #374151;
    border-color: #4b5563;
}
</style>
