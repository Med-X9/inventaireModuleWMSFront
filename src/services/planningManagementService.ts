import type { Store } from '../interfaces/planningManagement';

class PlanningManagementService {
  async getStores(): Promise<Store[]> {
    // TODO: Replace with actual API call
    return [
      { id: 1, store_name: 'Magasin A' },
      { id: 2, store_name: 'Magasin B' },
      { id: 3, store_name: 'Magasin C' },
    ];
  }

  async assignTeams(storeId: number): Promise<void> {
    // TODO: Implement team assignment logic
    console.log('Assigning teams to store:', storeId);
  }
}

export const planningManagementService = new PlanningManagementService();