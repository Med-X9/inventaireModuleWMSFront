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
  timer: 3000,
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

export const alertService = {
  async confirm(opts: AlertOptions) {
    return Swal.fire({
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
  },

  success(opts: AlertOptions) {
    return Toast.fire({
      icon: 'success',
      title: opts.title || 'Succès',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: getCssVar('--color-success'),
      iconColor: 'white',
    });
  },

  error(opts: AlertOptions) {
    return Toast.fire({
      icon: 'error',
      title: opts.title || 'Erreur',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: getCssVar('--color-danger'),
      iconColor: 'white',
    });
  },

  warning(opts: AlertOptions) {
    return Toast.fire({
      icon: 'warning',
      title: opts.title || 'Attention',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: getCssVar('--color-warning'),
      iconColor: 'white',
    });
  },

  info(opts: AlertOptions) {
    return Toast.fire({
      icon: 'info',
      title: opts.title || 'Info',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: getCssVar('--color-info'),
      iconColor: 'white',
    });
  }
};
