import { ref, computed, watch, onMounted, nextTick } from 'vue';
import type { Job } from '@/interfaces/planning';
import { planningService } from '@/services/planningService';
import { alertService } from '@/services/alertService';
import { indexedDBService } from '@/services/indexedDBService';

const JOBS_KEY = 'planningJobs';

export function usePlanning() {
  const jobs = ref<Job[]>([]);
  const locationSearchQuery = ref('');
  const isSubmitting = ref(false);
  const selectedAvailable = ref<string[]>([]);
  const selectedJobs = ref<string[]>([]);
  const selectedJobToAddLocation = ref<string>('');
  const showJobDropdown = ref(false);
  
  const allLocations = planningService.getLocations();

  const availableLocations = computed(() => {
    let filtered = allLocations;
    const query = locationSearchQuery.value.toLowerCase().trim();

    if (query) {
      filtered = filtered.filter(loc => loc.toLowerCase().includes(query));
    }

    const currentJobs = Array.isArray(jobs.value) ? jobs.value : [];
    const usedLocations = new Set(currentJobs.flatMap(job => job.locations || []));
    return filtered.filter(loc => !usedLocations.has(loc));
  });

  // Computed pour les jobs non validés disponibles pour ajouter des emplacements
  const availableJobsForLocation = computed(() => {
    return jobs.value.filter(job => !job.isValidated);
  });

  // Persist only base job data (without validation flags)
  async function saveJobs() {
    try {
      const jobsToSave = jobs.value.map(({ id, reference, locations, createdAt, isValidated, validatedAt }) => 
        ({ id, reference, locations, createdAt, isValidated, validatedAt }));
      await indexedDBService.saveState(JSON.parse(JSON.stringify(jobsToSave)), JOBS_KEY);
    } catch (error) {
      console.error('Error saving jobs:', error);
    }
  }

  async function loadJobs() {
    try {
      const saved = await indexedDBService.getState(JOBS_KEY);
      if (saved && Array.isArray(saved)) {
        jobs.value = (saved as Job[]).map(j => ({ 
          ...j, 
          isValidated: j.isValidated || false,
          validatedAt: j.validatedAt
        }));
        console.log('Jobs chargés depuis IndexedDB');
      } else {
        jobs.value = [];
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobs.value = [];
    }
  }

  onMounted(async () => {
    await indexedDBService.init();
    await loadJobs();
  });

  watch(() => jobs.value, saveJobs, { deep: true, immediate: false });

  function generateJobReference(): string {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const jobNumber = (jobs.value.length + 1).toString().padStart(3, '0');
    return `JOB-${year}${month}${day}-${jobNumber}`;
  }

  async function createJob(selectedLocations: string[]) {
    if (!selectedLocations.length) {
      await alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
      return false;
    }
    
    const newJob: Job = {
      id: crypto.randomUUID(),
      reference: generateJobReference(),
      locations: [...selectedLocations],
      isValidated: false,
      createdAt: new Date().toISOString()
    };

    jobs.value.push(newJob);
    await nextTick();
    selectedAvailable.value = [];

    await alertService.success({
      text: `Job ${newJob.reference} créé avec ${newJob.locations.length} emplacement(s)`
    });

    return true;
  }

  async function addLocationToJob(jobId: string, selectedLocations: string[]) {
    if (!selectedLocations.length) {
      await alertService.error({ text: 'Veuillez sélectionner au moins un emplacement.' });
      return false;
    }

    if (!jobId) {
      await alertService.error({ text: 'Veuillez sélectionner un job.' });
      return false;
    }

    const job = jobs.value.find(j => j.id === jobId);
    if (!job) {
      await alertService.error({ text: 'Job introuvable.' });
      return false;
    }

    if (job.isValidated) {
      await alertService.error({ 
        title: 'Job validé',
        text: 'Impossible d\'ajouter des emplacements à un job validé.' 
      });
      return false;
    }

    // Ajouter les nouveaux emplacements
    job.locations.push(...selectedLocations);
    
    await nextTick();
    selectedAvailable.value = [];
    selectedJobToAddLocation.value = '';
    showJobDropdown.value = false;

    await alertService.success({
      text: `${selectedLocations.length} emplacement(s) ajouté(s) au job ${job.reference}`
    });

    return true;
  }

  // Fonction améliorée pour supprimer un emplacement d'un job
  async function removeLocationFromJob(jobId: string, location: string) {
    console.log('removeLocationFromJob appelée avec:', { jobId, location });
    
    const job = jobs.value.find(j => j.id === jobId);
    if (!job) {
      console.error('Job introuvable:', jobId);
      await alertService.error({ text: 'Job introuvable.' });
      return false;
    }

    console.log('Job trouvé:', job);
    console.log('Job validé?', job.isValidated);

    if (job.isValidated) {
      await alertService.error({
        title: 'Permission requise',
        text: 'Tu as besoin de permission pour cette action dans l\'affectation.'
      });
      return false;
    }

    // Vérifier que l'emplacement existe dans le job
    const locationIndex = job.locations.findIndex(loc => loc === location);
    console.log('Index de l\'emplacement:', locationIndex);
    console.log('Emplacements du job:', job.locations);

    if (locationIndex === -1) {
      console.error('Emplacement non trouvé dans le job:', location);
      await alertService.error({ text: 'Emplacement non trouvé dans ce job.' });
      return false;
    }

    // Confirmation avant suppression
    const result = await alertService.confirm({
      text: `Êtes-vous sûr de vouloir supprimer cet emplacement du job ${job.reference} ?`
    });

    if (!result.isConfirmed) {
      await alertService.info({ text: 'Suppression annulée.' });
      return false;
    }

    try {
      // Supprimer l'emplacement
      job.locations.splice(locationIndex, 1);
      console.log('Emplacement supprimé. Emplacements restants:', job.locations.length);
      
      // Si le job n'a plus d'emplacements, le supprimer complètement
      if (job.locations.length === 0) {
        const jobIndex = jobs.value.findIndex(j => j.id === jobId);
        if (jobIndex > -1) {
          jobs.value.splice(jobIndex, 1);
          console.log('Job supprimé car plus d\'emplacements');
          await alertService.success({
            text: `Emplacement supprimé. Le job ${job.reference} a été supprimé car il n'avait plus d'emplacements.`
          });
        }
      } else {
        await alertService.success({
          text: `Emplacement supprimé du job ${job.reference}.`
        });
      }
      
      await nextTick();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      await alertService.error({ text: 'Erreur lors de la suppression de l\'emplacement.' });
      return false;
    }
  }

  // Fonction pour retourner les jobs sélectionnés
  async function returnSelectedJobs() {
    if (!selectedJobs.value.length) {
      await alertService.error({ text: 'Veuillez sélectionner au moins un job.' });
      return;
    }

    const selectedJobIds = new Set(selectedJobs.value);
    const hasValidated = jobs.value.some(job => selectedJobIds.has(job.id) && job.isValidated);
    
    if (hasValidated) {
      await alertService.error({
        title: 'Jobs validés',
        text: 'Impossible de retourner un job validé. Vous avez besoin de permission pour cette action dans l\'affectation.'
      });
      return;
    }

    const locationsToRestore: string[] = [];
    jobs.value.forEach(job => {
      if (selectedJobIds.has(job.id)) {
        locationsToRestore.push(...job.locations);
      }
    });

    jobs.value = jobs.value.filter(job => !selectedJobIds.has(job.id));
    selectedJobs.value = [];

    await nextTick();

    await alertService.success({
      text: `${selectedJobIds.size} job(s) retourné(s). ${locationsToRestore.length} emplacement(s) remis en disponible.`
    });
  }

  async function validateJob(jobId: string) {
    const job = jobs.value.find(j => j.id === jobId);
    if (!job) {
      await alertService.error({ text: 'Job introuvable.' });
      return;
    }

    if (job.isValidated) {
      await alertService.info({ text: 'Ce job est déjà validé.' });
      return;
    }

    const result = await alertService.confirm({ 
      text: `Voulez-vous vraiment valider le job ${job.reference} ?` 
    });
    
    if (!result.isConfirmed) {
      await alertService.info({ text: 'Validation annulée.' });
      return;
    }

    isSubmitting.value = true;
    try {
      job.isValidated = true;
      job.validatedAt = new Date().toISOString();
      
      await alertService.success({ 
        title: 'Succès', 
        text: `Job ${job.reference} validé avec succès.` 
      });
    } catch (error) {
      job.isValidated = false;
      delete job.validatedAt;
      await alertService.error({ text: 'Erreur lors de la validation du job' });
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    jobs,
    availableLocations,
    availableJobsForLocation,
    locationSearchQuery,
    selectedAvailable,
    selectedJobs,
    selectedJobToAddLocation,
    showJobDropdown,
    isSubmitting,
    createJob,
    addLocationToJob,
    removeLocationFromJob,
    returnSelectedJobs,
    validateJob
  };
}
