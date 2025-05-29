import type { Store, Job } from '@/interfaces/planningManagement';
import router from '@/router';

export class PlanningManagementService {
  private static readonly MOCK_STORES: Store[] = [
    { id: 1, store_name: 'Magasin A', teams_count: 5, jobs_count: 12 },
    { id: 2, store_name: 'Magasin B', teams_count: 3, jobs_count: 8 },
    { id: 3, store_name: 'Magasin C', teams_count: 7, jobs_count: 15 }
  ];

  // Stub jobs data per store
  private static readonly MOCK_JOBS: Record<number, Job[]> = {
    1: [
      { id: 101, name: 'Job A1', status: 'pending' },
      { id: 102, name: 'Job A2', status: 'done' }
    ],
    2: [
      { id: 201, name: 'Job B1', status: 'pending' }
    ],
    3: [
      { id: 301, name: 'Job C1', status: 'pending' },
      { id: 302, name: 'Job C2', status: 'pending' },
      { id: 303, name: 'Job C3', status: 'done' }
    ]
  };

  /**
   * Retourne la liste des magasins
   */
  async getStores(): Promise<Store[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...PlanningManagementService.MOCK_STORES];
  }

  /**
   * Retourne les jobs pour un magasin donné
   */
  async getJobsByStore(storeId: number): Promise<Job[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return PlanningManagementService.MOCK_JOBS[storeId] || [];
  }

  /**
   * Lance un job spécifique pour un magasin
   */
  async launchJob(storeId: number, jobId: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    // Simule la modification du statut en 'running'
     const jobs = PlanningManagementService.MOCK_JOBS[storeId];
    if (jobs) {
      const job = jobs.find(j => j.id === jobId);
      if (job) job.status = 'running';
    }
  }

  /**
   * Lance plusieurs jobs pour un magasin
   */
  async launchJobsForStore(storeId: number, jobIds: number[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
     const jobs = PlanningManagementService.MOCK_JOBS[storeId];
    if (jobs) {
      jobs.forEach(j => {
        if (jobIds.includes(j.id)) j.status = 'running';
      });
    }
  }

  /**
   * Permet de naviguer vers la gestion des plannings
   */
  navigateToPlanning(storeId: number): void {
    router.push({
      name: 'inventory-planning',
      query: { storeId: storeId.toString() }
    });
  }
}

export const planningManagementService = new PlanningManagementService();
