<template>
    <div class="inventory-grid-demo">
        <!-- En-tête simple -->
        <div class="page-header">
            <h1 class="page-title">Saisie Inventaire</h1>
            <div class="header-actions">
                <button @click="loadSampleData" class="btn btn-secondary">
                    Données d'exemple
                </button>
                <button @click="importFile" class="btn btn-primary">
                    Importer CSV
                </button>
                <button @click="saveData" :disabled="!canSave" class="btn btn-success">
                    Sauvegarder
                </button>
            </div>
        </div>

        <!-- Statistiques simples -->
        <div class="stats-bar">
            <div class="stat">
                <span class="stat-value">{{ totalRows }}</span>
                <span class="stat-label">Lignes</span>
            </div>
            <div class="stat">
                <span class="stat-value">{{ validRows }}</span>
                <span class="stat-label">Valides</span>
            </div>
            <div class="stat">
                <span class="stat-value">{{ invalidRows }}</span>
                <span class="stat-label">Erreurs</span>
            </div>
            <div class="stat">
                <span class="stat-value">{{ totalQuantity }}</span>
                <span class="stat-label">Total</span>
            </div>
        </div>

        <!-- Grille Excel -->
        <ExcelGrid ref="excelGridRef" :initial-data="initialData" @row-validated="onRowValidated"
            @data-changed="onDataChanged" @export-requested="onExportRequested" />

        <!-- Actions rapides -->
        <div class="actions-bar">
            <button @click="addMultipleRows" class="action-btn">
                + 5 lignes
            </button>
            <button @click="validateAllData" class="action-btn">
                Valider tout
            </button>
            <button @click="clearAllData" class="action-btn danger">
                Vider
            </button>
        </div>

        <!-- Input caché -->
        <input ref="fileInput" type="file" accept=".csv" @change="handleFileImport" class="hidden" />

        <!-- Notifications simples -->
        <div v-if="notifications.length > 0" class="notifications">
            <div v-for="notification in notifications" :key="notification.id"
                :class="['notification', notification.type]">
                {{ notification.message }}
                <button @click="removeNotification(notification.id)" class="close">×</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ExcelGrid from '@/components/ExcelGrid/ExcelGrid.vue'
import { useExcelGrid, GridRow } from '@/composables/useExcelGrid'
import { alertService } from '@/services/alertService'

// Références
const excelGridRef = ref<InstanceType<typeof ExcelGrid>>()
const fileInput = ref<HTMLInputElement>()
const notifications = ref<Array<{ id: number; type: string; message: string }>>([])

// Données initiales
const initialData = ref<Partial<GridRow>[]>([])

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

// Méthodes
const loadSampleData = () => {
    const sampleData: Partial<GridRow>[] = [
        { emplacement: 'EMP-001', article: 'ART-001', quantite: 10 },
        { emplacement: 'EMP-002', article: 'ART-002', quantite: 25 },
        { emplacement: 'EMP-003', article: 'ART-003', quantite: 15 }
    ]

    excelGrid.loadData(sampleData)
    addNotification('success', 'Données d\'exemple chargées')
}

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
        addNotification('success', 'Données sauvegardées')
    }
}

const addMultipleRows = () => {
    for (let i = 0; i < 5; i++) {
        excelGrid.addRow()
    }
    addNotification('info', '5 lignes ajoutées')
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
        text: 'Vider la grille ?'
    })

    if (result.isConfirmed) {
        excelGrid.clearData()
        addNotification('success', 'Grille vidée')
    }
}

// Event handlers
const onRowValidated = (row: GridRow) => {
    addNotification('success', `${row.emplacement} validée`)
}

const onDataChanged = (data: GridRow[]) => {
    // Données modifiées
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
onMounted(() => {
    excelGrid.initialize()
})
</script>

<style scoped>
.inventory-grid-demo {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background-color: #FECD1C;
    border-color: #FECD1C;
    color: #1f2937;
}

.btn-primary:hover {
    background-color: #f59e0b;
}

.btn-secondary {
    background-color: #B4B6BA;
    border-color: #B4B6BA;
    color: white;
}

.btn-secondary:hover {
    background-color: #9ca3af;
}

.btn-success {
    background-color: #10b981;
    border-color: #10b981;
    color: white;
}

.btn-success:hover {
    background-color: #059669;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.stats-bar {
    display: flex;
    justify-content: space-around;
    background-color: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
}

.stat {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
}

.stat-label {
    font-size: 0.875rem;
    color: #6b7280;
}

.actions-bar {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
}

.action-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid #d1d5db;
    background-color: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background-color: #f3f4f6;
}

.action-btn.danger {
    border-color: #dc2626;
    color: #dc2626;
}

.action-btn.danger:hover {
    background-color: #fef2f2;
}

.hidden {
    display: none;
}

.notifications {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.notification {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid;
    background-color: white;
    color: #374151;
    font-size: 0.875rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    min-width: 200px;
}

.notification.success {
    border-color: #10b981;
    background-color: #ecfdf5;
    color: #065f46;
}

.notification.warning {
    border-color: #f59e0b;
    background-color: #fffbeb;
    color: #92400e;
}

.notification.error {
    border-color: #dc2626;
    background-color: #fef2f2;
    color: #991b1b;
}

.notification.info {
    border-color: #3b82f6;
    background-color: #eff6ff;
    color: #1e40af;
}

.close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    margin-left: 0.5rem;
}

.close:hover {
    color: #374151;
}

/* Responsive */
@media (max-width: 768px) {
    .inventory-grid-demo {
        padding: 1rem;
    }

    .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .header-actions {
        justify-content: space-between;
    }

    .stats-bar {
        flex-direction: column;
        gap: 1rem;
    }

    .actions-bar {
        flex-direction: column;
    }
}
</style>
