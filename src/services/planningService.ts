import type { PlanningState } from '../interfaces/planning';
import { alertService } from './alertService';

class PlanningService {
  async savePlanning(planningData: PlanningState): Promise<void> {
    try {
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
    return [
      'Stock Principal | Zone A | Entrepôt Nord',
      'Stock Principal | Zone B | Entrepôt Nord',
      'Réserve | Zone C | Entrepôt Sud',
      'Réserve | Zone D | Entrepôt Sud',
      'Rayon A1 | Zone E | Magasin Principal',
      'Rayon A2 | Zone E | Magasin Principal',
      'Rayon B1 | Zone F | Magasin Principal',
      'Rayon B2 | Zone F | Magasin Principal',
      'Stock Saisonnier | Zone G | Entrepôt Est',
      'Stock Promotions | Zone G | Entrepôt Est',
      'Réception | Zone H | Quai Nord',
      'Expédition | Zone H | Quai Sud',
      'Stock Textile | Zone I | Entrepôt Ouest',
      'Stock Accessoires | Zone I | Entrepôt Ouest',
      'Rayon C1 | Zone J | Magasin Annexe',
      'Rayon C2 | Zone J | Magasin Annexe'
    ];
  }

  parseLocation(location: string) {
    const [emplacement, zone, sousZone] = location.split(' | ');
    return { emplacement, zone, sousZone };
  }
}

export const planningService = new PlanningService();