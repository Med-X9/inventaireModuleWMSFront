import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { format } from 'date-fns';
import type { Team, Job } from '@/interfaces/planning';
import { planningService } from '@/services/planningService';
import { alertService } from '@/services/alertService';
import { indexedDBService } from '@/services/indexedDBService';
import { useAppStore } from '@/stores';

const STORAGE_KEY = 'planningState';

export function usePlanning() {
  const appStore = useAppStore();

  const selectedDate = ref<string>(format(new Date(), 'yyyy-MM-dd'));
  const teams = ref<Team[]>([]);
  const jobs = ref<Job[]>([]);
  const selectedZone = ref<string>('');
  const selectedSubZone = ref<string>('');
  const locationSearchQuery = ref('');
  const isSubmitting = ref(false);
  const tempSelectedLocations = ref<string[]>([]);
  const selectedAvailable = ref<string[]>([]);
  const selectedAdded = ref<string[]>([]);
  
  const allLocations = planningService.getLocations();

  // Get unique zones and subzones
  const zones = computed(() => {
    const uniqueZones = new Set(allLocations.map(loc => planningService.parseLocation(loc).zone));
    return Array.from(uniqueZones);
  });

  const subZones = computed(() => {
    const uniqueSubZones = new Set(
      allLocations
        .filter(loc => !selectedZone.value || planningService.parseLocation(loc).zone === selectedZone.value)
        .map(loc => planningService.parseLocation(loc).sousZone)
    );
    return Array.from(uniqueSubZones);
  });

  // Available locations (excluding already selected ones)
  const availableLocations = computed(() => {
    let filtered = allLocations;
    const query = locationSearchQuery.value.toLowerCase().trim();

    if (selectedZone.value) {
      filtered = filtered.filter(loc => planningService.parseLocation(loc).zone === selectedZone.value);
    }

    if (selectedSubZone.value) {
      filtered = filtered.filter(loc => planningService.parseLocation(loc).sousZone === selectedSubZone.value);
    }

    if (query) {
      filtered = filtered.filter(loc => loc.toLowerCase().includes(query));
    }

    // Exclude locations that are already in jobs or temporarily selected
    const usedLocations = new Set([
      ...jobs.value.flatMap(job => job.locations),
      ...tempSelectedLocations.value
    ]);
    return filtered.filter(loc => !usedLocations.has(loc));
  });

  const canValidate = computed(() => 
    !!selectedDate.value && 
    teams.value.length > 0 && 
    jobs.value.length > 0 && 
    !isSubmitting.value
  );

  // Job creation methods
  function addSelectedLocations() {
    const toAdd = availableLocations.value.filter(loc => selectedAvailable.value.includes(loc));
    if (toAdd.length) {
      tempSelectedLocations.value.push(...toAdd);
    }
    selectedAvailable.value = [];
  }

  function addAllLocations() {
    if (availableLocations.value.length) {
      tempSelectedLocations.value.push(...availableLocations.value);
    }
  }

  function removeSelectedLocations() {
    tempSelectedLocations.value = tempSelectedLocations.value.filter(
      loc => !selectedAdded.value.includes(loc)
    );
    selectedAdded.value = [];
  }

  function removeAllLocations() {
    tempSelectedLocations.value = [];
  }

  async function createJob() {
    if (tempSelectedLocations.value.length) {
      await addJob(tempSelectedLocations.value);
      tempSelectedLocations.value = [];
    }
  }

  function cancelJobCreation() {
    tempSelectedLocations.value = [];
    selectedAvailable.value = [];
    selectedAdded.value = [];
  }

  async function saveState() {
    const state = {
      selectedDate: selectedDate.value,
      teams: teams.value,
      jobs: jobs.value,
      tempSelectedLocations: tempSelectedLocations.value
    };
    try {
      await indexedDBService.saveState(JSON.parse(JSON.stringify(state)), STORAGE_KEY);
    } catch (error) {
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de sauvegarder l\'état'
      });
    }
  }

  async function loadState() {
    try {
      const saved = await indexedDBService.getState(STORAGE_KEY);
      if (saved) {
        const state: any = saved;
        selectedDate.value = state.selectedDate;
        teams.value = state.teams || [];
        jobs.value = state.jobs || [];
        tempSelectedLocations.value = state.tempSelectedLocations || [];
      }
    } catch (error) {
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de charger l\'état'
      });
    }
  }

  onMounted(async () => {
    await indexedDBService.init();
    await loadState();
  });

  watch(
    [
      () => selectedDate.value,
      () => teams.value,
      () => jobs.value,
      () => tempSelectedLocations.value
    ],
    saveState,
    { deep: true }
  );

  async function cancelPlanning() {
    const res = await alertService.confirm({
      title: 'Annuler',
      text: 'Effacer le planning ?'
    });
    if (!res.isConfirmed) return;
    
    try {
      await indexedDBService.clearState(STORAGE_KEY);
    } catch {}
    
    selectedDate.value = format(new Date(), 'yyyy-MM-dd');
    teams.value = [];
    jobs.value = [];
    tempSelectedLocations.value = [];
    selectedAvailable.value = [];
    selectedAdded.value = [];
  }

  async function validateAll() {
    if (!canValidate.value) return;
    isSubmitting.value = true;
    try {
      await planningService.savePlanning({
        selectedDate: selectedDate.value,
        teams: teams.value,
        jobs: jobs.value,
        isSubmitting: false
      });
      await indexedDBService.clearState(STORAGE_KEY);
    } catch {
      await alertService.error({ text: 'Erreur lors de la validation' });
    } finally {
      isSubmitting.value = false;
    }
  }

  async function addJob(locations: string[]) {
    jobs.value.push({
      id: crypto.randomUUID(),
      locations
    });
    await nextTick();
  }

  async function deleteJob(id: string) {
    const res = await alertService.confirm({
      title: 'Confirmer la suppression',
      text: 'Voulez-vous vraiment supprimer ce job ?'
    });
    if (res.isConfirmed) {
      jobs.value = jobs.value.filter(j => j.id !== id);
    }
  }

  return {
    selectedDate,
    teams,
    jobs,
    zones,
    subZones,
    selectedZone,
    selectedSubZone,
    availableLocations,
    tempSelectedLocations,
    locationSearchQuery,
    selectedAvailable,
    selectedAdded,
    isSubmitting,
    canValidate,
    addJob,
    deleteJob,
    validateAll,
    cancelPlanning,
    addSelectedLocations,
    addAllLocations,
    removeSelectedLocations,
    removeAllLocations,
    createJob,
    cancelJobCreation
  };
}