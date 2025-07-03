import type { Team, Job, AffectationData, AffectationOptions, ResourceOption } from '@/interfaces/affectation';

// Données mock - en production, cela viendrait d'une API
const mockTeams: Team[] = [
  { id: '1', name: 'Équipe A', session: '1' },
  { id: '2', name: 'Équipe B', session: '1' },
  { id: '3', name: 'Équipe C', session: '1' },
  { id: '4', name: 'Équipe D', session: '2' },
  { id: '5', name: 'Équipe E', session: '2' }
];

const mockJobs: Job[] = [
  { id: '1', locations: ['Emplacement A1', 'Emplacement A2'] },
  { id: '2', locations: ['Emplacement B1'] },
  { id: '3', locations: ['Emplacement C1', 'Emplacement C2', 'Emplacement C3'] },
  { id: '4', locations: ['Emplacement D1', 'Emplacement D2'] },
  { id: '5', locations: ['Emplacement E1'] }
];

const mockResourceOptions: ResourceOption[] = [
  { label: 'Scanner Zebra MC9300', value: 'Scanner Zebra MC9300' },
  { label: 'Terminal Honeywell CT60', value: 'Terminal Honeywell CT60' },
  { label: 'Imprimante Mobile Zebra ZQ630', value: 'Imprimante Mobile Zebra ZQ630' },
  { label: 'Tablette Samsung Galaxy Tab A8', value: 'Tablette Samsung Galaxy Tab A8' },
  { label: 'Pistolet de Comptage Datalogic', value: 'Pistolet de Comptage Datalogic' },
  { label: 'RFID Reader Impinj R700', value: 'RFID Reader Impinj R700' },
  { label: 'Casque Audio Bluetooth', value: 'Casque Audio Bluetooth' },
  { label: 'Étiqueteuse Brother P-touch', value: 'Étiqueteuse Brother P-touch' }
];

export class AffectationService {
  private data: AffectationData;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): AffectationData {
    // En production, charger depuis localStorage ou API
    return {
      teams: mockTeams,
      jobs: mockJobs,
      teamJobs1: new Map(),
      teamJobs2: new Map(),
      dates1: {},
      dates2: {},
      resources: {},
      validatedJobs: new Set(),
      jobStatuses: {}
    };
  }

  // Getters pour les données
  getTeams(): Team[] {
    return this.data.teams;
  }

  getJobs(): Job[] {
    return this.data.jobs;
  }

  getTeamOptions() {
    return this.data.teams.map(team => ({ label: team.name, value: team.name }));
  }

  getResourceOptions(): ResourceOption[] {
    return mockResourceOptions;
  }

  // Gestion des statuts
  initializeJobStatuses(inventoryStatus: string) {
    const defaultStatus: 'planifier' | 'affecter' = inventoryStatus === 'En réalisation' ? 'affecter' : 'planifier';
    
    this.data.jobs.forEach(job => {
      if (!this.data.jobStatuses[job.id]) {
        this.data.jobStatuses[job.id] = defaultStatus;
      }
    });
  }

  // Affectation équipes premier comptage
  async affectTeamToPremierComptage(teamName: string, jobIds: string[], date: string): Promise<void> {
    const team = this.data.teams.find(t => t.name === teamName);
    if (!team) {
      throw new Error('Équipe introuvable');
    }

    // Retirer les jobs de leur ancienne affectation
    jobIds.forEach(jobId => {
      this.removeJobFromTeam1(jobId);
    });

    // Ajouter à la nouvelle équipe
    const currentJobs = this.data.teamJobs1.get(team.id) || [];
    this.data.teamJobs1.set(team.id, [...currentJobs, ...jobIds]);

    // Mettre à jour les dates et statuts
    jobIds.forEach(id => {
      this.data.dates1[id] = date;
      this.data.jobStatuses[id] = 'affecter';
    });
  }

  // Affectation équipes deuxième comptage
  async affectTeamToDeuxiemeComptage(teamName: string, jobIds: string[], date: string): Promise<void> {
    const team = this.data.teams.find(t => t.name === teamName);
    if (!team) {
      throw new Error('Équipe introuvable');
    }

    // Retirer les jobs de leur ancienne affectation
    jobIds.forEach(jobId => {
      this.removeJobFromTeam2(jobId);
    });

    // Ajouter à la nouvelle équipe
    const currentJobs = this.data.teamJobs2.get(team.id) || [];
    this.data.teamJobs2.set(team.id, [...currentJobs, ...jobIds]);

    // Mettre à jour les dates et statuts
    jobIds.forEach(id => {
      this.data.dates2[id] = date;
      this.data.jobStatuses[id] = 'affecter';
    });
  }

  // Affectation ressources
  async affectResources(jobIds: string[], resources: string[]): Promise<void> {
    jobIds.forEach(id => {
      this.data.resources[id] = resources;
      if (this.data.jobStatuses[id] === 'planifier') {
        this.data.jobStatuses[id] = 'affecter';
      }
    });
  }

  // Validation jobs
  validateJobs(jobIds: string[]): void {
    jobIds.forEach(id => {
      this.data.validatedJobs.add(id);
      this.data.jobStatuses[id] = 'valider';
    });
  }

  // Transfert jobs
  async transferJobs(jobIds: string[], options: AffectationOptions): Promise<void> {
    if (!options.premierComptage && !options.deuxiemeComptage) {
      throw new Error('Vous devez sélectionner au moins un type de comptage à transférer.');
    }

    jobIds.forEach(id => {
      this.data.jobStatuses[id] = 'transfere';
    });
  }

  // Mise à jour d'un champ de job
  updateJobField(jobId: string, field: string, value: any): void {
    switch (field) {
      case 'team1':
        this.updateTeam1Assignment(jobId, value);
        break;
      case 'team2':
        this.updateTeam2Assignment(jobId, value);
        break;
      case 'date1':
        this.data.dates1[jobId] = value || '';
        break;
      case 'date2':
        this.data.dates2[jobId] = value || '';
        break;
      case 'resources':
        // Si c'est un string, le traiter comme une seule ressource
        if (typeof value === 'string') {
          this.data.resources[jobId] = value ? [value] : [];
        } else if (Array.isArray(value)) {
          this.data.resources[jobId] = value;
        } else {
          this.data.resources[jobId] = [];
        }
        break;
      case 'resourcesList':
        // Pour la mise à jour directe de la liste de ressources
        this.data.resources[jobId] = Array.isArray(value) ? value : [];
        break;
    }
  }

  private updateTeam1Assignment(jobId: string, teamName: string): void {
    // Retirer de l'ancienne affectation
    this.removeJobFromTeam1(jobId);

    // Ajouter à la nouvelle équipe si fournie
    if (teamName) {
      const team = this.data.teams.find(t => t.name === teamName);
      if (team) {
        const currentJobs = this.data.teamJobs1.get(team.id) || [];
        if (!currentJobs.includes(jobId)) {
          this.data.teamJobs1.set(team.id, [...currentJobs, jobId]);
        }
      }
    }
  }

  private updateTeam2Assignment(jobId: string, teamName: string): void {
    // Retirer de l'ancienne affectation
    this.removeJobFromTeam2(jobId);

    // Ajouter à la nouvelle équipe si fournie
    if (teamName) {
      const team = this.data.teams.find(t => t.name === teamName);
      if (team) {
        const currentJobs = this.data.teamJobs2.get(team.id) || [];
        if (!currentJobs.includes(jobId)) {
          this.data.teamJobs2.set(team.id, [...currentJobs, jobId]);
        }
      }
    }
  }

  private removeJobFromTeam1(jobId: string): void {
    this.data.teamJobs1.forEach((jobIds, teamId) => {
      const index = jobIds.indexOf(jobId);
      if (index > -1) {
        jobIds.splice(index, 1);
        if (jobIds.length === 0) {
          this.data.teamJobs1.delete(teamId);
        }
      }
    });
  }

  private removeJobFromTeam2(jobId: string): void {
    this.data.teamJobs2.forEach((jobIds, teamId) => {
      const index = jobIds.indexOf(jobId);
      if (index > -1) {
        jobIds.splice(index, 1);
        if (jobIds.length === 0) {
          this.data.teamJobs2.delete(teamId);
        }
      }
    });
  }

  // Obtenir l'équipe assignée pour un job
  getAssignedTeam1(jobId: string): string {
    for (const [teamId, jobIds] of this.data.teamJobs1.entries()) {
      if (jobIds.includes(jobId)) {
        const team = this.data.teams.find(t => t.id === teamId);
        return team?.name || '';
      }
    }
    return '';
  }

  getAssignedTeam2(jobId: string): string {
    for (const [teamId, jobIds] of this.data.teamJobs2.entries()) {
      if (jobIds.includes(jobId)) {
        const team = this.data.teams.find(t => t.id === teamId);
        return team?.name || '';
      }
    }
    return '';
  }

  // Obtenir les données pour l'affichage
  getJobDisplayData() {
    return this.data.jobs.map(job => {
      const id = job.id;
      const team1 = this.getAssignedTeam1(id);
      const date1 = this.data.dates1[id] || '';
      const team2 = this.getAssignedTeam2(id);
      const date2 = this.data.dates2[id] || '';
      const resourcesList = this.data.resources[id] || [];
      const status = this.data.jobStatuses[id] || 'planifier';

      return {
        id,
        job: `Job ${id}`,
        locations: job.locations,
        team1,
        date1,
        team2,
        date2,
        resourcesList,
        resources: resourcesList.join(', '),
        nbResources: resourcesList.length,
        status
      };
    });
  }

  // Sauvegarder les données (pour persistance)
  saveData(): void {
    // En production, sauvegarder vers API ou localStorage
    const dataToSave = {
      teamJobs1: Array.from(this.data.teamJobs1.entries()),
      teamJobs2: Array.from(this.data.teamJobs2.entries()),
      dates1: this.data.dates1,
      dates2: this.data.dates2,
      resources: this.data.resources,
      validatedJobs: Array.from(this.data.validatedJobs),
      jobStatuses: this.data.jobStatuses
    };
    
    localStorage.setItem('affectation_data', JSON.stringify(dataToSave));
  }

  // Charger les données sauvegardées
  loadData(): void {
    try {
      const saved = localStorage.getItem('affectation_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data.teamJobs1 = new Map(parsed.teamJobs1 || []);
        this.data.teamJobs2 = new Map(parsed.teamJobs2 || []);
        this.data.dates1 = parsed.dates1 || {};
        this.data.dates2 = parsed.dates2 || {};
        this.data.resources = parsed.resources || {};
        this.data.validatedJobs = new Set(parsed.validatedJobs || []);
        this.data.jobStatuses = parsed.jobStatuses || {};
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des données:', error);
    }
  }
}

// Instance singleton du service
export const affectationService = new AffectationService();