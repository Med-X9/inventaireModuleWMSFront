import { ref, computed, watch, onMounted } from 'vue';
import { format } from 'date-fns';
import type { Team, Job, PlanningState } from '@/interfaces/planning';
import { planningService } from '@/services/planningService';
import { alertService } from '@/services/alertService';
import { useAppStore } from '@/stores';

export function usePlanning() {
  const appStore = useAppStore();

  // Date, équipes et jobs
  const selectedDate = ref<string>(format(new Date(), 'yyyy-MM-dd'));
  const teams = ref<Team[]>([]);
  const jobs = ref<Job[]>([]);
  const showNewTeamForm = ref<boolean>(false);
  const showNewJobForm = ref<boolean>(false);
  const isSubmitting = ref<boolean>(false);

  // Modes d'affichage persistés pour équipes et jobs
  const viewModeTeams = computed<'table' | 'grid'>({
    get: () => appStore.planningTeamsViewMode,
    set: mode => appStore.setPlanningTeamsViewMode(mode)
  });
  const viewModeJobs = computed<'table' | 'grid'>({
    get: () => appStore.planningJobsViewMode,
    set: mode => appStore.setPlanningJobsViewMode(mode)
  });

  const locations = planningService.getLocations();

  const canValidate = computed<boolean>(
    () => !!selectedDate.value && teams.value.length > 0 && jobs.value.length > 0 && !isSubmitting.value
  );

  // Charger l'état depuis localStorage
  onMounted(() => {
    const saved = localStorage.getItem('planningState');
    if (saved) {
      const state = JSON.parse(saved) as PlanningState;
      selectedDate.value = state.selectedDate;
      teams.value = state.teams;
      jobs.value = state.jobs;
    }
  });

  // Sauvegarder automatiquement
  watch([selectedDate, teams, jobs], () => {
    const snapshot: PlanningState = {
      selectedDate: selectedDate.value,
      teams: teams.value,
      jobs: jobs.value,
      isSubmitting: false
    };
    localStorage.setItem('planningState', JSON.stringify(snapshot));
  }, { deep: true });

  async function cancelPlanning() {
    const result = await alertService.confirm({
      title: 'Annuler la planification',
      text: 'Voulez-vous vraiment annuler et effacer le state ?'
    });
    if (!result.isConfirmed) return;
    localStorage.removeItem('planningState');
    selectedDate.value = format(new Date(), 'yyyy-MM-dd');
    teams.value = [];
    jobs.value = [];
    showNewTeamForm.value = false;
    showNewJobForm.value = false;
  }

  async function validateAll() {
    if (!canValidate.value) return;
    isSubmitting.value = true;
    try {
      const planningData: PlanningState = {
        selectedDate: selectedDate.value,
        teams: teams.value,
        jobs: jobs.value,
        isSubmitting: false
      };
      await planningService.savePlanning(planningData);
      localStorage.removeItem('planningState');
    } catch {
      await alertService.error({ text: 'Erreur lors de la validation du planning' });
    } finally {
      isSubmitting.value = false;
    }
  }

  function addTeam(data: { name: string }) {
    teams.value.push({ id: crypto.randomUUID(), name: data.name });
    showNewTeamForm.value = false;
  }

  function deleteTeam(id: string) {
    teams.value = teams.value.filter(t => t.id !== id);
  }

  function addJob(data: { locations: string[] }) {
    jobs.value.push({ id: crypto.randomUUID(), locations: data.locations });
    showNewJobForm.value = false;
  }

  function deleteJob(id: string) {
    jobs.value = jobs.value.filter(j => j.id !== id);
  }

  return {
    selectedDate,
    teams,
    jobs,
    locations,
    isSubmitting,
    canValidate,
    showNewTeamForm,
    showNewJobForm,
    viewModeTeams,
    viewModeJobs,
    addTeam,
    deleteTeam,
    addJob,
    deleteJob,
    validateAll,
    cancelPlanning
  };
}