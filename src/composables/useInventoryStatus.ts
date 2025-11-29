import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { logger } from '@/services/loggerService';
import { useInventoryStore } from '@/stores/inventory';

export type InventoryStatus = 'EN PREPARATION' | 'EN REALISATION' | 'TERMINE' | 'CLOTURE';

export interface InventoryStep {
    id: string;
    label: string;
    order: number;
    isActive: boolean;
    isCompleted: boolean;
}

export function useInventoryStatus() {
    const route = useRoute();
    const inventoryStore = useInventoryStore();

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
        const routeName = route.name as string | undefined;

        // Si routeName est undefined, ne pas afficher les étapes
        if (!routeName || typeof routeName !== 'string') {
            return false;
        }

        // Routes à exclure explicitement
        const excludedRoutes = [
            'inventory-list',      // InventoryManagement - page de liste principale
            'inventory-detail',    // InventoryDetail - page de détail
            'inventory-grid-demo'  // Page de démo, pas une page fonctionnelle
        ];

        // Exclure les routes spécifiées
        if (excludedRoutes.includes(routeName)) {
            return false;
        }

        // Routes sans paramètre reference (ne peuvent pas afficher les étapes avec statut)
        const routesWithoutReference = [
            'jobs-launch',                // Lancement des jobs (pas de référence dans l'URL)
            'inventory-job-management'    // Gestion des jobs (pas de référence dans l'URL)
        ];

        // Ces routes n'ont pas de reference, donc pas d'étapes à afficher
        if (routesWithoutReference.includes(routeName)) {
            return false;
        }

        // Routes d'inventaire qui doivent afficher les étapes
        // Toutes les routes commençant par "inventory-" ou "planning-management" sont incluses
        // SAUF celles déjà exclues ci-dessus
        const inventoryRoutePatterns = [
            'inventory-',      // Toutes les routes d'inventaire
            'planning-management'  // Gestion des plannings
        ];

        // Vérifier si la route correspond aux patterns d'inventaire
        const isInventoryRoute = inventoryRoutePatterns.some(pattern => 
            routeName.startsWith(pattern) || routeName === pattern
        );

        if (!isInventoryRoute) {
            return false;
        }

        // Pour inventory-create, toujours afficher (même sans référence au début)
        if (routeName === 'inventory-create') {
            return true;
        }

        // Pour les autres routes, vérifier qu'elles ont un paramètre reference
        // (nécessaire pour récupérer le statut de l'inventaire)
        const hasReference = route.params.reference !== undefined;
        return hasReference;
    });

    /**
     * Fonction pour mettre à jour le statut depuis l'inventaire
     * Récupère le statut réel de l'inventaire depuis le store et active les étapes correspondantes
     */
    const updateStatusFromInventory = async () => {
        try {
            // Récupérer la référence de l'inventaire depuis les paramètres de route
            const inventoryReference = route.params.reference as string | undefined;

            if (!inventoryReference) {
                logger.debug('Aucune référence d\'inventaire trouvée dans la route, étapes non mises à jour');
                // Réinitialiser toutes les étapes si pas de référence
                inventorySteps.value.forEach(step => {
                    step.isActive = false;
                    step.isCompleted = false;
                });
                return;
            }

            // Récupérer l'inventaire depuis le store
            const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference);

            if (!inventory || !inventory.status) {
                logger.warn('Inventaire non trouvé ou sans statut', { inventoryReference });
                // Réinitialiser toutes les étapes si inventaire non trouvé
                inventorySteps.value.forEach(step => {
                    step.isActive = false;
                    step.isCompleted = false;
                });
                return;
            }

            // Récupérer le statut de l'inventaire
            const currentStatus = inventory.status as InventoryStatus;

            logger.debug('Mise à jour des étapes selon le statut', {
                inventoryReference,
                status: currentStatus
            });

            // Réinitialiser toutes les étapes
            inventorySteps.value.forEach(step => {
                step.isActive = false;
                step.isCompleted = false;
            });

            // Activer les étapes selon le statut
            switch (currentStatus) {
                case 'EN PREPARATION':
                    // Activer "Préparation"
                    inventorySteps.value[0].isActive = true;
                    break;

                case 'EN REALISATION':
                    // "Préparation" est complétée, activer "Réalisation"
                    inventorySteps.value[0].isCompleted = true;
                    inventorySteps.value[1].isActive = true;
                    break;

                case 'TERMINE':
                case 'CLOTURE':
                    // "Préparation" et "Réalisation" sont complétées, activer "Clôture"
                    inventorySteps.value[0].isCompleted = true;
                    inventorySteps.value[1].isCompleted = true;
                    inventorySteps.value[2].isActive = true;
                    break;

                default:
                    // Par défaut, activer "Préparation" si statut inconnu
                    logger.warn('Statut d\'inventaire inconnu, activation de l\'étape Préparation par défaut', {
                        status: currentStatus,
                        inventoryReference
                    });
                    inventorySteps.value[0].isActive = true;
            }
        } catch (error) {
            logger.error('Erreur lors de la mise à jour du statut depuis l\'inventaire', error);
            // En cas d'erreur, réinitialiser toutes les étapes
            inventorySteps.value.forEach(step => {
                step.isActive = false;
                step.isCompleted = false;
            });
        }
    };

    return {
        inventorySteps,
        shouldShowSteps,
        updateStatusFromInventory
    };
}
