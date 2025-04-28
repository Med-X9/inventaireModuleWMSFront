import Swal from 'sweetalert2';

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
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'sweet-alerts',
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-danger'
      }
    });
  },

  success(options: AlertOptions) {
    return Swal.fire({
      icon: 'success',
      title: options.title || 'Succès',
      text: options.text,
      timer: options.timer || 2000,
      showConfirmButton: false,
      customClass: {
        popup: 'sweet-alerts',
      }
    });
  },

  error(options: AlertOptions) {
    return Swal.fire({
      icon: 'error',
      title: options.title || 'Erreur',
      text: options.text,
      customClass: {
        popup: 'sweet-alerts',
      }
    });
  },

  warning(options: AlertOptions) {
    return Swal.fire({
      icon: 'warning',
      title: options.title || 'Attention',
      text: options.text,
      customClass: {
        popup: 'sweet-alerts',
      }
    });
  }
};