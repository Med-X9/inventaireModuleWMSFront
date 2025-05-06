// alertService.ts
import Swal from 'sweetalert2';

// Récupère une variable CSS
const getCssVar = (name: string) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

// Mixin de base pour les toasts
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: { popup: 'sweet-alerts toast-alert' },
  didOpen: (toast) => {
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
  /** Modal de confirmation */
  async confirm(opts: AlertOptions) {
    return Swal.fire({
      title: opts.title || 'Confirmation',
      text: opts.text,
      icon: 'warning',
      showCancelButton: true,
   
      confirmButtonColor: getCssVar('--color-primary'),
      cancelButtonColor:  getCssVar('--color-secondary'),
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText:  'Annuler',
      customClass: {
        popup:          'sweet-alerts',
        confirmButton: 'btn btn-primary',
        cancelButton:  'bg-secondary/10 text-secondary hover:bg-secondary/5',
      },
    });
  },

  /** Toast Succès (vert) */
  success(opts: AlertOptions) {
    return Toast.fire({
      icon:       'success',
      title:      opts.title || 'Succès',
      text:       opts.text,
      timer:      opts.timer ?? 3000,
      background: getCssVar('--color-success'),
    });
  },

  /** Toast Erreur (rouge) */
  error(opts: AlertOptions) {
    return Toast.fire({
      icon:       'error',
      title:      opts.title || 'Erreur',
      text:       opts.text,
      timer:      opts.timer ?? 3000,
      background: getCssVar('--color-danger'),
    });
  },

  /** Toast Avertissement (jaune) */
  warning(opts: AlertOptions) {
    return Toast.fire({
      icon:       'warning',
      title:      opts.title || 'Attention',
      text:       opts.text,
      timer:      opts.timer ?? 3000,
      background: getCssVar('--color-warning'),
    });
  },

  /** Toast Info / En cours (bleu) */
  info(opts: AlertOptions) {
    return Toast.fire({
      icon:       'info',
      title:      opts.title || 'Info',
      text:       opts.text,
      timer:      opts.timer ?? 3000,
      background: getCssVar('--color-info'),
    });
  },
};
