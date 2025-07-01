import { ref, computed } from 'vue';
import type { Team, Job } from '@/interfaces/planning';
import { alertService } from '@/services/alertService';

const teams: Team[] = [
  { id:'1', name:'Équipe A', session:'1' },
  { id:'2', name:'Équipe B', session:'1' },
  { id:'3', name:'Équipe C', session:'1' }
];

const jobs: Job[] = [
  { id:'1', locations:['Emplacement A1','Emplacement A2'] },
  { id:'2', locations:['Emplacement B1'] },
  { id:'3', locations:['Emplacement C1','Emplacement C2','Emplacement C3'] }
];

// stockage local
const localTeamJobs1 = ref<Map<string,string[]>>(new Map());
const localTeamJobs2 = ref<Map<string,string[]>>(new Map());
const localDates1 = ref<Record<string,string>>({});
const localDates2 = ref<Record<string,string>>({});
const localResources = ref<Record<string,string[]>>({});
const localValidatedJobs = ref<Set<string>>(new Set());
const localJobStatuses = ref<Record<string, 'planifier' | 'affecter' | 'valider' | 'transfere'>>({});

// Fonction pour initialiser les statuts selon le contexte d'inventaire
function initializeJobStatuses(inventoryStatus: string) {
  const defaultStatus: 'planifier' | 'affecter' = inventoryStatus === 'En réalisation' ? 'affecter' : 'planifier';
  
  jobs.forEach(job => {
    if (!localJobStatuses.value[job.id]) {
      localJobStatuses.value[job.id] = defaultStatus;
    }
  });
}

// fonctions d'affectation
async function affecterAuPremierComptage(team:string, jobIds:string[], date:string) {
  const teamObj = teams.find(t=>t.name===team);
  if (!teamObj) {
    alertService.error({ title:'Erreur', text:'Équipe introuvable.' });
    return;
  }
  
  const curr = localTeamJobs1.value.get(teamObj.id) || [];
  localTeamJobs1.value.set(teamObj.id, [...curr, ...jobIds]);
  jobIds.forEach(id => {
    localDates1.value[id] = date;
    localJobStatuses.value[id] = 'affecter';
  });
  alertService.success({ text:'Premier comptage affecté avec succès.' });
}

async function affecterAuDeuxiemeComptage(team:string, jobIds:string[], date:string) {
  const teamObj = teams.find(t=>t.name===team);
  if (!teamObj) {
    alertService.error({ title:'Erreur', text:'Équipe introuvable.' });
    return;
  }
  
  const curr = localTeamJobs2.value.get(teamObj.id) || [];
  localTeamJobs2.value.set(teamObj.id, [...curr, ...jobIds]);
  jobIds.forEach(id => {
    localDates2.value[id] = date;
    localJobStatuses.value[id] = 'affecter';
  });
  alertService.success({ text:'Deuxième comptage affecté avec succès.' });
}

async function affecterRessources(jobIds:string[], ressources:string[]) {
  jobIds.forEach(id => {
    localResources.value[id] = ressources;
    if (localJobStatuses.value[id] === 'planifier') {
      localJobStatuses.value[id] = 'affecter';
    }
  });
  alertService.success({ text:'Ressources affectées avec succès.' });
}

// Fonction de transfert - met à jour le statut vers 'transfere'
async function transfererJobs(jobIds: string[], options: { premierComptage: boolean; deuxiemeComptage: boolean }) {
  if (!options.premierComptage && !options.deuxiemeComptage) {
    alertService.error({ title: 'Erreur', text: 'Vous devez sélectionner au moins un type de comptage à transférer.' });
    return;
  }

  let message = 'Transféré: ';
  const parts: string[] = [];
  
  if (options.premierComptage) {
    parts.push('Premier comptage');
  }
  if (options.deuxiemeComptage) {
    parts.push('Deuxième comptage');
  }
  
  message += parts.join(' et ');
  
  // Changer le statut vers 'transfere' après transfert
  jobIds.forEach(id => {
    localJobStatuses.value[id] = 'transfere';
  });
  
  alertService.success({ text: message });
}

function validerJobs(jobIds:string[]) {
  jobIds.forEach(id => {
    localValidatedJobs.value.add(id);
    localJobStatuses.value[id] = 'valider';
  });
  alertService.success({ text:'Jobs validés avec succès.' });
}

// Fonction pour mise à jour inline
function updateJobField(jobId: string, field: string, value: any) {
  switch (field) {
    case 'team1':
      // Retirer l'ancien assignment
      localTeamJobs1.value.forEach((jobIds, teamId) => {
        const index = jobIds.indexOf(jobId);
        if (index > -1) {
          jobIds.splice(index, 1);
        }
      });
      // Ajouter le nouveau
      if (value) {
        const teamObj = teams.find(t => t.name === value);
        if (teamObj) {
          const curr = localTeamJobs1.value.get(teamObj.id) || [];
          localTeamJobs1.value.set(teamObj.id, [...curr, jobId]);
        }
      }
      break;
    case 'team2':
      // Retirer l'ancien assignment
      localTeamJobs2.value.forEach((jobIds, teamId) => {
        const index = jobIds.indexOf(jobId);
        if (index > -1) {
          jobIds.splice(index, 1);
        }
      });
      // Ajouter le nouveau
      if (value) {
        const teamObj = teams.find(t => t.name === value);
        if (teamObj) {
          const curr = localTeamJobs2.value.get(teamObj.id) || [];
          localTeamJobs2.value.set(teamObj.id, [...curr, jobId]);
        }
      }
      break;
    case 'date1':
      localDates1.value[jobId] = value;
      break;
    case 'date2':
      localDates2.value[jobId] = value;
      break;
    case 'resources':
      localResources.value[jobId] = Array.isArray(value) ? value : value.split(',').map((r: string) => r.trim());
      break;
  }
}

// Options pour les sélecteurs
const teamOptions = teams.map(team => ({ label: team.name, value: team.name }));

const resourceOptions = [
  { label: 'Scanner Zebra MC9300', value: 'Scanner Zebra MC9300' },
  { label: 'Terminal Honeywell CT60', value: 'Terminal Honeywell CT60' },
  { label: 'Imprimante Mobile Zebra ZQ630', value: 'Imprimante Mobile Zebra ZQ630' },
  { label: 'Tablette Samsung Galaxy Tab A8', value: 'Tablette Samsung Galaxy Tab A8' },
  { label: 'Pistolet de Comptage Datalogic', value: 'Pistolet de Comptage Datalogic' }
];

// données finales
const rows = computed(() =>
  jobs.map(job => {
    const id = job.id;
    // équipe & date 1
    let team1 = '';
    localTeamJobs1.value.forEach((list, tId) => {
      if (list.includes(id)) team1 = teams.find(t=>t.id===tId)!.name;
    });
    const date1 = localDates1.value[id] || '';
    // équipe & date 2
    let team2 = '';
    localTeamJobs2.value.forEach((list, tId) => {
      if (list.includes(id)) team2 = teams.find(t=>t.id===tId)!.name;
    });
    const date2 = localDates2.value[id] || '';
    // ressources
    const ress = localResources.value[id] || [];
    const status = localJobStatuses.value[id] || 'planifier';
    
    return {
      id,
      job: `Job ${id}`,
      locations: job.locations,
      team1,
      date1,
      team2,
      date2,
      resourcesList: ress,
      resources: ress.join(', '),
      nbResources: ress.length,
      status
    };
  })
);

export function useAffecter() {
  return {
    rows,
    affecterAuPremierComptage,
    affecterAuDeuxiemeComptage,
    affecterRessources,
    validerJobs,
    transfererJobs,
    updateJobField,
    teamOptions,
    resourceOptions,
    localValidatedJobs,
    initializeJobStatuses
  };
}