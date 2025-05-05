import Swal from 'sweetalert2';

// Récupère une variable CSS personnalisée
const getCssVar = (name: string) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

/**
 * Mixin pour configurer les toasts SweetAlert2
 * - toast: mode toast activé
 * - position: top-end (coin supérieur droit)
 * - showConfirmButton: pas de bouton de confirmation
 * - timer: durée par défaut
 * - timerProgressBar: barre de progression
 * - didOpen: applique la couleur de fond secondaire et pause au survol
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: { popup: 'sweet-alerts toast-alert' },
  didOpen: (toast) => {
    // Applique la couleur de fond secondaire
    toast.style.backgroundColor = getCssVar('--color-secondary');
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export interface AlertOptions {
  title?: string;
  text: string;
  timer?: number;
}

export const alertService = {
  /**
   * Confirmation modale classique
   */
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
        confirmButton: 'btn btn-secondary',
        cancelButton: 'btn btn-secondary',
      },
    });
  },

  /**
   * Toast succès (auto-close)
   */
  success(opts: AlertOptions) {
    return Toast.fire({
      icon: 'success',
      title: opts.title || 'Succès',
      text: opts.text,
      timer: opts.timer ?? 3000,
    });
  },

  /**
   * Toast d'erreur
   */
  error(opts: AlertOptions) {
    return Toast.fire({
      icon: 'error',
      title: opts.title || 'Erreur',
      text: opts.text,
      timer: opts.timer ?? 3000,
    });
  },

  /**
   * Toast d'avertissement
   */
  warning(opts: AlertOptions) {
    return Toast.fire({
      icon: 'warning',
      title: opts.title || 'Attention',
      text: opts.text,
      timer: opts.timer ?? 3000,
    });
  },
};
