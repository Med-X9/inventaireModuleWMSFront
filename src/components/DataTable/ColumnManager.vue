<template>
    <!--
        Gestionnaire de colonnes pour DataTable
        Permet de configurer la visibilité, l'ordre et la largeur des colonnes
        Supporte le drag & drop pour réorganiser les colonnes
    -->
    <div class="column-manager">
        <!-- Header avec titre et actions -->
        <div class="manager-header">
            <h3 class="manager-title">Gestion des colonnes</h3>
            <div class="header-actions">
                <button @click="resetColumns" class="btn-secondary">Réinitialiser</button>
                <button @click="autoSizeAll" class="btn-secondary">Auto-size</button>
                <button @click="$emit('close')" class="btn-close">×</button>
            </div>
        </div>

        <!-- Liste des colonnes visibles avec drag & drop -->
        <div class="columns-list" ref="columnsList">
            <div
                v-for="(column, index) in visibleColumnsData"
                :key="column?.field || index"
                :draggable="column?.draggable !== false"
                @dragstart="onDragStart($event, index)"
                @dragover="onDragOver($event, index)"
                @dragenter="onDragEnter($event, index)"
                @dragleave="onDragLeave($event)"
                @drop="onDrop($event, index)"
                @dragend="onDragEnd"
                class="column-item"
                :class="{ 'dragging': draggedIndex === index }"
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

                <!-- Contrôles de la colonne (visibilité, auto-size, largeur) -->
                <div class="column-controls">
                    <!-- Toggle de visibilité -->
                    <label class="visibility-toggle">
                        <input
                            type="checkbox"
                            :checked="isColumnVisible(column?.field || '')"
                            @change="toggleColumnVisibility(column?.field || '')"
                            :disabled="isColumnVisible(column?.field || '') && props.visibleColumns.length <= 1"
                        />
                        <span class="toggle-slider"></span>
                    </label>

                    <!-- Bouton auto-size pour ajuster automatiquement la largeur -->
                    <button
                        v-if="column?.autoSize !== false"
                        @click="autoSizeColumn(column?.field || '')"
                        class="auto-size-btn"
                        :title="'Auto-size ' + (column?.headerName || column?.field)"
                    >
                        <IconResize class="w-3 h-3" />
                    </button>

                    <!-- Contrôle de largeur personnalisée -->
                    <div class="width-control" v-if="column?.resizable !== false">
                        <input
                            type="number"
                            :value="getColumnWidth(column?.field || '')"
                            @input="handleWidthInput(column?.field || '', $event)"
                            class="width-input"
                            min="50"
                            max="500"
                            step="10"
                        />
                        <span class="width-unit">px</span>
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
 */
const props = defineProps<{
    columns: DataTableColumn[]
    visibleColumns: string[]
    columnWidths: Record<string, number>
}>()

/**
 * Émissions du composant
 *
 * @param columns-changed - Émis quand les colonnes ou largeurs changent
 * @param reorder-columns - Émis lors du réordonnancement par drag & drop
 * @param close - Émis pour fermer le composant
 */
const emit = defineEmits<{
    'columns-changed': [visibleColumns: string[], columnWidths: Record<string, number>]
    'reorder-columns': [fromIndex: number, toIndex: number]
    'close': []
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
 * Colonnes visibles avec leurs données complètes
 * Affiche toutes les colonnes disponibles (pas seulement les visibles)
 */
const visibleColumnsData = computed(() => {
    // Afficher toutes les colonnes disponibles (pas seulement les visibles)
    // Mais exclure les colonnes marquées comme masquées par défaut (hide: true)
    const allColumns = props.columns.filter(col => col?.field && col.hide !== true)

    // Trier les colonnes : d'abord les visibles, puis les masquées
    const visibleCols = allColumns.filter(col => props.visibleColumns.includes(col.field))
    const hiddenCols = allColumns.filter(col => !props.visibleColumns.includes(col.field))

    return [...visibleCols, ...hiddenCols]
})

/**
 * Colonnes masquées (non visibles mais pas masquées par défaut)
 * Exclut les colonnes marquées comme masquées par défaut (hide: true)
 */
const hiddenColumns = computed(() =>
    props.columns.filter(col => col?.field && !props.visibleColumns.includes(col.field) && col.hide !== true)
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
 *
 * @param field - Champ de la colonne
 */
const toggleColumnVisibility = (field: string) => {
    if (!field) return

    const newVisibleColumns = [...props.visibleColumns]
    const index = newVisibleColumns.indexOf(field)

    if (index > -1) {
        // Empêcher de masquer la dernière colonne visible
        const visibleCount = newVisibleColumns.length
        if (visibleCount <= 1) {
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
 *
 * @param field - Champ de la colonne à afficher
 */
const showColumn = (field: string) => {
    if (!field) return

    const newVisibleColumns = [...props.visibleColumns, field]
    emit('columns-changed', newVisibleColumns, props.columnWidths)
}

/**
 * Récupère la largeur d'une colonne
 *
 * @param field - Champ de la colonne
 * @returns Largeur en pixels
 */
const getColumnWidth = (field: string) => {
    if (!field) return 150
    return props.columnWidths[field] || 150
}

/**
 * Définit la largeur d'une colonne
 *
 * @param field - Champ de la colonne
 * @param width - Nouvelle largeur en pixels
 */
const setColumnWidth = (field: string, width: string) => {
    if (!field) return

    const newWidths = { ...props.columnWidths }
    newWidths[field] = parseInt(width) || 150
    emit('columns-changed', props.visibleColumns, newWidths)
}

// ===== MÉTHODES D'AUTO-SIZE =====

/**
 * Ajuste automatiquement la largeur d'une colonne
 * Calcule la largeur optimale basée sur le contenu de l'en-tête
 *
 * @param field - Champ de la colonne
 */
const autoSizeColumn = (field: string) => {
    if (!field) return

    const column = props.columns.find(col => col?.field === field)
    if (!column) return

    // Calcul de la largeur basée sur le contenu de l'en-tête
    const headerText = column.headerName || column.field || ''
    const headerWidth = headerText.length * 10 // ~10px par caractère

    // Largeur minimale pour les contrôles (tri, filtre, etc.)
    const controlsWidth = 80

    // Largeur minimale selon le type de données
    let minWidth = 120
    if (column.dataType === 'boolean') minWidth = 80
    else if (column.dataType === 'date' || column.dataType === 'datetime') minWidth = 120
    else if (column.dataType === 'number') minWidth = 100

    // Largeur maximale
    const maxWidth = 500

    // Calcul de la largeur optimale
    const optimalWidth = Math.max(minWidth, Math.min(maxWidth, headerWidth + controlsWidth))

    // Appliquer la nouvelle largeur
    const newWidths = { ...props.columnWidths }
    newWidths[field] = optimalWidth

    emit('columns-changed', props.visibleColumns, newWidths)
}

/**
 * Ajuste automatiquement la largeur de toutes les colonnes
 * Applique l'auto-size à toutes les colonnes qui le supportent
 */
const autoSizeAll = () => {
    const newWidths = { ...props.columnWidths }

    props.columns.forEach(column => {
        if (column.autoSize !== false && column.field) {
            // Calcul de la largeur basée sur le contenu de l'en-tête
            const headerText = column.headerName || column.field || ''
            const headerWidth = headerText.length * 10 // ~10px par caractère

            // Largeur minimale pour les contrôles (tri, filtre, etc.)
            const controlsWidth = 80

            // Largeur minimale selon le type de données
            let minWidth = 120
            if (column.dataType === 'boolean') minWidth = 80
            else if (column.dataType === 'date' || column.dataType === 'datetime') minWidth = 120
            else if (column.dataType === 'number') minWidth = 100

            // Largeur maximale
            const maxWidth = 500

            // Calcul de la largeur optimale
            const optimalWidth = Math.max(minWidth, Math.min(maxWidth, headerWidth + controlsWidth))

            newWidths[column.field] = optimalWidth
        }
    })

    emit('columns-changed', props.visibleColumns, newWidths)
}

/**
 * Réinitialise toutes les colonnes à leur état par défaut
 * Affiche toutes les colonnes avec leurs largeurs par défaut
 */
const resetColumns = () => {
    // Récupérer toutes les colonnes qui ne sont pas masquées par défaut
    const allFields = props.columns
        .filter(col => col.field && col.hide !== true)
        .map(col => col.field!)

    const defaultWidths: Record<string, number> = {}

    props.columns.forEach(column => {
        if (column.field) {
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
    event.preventDefault()
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

    // Retirer la classe visuelle
    const target = event.currentTarget as HTMLElement
    if (target) {
        target.classList.remove('drag-over')
    }

    if (draggedIndex.value !== null && draggedIndex.value !== index) {
        // Émettre l'événement de réordonnancement
        emit('reorder-columns', draggedIndex.value, index)
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

/**
 * Gère la saisie de largeur personnalisée
 *
 * @param field - Champ de la colonne
 * @param event - Événement de saisie
 */
const handleWidthInput = (field: string, event: Event) => {
    const target = event.target as HTMLInputElement
    const width = target.value
    setColumnWidth(field, width)
}
</script>

<style scoped>
/*
    Styles pour le composant ColumnManager
    Interface moderne avec drag & drop et contrôles intuitifs
*/

.column-manager {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 340px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Header avec titre et actions */
.manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
}

.manager-title {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-secondary,
.btn-primary,
.btn-close {
    padding: 0.375rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
    color: #374151;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: #f3f4f6;
}

.btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.btn-primary:hover {
    background: #2563eb;
}

.btn-close {
    padding: 0.25rem 0.5rem;
    font-size: 1.25rem;
    line-height: 1;
}

/* Liste des colonnes */
.columns-list {
    padding: 0.5rem;
    max-height: 140px;
    overflow-y: auto;
}

.column-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    margin-bottom: 0.375rem;
    background: white;
    transition: all 0.2s;
    cursor: move;
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
    padding: 0.25rem;
}

.drag-handle:active {
    cursor: grabbing;
}

.column-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    color: #6b7280;
}

.column-info {
    flex: 1;
    min-width: 0;
}

.column-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.hidden-indicator {
    font-size: 0.75rem;
    opacity: 0.6;
}

.column-field {
    font-size: 0.7rem;
    color: #6b7280;
    font-family: monospace;
}

.column-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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

.auto-size-btn {
    padding: 0.25rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    border-radius: 0.25rem;
}

.auto-size-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

.width-control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.width-input {
    width: 3rem;
    padding: 0.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    text-align: center;
}

.width-unit {
    font-size: 0.75rem;
    color: #6b7280;
}

/* Section des colonnes masquées */
.hidden-section {
    padding: 0.75rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.hidden-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin: 0 0 0.5rem 0;
}

.hidden-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 140px;
    overflow-y: auto;
}

.hidden-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.25rem;
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
    border-color: #374151;
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
