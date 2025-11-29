<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-text-dark bg-opacity-50">
        <div class="bg-card dark:bg-bg-dark rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-border dark:border-border-dark">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-error-light dark:bg-error-800 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-error dark:text-error-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold font-heading text-text-dark dark:text-text">
                            {{ title }}
                        </h3>
                        <p class="text-sm text-text-muted dark:text-text-light">
                            {{ subtitle }}
                        </p>
                    </div>
                </div>
                <button @click="close" class="text-text-muted hover:text-text-dark dark:hover:text-text transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <div class="p-6">
                <!-- Message principal -->
                <div class="mb-4">
                    <p class="text-text-dark dark:text-text font-body">{{ message }}</p>
                </div>

                <!-- Erreurs de validation -->
                <div v-if="errors && errors.length > 0" class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-error rounded-full"></div>
                        <span class="text-sm font-medium text-text-dark dark:text-text font-body">
                            Erreurs de validation :
                        </span>
                    </div>

                    <div class="space-y-2">
                        <div v-for="(error, index) in errors" :key="index"
                             class="flex items-start gap-3 p-3 bg-alert-error dark:bg-error-800 rounded-lg border border-error dark:border-error-700">
                            <div class="w-1.5 h-1.5 bg-error rounded-full mt-2 flex-shrink-0"></div>
                            <p class="text-sm text-error-dark dark:text-error-200 font-body">{{ error }}</p>
                        </div>
                    </div>
                </div>

                <!-- Informations -->
                <div v-if="infos && infos.length > 0" class="mt-4 space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-info rounded-full"></div>
                        <span class="text-sm font-medium text-text-dark dark:text-text font-body">
                            Informations :
                        </span>
                    </div>

                    <div class="space-y-2">
                        <div v-for="(info, index) in infos" :key="index"
                             class="flex items-start gap-3 p-3 bg-info-50 dark:bg-info-800 rounded-lg border border-info dark:border-info-700">
                            <div class="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></div>
                            <p class="text-sm text-info-dark dark:text-info-200 font-body">{{ info }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-3 p-6 border-t border-border dark:border-border-dark">
                <button @click="close"
                        class="px-4 py-2 text-sm font-medium text-text-dark dark:text-text bg-card dark:bg-bg-dark border border-border dark:border-border-dark rounded-lg hover:bg-hover dark:hover:bg-bg-dark transition-colors font-body">
                    Fermer
                </button>
                <button v-if="onRetry" @click="retry"
                        class="px-4 py-2 text-sm font-medium text-card bg-error border border-transparent rounded-lg hover:bg-error-dark transition-colors font-body">
                    Réessayer
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
    show: boolean;
    title?: string;
    subtitle?: string;
    message: string;
    errors?: readonly string[];
    infos?: readonly string[];
    onRetry?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Erreur de validation',
    subtitle: 'Des problèmes ont été détectés',
    errors: () => [],
    infos: () => []
});

const emit = defineEmits<{
    close: [];
}>();

const close = () => {
    emit('close');
};

const retry = () => {
    if (props.onRetry) {
        props.onRetry();
    }
    close();
};

// Fermer avec la touche Escape
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        close();
    }
};

watch(() => props.show, (show) => {
    if (show) {
        document.addEventListener('keydown', handleKeydown);
    } else {
        document.removeEventListener('keydown', handleKeydown);
    }
});
</script>

<style scoped>
/* Animation d'entrée/sortie */
.fixed {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
