<!-- src/components/AffectationModal.vue -->
<template>
    <Modal
        v-model="isOpen"
        :title="modalTitle"
        :size="size"
        :hide-close-button="hideCloseButton"
        @update:model-value="handleClose"
    >
        <!-- Slot principal pour le contenu -->
        <slot />

        <!-- Boutons d'action si fournis -->
        <div v-if="showActionButtons" class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
                v-if="showCancelButton"
                variant="outline"
                color="gray"
                @click="handleCancel"
                :loading="cancelLoading"
            >
                {{ cancelText }}
            </Button>

            <Button
                v-if="showConfirmButton"
                :variant="confirmVariant"
                :color="buttonColor"
                @click="handleConfirm"
                :loading="confirmLoading"
                :disabled="confirmDisabled"
            >
                {{ confirmText }}
            </Button>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import Modal from '@/components/Modal.vue'
import Button from '@/components/Form/Button.vue'

// Props
const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
    hideCloseButton?: boolean

    // Boutons d'action
    showActionButtons?: boolean
    showCancelButton?: boolean
    showConfirmButton?: boolean
    cancelText?: string
    confirmText?: string
    confirmVariant?: 'solid' | 'outline' | 'ghost'
    confirmColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'

    // États de chargement
    cancelLoading?: boolean
    confirmLoading?: boolean
    confirmDisabled?: boolean
}>(), {
    size: 'lg',
    hideCloseButton: false,
    showActionButtons: true,
    showCancelButton: true,
    showConfirmButton: true,
    cancelText: 'Annuler',
    confirmText: 'Confirmer',
    confirmVariant: 'solid',
    confirmColor: 'primary',
    cancelLoading: false,
    confirmLoading: false,
    confirmDisabled: false
})

// Événements
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'confirm': []
    'cancel': []
    'close': []
}>()

// Computed
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const modalTitle = computed(() => props.title || 'Affectation')

// Mapper les couleurs du composant vers celles acceptées par Button
const buttonColor = computed(() => {
    switch (props.confirmColor) {
        case 'primary': return 'primary'
        case 'secondary': return 'gray'
        case 'success': return 'green'
        case 'warning': return 'yellow'
        case 'danger': return 'red'
        case 'info': return 'blue'
        default: return 'primary'
    }
})

// Handlers
const handleClose = () => {
    emit('close')
    emit('update:modelValue', false)
}

const handleCancel = () => {
    emit('cancel')
}

const handleConfirm = () => {
    emit('confirm')
}

// Watch pour les changements de modelValue
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        // Modal ouverte - logique d'initialisation si nécessaire
    } else {
        // Modal fermée - logique de nettoyage si nécessaire
    }
})
</script>

<style scoped>
/* Styles spécifiques pour les modals d'affectation si nécessaire */
</style>
