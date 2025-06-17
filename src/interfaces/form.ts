export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'checkbox' | 'radio' | 'button-group' | 'radio-group' | 'multi-select-with-dates';
  options?: Array<string | SelectOption>;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  props?: Record<string, unknown>;
  validators?: Array<{ key: string; fn: (value: unknown) => boolean; msg: string }>;
  min?: string;
  max?: string;
  defaultDate?: string;
  enableTime?: boolean;
  dateFormat?: string;
  gridCols?: number; // For controlling grid layout
  radioOptions?: Array<SelectOption>; // For radio-group type
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface MagasinWithDate {
  magasin: string;
  date: string;
}