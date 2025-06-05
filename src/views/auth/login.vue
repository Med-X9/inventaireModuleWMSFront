<template>
    <div class="relative flex h-screen items-center justify-center bg-gray-200 px-6 py-10 sm:px-16">
      <div class="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)] max-h-full overflow-auto">
        <div class="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 py-20">
          <div class="mx-auto w-full max-w-[440px] text-center">
            <!-- Logo -->
            <img src="/assets/images/logo/logo.png" alt="Logo" class="mx-auto mb-8 h-20 w-auto" />
            <h1 class="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-2xl mb-5">Se connecter</h1>
            <form @submit.prevent="handleSubmit" class="space-y-5 dark:text-white text-left">
              <!-- Nom d'utilisateur -->
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom d'utilisateur</label>
                <div class="relative">
                  <input
                    id="username"
                    v-model="form.username"
                    type="text"
                    placeholder="Entrez le nom d'utilisateur"
                    class="form-input ps-10 placeholder-gray-400 w-full"
                    @blur="validateField('username')"
                  />
                  <span class="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconMail />
                  </span>
                </div>
                <p v-if="errors.username" class="text-red-500 text-sm mt-1">{{ errors.username }}</p>
              </div>
  
              <!-- Mot de passe -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
                <div class="relative">
                  <input
                    id="password"
                    v-model="form.password"
                    type="password"
                    placeholder="Entrez le mot de passe"
                    class="form-input ps-10 placeholder-gray-400 w-full"
                    @blur="validateField('password')"
                  />
                  <span class="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconLockDots />
                  </span>
                </div>
                <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
              </div>
  
              <!-- Se souvenir de moi -->
              <div class="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  v-model="form.remember"
                  class="form-checkbox h-4 w-4 text-primary"
                />
                <label for="remember" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Se souvenir de moi</label>
              </div>
  
              <!-- Bouton -->
              <button
                type="submit"
                :disabled="isSubmitting"
                class="btn btn-primary w-full mt-6 uppercase shadow-lg disabled:opacity-50"
              >
                {{ isSubmitting ? 'Connexion...' : 'Se connecter' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import IconMail from '@/components/icon/icon-mail.vue';
  import IconLockDots from '@/components/icon/icon-lock-dots.vue';
  import { required, minLength } from '@/utils/validate';
  import { alertService } from '@/services/alertService';
  
  const router = useRouter();
  const isSubmitting = ref(false);
  
  const form = reactive({
    username: '',
    password: '',
    remember: false,
  });
  const errors = reactive<{ [key: string]: string }>({});
  
  function validateField(field: 'username' | 'password') {
    if (field === 'username') {
      if (!required().fn(form.username)) {
        errors.username = required().msg;
        return false;
      }
      delete errors.username;
    }
    if (field === 'password') {
      if (!required().fn(form.password)) {
        errors.password = required().msg;
        return false;
      }
      if (!minLength(6).fn(form.password)) {
        errors.password = minLength(6).msg;
        return false;
      }
      delete errors.password;
    }
    return true;
  }
  
  function validateForm() {
    const validUsername = validateField('username');
    const validPassword = validateField('password');
    return validUsername && validPassword;
  }
  
  async function handleSubmit() {
    if (!validateForm()) {
      alertService.error({ text: 'Veuillez corriger les erreurs du formulaire.' });
      return;
    }
  
    isSubmitting.value = true;
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alertService.success({ text: 'Connexion réussie' });
      router.push('/');
    } catch (e) {
      alertService.error({ text: 'Échec de la connexion. Veuillez réessayer.' });
    } finally {
      isSubmitting.value = false;
    }
  }
  </script>
  
  <style scoped>
  .form-input {
    padding-left: 2.5rem;
  }
  </style>