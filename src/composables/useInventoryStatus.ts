import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { inventoryManagementService } from '../services/inventoryManagementService';
import type { InventoryManagement } from '../interfaces/inventoryManagement';

export interface InventoryStep {
  id: string;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
  order: number;
}

export interface InventoryStatus {
  currentStep: string;
  steps: InventoryStep[];
}

// Configuration par défaut des étapes d'inventaire
const defaultSteps: InventoryStep[] = [
  {
    id: 'preparation',
    label: 'En préparation',
    isCompleted: false,
    isActive: true,
    order: 1
  },
  {
    id: 'realisation',
    label: 'Réalisation',
    isCompleted: false,
    isActive: false,
    order: 2
  },
  {
    id: 'termine',
    label: 'Terminé',
    isCompleted: false,
    isActive: false,
    order: 3
  }
];

// Routes où les J'ai terminé la gestion dynamique des actions et de la sous-navigation selon le statut d'un inventairene doivent pas être affichées
const excludedRoutesForSteps = ['home', 'login'];

// Mapping des statuts vers les étapes
const statusToStepMap: Record<string, string> = {
  'En préparation': 'preparation',
  'En réalisation': 'realisation',
  'Terminé': 'termine',
  'Clôturé': 'termine'
};

// Cache pour les inventaires chargés
const inventoryCache = ref<Record<string, InventoryManagement>>({});

export function useInventoryStatus() {
  const route = useRoute();

  // Fonction pour obtenir l'ID de l'inventaire actuel depuis la route
  const getCurrentInventoryId = (): string => {
    if (route.params.id) {
      return route.params.id as string;
    }
    return 'default';
  };

  // Fonction pour charger un inventaire par son ID
  const loadInventory = async (inventoryId: string): Promise<InventoryManagement | null> => {
    // Si c'est l'ID par défaut, on retourne null
    if (inventoryId === 'default') {
      return null;
    }

    // Vérifier le cache d'abord
    if (inventoryCache.value[inventoryId]) {
      return inventoryCache.value[inventoryId];
    }

    try {
      // Charger tous les inventaires et trouver celui qui correspond
      const inventories = await inventoryManagementService.getInventories();
      const inventory = inventories.find(inv => inv.id.toString() === inventoryId);

      if (inventory) {
        // Mettre en cache
        inventoryCache.value[inventoryId] = inventory;
        return inventory;
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
    }

    return null;
  };

  // Fonction pour convertir le statut en étape
  const getStepFromStatus = (status: string): string => {
    return statusToStepMap[status] || 'preparation';
  };

  // Status actuel de l'inventaire (computed asynchrone géré manuellement)
  const currentInventoryStatus = ref<InventoryStatus>({
    currentStep: 'preparation',
    steps: [...defaultSteps]
  });

  // Fonction pour mettre à jour le statut basé sur l'inventaire réel
  const updateStatusFromInventory = async () => {
    const inventoryId = getCurrentInventoryId();

    if (inventoryId === 'default') {
      // Utiliser le statut par défaut
      currentInventoryStatus.value = {
        currentStep: 'preparation',
        steps: [...defaultSteps]
      };
      return;
    }

    const inventory = await loadInventory(inventoryId);

    if (inventory) {
      const currentStep = getStepFromStatus(inventory.status);
      currentInventoryStatus.value = {
        currentStep,
        steps: [...defaultSteps]
      };
    } else {
      // Fallback si l'inventaire n'est pas trouvé
      currentInventoryStatus.value = {
        currentStep: 'preparation',
        steps: [...defaultSteps]
      };
    }
  };

  // Étapes avec leur statut mis à jour
  const inventorySteps = computed(() => {
    const status = currentInventoryStatus.value;
    const currentStepOrder = status.steps.find(step => step.id === status.currentStep)?.order || 1;

    return status.steps.map(step => ({
      ...step,
      isCompleted: step.order < currentStepOrder,
      isActive: step.id === status.currentStep
    }));
  });

  // Vérifier si on doit afficher les étapes
  const shouldShowSteps = computed(() => {
    const routeName = route.name as string;
    return !excludedRoutesForSteps.includes(routeName);
  });

  // Fonction pour avancer à l'étape suivante (mise à jour de l'inventaire réel)
  const nextStep = async () => {
    const inventoryId = getCurrentInventoryId();
    if (inventoryId === 'default') return;

    const inventory = await loadInventory(inventoryId);
    if (!inventory) return;

    const currentStatus = currentInventoryStatus.value;
    const currentStepOrder = currentStatus.steps.find(step => step.id === currentStatus.currentStep)?.order || 1;
    const nextStepData = currentStatus.steps.find(step => step.order === currentStepOrder + 1);

    if (nextStepData) {
      // Mapping des étapes vers les statuts
      const stepToStatusMap: Record<string, string> = {
        'preparation': 'En préparation',
        'realisation': 'En réalisation',
        'termine': 'Terminé'
      };

      const newStatus = stepToStatusMap[nextStepData.id];
      if (newStatus) {
        try {
          // Mettre à jour l'inventaire via le service
          await inventoryManagementService.updateInventory(inventory.id, { status: newStatus });

          // Invalider le cache
          delete inventoryCache.value[inventoryId];

          // Recharger le statut
          await updateStatusFromInventory();
        } catch (error) {
          console.error('Erreur lors de la mise à jour du statut:', error);
        }
      }
    }
  };

  // Fonction pour définir une étape spécifique
  const setStep = async (stepId: string) => {
    const inventoryId = getCurrentInventoryId();
    if (inventoryId === 'default') return;

    const inventory = await loadInventory(inventoryId);
    if (!inventory) return;

    const stepToStatusMap: Record<string, string> = {
      'preparation': 'En préparation',
      'realisation': 'En réalisation',
      'termine': 'Terminé'
    };

    const newStatus = stepToStatusMap[stepId];
    if (newStatus) {
      try {
        // Mettre à jour l'inventaire via le service
        await inventoryManagementService.updateInventory(inventory.id, { status: newStatus });

        // Invalider le cache
        delete inventoryCache.value[inventoryId];

        // Recharger le statut
        await updateStatusFromInventory();
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
    }
  };

  // Fonction pour initialiser un nouveau statut d'inventaire
  const initializeInventoryStatus = async (inventoryId: string, initialStep: string = 'preparation') => {
    // Cette fonction peut maintenant charger le vrai statut depuis la base
    await updateStatusFromInventory();
  };

  // Fonction pour rafraîchir le statut (utile après navigation)
  const refreshStatus = async () => {
    await updateStatusFromInventory();
  };

  return {
    inventorySteps,
    shouldShowSteps,
    currentInventoryStatus: computed(() => currentInventoryStatus.value),
    nextStep,
    setStep,
    initializeInventoryStatus,
    refreshStatus,
    updateStatusFromInventory
  };
}
