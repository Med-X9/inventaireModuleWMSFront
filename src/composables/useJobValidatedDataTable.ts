/**
 * Composable pour la gestion des jobs validés avec DataTable
 * Utilise useGenericDataTable avec configuration spécifique
 */

import { useGenericDataTable } from './useInventoryDataTable';
import { useJobStore } from '@/stores/job';
import type { JobResult } from '@/models/Job';

export function useJobValidatedDataTable(inventoryId: number, warehouseId: number) {
    const jobStore = useJobStore();

    // Utiliser le composable générique avec configuration spécifique pour les jobs validés
    return useGenericDataTable<JobResult>({
        store: jobStore,
        fetchAction: 'fetchJobsValidated',
        defaultPageSize: 20,
        additionalParams: {
            inventoryId,
            warehouseId
        }
    });
}
