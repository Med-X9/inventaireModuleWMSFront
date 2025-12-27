<template>
  <div :class="{ 'dark text-white-dark': store.semidark }">
    <nav class="sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 bg-white dark:bg-[#0e1726]">
      <div class="h-full flex flex-col">
        <!-- En-tête de la sidebar -->
        <div class="flex justify-between items-center px-4 py-6 border-b border-gray-200 dark:border-gray-700">
          <router-link to="/" class="main-logo flex items-center shrink-0 group">
            <img class="w-10 h-10 flex-none rounded-lg transition-transform duration-300 group-hover:scale-105" src="/assets/images/logo/logo.png" alt="Logo" />
            <span class="text-2xl ltr:ml-3 rtl:mr-3 font-bold align-middle lg:inline text-gray-900 dark:text-white-light group-hover:text-primary transition-colors duration-300">
              Inventaire
            </span>
          </router-link>
          <button
            type="button"
            class="collapse-icon w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white-light transition-all duration-300 rtl:rotate-180 hover:text-primary hover:scale-110"
            @click="store.toggleSidebar()"
            aria-label="Fermer la sidebar"
          >
            <icon-carets-down class="w-5 h-5 rotate-90" />
          </button>
        </div>

        <!-- Contenu de la sidebar -->
        <perfect-scrollbar
          :options="{ swipeEasing: true, wheelPropagation: false }"
          class="flex-1 relative"
        >
          <ul class="relative font-medium space-y-1 p-3 py-4">
            <!-- Lien vers le tableau de bord -->
            <li>
              <router-link
                to="/"
                :class="[
                  'nav-link group flex items-center px-4 py-3 rounded-xl transition-all duration-300 relative',
                  isActiveLink('/') 
                    ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary dark:text-white shadow-sm border-l-4 border-primary' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-white'
                ]"
                @click="toggleMobileMenu"
              >
                <div class="flex items-center w-full">
                  <icon-menu-dashboard 
                    :class="[
                      'shrink-0 w-5 h-5 transition-colors duration-300',
                      isActiveLink('/') 
                        ? 'text-primary' 
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-primary'
                    ]" 
                  />
                  <span class="ltr:ml-3 rtl:mr-3 font-semibold text-sm">
                    {{ $t('dashboard') }}
                  </span>
                </div>
                <!-- Indicateur actif -->
                <div 
                  v-if="isActiveLink('/')"
                  class="absolute right-2 w-2 h-2 rounded-full bg-primary animate-pulse"
                ></div>
              </router-link>
            </li>

            <!-- Lien Inventaire -->
            <li>
              <router-link
                to="/inventory/management"
                :class="[
                  'nav-link group flex items-center px-4 py-3 rounded-xl transition-all duration-300 relative',
                  isActiveLink('/inventory') 
                    ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary dark:text-white shadow-sm border-l-4 border-primary' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-white'
                ]"
                @click="toggleMobileMenu"
              >
                <div class="flex items-center w-full">
                  <icon-menu-inventory 
                    :class="[
                      'shrink-0 w-5 h-5 transition-colors duration-300',
                      isActiveLink('/inventory') 
                        ? 'text-primary' 
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-primary'
                    ]" 
                  />
                  <span class="ltr:ml-3 rtl:mr-3 font-semibold text-sm">
                    {{ $t('inventaire') }}
                  </span>
                </div>
                <!-- Indicateur actif -->
                <div 
                  v-if="isActiveLink('/inventory')"
                  class="absolute right-2 w-2 h-2 rounded-full bg-primary animate-pulse"
                ></div>
              </router-link>
            </li>

            <!-- Autres éléments de menu peuvent être ajoutés ici -->
          </ul>
        </perfect-scrollbar>
      </div>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/index';
import IconCaretsDown from '@/components/icon/icon-carets-down.vue';
import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard.vue';
import IconMenuInventory from '@/components/icon/menu/icon-menu-inventory.vue';

const store = useAppStore();
const route = useRoute();

/**
 * Vérifie si un lien est actif
 * @param path - Chemin à vérifier
 * @returns true si le lien est actif
 */
const isActiveLink = (path: string): boolean => {
  if (path === '/') {
    // Pour la route racine, vérifier qu'on est exactement sur '/' et pas sur une sous-route
    return route.path === '/' || route.path === '';
  }
  // Pour les autres routes, vérifier si le chemin actuel commence par le chemin du lien
  // Cela permet de détecter les routes enfants (ex: /inventory/management active pour /inventory/xxx)
  return route.path === path || route.path.startsWith(path + '/');
};

// Fonction pour fermer la sidebar en mode mobile
function toggleMobileMenu() {
  store.toggleSidebar();
}
</script>
