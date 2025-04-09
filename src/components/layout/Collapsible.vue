<!-- src/components/ui/Collapsible.vue -->
<template>
    <transition name="slide-fade">
        <div v-show="isOpen" class="overflow-hidden">
            <slot />
        </div>
    </transition>
</template>

<script lang="ts" setup>
defineProps<{
    isOpen: boolean
}>()
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    max-height: 0;
    opacity: 0;
}
</style>