import { ref, computed, onMounted } from 'vue';
import type { Team, Job } from '@/interfaces/planning';
import { alertService } from '@/services/alertService';

const STORAGE_KEY = 'affecter';
const PLANNING_DATE = '2025-06-04';

const teams: Team[] = [
  { id: '1', name: 'Équipe A', session: '1' },
  { id: '2', name: 'Équipe B', session: '1' },
  { id: '3', name: 'Équipe C', session: '1' }
];

const jobs: Job[] = [
  { id: '1', locations: ['Emplacement A1', 'Emplacement A2'] },
  { id: '2', locations: ['Emplacement B1'] },
  { id: '3', locations: ['Emplacement C1', 'Emplacement C2', 'Emplacement C3'] }
];

export function useAffecter() {
  const localTeamJobs1 = ref<Map<string, string[]>>(new Map());
  const localTeamJobs2 = ref<Map<string, string[]>>(new Map());
  const localDates1 = ref<Record<string, string>>({});
  const localDates2 = ref<Record<string, string>>({});

  function validateDate(date: string): boolean {
    const planningDate = new Date(PLANNING_DATE);
    const assignmentDate = new Date(date);
    
    if (assignmentDate < planningDate) {
      alertService.error({ 
        title: 'Date invalide', 
        text: 'La date d\'affectation doit être égale ou postérieure à la date de planification.' 
      });
      return false;
    }
    return true;
  }

  async function affecterAuPremierComptage(team: string, jobIds: string[], date: string) {
    if (!validateDate(date)) {
      return;
    }

    const teamObj = teams.find(t => t.name === team);
    if (!teamObj) {
      alertService.error({ title: 'Erreur', text: 'Équipe non trouvée.' });
      return;
    }

    // Supprime d’abord les anciennes affectations
    jobIds.forEach(jobId => {
      localTeamJobs1.value.forEach((jobs, teamId) => {
        const idx = jobs.indexOf(jobId);
        if (idx !== -1) {
          jobs.splice(idx, 1);
          if (jobs.length === 0) {
            localTeamJobs1.value.delete(teamId);
          }
        }
      });
    });

    // Ajoute les nouvelles affectations
    const existingJobs = localTeamJobs1.value.get(teamObj.id) || [];
    localTeamJobs1.value.set(teamObj.id, [...existingJobs, ...jobIds]);
    jobIds.forEach(jobId => {
      localDates1.value[jobId] = date;
    });
    alertService.success({ text: 'Premier comptage affecté avec succès.' });
  }

  async function affecterAuDeuxiemeComptage(team: string, jobIds: string[], date: string) {
    if (!validateDate(date)) {
      return;
    }

    const teamObj = teams.find(t => t.name === team);
    if (!teamObj) {
      alertService.error({ title: 'Erreur', text: 'Équipe non trouvée.' });
      return;
    }

    // Vérifie que chaque job est déjà en premier comptage
    const notAssignedToFirst = jobIds.some(jobId => {
      let isAssigned = false;
      localTeamJobs1.value.forEach((jobs, _) => {
        if (jobs.includes(jobId)) isAssigned = true;
      });
      return !isAssigned;
    });
    if (notAssignedToFirst) {
      alertService.warning({ text: 'Les jobs doivent d\'abord être affectés au premier comptage.' });
      return;
    }

    // Supprime d’abord les anciennes affectations du deuxième comptage
    jobIds.forEach(jobId => {
      localTeamJobs2.value.forEach((jobs, teamId) => {
        const idx = jobs.indexOf(jobId);
        if (idx !== -1) {
          jobs.splice(idx, 1);
          if (jobs.length === 0) {
            localTeamJobs2.value.delete(teamId);
          }
        }
      });
    });

    // Puis ajoute les nouvelles affectations du deuxième comptage
    const existingJobs = localTeamJobs2.value.get(teamObj.id) || [];
    localTeamJobs2.value.set(teamObj.id, [...existingJobs, ...jobIds]);
    jobIds.forEach(jobId => {
      localDates2.value[jobId] = date;
    });
    alertService.success({ text: 'Deuxième comptage affecté avec succès.' });
  }

  const rows = computed(() => {
    return jobs.map((jobObj) => {
      const jobId = jobObj.id;
      const jobLabel = jobObj.locations.join(', ');

      let team1Name = '';
      localTeamJobs1.value.forEach((jobList, teamId) => {
        if (jobList.includes(jobId)) {
          const t = teams.find(x => x.id === teamId);
          if (t) team1Name = t.name;
        }
      });
      const date1 = localDates1.value[jobId] || '';

      let team2Name = '';
      localTeamJobs2.value.forEach((jobList, teamId) => {
        if (jobList.includes(jobId)) {
          const t = teams.find(x => x.id === teamId);
          if (t) team2Name = t.name;
        }
      });
      const date2 = localDates2.value[jobId] || '';

      return {
        id: jobId,
        job: jobLabel,
        team1: team1Name,
        date1,
        team2: team2Name,
        date2,
        locations: jobObj.locations, // tableau des emplacements
      };
    });
  });

  return {
    rows,
    affecterAuPremierComptage,
    affecterAuDeuxiemeComptage,
    cancelAffecter: async () => {
      localTeamJobs1.value.clear();
      localTeamJobs2.value.clear();
      localDates1.value = {};
      localDates2.value = {};
    },
    PLANNING_DATE
  };
}
