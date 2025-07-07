// src/services/alertService.ts
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,

  customClass: {
    popup: 'sweet-alerts toast-alert',
    title: 'toast-title',
    htmlContainer: 'toast-message'
  },

  showClass: {
    popup: 'swal2-show toast-enter'
  },
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

export interface ConfirmOptions {
  title?: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: 'warning' | 'danger';
}

export const alertService = {
  async confirm(opts: ConfirmOptions) {
    const isDelete = opts.type === 'danger';
    
    return Swal.fire({
      title: opts.title || 'Confirmation',
      text: opts.text,
      icon: isDelete ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isDelete ? '#ef4444' : '#FFCC11', // Utilise vos couleurs Tailwind
      cancelButtonColor: '#595959',
      confirmButtonText: opts.confirmButtonText || (isDelete ? 'Oui, supprimer' : 'Oui, confirmer'),
      cancelButtonText: opts.cancelButtonText || 'Annuler',
      customClass: {
        popup: 'sweet-alerts confirmation-popup',
        confirmButton: `btn ${isDelete ? 'btn-danger' : 'btn-primary'}`,
        cancelButton: 'btn btn-secondary',
      },
      buttonsStyling: false
    });
  },

  async confirmDelete(opts: Omit<ConfirmOptions, 'type'>) {
    return this.confirm({
      ...opts,
      type: 'danger',
      title: opts.title || 'Confirmer la suppression',
      confirmButtonText: opts.confirmButtonText || 'Oui, supprimer'
    });
  },

  success(opts: AlertOptions) {
    return Toast.fire({
      icon: 'success',
      title: opts.title || 'Succès',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: '#22c55e', // Couleur unie success de Tailwind
      iconColor: 'white',
    });
  },

  error(opts: AlertOptions) {
    return Toast.fire({
      icon: 'error',
      title: opts.title || 'Erreur',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: '#ef4444', // Couleur unie danger de Tailwind
      iconColor: 'white',
    });
  },

  warning(opts: AlertOptions) {
    return Toast.fire({
      icon: 'warning',
      title: opts.title || 'Attention',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: '#f59e0b', // Couleur unie warning de Tailwind
      iconColor: 'white',
    });
  },

  info(opts: AlertOptions) {
    return Toast.fire({
      icon: 'info',
      title: opts.title || 'Information',
      text: opts.text,
      timer: opts.timer ?? 3000,
      background: '#3b82f6', // Couleur unie info de Tailwind
      iconColor: 'white',
    });
  }
};