// src/composables/useAuth.ts
import { ref, reactive } from 'vue';
import type { LoginForm, LoginFormErrors } from '@/interfaces/auth';
import { useAuthStore } from '@/stores/auth';
import { alertService } from '@/services/alertService';

export function useAuth() {
  const authStore = useAuthStore();
  const isSubmitting = ref(false);

  const form = reactive<LoginForm>({
    username: '',
    password: '',
    remember: false,
  });

  const errors = reactive<LoginFormErrors>({});

  /** Valide un seul champ */
  function validateField(field: keyof LoginForm): boolean {
    if (field === 'username') {
      if (!form.username.trim()) {
        errors.username = "Le nom d'utilisateur est requis";
        return false;
      }
      delete errors.username;
    }
    if (field === 'password') {
      if (!form.password) {
        errors.password = 'Le mot de passe est requis';
        return false;
      }
      if (form.password.length < 6) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        return false;
      }
      delete errors.password;
    }
    return true;
  }

  /** Valide l’ensemble du formulaire */
  function validateForm(): boolean {
    const validUsername = validateField('username');
    const validPassword = validateField('password');
    return validUsername && validPassword;
  }

  /**
   * Tente la connexion. 
   * Si échec, affiche un toast et renvoie false.
   * Si succès, renvoie true.
   */
  async function handleLogin(): Promise<boolean> {
    if (!validateForm()) {
      alertService.error({ text: 'Veuillez corriger les erreurs du formulaire.' });
      return false;
    }

    isSubmitting.value = true;
    try {
      const success = await authStore.login(form.username, form.password);
      return success;
    } catch (unknownError) {
      if (unknownError instanceof Error) {
        alertService.error({ text: unknownError.message });
      } else {
        alertService.error({ text: 'Échec de la connexion. Veuillez réessayer.' });
      }
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Déconnexion silencieuse : si l’API échoue, on ignore l’erreur,
   * la store se charge de clearTokens et de rediriger.
   */
  async function handleLogout(): Promise<void> {
    try {
      await authStore.logout();
    } catch {
      // L’erreur est déjà gérée dans authStore.logout (sans log),
      // on n’affiche rien ici.
    }
  }

  return {
    form,
    errors,
    isSubmitting,
    validateField,
    validateForm,
    handleLogin,
    handleLogout,
  };
}
