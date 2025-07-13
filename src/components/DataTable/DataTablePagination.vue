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
            <label>Afficher</label>
            <select :value="pageSize" @change="onPageSizeChange">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
            <span>par page</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    currentPage: number
    totalPages: number
    total: number
    pageSize: number
    start: number
    end: number
}

interface Emits {
    (e: 'go-to-page', page: number): void
    (e: 'change-page-size', size: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const goToPage = (page: number) => {
    emit('go-to-page', page)
}

const onPageSizeChange = (event: Event) => {
    const value = Number((event.target as HTMLSelectElement).value)
    emit('change-page-size', value)
}
</script>

<style scoped>
.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #ffffff;
    border-top: 1px solid #e9ecef;
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
}

.page-size-selector select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background-color: #ffffff;
}

.dark .page-size-selector select {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #f7fafc;
}
</style>
