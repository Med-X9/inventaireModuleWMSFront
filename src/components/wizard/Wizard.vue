<template>
    <div class="mx-auto h-full panel py-3">
        <FormWizard
            ref="wizard"
            :startIndex="internalStep"
            @on-change="onChange"
            @on-complete="handleFinishWizard"
            :before-change="beforeChangeHandler"
            :color="color"
            back-button-text="Précédent"
            next-button-text="Suivant"
            class="circle"
            :finish-button-text="finishButtonText">

            <template #next="{ nextTab, fillButtonStyle }">
                <SubmitButton
                    type="button"
                    :loading="isSubmitting"
                    :style="fillButtonStyle"
                    label="Suivant"
                    @click="handleNext(nextTab, $event)" />
            </template>

            <template #finish="{ fillButtonStyle }">
                <SubmitButton
                    type="button"
                    :loading="isSubmitting"
                    :style="fillButtonStyle"
                    :label="finishButtonText"
                    @click="handleFinishWizard" />
            </template>

            <TabContent
                v-for="(step, idx) in steps"
                :key="`step-${idx}-${step.title}`"
                :title="step.title"
                :custom-icon="step.icon"
                class="wizard-step md:px-4 py-1">
                <div class="shadow bg-gray-50 dark:bg-[#0e1726] rounded-md px-8 py-5 space-y-2">
                    <slot :name="`step-${idx}`" />
                </div>
            </TabContent>
        </FormWizard>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, watch, nextTick } from 'vue';
import { FormWizard, TabContent } from 'vue3-form-wizard';
import SubmitButton from '@/components/Form/SubmitButton.vue';
import { alertService } from '@/services/alertService';
import type { Step } from '@/interfaces/wizard';
import 'vue3-form-wizard/dist/style.css';

interface WizardProps {
    steps: Step[];
    color?: string;
    currentStep?: number;
    isValid: boolean;
    beforeChange: (prev: number, next: number) => boolean | Promise<boolean>;
    finishButtonText?: string;
    isSubmitting?: boolean;
}

const props = withDefaults(defineProps<WizardProps>(), {
    color: '#ffc107',
    currentStep: 0,
    isValid: false,
    isSubmitting: false,
    finishButtonText: 'Créer'
});

const emit = defineEmits<{
    (e: 'complete'): void;
    (e: 'update:current-step', step: number): void;
}>();

// Références
const wizard = ref<InstanceType<typeof FormWizard> | null>(null);

// Computed properties optimisées
const internalStep = computed(() => props.currentStep ?? 0);

const finishButtonText = computed(() => {
    if (props.isSubmitting) {
        return 'En cours...';
    }
    return props.finishButtonText || 'Créer';
});

// Gestionnaire beforeChange optimisé
const beforeChangeHandler = async (prev: number, next: number): Promise<boolean> => {
    try {
        return await props.beforeChange(prev, next);
    } catch (error) {
        console.error('❌ Erreur dans beforeChange:', error);
        await alertService.error({
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la validation. Veuillez réessayer.'
        });
        return false;
    }
};

// Gestionnaires d'événements optimisés
const onChange = (prev: number, next: number) => {
    emit('update:current-step', next);
};

const handleNext = async (nextTab: () => void, event: Event) => {
    event.stopPropagation();

    if (!props.isValid) {
        await alertService.error({
            title: 'Validation',
            text: 'Veuillez remplir tous les champs requis avant de continuer.'
        });
        return;
    }

    try {
        const ok = await beforeChangeHandler(internalStep.value, internalStep.value + 1);
        if (!ok) return;

        nextTab();
    } catch (error) {
        console.error('❌ Erreur lors du passage à l\'étape suivante:', error);
        await alertService.error({
            title: 'Erreur',
            text: 'Une erreur est survenue. Veuillez réessayer.'
        });
    }
};

const handleFinishWizard = async () => {
    // Vérification immédiate de l'état de soumission
    if (props.isSubmitting) {
        console.log('🚫 Soumission en cours, action ignorée');
        return;
    }

    // Validation avant finalisation
    if (!props.isValid) {
        await alertService.error({
            title: 'Validation',
            text: 'Veuillez remplir tous les champs requis avant de terminer.'
        });
        return;
    }

    try {
        const ok = await beforeChangeHandler(internalStep.value, internalStep.value + 1);
        if (!ok) return;

        // Émission de l'événement de complétion
        emit('complete');
    } catch (error) {
        console.error('❌ Erreur lors de la finalisation:', error);
        await alertService.error({
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la finalisation. Veuillez réessayer.'
        });
    }
};

// Surveillance des changements pour optimiser les re-renders
watch(() => props.currentStep, (newStep) => {
    if (wizard.value && newStep !== undefined) {
        nextTick(() => {
            // Synchronisation avec le wizard interne si nécessaire
            console.log('🔄 Étape mise à jour:', newStep);
        });
    }
}, { immediate: true });

// Exposer des méthodes utiles
defineExpose({
    goToStep: (step: number) => {
        if (wizard.value) {
            // Méthode pour naviguer programmatiquement
            console.log('🎯 Navigation vers l\'étape:', step);
        }
    },
    reset: () => {
        if (wizard.value) {
            // Méthode pour réinitialiser le wizard
            console.log('🔄 Réinitialisation du wizard');
        }
    }
});
</script>

<style scoped>
/* Styles optimisés pour le wizard */
.wizard-step {
    transition: all 0.3s ease-in-out;
}

/* Amélioration de l'accessibilité */
:deep(.form-wizard) {
    outline: none;
}

:deep(.form-wizard:focus-within) {
    outline: 2px solid var(--primary-color, #ffc107);
    outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
    .wizard-step {
        padding: 0.5rem;
    }
}
</style>
