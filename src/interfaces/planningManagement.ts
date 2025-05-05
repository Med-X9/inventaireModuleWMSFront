import type { Component } from 'vue';

/**
 * Represents a store with planning management data
 */
export interface Store {
  id: number;
  store_name: string;
  teams_count: number;
  jobs_count: number;
  [key: string]: unknown;
}

/**
 * Action available for each planning item
 */
export interface PlanningAction {
  label: string;
  icon?: Component;
  handler: (store: Store) => void;
}

/**
 * Available display modes
 */
export interface ViewMode {
  table: 'table';
  grid: 'grid';
}

export type ViewModeType = keyof ViewMode;