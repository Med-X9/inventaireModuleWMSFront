import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { logger } from '@/services/loggerService';

export type InventoryStatus = 'EN PREPARATION' | 'EN REALISATION' | 'CLOTURE';

export interface InventoryStep {
    id: string;
    label: string;
    order: number;
    isActive: boolean;
    isCompleted: boolean;
}

export function useInventoryStatus() {
    const route = useRoute();

    // États pour les étapes d'inventaire (3 étapes seulement)
    const inventorySteps = ref<InventoryStep[]>([
        {
            id: 'preparation',
            label: 'Préparation',
            order: 1,
            isActive: false,
            isCompleted: false
        },
        {
            id: 'realisation',
            label: 'Réalisation',
            order: 2,
            isActive: false,
            isCompleted: false
        },
        {
            id: 'cloture',
            label: 'Clôture',
            order: 3,
            isActive: false,
            isCompleted: false
        }
    ]);

    // Computed pour déterminer si on doit afficher les étapes
    const shouldShowSteps = computed(() => {
        // Afficher les étapes seulement sur les pages d'inventaire
        const inventoryRoutes = [
            'inventory-detail',
            'inventory-results',
            'inventory-planning',
            'inventory-affecter',
            'planning-management'
        ];
        return inventoryRoutes.includes(route.name as string);
    });

    // Fonction pour mettre à jour le statut depuis l'inventaire
    const updateStatusFromInventory = async () => {
        try {
            // TODO: Récupérer le statut réel de l'inventaire depuis l'API
            // Pour l'instant, on utilise des valeurs par défaut
            const currentStatus: InventoryStatus = 'EN PREPARATION'; // À remplacer par le vrai statut

            // Mettre à jour les étapes selon le statut
            inventorySteps.value.forEach(step => {
                step.isActive = false;
                step.isCompleted = false;
            });

            switch (currentStatus as string) {
                case 'EN PREPARATION':
                    inventorySteps.value[0].isActive = true;
                    break;
                case 'EN REALISATION':
                    inventorySteps.value[0].isCompleted = true;
                    inventorySteps.value[1].isActive = true;
                    break;
                case 'CLOTURE':
                    inventorySteps.value[0].isCompleted = true;
                    inventorySteps.value[1].isCompleted = true;
                    inventorySteps.value[2].isActive = true;
                    break;
                default:
                    inventorySteps.value[0].isActive = true;
            }
        } catch (error) {
            logger.error('Erreur lors de la mise à jour du statut', error);
        }
    };

    return {
        inventorySteps,
        shouldShowSteps,
        updateStatusFromInventory
    };
}
