import { ref, readonly } from 'vue';

interface ValidationAlertData {
    title?: string;
    subtitle?: string;
    message: string;
    errors?: string[];
    infos?: string[];
    onRetry?: () => void;
}

const showAlert = ref(false);
const alertData = ref<ValidationAlertData>({
    title: '',
    subtitle: '',
    message: '',
    errors: [],
    infos: []
});

export const validationAlertService = {
    show(data: ValidationAlertData) {
        alertData.value = {
            title: data.title || 'Erreur de validation',
            subtitle: data.subtitle || 'Des problèmes ont été détectés',
            message: data.message,
            errors: data.errors || [],
            infos: data.infos || [],
            onRetry: data.onRetry
        };
        showAlert.value = true;
    },

    hide() {
        showAlert.value = false;
    },

    // Méthode pour afficher les erreurs de lancement d'inventaire
    showLaunchErrors(backendResponse: any) {
        const data: ValidationAlertData = {
            title: 'Erreur de lancement d\'inventaire',
            subtitle: 'L\'inventaire ne peut pas être lancé',
            message: backendResponse.message || backendResponse.error || 'Une erreur est survenue lors du lancement',
            errors: backendResponse.errors || (backendResponse.error ? [backendResponse.error] : []),
            onRetry: () => {
                // Ici on peut ajouter une logique de retry si nécessaire
            }
        };
        this.show(data);
    },

    // Méthode pour afficher les succès avec informations
    showLaunchSuccess(backendResponse: any) {
        const data: ValidationAlertData = {
            title: 'Inventaire lancé avec succès',
            subtitle: 'L\'inventaire a été lancé',
            message: backendResponse.message || 'L\'inventaire a été lancé avec succès',
            infos: backendResponse.infos || []
        };
        this.show(data);
    }
};

export const useValidationAlert = () => {
    return {
        showAlert: readonly(showAlert),
        alertData: readonly(alertData),
        hide: validationAlertService.hide.bind(validationAlertService)
    };
};
