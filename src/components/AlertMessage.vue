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
                <h3 class="text-2xl font-bold" :class="titleColorClass">{{ title }}</h3>
            </div>
            <p class="mb-6 text-lg" :class="messageColorClass">{{ subtitle }}</p>
            <div class="bg-white p-6 rounded-lg border shadow-sm mb-6" :class="contentBorderClass">
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
                    class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
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

// Classes conditionnelles basées sur le type
const alertClasses = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
        warning: 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200',
        success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
        info: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
    };
    return classes[props.type];
});

const iconBgClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'bg-red-100',
        warning: 'bg-orange-100',
        success: 'bg-green-100',
        info: 'bg-blue-100'
    };
    return classes[props.type];
});

const iconColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-red-600',
        warning: 'text-orange-600',
        success: 'text-green-600',
        info: 'text-blue-600'
    };
    return classes[props.type];
});

const titleColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-red-700',
        warning: 'text-orange-700',
        success: 'text-green-700',
        info: 'text-blue-700'
    };
    return classes[props.type];
});

const messageColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-red-600',
        warning: 'text-orange-600',
        success: 'text-green-600',
        info: 'text-blue-600'
    };
    return classes[props.type];
});

const contentBorderClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'border-red-200',
        warning: 'border-orange-200',
        success: 'border-green-200',
        info: 'border-blue-200'
    };
    return classes[props.type];
});

const contentColorClass = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'text-red-700',
        warning: 'text-orange-700',
        success: 'text-green-700',
        info: 'text-blue-700'
    };
    return classes[props.type];
});

const primaryButtonClasses = computed(() => {
    const classes: Record<AlertType, string> = {
        error: 'bg-red-500 hover:bg-red-600 text-white',
        warning: 'bg-orange-500 hover:bg-orange-600 text-white',
        success: 'bg-green-500 hover:bg-green-600 text-white',
        info: 'bg-blue-500 hover:bg-blue-600 text-white'
    };
    return classes[props.type];
});
</script>
