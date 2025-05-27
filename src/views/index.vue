<script setup lang="ts">
import { ref, computed } from 'vue'

type Permission = { value: string; label: string }

const allPermissions = ref<Permission[]>([
  { value: 'auth.group.add',    label: 'auth | group | Can add group' },
  { value: 'auth.group.change', label: 'auth | group | Can change group' },
  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  { value: 'auth.group.change', label: 'auth | group | Can change group' },

  // … autres permissions
])

const added = ref<Permission[]>([])
const filterText = ref('')
const selectedAvailable = ref<string[]>([])
const selectedAdded = ref<string[]>([])

const filteredAvailable = computed(() => {
  const query = filterText.value.toLowerCase().trim()
  return allPermissions.value.filter(
    p => !added.value.some(a => a.value === p.value)
      && p.label.toLowerCase().includes(query)
  )
})

function addSelected() {
  const toAdd = filteredAvailable.value.filter(p => selectedAvailable.value.includes(p.value))
  added.value.push(...toAdd)
  selectedAvailable.value = []
}

function addAll() {
  added.value.push(...filteredAvailable.value)
}

function removeSelected() {
  added.value = added.value.filter(p => !selectedAdded.value.includes(p.value))
  selectedAdded.value = []
}

function removeAll() {
  added.value = []
}
</script>

<template>
  <div class="container mx-auto py-4 px-6">
    <div class="grid grid-cols-1 gap-y-4 lg:grid-cols-[2fr_auto_2fr] lg:gap-x-2">
      
      <!-- Permissions disponibles -->
      <section class="bg-white rounded-xl shadow-sm p-4 flex-1 flex flex-col min-w-0">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold text-gray-800">Permissions disponibles</h2>
          <span class="inline-block bg-primary-light text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {{ filteredAvailable.length }}
          </span>
        </div>
        <div class="relative mb-3 flex items-center">
          <input
            v-model="filterText"
            type="search"
            placeholder="Chercher permissions..."
            class="w-full form-input px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none transition-all duration-200"
          />
          <button @click="filterText=''" class="absolute right-2 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Hauteur fixe + scroll -->
        <ul class="flex-1 max-h-80 overflow-auto divide-y divide-gray-200 rounded border border-gray-300">
          <transition-group name="slide-fade" tag="div">
            <li
              v-for="perm in filteredAvailable"
              :key="perm.value"
              @click="selectedAvailable.includes(perm.value)
                ? selectedAvailable = selectedAvailable.filter(v => v !== perm.value)
                : selectedAvailable.push(perm.value)"
              :class="[
                'whitespace-nowrap flex items-center px-3 py-2 cursor-pointer transition-colors hover:bg-gray-100',
                selectedAvailable.includes(perm.value) ? 'font-medium text-black' : 'text-gray-700'
              ]"
            >
              <input
                type="checkbox"
                :checked="selectedAvailable.includes(perm.value)"
                class="mr-2 h-4 w-4 form-checkbox"
              />
              <span class="flex-1">{{ perm.label }}</span>
            </li>
          </transition-group>
        </ul>
        <div class="mt-2 text-center">
          <button
            @click="addAll"
            :disabled="!filteredAvailable.length"
            class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center"
          >
            Choose all
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 p-1 ml-2 rounded-lg bg-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      <!-- Flèches de sélection -->
      <div class="flex md:flex-col gap-4 justify-center items-center">
        <button
          @click="addSelected"
          :disabled="!selectedAvailable.length"
          class="p-2 bg-primary hover:bg-primary-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-shadow shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          @click="removeSelected"
          :disabled="!selectedAdded.length"
          class="p-2 bg-danger hover:bg-red-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-shadow shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <!-- Permissions sélectionnées -->
      <section class="bg-white border border-gray-300 rounded-xl shadow-sm p-4 flex-1 flex flex-col min-w-0">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold text-gray-800">Permissions sélectionnées</h2>
          <span class="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {{ added.length }}
          </span>
        </div>
        <!-- Hauteur fixe + scroll -->
        <ul class="flex-1 max-h-80 overflow-auto divide-y divide-gray-200 rounded ">
          <transition-group name="slide-fade" tag="div">
            <li
              v-for="perm in added"
              :key="perm.value"
              @click="(
                selectedAdded.includes(perm.value)
                  ? selectedAdded = selectedAdded.filter(v => v !== perm.value)
                  : selectedAdded.push(perm.value)
              )"
              :class="[
                'whitespace-nowrap flex items-center px-3 py-2 cursor-pointer transition-colors hover:bg-gray-100',
                selectedAdded.includes(perm.value) ? 'font-medium text-black' : 'text-gray-700'
              ]"
            >
              <input
                type="checkbox"
                :checked="selectedAdded.includes(perm.value)"
                class="mr-2 h-4 w-4 form-checkbox"
              />
              <span class="flex-1">{{ perm.label }}</span>
            </li>
          </transition-group>
        </ul>
        <div class="mt-2 text-center">
          <button
            @click="removeAll"
            :disabled="!added.length"
            class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 p-1 mr-2 rounded-lg bg-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            </svg>
            Remove all
          </button>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  section {
    min-height: auto;
  }
}
</style>
