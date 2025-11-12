import type { FieldConfig as FormFieldConfig } from './form';

export type FieldConfig = FormFieldConfig;

export interface StepConfig {
    availableModes: string[];
    modeLocked: boolean;
    fields: FieldConfig[];
    help: string;
    values: any;
}
