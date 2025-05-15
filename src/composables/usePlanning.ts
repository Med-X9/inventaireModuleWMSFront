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

  const teamForm = ref<{ name: string }>({ name: '' });
  const jobForm = ref<{ locations: string[] }>({ locations: [] });

  const showNewTeamForm = ref(false);
  const showNewJobForm = ref(false);
  const isSubmitting = ref(false);
  const locations = planningService.getLocations();

  const canValidate = computed(
    () =>
      !!selectedDate.value &&
      teams.value.length > 0 &&
      jobs.value.length > 0 &&
      !isSubmitting.value
  );

  async function saveState() {
    const snap = {
      selectedDate: selectedDate.value,
      teams: teams.value,
      jobs: jobs.value,
      teamForm: teamForm.value,
      jobForm: jobForm.value
    };
    try {
      await indexedDBService.saveState(JSON.parse(JSON.stringify(snap)), STORAGE_KEY);
    } catch {
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de sauvegarder l’état.'
      });
    }
  }

  async function loadState() {
    try {
      const saved = await indexedDBService.getState(STORAGE_KEY);
      if (saved) {
        const s: any = saved;
        selectedDate.value = s.selectedDate;
        teams.value = s.teams || [];
        jobs.value = s.jobs || [];
        teamForm.value = s.teamForm || { name: '' };
        jobForm.value = s.jobForm || { locations: [] };
      }
    } catch {
      await alertService.error({
        title: 'Erreur',
        text: 'Impossible de charger l’état.'
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
      () => teamForm.value.name,
      () => jobForm.value.locations
    ],
    saveState,
    { deep: true }
  );

  async function cancelPlanning() {
    const res = await alertService.confirm({
      title: 'Annuler',
      text: 'Effacer le state ?'
    });
    if (!res.isConfirmed) return;
    try {
      await indexedDBService.clearState(STORAGE_KEY);
    } catch {}
    selectedDate.value = format(new Date(), 'yyyy-MM-dd');
    teams.value = [];
    jobs.value = [];
    teamForm.value = { name: '' };
    jobForm.value = { locations: [] };
    showNewTeamForm.value = false;
    showNewJobForm.value = false;
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

  async function addTeam(data: { name: string }) {
    teams.value.push({ id: crypto.randomUUID(), name: data.name });
    teamForm.value.name = '';
    showNewTeamForm.value = false;
    await nextTick();
  }

  async function addJob(data: { locations: string[] }) {
    jobs.value.push({ id: crypto.randomUUID(), locations: data.locations });
    jobForm.value.locations = [];
    showNewJobForm.value = false;
    await nextTick();
  }

  // Confirmation avant suppression
  async function deleteTeam(id: string) {
    const res = await alertService.confirm({
      title: 'Confirmer la suppression',
      text: 'Voulez-vous vraiment supprimer cette équipe ?'
    });
    if (res.isConfirmed) {
      teams.value = teams.value.filter(t => t.id !== id);
    }
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
    locations,
    teamForm,
    jobForm,
    showNewTeamForm,
    showNewJobForm,
    isSubmitting,
    canValidate,
    addTeam,
    addJob,
    deleteTeam,
    deleteJob,
    validateAll,
    cancelPlanning
  };
}
