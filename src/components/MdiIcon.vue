<template>
    <i :class="iconClasses" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        /** Nom MDI : `mdi-calendar-outline` ou `calendar-outline` */
        name: string
        size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    }>(),
    { size: 'md' }
)

const iconClasses = computed(() => {
    const mdiName = props.name.startsWith('mdi-') ? props.name : `mdi-${props.name}`
    const sizeClass = {
        xs: 'text-sm',
        sm: 'text-base',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl',
    }[props.size]

    return ['mdi', mdiName, 'inline-flex', 'leading-none', sizeClass]
})
</script>
