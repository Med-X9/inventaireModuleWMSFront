/**
 * Composable spécialisé pour la gestion DataTable des locations
 */
import { useGenericDataTable } from './useInventoryDataTable';
import { useLocationStore } from '@/stores/location';
import type { Location } from '@/models/Location';

export function useLocationDataTable() {
    const locationStore = useLocationStore();

    return useGenericDataTable<Location>({
        store: locationStore,
        fetchAction: 'fetchLocations',
        defaultPageSize: 20
    });
}

