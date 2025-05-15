import type { DetailData } from '@/interfaces/Detail';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';

class DetailService {
  private mockInventories: InventoryManagement[] = [
    {
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
        { mode: 'liste emplacement', isVariant: false, useScanner: true, useSaisie: false },
        { mode: 'article + emplacement', isVariant: true, useScanner: false, useSaisie: false },
        { mode: 'liste emplacement', isVariant: false, useScanner: false, useSaisie: true }
      ]
    }
  ];

  private mockMagasins = [
    'Magasin Central',
    'Dépôt Nord',
    'Entrepôt Sud'
  ];

  private mockJobsData: DetailData['jobsData'] = {
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
  };

  async getInventoryDetail(id: number): Promise<DetailData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          inventory: this.mockInventories[0],
          magasins: this.mockMagasins,
          jobsData: this.mockJobsData
        });
      }, 300);
    });
  }

  async launchInventory(inventory: DetailData['inventory']): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 300);
    });
  }
}

export const detailService = new DetailService();