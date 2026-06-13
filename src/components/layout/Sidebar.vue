<template>

  <div :class="{ 'dark text-white-dark': store.semidark }">

    <nav class="sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 bg-white dark:bg-[#0e1726]">

      <div class="h-full flex flex-col">

        <div class="flex justify-between items-center px-4 py-6 border-b border-gray-200 dark:border-gray-700">

          <Logo />

          <button

            type="button"

            class="collapse-icon w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white-light transition-all duration-300 rtl:rotate-180 hover:text-primary hover:scale-110"

            @click="store.toggleSidebar()"

            aria-label="Fermer la sidebar"

          >

            <MdiIcon name="mdi-chevron-double-left" size="sm" class="rotate-90" />

          </button>

        </div>



        <perfect-scrollbar

          :options="{ swipeEasing: true, wheelPropagation: false }"

          class="flex-1 relative"

        >

          <ul class="relative font-medium space-y-1 p-3 py-4">

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

                  <MdiIcon

                    name="mdi-view-dashboard-outline"

                    size="sm"

                    :class="[

                      'shrink-0 transition-colors duration-300',

                      isActiveLink('/') 

                        ? 'text-primary' 

                        : 'text-gray-500 dark:text-gray-400 group-hover:text-primary'

                    ]"

                  />

                  <span class="ltr:ml-3 rtl:mr-3 font-semibold text-sm">

                    {{ $t('dashboard') }}

                  </span>

                </div>

                <div 

                  v-if="isActiveLink('/')"

                  class="absolute right-2 w-2 h-2 rounded-full bg-primary animate-pulse"

                ></div>

              </router-link>

            </li>



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

                  <MdiIcon

                    name="mdi-clipboard-list-outline"

                    size="sm"

                    :class="[

                      'shrink-0 transition-colors duration-300',

                      isActiveLink('/inventory') 

                        ? 'text-primary' 

                        : 'text-gray-500 dark:text-gray-400 group-hover:text-primary'

                    ]"

                  />

                  <span class="ltr:ml-3 rtl:mr-3 font-semibold text-sm">

                    {{ $t('inventaire') }}

                  </span>

                </div>

                <div 

                  v-if="isActiveLink('/inventory')"

                  class="absolute right-2 w-2 h-2 rounded-full bg-primary animate-pulse"

                ></div>

              </router-link>

            </li>

          </ul>

        </perfect-scrollbar>

      </div>

    </nav>

  </div>

</template>



<script lang="ts" setup>

import { useRoute } from 'vue-router';

import { useAppStore } from '@/stores/index';

import Logo from '@/components/layout/Logo.vue';

import MdiIcon from '@/components/MdiIcon.vue';



const store = useAppStore();

const route = useRoute();



const isActiveLink = (path: string): boolean => {

  if (path === '/') {

    return route.path === '/' || route.path === '';

  }

  return route.path === path || route.path.startsWith(path + '/');

};



function toggleMobileMenu() {

  store.toggleSidebar();

}

</script>


