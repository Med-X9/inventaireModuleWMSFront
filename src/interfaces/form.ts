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
  // Generic multi-select with dates configuration
  itemKey?: string; // Key name for the item in the data structure (default: 'item')
  dateLabel?: string; // Label for the dates section (default: 'Dates par élément')
  tooltip?: string;
  optionTooltips?: Record<string, string>; // Tooltips for individual options
}

export interface SelectOption {
  label: string;
  value: string | number;
  tooltip?: string; // Tooltip for individual option
}

export interface ItemWithDate {
  [key: string]: string; // Generic item key with string value
  date: string;
}