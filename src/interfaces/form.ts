// src/interfaces/form.ts

export interface SelectOption {
    label: string;
    value: any;
  }
  
  export interface FieldConfig {
    key: string;
    label: string;
    type: 'text' | 'email' | 'checkbox' | 'select' | 'date';
    options?: Array<string | SelectOption>;
    props?: Record<string, any>;
    searchable?: boolean;   // active/désactive la barre de recherche
    clearable?: boolean;    // active/désactive le bouton “×”
    multiple?: boolean;     // autorise la sélection multiple
  }
  
  export interface FormProps {
    fields: FieldConfig[];
    initialData?: Record<string, any>;
    title?: string;
    submitLabel?: string;
    hideSubmit?: boolean;
  }
  