<template>
    <div class="flex flex-col h-full bg-gray-50">
        <!-- Informations du Job avec Barre de progression -->
        <div class="bg-gradient-to-r from-gray-50 to-white border-b border-gray-300 shadow-md">
            <div class="px-6 py-4">
                <!-- Informations du Job -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-2 h-2 rounded-full bg-primary"></div>
                            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Job</span>
                        </div>
                        <p class="text-lg font-bold text-gray-900 truncate">{{ jobInfo.reference || 'N/A' }}</p>
                    </div>

                    <div class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-2 h-2 rounded-full bg-info"></div>
                            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Inventaire</span>
                        </div>
                        <p class="text-lg font-bold text-gray-900 truncate">{{ jobInfo.inventoryReference || 'N/A' }}</p>
                    </div>

                    <div class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-2 h-2 rounded-full bg-warning"></div>
                            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Entrepôt</span>
                        </div>
                        <p class="text-lg font-bold text-gray-900 truncate">{{ jobInfo.warehouseName || 'N/A' }}</p>
                    </div>

                    <div class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-2 h-2 rounded-full" :class="getStatusDotClass(jobInfo.status)"></div>
                            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</span>
                        </div>
                        <span
                            class="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                            :class="getStatusClass(jobInfo.status)"
                        >
                            {{ formatStatus(jobInfo.status) || 'N/A' }}
                        </span>
                    </div>
                </div>

                <!-- Barre de progression -->
                <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-6">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-gray-600">Progression</span>
                                <div class="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                                    <span class="text-base font-bold text-gray-900">{{ filledRows }}</span>
                                    <span class="text-gray-400">/</span>
                                    <span class="text-base font-semibold text-gray-600">{{ totalRows }}</span>
                                    <span class="text-xs text-gray-500 ml-1">lignes</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-2xl font-bold" :class="getProgressTextClass()">
                                    {{ progressPercentage }}%
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg border border-primary-200">
                            <span class="text-sm font-medium text-gray-600">Total quantité:</span>
                            <span class="text-xl font-bold text-primary">{{ totalQuantity }}</span>
                        </div>
                    </div>

                    <!-- Barre de progression visuelle -->
                    <div class="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div
                            class="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                            :class="getProgressBarClass()"
                            :style="{ width: `${progressPercentage}%` }"
                        >
                            <!-- Effet de brillance animé -->
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            <!-- Texte du pourcentage dans la barre (si assez large) -->
                            <span
                                v-if="progressPercentage >= 15"
                                class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm"
                            >
                                {{ progressPercentage }}%
                            </span>
                        </div>
                        <!-- Texte du pourcentage à l'extérieur (si barre trop petite) -->
                        <span
                            v-if="progressPercentage < 15"
                            class="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-gray-700"
                        >
                            {{ progressPercentage }}%
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Barre d'outils style Excel -->
        <div class="bg-white border-b border-gray-300 shadow-sm">
            <div class="px-4 py-2 flex items-center justify-between">
                <h1 class="text-xl font-semibold text-gray-900">Saisie Inventaire</h1>
                <div class="flex items-center gap-1">
                    <!-- Groupe: Fichier -->
                    <div class="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
                        <button
                            @click="importFile"
                            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded text-sm text-gray-700 transition-colors"
                            title="Importer CSV"
                        >
                            <IconUpload class="w-4 h-4" />
                            <span class="hidden md:inline">Importer</span>
                        </button>
                        <button
                            @click="onExportRequested(excelGrid.getData())"
                            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded text-sm text-gray-700 transition-colors"
                            title="Exporter CSV"
                        >
                            <IconDownload class="w-4 h-4" />
                            <span class="hidden md:inline">Exporter</span>
                        </button>
                    </div>

                    <!-- Groupe: Édition -->
                    <div class="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
                        <button
                            @click="addEmptyRow"
                            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded text-sm text-gray-700 transition-colors"
                            title="Nouvelle ligne vide"
                        >
                            <IconPlus class="w-4 h-4" />
                            <span class="hidden md:inline">Ligne vide</span>
                        </button>
                        <button
                            @click="duplicateSelectedRow"
                            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded text-sm text-gray-700 transition-colors"
                            title="Dupliquer la ligne"
                        >
                            <IconCopy class="w-4 h-4" />
                            <span class="hidden md:inline">Dupliquer</span>
                        </button>
                        <button
                            @click="clearAllData"
                            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-error rounded text-sm transition-colors"
                            title="Vider la grille"
                        >
                            <IconTrash class="w-4 h-4" />
                            <span class="hidden md:inline">Vider</span>
                        </button>
                    </div>

                    <!-- Groupe: Validation -->
                    <div class="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
                        <button
                            @click="validateAllData"
                            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded text-sm text-gray-700 transition-colors"
                            title="Valider toutes les lignes"
                        >
                            <IconCheck class="w-4 h-4" />
                            <span class="hidden md:inline">Valider</span>
                        </button>
                    </div>

                    <!-- Groupe: Sauvegarde -->
                    <div class="flex items-center gap-1">
                        <button
                            @click="saveToLocalStorage"
                            :class="[
                                'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors',
                                hasUnsavedChanges
                                    ? 'bg-warning hover:bg-warning-dark text-gray-900'
                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            ]"
                            :disabled="!hasUnsavedChanges"
                            title="Auto-sauvegarde"
                        >
                            <IconSave class="w-4 h-4" />
                            <span class="hidden md:inline">Auto-sauvegarde</span>
                        </button>
                        <button
                            @click="saveData"
                            :disabled="!canSave"
                            class="flex items-center gap-1.5 px-3 py-1.5 bg-success hover:bg-success-dark text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Sauvegarder"
                        >
                            <IconSave class="w-4 h-4" />
                            <span class="hidden md:inline">Sauvegarder</span>
                        </button>
                        <button
                            @click="closeJob"
                            class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm transition-colors"
                            title="Fermer le job"
                        >
                            <IconX class="w-4 h-4" />
                            <span class="hidden md:inline">Fermer</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistiques compactes style Excel -->
        <div class="bg-white border-b border-gray-300 px-4 py-2 flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
                <span class="text-gray-600">Lignes:</span>
                <span class="font-semibold text-gray-900">{{ totalRows }}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-gray-600">Valides:</span>
                <span class="font-semibold text-success">{{ validRows }}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-gray-600">Erreurs:</span>
                <span class="font-semibold text-error">{{ invalidRows }}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-gray-600">Total:</span>
                <span class="font-semibold text-primary">{{ totalQuantity }}</span>
            </div>
            <div v-if="hasUnsavedChanges" class="ml-auto flex items-center gap-2 text-warning">
                <IconSave class="w-4 h-4 animate-pulse" />
                <span class="text-xs">Modifications non sauvegardées</span>
            </div>
        </div>

        <!-- Grille Excel -->
        <div class="flex-1 overflow-auto bg-white">
            <ExcelGrid
                ref="excelGridRef"
                :initial-data="initialData"
                :location-options="locationOptions"
                :article-options="articleOptions"
                :loading-locations="loadingLocations"
                :loading-articles="loadingArticles"
                @data-changed="onDataChanged"
                @export-requested="onExportRequested"
            />
        </div>

        <!-- Input caché -->
        <input
            ref="fileInput"
            type="file"
            accept=".csv"
            @change="handleFileImport"
            class="hidden"
        />

        <!-- Notifications -->
        <div
            v-if="notifications.length > 0"
            class="fixed top-4 right-4 z-50 flex flex-col gap-2"
        >
            <div
                v-for="notification in notifications"
                :key="notification.id"
                :class="[
                    'flex items-center justify-between px-4 py-3 rounded-lg shadow-lg min-w-[250px]',
                    notification.type === 'success' && 'bg-success-50 border border-success text-success-800',
                    notification.type === 'error' && 'bg-error-50 border border-error text-error-800',
                    notification.type === 'warning' && 'bg-warning-50 border border-warning text-warning-800',
                    notification.type === 'info' && 'bg-info-50 border border-info text-info-800'
                ]"
            >
                <span>{{ notification.message }}</span>
                <button
                    @click="removeNotification(notification.id)"
                    class="ml-3 text-gray-500 hover:text-gray-700"
                >
                    <IconX class="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import ExcelGrid from '@/components/ExcelGrid/ExcelGrid.vue'
import { useExcelGrid, GridRow } from '@/composables/useExcelGrid'
import { alertService } from '@/services/alertService'
import { LocationService } from '@/services/LocationService'
import { JobService } from '@/services/jobService'
import { useLocationStore } from '@/stores/location'
import { useJobStore } from '@/stores/job'
import { useAuthStore } from '@/stores/auth'
import type { Location } from '@/models/Location'
import type { SelectOption } from '@/interfaces/form'
import type { Job } from '@/models/Job'
import { useLocalStorage } from '@/utils/storage'

// Icônes
import IconSave from '@/components/icon/icon-save.vue'
import IconCopy from '@/components/icon/icon-copy.vue'
import IconPlus from '@/components/icon/icon-plus.vue'
import IconX from '@/components/icon/icon-x.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import IconDownload from '@/components/icon/icon-download.vue'
import IconUpload from '@/components/icon/icon-upload.vue'

// Clé pour la sauvegarde locale
const STORAGE_KEY = 'inventory_grid_demo_data'
const AUTO_SAVE_INTERVAL = 30000 // 30 secondes

// Route
const route = useRoute()

// Références
const excelGridRef = ref<InstanceType<typeof ExcelGrid>>()
const fileInput = ref<HTMLInputElement>()
const notifications = ref<Array<{ id: number; type: string; message: string }>>([])
const locationStore = useLocationStore()
const jobStore = useJobStore()
const authStore = useAuthStore()

// Informations du job
const jobInfo = ref<{
    reference?: string
    inventoryReference?: string
    warehouseName?: string
    status?: string
}>({})
const loadingJob = ref(false)

// État pour les options
const locationOptions = ref<SelectOption[]>([])
const articleOptions = ref<SelectOption[]>([])
const loadingLocations = ref(false)
const loadingArticles = ref(false)

// Données initiales avec sauvegarde locale
const savedData = useLocalStorage<Partial<GridRow>[]>(STORAGE_KEY, [])
const initialData = ref<Partial<GridRow>[]>(savedData.value || [])

// Utilisation du composable Excel Grid
const excelGrid = useExcelGrid({
    validateOnChange: true,
    allowDuplicates: false
})

// Computed properties
const totalRows = computed(() => excelGrid.gridData.value.length)
const validRows = computed(() => excelGrid.validRowsCount.value)
const invalidRows = computed(() => excelGrid.invalidRowsCount.value)
const totalQuantity = computed(() => excelGrid.totalQuantity.value)
const canSave = computed(() => excelGrid.canSave.value)
const hasUnsavedChanges = computed(() => excelGrid.isDirty.value)

// Lignes remplies (avec emplacement, article et quantité)
const filledRows = computed(() => {
    return excelGrid.gridData.value.filter(row =>
        row.emplacement &&
        row.article &&
        row.quantite !== null &&
        row.quantite !== undefined
    ).length
})

// Pourcentage de progression
const progressPercentage = computed(() => {
    if (totalRows.value === 0) return 0
    return Math.round((filledRows.value / totalRows.value) * 100)
})

// Classe pour le statut
const getStatusClass = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700'
    const statusLower = status.toLowerCase()
    if (statusLower.includes('termine') || statusLower.includes('cloture')) {
        return 'bg-success text-white'
    }
    if (statusLower.includes('en cours') || statusLower.includes('realisation') || statusLower.includes('valide')) {
        return 'bg-primary text-white'
    }
    if (statusLower.includes('attente') || statusLower.includes('preparation')) {
        return 'bg-warning text-gray-900'
    }
    return 'bg-gray-200 text-gray-700'
}

// Classe pour le point de statut
const getStatusDotClass = (status?: string) => {
    if (!status) return 'bg-gray-400'
    const statusLower = status.toLowerCase()
    if (statusLower.includes('termine') || statusLower.includes('cloture')) {
        return 'bg-success'
    }
    if (statusLower.includes('en cours') || statusLower.includes('realisation') || statusLower.includes('valide')) {
        return 'bg-primary'
    }
    if (statusLower.includes('attente') || statusLower.includes('preparation')) {
        return 'bg-warning'
    }
    return 'bg-gray-400'
}

// Formater le statut pour l'affichage
const formatStatus = (status?: string) => {
    if (!status) return 'N/A'
    // Convertir les underscores en espaces et mettre en forme
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Classe pour la barre de progression
const getProgressBarClass = () => {
    if (progressPercentage.value === 100) {
        return 'bg-gradient-to-r from-success to-success-dark'
    }
    if (progressPercentage.value >= 50) {
        return 'bg-gradient-to-r from-primary to-primary-dark'
    }
    return 'bg-gradient-to-r from-warning to-warning-dark'
}

// Classe pour le texte du pourcentage
const getProgressTextClass = () => {
    if (progressPercentage.value === 100) {
        return 'text-success'
    }
    if (progressPercentage.value >= 50) {
        return 'text-primary'
    }
    return 'text-warning'
}

// Notifications
const addNotification = (type: string, message: string) => {
    const id = Date.now()
    notifications.value.push({ id, type, message })
    setTimeout(() => removeNotification(id), 3000)
}

const removeNotification = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
        notifications.value.splice(index, 1)
    }
}

// Charger les informations du job
const loadJobInfo = async () => {
    loadingJob.value = true
    try {
        // Récupérer l'ID du job depuis les paramètres de route ou les query params
        const jobId = route.params.jobId || route.query.jobId

        if (jobId) {
            const job = await JobService.getById(Number(jobId))
            jobInfo.value = {
                reference: job.reference,
                inventoryReference: (job as any).inventory_reference || (job as any).inventory?.reference,
                warehouseName: (job as any).warehouse_name || (job as any).warehouse?.warehouse_name,
                status: job.status
            }
        } else {
            // Valeurs par défaut si pas de job ID
            jobInfo.value = {
                reference: 'DEMO-JOB-001',
                inventoryReference: 'INV-001',
                warehouseName: 'Entrepôt Principal',
                status: 'EN_REALISATION'
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des informations du job:', error)
        // Valeurs par défaut en cas d'erreur
        jobInfo.value = {
            reference: 'DEMO-JOB-001',
            inventoryReference: 'INV-001',
            warehouseName: 'Entrepôt Principal',
            status: 'EN_REALISATION'
        }
    } finally {
        loadingJob.value = false
    }
}

// Charger les emplacements automatiquement
const loadLocations = async () => {
    loadingLocations.value = true
    try {
        const response = await LocationService.getAll({ page_size: 1000 })
        const locations = response.data.results || []

        locationOptions.value = locations.map((loc: Location) => ({
            label: `${loc.location_reference} - ${loc.reference}`,
            value: loc.location_reference || loc.reference
        }))

        addNotification('success', `${locationOptions.value.length} emplacements chargés`)
    } catch (error) {
        console.error('Erreur lors du chargement des emplacements:', error)
        addNotification('error', 'Erreur lors du chargement des emplacements')
    } finally {
        loadingLocations.value = false
    }
}

// Charger les articles (mock pour l'instant - à adapter selon votre API)
const loadArticles = async () => {
    loadingArticles.value = true
    try {
        // TODO: Remplacer par un vrai appel API pour les articles
        const mockArticles: SelectOption[] = [
            { label: 'ART-001 - Article Test 1', value: 'ART-001' },
            { label: 'ART-002 - Article Test 2', value: 'ART-002' },
            { label: 'ART-003 - Article Test 3', value: 'ART-003' },
            { label: 'ART-004 - Article Test 4', value: 'ART-004' },
            { label: 'ART-005 - Article Test 5', value: 'ART-005' },
        ]

        articleOptions.value = mockArticles
        addNotification('info', `${articleOptions.value.length} articles disponibles`)
    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error)
        addNotification('error', 'Erreur lors du chargement des articles')
    } finally {
        loadingArticles.value = false
    }
}

// Sauvegarder dans localStorage
const saveToLocalStorage = () => {
    try {
        const data = excelGrid.getData()
        const dataToSave = data.map(row => ({
            emplacement: row.emplacement,
            article: row.article,
            quantite: row.quantite
        }))
        savedData.value = dataToSave
        addNotification('success', 'Données sauvegardées localement')
    } catch (error) {
        console.error('Erreur lors de la sauvegarde locale:', error)
        addNotification('error', 'Erreur lors de la sauvegarde locale')
    }
}

// Auto-sauvegarde périodique
let autoSaveInterval: ReturnType<typeof setInterval> | null = null

const startAutoSave = () => {
    if (autoSaveInterval) return

    autoSaveInterval = setInterval(() => {
        if (hasUnsavedChanges.value) {
            saveToLocalStorage()
        }
    }, AUTO_SAVE_INTERVAL)
}

const stopAutoSave = () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval)
        autoSaveInterval = null
    }
}

// Watcher pour sauvegarder automatiquement lors des changements
watch(() => excelGrid.gridData.value, () => {
    if (hasUnsavedChanges.value) {
        setTimeout(() => {
            saveToLocalStorage()
        }, 2000)
    }
}, { deep: true })

// Méthodes
const importFile = () => {
    fileInput.value?.click()
}

const handleFileImport = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file && file.type === 'text/csv') {
        const reader = new FileReader()
        reader.onload = (e) => {
            const csvContent = e.target?.result as string
            excelGrid.importFromCsv(csvContent)
            addNotification('success', 'Fichier importé')
        }
        reader.readAsText(file)
    } else {
        addNotification('error', 'Fichier CSV requis')
    }

    target.value = ''
}

const saveData = async () => {
    const success = await excelGrid.save()
    if (success) {
        saveToLocalStorage()
        addNotification('success', 'Données sauvegardées')
    }
}

const addEmptyRow = () => {
    excelGrid.addRow()
    addNotification('info', 'Nouvelle ligne vide ajoutée')
}

const duplicateSelectedRow = () => {
    const data = excelGrid.getData()
    if (data.length > 0) {
        const lastRow = data[data.length - 1]
        excelGrid.addRow({
            emplacement: lastRow.emplacement,
            article: lastRow.article,
            quantite: lastRow.quantite
        })
        addNotification('info', 'Ligne dupliquée')
    } else {
        addNotification('warning', 'Aucune ligne à dupliquer')
    }
}

const validateAllData = () => {
    const isValid = excelGrid.validateAllCells()
    if (isValid) {
        addNotification('success', 'Tout est valide')
    } else {
        addNotification('warning', `${invalidRows.value} erreurs`)
    }
}

const clearAllData = async () => {
    const result = await alertService.confirm({
        title: 'Confirmer',
        text: 'Vider la grille ? Les données seront perdues.'
    })

    if (result.isConfirmed) {
        excelGrid.clearData()
        savedData.value = []
        addNotification('success', 'Grille vidée')
    }
}

// Fermer le job
const closeJob = async () => {
    if (hasUnsavedChanges.value) {
        const result = await alertService.confirm({
            title: 'Modifications non sauvegardées',
            text: 'Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de fermer ?'
        })

        if (result.isConfirmed) {
            await saveData()
        }
    }

    // TODO: Implémenter la logique de fermeture du job
    addNotification('info', 'Job fermé')
    // Exemple: router.push('/inventory')
}

// Event handlers
const onDataChanged = (data: GridRow[]) => {
    // Les données sont automatiquement sauvegardées via le watcher
}

const onExportRequested = (data: GridRow[]) => {
    const csvContent = excelGrid.exportToCsv()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `inventaire_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        addNotification('success', 'Données exportées')
    }
}

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadJobInfo(),
        loadLocations(),
        loadArticles()
    ])

    if (initialData.value.length > 0) {
        excelGrid.loadData(initialData.value)
        addNotification('info', 'Données restaurées depuis la sauvegarde locale')
    } else {
        excelGrid.initialize()
    }

    startAutoSave()
    window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
    stopAutoSave()
    window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Gestion de l'avertissement avant de quitter
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
        e.preventDefault()
        e.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?'
        return e.returnValue
    }
}
</script>
