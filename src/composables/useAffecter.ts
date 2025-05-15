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

  async function saveState() {
    try {
      const snapshot = {
        counting1Form: counting1Form.value,
        counting2Form: counting2Form.value,
        selectedTeams1: selectedTeams1.value.map(t => t.id),
        selectedTeams2: selectedTeams2.value.map(t => t.id),
        teamJobs1: Array.from(teamJobs1.value.entries()),
        teamJobs2: Array.from(teamJobs2.value.entries()),
        currentStep: currentStep.value
      };
      await indexedDBService.saveState(JSON.parse(JSON.stringify(snapshot)), STORAGE_KEY);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de sauvegarder l\'état actuel.'
      });
    }
  }

  async function loadState() {
    try {
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
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de charger votre brouillon.'
      });
    } finally {
      loaded.value = true;
    }
  }

  async function handleTeamSelect1() {
    const { team, jobs: selJobs } = counting1Form.value;
    if (!team || !selJobs.length) {
      await alertService.error({
        title: 'Validation',
        text: !team ? 'Veuillez sélectionner une équipe' : 'Veuillez sélectionner au moins une job'
      });
      return;
    }
    if (selectedTeams1.value.find(t => t.id === team)) {
      await alertService.error({
        title: 'Validation',
        text: 'Cette équipe est déjà affectée au premier comptage.'
      });
      return;
    }
    selectedTeams1.value.push(teams.find(t => t.id === team)!);
    teamJobs1.value.set(team, selJobs.slice());

    counting1Form.value = { team: '', jobs: [] };
    await saveState();
  }

  async function handleTeamSelect2() {
    const { team, jobs: selJobs } = counting2Form.value;
    if (!team || !selJobs.length) {
      await alertService.error({
        title: 'Validation',
        text: !team ? 'Veuillez sélectionner une équipe' : 'Veuillez sélectionner au moins une job'
      });
      return;
    }
    if (selectedTeams2.value.find(t => t.id === team)) {
      await alertService.error({
        title: 'Validation',
        text: 'Cette équipe est déjà affectée au deuxième comptage.'
      });
      return;
    }
    selectedTeams2.value.push(teams.find(t => t.id === team)!);
    teamJobs2.value.set(team, selJobs.slice());

    counting2Form.value = { team: '', jobs: [] };
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
    const result = await alertService.confirm({
      title: 'Confirmation',
      text: 'Voulez-vous vraiment retirer toutes les équipes du premier comptage ?'
    });
    if (result.isConfirmed) {
      await _clearAll1NoConfirm();
    }
  }

  async function clearAll2() {
    const result = await alertService.confirm({
      title: 'Confirmation',
      text: 'Voulez-vous vraiment retirer toutes les équipes du deuxième comptage ?'
    });
    if (result.isConfirmed) {
      await _clearAll2NoConfirm();
    }
  }

  async function cancelAffecter() {
    const res = await alertService.confirm({
      title: 'Annuler les affectations',
      text: 'Voulez-vous vraiment annuler ? Toutes les affectations seront perdues.'
    });
    if (!res.isConfirmed) return;

    await indexedDBService.clearState(STORAGE_KEY);
    await _clearAll1NoConfirm();
    await _clearAll2NoConfirm();

    counting1Form.value = { team: '', jobs: [] };
    counting2Form.value = { team: '', jobs: [] };
    currentStep.value = 0;
    await saveState();
  }

  function getJobLocation(id: string) {
    return jobs.find(j => j.id === id)?.locations.join(', ') || '';
  }

  async function validateStep(prev: number) {
    if (prev === 0 && !selectedTeams1.value.length) {
      await alertService.error({
        title: 'Validation',
        text: 'Veuillez affecter au moins une équipe au premier comptage.'
      });
      return false;
    }
    if (prev === 1 && !selectedTeams2.value.length) {
      await alertService.error({
        title: 'Validation',
        text: 'Veuillez affecter au moins une équipe au deuxième comptage.'
      });
      return false;
    }
    return true;
  }

  watch(
    [counting1Form, counting2Form, selectedTeams1, selectedTeams2, currentStep],
    saveState,
    { deep: true }
  );

  onMounted(async () => {
    await loadState();
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

const teams: Team[] = [
  { id: '1', name: 'Équipe A' },
  { id: '2', name: 'Équipe B' },
  { id: '3', name: 'Équipe C' }
];

const jobs: Job[] = [
  { id: '1', locations: ['job A'] },
  { id: '2', locations: ['job B'] },
  { id: '3', locations: ['job C'] }
];