// src/composables/useAffecter.ts
import { ref, computed, watch, onMounted } from 'vue';
import type { Team, Job } from '@/interfaces/planning';
import type { FieldConfig } from '@/interfaces/form';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';

const STORAGE_KEY = 'affecter';

export function useAffecter() {
  const currentStep = ref(0);
  const loaded = ref(false);

  const counting1Form = ref<{ team: string; jobs: string[] }>({ team: '', jobs: [] });
  const counting2Form = ref<{ team: string; jobs: string[] }>({ team: '', jobs: [] });

  const selectedTeams1 = ref<Team[]>([]);
  const selectedTeams2 = ref<Team[]>([]);
  const teamJobs1 = ref<Map<string, string[]>>(new Map());
  const teamJobs2 = ref<Map<string, string[]>>(new Map());

  const availableJobs1 = computed(() => {
    const taken = new Set(Array.from(teamJobs1.value.values()).flat());
    return jobs.filter(j => !taken.has(j.id));
  });
  const availableJobs2 = computed(() => {
    const taken = new Set(Array.from(teamJobs2.value.values()).flat());
    return jobs.filter(j => !taken.has(j.id));
  });

  const formFields1 = computed<FieldConfig[]>(() => [
    {
      key: 'team', label: 'Sélectionner une équipe', type: 'select',
      options: teams.map(t => ({ label: t.name, value: t.id })),
      multiple: false, searchable: true, clearable: true,
      props: { placeholder: 'Rechercher...' },
      validators: [{ key: 'required', fn: v => !!v, msg: 'Équipe requise' }]
    },
    {
      key: 'jobs', label: 'Sélectionner les jobs', type: 'button-group',
      options: availableJobs1.value.map(j => ({ label: j.locations.join(', '), value: j.id })),
      validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Au moins un job' }]
    }
  ]);

  const formFields2 = computed<FieldConfig[]>(() => [
    {
      key: 'team', label: 'Sélectionner une équipe', type: 'select',
      options: teams.map(t => ({ label: t.name, value: t.id })),
      multiple: false, searchable: true, clearable: true,
      props: { placeholder: 'Rechercher...' },
      validators: [{ key: 'required', fn: v => !!v, msg: 'Équipe requise' }]
    },
    {
      key: 'jobs', label: 'Sélectionner les jobs', type: 'button-group',
      options: availableJobs2.value.map(j => ({ label: j.locations.join(', '), value: j.id })),
      validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Au moins un job' }]
    }
  ]);

  function handleTeamSelect1() {
    const { team, jobs: selJobs } = counting1Form.value;
    if (!team) return;
    if (!selectedTeams1.value.find(t => t.id === team)) {
      selectedTeams1.value.push(teams.find(t => t.id === team)!);
      teamJobs1.value.set(team, selJobs.slice());  // Map.set :contentReference[oaicite:4]{index=4}
    }
    counting1Form.value = { team: '', jobs: [] };
  }
  function handleTeamSelect2() {
    const { team, jobs: selJobs } = counting2Form.value;
    if (!team) return;
    if (!selectedTeams2.value.find(t => t.id === team)) {
      selectedTeams2.value.push(teams.find(t => t.id === team)!);
      teamJobs2.value.set(team, selJobs.slice());
    }
    counting2Form.value = { team: '', jobs: [] };
  }

  function removeTeam1(id: string) {
    selectedTeams1.value = selectedTeams1.value.filter(t => t.id !== id);
    teamJobs1.value.delete(id);
  }
  function removeTeam2(id: string) {
    selectedTeams2.value = selectedTeams2.value.filter(t => t.id !== id);
    teamJobs2.value.delete(id);
  }
  function clearAll1() { selectedTeams1.value = []; teamJobs1.value.clear(); }
  function clearAll2() { selectedTeams2.value = []; teamJobs2.value.clear(); }

  function getJobLocation(id: string) {
    return jobs.find(j => j.id === id)?.locations.join(', ') || '';
  }

  function validateStep(prev: number) {
    if (prev === 0 && !selectedTeams1.value.length) {
      alert('Ajoutez au moins une équipe au 1ᵉʳ comptage');
      return false;
    }
    if (prev === 1 && !selectedTeams2.value.length) {
      alert('Ajoutez au moins une équipe au 2ᵉ comptage');
      return false;
    }
    return true;
  }

  async function saveState() {
    const snapshot = {
      counting1Form: counting1Form.value,
      counting2Form: counting2Form.value,
      selectedTeams1: selectedTeams1.value.map(t => t.id),
      selectedTeams2: selectedTeams2.value.map(t => t.id),
      teamJobs1: Array.from(teamJobs1.value.entries()),    // Map.entries :contentReference[oaicite:5]{index=5}
      teamJobs2: Array.from(teamJobs2.value.entries()),
      currentStep: currentStep.value
    };
    await indexedDBService.saveState(JSON.parse(JSON.stringify(snapshot)), STORAGE_KEY);
  }

  async function loadState() {
    const saved = await indexedDBService.getState(STORAGE_KEY);
    if (saved) {
      counting1Form.value = saved.counting1Form;
      counting2Form.value = saved.counting2Form;
      teamJobs1.value = new Map(saved.teamJobs1);
      teamJobs2.value = new Map(saved.teamJobs2);
      selectedTeams1.value = saved.selectedTeams1.map((id: string) => teams.find(t => t.id === id)!);
      selectedTeams2.value = saved.selectedTeams2.map((id: string) => teams.find(t => t.id === id)!);
      currentStep.value = saved.currentStep;
    }
    loaded.value = true;
  }

  async function cancelAffecter() {
    const res = await alertService.confirm({ title: 'Annuler', text: 'Effacer l’état ?' });
    if (res.isConfirmed) {
      await indexedDBService.clearState(STORAGE_KEY);
      counting1Form.value = { team: '', jobs: [] };
      counting2Form.value = { team: '', jobs: [] };
      clearAll1(); clearAll2();
      currentStep.value = 0;
      await saveState();
    }
  }

  watch(
    [counting1Form, counting2Form, selectedTeams1, selectedTeams2, currentStep],
    saveState,
    { deep: true }
  );
  onMounted(loadState);

  return {
    currentStep, loaded,
    counting1Form, counting2Form,
    formFields1, formFields2,
    selectedTeams1, selectedTeams2,
    teamJobs1, teamJobs2,
    availableJobs1, availableJobs2,
    handleTeamSelect1, handleTeamSelect2,
    removeTeam1, removeTeam2,
    clearAll1, clearAll2,
    getJobLocation, validateStep,
    cancelAffecter
  };
}

// Mock data (à extraire en service si besoin)
const teams: Team[] = [
  { id: '1', name: 'Équipe A' },
  { id: '2', name: 'Équipe B' },
  { id: '3', name: 'Équipe C' }
];
const jobs: Job[] = [
  { id: '1', locations: ['Zone A'] },
  { id: '2', locations: ['Zone B'] },
  { id: '3', locations: ['Zone C'] }
];
