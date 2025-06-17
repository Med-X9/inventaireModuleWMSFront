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
  const localResources = ref<Record<string, string[]>>({});

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

  function checkJobAlreadyAssigned(jobIds: string[], comptageType: 'premier' | 'deuxieme'): string[] {
    const targetMap = comptageType === 'premier' ? localTeamJobs1.value : localTeamJobs2.value;
    const alreadyAssigned: string[] = [];
    
    jobIds.forEach(jobId => {
      let isAssigned = false;
      targetMap.forEach((jobs, _) => {
        if (jobs.includes(jobId)) {
          isAssigned = true;
        }
      });
      if (isAssigned) {
        alreadyAssigned.push(jobId);
      }
    });
    
    return alreadyAssigned;
  }

  async function affecterAuPremierComptage(team: string, jobIds: string[], date: string) {
    if (!validateDate(date)) {
      return;
    }

    // Vérifier si certains jobs sont déjà affectés
    const alreadyAssigned = checkJobAlreadyAssigned(jobIds, 'premier');
    if (alreadyAssigned.length > 0) {
      const jobLabels = alreadyAssigned.map(jobId => `Job ${jobId}`).join(', ');
      alertService.error({ 
        title: 'Jobs déjà affectés', 
        text: `Le job déjà affectés au premier comptage : ${jobLabels}.` 
      });
      return;
    }

    const teamObj = teams.find(t => t.name === team);
    if (!teamObj) {
      alertService.error({ title: 'Erreur', text: 'Équipe non trouvée.' });
      return;
    }

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

    // Vérifier si certains jobs sont déjà affectés au deuxième comptage
    const alreadyAssigned = checkJobAlreadyAssigned(jobIds, 'deuxieme');
    if (alreadyAssigned.length > 0) {
      const jobLabels = alreadyAssigned.map(jobId => `Job ${jobId}`).join(', ');
      alertService.error({ 
        title: 'Jobs déjà affectés', 
        text: `Le job  déjà affectés au deuxième comptage : ${jobLabels}. .` 
      });
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
    
      return;
    }

    // Ajoute les nouvelles affectations du deuxième comptage
    const existingJobs = localTeamJobs2.value.get(teamObj.id) || [];
    localTeamJobs2.value.set(teamObj.id, [...existingJobs, ...jobIds]);
    jobIds.forEach(jobId => {
      localDates2.value[jobId] = date;
    });
    alertService.success({ text: 'Deuxième comptage affecté avec succès.' });
  }

  async function affecterRessources(jobIds: string[], resources: string[]) {
    jobIds.forEach(jobId => {
      localResources.value[jobId] = resources;
    });
    alertService.success({ text: 'Ressources affectées avec succès.' });
  }

  const rows = computed(() => {
    return jobs.map((jobObj) => {
      const jobId = jobObj.id;
      const jobReference = `Job ${jobId}`;

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

      const resources = localResources.value[jobId] || [];

      return {
        id: jobId,
        job: jobReference,
        team1: team1Name,
        date1,
        team2: team2Name,
        date2,
        resources: resources.join(', '),
        locations: jobObj.locations,
      };
    });
  });

  return {
    rows,
    affecterAuPremierComptage,
    affecterAuDeuxiemeComptage,
    affecterRessources,
    cancelAffecter: async () => {
      localTeamJobs1.value.clear();
      localTeamJobs2.value.clear();
      localDates1.value = {};
      localDates2.value = {};
      localResources.value = {};
    },
    PLANNING_DATE
  };
}