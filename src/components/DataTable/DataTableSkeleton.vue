<template>
    <div class="data-table-skeleton">
        <!-- Header skeleton -->
        <div class="skeleton-header">
            <div class="skeleton-search">
                <div class="skeleton-search-input"></div>
            </div>
            <div class="skeleton-actions">
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
            </div>
        </div>

        <!-- Table skeleton -->
        <div class="skeleton-table">
            <!-- Header row -->
            <div class="skeleton-header-row">
                <div v-for="i in columnsCount" :key="`header-${i}`" class="skeleton-header-cell"></div>
                <div v-if="showActions" class="skeleton-header-cell skeleton-actions-header"></div>
            </div>

            <!-- Data rows -->
            <div v-for="rowIndex in rowsCount" :key="`row-${rowIndex}`" class="skeleton-data-row">
                <div v-for="colIndex in columnsCount" :key="`cell-${rowIndex}-${colIndex}`" class="skeleton-data-cell">
                    <div class="skeleton-text"></div>
                </div>
                <div v-if="showActions" class="skeleton-data-cell skeleton-actions-cell">
                    <div class="skeleton-action-button"></div>
                </div>
            </div>
        </div>

        <!-- Pagination skeleton -->
        <div class="skeleton-pagination">
            <div class="skeleton-pagination-info"></div>
            <div class="skeleton-pagination-controls">
                <div class="skeleton-pagination-button"></div>
                <div class="skeleton-pagination-button"></div>
                <div class="skeleton-pagination-info-text"></div>
                <div class="skeleton-pagination-button"></div>
                <div class="skeleton-pagination-button"></div>
            </div>
            <div class="skeleton-page-size"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    columnsCount?: number
    rowsCount?: number
    showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    columnsCount: 5,
    rowsCount: 10,
    showActions: true
})
</script>

<style scoped>
.data-table-skeleton {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    overflow: hidden;
}

.dark .data-table-skeleton {
    background-color: #1a202c;
    border-color: #4a5568;
}

/* Header skeleton */
.skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.dark .skeleton-header {
    background-color: #2d3748;
    border-color: #4a5568;
}

.skeleton-search {
    flex: 1;
    max-width: 400px;
}

.skeleton-search-input {
    height: 2.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.5rem;
}

.dark .skeleton-search-input {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-actions {
    display: flex;
    gap: 0.5rem;
}

.skeleton-button {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.375rem;
}

.dark .skeleton-button {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

/* Table skeleton */
.skeleton-table {
    overflow-x: auto;
}

.skeleton-header-row {
    display: flex;
    background-color: #f9fafb;
    border-bottom: 1px solid #f3f4f6;
}

.dark .skeleton-header-row {
    background-color: #2d3748;
    border-color: #4a5568;
}

.skeleton-header-cell {
    flex: 1;
    padding: 0.75rem;
    min-width: 120px;
}

.skeleton-header-cell::before {
    content: '';
    display: block;
    height: 1rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-header-cell::before {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-actions-header {
    flex: 0 0 120px;
    min-width: 120px;
}

.skeleton-data-row {
    display: flex;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;
}

.dark .skeleton-data-row {
    border-color: #4a5568;
}

.skeleton-data-row:hover {
    background-color: #f9fafb;
}

.dark .skeleton-data-row:hover {
    background-color: #374151;
}

.skeleton-data-cell {
    flex: 1;
    padding: 0.75rem;
    min-width: 120px;
    display: flex;
    align-items: center;
}

.skeleton-text {
    height: 1rem;
    width: 80%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-text {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-actions-cell {
    flex: 0 0 120px;
    min-width: 120px;
    justify-content: center;
}

.skeleton-action-button {
    width: 2rem;
    height: 2rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-action-button {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

/* Pagination skeleton */
.skeleton-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #ffffff;
    border-top: 1px solid #e9ecef;
}

.dark .skeleton-pagination {
    background-color: #1a202c;
    border-color: #4a5568;
}

.skeleton-pagination-info {
    height: 1rem;
    width: 150px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-pagination-info {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.skeleton-pagination-button {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.375rem;
}

.dark .skeleton-pagination-button {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-pagination-info-text {
    height: 1rem;
    width: 100px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-pagination-info-text {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

.skeleton-page-size {
    height: 1rem;
    width: 120px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
}

.dark .skeleton-page-size {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

/* Animation shimmer */
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .skeleton-header {
        flex-direction: column;
        gap: 1rem;
    }

    .skeleton-search {
        max-width: none;
        width: 100%;
    }

    .skeleton-pagination {
        flex-direction: column;
        gap: 1rem;
    }
}
</style>
