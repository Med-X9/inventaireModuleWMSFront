<template>
    <div class="min-h-screen bg-app dark:bg-bg-dark">
        <Container max-width="5xl" class="py-6">
            <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
                    <div class="min-w-0">
                        <h1 class="text-2xl sm:text-3xl font-bold text-text dark:text-white m-0">
                            Import stock théorique
                        </h1>
                        <p class="text-sm text-muted m-0 mt-1">
                            Inventaire {{ inventoryReference }}
                            <span class="mx-2 text-border">·</span>
                            Magasin {{ warehouseReference }}
                        </p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" :disabled="loading" @click="refreshStatus">
                            <MdiIcon name="mdi-refresh" size="sm" class="mr-1" :class="{ 'animate-spin': loading }" />
                            Actualiser
                        </Button>
                        <Button variant="secondary" size="sm" @click="goBack">
                            <MdiIcon name="mdi-arrow-left" size="sm" class="mr-1" />
                            Retour
                        </Button>
                    </div>
                </div>
            </Card>

            <Alert
                v-if="error"
                type="error"
                title="Erreur"
                :message="error"
                class="mb-6"
            />

            <div v-if="loading && !importTask" class="flex justify-center py-16">
                <p class="text-muted">Chargement...</p>
            </div>

            <template v-else>
                <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden p-6">
                    <h2 class="text-lg font-semibold text-text m-0 mb-2">Fichier Excel</h2>
                    <p class="text-sm text-muted mb-4">
                        Colonnes attendues : <strong>article</strong>, <strong>quantite</strong>
                        (emplacement optionnel). Formats .xlsx / .xls.
                    </p>

                    <FileInputUpload
                        :is-dragging="isDragging"
                        :is-uploading="uploading"
                        :selected-file="selectedFile"
                        :upload-progress="uploadProgress"
                        uploading-label="Import en cours..."
                        empty-title="Glissez-déposez votre fichier Excel ici"
                        empty-description="ou"
                        browse-button-label="Parcourir les fichiers"
                        accept-description="Formats acceptés : .xlsx, .xls"
                        :file-type-label="selectedFile ? selectedFile.name.split('.').pop()?.toUpperCase() || '' : ''"
                        @browse-click="() => fileInput?.click()"
                        @dragover="handleDragOver"
                        @dragleave="handleDragLeave"
                        @drop="handleDrop"
                        @clear-file="selectedFile = null"
                    />
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        class="hidden"
                        @change="onFileSelected"
                    />

                    <div class="flex justify-end mt-4">
                        <Button
                            variant="primary"
                            :disabled="!selectedFile || uploading || !inventoryId || !warehouseId"
                            @click="uploadFile"
                        >
                            <MdiIcon name="mdi-upload-outline" size="sm" class="mr-1" />
                            Lancer l'import
                        </Button>
                    </div>
                </Card>

                <Card v-if="importTask" class="shadow-sm border-0 rounded-xl overflow-hidden p-6">
                    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h2 class="text-lg font-semibold text-text m-0">Statut de l'import</h2>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase" :class="statusBadgeClass">
                            {{ statusLabel }}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="rounded-xl border border-border p-4">
                            <p class="text-xs text-muted m-0 mb-1">Fichier</p>
                            <p class="text-sm font-semibold text-text m-0 truncate">{{ importTask.file_name || '—' }}</p>
                        </div>
                        <div class="rounded-xl border border-border p-4">
                            <p class="text-xs text-muted m-0 mb-1">Lignes</p>
                            <p class="text-sm font-semibold text-text m-0">{{ importTask.total_rows ?? 0 }}</p>
                        </div>
                        <div class="rounded-xl border border-border p-4">
                            <p class="text-xs text-muted m-0 mb-1">Importées</p>
                            <p class="text-sm font-semibold text-text m-0">{{ importTask.imported_count ?? 0 }}</p>
                        </div>
                        <div class="rounded-xl border border-border p-4">
                            <p class="text-xs text-muted m-0 mb-1">Erreurs</p>
                            <p class="text-sm font-semibold text-text m-0">{{ importTask.error_count ?? 0 }}</p>
                        </div>
                    </div>

                    <div v-if="isProcessing" class="mb-6">
                        <div class="flex justify-between text-xs text-muted mb-1">
                            <span>Progression</span>
                            <span>{{ progressPercent }}%</span>
                        </div>
                        <div class="w-full h-2 rounded-full bg-hover overflow-hidden">
                            <div
                                class="h-full bg-primary transition-all duration-300"
                                :style="{ width: `${progressPercent}%` }"
                            />
                        </div>
                    </div>

                    <Alert
                        v-if="importTask.error_message"
                        :type="importTask.status === 'COMPLETED' ? 'info' : 'error'"
                        :title="importTask.status === 'COMPLETED' ? 'Message' : 'Erreur'"
                        :message="importTask.error_message"
                        class="mb-4"
                    />

                    <div v-if="importTask.errors?.length" class="space-y-2 max-h-64 overflow-y-auto">
                        <div
                            v-for="(errItem, idx) in importTask.errors"
                            :key="idx"
                            class="text-sm rounded-lg border border-border p-3"
                        >
                            <span class="font-semibold">Ligne {{ errItem.row ?? '?' }}</span>
                            — {{ errItem.message }}
                        </div>
                    </div>

                    <div v-if="importTask.status === 'COMPLETED'" class="flex justify-end mt-4">
                        <Button variant="primary" size="sm" @click="goToStockGaps">
                            Voir les écarts stock
                        </Button>
                    </div>
                </Card>
            </template>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, Button, Container, Alert } from '@SMATCH-Digital-dev/vue-system-design'
import FileInputUpload from '@/components/Upload/FileInputUpload.vue'
import MdiIcon from '@/components/MdiIcon.vue'
import { useTheoreticalStockImport } from '@/composables/useTheoreticalStockImport'

interface Props {
    reference: string
    warehouse: string
}

const props = defineProps<Props>()

const inventoryReference = props.reference
const warehouseReference = props.warehouse
const fileInput = ref<HTMLInputElement | null>(null)

const {
    inventoryId,
    warehouseId,
    loading,
    uploading,
    error,
    importTask,
    selectedFile,
    isDragging,
    uploadProgress,
    isProcessing,
    statusLabel,
    statusBadgeClass,
    progressPercent,
    initialize,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    uploadFile,
    refreshStatus,
    goBack,
    goToStockGaps,
} = useTheoreticalStockImport(inventoryReference, warehouseReference)

const onFileSelected = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) selectedFile.value = file
    input.value = ''
}

onMounted(() => {
    void initialize()
})
</script>
