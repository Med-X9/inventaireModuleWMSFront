import { ref, computed } from 'vue';

export interface ResourceOption {
    value: number;
    label: string;
}

export interface ResourceLine {
    resource: number | null;
    quantity: number;
}

export interface ResourceToAdd {
    resource_id: number;
    quantity: number;
}

export function useResourceModal() {
    // État du modal
    const showAddResourceModal = ref(false);

    // Options de ressources disponibles
    const resourceOptions = ref<ResourceOption[]>([
        { value: 1, label: 'Scanner de codes-barres' },
        { value: 2, label: 'Tablette tactile' },
        { value: 3, label: 'Casque audio' },
        { value: 4, label: 'Gants de protection' },
        { value: 5, label: 'Lampe de poche' },
        { value: 6, label: 'Stylo numérique' },
        { value: 7, label: 'Chargeur portable' },
        { value: 8, label: 'Câbles USB' }
    ]);

    // Lignes de ressources dynamiques
    const resourceLines = ref<ResourceLine[]>([
        {
            resource: null,
            quantity: 1
        }
    ]);

    // Fonction pour obtenir les options de ressources disponibles pour une ligne donnée
    const getAvailableResourceOptions = (currentIndex: number): ResourceOption[] => {
        // Récupérer toutes les ressources sélectionnées dans les autres lignes
        const selectedResources = resourceLines.value
            .map((line, index) => ({ resource: line.resource, index }))
            .filter(item => item.resource !== null && item.index !== currentIndex)
            .map(item => item.resource);

        // Retourner seulement les options qui ne sont pas déjà sélectionnées
        return resourceOptions.value.filter(option => !selectedResources.includes(option.value));
    };

    // Fonction pour ajouter une nouvelle ligne de ressource
    const addResourceLine = (): void => {
        resourceLines.value.push({
            resource: null,
            quantity: 1
        });
    };

    // Fonction pour supprimer une ligne de ressource
    const removeResourceLine = (index: number): void => {
        if (resourceLines.value.length > 1) {
            resourceLines.value.splice(index, 1);
        }
    };

    // Fonction pour réinitialiser le formulaire
    const resetForm = (): void => {
        resourceLines.value = [
            {
                resource: null,
                quantity: 1
            }
        ];
    };

    // Fonction pour fermer le modal
    const closeModal = (): void => {
        showAddResourceModal.value = false;
        resetForm();
    };

    // Fonction pour gérer l'ajout de ressources
    const handleAddResources = (): ResourceToAdd[] => {
        console.log('Lignes de ressources:', resourceLines.value);

        // Traiter les lignes de ressources
        const resourcesToAdd = resourceLines.value
            .filter(line => line.resource && line.quantity)
            .map(line => ({
                resource_id: line.resource!,
                quantity: parseInt(line.quantity.toString())
            }));

        console.log('Ressources à ajouter:', resourcesToAdd);

        // Fermer le modal et réinitialiser
        closeModal();

        return resourcesToAdd;
    };

    // Fonction pour ouvrir le modal
    const openModal = (): void => {
        showAddResourceModal.value = true;
    };

    // Computed pour vérifier si le formulaire est valide
    const isFormValid = computed(() => {
        return resourceLines.value.every(line => line.resource !== null && line.quantity > 0);
    });

    // Computed pour obtenir le nombre de lignes
    const lineCount = computed(() => resourceLines.value.length);

    const addResources = () => {
        if (selectedResources.value.length === 0) return;

        const resourcesToAdd = selectedResources.value.map(resourceId => {
            const resource = availableResources.value.find(r => r.id === resourceId);
            return {
                id: resourceId,
                name: resource?.name || '',
                quantity: 1
            };
        });

        resourceLines.value.push(...resourcesToAdd);
        selectedResources.value = [];
    };

    return {
        // État
        showAddResourceModal,
        resourceOptions,
        resourceLines,

        // Computed
        isFormValid,
        lineCount,

        // Fonctions
        getAvailableResourceOptions,
        addResourceLine,
        removeResourceLine,
        handleAddResources,
        openModal,
        closeModal,
        resetForm,
        addResources
    };
}
