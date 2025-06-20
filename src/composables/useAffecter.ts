import { ref, computed } from 'vue';
import type { Team, Job } from '@/interfaces/planning';
import { alertService } from '@/services/alertService';

const PLANNING_DATE = '2025-06-04';

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

// validation de date
function validateDate(date:string):boolean {
  if (new Date(date) < new Date(PLANNING_DATE)) {
    alertService.error({ title:'Date invalide', text:`Date ≥ ${PLANNING_DATE}` });
    return false;
  }
  return true;
}

// fonctions d’affectation
async function affecterAuPremierComptage(team:string, jobIds:string[], date:string) {
  if (!validateDate(date)) return;
  const teamObj = teams.find(t=>t.name===team);
  if (!teamObj) {
    alertService.error({ title:'Erreur', text:'Équipe introuvable.' });
    return;
  }
  const already = jobIds.filter(id =>
    Array.from(localTeamJobs1.value.values()).some(list=>list.includes(id))
  );
  if (already.length) {
    alertService.error({ title:'Déjà affecté', text:`Jobs ${already.join(', ')} déjà.` });
    return;
  }
  const curr = localTeamJobs1.value.get(teamObj.id) || [];
  localTeamJobs1.value.set(teamObj.id, [...curr, ...jobIds]);
  jobIds.forEach(id=>localDates1.value[id]=date);
  alertService.success({ text:'Premier comptage OK.' });
}

async function affecterAuDeuxiemeComptage(team:string, jobIds:string[], date:string) {
  if (!validateDate(date)) return;
  const teamObj = teams.find(t=>t.name===team);
  if (!teamObj) {
    alertService.error({ title:'Erreur', text:'Équipe introuvable.' });
    return;
  }
  const notFirst = jobIds.filter(id =>
    !Array.from(localTeamJobs1.value.values()).some(list=>list.includes(id))
  );
  if (notFirst.length) {
    alertService.error({ title:'Préalable', text:`Jobs ${notFirst.join(', ')} pas en 1er.` });
    return;
  }
  const already = jobIds.filter(id =>
    Array.from(localTeamJobs2.value.values()).some(list=>list.includes(id))
  );
  if (already.length) {
    alertService.error({ title:'Déjà affecté 2ème', text:`Jobs ${already.join(', ')} déjà.` });
    return;
  }
  const curr = localTeamJobs2.value.get(teamObj.id) || [];
  localTeamJobs2.value.set(teamObj.id, [...curr, ...jobIds]);
  jobIds.forEach(id=>localDates2.value[id]=date);
  alertService.success({ text:'Deuxième comptage OK.' });
}

async function affecterRessources(jobIds:string[], ressources:string[]) {
  jobIds.forEach(id => {
    localResources.value[id] = ressources;
  });
  alertService.success({ text:'Ressources OK.' });
}

function validerJobs(jobIds:string[]) {
  jobIds.forEach(id => localValidatedJobs.value.add(id));
  alertService.success({ text:'Jobs validés.' });
}

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
      nbResources: ress.length
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
    localValidatedJobs,
    PLANNING_DATE
  };
}
