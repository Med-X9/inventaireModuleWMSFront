import { alertService } from './alertService';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';
import type { DetailData } from '@/interfaces/Detail';

class InventoryDetailService {
  async getInventoryDetail(id: number): Promise<DetailData> {
    // Static data for now
    return {
      inventory: {
        id: 1,
        reference: 'INV-2025-001',
        inventory_date: '2025-12-20',
        statut: 'En préparation',
        label: 'Inventaire général 2025',
        type: 'Inventaire Général',
        date_creation: '2025-06-24',
        date_lancement: '',
        date_echeance: '',
        date_cloture: '',
        comptages: [
          {
            mode: 'image de stock',
            inputMethod: '',
            guideQuantite: false,
            isVariante: false,
            guideArticle: false,
            dlc: false,
            numeroSerie: false,
            numeroLot: false,
            saisieQuantite: false,
            scannerUnitaire: false,
          } as ComptageConfig,
          {
            mode: 'en vrac',
            inputMethod: 'scanner',
            guideQuantite: true,
            isVariante: false,
            guideArticle: false,
            dlc: false,
            numeroSerie: false,
            numeroLot: false,
            saisieQuantite: false,
            scannerUnitaire: true,
          } as ComptageConfig,
          {
            mode: 'par article',
            inputMethod: '',
            guideQuantite: true,
            isVariante: true,
            guideArticle: false,
            dlc: false,
            numeroSerie: false,
            numeroLot: false,
            saisieQuantite: false,
            scannerUnitaire: false,
          } as ComptageConfig
        ],
        teams: [
          { id: 1, name: 'Équipe 1' },
          { id: 2, name: 'Équipe 2' },
          { id: 3, name: 'Équipe 3' },
          { id: 4, name: 'Équipe 4' },
          { id: 5, name: 'Équipe 5' },
          { id: 6, name: 'Équipe 6' },
          { id: 7, name: 'Équipe 7' },
          { id: 8, name: 'Équipe 8' },
          { id: 9, name: 'Équipe 9' },
          { id: 10, name: 'Équipe 10' }
        ]
      },
      magasins: [
        'Magasin 1',
        'Magasin 2',
        'Magasin 3',
        'Magasin 4',
        'Magasin 5',
        'Magasin 6',
        'Magasin 7',
        'Magasin 8'
      ],
      jobsData: {
        comptage1: [
          { name: 'Préparation zone', status: 'Terminé', date: '2025-12-20', operator: 'Jean D.' },
          { name: 'Scan emplacements', status: 'En cours', date: '2025-12-20', operator: 'Marie L.' },
          { name: 'Vérification', status: 'En attente', date: '2025-12-20', operator: 'Pierre M.' }
        ],
        comptage2: [
          { name: 'Scan articles', status: 'En attente', date: '2025-12-21', operator: 'Sophie R.' },
          { name: 'Contrôle quantités', status: 'En attente', date: '2025-12-21', operator: 'Luc B.' }
        ],
        comptage3: [
          { name: 'Validation finale', status: 'En attente', date: '2025-12-22', operator: 'Anne C.' }
        ]
      }
    };
  }

  async launchInventory(inventory: InventoryManagement): Promise<boolean> {
    try {
      const result = await alertService.confirm({
        title: 'Lancer l\'inventaire',
        text: `Voulez-vous vraiment lancer l'inventaire "${inventory.label}" ?`
      });

      if (result.isConfirmed) {
        await alertService.success({
          text: 'L\'inventaire a été lancé avec succès'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      await alertService.error({
        text: 'Une erreur est survenue lors du lancement de l\'inventaire'
      });
      return false;
    }
  }

  async cancelInventory(): Promise<boolean> {
    try {
      const result = await alertService.confirm({
        title: 'Annuler l\'inventaire',
        text: 'Êtes-vous sûr de vouloir annuler le lancement de l\'inventaire ?'
      });

      if (result.isConfirmed) {
        await alertService.success({
          text: 'L\'inventaire a été annulé'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      await alertService.error({
        text: 'Une erreur est survenue lors de l\'annulation'
      });
      return false;
    }
  }

  async terminateInventory(inventory: InventoryManagement): Promise<boolean> {
    try {
      const result = await alertService.confirm({
        title: 'Terminer l\'inventaire',
        text: `Voulez-vous vraiment terminer l'inventaire "${inventory.label}" ?`
      });

      if (result.isConfirmed) {
        await alertService.success({
          text: 'L\'inventaire a été terminé avec succès'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      await alertService.error({
        text: 'Une erreur est survenue lors de la fin de l\'inventaire'
      });
      return false;
    }
  }

  async closeInventory(inventory: InventoryManagement): Promise<boolean> {
    try {
      const result = await alertService.confirm({
        title: 'Clôturer l\'inventaire',
        text: `Voulez-vous vraiment clôturer définitivement l'inventaire "${inventory.label}" ?`
      });

      if (result.isConfirmed) {
        await alertService.success({
          text: 'L\'inventaire a été clôturé avec succès'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      await alertService.error({
        text: 'Une erreur est survenue lors de la clôture de l\'inventaire'
      });
      return false;
    }
  }
}

export const inventoryDetailService = new InventoryDetailService();