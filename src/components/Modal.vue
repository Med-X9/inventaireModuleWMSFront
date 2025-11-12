<!-- src/components/Modal.vue -->
<template>
    <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
        <div :class="containerClasses">
            <!-- Overlay semi-transparent -->
            <div class="fixed inset-0 transition-opacity" @click="close">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div :class="modalClasses" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <button type="button"
                    class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none z-10" @click="close"
                    aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div class="sm:flex mt-6 sm:items-start h-full">
                    <div class="mt-4 text-center sm:mt-0 sm:text-left w-full h-full flex flex-col">
                        <h3 v-if="title" class="text-lg leading-6 font-medium text-gray-900 mb-6 mt-2 flex-shrink-0"
                            id="modal-headline">
                            {{ title }}
                        </h3>
                        <div class="mt-2 flex-1 flex flex-col min-h-0">
                            <slot />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Cette modal expose :
 *  - Une prop `modelValue: boolean` pour le v-model.
 *  - Une prop optionnelle `title: string`.
 *  - Une prop optionnelle `size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'` pour la taille.
 *  - Elle émet `update:modelValue` quand on ferme (clic sur overlay).
 */
const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
}>(), {
    size: 'md'
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

function close() {
    // Quand on clique sur l'overlay, on ferme la modal
    emit('update:modelValue', false)
}

// Classes CSS dynamiques selon la taille
const modalClasses = computed(() => {
    const baseClasses = 'inline-block p-6 align-bottom panel rounded-lg text-left shadow-xl transform transition-all'

    switch (props.size) {
        case 'sm':
            return `${baseClasses} sm:my-8 sm:align-middle sm:max-w-sm max-w-sm w-full`
        case 'md':
            return `${baseClasses} sm:my-8 sm:align-middle sm:max-w-md max-w-md w-full`
        case 'lg':
            return `${baseClasses} sm:my-8 sm:align-middle sm:max-w-lg max-w-lg w-full`
        case 'xl':
            return `${baseClasses} sm:my-8 sm:align-middle sm:max-w-3xl max-w-3xl w-full`
        case 'fullscreen':
            return `${baseClasses} sm:my-0 sm:align-none sm:max-w-none max-w-none w-full h-full rounded-none p-0`
        default:
            return `${baseClasses} sm:my-8 sm:align-middle sm:max-w-md max-w-md w-full`
    }
})

// Classes CSS pour le container selon la taille
const containerClasses = computed(() => {
    if (props.size === 'fullscreen') {
        return 'flex items-stretch justify-center px-0 pt-0 pb-0 text-center sm:block sm:p-0 h-full'
    }
    return 'flex items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0'
})
</script>

<style scoped>
/* Styles spécifiques pour la modal fullscreen */
.panel {
    background: white;
}

/* Pour la modal fullscreen, on retire les marges et on prend tout l'écran */
@media (min-width: 640px) {
    .sm\:my-0 {
        margin-top: 0;
        margin-bottom: 0;
    }

    .sm\:align-none {
        align-items: stretch;
    }

    .sm\:max-w-none {
        max-width: none;
    }
}
</style>
