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

    { label: 'Détail de l\'inventaire', isActive: true },
    { label: 'INV-001' },
  ],
  
  'inventory-edit': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },

    { label: 'Modification d\'inventaire', isActive: true },
    { label: 'INV-001' },
  ],
  
  'inventory-results': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },

    { label: 'Résultats d\'inventaire', isActive: true },
    { label: 'INV-001' },
  ],
  
  'inventory-planning': [
  
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },

    { label: 'Gestion des plannings', path: '/inventory/planning-management' },
    { label: 'Planning d\'inventaire', isActive: true },
    { label: 'INV-001' },
  ],
  
  'inventory-affecter': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },

    { label: 'Gestion des plannings', path: '/inventory/planning-management' },
    { label: 'Affectation des équipes', isActive: true },
    { label: 'INV-001' },
  ],
  
  'planning-management': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },
    { label: 'Gestion des plannings', isActive: true },
    { label: 'INV-001' },
  ],
  
  'jobs-launch': [
    { label: 'Gestion d\'inventaire', path: '/inventory/management' },

    { label: 'Gestion des plannings', path: '/inventory/planning-management' },
    { label: 'Transfer', isActive: true },
    { label: 'INV-001' },
  ]
};

// Routes où le breadcrumb ne doit pas être affiché
const excludedRoutes = ['home', 'inventory-list', 'login'];

export function useBreadcrumb() {
  const route = useRoute();
  const router = useRouter();

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const routeName = route.name as string;
    
    // Si la route est exclue, ne retourne rien
    if (excludedRoutes.includes(routeName)) {
      return [];
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