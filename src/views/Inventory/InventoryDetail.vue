<template>
    <div class="p-6 space-y-10">
      <!-- En-tête -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Détail de l'inventaire</h1>
        <div class="flex gap-2">
          <button @click="launchInventory" class="btn-green">Lancer</button>
          <button @click="editInventory" class="btn-yellow">Modifier</button>
          <button @click="goBack" class="btn-gray">Retour</button>
        </div>
      </div>
  
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
  
      <!-- Contenu -->
      <div v-else class="bg-white rounded-xl shadow-md p-6 space-y-10">
        <!-- Section : Informations générales -->
        <section>
          <h2 class="section-title">Informations générales</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Type" :value="inventory.type || 'Inventaire Général'" />
            <InfoItem label="Libellé" :value="inventory.label" />
            <InfoItem label="Date d'inventaire" :value="formatDate(inventory.inventory_date)" />
            <div>
              <h3 class="info-label">Statut</h3>
              <span class="px-3 py-1 rounded-full text-sm font-semibold" :class="getStatusClass(inventory.statut)">
                {{ inventory.statut }}
              </span>
            </div>
          </div>
        </section>
        
  
        <!-- Section : Paramètres de comptage -->
        <section>
          <h2 class="section-title">Paramètres de comptage</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div
              v-for="(contage, index) in inventory.contages"
              :key="index"
              class="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm"
            >
              <p class="font-semibold mb-2 text-gray-700">Comptage {{ index + 1 }}</p>
              <ul class="text-sm text-gray-600 space-y-1">
                <li><strong>Mode :</strong> {{ contage.mode || 'Non défini' }}</li>
                <li v-if="contage.isVariant">✅ Variantes activées</li>
                <li v-if="contage.useScanner">📱 Scanner activé</li>
                <li v-if="contage.useSaisie">⌨️ Saisie activée</li>
              </ul>
            </div>
          </div>
        </section>
  
        <!-- Section : Équipe -->
        <section>
          <h2 class="section-title">Équipe</h2>
          <ul class="list-disc pl-6 text-gray-700 space-y-1">
            <li>Chef d'inventaire : Samira T.</li>
            <li>Opérateur 1 : Youssef M.</li>
            <li>Opérateur 2 : Lina B.</li>
          </ul>
        </section>
  
        <!-- Section : Jobs -->
        <section>
          <h2 class="section-title">Jobs liés</h2>
          <ul class="list-disc pl-6 text-gray-700 space-y-1">
            <li>Job 1 : Préparation des emplacements</li>
            <li>Job 2 : Lancement du comptage avec scanner</li>
            <li>Job 3 : Vérification finale</li>
          </ul>
        </section>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, defineComponent } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { inventoryManagementService } from '@/services/inventoryManagementService';
  import { alertService } from '@/services/alertService';
  import type { InventoryManagement } from '@/interfaces/inventoryManagement';
  import type { ContageConfig } from '@/interfaces/inventoryCreation';
  
  const route = useRoute();
  const router = useRouter();
  const inventoryId = Number(route.params.id);
  const loading = ref(true);
  
  const inventory = ref<InventoryManagement & { contages?: ContageConfig[] }>({
    id: 0,
    reference: '',
    inventory_date: '',
    statut: '',
    pending_status_date: '',
    current_status_date: '',
    date_status_launch: '',
    date_status_end: '',
    label: '',
    type: 'Inventaire Général',
    contages: []
  });
  
  const fetchInventoryDetails = async () => {
    try {
      loading.value = true;
      const data = await inventoryManagementService.getInventoryById(inventoryId);
      if (data) {
        inventory.value = {
          ...data,
          contages: data.contages || Array(3).fill({
            mode: '',
            isVariant: false,
            useScanner: false,
            useSaisie: false
          })
        };
      } else {
        throw new Error('Inventory not found');
      }
    } catch (error) {
      await alertService.error({ text: "Erreur lors du chargement de l'inventaire" });
      router.push({ name: 'inventory-list' });
    } finally {
      loading.value = false;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en cours':
        return 'bg-blue-100 text-blue-800';
      case 'terminé':
        return 'bg-green-100 text-green-800';
      case 'planifié':
        return 'bg-purple-100 text-purple-800';
      case 'en préparation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const launchInventory = async () => {
    try {
      await inventoryManagementService.updateInventory(inventoryId, {
        ...inventory.value,
        statut: 'En cours'
      });
      await alertService.success({ text: "Inventaire lancé avec succès" });
      await fetchInventoryDetails();
    } catch {
      await alertService.error({ text: "Erreur lors du lancement" });
    }
  };
  
  const editInventory = () => {
    router.push({ name: 'inventory-edit', params: { id: inventoryId } });
  };
  
  const goBack = () => {
    router.push({ name: 'inventory-list' });
  };
  
  const InfoItem = defineComponent({
    props: {
      label: String,
      value: String
    },
    template: `
      <div>
        <h3 class="text-sm font-medium text-gray-500">{{ label }}</h3>
        <p class="text-lg font-medium text-gray-800">{{ value }}</p>
      </div>
    `
  });
  
  onMounted(fetchInventoryDetails);
  </script>
  
  <style scoped>
  .section-title {
    @apply text-lg font-semibold text-gray-800 border-b pb-1 mb-4;
  }
  .btn-green {
    @apply px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors;
  }
  .btn-yellow {
    @apply px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors;
  }
  .btn-gray {
    @apply px-4 py-2 text-gray-600 hover:text-gray-700 font-medium;
  }
  </style>
  