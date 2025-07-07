import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbConfig {
  [routeName: string]: BreadcrumbItem[];
}

// Configuration des breadcrumbs pour chaque route
const breadcrumbConfig: BreadcrumbConfig = {
  // Routes d'inventaire
  'inventory-create': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },
    { label: 'Création d\'inventaire', isActive: true },
   
  ],
  
  'inventory-detail': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },
    { label: 'INV-001' },
    { label: 'Détail de l\'inventaire', isActive: true },
  ],
  
  'inventory-edit': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },
    { label: 'INV-001' },
    { label: 'Modification d\'inventaire', isActive: true },
  ],
  
  'inventory-results': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },
    { label: 'INV-001' },
    { label: 'Résultats d\'inventaire', isActive: true },
  ],
  
  'planning-management': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },
     { label: 'INV-001' },
    { label: 'Gestion des plannings', isActive: true },
  ],

};

// Routes où le breadcrumb ne doit pas être affiché
const excludedRoutes = ['home', 'inventory-list', 'login'];

// Fonction pour récupérer le nom du magasin depuis le storeId
async function getStoreName(storeId: string | null): Promise<string> {
  if (!storeId) return 'Magasin inconnu';
  
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { planningManagementService } = await import('@/services/planningManagementService');
    const stores = await planningManagementService.getStores();
    const store = stores.find(s => s.id.toString() === storeId);
    return store ? store.store_name : `Magasin ${storeId}`;
  } catch (error) {
    console.warn('Erreur lors de la récupération du nom du magasin:', error);
    return `Magasin ${storeId}`;
  }
}

export function useBreadcrumb() {
  const route = useRoute();
  const router = useRouter();

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const routeName = route.name as string;
    
    // Si la route est exclue, ne retourne rien
    if (excludedRoutes.includes(routeName)) {
      return [];
    }

    // Gestion spéciale pour les routes de planning et d'affectation
    if (routeName === 'inventory-planning') {
      const storeId = route.query.storeId as string;
      const inventoryId = route.query.inventoryId as string || route.params.id as string;
      
      return [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Gestion des plannings', path: '/inventory/planning-management' },
           { label: `INV-${inventoryId || '001'}` },
        { label: storeId ? `Magasin ${storeId}` : 'Magasin' },
        { label: 'Planning d\'inventaire', isActive: true },
      ];
    }
    
    if (routeName === 'inventory-affecter') {
      const storeId = route.query.storeId as string;
      const inventoryId = route.query.inventoryId as string || route.params.id as string;
      
      return [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Gestion des plannings', path: '/inventory/planning-management' },
        { label: `INV-${inventoryId || '001'}` },
        { label: storeId ? `Magasin ${storeId}` : 'Magasin' },
        { label: 'Affectation des équipes', isActive: true },
      ];
    }

    // Si la route a une configuration spécifique
    if (breadcrumbConfig[routeName]) {
      return breadcrumbConfig[routeName];
    }

    // Configuration par défaut si aucune configuration spécifique n'existe
    return [
      { label: 'Gestion d\'inventaire', path: '/inventory/management' },
      { label: 'Page inconnue', isActive: true }
    ];
  });

  const shouldShowBreadcrumb = computed(() => {
    const routeName = route.name as string;
    return !excludedRoutes.includes(routeName) && breadcrumbItems.value.length > 0;
  });

  return {
    breadcrumbItems,
    shouldShowBreadcrumb
  };
}