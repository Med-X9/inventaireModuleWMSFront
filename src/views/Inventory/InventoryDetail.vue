<template>
    <div class="space-y-10">
      <!-- En-tête -->
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-800">Détail de l'inventaire</h1>
        <div class="flex gap-2">
          <button class="btn-green" @click="launchInventory">Lancer</button>
          <button class="btn-yellow" @click="editInventory">Modifier</button>
          <button class="btn-gray" @click="goBack">Retour</button>
        </div>
      </div>
  
      <!-- Contenu -->
      <div class="bg-white rounded-xl shadow-md p-6 space-y-10">
        <!-- Section : Informations générales -->
        <section>
          <h2 class="section-title">Informations générales</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Référence" :value="inventory.reference" />
            <InfoItem label="Type" :value="inventory.type" />
            <InfoItem label="Libellé" :value="inventory.label" />
            <InfoItem label="Date d'inventaire" :value="formatDate(inventory.inventory_date)" />
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-1">Statut</h3>
              <span class="px-4 py-1 rounded-full text-sm font-semibold" :class="getStatusClass(inventory.statut)">
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
  import { ref, defineComponent } from 'vue';
  import { useRouter } from 'vue-router';
  
  interface ContageConfig {
    mode: string;
    isVariant?: boolean;
    useScanner?: boolean;
    useSaisie?: boolean;
  }
  
  interface InventoryManagement {
    id: number;
    reference: string;
    inventory_date: string;
    statut: string;
    label: string;
    type: string;
    contages: ContageConfig[];
  }
  
  const router = useRouter();
  
  // données statiques déjà créées
  const inventory = ref<InventoryManagement>({
    id: 1,
    reference: 'INV-001',
    inventory_date: '2025-04-30',
    statut: 'En cours',
    label: 'Inventaire de printemps',
    type: 'Inventaire Général',
    contages: [
      { mode: 'liste emplacement', useScanner: true },
      { mode: 'article + emplacement', isVariant: true },
      { mode: 'liste emplacement', useSaisie: true },
    ],
  });
  
  // Récupérer l'id pour la navigation
  const inventoryId = inventory.value.id;
  
  const launchInventory = () => {
    // logique de lancement
    console.log('Lancement inventaire', inventoryId);
  };
  
  const editInventory = () => {
    router.push({ name: 'inventory-edit', params: { id: inventoryId } });
  };
  
  const goBack = () => {
    router.push({ name: 'inventory-list' });
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };
  
  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'en attente': return 'bg-yellow-100 text-yellow-800';
      case 'en cours':    return 'bg-blue-100 text-blue-800';
      case 'terminé':     return 'bg-green-100 text-green-800';
      case 'planifié':    return 'bg-purple-100 text-purple-800';
      case 'en préparation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Composant InfoItem générique
  const InfoItem = defineComponent({
    props: {
      label: { type: String, required: true },
      value: { type: [String, Number], required: true }
    },
    template: `
      <div>
        <h3 class="text-sm font-medium text-gray-500">{{ label }}</h3>
        <p class="text-lg font-medium text-gray-800">{{ value }}</p>
      </div>
    `,
  });
  </script>
  
  <style scoped>
  .section-title { @apply text-lg font-semibold text-gray-800 border-b pb-1 mb-4; }
  .btn-green { @apply px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600; }
  .btn-yellow{ @apply px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600; }
  .btn-gray { @apply px-4 py-2 text-gray-600 hover:text-gray-700; }
  </style>
  