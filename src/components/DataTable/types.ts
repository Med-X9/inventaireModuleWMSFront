// src/components/DataTable/types.ts

import { DefineComponent } from 'vue';

export type ActionConfig =
  | {
      icon: DefineComponent<{}, {}, any>;  // Change ici
      type: 'router-link';
      to: (row: Record<string, unknown>) => string;
      class?: string;
    }
  | {
      icon: DefineComponent<{}, {}, any>;  // Change ici aussi
      type: 'button';
      handler: (row: Record<string, unknown>) => void;
      class?: string;
    };
