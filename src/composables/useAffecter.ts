// src/composables/useAffecter.ts
import { ref, reactive, computed, watch, onMounted } from 'vue';
import type { Team, Job } from '@/interfaces/planning';
import type { FieldConfig } from '@/interfaces/form';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';

const STORAGE_KEY = 'affecter';

// Mock data : remplacez par un fetch réel si besoin
const teams: Team[] = [
  { id: '1', name: 'Équipe A', session: '1' },
  { id: '2', name: 'Équipe B', session: '1' },
  { id: '3', name: 'Équipe C', session: '1' }
];
const jobs: Job[] = [
  { id: '1', locations: ['job A'] },
  { id: '2', locations: ['job B'] },
  { id: '3', locations: ['job C'] },
  { id: '4', locations: ['job D'] },
  { id: '5', locations: ['job E'] },
  { id: '6', locations: ['job F'] }
];

export function useAffecter() {
  const currentStep = ref(0);
  const loaded = ref(false);

  // Forms as reactive objects
  const counting1Form = reactive<{ team: string; jobs: string[] }>({ team: '', jobs: [] });
  const counting2Form = reactive<{ team: string; jobs: string[] }>({ team: '', jobs: [] });

  // Dual-list state step 1
  const filter1 = ref('');
  const selectedAvailable1 = ref<string[]>([]);
  const selectedAdded1   = ref<string[]>([]);
  const dates1           = ref<Record<string, string>>({});

  // Dual-list state step 2
  const filter2 = ref('');
  const selectedAvailable2 = ref<string[]>([]);
  const selectedAdded2   = ref<string[]>([]);
  const dates2           = ref<Record<string, string>>({});

  // Containers for assigned teams&jobs
  const selectedTeams1 = ref<Team[]>([]);
  const selectedTeams2 = ref<Team[]>([]);
  const teamJobs1      = ref<Map<string, string[]>>(new Map());
  const teamJobs2      = ref<Map<string, string[]>>(new Map());

  // Computed lists
  const availableJobs1 = computed(() => {
    const taken = new Set(Array.from(teamJobs1.value.values()).flat());
    return jobs.filter(j => !taken.has(j.id));
  });
  const availableJobs2 = computed(() => {
    const taken = new Set(Array.from(teamJobs2.value.values()).flat());
    return jobs.filter(j => !taken.has(j.id));
  });

  const filteredAvailable1 = computed(() =>
    availableJobs1.value
      .filter(j => !counting1Form.jobs.includes(j.id))
      .filter(j => j.locations.join(', ').toLowerCase().includes(filter1.value.toLowerCase()))
  );
  const filteredAvailable2 = computed(() =>
    availableJobs2.value
      .filter(j => !counting2Form.jobs.includes(j.id))
      .filter(j => j.locations.join(', ').toLowerCase().includes(filter2.value.toLowerCase()))
  );

  const addedJobs1 = computed(() => availableJobs1.value.filter(j => counting1Form.jobs.includes(j.id)));
  const addedJobs2 = computed(() => availableJobs2.value.filter(j => counting2Form.jobs.includes(j.id)));

  // FormBuilder field configs
  const formFields1 = computed<FieldConfig[]>(() => [{
    key: 'team', label: 'Sélectionner une équipe', type: 'select',
    options: teams.map(t => ({ label: t.name, value: t.id })),
    clearable: true,
    validators: [{ key: 'required', fn: v => !!v, msg: 'Veuillez sélectionner une équipe' }]
  }]);
  const formFields2 = computed<FieldConfig[]>(() => [{
    key: 'team', label: 'Sélectionner une équipe', type: 'select',
    options: teams.map(t => ({ label: t.name, value: t.id })),
    clearable: true,
    validators: [{ key: 'required', fn: v => !!v, msg: 'Veuillez sélectionner une équipe' }]
  }]);

  // Dual-list actions step 1
  function toggleAvailable1(id: string) {
    selectedAvailable1.value = selectedAvailable1.value.includes(id)
      ? selectedAvailable1.value.filter(x => x !== id)
      : [...selectedAvailable1.value, id];
  }
  function toggleAdded1(id: string) {
    selectedAdded1.value = selectedAdded1.value.includes(id)
      ? selectedAdded1.value.filter(x => x !== id)
      : [...selectedAdded1.value, id];
  }
  function addSelected1() {
    counting1Form.jobs = Array.from(new Set([...counting1Form.jobs, ...selectedAvailable1.value]));
    selectedAvailable1.value = [];
    saveState();
  }
  function removeSelected1() {
    counting1Form.jobs = counting1Form.jobs.filter(id => !selectedAdded1.value.includes(id));
    selectedAdded1.value = [];
    saveState();
  }
  function addAll1() {
    counting1Form.jobs = availableJobs1.value.map(j => j.id);
    saveState();
  }
  function removeAll1() {
    counting1Form.jobs = [];
    saveState();
  }

  // Dual-list actions step 2
  function toggleAvailable2(id: string) {
    selectedAvailable2.value = selectedAvailable2.value.includes(id)
      ? selectedAvailable2.value.filter(x => x !== id)
      : [...selectedAvailable2.value, id];
  }
  function toggleAdded2(id: string) {
    selectedAdded2.value = selectedAdded2.value.includes(id)
      ? selectedAdded2.value.filter(x => x !== id)
      : [...selectedAdded2.value, id];
  }
  function addSelected2() {
    counting2Form.jobs = Array.from(new Set([...counting2Form.jobs, ...selectedAvailable2.value]));
    selectedAvailable2.value = [];
    saveState();
  }
  function removeSelected2() {
    counting2Form.jobs = counting2Form.jobs.filter(id => !selectedAdded2.value.includes(id));
    selectedAdded2.value = [];
    saveState();
  }
  function addAll2() {
    counting2Form.jobs = availableJobs2.value.map(j => j.id);
    saveState();
  }
  function removeAll2() {
    counting2Form.jobs = [];
    saveState();
  }

  // Persist/restore
  async function saveState() {
    const snapshot = {
      counting1Form: { ...counting1Form },
      counting2Form: { ...counting2Form },
      filter1: filter1.value,
      filter2: filter2.value,
      dates1: { ...dates1.value },
      dates2: { ...dates2.value },
      selectedTeams1: selectedTeams1.value.map(t => t.id),
      selectedTeams2: selectedTeams2.value.map(t => t.id),
      teamJobs1: Array.from(teamJobs1.value.entries()),
      teamJobs2: Array.from(teamJobs2.value.entries()),
      currentStep: currentStep.value
    };
    try {
      await indexedDBService.saveState(JSON.parse(JSON.stringify(snapshot)), STORAGE_KEY);
    } catch {
      alertService.error({ title: 'Erreur', text: 'Impossible de sauvegarder.' });
    }
  }
  async function loadState() {
    try {
      const saved: any = await indexedDBService.getState(STORAGE_KEY);
      if (saved) {
        Object.assign(counting1Form, saved.counting1Form);
        Object.assign(counting2Form, saved.counting2Form);
        filter1.value = saved.filter1 || '';
        filter2.value = saved.filter2 || '';
        Object.assign(dates1.value, saved.dates1 || {});
        Object.assign(dates2.value, saved.dates2 || {});
        if (saved.teamJobs1) {
          teamJobs1.value = new Map(saved.teamJobs1);
          selectedTeams1.value = (saved.selectedTeams1 || [])
            .map((id: string) => teams.find(t => t.id === id)!)
            .filter(Boolean);
        }
        if (saved.teamJobs2) {
          teamJobs2.value = new Map(saved.teamJobs2);
          selectedTeams2.value = (saved.selectedTeams2 || [])
            .map((id: string) => teams.find(t => t.id === id)!)
            .filter(Boolean);
        }
        if (typeof saved.currentStep === 'number') {
          currentStep.value = saved.currentStep;
        }
      }
    } catch {
      alertService.error({ title: 'Erreur', text: 'Impossible de charger.' });
    } finally {
      loaded.value = true;
    }
  }

  // Assign actions
  async function handleTeamSelect1() {
    if (!counting1Form.team || !counting1Form.jobs.length) {
      return alertService.error({ title: 'Validation', text: 'Sélectionnez équipe & job.' });
    }
    if (selectedTeams1.value.some(t => t.id === counting1Form.team)) {
      return alertService.error({ title: 'Validation', text: 'Déjà affectée.' });
    }
    selectedTeams1.value.push(teams.find(t => t.id === counting1Form.team)!);
    teamJobs1.value.set(counting1Form.team, [...counting1Form.jobs]);
    // reset form1
    counting1Form.team = '';
    counting1Form.jobs = [];
    filter1.value = '';
    selectedAvailable1.value = [];
    selectedAdded1.value = [];
    dates1.value = {};
    await saveState();
  }
  async function handleTeamSelect2() {
    if (!counting2Form.team || !counting2Form.jobs.length) {
      return alertService.error({ title: 'Validation', text: 'Sélectionnez équipe & job.' });
    }
    if (selectedTeams2.value.some(t => t.id === counting2Form.team)) {
      return alertService.error({ title: 'Validation', text: 'Déjà affectée.' });
    }
    selectedTeams2.value.push(teams.find(t => t.id === counting2Form.team)!);
    teamJobs2.value.set(counting2Form.team, [...counting2Form.jobs]);
    // reset form2
    counting2Form.team = '';
    counting2Form.jobs = [];
    filter2.value = '';
    selectedAvailable2.value = [];
    selectedAdded2.value = [];
    dates2.value = {};
    await saveState();
  }

  async function validateStep(prev: number) {
    if (prev === 0 && !selectedTeams1.value.length) {
      alertService.error({ title: 'Validation', text: 'Affectez au moins une équipe au 1er comptage.' });
      return false;
    }
    if (prev === 1 && !selectedTeams2.value.length) {
      alertService.error({ title: 'Validation', text: 'Affectez au moins une équipe au 2e comptage.' });
      return false;
    }
    return true;
  }

  function cancelAffecter() {
    alertService.confirm({ title: 'Annuler', text: 'Toutes les données seront perdues.' })
      .then(res => {
        if (res.isConfirmed) {
          indexedDBService.clearState(STORAGE_KEY);
          selectedTeams1.value = [];
          selectedTeams2.value = [];
          teamJobs1.value.clear();
          teamJobs2.value.clear();
          currentStep.value = 0;
          saveState();
        }
      });
  }

  watch([
    () => counting1Form.team,
    () => counting1Form.jobs.join(','),
    () => counting2Form.team,
    () => counting2Form.jobs.join(','),
    selectedTeams1,
    selectedTeams2,
    currentStep
  ], saveState, { deep: true });

  onMounted(async () => {
    await loadState();
    await saveState();
  });

  return {
    currentStep,
    loaded,
    counting1Form,
    counting2Form,
    filter1,
    filter2,
    selectedAvailable1,
    selectedAvailable2,
    selectedAdded1,
    selectedAdded2,
    dates1,
    dates2,
    filteredAvailable1,
    filteredAvailable2,
    addedJobs1,
    addedJobs2,
    selectedTeams1,
    selectedTeams2,
    teamJobs1,
    teamJobs2,
    formFields1,
    formFields2,
    availableJobs1,
    availableJobs2,
    toggleAvailable1,
    toggleAdded1,
    addSelected1,
    removeSelected1,
    addAll1,
    removeAll1,
    toggleAvailable2,
    toggleAdded2,
    addSelected2,
    removeSelected2,
    addAll2,
    removeAll2,
    handleTeamSelect1,
    handleTeamSelect2,
    validateStep,
    cancelAffecter,
    saveState
  };
}
