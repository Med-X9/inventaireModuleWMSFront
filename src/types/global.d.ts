/// <reference types="vite/client" />

// Déclarations de modules pour les composants Vue
declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// Déclarations pour les modules externes
declare module 'vue-flatpickr-component' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<any, any, any>
    export default component
}

declare module 'flatpickr/dist/l10n/fr.js' {
    const French: any
    export { French }
}

// Déclarations pour les utilitaires
declare module '@/utils/domUtils' {
    export function safeExecute(fn: () => void, onError?: () => void): void
}

declare module '@/utils/validate' {
    export interface Validator {
        fn: (value: unknown) => boolean
        msg: string
    }

    export function required(msg?: string): Validator
    export function email(msg?: string): Validator
    export function minLength(min: number, msg?: string): Validator
    export function selectRequired(msg?: string): Validator
    export function date(msg?: string): Validator
    export function magasinWithDatesRequired(msg?: string): Validator
}

// Déclarations pour les interfaces
declare module '@/interfaces/form' {
    export interface FieldConfig {
        key: string
        label: string
        type: 'text' | 'email' | 'date' | 'select' | 'checkbox' | 'radio' | 'button-group' | 'radio-group' | 'multi-select-with-dates' | 'number'
        options?: Array<string | SelectOption>
        multiple?: boolean
        searchable?: boolean
        clearable?: boolean
        props?: Record<string, unknown>
        validators?: Array<{ fn: (value: unknown) => boolean; msg: string }>
        required?: boolean
        min?: string
        max?: string
        defaultDate?: string
        enableTime?: boolean
        dateFormat?: string
        gridCols?: number
        radioOptions?: Array<SelectOption>
        itemKey?: string
        dateLabel?: string
        tooltip?: string
        optionTooltips?: Record<string, string>
    }

    export interface SelectOption {
        label: string
        value: string | number
        tooltip?: string
    }
}

// Déclarations pour les composants
declare module '@/components/Tooltip.vue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{
        text: string
        position?: string
        delay?: number
    }>
    export default component
}

// Déclarations pour les services
declare module '@/services/alertService' {
    export const alertService: {
        success: (options: { title?: string; text: string; timer?: number }) => Promise<void>
        error: (options: { title?: string; text: string; timer?: number }) => Promise<void>
        warning: (options: { title?: string; text: string; timer?: number }) => Promise<void>
        info: (options: { title?: string; text: string; timer?: number }) => Promise<void>
        confirm: (options: { title?: string; text: string }) => Promise<{ isConfirmed: boolean }>
    }
}
