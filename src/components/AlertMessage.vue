<template>
    <div v-if="show" class="max-w-7xl mx-auto my-6 p-6 rounded-xl shadow-lg border" :class="alertClasses">
        <div class="text-center">
            <div class="flex items-center justify-center mb-4">
                <div class="p-3 rounded-full mr-3" :class="iconBgClass">
                    <svg class="w-8 h-8" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path v-if="type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        <path v-else-if="type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        <path v-else-if="type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold font-heading" :class="titleColorClass">{{ title }}</h3>
            </div>
            <p class="mb-6 text-lg" :class="messageColorClass">{{ subtitle }}</p>
            <div class="bg-card p-6 rounded-lg border shadow-sm mb-6" :class="contentBorderClass">
                <p class="text-lg font-medium" :class="contentColorClass">{{ message }}</p>
            </div>
            <div class="flex gap-3 justify-center">
                <button
                    v-if="primaryAction"
                    @click="primaryAction"
                    class="font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                    :class="primaryButtonClasses"
                >
                    {{ primaryActionText }}
                </button>
                <button
                    v-if="secondaryAction"
                    @click="secondaryAction"
                    class="bg-text-muted hover:bg-text-light text-card font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                >
                    {{ secondaryActionText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AlertMessageProps, AlertType } from '@/interfaces/inventoryCreation';

interface Props extends AlertMessageProps {}

const props = withDefaults(defineProps<Props>(), {
    primaryActionText: 'Fermer',
    secondaryActionText: 'Fermer'
});

// Classes conditionnelles basées sur le type - Utilisation du système de thème unifié
const alertClasses = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'bg-alert-error border-error',
        warning: 'bg-alert-warning border-warning',
        success: 'bg-alert-success border-success',
        info: 'bg-info-50 border-info'
    };
    return classes[props.type];
});

const iconBgClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'bg-error-light',
        warning: 'bg-warning-light',
        success: 'bg-success-light',
        info: 'bg-info-100'
    };
    return classes[props.type];
});

const iconColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-error',
        warning: 'text-warning',
        success: 'text-success',
        info: 'text-info'
    };
    return classes[props.type];
});

const titleColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-error-dark',
        warning: 'text-warning-dark',
        success: 'text-success-dark',
        info: 'text-info-dark'
    };
    return classes[props.type];
});

const messageColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-error',
        warning: 'text-warning',
        success: 'text-success',
        info: 'text-info'
    };
    return classes[props.type];
});

const contentBorderClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'border-error',
        warning: 'border-warning',
        success: 'border-success',
        info: 'border-info'
    };
    return classes[props.type];
});

const contentColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-error-dark',
        warning: 'text-warning-dark',
        success: 'text-success-dark',
        info: 'text-info-dark'
    };
    return classes[props.type];
});

const primaryButtonClasses = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'bg-error hover:bg-error-dark text-card',
        warning: 'bg-warning hover:bg-warning-dark text-card',
        success: 'bg-success hover:bg-success-dark text-card',
        info: 'bg-info hover:bg-info-dark text-card'
    };
    return classes[props.type];
});
</script>
