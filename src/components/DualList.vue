// src/components/DualList.vue
<template>
  <div class="grid grid-cols-1 gap-y-4 lg:grid-cols-[2fr_auto_2fr] lg:gap-x-4 mb-6">
    <!-- Available list -->
    <section class="rounded-xl shadow-sm p-4 flex flex-col">
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-semibold">{{ titleAvailable }}</h4>
        <span class="inline-block bg-primary-light text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full">
          {{ counterAvailable }}
        </span>
      </div>
      <div class="relative mb-3 flex items-center">
        <input
          v-model="localFilter"
          type="search"
          placeholder="Rechercher..."
          class="w-full form-input px-4 py-2 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary transition"
        />
        <button @click="localFilter = ''" class="absolute right-2 text-gray-400 hover:text-gray-600">×</button>
      </div>
      <ul class="flex-1 overflow-auto max-h-60 divide-y divide-gray-200 border border-gray-300 rounded">
        <li
          v-for="item in filteredAvailable"
          :key="item.id"
          @click="toggleAvailable(item.id)"
          :class="[
            'flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100',
            localSelectedAvailable.includes(item.id) ? 'bg-gray-100 font-medium' : ''
          ]"
        >
          <input type="checkbox" :checked="localSelectedAvailable.includes(item.id)" class="mr-2 form-checkbox" />
          <span>{{ item.locations.join(', ') }}</span>
        </li>
      </ul>
      <div class="mt-2 text-center">
        <button @click="$emit('add-all')" :disabled="!filteredAvailable.length"
                class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center">
          Tout sélectionner <span class="ml-2 bg-gray-100 rounded-lg p-1">»</span>
        </button>
      </div>
    </section>

    <!-- Controls -->
    <div class="flex flex-col items-center justify-center space-y-2">
      <button @click="$emit('add-selected')" :disabled="!localSelectedAvailable.length"
              class="p-2 bg-primary hover:bg-primary-dark text-white rounded-full disabled:opacity-50">›</button>
      <button @click="$emit('remove-selected')" :disabled="!localSelectedAdded.length"
              class="p-2 bg-danger hover:bg-danger-dark text-white rounded-full disabled:opacity-50">‹</button>
    </div>

    <!-- Added list -->
    <section class="bg-white rounded-xl shadow-sm p-4 flex flex-col">
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-semibold">{{ titleAdded }}</h4>
        <span class="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
          {{ counterAdded }}
        </span>
      </div>
      <ul class="flex-1 overflow-auto max-h-60 divide-y divide-gray-200 rounded">
        <li
          v-for="id in localSelectedAddedList"
          :key="id"
          @click="toggleAdded(id)"
          :class="[
            'flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100',
            localSelectedAdded.includes(id) ? 'bg-gray-100 font-medium' : ''
          ]"
        >
          <input type="checkbox" :checked="localSelectedAdded.includes(id)" class="mr-2 form-checkbox" />
          <span class="flex-1">{{ findById(id).locations.join(', ') }}</span>
          <input
            v-model="localDates[id]"
            type="date"
            class="w-32 form-input px-2 py-1 border rounded ml-2"
          />
        </li>
      </ul>
      <div class="mt-2 text-center">
        <button @click="$emit('remove-all')" :disabled="!localSelectedAddedList.length"
                class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center">
          Tout supprimer <span class="ml-2 bg-gray-100 rounded-lg p-1">«</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue';

type Job = { id: string; locations: string[] };

const props = defineProps({
  available: { type: Array as () => Job[], required: true },
  selectedAvailable: { type: Array as () => string[], required: true },
  selectedAdded: { type: Array as () => string[], required: true },
  dates: { type: Object as () => Record<string, string>, required: true },
  titleAvailable: { type: String, default: 'Available' },
  titleAdded: { type: String, default: 'Added' },
  counterAvailable: [Number, String],
  counterAdded: [Number, String]
});
const emit = defineEmits([
  'update:selectedAvailable',
  'update:selectedAdded',
  'update:dates',
  'add-all',
  'add-selected',
  'remove-selected',
  'remove-all'
]);

// Local copies to manage v-model
const { selectedAvailable: selAvail, selectedAdded: selAdded, dates: dt } = toRefs(props);
const localSelectedAvailable = ref<string[]>([...selAvail.value]);
const localSelectedAdded = ref<string[]>([...selAdded.value]);
const localDates = ref<Record<string, string>>({ ...dt.value });

// Sync to parent
watch(localSelectedAvailable, v => emit('update:selectedAvailable', v));
watch(localSelectedAdded, v => emit('update:selectedAdded', v));
watch(localDates, v => emit('update:dates', v), { deep: true });

// Filter input
const localFilter = ref('');
const filteredAvailable = computed(() =>
  props.available.filter(j => j.locations.join(', ').toLowerCase().includes(localFilter.value.toLowerCase()))
);

// Helpers
function toggleAvailable(id: string) {
  const i = localSelectedAvailable.value.indexOf(id);
  if (i >= 0) localSelectedAvailable.value.splice(i, 1);
  else localSelectedAvailable.value.push(id);
}

function toggleAdded(id: string) {
  const i = localSelectedAdded.value.indexOf(id);
  if (i >= 0) localSelectedAdded.value.splice(i, 1);
  else localSelectedAdded.value.push(id);
}

function findById(id: string) {
  return props.available.find(j => j.id === id) || { id, locations: [] };
}

// For listing added objects, combine available & removed? Assume available includes all jobs
const localSelectedAddedList = computed(() => localSelectedAdded.value);
</script>
