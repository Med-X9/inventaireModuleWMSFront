/**
 * Composable useBreadcrumb - Gestion des fil d'Ariane (breadcrumbs)
 *
 * Ce composable gère :
 * - La génération dynamique des breadcrumbs selon la route actuelle
 * - L'utilisation des paramètres de route (comme la référence d'inventaire et le warehouse)
 * - La configuration des breadcrumbs pour chaque route
 * - L'exclusion de certaines routes du breadcrumb
 *
 * @module useBreadcrumb
 */

// ===== IMPORTS VUE =====
import { computed } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute } from 'vue-router'

// ===== INTERFACES =====

/**
 * Élément de breadcrumb
 */
export interface BreadcrumbItem {
    /** Label à afficher */
    label: string
    /** Chemin de navigation (optionnel) */
    path?: string
    /** Indique si c'est l'élément actif */
    isActive?: boolean
}

/**
 * Configuration des breadcrumbs par route
 * Les fonctions permettent d'utiliser les paramètres de route dynamiquement
 */
interface BreadcrumbConfig {
    [routeName: string]: (params: Record<string, string>) => BreadcrumbItem[]
}

// ===== CONFIGURATION =====

/**
 * Configuration des breadcrumbs pour chaque route
 * Utilise des fonctions pour générer dynamiquement les breadcrumbs avec les paramètres de route
 * Les routes doivent correspondre exactement aux noms définis dans router/index.ts
 */
const breadcrumbConfig: BreadcrumbConfig = {
    // Route de création d'inventaire
    'inventory-create': () => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Création d\'inventaire', isActive: true }
    ],

    // Route de détail d'inventaire
    'inventory-detail': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Détail de l\'inventaire', isActive: true },
        { label: params.reference || '' }
    ],

    // Route d'édition d'inventaire
    'inventory-edit': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Modification d\'inventaire', isActive: true },
        { label: params.reference || '' }
    ],

    // Route des résultats d'inventaire
    'inventory-results': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Résultats d\'inventaire', isActive: true },
        { label: params.reference || '' }
    ],

    // Route de suivi des jobs
    'inventory-job-tracking': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Résultats d\'inventaire', path: `/inventory/${params.reference}/results` },
        { label: 'Suivi des jobs', isActive: true },
        { label: params.reference || '' }
    ],

    // Route de suivi d'importation du planning
    'inventory-import-tracking': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Détail inventaire', path: `/inventory/${params.reference}/detail` },
        { label: 'Suivi d\'importation', isActive: true },
        { label: params.reference || '' }
    ],

    // Route de planning d'inventaire (avec reference et warehouse)
    'inventory-planning': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Gestion des plannings', path: `/inventory/${params.reference}/planning-management` },
        { label: 'Planning d\'inventaire', isActive: true },
        { label: params.reference || '' },
        ...(params.warehouse ? [{ label: params.warehouse }] : [])
    ],

    // Route d'affectation des équipes (avec reference et warehouse)
    'inventory-affecter': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Gestion des plannings', path: `/inventory/${params.reference}/planning-management` },
        { label: 'Affectation des équipes', isActive: true },
        { label: params.reference || '' },
        ...(params.warehouse ? [{ label: params.warehouse }] : [])
    ],

    // Route de gestion des plannings
    'planning-management': (params) => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Gestion des plannings', isActive: true },
        ...(params.reference ? [{ label: params.reference }] : [])
    ],

    // Route de lancement des jobs (pas de paramètre reference dans le router)
    'jobs-launch': () => [
        { label: 'Gestion d\'inventaire', path: '/inventory/management' },
        { label: 'Lancement des jobs', isActive: true }
    ]
}

/**
 * Routes où le breadcrumb ne doit pas être affiché
 */
const excludedRoutes = ['home', 'inventory-list', 'login', 'inventory-grid-demo', 'inventory-job-management']

// ===== COMPOSABLE PRINCIPAL =====

/**
 * Composable pour la gestion des breadcrumbs
 *
 * @returns Objet contenant les breadcrumbs et l'état d'affichage
 */
export function useBreadcrumb() {
    const route = useRoute()

    /**
     * Génère les breadcrumbs selon la route actuelle
     * Utilise les paramètres de route pour remplacer les valeurs dynamiques
     */
    const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
        const routeName = route.name as string

        // Si la route est exclue, ne retourne rien
        if (excludedRoutes.includes(routeName)) {
            return []
        }

        // Récupérer et convertir les paramètres de route en strings
        // route.params peut contenir des strings ou des arrays, on convertit tout en string
        const routeParams: Record<string, string> = {}
        if (route.params) {
            Object.keys(route.params).forEach(key => {
                const value = route.params[key]
                // Si c'est un array, prendre le premier élément, sinon convertir en string
                routeParams[key] = Array.isArray(value)
                    ? (value[0] as string) || ''
                    : String(value || '')
            })
        }

        // Si la route a une configuration spécifique
        if (breadcrumbConfig[routeName]) {
            const configFunction = breadcrumbConfig[routeName]
            const items = configFunction(routeParams)

            // Filtrer les items vides (labels vides)
            return items.filter(item => item.label && item.label.trim() !== '')
        }

        // Configuration par défaut si aucune configuration spécifique n'existe
        return [
            { label: 'Gestion d\'inventaire', path: '/inventory/management' },
            { label: 'Page inconnue', isActive: true }
        ]
    })

    /**
     * Détermine si le breadcrumb doit être affiché
     */
    const shouldShowBreadcrumb = computed(() => {
        const routeName = route.name as string
        return !excludedRoutes.includes(routeName) && breadcrumbItems.value.length > 0
    })

    return {
        breadcrumbItems,
        shouldShowBreadcrumb
    }
}
