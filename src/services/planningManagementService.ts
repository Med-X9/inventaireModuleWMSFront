import type { Store } from '@/interfaces/planningManagement';
import router from '@/router' 

export class PlanningManagementService {
  private static readonly MOCK_STORES: Store[] = [
    { id: 1, store_name: 'Magasin A', teams_count: 5, jobs_count: 12 },
    { id: 2, store_name: 'Magasin B', teams_count: 3, jobs_count: 8 },
    { id: 3, store_name: 'Magasin C', teams_count: 7, jobs_count: 15 },
  ];

  async getStores(): Promise<Store[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...PlanningManagementService.MOCK_STORES];
  }

  // async assignTeams(storeId: number): Promise<void> {
  //   await new Promise(resolve => setTimeout(resolve, 50));
  //   console.log(`Assigning teams to store ${storeId}`);
  // }

  // navigateToPlanning(storeId: number): void {
  //   router.push({
  //     name: 'inventory-planning',
  //     params: { storeId: storeId.toString() }
  //   })
  // }
}

export const planningManagementService = new PlanningManagementService();