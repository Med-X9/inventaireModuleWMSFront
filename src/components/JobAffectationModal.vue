<!-- src/components/JobAffectationModal.vue -->
<template>
    <AffectationModal
        v-model="isOpen"
        :title="`🎯 Job ${selectedJob?.reference || 'N/A'}`"
        size="xl"
        :show-action-buttons="false"
        @close="handleClose"
        @cancel="handleClose"
    >
        <!-- Contenu principal de la modal d'affectation -->
        <div class="space-y-6">
            <!-- Section choix Complet/Partiel -->
            <div v-if="currentStep === 'choice'" class="text-center p-6">
                <div class="mb-6">
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
                        Choisissez le type d'affectation pour ce job :
                    </p>
                </div>
                <div class="flex justify-center gap-4">
                    <button
                        @click="selectType('complet')"
                        class="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Complet
                    </button>
                    <button
                        @click="selectType('partiel')"
                        class="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4"></path>
                        </svg>
                        Partiel
                    </button>
                </div>
            </div>

            <!-- Section affectation avec selects -->
            <div v-else-if="currentStep === 'assignment'">
                <div class="max-h-[75vh] overflow-y-auto">
                    <!-- Header amélioré avec statut -->
                    <div class="bg-gradient-to-br from-primary/10 via-primary/5 to-indigo-50 dark:from-primary/20 dark:via-primary/10 dark:to-indigo-900/20 p-6 rounded-2xl mb-6 border-2 border-primary/20 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="relative">
                                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                        <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                </div>
                                <div class="text-center">
                                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        Job {{ selectedJob?.reference || selectedJob?.id }}
                                    </h3>
                                    <p class="text-base text-gray-600 dark:text-gray-400 mb-2">
                                        Affectation {{ assignmentType === 'complet' ? 'complète' : 'partielle' }}
                                    </p>
                                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                        </svg>
                                        Sauvegarde automatique
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="mb-1">
                                    <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Statut</span>
                                </div>
                                <span :class="getStatusBadgeClass(selectedJob?.status)">
                                    {{ getStatusIcon(selectedJob?.status) }}
                                    {{ selectedJob?.status || 'N/A' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Assignments par counting_order avec selects en grille -->
                    <div class="mb-6">
                        <div class="row">
                            <div
                                v-for="(assignment, index) in assignments"
                                :key="index"
                                class="col-6 px-2 mb-4"
                            >
                                <div :class="getCardClasses(assignment)">
                                    <!-- Header compact -->
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
                                        <div class="text-xl">{{ getAssignmentIcon(assignment.status) }}</div>
                                    </div>

                                    <!-- Select équipe avec SelectField -->
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

                                    <!-- Badge équipe actuelle compact -->
                                    <div v-if="assignment.session" class="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                                        <div class="flex items-center gap-1">
                                            <svg class="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span class="text-xs font-medium text-blue-800 dark:text-blue-200 truncate">
                                                {{ assignment.session.username }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        color="gray"
                        @click="handleBack"
                    >
                        Retour
                    </Button>
                    <Button
                        variant="solid"
                        color="primary"
                        @click="handleFinish"
                    >
                        Terminer
                    </Button>
                </div>
            </div>
        </div>
    </AffectationModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AffectationModal from '@/components/AffectationModal.vue'
import SelectField from '@/components/Form/SelectField.vue'
import Button from '@/components/Form/Button.vue'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'

// Props
const props = defineProps<{
    modelValue: boolean
    selectedJob?: any
    teamOptions: Array<{ label: string; value: string }>
    teamOptionsByCountingOrder?: Record<number, Array<{ label: string; value: string }>>
    inventoryId?: number | null
}>()

// Événements
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'team-changed': [countingOrder: number, teamId: string, assignmentType: 'complet' | 'partiel']
    'finish': []
}>()

// État réactif
const currentStep = ref<'choice' | 'assignment'>('choice')
const assignmentType = ref<'complet' | 'partiel'>('complet')
const assignments = ref<any[]>([])

const isOpen = ref(props.modelValue)

// Méthodes utilitaires
const getStatusBadgeClass = (status?: string) => {
    const baseClasses = 'inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg'
    switch (status) {
        case 'VALIDE':
            return `${baseClasses} bg-gradient-to-r from-green-400 to-green-600 text-white`
        case 'AFFECTE':
            return `${baseClasses} bg-gradient-to-r from-blue-400 to-blue-600 text-white`
        case 'PRET':
            return `${baseClasses} bg-gradient-to-r from-purple-400 to-purple-600 text-white`
        case 'TERMINE':
            return `${baseClasses} bg-gradient-to-r from-emerald-400 to-emerald-600 text-white`
        default:
            return `${baseClasses} bg-gradient-to-r from-gray-400 to-gray-600 text-white`
    }
}

const getStatusIcon = (status?: string) => {
    switch (status) {
        case 'VALIDE': return '✅'
        case 'AFFECTE': return '🔄'
        case 'PRET': return '⚡'
        case 'TERMINE': return '🎯'
        default: return '⏳'
    }
}

const getCardClasses = (assignment: any) => {
    const baseClasses = 'rounded-lg border-2 p-4 shadow-md hover:shadow-lg transition-all duration-300'
    if (assignment.status === 'TERMINE') {
        return `${baseClasses} border-green-300 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-700 bg-green-50 dark:bg-green-900/20`
    }
    return `${baseClasses} border-gray-200 dark:border-gray-600`
}

const getCountingBadgeClasses = (assignment: any) => {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold'
    if (assignment.status === 'TERMINE') {
        return `${baseClasses} bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400`
    }
    return `${baseClasses} bg-primary/10 text-primary`
}

const getAssignmentIcon = (status?: string) => {
    switch (status) {
        case 'TERMINE': return '✅'
        case 'EN COURS': return '🔄'
        default: return '⏳'
    }
}

// Computed pour les options par comptage (réactif)
const optionsByCountingOrder = computed(() => props.teamOptionsByCountingOrder || {})

// Fonction pour obtenir les options spécifiques à un comptage
const getOptionsForCountingOrder = (countingOrder: number) => {
    return optionsByCountingOrder.value?.[countingOrder] || []
}

// Handlers
const selectType = (type: 'complet' | 'partiel') => {
    assignmentType.value = type
    currentStep.value = 'assignment'

    // Préparer les assignments (exclure ceux avec counting_order null)
    if (props.selectedJob?.assignments) {
        assignments.value = props.selectedJob.assignments.filter((assignment: any) =>
            assignment.counting_order !== null && assignment.counting_order !== undefined
        );
    } else {
        // Créer des assignments par défaut si non présents
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
        // Envoyer aussi le type d'affectation choisi par l'utilisateur
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
    isOpen.value = false
}

// Watch pour synchroniser isOpen avec modelValue
watch(() => props.modelValue, (newValue) => {
    isOpen.value = newValue
    if (!newValue) {
        currentStep.value = 'choice'
        assignmentType.value = 'complet'
        assignments.value = []
    }
}, { immediate: true })

// Watch pour émettre les changements d'isOpen vers le parent
watch(isOpen, (newValue) => {
    emit('update:modelValue', newValue)
})
</script>

<style scoped>
/* Layout Bootstrap-like pour col-6 */
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

/* Styles pour SelectField */
.custom-select-compact :deep(.vs__dropdown-menu) {
    max-height: 200px !important;
    overflow-y: auto !important;
}

.custom-select-compact :deep(.vs__dropdown-option) {
    padding: 8px 12px !important;
    font-size: 14px !important;
}

/* Limiter à 3 options visibles */
.custom-select-compact :deep(.vs__dropdown-menu) {
    max-height: 120px !important;
}
</style>
