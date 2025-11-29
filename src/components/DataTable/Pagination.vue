<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="pagination">
        <div class="pagination-info">
            <span>
                {{ start }} - {{ end }} sur {{ total }} enregistrements
            </span>
        </div>
        <div class="pagination-controls">
            <button @click="goToPage(1)" :disabled="currentPage === 1" class="btn-pagination">«</button>
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="btn-pagination">‹</button>
            <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
                class="btn-pagination">›</button>
            <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages"
                class="btn-pagination">»</button>
        </div>
        <div class="page-size-selector">
            <label class="page-size-label">Afficher</label>
            <div class="custom-select-wrapper" ref="selectWrapperRef" @click="toggleDropdown" v-click-outside="closeDropdown">
                <div class="custom-select-trigger" :class="{ 'is-open': isOpen, 'is-focused': isFocused }">
                    <Transition name="value-change" mode="out-in">
                        <span :key="pageSize" class="select-value">{{ pageSize }}</span>
                    </Transition>
                    <svg class="select-arrow" :class="{ 'is-open': isOpen }" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <Teleport to="body">
                    <Transition name="dropdown">
                        <div v-if="isOpen" ref="dropdownRef" :style="dropdownStyle" class="custom-select-dropdown-fixed">
                            <div 
                                v-for="option in pageSizeOptions" 
                                :key="option"
                                class="select-option"
                                :class="{ 'is-selected': option === pageSize }"
                                @click="selectOption(option)"
                            >
                                <span>{{ option }}</span>
                                <svg v-if="option === pageSize" class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </Transition>
                </Teleport>
            </div>
            <span class="page-size-text">par page</span>
        </div>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
    currentPage: number
    totalPages: number
    total: number
    pageSize: number
    start: number
    end: number
}

interface Emits {
    (e: 'page-changed', page: number): void
    (e: 'page-size-changed', size: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Options de taille de page
const pageSizeOptions = [10, 20, 50, 100, 200, 500]

// État du dropdown
const isOpen = ref(false)
const isFocused = ref(false)

// Refs pour le positionnement
const selectWrapperRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

// Style calculé pour le dropdown en position fixed
const dropdownStyle = computed(() => {
    if (!selectWrapperRef.value || !isOpen.value) {
        return {}
    }
    
    const rect = selectWrapperRef.value.getBoundingClientRect()
    return {
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        minWidth: `${rect.width}px`
    }
})

// Directive pour fermer le dropdown quand on clique à l'extérieur
const vClickOutside = {
    mounted(el: any, binding: any) {
        el.clickOutsideEvent = (event: MouseEvent) => {
            if (!(el === event.target || el.contains(event.target as Node))) {
                binding.value()
            }
        }
        document.addEventListener('click', el.clickOutsideEvent)
    },
    unmounted(el: any) {
        if (el.clickOutsideEvent) {
            document.removeEventListener('click', el.clickOutsideEvent)
        }
    }
}

const toggleDropdown = async () => {
    isOpen.value = !isOpen.value
    isFocused.value = isOpen.value
    
    // Attendre que le DOM soit mis à jour pour calculer la position
    if (isOpen.value) {
        await nextTick()
        // Le style sera recalculé automatiquement via le computed
    }
}

const closeDropdown = () => {
    isOpen.value = false
    isFocused.value = false
}

const selectOption = (value: number) => {
    if (value !== props.pageSize) {
        emit('page-size-changed', value)
    }
    closeDropdown()
}

const goToPage = (page: number) => {
    emit('page-changed', page)
}

// Fermer le dropdown avec Escape
onMounted(() => {
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen.value) {
            closeDropdown()
        }
    }
    document.addEventListener('keydown', handleEscape)
    onUnmounted(() => {
        document.removeEventListener('keydown', handleEscape)
    })
})
</script>

<style scoped>
.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0.5rem;
    background-color: #ffffff;
    border-top: 1px solid #e9ecef;
    position: relative;
    z-index: 1;
}

.dark .pagination {
    background-color: #1a202c;
    border-color: #4a5568;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-pagination {
    padding: 0.5rem 0.75rem;
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
}

.dark .btn-pagination {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #f7fafc;
}

.btn-pagination:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
}

.dark .btn-pagination:hover:not(:disabled) {
    background-color: #374151;
    border-color: #6b7280;
}

.btn-pagination:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-info {
    margin: 0 1rem;
    font-size: 0.875rem;
    color: #6b7280;
}

.dark .page-info {
    color: #a0aec0;
}

.page-size-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    position: relative;
    z-index: 1002;
}

.page-size-label {
    color: #6b7280;
    font-weight: 500;
}

.dark .page-size-label {
    color: #a0aec0;
}

.custom-select-wrapper {
    position: relative;
    display: inline-block;
    z-index: 1003;
}

.custom-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    min-width: 80px;
    border: 1.5px solid #d1d5db;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.dark .custom-select-trigger {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    border-color: #4a5568;
}

.custom-select-trigger:hover {
    border-color: var(--color-primary);
    background: linear-gradient(135deg, #ffffff 0%, #fefce8 100%);
    box-shadow: 0 2px 4px 0 rgba(254, 205, 28, 0.1);
    transform: translateY(-1px);
}

.dark .custom-select-trigger:hover {
    background: linear-gradient(135deg, #374151 0%, #2d3748 100%);
    border-color: var(--color-primary);
    box-shadow: 0 2px 4px 0 rgba(254, 205, 28, 0.2);
}

.custom-select-trigger.is-focused {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #fefce8 100%);
}

.dark .custom-select-trigger.is-focused {
    background: linear-gradient(135deg, #374151 0%, #2d3748 100%);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.25);
}

.custom-select-trigger.is-open {
    border-color: var(--color-primary);
    box-shadow: 0 4px 6px -1px rgba(254, 205, 28, 0.2);
}

.select-value {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
}

.dark .select-value {
    color: #f7fafc;
}

.select-arrow {
    color: #6b7280;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
}

.dark .select-arrow {
    color: #a0aec0;
}

.select-arrow.is-open {
    transform: rotate(180deg);
    color: var(--color-primary);
}

.custom-select-trigger:hover .select-arrow {
    color: var(--color-primary);
}

.custom-select-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    z-index: 1004;
    min-width: 100px;
}

.dark .custom-select-dropdown {
    background: #1a202c;
    border-color: #4a5568;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

/* Dropdown en position fixed pour éviter les problèmes d'overflow */
.custom-select-dropdown-fixed {
    position: fixed;
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    z-index: 9999;
    min-width: 100px;
}

.dark .custom-select-dropdown-fixed {
    background: #1a202c;
    border-color: #4a5568;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
}

.dark .select-option {
    color: #f7fafc;
}

.select-option:hover {
    background: linear-gradient(90deg, #fefce8 0%, #fef3c7 100%);
    color: #374151;
}

.dark .select-option:hover {
    background: linear-gradient(90deg, #374151 0%, #4a5568 100%);
    color: #f7fafc;
}

.select-option.is-selected {
    background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: #ffffff;
    font-weight: 600;
}

.dark .select-option.is-selected {
    background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: #ffffff;
}

.select-option:first-child {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
}

.select-option:last-child {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
}

.check-icon {
    flex-shrink: 0;
    margin-left: 0.5rem;
}

/* Transitions pour le dropdown */
.dropdown-enter-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.dropdown-enter-to {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.dropdown-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.page-size-text {
    color: #6b7280;
    font-weight: 500;
}

.dark .page-size-text {
    color: #a0aec0;
}

/* Transition pour le changement de valeur */
.value-change-enter-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.value-change-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.value-change-enter-from {
    opacity: 0;
    transform: translateY(-5px) scale(0.9);
}

.value-change-enter-to {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.value-change-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.value-change-leave-to {
    opacity: 0;
    transform: translateY(5px) scale(0.9);
}
</style>
