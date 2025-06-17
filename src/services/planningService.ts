import type { Job } from '../interfaces/planning';

class PlanningService {
  async saveJobs(jobs: Job[]): Promise<void> {
    try {
      console.log('Saving jobs to backend (simulation):', jobs);
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Remplacer par un vrai appel API
      // const response = await fetch('/api/planning/jobs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ jobs })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to save jobs');
      // }
      
      console.log(`${jobs.length} job(s) sauvé(s) avec succès`);
    } catch (error) {
      throw new Error('Erreur lors de la validation des jobs');
    }
  }

  async getValidatedJobs(): Promise<Job[]> {
    try {
      console.log('Loading validated jobs from backend (simulation)');
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // TODO: Remplacer par un vrai appel API
      // const response = await fetch('/api/planning/jobs');
      // if (!response.ok) {
      //   throw new Error('Failed to load jobs');
      // }
      // return await response.json();
      
      // Pour l'instant, retourner un tableau vide
      return [];
    } catch (error) {
      throw new Error('Erreur lors du chargement des jobs');
    }
  }

  getLocations(): string[] {
    const baseLocations = [
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

    // Générer plus de données avec des variations
    const expandedLocations: string[] = [];
    
    // Ajouter les emplacements de base
    expandedLocations.push(...baseLocations);
    
    // Générer des variations pour chaque zone
    const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const emplacements = [
      'Stock Principal', 'Réserve', 'Stock Saisonnier', 'Stock Promotions',
      'Rayon A1', 'Rayon A2', 'Rayon B1', 'Rayon B2', 'Rayon C1', 'Rayon C2',
      'Réception', 'Expédition', 'Stock Textile', 'Stock Accessoires',
      'Zone Picking', 'Zone Préparation', 'Zone Contrôle', 'Zone Emballage'
    ];
    const sousZones = [
      'Entrepôt Nord', 'Entrepôt Sud', 'Entrepôt Est', 'Entrepôt Ouest',
      'Magasin Principal', 'Magasin Annexe', 'Quai Nord', 'Quai Sud',
      'Centre Logistique', 'Plateforme Distribution', 'Zone Stockage',
      'Espace Commercial', 'Secteur Industriel'
    ];

    // Générer des combinaisons supplémentaires
    for (let i = 0; i < 100; i++) {
      const emplacement = emplacements[Math.floor(Math.random() * emplacements.length)];
      const zone = `Zone ${zones[Math.floor(Math.random() * zones.length)]}`;
      const sousZone = sousZones[Math.floor(Math.random() * sousZones.length)];
      
      // Ajouter un numéro pour éviter les doublons
      const location = `${emplacement} ${i + 1} | ${zone} | ${sousZone}`;
      expandedLocations.push(location);
    }

    return expandedLocations;
  }

  parseLocation(location: string) {
    const [emplacement, zone, sousZone] = location.split(' | ');
    return { emplacement, zone, sousZone };
  }
}

export const planningService = new PlanningService();