<!-- Dialog d'affectation / réaffectation de job - utilise Dialog du package SMATCH -->
<template>
    <Dialog
        :model-value="modelValue"
        :title="modalTitle"
        size="xl"
        :closable="true"
        @update:model-value="(v) => v === false && handleClose()"
    >
        <div class="space-y-4">
            <!-- Étape choix Complet/Partiel -->
            <div v-if="currentStep === 'choice'">
                <p class="text-base text-gray-700 dark:text-gray-300 mb-4">
                    {{ choiceStepDescription }}
                </p>
                <div class="flex flex-wrap justify-center gap-3">
                    <Button
                        type="button"
                        variant="primary"
                        class="choice-btn choice-btn-complet"
                        @click="selectType('complet')"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Complet
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        class="choice-btn choice-btn-partiel"
                        @click="selectType('partiel')"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4"></path>
                        </svg>
                        Partiel
                    </Button>
                </div>
                <div class="mt-4 flex justify-end">
                    <Button variant="secondary" @click="handleClose">Annuler</Button>
                </div>
            </div>

            <!-- Étape affectation avec selects -->
            <div v-else-if="currentStep === 'assignment'">
                <div class="max-h-[60vh] overflow-y-auto pr-1">
                    <div class="bg-gradient-to-br from-primary/10 via-primary/5 to-indigo-50 dark:from-primary/20 dark:via-primary/10 dark:to-indigo-900/20 p-4 rounded-xl mb-4 border border-primary/20">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    Job {{ selectedJob?.reference || selectedJob?.id }}
                                </h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {{ assignmentStepSubtitle }}
                                </p>
                                <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                                    <span v-if="savingAssignment" class="inline-flex items-center gap-1">
                                        <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sauvegarde...
                                    </span>
                                    <span v-else>Sauvegarde automatique</span>
                                </span>
                            </div>
                            <span :class="getStatusBadgeClass(selectedJob?.status)">
                                {{ selectedJob?.status || 'N/A' }}
                            </span>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="row">
                            <div
                                v-for="(assignment, index) in assignments"
                                :key="index"
                                class="col-6 px-2 mb-4"
                            >
                                <div :class="getCardClasses(assignment)">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <div :class="getCountingBadgeClasses(assignment)">
                                                {{ assignment.counting_order }}
                                            </div>
                                            <div>
                                                <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                                                    {{ assignment.counting_order === 1 ? '1er' : assignment.counting_order === 2 ? '2ème' : assignment.counting_order + 'ème' }} comptage
                                                </h4>
                                                <p class="text-xs text-gray-600 dark:text-gray-400">{{ assignment.status || 'NON ASSIGNÉ' }}</p>
                                            </div>
                                        </div>
                                        <span class="text-lg">{{ getAssignmentIcon(assignment.status) }}</span>
                                    </div>
                                    <div class="space-y-2">
                                        <SelectField
                                            :id="'team-select-' + assignment.counting_order"
                                            :model-value="assignment.session?.id?.toString() || ''"
                                            :options="getOptionsForCountingOrder(assignment.counting_order)"
                                            :placeholder="assignment.status === 'TERMINE' ? 'Comptage terminé' : 'Sélectionner une équipe...'"
                                            :disabled="assignment.status === 'TERMINE'"
                                            :searchable="true"
                                            :clearable="false"
                                            :enhanced-search="true"
                                            :search-placeholder="'Rechercher une équipe...'"
                                            :no-options-text="'Aucune équipe trouvée'"
                                            class="custom-select-compact"
                                            @update:model-value="(value) => handleTeamChange(assignment.counting_order || 0, String(value || ''))"
                                        />
                                    </div>
                                    <div v-if="assignment.session" class="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                                        <span class="text-xs font-medium text-blue-800 dark:text-blue-200 truncate">
                                            {{ assignment.session.username }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" @click="handleBack">Retour</Button>
                    <Button variant="primary" @click="handleFinish">
                        {{ reaffectationMode ? 'Fermer' : 'Terminer' }}
                    </Button>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button } from '@SMATCH-Digital-dev/vue-system-design'
import SelectField from '@/components/Form/SelectField.vue'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'

const props = withDefaults(defineProps<{
    modelValue: boolean
    selectedJob?: any
    teamOptions: Array<{ label: string; value: string }>
    teamOptionsByCountingOrder?: Record<number, Array<{ label: string; value: string }>>
    inventoryId?: number | null
    reaffectationMode?: boolean
    /** Affiche un indicateur de sauvegarde (état visuel) */
    savingAssignment?: boolean
}>(), {
    reaffectationMode: false,
    savingAssignment: false
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'team-changed': [countingOrder: number, teamId: string, assignmentType: 'complet' | 'partiel']
    'finish': []
}>()

const currentStep = ref<'choice' | 'assignment'>('choice')
const assignmentType = ref<'complet' | 'partiel'>('complet')
const assignments = ref<any[]>([])

const modalTitle = computed(() => {
    const ref = props.selectedJob?.reference || props.selectedJob?.job || props.selectedJob?.id || 'N/A'
    if (props.reaffectationMode) {
        return `Réaffecter le job ${ref}`
    }
    return `Job ${ref}`
})

const choiceStepDescription = computed(() =>
    props.reaffectationMode
        ? 'Choisissez le type de réaffectation pour ce job :'
        : 'Choisissez le type d\'affectation pour ce job :'
)

const assignmentStepSubtitle = computed(() => {
    const type = assignmentType.value === 'complet' ? 'complète' : 'partielle'
    return props.reaffectationMode ? `Réaffectation ${type}` : `Affectation ${type}`
})

const getStatusBadgeClass = (status?: string) => {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-bold'
    switch (status) {
        case 'VALIDE': return `${base} bg-green-500 text-white`
        case 'AFFECTE': return `${base} bg-blue-500 text-white`
        case 'PRET': return `${base} bg-purple-500 text-white`
        case 'TERMINE': return `${base} bg-emerald-500 text-white`
        default: return `${base} bg-gray-500 text-white`
    }
}

const getCardClasses = (assignment: any) => {
    const base = 'rounded-lg border-2 p-4 shadow-md transition-all'
    if (assignment.status === 'TERMINE') {
        return `${base} border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20`
    }
    return `${base} border-gray-200 dark:border-gray-600`
}

const getCountingBadgeClasses = (assignment: any) => {
    const base = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold'
    if (assignment.status === 'TERMINE') {
        return `${base} bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400`
    }
    return `${base} bg-primary/10 text-primary`
}

const getAssignmentIcon = (status?: string) => {
    switch (status) {
        case 'TERMINE': return '✅'
        case 'EN COURS': return '🔄'
        default: return '⏳'
    }
}

const optionsByCountingOrder = computed(() => props.teamOptionsByCountingOrder || {})

const getOptionsForCountingOrder = (countingOrder: number) => {
    return optionsByCountingOrder.value?.[countingOrder] || []
}

const selectType = (type: 'complet' | 'partiel') => {
    assignmentType.value = type
    currentStep.value = 'assignment'
    if (props.selectedJob?.assignments) {
        assignments.value = props.selectedJob.assignments.filter((a: any) =>
            a.counting_order != null
        )
    } else {
        const maxOrder = Math.max(2, ...((props.selectedJob?.assignments || []).map((a: any) => a.counting_order || 0)))
        assignments.value = Array.from({ length: maxOrder }, (_, i) => ({
            counting_order: i + 1,
            status: 'NON ASSIGNÉ',
            session: null
        }))
    }
}

const handleTeamChange = async (countingOrder: number, teamId: string) => {
    if (!teamId || teamId === '') return
    try {
        emit('team-changed', countingOrder, teamId, assignmentType.value)
    } catch (error) {
        logger.error('Erreur lors du changement d\'équipe:', error)
        alertService.error({ text: 'Erreur lors de l\'assignation de l\'équipe' })
    }
}

const handleBack = () => {
    currentStep.value = 'choice'
    assignments.value = []
}

const handleFinish = () => {
    emit('finish')
    handleClose()
}

const handleClose = () => {
    currentStep.value = 'choice'
    assignmentType.value = 'complet'
    assignments.value = []
    emit('update:modelValue', false)
}

watch(() => props.modelValue, (v) => {
    if (!v) {
        currentStep.value = 'choice'
        assignmentType.value = 'complet'
        assignments.value = []
    }
}, { immediate: true })

// Synchroniser les assignments quand le parent met à jour selectedJob (après refresh)
watch(() => props.selectedJob, (job) => {
    if (currentStep.value === 'assignment' && job?.assignments?.length) {
        assignments.value = job.assignments.filter((a: any) => a.counting_order != null)
    }
}, { deep: true })
</script>

<style scoped>
.choice-btn-complet {
    background: linear-gradient(to right, #22c55e, #16a34a) !important;
    color: white !important;
}
.choice-btn-complet:hover {
    background: linear-gradient(to right, #16a34a, #15803d) !important;
}
.choice-btn-partiel {
    background: linear-gradient(to right, #3b82f6, #2563eb) !important;
    color: white !important;
}
.choice-btn-partiel:hover {
    background: linear-gradient(to right, #2563eb, #1d4ed8) !important;
}
.row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -0.75rem;
}
.col-6 {
    flex: 0 0 50%;
    max-width: 50%;
    padding: 0 0.75rem;
}
@media (max-width: 1024px) {
    .col-6 {
        flex: 0 0 100%;
        max-width: 100%;
    }
}
.custom-select-compact :deep(.vs__dropdown-menu) {
    max-height: 120px !important;
}
</style>
