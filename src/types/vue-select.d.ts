// src/types/vue-select.d.ts

declare module 'vue-select' {
    import { DefineComponent } from 'vue';

    interface VueSelectProps {
        modelValue?: any;
        options?: any[];
        multiple?: boolean;
        searchable?: boolean;
        clearable?: boolean;
        placeholder?: string;
        disabled?: boolean;
        loading?: boolean;
        label?: string;
        reduce?: (option: any) => any;
        filter?: (option: any, label: string, search: string) => boolean;
    }

    interface VueSelectEmits {
        'update:modelValue': (value: any) => void;
        'search': (search: string) => void;
        'open': () => void;
        'close': () => void;
    }

    // Types pour les slots avec des propriétés optionnelles
    interface VueSelectSlots {
        option: { option?: any };
        'selected-option': { option?: any };
        value: { option?: any };
        'no-options': {};
        search: { attributes?: any; events?: any };
    }

    const VueSelect: DefineComponent<VueSelectProps, {}, {}, {}, {}, {}, {}, VueSelectEmits, string, {}, {}, VueSelectSlots>;

    export default VueSelect;
}
