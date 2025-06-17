import { ref, computed, watch, onMounted } from 'vue';
import type { Job } from '@/interfaces/planning';
import { planningService } from '@/services/planningService';
import { alertService } from '@/services/alertService';
import { indexedDBService } from '@/services/indexedDBService';

const STORAGE_KEY = 'planningJobs';
const SELECTIONS_KEY = 'planningSelections';
const STATE_KEY = 'planningState';

export function usePlanning() {
  const jobs = ref<Job[]>([]);
  const locationSearchQuery = ref('');
  const isSubmitting = ref(false);
  const selectedAvailable = ref<string[]>([]);
  const selectedJobs = ref<string[]>([]);
  const isValidated = ref(false);
  
  const allLocations = planningService.getLocations();

  // Available locations (excluding already selected ones)
  const availableLocations = computed(() => {
    let filtered = allLocations;
    const query = locationSearchQuery.value.toLowerCase().trim();

    if (query) {
      filtered = filtered.filter(loc => loc.toLowerCase().includes(query));
    }

    // Exclude locations that are already in jobs
    const usedLocations = new Set(jobs.value.flatMap(job => job.locations));
    return filtered.filter(loc => !usedLocations.has(loc));
  });

  // Save complete state to IndexedDB (jobs + validatedState)
  async function saveState() {
    const state = { 
      jobs: jobs.value, 
      isValidated: isValidated.value 
    };
    try {
      await indexedDBService.saveState(JSON.parse(JSON.stringify(state)), STATE_KEY);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  // Save selections to IndexedDB
  async function saveSelections() {
    const selections = {
      selectedAvailable: selectedAvailable.value,
      selectedJobs: selectedJobs.value
    };
    try {
      await indexedDBService.saveState(JSON.parse(JSON.stringify(selections)), SELECTIONS_KEY);
    } catch (error) {
      console.error('Error saving selections:', error);
    }
  }

  // Load selections from IndexedDB
  async function loadSelections() {
    try {
      const saved = await indexedDBService.getState(SELECTIONS_KEY);
      if (saved) {
        const selections: any = saved;
        selectedAvailable.value = selections.selectedAvailable || [];
        selectedJobs.value = selections.selectedJobs || [];
      }
    } catch (error) {
      console.error('Error loading selections:', error);
    }
  }

  // Clear selections from IndexedDB
  async function clearSelections() {
    try {
      await indexedDBService.clearState(SELECTIONS_KEY);
      selectedAvailable.value = [];
      selectedJobs.value = [];
    } catch (error) {
      console.error('Error clearing selections:', error);
    }
  }

  // Load state from IndexedDB
  async function loadState() {
    try {
      const saved = await indexedDBService.getState(STATE_KEY);
      if (saved) {
        const state: any = saved;
        jobs.value = state.jobs || [];
        isValidated.value = state.isValidated || false;
        
        if (isValidated.value && jobs.value.length > 0) {
          console.log('Jobs validés chargés depuis IndexedDB (en attente de l\'API backend)');
        }
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  // Initialize
  onMounted(async () => {
    await indexedDBService.init();
    await loadState();
    await loadSelections();
  });

  // Watch for changes and save
  watch(() => [jobs.value, isValidated.value], saveState, { deep: true });
  
  // Watch selections and save them
  watch(() => [selectedAvailable.value, selectedJobs.value], saveSelections, { deep: true });

  // Generate professional job reference
  function generateJobReference(): string {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const jobNumber = (jobs.value.length + 1).toString().padStart(3, '0');
    
    return `JOB-${year}${month}${day}-${jobNumber}`;
  }

  // Create a single job with all selected locations
  async function createJob(selectedLocations: string[]) {
    if (selectedLocations.length === 0) {
      return false;
    }

    // Create ONE job with ALL selected locations
    const newJob: Job = {
      id: crypto.randomUUID(),
      reference: generateJobReference(),
      locations: [...selectedLocations],
      isValidated: false,
      createdAt: new Date().toISOString()
    };

    jobs.value.push(newJob);

    // Clear the selection after creating the job
    selectedAvailable.value = [];
    await saveSelections();

    await alertService.success({
      text: `Job ${newJob.reference} créé avec ${newJob.locations.length} emplacement(s)`
    });

    return true;
  }

  // Delete selected jobs with validation check and return locations to available
  async function deleteSelectedJobs() {
    if (selectedJobs.value.length === 0) {
      await alertService.error({
        text: 'Attention ! Vous n\'avez rien sélectionné.'
      });
      return;
    }

    // Check if ANY of the selected jobs are validated
    const selectedJobIds = new Set<string>();
    selectedJobs.value.forEach(selectedId => {
      const jobId = selectedId.includes('-') ? selectedId.split('-')[0] : selectedId;
      selectedJobIds.add(jobId);
    });

    const hasValidatedJobs = jobs.value.some(job => 
      selectedJobIds.has(job.id) && (job.isValidated || isValidated.value)
    );

    if (hasValidatedJobs) {
      await alertService.error({
        title: 'Jobs validés',
        text: 'Attention ! Ces jobs sont validés. Vous devez d\'abord les effacer dans la table d\'affectation pour permettre l\'annulation.'
      });
      return;
    }

    // Collect locations from jobs that will be deleted
    const locationsToRestore: string[] = [];
    const jobReferencesToDelete: string[] = [];

    jobs.value.forEach(job => {
      if (selectedJobIds.has(job.id)) {
        locationsToRestore.push(...job.locations);
        jobReferencesToDelete.push(job.reference || job.id);
      }
    });

    // Remove jobs
    const jobsCountBefore = jobs.value.length;
    jobs.value = jobs.value.filter(job => !selectedJobIds.has(job.id));
    
    // Clear job selections
    selectedJobs.value = [];
    await saveSelections();
    
    const deletedCount = jobsCountBefore - jobs.value.length;
    await alertService.success({
      text: `${deletedCount} job(s) annulé(s) (${jobReferencesToDelete.join(', ')}). ${locationsToRestore.length} emplacement(s) remis en disponible.`
    });
  }

  // Validate jobs with confirmation
  async function validateJobs() {
    if (jobs.value.length === 0) {
      await alertService.error({
        text: 'Aucun job à valider. Créez d\'abord des jobs.'
      });
      return;
    }

    const result = await alertService.confirm({
      text: `Voulez-vous vraiment valider ${jobs.value.length} job(s) ?`
    });
    
    if (!result.isConfirmed) {
      await alertService.info({
        text: 'Validation annulée.'
      });
      return;
    }
    
    isSubmitting.value = true;
    try {
      // Mark individual jobs as validated
      jobs.value.forEach(job => {
        job.isValidated = true;
        job.validatedAt = new Date().toISOString();
      });

      await planningService.saveJobs(jobs.value);
      isValidated.value = true;
      
      // Clear selections after validation
      await clearSelections();
      
      await alertService.success({
        title: 'Succès',
        text: `${jobs.value.length} job(s) validé(s) avec succès.`
      });
      
    } catch (error) {
      // Revert validation status on error
      jobs.value.forEach(job => {
        job.isValidated = false;
        delete job.validatedAt;
      });
      
      await alertService.error({ 
        text: 'Erreur lors de la validation des jobs' 
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  // Cancel all planning
  async function cancelPlanning() {
    if (jobs.value.length === 0) {
      await alertService.error({
        title: 'Aucun job à annuler',
        text: 'Il n\'y a aucun job créé à annuler.'
      });
      return;
    }
    
    // Check if jobs are validated
    if (isValidated.value || jobs.value.some(job => job.isValidated)) {
      await alertService.error({
        title: 'Jobs validés',
        text: 'Attention ! Ces jobs sont validés. Vous devez d\'abord les effacer dans la table d\'affectation pour permettre l\'annulation.'
      });
      return;
    }
    
    const result = await alertService.confirm({
      text: 'Voulez-vous vraiment annuler tous les jobs non validés ?'
    });
    
    if (!result.isConfirmed) {
      return;
    }
    
    try {
      await indexedDBService.clearState(STATE_KEY);
      await clearSelections();
    } catch (error) {
      console.error('Error clearing state:', error);
    }
    
    const jobCount = jobs.value.length;
    jobs.value = [];
    isValidated.value = false;
    
    await alertService.success({
      text: `${jobCount} job(s) annulé(s) avec succès`
    });
  }

  // Load validated jobs from API
  async function loadValidatedJobsFromAPI() {
    if (!isValidated.value) return;
    
    try {
      console.log('Chargement des jobs validés depuis l\'API (à implémenter)');
    } catch (error) {
      console.error('Error loading validated jobs from API:', error);
    }
  }

  return {
    jobs,
    availableLocations,
    locationSearchQuery,
    selectedAvailable,
    selectedJobs,
    isSubmitting,
    isValidated,
    createJob,
    deleteSelectedJobs,
    validateJobs,
    cancelPlanning,
    loadValidatedJobsFromAPI,
    clearSelections
  };
}