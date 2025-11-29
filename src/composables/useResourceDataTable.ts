/**
 * Composable spécialisé pour la gestion DataTable des ressources
 */
import { useGenericDataTable } from './useInventoryDataTable';
import { useResourceStore } from '@/stores/resource';
import type { Resource } from '@/models/Resource';

export function useResourceDataTable() {
    const resourceStore = useResourceStore();

    return useGenericDataTable<Resource>({
        store: resourceStore,
        fetchAction: 'fetchResources',
        defaultPageSize: 20,
        queryOutputMode: 'queryParams' // Format EXEMPLES_REQUETES_QUERYMODEL
    });
}

