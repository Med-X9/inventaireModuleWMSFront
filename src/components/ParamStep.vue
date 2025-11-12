<template>
    <div>
        <!-- Mode de comptage avec FormBuilder -->
        <div class="mb-6">
            <FormBuilder
                :key="`mode-form-${local.mode || 'empty'}`"
                :modelValue="{ mode: local.mode }"
                :fields="stepConfig.fields.filter(f => f.key === 'mode')"
                :columns="1"
                hide-submit
                @update:modelValue="onFormChange"
                @validation-change="onValidationChange"
            />
            <div v-if="stepConfig.help">
                <div class="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p class="text-xs text-yellow-600 dark:text-yellow-300">
                        {{ stepConfig.help }}
                    </p>
                </div>
            </div>
        </div>
        <!-- Options dynamiques pour le 3e comptage OU formulaire classique -->
        <template v-if="stepConfig.fields.filter(f => f.key !== 'mode').length > 0">
            <FormBuilder
                :key="`options-form-${local.mode}-${JSON.stringify(local)}`"
                :modelValue="local"
                :fields="stepConfig.fields.filter(f => f.key !== 'mode')"
                :columns="1"
                hide-submit
                @update:modelValue="onFormChange"
            />
        </template>
        <template v-else>
            <div v-if="stepConfig.fields.filter(f => f.key !== 'mode').length > 0">
                <FormBuilder
                    :key="`options-form-${local.mode}-${JSON.stringify(local)}`"
                    :modelValue="local"
                    :fields="stepConfig.fields.filter(f => f.key !== 'mode')"
                    :columns="1"
                    hide-submit
                    @update:modelValue="onFormChange"
                />
            </div>
            <div v-else
                class="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p class="text-xs text-yellow-600 dark:text-yellow-300">
                    Aucune option disponible pour le mode: {{ local.mode }}
                </p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { reactive, watch, toRefs, onMounted } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';
import type { StepConfig } from '@/interfaces/stepConfig';

const props = defineProps<{
    modelValue: ComptageConfig;
    stepIndex: number;
    stepConfig: StepConfig;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', data: ComptageConfig): void;
    (e: 'validation-change', isValid: boolean): void;
}>();

const local = reactive<ComptageConfig>({ ...props.modelValue });
const { stepConfig } = toRefs(props);

onMounted(() => {
});

watch(() => props.modelValue, val => {
    Object.assign(local, val);
}, { deep: true, immediate: true });

function onFormChange(data: Record<string, unknown>) {
    // Correction : garantir que mode est toujours un string
    if (Array.isArray(data.mode)) {
        data.mode = data.mode[0] || '';
    }
    const modeChanged = data.mode !== undefined && data.mode !== local.mode;
    if (modeChanged) {
        Object.keys(local).forEach(k => {
            if (k !== 'mode') local[k] = false;
        });
    }
    Object.assign(local, data);
    // Logique d'exclusion pour les options 'par article'
    if (local.mode === 'par article') {
        if (local.numeroSerie) {
            local.dlc = false;
            local.numeroLot = false;
        } else {
            if (local.numeroLot) {
                local.numeroSerie = false;
            }
            if (local.dlc) {
                local.numeroSerie = false;
            }
        }
    }
    emit('update:modelValue', JSON.parse(JSON.stringify(local)));
}

function onValidationChange(isValid: boolean) {
    emit('validation-change', isValid);
}
</script>
