<template>
    <div class="relative inline-block" ref="tooltipContainer">
        <div @mouseenter="showTooltip" @mouseleave="hideTooltip" class="cursor-help">
            <slot />
        </div>

        <Teleport to="body">
            <div v-if="visible && text" ref="tooltipElement" :style="tooltipStyle"
                class="fixed z-50 px-2 py-1 text-xs text-card bg-primary rounded shadow-lg pointer-events-none max-w-xs break-words font-body">
                {{ text }}
                <div class="absolute w-2 h-2 bg-primary transform rotate-45" :class="arrowClass"></div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, Teleport } from 'vue'

interface Props {
    text?: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
}

const props = withDefaults(defineProps<Props>(), {
    position: 'top',
    delay: 500
})

const visible = ref(false)
const tooltipContainer = ref<HTMLElement>()
const tooltipElement = ref<HTMLElement>()
const tooltipStyle = ref<Record<string, string>>({})
let timeoutId: number | null = null

const arrowClass = computed(() => {
    switch (props.position) {
        case 'top':
            return '-bottom-1 left-1/2 transform -translate-x-1/2'
        case 'bottom':
            return '-top-1 left-1/2 transform -translate-x-1/2'
        case 'left':
            return '-right-1 top-1/2 transform -translate-y-1/2'
        case 'right':
            return '-left-1 top-1/2 transform -translate-y-1/2'
        default:
            return '-bottom-1 left-1/2 transform -translate-x-1/2'
    }
})

const showTooltip = () => {
    if (!props.text) return
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = window.setTimeout(async () => {
        visible.value = true
        await nextTick()
        positionTooltip()
    }, props.delay)
}

const hideTooltip = () => {
    if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
    }
    visible.value = false
}

const positionTooltip = () => {
    if (!tooltipContainer.value || !tooltipElement.value) return

    const containerRect = tooltipContainer.value.getBoundingClientRect()
    const tooltipRect = tooltipElement.value.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = 0
    let left = 0

    switch (props.position) {
        case 'top':
            top = containerRect.top - tooltipRect.height - 8
            left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2)
            break
        case 'bottom':
            top = containerRect.bottom + 8
            left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2)
            break
        case 'left':
            top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2)
            left = containerRect.left - tooltipRect.width - 8
            break
        case 'right':
            top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2)
            left = containerRect.right + 8
            break
    }

    if (left < 8) left = 8
    if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8
    }
    if (top < 8) top = 8
    if (top + tooltipRect.height > viewportHeight - 8) {
        top = viewportHeight - tooltipRect.height - 8
    }

    tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`
    }
}
</script>
<style scoped></style>
