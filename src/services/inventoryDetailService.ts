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
            stock: false,           // added stock
          } as ContageConfig,
          {
            mode: 'article + emplacement',
            isVariant: true,
            useScanner: false,
            useSaisie: false,
            stock: true,            // added stock
          } as ContageConfig,
          {
            mode: 'liste emplacement',
            isVariant: false,
            useScanner: false,
            useSaisie: true,
            stock: false,           // added stock
          } as ContageConfig
        ],
        teams: [
          { id: 1, name: 'Équipe Scanner' },
          { id: 2, name: 'Équipe Contrôle' },
          { id: 3, name: 'Équipe Saisie' }
        ]
      },
      magasins: [
        'Magasin Central',
        'Dépôt Nord',
        'Entrepôt Sud'
      ],
      jobsData: {
        contage1: [
          { name: 'Préparation zone', status: 'Terminé', date: '2025-04-30', operator: 'Jean D.' },
          { name: 'Scan emplacements', status: 'En cours', date: '2025-04-30', operator: 'Marie L.' },
          { name: 'Vérification', status: 'En attente', date: '2025-04-30', operator: 'Pierre M.' }
        ],
        contage2: [
          { name: 'Scan articles', status: 'En attente', date: '2025-05-01', operator: 'Sophie R.' },
          { name: 'Contrôle quantités', status: 'En attente', date: '2025-05-01', operator: 'Luc B.' }
        ],
        contage3: [
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
