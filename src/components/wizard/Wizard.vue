<template>
    <div class="wizard-ui">
        <div class="wizard-steps">
            <div class="wizard-steps-line"></div>
            <div
                v-for="(step, idx) in steps"
                :key="idx"
                :class="[
                    'wizard-step',
                    { active: idx === currentStep, done: idx < currentStep }
                ]"
            >
                <span class="wizard-step-circle">{{ idx + 1 }}</span>
                <span class="wizard-step-title">{{ step.title }}</span>
            </div>
        </div>
        <div class="wizard-content">
            <slot :name="`step-${currentStep}`" />
        </div>

        <!-- Affichage des erreurs de validation -->
        <div v-if="validationError" class="wizard-validation-error">
            <div class="error-message">
                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{{ validationError }}</span>
            </div>
        </div>

        <div class="wizard-actions">
            <button @click="prev" :disabled="currentStep === 0">Précédent</button>
            <button v-if="!isLastStep" @click="next" :disabled="!isValid">Suivant</button>
            <button v-else @click="finish" :disabled="!isValid">Terminer</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { logger } from '@/services/loggerService';

const props = defineProps<{
    steps: { title: string }[];
    isValid: boolean;
    onFinish?: () => void | Promise<void>;
    validateStep?: (step: number) => boolean | Promise<boolean>;
}>();

const emit = defineEmits(['finish', 'update:currentStep', 'validationError']);

const currentStep = ref(0);
const validationError = ref<string | null>(null);

const isLastStep = computed(() => currentStep.value === props.steps.length - 1);

async function next() {
    // Validation de l'étape actuelle
    if (props.validateStep) {
        try {
            const isValidStep = await props.validateStep(currentStep.value);
            if (!isValidStep) {
                validationError.value = 'Veuillez corriger les erreurs avant de continuer';
                return; // Bloquer la navigation
            }
        } catch (error) {
            validationError.value = error instanceof Error ? error.message : 'Erreur de validation';
            emit('validationError', validationError.value);
            return; // Bloquer la navigation
        }
    }

    // Réinitialiser l'erreur de validation
    validationError.value = null;

    if (currentStep.value < props.steps.length - 1) {
        currentStep.value++;
        emit('update:currentStep', currentStep.value);
    }
}
function prev() {
    if (currentStep.value > 0) {
        currentStep.value--;
        emit('update:currentStep', currentStep.value);
    }
}
async function finish() {
    // Appeler la fonction onFinish si elle existe
    if (props.onFinish) {
        try {
            await props.onFinish();
        } catch (error) {
            // Gérer l'erreur sans la laisser non gérée
            logger.warn('Erreur lors de l\'exécution de onFinish', error);
            // L'erreur sera gérée par le composant parent
        }
    }

    emit('finish');
}

// Synchronisation externe si besoin
watch(() => props.steps, () => {
    if (currentStep.value >= props.steps.length) {
        currentStep.value = props.steps.length - 1;
    }
});
</script>

<style scoped>
.wizard-ui {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 1.5rem 1.5rem 1.25rem 1.5rem;
    border: 1px solid #eee;
    border-radius: 12px;
    background: #fafbfc;
    box-shadow: 0 4px 24px 0 rgba(0,0,0,0.07);
}
.wizard-steps {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    position: relative;
    width: 100%;
}
.wizard-steps-line {
    position: absolute;
    top: 27px;
    left: 0;
    right: 0;
    height: 3px;
    background: #eee;
    z-index: 0;
}
.wizard-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    min-width: 120px;
    z-index: 1;
}
.wizard-step-circle {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: #eee;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.5rem;
    border: 3px solid #eee;
    transition: background 0.2s, color 0.2s, border 0.2s;
    margin-bottom: 0.5rem;
}
.wizard-step.active .wizard-step-circle {
    background: #ffc107;
    color: #222;
    border: 3px solid #ffc107;
}
.wizard-step.done .wizard-step-circle {
    background: #4caf50;
    color: #fff;
    border: 3px solid #4caf50;
}
.wizard-step-title {
    font-size: 1.15rem;
    color: #888;
    margin-top: 0.2rem;
    text-align: center;
    min-width: 90px;
    font-weight: 500;
}
.wizard-step.active .wizard-step-title {
    color: #222;
    font-weight: bold;
}
.wizard-step.done .wizard-step-title {
    color: #4caf50;
    font-weight: bold;
}
.wizard-step-line {
    width: 100%;
    height: 3px;
    background: #eee;
    position: absolute;
    left: 0;
    top: 27px;
    z-index: 0;
    transform: none;
}
.wizard-step.active ~ .wizard-step-line,
.wizard-step.done ~ .wizard-step-line {
    background: #ffc107;
}
.wizard-step.done ~ .wizard-step-line {
    background: #4caf50;
}
.wizard-step:last-child .wizard-step-line {
    display: none;
}
.wizard-content {
    min-height: 180px;
    margin-bottom: 1.5rem;
    transition: all 0.3s cubic-bezier(.4,0,.2,1);
    font-size: 1.15rem;
}

.wizard-validation-error {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    animation: slideIn 0.3s ease-out;
}

.error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #dc2626;
    font-weight: 500;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.wizard-actions {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-top: 1.5rem;
}
button {
    padding: 0.8rem 2.2rem;
    border-radius: 6px;
    border: none;
    background: #ffc107;
    color: #222;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background 0.2s;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
}
button:disabled {
    background: #eee;
    color: #aaa;
    cursor: not-allowed;
}

/* Responsive */
@media (max-width: 900px) {
    .wizard-ui {
        max-width: 98vw;
        padding: 2rem 1rem 1.5rem 1rem;
    }
    .wizard-step {
        min-width: 80px;
    }
    .wizard-step-circle {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
        border-width: 2px;
    }
    .wizard-step-line {
        width: 40px;
        height: 2px;
        top: 19px;
        transform: translateX(13px);
    }
    .wizard-step-title {
        font-size: 1rem;
        min-width: 60px;
    }
}
@media (max-width: 600px) {
    .wizard-ui {
        padding: 1rem 0.2rem 0.5rem 0.2rem;
    }
    .wizard-steps {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    .wizard-step {
        flex-direction: row;
        min-width: 0;
        margin-bottom: 0.5rem;
    }
    .wizard-step-circle {
        width: 32px;
        height: 32px;
        font-size: 0.95rem;
        margin-bottom: 0;
        margin-right: 0.5rem;
    }
    .wizard-step-title {
        font-size: 0.95rem;
        min-width: 0;
        margin-top: 0;
        margin-right: 0.5rem;
    }
    .wizard-step-line {
        display: none;
    }
    .wizard-content {
        min-height: 80px;
        font-size: 1rem;
    }
    .wizard-actions {
        flex-direction: column;
        gap: 0.7rem;
        align-items: stretch;
        margin-top: 1rem;
    }
    button {
        width: 100%;
        font-size: 1rem;
        padding: 0.7rem 0;
    }
}
@media (max-width: 400px) {
    .wizard-ui {
        padding: 0.5rem 0.1rem 0.2rem 0.1rem;
    }
    .wizard-content {
        font-size: 0.95rem;
    }
}
</style>
