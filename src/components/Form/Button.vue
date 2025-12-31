<template>
    <button
        :class="buttonClasses"
        :disabled="disabled || loading"
        @click="handleClick"
        v-bind="$attrs"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    variant?: 'solid' | 'outline' | 'ghost'
    color?: 'primary' | 'gray' | 'red' | 'green' | 'blue' | 'yellow'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'solid',
    color: 'primary',
    size: 'md'
})

const emit = defineEmits<{
    click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
    const classes: string[] = [
        'inline-flex items-center justify-center',
        'font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed'
    ]

    // Size classes
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    }
    classes.push(sizeClasses[props.size])

    // Variant and color classes
    const variant = props.variant
    const color = props.color

    if (variant === 'solid') {
        if (color === 'primary') {
            classes.push('bg-primary text-white hover:bg-primary-dark focus:ring-primary')
        } else if (color === 'gray') {
            classes.push('bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500')
        } else if (color === 'red') {
            classes.push('bg-red-600 text-white hover:bg-red-700 focus:ring-red-500')
        } else if (color === 'green') {
            classes.push('bg-green-600 text-white hover:bg-green-700 focus:ring-green-500')
        } else if (color === 'blue') {
            classes.push('bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500')
        } else if (color === 'yellow') {
            classes.push('bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500')
        } else {
            classes.push('bg-primary text-white hover:bg-primary-dark focus:ring-primary')
        }
    } else if (variant === 'outline') {
        if (color === 'primary') {
            classes.push('border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary')
        } else if (color === 'gray') {
            classes.push('border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500')
        } else if (color === 'red') {
            classes.push('border-2 border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500')
        } else if (color === 'green') {
            classes.push('border-2 border-green-300 text-green-700 hover:bg-green-50 focus:ring-green-500')
        } else if (color === 'blue') {
            classes.push('border-2 border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500')
        } else if (color === 'yellow') {
            classes.push('border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 focus:ring-yellow-500')
        } else {
            classes.push('border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary')
        }
    } else if (variant === 'ghost') {
        if (color === 'primary') {
            classes.push('text-primary hover:bg-primary hover:text-white focus:ring-primary')
        } else if (color === 'gray') {
            classes.push('text-gray-600 hover:bg-gray-100 focus:ring-gray-500')
        } else if (color === 'red') {
            classes.push('text-red-600 hover:bg-red-100 focus:ring-red-500')
        } else if (color === 'green') {
            classes.push('text-green-600 hover:bg-green-100 focus:ring-green-500')
        } else if (color === 'blue') {
            classes.push('text-blue-600 hover:bg-blue-100 focus:ring-blue-500')
        } else if (color === 'yellow') {
            classes.push('text-yellow-600 hover:bg-yellow-100 focus:ring-yellow-500')
        } else {
            classes.push('text-primary hover:bg-primary hover:text-white focus:ring-primary')
        }
    }

    // Cursor
    if (props.disabled || props.loading) {
        classes.push('cursor-not-allowed')
    } else {
        classes.push('cursor-pointer')
    }

    return classes.join(' ')
})

function handleClick(event: MouseEvent) {
    if (props.disabled || props.loading) {
        return
    }
    emit('click', event)
}
</script>
