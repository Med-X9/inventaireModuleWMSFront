// src/services/inventoryDetailService.ts

import { alertService } from './alertService';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';
import type { ContageConfig } from '@/interfaces/inventoryCreation';
import type { DetailData } from '@/interfaces/Detail';

class InventoryDetailService {
  async getInventoryDetail(id: number): Promise<DetailData> {
    // Static data for now
    return {
      inventory: {
        id: 1,
        reference: 'INV-001',
        inventory_date: '2025-04-30',
        statut: 'En attente',
        label: 'Inventaire de printemps',
        type: 'Inventaire Général',
        pending_status_date: '2025-04-30',
        current_status_date: '2025-04-30',
        date_status_launch: '2025-04-30',
        date_status_end: '2025-04-30',
        contages: [
          {
            mode: 'liste emplacement',
            isVariant: false,
            useScanner: true,
            useSaisie: false,
            stock: false,
          } as ContageConfig,
          {
            mode: 'article + emplacement',
            isVariant: true,
            useScanner: false,
            useSaisie: false,
            stock: false,
          } as ContageConfig,
          {
            mode: 'liste emplacement',
            isVariant: false,
            useScanner: false,
            useSaisie: true,
            stock: false,
          } as ContageConfig
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
          { name: 'Préparation zone', status: 'Terminé', date: '2025-04-30', operator: 'Jean D.' },
          { name: 'Scan emplacements', status: 'En cours', date: '2025-04-30', operator: 'Marie L.' },
          { name: 'Vérification', status: 'En attente', date: '2025-04-30', operator: 'Pierre M.' }
        ],
        comptage2: [
          { name: 'Scan articles', status: 'En attente', date: '2025-05-01', operator: 'Sophie R.' },
          { name: 'Contrôle quantités', status: 'En attente', date: '2025-05-01', operator: 'Luc B.' }
        ],
        comptage3: [
          { name: 'Validation finale', status: 'En attente', date: '2025-05-02', operator: 'Anne C.' }
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
}

export const inventoryDetailService = new InventoryDetailService();