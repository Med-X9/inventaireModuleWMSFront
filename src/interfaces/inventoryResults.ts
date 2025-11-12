export interface StoreOption {
  label: string;
  value: string;
}

export interface InventoryResult extends Record<string, any> {
  id: number | string;
  jobId: number | string;
  emplacement: string;
  article?: string;
  product?: string;
  final_result: number | null;
  resultats?: number | null;
}

export interface ResultAction {
  label: string;
  icon: any;
  onClick: (row: any) => void | Promise<void>;
  color?: 'primary' | 'secondary' | 'danger';
}
