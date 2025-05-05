import { alertService } from './alertService';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';

class InventoryDetailService {
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
}

export const inventoryDetailService = new InventoryDetailService();