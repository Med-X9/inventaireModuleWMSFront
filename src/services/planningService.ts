import type { PlanningState } from '../interfaces/planning';
import { alertService } from './alertService';

class PlanningService {
  async savePlanning(planningData: PlanningState): Promise<void> {
    try {
      // TODO: Replace with actual API call
      console.log('Saving planning:', planningData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await alertService.success({
        text: 'Planning enregistré avec succès'
      });
    } catch (error) {
      throw new Error('Erreur lors de l\'enregistrement du planning');
    }
  }

  getLocations(): string[] {
    return ['Rayon A', 'Rayon B', 'Rayon C', 'Rayon D', 'Stock Principal', 'Réserve'];
  }
}

export const planningService = new PlanningService();