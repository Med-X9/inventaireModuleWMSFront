import { ref, computed, reactive, watch, nextTick } from 'vue'
import { logger } from '@/services/loggerService'

export interface EditingField {
    field: string
    type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'email' | 'url'
    required?: boolean
    validator?: (value: any) => boolean | string
    options?: Array<{ label: string; value: any; disabled?: boolean }>
    placeholder?: string
    min?: number
    max?: number
    pattern?: string
    step?: number
    rows?: number
    cols?: number
}

export interface EditingConfig {
    fields: EditingField[]
    validation?: Record<string, any>
    saveMode?: 'immediate' | 'batch'
    autoSave?: boolean
    autoSaveDelay?: number
    confirmBeforeSave?: boolean
    allowCancel?: boolean
    showValidationErrors?: boolean
    highlightChanges?: boolean
}

export interface EditingState {
    isEditing: boolean
    editingRow: any | null
    editingField: string | null
    originalValue: any
    currentValue: any
    validationErrors: Record<string, string>
    isSaving: boolean
    hasChanges: boolean
    pendingChanges: Array<{
        row: any
        field: string
        oldValue: any
        newValue: any
        timestamp: number
    }>
    batchMode: boolean
    selectedRows: Set<string>
}

export interface EditingEvents {
    onSave?: (changes: Array<{ row: any; field: string; oldValue: any; newValue: any }>) => Promise<void>
    onCancel?: () => void
    onValidationError?: (errors: Record<string, string>) => void
    onBeforeEdit?: (row: any, field: string) => boolean
    onAfterEdit?: (row: any, field: string, newValue: any) => void
}

/**
 * Composable pour l'édition avancée des données
 * Supporte l'édition inline, la validation en temps réel, et le mode batch
 */
export function useDataTableEditing(
    data: any[],
    fields: EditingField[],
    events?: EditingEvents
) {
    const state = reactive<EditingState>({
        isEditing: false,
        editingRow: null,
        editingField: null,
        originalValue: null,
        currentValue: null,
        validationErrors: {},
        isSaving: false,
        hasChanges: false,
        pendingChanges: [],
        batchMode: false,
        selectedRows: new Set()
    })

    // Configuration par défaut
    const config = reactive<EditingConfig>({
        fields,
        saveMode: 'immediate',
        autoSave: false,
        autoSaveDelay: 2000,
        confirmBeforeSave: true,
        allowCancel: true,
        showValidationErrors: true,
        highlightChanges: true
    })

    // Auto-save timer
    let autoSaveTimer: NodeJS.Timeout | null = null

    /**
     * Valide une valeur selon les règles du champ
     */
    const validateField = (field: string, value: any): string | null => {
        const fieldConfig = fields.find(f => f.field === field)
        if (!fieldConfig) return null

        // Validation required
        if (fieldConfig.required && (value === null || value === undefined || value === '')) {
            return 'Ce champ est requis'
        }

        // Validation min/max pour les nombres
        if (fieldConfig.type === 'number') {
            const numValue = Number(value)
            if (fieldConfig.min !== undefined && numValue < fieldConfig.min) {
                return `La valeur minimale est ${fieldConfig.min}`
            }
            if (fieldConfig.max !== undefined && numValue > fieldConfig.max) {
                return `La valeur maximale est ${fieldConfig.max}`
            }
        }

        // Validation pattern
        if (fieldConfig.pattern && typeof value === 'string') {
            const regex = new RegExp(fieldConfig.pattern)
            if (!regex.test(value)) {
                return 'Format invalide'
            }
        }

        // Validation personnalisée
        if (fieldConfig.validator) {
            const result = fieldConfig.validator(value)
            if (typeof result === 'string') {
                return result
            } else if (!result) {
                return 'Valeur invalide'
            }
        }

        return null
    }

    /**
     * Démarre l'édition d'une cellule
     */
    const startEditing = (row: any, field: string) => {
        // Vérifier si l'édition est autorisée
        if (events?.onBeforeEdit && !events.onBeforeEdit(row, field)) {
            return false
        }

        state.isEditing = true
        state.editingRow = row
        state.editingField = field
        state.originalValue = row[field]
        state.currentValue = row[field]
        state.validationErrors = {}

        logger.debug('Édition démarrée', { row, field, value: row[field] })
        return true
    }

    /**
     * Arrête l'édition
     */
    const stopEditing = async (save: boolean = true) => {
        if (!state.isEditing) return

        if (save) {
            await saveChanges()
        } else {
            // Restaurer la valeur originale
            if (state.editingRow && state.editingField) {
                state.editingRow[state.editingField] = state.originalValue
            }
        }

        // Réinitialiser l'état
        state.isEditing = false
        state.editingRow = null
        state.editingField = null
        state.originalValue = null
        state.currentValue = null
        state.validationErrors = {}

        logger.debug('Édition arrêtée', { save })
    }

    /**
     * Met à jour la valeur en cours d'édition
     */
    const updateEditingValue = (value: any) => {
        if (!state.isEditing) return

        state.currentValue = value
        state.hasChanges = value !== state.originalValue

        // Validation en temps réel
        if (state.editingField) {
            const error = validateField(state.editingField, value)
            if (error) {
                state.validationErrors[state.editingField] = error
            } else {
                delete state.validationErrors[state.editingField]
            }
        }

        // Auto-save si configuré
        if (config.autoSave && state.hasChanges) {
            scheduleAutoSave()
        }
    }

    /**
     * Sauvegarde les changements
     */
    const saveChanges = async () => {
        if (!state.isEditing || !state.editingRow || !state.editingField) return

        // Validation finale
        const error = validateField(state.editingField, state.currentValue)
        if (error) {
            state.validationErrors[state.editingField] = error
            events?.onValidationError?.(state.validationErrors)
            return false
        }

        // Vérifier s'il y a des changements
        if (!state.hasChanges) {
            logger.debug('Aucun changement à sauvegarder')
            return true
        }

        state.isSaving = true

        try {
            // Mettre à jour la valeur
            const oldValue = state.editingRow[state.editingField]
            state.editingRow[state.editingField] = state.currentValue

            // Ajouter aux changements en attente
            state.pendingChanges.push({
                row: state.editingRow,
                field: state.editingField,
                oldValue,
                newValue: state.currentValue,
                timestamp: Date.now()
            })

            // Appeler l'événement de sauvegarde
            if (events?.onSave) {
                await events.onSave([{
                    row: state.editingRow,
                    field: state.editingField,
                    oldValue,
                    newValue: state.currentValue
                }])
            }

            // Appeler l'événement après édition
            events?.onAfterEdit?.(state.editingRow, state.editingField, state.currentValue)

            state.hasChanges = false
            logger.success('Changements sauvegardés', {
                field: state.editingField,
                oldValue,
                newValue: state.currentValue
            })

            return true
        } catch (error) {
            // Restaurer la valeur en cas d'erreur
            state.editingRow[state.editingField] = state.originalValue
            logger.error('Erreur lors de la sauvegarde', error)
            return false
        } finally {
            state.isSaving = false
        }
    }

    /**
     * Active le mode batch
     */
    const enableBatchMode = () => {
        state.batchMode = true
        state.selectedRows.clear()
        logger.info('Mode batch activé')
    }

    /**
     * Désactive le mode batch
     */
    const disableBatchMode = () => {
        state.batchMode = false
        state.selectedRows.clear()
        state.pendingChanges = []
        logger.info('Mode batch désactivé')
    }

    /**
     * Sélectionne/désélectionne une ligne pour le mode batch
     */
    const toggleRowSelection = (rowId: string) => {
        if (state.selectedRows.has(rowId)) {
            state.selectedRows.delete(rowId)
        } else {
            state.selectedRows.add(rowId)
        }
    }

    /**
     * Sauvegarde tous les changements en attente
     */
    const saveAllPendingChanges = async () => {
        if (state.pendingChanges.length === 0) {
            logger.info('Aucun changement en attente')
            return
        }

        state.isSaving = true

        try {
            if (events?.onSave) {
                await events.onSave(state.pendingChanges)
            }

            state.pendingChanges = []
            logger.success('Tous les changements sauvegardés', {
                count: state.pendingChanges.length
            })
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde batch', error)
        } finally {
            state.isSaving = false
        }
    }

    /**
     * Annule tous les changements en attente
     */
    const discardAllPendingChanges = () => {
        // Restaurer toutes les valeurs originales
        state.pendingChanges.forEach(change => {
            change.row[change.field] = change.oldValue
        })

        state.pendingChanges = []
        state.selectedRows.clear()
        state.batchMode = false

        logger.info('Tous les changements annulés')
    }

    /**
     * Programme l'auto-save
     */
    const scheduleAutoSave = () => {
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer)
        }

        autoSaveTimer = setTimeout(() => {
            if (state.hasChanges && state.isEditing) {
                saveChanges()
            }
        }, config.autoSaveDelay)
    }

    /**
     * Vérifie si une ligne a des changements
     */
    const hasRowChanges = (row: any) => {
        return state.pendingChanges.some(change => change.row === row)
    }

    /**
     * Obtient les changements d'une ligne
     */
    const getRowChanges = (row: any) => {
        return state.pendingChanges.filter(change => change.row === row)
    }

    // Computed
    const canSave = computed(() => {
        return state.isEditing && state.hasChanges && Object.keys(state.validationErrors).length === 0
    })

    const hasPendingChanges = computed(() => {
        return state.pendingChanges.length > 0
    })

    const selectedRowsCount = computed(() => {
        return state.selectedRows.size
    })

    // Nettoyage
    const cleanup = () => {
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer)
        }
    }

    return {
        // État réactif
        state: computed(() => state),
        config: computed(() => config),

        // Computed
        canSave,
        hasPendingChanges,
        selectedRowsCount,

        // Méthodes d'édition
        startEditing,
        stopEditing,
        updateEditingValue,
        saveChanges,

        // Mode batch
        enableBatchMode,
        disableBatchMode,
        toggleRowSelection,
        saveAllPendingChanges,
        discardAllPendingChanges,

        // Utilitaires
        validateField,
        hasRowChanges,
        getRowChanges,
        cleanup
    }
}

