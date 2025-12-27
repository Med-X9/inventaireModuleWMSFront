<template>
    <div
        class="min-h-[320px] md:min-h-[360px] border-3 border-dashed rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 transition-all duration-400 relative overflow-hidden shadow-md flex-shrink-0"
        :class="{
            'border-primary bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 scale-[1.01] shadow-2xl shadow-primary-500/30 border-4': isDragging,
            'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg shadow-green-500/20': selectedFile && !isDragging && !isUploading,
            'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20': isUploading
        }"
        @dragover.prevent="(event) => emit('dragover', event)"
        @dragleave.prevent="(event) => emit('dragleave', event)"
        @drop.prevent="(event) => emit('drop', event)"
    >
        <div class="p-8 flex flex-col items-center justify-center h-full relative">
            <div class="relative mb-4">
                <div
                    class="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white transition-all duration-400 shadow-xl"
                    :class="{ 'scale-110 rotate-12': isDragging }"
                >
                    <IconUpload class="w-8 h-8 text-white" />
                </div>
                <div v-if="isUploading" class="absolute -top-2.5 -left-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)]">
                    <svg class="w-full h-full progress-ring" viewBox="0 0 120 120" style="transform: rotate(-90deg);">
                        <circle
                            class="progress-ring-circle"
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            :stroke="progressColor"
                            stroke-width="4"
                            stroke-dasharray="339.292"
                            stroke-dashoffset="339.292"
                        />
                    </svg>
                </div>
            </div>

            <!-- État sans fichier -->
            <div v-if="!selectedFile && !isUploading" class="text-center flex flex-col items-center gap-3">
                <h4 class="text-xl font-bold text-slate-900 dark:text-slate-100 m-0">
                    {{ emptyTitle }}
                </h4>
                <p class="text-base text-slate-600 dark:text-slate-400 m-0">
                    {{ emptyDescription }}
                </p>
                <button
                    @click="() => emit('browse-click')"
                    class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-dark hover:to-primary transition-all duration-200"
                >
                    <IconFolder class="w-4 h-4 text-white" />
                    {{ browseButtonLabel }}
                </button>
                <p class="text-sm text-slate-500 dark:text-slate-500 mt-4 m-0">
                    {{ acceptDescription }}
                </p>
            </div>

            <!-- État avec fichier sélectionné -->
            <div
                v-if="selectedFile && !isUploading"
                class="flex items-center gap-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-green-500 rounded-xl p-4 w-full max-w-2xl shadow-lg animate-[slideInFile_0.3s_ease-out]"
            >
                <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                    <IconFile class="w-6 h-6" />
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-base font-semibold text-slate-900 dark:text-slate-100 m-0 mb-1 truncate">
                        {{ selectedFile.name }}
                    </h4>
                    <p class="text-xs text-slate-600 dark:text-slate-400 m-0 mb-0.5">
                        {{ formatFileSize(selectedFile.size) }}
                    </p>
                    <p v-if="fileTypeLabel" class="text-xs text-slate-500 dark:text-slate-500 m-0">
                        {{ fileTypeLabel }}
                    </p>
                </div>
                <button
                    @click="() => emit('clear-file')"
                    class="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-100 hover:scale-110 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                    :disabled="isUploading"
                >
                    <IconX class="w-5 h-5" />
                </button>
            </div>

            <!-- État upload en cours -->
            <div v-if="isUploading" class="w-full max-w-2xl text-center">
                <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div
                        class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 shadow-lg"
                        :style="{ width: `${uploadProgress ?? 0}%` }"
                    />
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 m-0 flex items-center justify-center gap-2">
                    <IconLoader class="w-4 h-4 animate-spin" />
                    {{ uploadingLabel }} {{ uploadProgress ?? 0 }}%
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import IconUpload from '@/components/icon/icon-upload.vue';
import IconFolder from '@/components/icon/icon-folder.vue';
import IconFile from '@/components/icon/icon-file.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconLoader from '@/components/icon/icon-loader.vue';

interface Props {
    isDragging: boolean;
    isUploading: boolean;
    selectedFile: File | null;
    uploadProgress?: number;
    emptyTitle: string;
    emptyDescription: string;
    browseButtonLabel: string;
    acceptDescription: string;
    uploadingLabel: string;
    fileTypeLabel?: string;
    progressColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
    uploadProgress: 0,
    fileTypeLabel: '',
    progressColor: 'var(--color-info)',
});

const emit = defineEmits<{
    'browse-click': [];
    'clear-file': [];
    dragover: [event: DragEvent];
    dragleave: [event: DragEvent];
    drop: [event: DragEvent];
}>();

const formatFileSize = (size: number): string => {
    if (size < 1024) {
        return `${size} o`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} Ko`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};
</script>

<style scoped>
@keyframes slideInFile {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes progress-ring {
    0% {
        stroke-dashoffset: 339.292;
    }

    50% {
        stroke-dashoffset: 169.646;
    }

    100% {
        stroke-dashoffset: 0;
    }
}

.animate-\[slideInFile_0\.3s_ease-out\] {
    animation: slideInFile 0.3s ease-out;
}

.progress-ring-circle {
    animation: progress-ring 2s linear infinite;
}
</style>


