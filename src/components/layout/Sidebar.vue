<template>
  <div :class="{ 'dark text-white-dark': store.semidark }">
    <nav class="sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300">
      <div class="bg-white dark:bg-[#0e1726] h-full">
        <!-- En-tête de la sidebar -->
        <div class="flex justify-between items-center px-3 py-6">
          <router-link to="/" class="main-logo flex items-center shrink-0">
            <img class="w-10 ml-[5px] flex-none" src="/assets/images/logo/logo.png" alt="Logo" />
            <span class="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">Inventaire</span>
          </router-link>
          <a
            href="javascript:;"
            class="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180 hover:text-primary"
            @click="store.toggleSidebar()"
          >
            <icon-carets-down class="m-auto rotate-90" />
          </a>
        </div>

        <!-- Contenu de la sidebar -->
        <perfect-scrollbar
          :options="{ swipeEasing: true, wheelPropagation: false }"
          class="h-[calc(100vh-80px)] relative"
        >
          <ul class="relative font-semibold space-y-3 p-3 py-8">
            <!-- Lien vers le tableau de bord -->
            <li class="nav-item">
              <router-link
                to="/"
                exact
                class="group"
                active-class="text-primary dark:text-white"
                @click="toggleMobileMenu"
              >
                <div class="flex items-center">
                  <icon-menu-dashboard class="shrink-0 group-hover:text-primary" />
                  <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] group-hover:text-primary dark:group-hover:text-white-dark">
                    {{ $t('dashboard') }}
                  </span>
                </div>
              </router-link>
            </li>

            <!-- Lien simple Inventaire -->
            <li class="nav-item">
              <router-link
                to="/inventory/management"
                exact
                class="group"
                active-class="text-primary dark:text-white"
                @click="toggleMobileMenu"
              >
                <div class="flex items-center">
                  <icon-menu-inventory class="shrink-0 group-hover:text-primary" />
                  <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] group-hover:text-primary dark:group-hover:text-white-dark">
                    {{ $t('inventaire') }}
                  </span>
                </div>
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
import { onMounted } from 'vue';
import { useAppStore } from '@/stores/index';
import IconCaretsDown from '@/components/icon/icon-carets-down.vue';
import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard.vue';
import IconMenuInventory from '@/components/icon/menu/icon-menu-inventory.vue';

const store = useAppStore();

// Fonction pour fermer la sidebar en mode mobile
function toggleMobileMenu() {
  if (window.innerWidth < 1024) {
    store.toggleSidebar();
  }
}

// Activation du lien courant lors du montage du composant
onMounted(() => {
  const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
  if (selector) {
    selector.classList.add('active');
  }
});
</script>
