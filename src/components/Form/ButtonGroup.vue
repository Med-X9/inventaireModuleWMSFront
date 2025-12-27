<template>
    <div :class="[
        'inline-flex flex-wrap',
        justify === 'start' ? 'justify-start' : justify === 'center' ? 'justify-center' : 'justify-end',
        className
    ]">
        <button
            v-for="(button, index) in visibleButtons"
            :key="button.id || index"
            :type="button.type || 'button'"
            :disabled="button.disabled"
            @click="button.onClick"
            :class="[
                'flex items-center gap-2 px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 relative',
                // Coins arrondis seulement sur les bords extérieurs
                getBorderRadiusClass(index, visibleButtons.length),
                button.class || getDefaultButtonClass(button.variant || 'default')
            ]">
            <!-- Icône à gauche -->
            <component
                v-if="button.icon"
                :is="button.icon"
                class="w-4 h-4 flex-shrink-0" />
            <!-- Label -->
            <span>{{ button.label }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

/**
 * Interface pour un bouton dans le groupe
 */
export interface ButtonGroupButton {
    id?: string | number
    label: string
    icon?: Component
    onClick: () => void | Promise<void>
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'default'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    visible?: boolean
    class?: string
}

/**
 * Props du composant ButtonGroup
 */
interface Props {
    buttons: ButtonGroupButton[]
    justify?: 'start' | 'center' | 'end'
    className?: string
}

const props = withDefaults(defineProps<Props>(), {
    justify: 'end',
    className: ''
})

/**
 * Filtre les boutons visibles
 */
const visibleButtons = computed(() => {
    return props.buttons.filter(button => button.visible !== false)
})

/**
 * Retourne la classe CSS pour les coins arrondis selon la position du bouton
 */
const getBorderRadiusClass = (index: number, total: number): string => {
    if (total === 1) {
        // Un seul bouton : tous les coins arrondis
        return 'rounded-lg'
    }
    
    if (index === 0) {
        // Premier bouton : coins arrondis à gauche
        return 'rounded-l-lg'
    }
    
    if (index === total - 1) {
        // Dernier bouton : coins arrondis à droite
        return 'rounded-r-lg'
    }
    
    // Boutons du milieu : pas de coins arrondis
    return 'rounded-none'
}

/**
 * Retourne la classe CSS par défaut selon le variant (couleur)
 */
const getDefaultButtonClass = (variant: string): string => {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-blue-500',
        success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white focus:ring-green-500',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500',
        warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white focus:ring-yellow-500',
        info: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white focus:ring-purple-500',
        default: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white focus:ring-slate-500'
    }
    return variants[variant as keyof typeof variants] || variants.default
}
</script>

