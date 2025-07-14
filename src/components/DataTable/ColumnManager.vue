<template>
    <div class="column-manager">
        <!-- Header -->
        <div class="manager-header">
            <h3 class="manager-title">Gestion des colonnes</h3>
            <div class="header-actions">
                <button @click="resetColumns" class="btn-secondary">Réinitialiser</button>
                <button @click="autoSizeAll" class="btn-secondary">Auto-size</button>
                <button @click="$emit('close')" class="btn-close">×</button>
            </div>
        </div>

        <!-- Liste des colonnes -->
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
                <!-- Handle de drag -->
                <div class="drag-handle" v-if="column?.draggable !== false">
                    <IconDrag class="w-4 h-4 text-gray-400" />
                </div>

                <!-- Icône de la colonne -->
                <div class="column-icon" v-if="column?.icon && getIconComponent(column.icon)">
                    <component :is="getIconComponent(column.icon)" class="w-4 h-4" />
                </div>

                <!-- Informations de la colonne -->
                <div class="column-info">
                    <div class="column-name">
                        {{ column?.headerName || column?.field || 'Colonne inconnue' }}
                        <span v-if="column?.hide" class="hidden-indicator" title="Masquée par défaut">🔒</span>
                    </div>
                    <div class="column-field">{{ column?.field || 'field' }}</div>
                </div>

                <!-- Contrôles de la colonne -->
                <div class="column-controls">
                    <!-- Visibilité -->
                    <label class="visibility-toggle">
                        <input
                            type="checkbox"
                            :checked="isColumnVisible(column?.field || '')"
                            @change="toggleColumnVisibility(column?.field || '')"
                            :disabled="isColumnVisible(column?.field || '') && visibleColumnsData.length <= 4"
                        />
                        <span class="toggle-slider"></span>
                    </label>

                    <!-- Auto-size -->
                    <button
                        v-if="column?.autoSize !== false"
                        @click="autoSizeColumn(column?.field || '')"
                        class="auto-size-btn"
                        :title="'Auto-size ' + (column?.headerName || column?.field)"
                    >
                        <IconResize class="w-3 h-3" />
                    </button>

                    <!-- Largeur personnalisée -->
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

        <!-- Colonnes masquées -->
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
import { ref, computed } from 'vue'
import type { DataTableColumn } from '@/types/dataTable'
import IconDrag from '../icon/icon-drag.vue'
import IconResize from '../icon/icon-resize.vue'
import IconEye from '../icon/icon-eye.vue'

const props = defineProps<{
    columns: DataTableColumn[]
    visibleColumns: string[]
    columnWidths: Record<string, number>
}>()

const emit = defineEmits<{
    'columns-changed': [visibleColumns: string[], columnWidths: Record<string, number>]
    'reorder-columns': [fromIndex: number, toIndex: number]
    'close': []
}>()

const draggedIndex = ref<number | null>(null)
const columnsList = ref<HTMLElement | null>(null)

// Computed properties
const visibleColumnsData = computed(() => {
    const filtered = props.columns.filter(col => col?.field && props.visibleColumns.includes(col.field))
    console.log('🔍 Colonnes visibles dans le gestionnaire:', filtered.map(col => ({ field: col.field, headerName: col.headerName })))
    return filtered
})

const hiddenColumns = computed(() =>
    props.columns.filter(col => col?.field && !props.visibleColumns.includes(col.field) && col.hide !== true)
)

// Méthodes
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

const isColumnVisible = (field: string) => {
    if (!field) return false
    return props.visibleColumns.includes(field)
}

const toggleColumnVisibility = (field: string) => {
    if (!field) return

    const newVisibleColumns = [...props.visibleColumns]
    const index = newVisibleColumns.indexOf(field)

    if (index > -1) {
        // Empêcher de masquer la dernière colonne visible
        if (newVisibleColumns.length <= 1) {
            console.warn('Impossible de masquer la dernière colonne visible')
            return
        }
        newVisibleColumns.splice(index, 1)
    } else {
        newVisibleColumns.push(field)
    }

    emit('columns-changed', newVisibleColumns, props.columnWidths)
}

const showColumn = (field: string) => {
    if (!field) return

    const newVisibleColumns = [...props.visibleColumns, field]
    emit('columns-changed', newVisibleColumns, props.columnWidths)
}

const getColumnWidth = (field: string) => {
    if (!field) return 150
    return props.columnWidths[field] || 150
}

const setColumnWidth = (field: string, width: string) => {
    if (!field) return

    const newWidths = { ...props.columnWidths }
    newWidths[field] = parseInt(width) || 150
    emit('columns-changed', props.visibleColumns, newWidths)
}

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

    console.log(`Auto-sizing column "${field}": ${optimalWidth}px (header: "${headerText}")`)
    emit('columns-changed', props.visibleColumns, newWidths)
}

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
            console.log(`Auto-sizing column "${column.field}": ${optimalWidth}px (header: "${headerText}")`)
        }
    })

    emit('columns-changed', props.visibleColumns, newWidths)
}

const resetColumns = () => {
    const allFields = props.columns.map(col => col.field!)
    const defaultWidths: Record<string, number> = {}

    props.columns.forEach(column => {
        defaultWidths[column.field!] = column.width || 150
    })

    emit('columns-changed', allFields, defaultWidths)
}

// Drag & Drop
const onDragStart = (event: DragEvent, index: number) => {
    const column = visibleColumnsData.value[index]
    console.log('🔍 Début du drag:', {
        index,
        column: column?.field,
        draggable: column?.draggable,
        headerName: column?.headerName
    })
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

const onDragEnter = (event: DragEvent, index: number) => {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    if (target && draggedIndex.value !== null && draggedIndex.value !== index) {
        target.classList.add('drag-over')
    }
}

const onDragLeave = (event: DragEvent) => {
    const target = event.currentTarget as HTMLElement
    if (target) {
        target.classList.remove('drag-over')
    }
}

const onDrop = (event: DragEvent, index: number) => {
    event.preventDefault()

    // Retirer la classe visuelle
    const target = event.currentTarget as HTMLElement
    if (target) {
        target.classList.remove('drag-over')
    }

    if (draggedIndex.value !== null && draggedIndex.value !== index) {
        console.log('🔍 Drop effectué:', { from: draggedIndex.value, to: index })
        // Émettre l'événement de réordonnancement
        emit('reorder-columns', draggedIndex.value, index)
    }
}

const onDragEnd = () => {
    console.log('🔍 Fin du drag')
    // Retirer toutes les classes visuelles
    const items = document.querySelectorAll('.column-item')
    items.forEach(item => item.classList.remove('drag-over'))
    draggedIndex.value = null
}

const handleWidthInput = (field: string, event: Event) => {
    const target = event.target as HTMLInputElement
    const width = target.value
    setColumnWidth(field, width)
}
</script>

<style scoped>
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
