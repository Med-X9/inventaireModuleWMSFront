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
  { id: '6', locations: ['job F'] },
];

export function useAffecter() {
  const currentStep = ref(0);
  const loaded = ref(false);

  // Formulaires en reactive pour jamais devenir undefined
  const counting1Form = reactive<{ team: string; jobs: string[] }>({ team: '', jobs: [] });
  const counting2Form = reactive<{ team: string; jobs: string[] }>({ team: '', jobs: [] });

  const selectedTeams1 = ref<Team[]>([]);
  const selectedTeams2 = ref<Team[]>([]);
  const teamJobs1 = ref<Map<string, string[]>>(new Map());
  const teamJobs2 = ref<Map<string, string[]>>(new Map());

  // Only show jobs not yet assigned:
  const availableJobs1 = computed(() => {
    const taken = new Set(Array.from(teamJobs1.value.values()).flat());
    return jobs.filter(j => !taken.has(j.id));
  });
  const availableJobs2 = computed(() => {
    const taken = new Set(Array.from(teamJobs2.value.values()).flat());
    return jobs.filter(j => !taken.has(j.id));
  });

  // FormBuilder fields
  const formFields1 = computed<FieldConfig[]>(() => [
    {
      key: 'team',
      label: 'Sélectionner une équipe',
      type: 'select',
      options: teams.map(t => ({ label: t.name, value: t.id })),
      multiple: false,
      searchable: true,
      clearable: true,
      props: { placeholder: 'Rechercher une équipe...' },
      validators: [{ key: 'required', fn: v => !!v, msg: 'Veuillez sélectionner une équipe' }]
    },
    {
      key: 'jobs',
      label: 'Sélectionner les jobs',
      type: 'button-group',
      options: availableJobs1.value.map(j => ({ label: j.locations.join(', '), value: j.id })),
      validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Veuillez sélectionner au moins une job' }]
    }
  ]);

  const formFields2 = computed<FieldConfig[]>(() => [
    {
      key: 'team',
      label: 'Sélectionner une équipe',
      type: 'select',
      options: teams.map(t => ({ label: t.name, value: t.id })),
      multiple: false,
      searchable: true,
      clearable: true,
      props: { placeholder: 'Rechercher une équipe...' },
      validators: [{ key: 'required', fn: v => !!v, msg: 'Veuillez sélectionner une équipe' }]
    },
    {
      key: 'jobs',
      label: 'Sélectionner les jobs',
      type: 'button-group',
      options: availableJobs2.value.map(j => ({ label: j.locations.join(', '), value: j.id })),
      validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Veuillez sélectionner au moins une job' }]
    }
  ]);

  // ----- STATE PERSISTENCE -----

  // Sauvegarde (JSON clone pour éviter DataCloneError)
  async function saveState() {
    const snapshot = {
      counting1Form: { team: counting1Form.team, jobs: [...counting1Form.jobs] },
      counting2Form: { team: counting2Form.team, jobs: [...counting2Form.jobs] },
      selectedTeams1: selectedTeams1.value.map(t => t.id),
      selectedTeams2: selectedTeams2.value.map(t => t.id),
      teamJobs1: Array.from(teamJobs1.value.entries()),
      teamJobs2: Array.from(teamJobs2.value.entries()),
      currentStep: currentStep.value
    };

    try {
      const clone = JSON.parse(JSON.stringify(snapshot));
      await indexedDBService.saveState(clone, STORAGE_KEY);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de sauvegarder l’état actuel.'
      });
    }
  }

  // Chargement (avec gardes)
  async function loadState() {
    try {
      const saved: any = await indexedDBService.getState(STORAGE_KEY);
      if (!saved || typeof saved !== 'object') {
        // pas de brouillon -> on skip
        return;
      }

      // on ne remplace chaque propriété que si elle existe
      if (saved.counting1Form) {
        counting1Form.team = saved.counting1Form.team ?? '';
        counting1Form.jobs = Array.isArray(saved.counting1Form.jobs) ? saved.counting1Form.jobs : [];
      }
      if (saved.counting2Form) {
        counting2Form.team = saved.counting2Form.team ?? '';
        counting2Form.jobs = Array.isArray(saved.counting2Form.jobs) ? saved.counting2Form.jobs : [];
      }

      if (Array.isArray(saved.teamJobs1)) {
        teamJobs1.value = new Map(saved.teamJobs1.filter(([k]) => typeof k === 'string'));
      }
      if (Array.isArray(saved.teamJobs2)) {
        teamJobs2.value = new Map(saved.teamJobs2.filter(([k]) => typeof k === 'string'));
      }

      if (Array.isArray(saved.selectedTeams1)) {
        selectedTeams1.value = saved.selectedTeams1
          .map((id: string) => teams.find(t => t.id === id))
          .filter((t): t is Team => !!t);
      }
      if (Array.isArray(saved.selectedTeams2)) {
        selectedTeams2.value = saved.selectedTeams2
          .map((id: string) => teams.find(t => t.id === id))
          .filter((t): t is Team => !!t);
      }

      if (typeof saved.currentStep === 'number') {
        currentStep.value = saved.currentStep;
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de charger votre brouillon.'
      });
    } finally {
      loaded.value = true;
    }
  }

  // ----- ACTIONS UTILITAIRES -----

  async function _clearAll1NoConfirm() {
    selectedTeams1.value = [];
    teamJobs1.value.clear();
    await saveState();
  }
  async function _clearAll2NoConfirm() {
    selectedTeams2.value = [];
    teamJobs2.value.clear();
    await saveState();
  }

  async function handleTeamSelect1() {
    const { team, jobs: selJobs } = counting1Form;
    if (!team || !selJobs.length) {
      await alertService.error({
        title: 'Validation',
        text: !team ? 'Veuillez sélectionner une équipe' : 'Veuillez sélectionner au moins une job'
      });
      return;
    }
    if (selectedTeams1.value.some(t => t.id === team)) {
      await alertService.error({
        title: 'Validation',
        text: 'Équipe déjà affectée au premier comptage.'
      });
      return;
    }
    selectedTeams1.value.push(teams.find(t => t.id === team)!);
    teamJobs1.value.set(team, [...selJobs]);
    counting1Form.team = '';
    counting1Form.jobs = [];
    await saveState();
  }

  async function handleTeamSelect2() {
    const { team, jobs: selJobs } = counting2Form;
    if (!team || !selJobs.length) {
      await alertService.error({
        title: 'Validation',
        text: !team ? 'Veuillez sélectionner une équipe' : 'Veuillez sélectionner au moins une job'
      });
      return;
    }
    if (selectedTeams2.value.some(t => t.id === team)) {
      await alertService.error({
        title: 'Validation',
        text: 'Équipe déjà affectée au deuxième comptage.'
      });
      return;
    }
    selectedTeams2.value.push(teams.find(t => t.id === team)!);
    teamJobs2.value.set(team, [...selJobs]);
    counting2Form.team = '';
    counting2Form.jobs = [];
    await saveState();
  }

  async function removeTeam1(id: string) {
    selectedTeams1.value = selectedTeams1.value.filter(t => t.id !== id);
    teamJobs1.value.delete(id);
    await saveState();
  }
  async function removeTeam2(id: string) {
    selectedTeams2.value = selectedTeams2.value.filter(t => t.id !== id);
    teamJobs2.value.delete(id);
    await saveState();
  }

  async function clearAll1() {
    const res = await alertService.confirm({
      title: 'Confirmation',
      text: 'Retirer toutes les équipes du premier comptage ?'
    });
    if (res.isConfirmed) await _clearAll1NoConfirm();
  }
  async function clearAll2() {
    const res = await alertService.confirm({
      title: 'Confirmation',
      text: 'Retirer toutes les équipes du deuxième comptage ?'
    });
    if (res.isConfirmed) await _clearAll2NoConfirm();
  }

  async function cancelAffecter() {
    const res = await alertService.confirm({
      title: 'Annuler les affectations',
      text: 'Toutes les affectations seront perdues, continuer ?'
    });
    if (!res.isConfirmed) return;
    await indexedDBService.clearState(STORAGE_KEY);
    await _clearAll1NoConfirm();
    await _clearAll2NoConfirm();
    counting1Form.team = '';
    counting1Form.jobs = [];
    counting2Form.team = '';
    counting2Form.jobs = [];
    currentStep.value = 0;
    await saveState();
  }

  async function validateStep(prev: number) {
    if (prev === 0 && !selectedTeams1.value.length) {
      await alertService.error({ title: 'Validation', text: 'Affectez au moins une équipe au 1er comptage.' });
      return false;
    }
    if (prev === 1 && !selectedTeams2.value.length) {
      await alertService.error({ title: 'Validation', text: 'Affectez au moins une équipe au 2e comptage.' });
      return false;
    }
    return true;
  }

  function getJobLocation(id: string) {
    return jobs.find(j => j.id === id)?.locations.join(', ') || '';
  }

  // Watchers & Mount
  watch(
    [() => counting1Form.team, () => counting1Form.jobs.join(','), () => counting2Form.team, () => counting2Form.jobs.join(','), selectedTeams1, selectedTeams2, currentStep],
    saveState,
    { deep: true }
  );

  onMounted(async () => {
    await loadState();
    // Pour s'assurer qu'on ait un state valide dès l'initialisation
    await saveState();
  });

  return {
    currentStep,
    loaded,
    counting1Form,
    counting2Form,
    formFields1,
    formFields2,
    selectedTeams1,
    selectedTeams2,
    teamJobs1,
    teamJobs2,
    availableJobs1,
    availableJobs2,
    handleTeamSelect1,
    handleTeamSelect2,
    removeTeam1,
    removeTeam2,
    clearAll1,
    clearAll2,
    getJobLocation,
    validateStep,
    cancelAffecter,
    saveState
  };
}
