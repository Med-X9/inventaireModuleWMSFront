<template>
    <div class="mx-auto h-full panel py-3">
        <FormWizard ref="wizard" :startIndex="internalStep" @on-change="onChange" @on-complete="handleFinishWizard"
            :before-change="beforeChange" :color="color" back-button-text="Précédent" next-button-text="Suivant"
            class="circle" :finish-button-text="props.finishButtonText || 'Créer'">
            <template #next="{ nextTab, fillButtonStyle }">
                <SubmitButton type="button" :loading="isSubmitting" :style="fillButtonStyle"
                    label="Suivant" @click="handleNext(nextTab, $event)" />
            </template>

            <template #finish="{ fillButtonStyle }">
                <SubmitButton type="button" :loading="isSubmitting" :style="fillButtonStyle"
                    :label="props.finishButtonText || 'Créer'" @click="handleFinishWizard" />
            </template>

            <TabContent v-for="(step, idx) in steps" :key="idx" :title="step.title" :custom-icon="step.icon"
                class="wizard-step md:px-4 py-1">
                <div class="shadow bg-gray-50 dark:bg-[#0e1726] rounded-md px-8 py-5 space-y-2">
                    <slot :name="`step-${idx}`" />
                </div>
            </TabContent>
        </FormWizard>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import { FormWizard, TabContent } from 'vue3-form-wizard';
import SubmitButton from '@/components/Form/SubmitButton.vue';
import { alertService } from '@/services/alertService';
import type { Step } from '@/interfaces/wizard';
import 'vue3-form-wizard/dist/style.css';

const props = defineProps<{
    steps: Step[];
    color?: string;
    currentStep?: number;
    isValid: boolean;
    beforeChange: (prev: number, next: number) => boolean | Promise<boolean>;
    finishButtonText?: string;
    isSubmitting?: boolean;
}>();

const emit = defineEmits<{
    (e: 'complete'): void;
    (e: 'update:current-step', step: number): void;
}>();

const { beforeChange } = toRefs(props);
const wizard = ref<InstanceType<typeof FormWizard> | null>(null);

const internalStep = computed(() => props.currentStep ?? 0);

function onChange(prev: number, next: number) {
    emit('update:current-step', next);
}

async function handleNext(nextTab: () => void, event: Event) {
    event.stopPropagation();
    if (!props.isValid) {
        await alertService.error({
            title: 'Validation',
            text: 'Veuillez remplir tous les champs requis avant de continuer.'
        });
        return;
    }
    const ok = await beforeChange.value!(internalStep.value, internalStep.value + 1);
    if (!ok) return;
    nextTab();
}

async function handleFinishWizard() {
    // 1. verouillage immédiat
    if (props.isSubmitting) return;

    // 2. validation avant fini
    if (!props.isValid) {
        await alertService.error({
            title: 'Validation',
            text: 'Veuillez remplir tous les champs requis avant de terminer.'
        });
        return;
    }

    const ok = await beforeChange.value!(internalStep.value, internalStep.value + 1);
    if (!ok) return;

    // 3. émission de l'événement complet
    emit('complete');
    // on ne réarme pas isSubmitting ici – le parent remontera le reset via key change
}
</script>

<style scoped>
/* styles éventuels */
</style>
