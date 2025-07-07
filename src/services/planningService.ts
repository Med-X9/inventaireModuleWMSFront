import type { Job } from '../interfaces/planning';

export const planningService = {
    // Sauvegarder les jobs dans le backend
    async saveJobs(jobs: Job[]): Promise<void> {
        // Simulation de sauvegarde
        await new Promise(resolve => setTimeout(resolve, 500));

        // Ici, vous feriez un appel API réel
        // await api.post('/planning/jobs', { jobs });
    },

    // Charger les jobs validés depuis le backend
    async loadValidatedJobs(): Promise<Job[]> {
        // Simulation de chargement
        await new Promise(resolve => setTimeout(resolve, 300));

        // Retourner des jobs simulés
        return [
            { id: 1, name: 'Job 1', status: 'validated' },
            { id: 2, name: 'Job 2', status: 'validated' },
        ];
    },

    // Générer des emplacements pour un job
    generateLocations(jobId: number, count: number): Location[] {
        const locations: Location[] = [];
        for (let i = 1; i <= count; i++) {
            locations.push({
                id: `${jobId}-${i}`,
                name: `Emplacement ${i}`,
                status: 'available'
            });
        }
        return locations;
    },

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
    },

    parseLocation(location: string) {
        const [emplacement, zone, sousZone] = location.split(' | ');
        return { emplacement, zone, sousZone };
    }
};
