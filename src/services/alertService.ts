// src/services/alertService.ts
import Swal from 'sweetalert2';

const getCssVar = (name: string) =>
    getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,

    customClass: {
        popup: 'sweet-alerts toast-alert',    // vos classes existantes
        title: 'toast-title',
        htmlContainer: 'toast-message'
    },

    // On ajoute ici showClass pour déclencher l'animation d'entrée
    showClass: {
        popup: 'swal2-show toast-enter'
    },
    // On peut ajouter hideClass pour la sortie (mais ce n'est pas obligatoire si on laisse
    // SweetAlert2 gérer par défaut la suppression ; on l'ajoute ici pour être complet) :
    hideClass: {
        popup: 'swal2-hide'
    },

    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

export interface AlertOptions {
    title?: string;
    text: string;
    timer?: number;
}

export interface PromptOptions {
    title?: string;
    text?: string;
    inputPlaceholder?: string;
}

interface AlertService {
    confirm(opts: AlertOptions): Promise<{ isConfirmed: boolean }>;
    success(opts: AlertOptions): Promise<any>;
    error(opts: AlertOptions): Promise<any>;
    warning(opts: AlertOptions): Promise<any>;
    info(opts: AlertOptions): Promise<any>;
    prompt(opts: PromptOptions): Promise<{ isConfirmed: boolean; value: string }>;
}

export const alertService: AlertService = {
    async confirm(opts: AlertOptions): Promise<{ isConfirmed: boolean }> {
        const result = await Swal.fire({
            title: opts.title || 'Confirmation',
            text: opts.text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: getCssVar('--color-primary'),
            cancelButtonColor: getCssVar('--color-secondary'),
            confirmButtonText: 'Oui, confirmer',
            cancelButtonText: 'Annuler',
            customClass: {
                popup: 'sweet-alerts',
                confirmButton: 'btn btn-primary',
                cancelButton: 'bg-secondary/10 text-secondary hover:bg-secondary/5',
            },
        });
        return { isConfirmed: result.isConfirmed };
    },

    success(opts: AlertOptions) {
        return Toast.fire({
            icon: 'success',
            title: opts.title || 'Succès',
            text: opts.text,
            timer: opts.timer ?? 1500,
            background: getCssVar('--color-success'),
            iconColor: 'white',
        });
    },

    error(opts: AlertOptions) {
        return Toast.fire({
            icon: 'error',
            title: opts.title || 'Erreur',
            text: opts.text,
            timer: opts.timer ?? 1500,
            background: getCssVar('--color-danger'),
            iconColor: 'white',
        });
    },

    warning(opts: AlertOptions) {
        return Toast.fire({
            icon: 'warning',
            title: opts.title || 'Attention',
            text: opts.text,
            timer: opts.timer ?? 1500,
            background: getCssVar('--color-warning'),
            iconColor: 'white',
        });
    },

    info(opts: AlertOptions) {
        return Toast.fire({
            icon: 'info',
            title: opts.title || 'Info',
            text: opts.text,
            timer: opts.timer ?? 1500,
            background: getCssVar('--color-info'),
            iconColor: 'white',
        });
    },

    async prompt(opts: PromptOptions): Promise<{ isConfirmed: boolean; value: string }> {
        const result = await Swal.fire({
            title: opts.title || 'Saisie',
            text: opts.text || '',
            input: 'text',
            inputPlaceholder: opts.inputPlaceholder || '',
            showCancelButton: true,
            confirmButtonColor: getCssVar('--color-primary'),
            cancelButtonColor: getCssVar('--color-secondary'),
            confirmButtonText: 'Confirmer',
            cancelButtonText: 'Annuler',
            customClass: {
                popup: 'sweet-alerts',
                confirmButton: 'btn btn-primary',
                cancelButton: 'bg-secondary/10 text-secondary hover:bg-secondary/5',
            },
        });
        return {
            isConfirmed: result.isConfirmed,
            value: result.value || ''
        };
    }
};
