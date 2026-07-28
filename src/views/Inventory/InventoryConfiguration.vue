<template>
    <div class="inventory-configuration min-h-screen w-full bg-app dark:bg-bg-dark">
        <Container max-width="7xl" class="py-6">
            <Card class="mb-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Configuration de l'inventaire
                        </h1>
                        <p v-if="inventory" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {{ inventory.label }}
                            <span class="mx-2 text-gray-400 dark:text-gray-500">·</span>
                            {{ inventory.reference }}
                            <span class="mx-2 text-gray-400 dark:text-gray-500">·</span>
                            <span class="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-violet-600/20 ring-inset dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-400/30">
                                {{ inventory.status }}
                            </span>
                            <span class="mx-2 text-gray-400 dark:text-gray-500">·</span>
                            <span class="text-gray-700 dark:text-gray-300">{{ inventory.inventory_type }}</span>
                        </p>
                    </div>
                    <Button variant="secondary" size="sm" @click="goBack">
                        Retour
                    </Button>
                </div>
            </Card>

            <div v-if="loading" class="flex justify-center py-16">
                <p class="text-gray-500 dark:text-gray-400">Chargement...</p>
            </div>

            <template v-else-if="inventory">
                <Alert
                    v-if="error"
                    type="error"
                    title="Erreur"
                    :message="error"
                    :dismissible="true"
                    @dismiss="error = null"
                    class="mb-6"
                />

                <Card>
                    <template v-if="isGeneral" #header>
                        <Steps
                            :steps="stepsData"
                            size="md"
                            @step-click="(step, index) => handleStepClick(index + 1)"
                        />
                    </template>

                    <div class="p-6">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <template v-if="isSingleCounting">
                                Configuration du comptage
                            </template>
                            <template v-else>
                                Comptage {{ currentStep }}
                            </template>
                        </h2>

                        <Form>
                            <FormGroup>
                                <FormLabel>Mode de comptage <span class="text-red-500 dark:text-red-400">*</span></FormLabel>
                                <Autocomplete
                                    :options="modeOptions"
                                    v-model="selectedMode"
                                    placeholder="Sélectionnez un mode"
                                    :error="showValidation && !activeComptage.mode ? 'Le mode est requis' : undefined"
                                />
                                <FormError v-if="showValidation && !activeComptage.mode">
                                    Le mode est requis
                                </FormError>
                            </FormGroup>

                            <template v-if="activeComptage.mode === 'en vrac'">
                                <FormGroup>
                                    <FormLabel>Méthode opératoire <span class="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <div class="flex gap-6">
                                        <Radio
                                            v-model="activeComptage.inputMethod"
                                            value="saisie"
                                            label="Saisie quantité"
                                            :name="`inputMethod-${activeIndex}`"
                                        />
                                        <Radio
                                            v-model="activeComptage.inputMethod"
                                            value="scanner"
                                            label="Scanner unitaire"
                                            :name="`inputMethod-${activeIndex}`"
                                        />
                                    </div>
                                    <FormError v-if="showValidation && !activeComptage.inputMethod">
                                        La méthode opératoire est requise
                                    </FormError>
                                </FormGroup>

                                <div v-if="getOptions(activeIndex).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(activeIndex).filter(o => o !== 'saisieQuantite' && o !== 'scannerUnitaire')"
                                            :key="opt"
                                            v-model="(activeComptage as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                        />
                                    </div>
                                </div>
                            </template>

                            <template v-else-if="activeComptage.mode === 'par article'">
                                <div v-if="getOptions(activeIndex).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(activeIndex)"
                                            :key="opt"
                                            v-model="(activeComptage as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                            :disabled="getOptionDisabled(activeIndex, opt)"
                                        />
                                    </div>
                                </div>
                            </template>

                            <p
                                v-else-if="activeComptage.mode === 'image de stock'"
                                class="mt-4 text-sm text-gray-600 dark:text-gray-400"
                            >
                                Mode image de stock : aucune option supplémentaire. Les comptages 2 et 3 devront être identiques (en vrac ou par article).
                            </p>
                        </Form>
                    </div>

                    <div class="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            <template v-if="isGeneral">
                                Étape {{ currentStep }} sur {{ totalSteps }}
                            </template>
                            <template v-else>
                                1 comptage requis
                            </template>
                        </div>
                        <div class="flex items-center gap-3">
                            <Button
                                v-if="isGeneral"
                                variant="secondary"
                                :disabled="currentStep === 1 || saving"
                                @click="goToPreviousStep"
                            >
                                Précédent
                            </Button>
                            <Button
                                v-if="isGeneral && !isLastStep"
                                variant="primary"
                                @click="goToNextStep"
                            >
                                Suivant
                            </Button>
                            <Button
                                v-else
                                variant="primary"
                                :disabled="saving"
                                @click="submitConfiguration"
                            >
                                {{ saving ? 'Enregistrement...' : 'Enregistrer la configuration' }}
                            </Button>
                        </div>
                    </div>
                </Card>
            </template>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
    Form,
    FormGroup,
    FormLabel,
    FormError,
    Button,
    Autocomplete,
    Radio,
    Checkbox,
    Card,
    Alert,
    Steps,
    Container,
} from '@SMATCH-Digital-dev/vue-system-design'
import type { AutocompleteOption, Step } from '@SMATCH-Digital-dev/vue-system-design'
import type { ComptageMode } from '@/interfaces/inventoryCreation'
import { useInventoryConfiguration } from '@/composables/useInventoryConfiguration'

interface Props {
    reference: string
}

const props = defineProps<Props>()
const router = useRouter()

const {
    inventory,
    loading,
    saving,
    error,
    currentStep,
    showValidation,
    comptages,
    isGeneral,
    isSingleCounting,
    totalSteps,
    isLastStep,
    availableModesForStep,
    getOptions,
    getOptionLabel,
    getOptionDisabled,
    setMode,
    goToNextStep,
    goToPreviousStep,
    loadInventory,
    submitConfiguration,
} = useInventoryConfiguration(props.reference)

const activeIndex = computed(() => (isGeneral.value ? currentStep.value - 1 : 0))
const activeComptage = computed(() => comptages[activeIndex.value])

const modeOptions = computed<AutocompleteOption[]>(() =>
    availableModesForStep(activeIndex.value).map((m) => ({ label: m, value: m }))
)

const selectedMode = computed({
    get: () => activeComptage.value?.mode || '',
    set: (value: string) => {
        setMode(activeIndex.value, (value || '') as ComptageMode | '')
    },
})

const stepsData = computed<Step[]>(() => [
    {
        title: 'Comptage 1',
        state: currentStep.value === 1 ? 'current' : currentStep.value > 1 ? 'completed' : 'pending',
        clickable: currentStep.value > 1,
    },
    {
        title: 'Comptage 2',
        state: currentStep.value === 2 ? 'current' : currentStep.value > 2 ? 'completed' : currentStep.value < 2 ? 'available' : 'pending',
        clickable: currentStep.value > 2,
    },
    {
        title: 'Comptage 3',
        state: currentStep.value === 3 ? 'current' : 'available',
        clickable: false,
    },
])

const handleStepClick = (step: number) => {
    if (step < currentStep.value) {
        currentStep.value = step
    }
}

const goBack = () => {
    router.push({ name: 'inventory-detail', params: { reference: props.reference } })
}

watch(
    () => [comptages[1]?.mode, comptages[1]?.inputMethod, comptages[1]?.numeroLot, comptages[1]?.numeroSerie, comptages[1]?.dlc, comptages[1]?.guideQuantite, comptages[1]?.guideArticle, comptages[1]?.isVariante, comptages[1]?.saisieQuantite, comptages[1]?.scannerUnitaire],
    () => {
        if (isGeneral.value && comptages[0]?.mode === 'image de stock' && comptages[1]?.mode) {
            Object.assign(comptages[2], JSON.parse(JSON.stringify(comptages[1])))
        }
    }
)

onMounted(() => {
    loadInventory()
})
</script>
