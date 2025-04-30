// src/services/alertService.ts
import Swal from 'sweetalert2';
import { palette } from '../theme/colors';  // votre module partagé

interface AlertOptions {
  title?: string;
  text: string;
  timer?: number;
}

export const alertService = {
  async confirm(options: AlertOptions) {
    return Swal.fire({
      title: options.title || 'Confirmation',
      text: options.text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: palette.primary.DEFAULT,
      cancelButtonColor:   palette.danger.DEFAULT,
      confirmButtonText:   'Oui, confirmer',
      cancelButtonText:    'Annuler',
      customClass: {
        popup:         'sweet-alerts',
        confirmButton: 'btn btn-secondary',
        cancelButton:  'btn btn-danger',
      },
    });
  },

  success(opts: AlertOptions) {
    return Swal.fire({
      icon: 'success',
      title: opts.title || 'Succès',
      text: opts.text,
      timer: opts.timer || 2000,
      showConfirmButton: false,
      timerProgressBar:  true,
  
      customClass: { popup: 'sweet-alerts' },
    });
  },

  error(opts: AlertOptions) {
    return Swal.fire({
      icon: 'error',
      title: opts.title || 'Erreur',
      text: opts.text,
      confirmButtonColor: palette.danger.DEFAULT,
      customClass: { popup: 'sweet-alerts' },
    });
  },

  warning(opts: AlertOptions) {
    return Swal.fire({
      icon: 'warning',
      title: opts.title || 'Attention',
      text: opts.text,
      confirmButtonColor: palette.warning.DEFAULT,
      customClass: { popup: 'sweet-alerts' },
    });
  }
};
