import { ref, computed } from 'vue';
import { format } from 'date-fns';
import type { Team, Job, PlanningState } from '@/interfaces/planning';
import { planningService } from '@/services/planningService';
import { alertService } from '../services/alertService';

export function usePlanning() {
  const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'));
  const teams = ref<Team[]>([]);
  const jobs = ref<Job[]>([]);
  const newTeamName = ref('');
  const showNewTeamForm = ref(false);
  const showNewJobForm = ref(false);
  const selectedLocations = ref<string[]>([]);
  const isSubmitting = ref(false);

  const locations = planningService.getLocations();

  const canCreateTeam = computed(() => newTeamName.value.trim() !== '');
  const canCreateJob = computed(() => selectedLocations.value.length > 0);
  const canValidate = computed(
    () => !!selectedDate.value && teams.value.length > 0 && jobs.value.length > 0 && !isSubmitting.value
  );

  const addTeam = () => {
    if (!canCreateTeam.value) return;
    teams.value.push({ id: crypto.randomUUID(), name: newTeamName.value.trim() });
    newTeamName.value = '';
    showNewTeamForm.value = false;
  };

  const deleteTeam = (id: string) => {
    teams.value = teams.value.filter(t => t.id !== id);
  };

  const toggleLocation = (loc: string) => {
    if (selectedLocations.value.includes(loc)) {
      selectedLocations.value = selectedLocations.value.filter(l => l !== loc);
    } else {
      selectedLocations.value.push(loc);
    }
  };

  const addJob = () => {
    if (!canCreateJob.value) return;
    jobs.value.push({ id: crypto.randomUUID(), locations: [...selectedLocations.value] });
    selectedLocations.value = [];
    showNewJobForm.value = false;
  };

  const deleteJob = (id: string) => {
    jobs.value = jobs.value.filter(j => j.id !== id);
  };

  const validateAll = async () => {
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
    } catch (error) {
      await alertService.error({
        text: 'Erreur lors de la validation du planning'
      });
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    selectedDate,
    teams,
    jobs,
    newTeamName,
    showNewTeamForm,
    showNewJobForm,
    selectedLocations,
    locations,
    isSubmitting,
    canCreateTeam,
    canCreateJob,
    canValidate,
    addTeam,
    deleteTeam,
    toggleLocation,
    addJob,
    deleteJob,
    validateAll
  };
}