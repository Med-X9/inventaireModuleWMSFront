export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'checkbox' | 'radio' | 'button-group';
  options?: Array<string | SelectOption>;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  props?: Record<string, unknown>;
  validators?: Array<{ key: string; fn: (value: unknown) => boolean; msg: string }>;
}

export interface SelectOption {
  label: string;
  value: string | number;
}