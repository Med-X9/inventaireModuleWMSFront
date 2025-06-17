import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

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

// Routes où les étapes d'inventaire ne doivent pas être affichées
const excludedRoutesForSteps = ['home', 'login'];

// Simulation d'un store pour les statuts d'inventaire (à remplacer par votre vraie logique)
const inventoryStatuses = ref<Record<string, InventoryStatus>>({
  // Par défaut, on simule quelques inventaires avec différents statuts
  'default': {
    currentStep: 'preparation',
    steps: [...defaultSteps]
  }
});

export function useInventoryStatus() {
  const route = useRoute();

  // Fonction pour obtenir l'ID de l'inventaire actuel depuis la route
  const getCurrentInventoryId = (): string => {
    // Si on est sur une page de détail d'inventaire, on récupère l'ID
    if (route.params.id) {
      return route.params.id as string;
    }
    // Sinon, on utilise un ID par défaut ou on pourrait récupérer depuis le store global
    return 'default';
  };

  // Status actuel de l'inventaire
  const currentInventoryStatus = computed(() => {
    const inventoryId = getCurrentInventoryId();
    return inventoryStatuses.value[inventoryId] || {
      currentStep: 'preparation',
      steps: [...defaultSteps]
    };
  });

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

  // Fonction pour avancer à l'étape suivante
  const nextStep = () => {
    const inventoryId = getCurrentInventoryId();
    const currentStatus = inventoryStatuses.value[inventoryId];
    if (!currentStatus) return;

    const currentStepOrder = currentStatus.steps.find(step => step.id === currentStatus.currentStep)?.order || 1;
    const nextStepData = currentStatus.steps.find(step => step.order === currentStepOrder + 1);
    
    if (nextStepData) {
      inventoryStatuses.value[inventoryId] = {
        ...currentStatus,
        currentStep: nextStepData.id
      };
    }
  };

  // Fonction pour définir une étape spécifique
  const setStep = (stepId: string) => {
    const inventoryId = getCurrentInventoryId();
    const currentStatus = inventoryStatuses.value[inventoryId];
    if (!currentStatus) return;

    const stepExists = currentStatus.steps.some(step => step.id === stepId);
    if (stepExists) {
      inventoryStatuses.value[inventoryId] = {
        ...currentStatus,
        currentStep: stepId
      };
    }
  };

  // Fonction pour initialiser un nouveau statut d'inventaire
  const initializeInventoryStatus = (inventoryId: string, initialStep: string = 'preparation') => {
    inventoryStatuses.value[inventoryId] = {
      currentStep: initialStep,
      steps: [...defaultSteps]
    };
  };

  return {
    inventorySteps,
    shouldShowSteps,
    currentInventoryStatus,
    nextStep,
    setStep,
    initializeInventoryStatus
  };
}