<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {{ title }}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ subtitle }}
                        </p>
                    </div>
                </div>
                <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <div class="p-6">
                <!-- Message principal -->
                <div class="mb-4">
                    <p class="text-gray-700 dark:text-gray-300">{{ message }}</p>
                </div>

                <!-- Erreurs de validation -->
                <div v-if="errors && errors.length > 0" class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Erreurs de validation :
                        </span>
                    </div>

                    <div class="space-y-2">
                        <div v-for="(error, index) in errors" :key="index"
                             class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                            <div class="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
                        </div>
                    </div>
                </div>

                <!-- Informations -->
                <div v-if="infos && infos.length > 0" class="mt-4 space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Informations :
                        </span>
                    </div>

                    <div class="space-y-2">
                        <div v-for="(info, index) in infos" :key="index"
                             class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div class="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p class="text-sm text-blue-700 dark:text-blue-300">{{ info }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button @click="close"
                        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    Fermer
                </button>
                <button v-if="onRetry" @click="retry"
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors">
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
