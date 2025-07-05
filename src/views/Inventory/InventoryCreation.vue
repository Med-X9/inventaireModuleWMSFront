<template>
    <div>
        <!-- Récapitulatif - Version améliorée et compacte -->
        <div class="w-full mb-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <!-- En-tête avec icône -->
            <div class="flex items-center gap-2  mb-2.5">
                <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                    </path>
                </svg>
                <span class="font-semibold text-xs text-primary">Récapitulatif</span>
            </div>

            <!-- Informations principales en grille responsive -->
            <div
                class="grid grid-cols-1 gap-3 w-full p-2 mb-1.5 text-md border border-gray-200 dark:border-gray-600 rounded-md dark:bg-gray-700">
                <!-- Première ligne : Libellé, Date, Type, Compte -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <!-- Libellé -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Libellé:</span>
                        <span class="text-gray-900 dark:text-white-light">{{ state.step1Data?.libelle || 'Sans libellé'
                            }}</span>
                    </div>

                    <!-- Date -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Date:</span>
                        <span class="text-gray-900 dark:text-white-light">{{ state.step1Data?.date || 'Date non définie'
                            }}</span>
                    </div>

                    <!-- Type -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Type:</span>
                        <span class="text-gray-900 dark:text-white-light">{{ state.step1Data && state.step1Data.type ?
                            state.step1Data.type : 'Type' }}
                        </span>
                    </div>

                    <!-- Compte -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Compte:</span>
                        <span class="text-gray-900 dark:text-white-light">{{ getAccountName(state.step1Data?.compte) }}</span>
                    </div>
                </div>

                <!-- Deuxième ligne : Magasins -->
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-gray-500 dark:text-gray-400 flex-shrink-0">Magasin:</span>
                    <template v-if="Array.isArray(state.step1Data.magasin) && state.step1Data.magasin.length">
                        <span class="text-gray-900 dark:text-white-light">
                            {{state.step1Data.magasin.map(m => getWarehouseName(typeof m === 'string' ? m : m.magasin)).join(', ')}}
                        </span>
                    </template>
                    <template v-else>
                        <span class="text-gray-900 dark:text-white-light">Non défini</span>
                    </template>
                </div>
            </div>

            <!-- Comptages en grille responsive -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2">
                <div v-for="(comptage, index) in state.comptages" :key="index"
                    class="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md  dark:bg-gray-700">
                    <!-- En-tête du comptage -->
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs text-gray-900 dark:text-white">Comptage {{ index + 1 }}</span>
                        <span v-if="comptage.mode"
                            class="px-2 py-0.5 bg-gray-400/10 dark:bg-dark-light/10 dark:text-white-light hover:text-primary rounded-lg text-xs">
                            {{ comptage.mode }}
                        </span>
                        <span v-else class="text-gray-400 italic text-xs">Non configuré</span>
                    </div>

                    <!-- Options -->
                    <div class="flex flex-wrap gap-1">
                        <template v-if="hasActiveOptions(comptage)">
                            <!-- Options "en vrac" uniquement -->
                            <template v-if="comptage.mode === 'en vrac'">
                                <span v-if="comptage.inputMethod === 'saisie' || comptage.saisieQuantite"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Saisie quantité
                                </span>
                                <span v-if="comptage.inputMethod === 'scanner' || comptage.scannerUnitaire"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Scanner unitaire
                                </span>
                                <span v-if="comptage.guideQuantite"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Guide quantité
                                </span>
                            </template>

                            <!-- Options "par article" uniquement -->
                            <template v-if="comptage.mode === 'par article'">
                                <span v-if="comptage.guideQuantite"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Guide quantité
                                </span>
                                <span v-if="comptage.isVariante"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Variante
                                </span>
                                <span v-if="comptage.guideArticle"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Guide Article
                                </span>
                                <span v-if="comptage.dlc"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    DLC
                                </span>
                                <span v-if="comptage.numeroSerie"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Numéro de série
                                </span>
                                <span v-if="comptage.numeroLot"
                                    class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                                    Numéro de lot
                                </span>
                            </template>
                        </template>
                        <span v-else class="text-gray-400 italic text-xs">Aucune option</span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="!loaded" class="text-center py-10">
            Chargement...
        </div>

        <DynamicWizard v-else :key="wizardKey" :steps="wizardSteps" v-model:current-step="currentStep"
            :is-valid="isValid" :beforeChange="validateAndSaveStep" @complete="handleSubmit"
            :finish-button-text="isSubmitting ? 'Création…' : 'Créer'" color="#ffc107">

            <template #step-0>
                <FormBuilder v-model:modelValue="state.step1Data" :fields="formFields" hide-submit :columns="4" />
            </template>

            <template #step-1>
                <div>
                    <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Validation des règles métier active
                            </span>
                        </div>
                        <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Les règles de validation spécifiques au mode de comptage seront vérifiées.
                        </p>
                    </div>
                    <ParamStep v-model="state.comptages[0]" :step-index="0"
                        :available-modes="availableModesForStep(0)" :prev-comptages="state.comptages" />
                </div>
            </template>
            <template #step-2 v-if="state.comptages.length > 1">
                <div>
                    <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Validation des règles métier active
                            </span>
                        </div>
                        <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Les règles de validation spécifiques au mode de comptage seront vérifiées.
                        </p>
                    </div>
                    <ParamStep v-model="state.comptages[1]" :step-index="1"
                        :available-modes="availableModesForStep(1)" :prev-comptages="state.comptages" />
                </div>
            </template>
            <template #step-3 v-if="state.comptages.length > 2">
                <div>
                    <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Validation des règles métier active
                            </span>
                        </div>
                        <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Les règles de validation spécifiques au mode de comptage seront vérifiées.
                        </p>
                    </div>
                    <ParamStep v-model="state.comptages[2]" :step-index="2"
                        :available-modes="availableModesForStep(2)" :prev-comptages="state.comptages" />
                </div>
            </template>

        </DynamicWizard>

    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryCreation } from '@/composables/useInventoryCreation';
import DynamicWizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ParamStep from '@/components/ParamStep.vue';
import type { FieldConfig } from '@/interfaces/form';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';
import { required, date, magasinWithDatesRequired } from '@/utils/validate';
import { alertService } from '@/services/alertService';

const router = useRouter();
const wizardKey = ref(Date.now());

const {
    state,
    currentStep,
    availableModesForStep,
    onStepComplete,
    onComplete,
    loaded,
    isValid,
    isSubmitting,
    warehouses,
    accounts,
    warehousesLoading,
    accountsLoading,
} = useInventoryCreation();

// Créer les options dynamiques pour les comptes
const accountOptions = computed(() => {
    const accountsArray = Array.isArray(accounts.value) ? accounts.value : [];
    return accountsArray.map(account => ({
        label: account.account_name,
        value: account.id.toString()
    }));
});

// Créer les options dynamiques pour les magasins
const warehouseOptions = computed(() => {
    const warehousesArray = Array.isArray(warehouses.value) ? warehouses.value : [];
    return warehousesArray.map(warehouse => ({
        label: warehouse.warehouse_name,
        value: warehouse.id.toString()
    }));
});

// Fonctions pour obtenir les noms des comptes et magasins
const getAccountName = (accountId: string) => {
    if (!accountId) return 'Compte non défini';
    const accountsArray = Array.isArray(accounts.value) ? accounts.value : [];
    const account = accountsArray.find(acc => acc.id.toString() === accountId);
    return account ? account.account_name : accountId;
};

const getWarehouseName = (warehouseId: string) => {
    if (!warehouseId) return 'Magasin non défini';
    const warehousesArray = Array.isArray(warehouses.value) ? warehouses.value : [];
    const warehouse = warehousesArray.find(wh => wh.id.toString() === warehouseId);
    return warehouse ? warehouse.warehouse_name : warehouseId;
};

/* Étape 1 (fusion des anciennes étapes 1 et 2) */
const formFields = computed<FieldConfig[]>(() => [
    {
        key: 'libelle',
        label: 'Libellé',
        type: 'text',
        props: { placeholder: 'Entrer le libellé' },
        validators: [{ key: 'libelle', ...required('Le libellé est requis') }]
    },
    {
        key: 'date',
        label: 'Date',
        type: 'date',
        validators: [
            { key: 'date', ...required('La date est requise') },
            { key: 'date', ...date('Format de date invalide') }
        ]
    },
    {
        key: 'type',
        label: 'Type',
        type: 'select',
        options: ['Inventaire Général'],
        props: { disabled: false },
        searchable: false,
        clearable: false,
        validators: []
    },
    {
        key: 'compte',
        label: 'Compte',
        type: 'select',
        options: accountOptions.value,
        validators: [{ key: 'compte', ...required('Veuillez sélectionner un compte') }]
    },
    {
        key: 'magasin',
        label: 'Magasin',
        type: 'multi-select-with-dates',
        options: warehouseOptions.value,
        searchable: true,
        clearable: true,
        props: { placeholder: 'Sélectionnez des magasins' },
        itemKey: 'magasin', // Specify the key name for magasin items
        dateLabel: 'Dates par magasin', // Label indicating dates are required
        validators: [{ key: 'magasin', ...magasinWithDatesRequired('Veuillez sélectionner au moins un magasin et renseigner toutes les dates') }]
    }
]);

/* Définitions des étapes du wizard */
const wizardSteps = [
    { title: 'Création' },
    { title: 'comptage 1/3' },
    { title: 'comptage 2/3' },
    { title: 'comptage 3/3' }
];

/* Fonction helper pour vérifier si un comptage a des options actives selon son mode */
function hasActiveOptions(comptage: ComptageConfig): boolean {
    if (comptage.mode === 'en vrac') {
        return comptage.inputMethod !== '' ||
            comptage.guideQuantite ||
            comptage.saisieQuantite ||
            comptage.scannerUnitaire;
    } else if (comptage.mode === 'par article') {
        return comptage.guideQuantite ||
            comptage.isVariante ||
            comptage.guideArticle ||
            comptage.dlc ||
            comptage.numeroSerie ||
            comptage.numeroLot;
    } else if (comptage.mode === 'image de stock') {
        return false; // Aucune option pour "image de stock"
    }

    return false;
}

/* Valider et sauvegarder avant chaque changement d'étape */
async function validateAndSaveStep(prev: number, next: number): Promise<boolean> {
    let data: any;
    if (prev === 0) data = state.step1Data;
    else data = state.comptages[prev - 1];

    return await onStepComplete(prev, data);
}

/* Soumission finale */
async function handleSubmit() {
    if (isSubmitting.value) return;

    try {
        // Validation et sauvegarde de toutes les étapes
        for (let i = 0; i < wizardSteps.length; i++) {
            const ok = await validateAndSaveStep(i, i + 1);
            if (!ok) {
                await alertService.error({
                    title: 'Validation',
                    text: `Erreurs de validation à l'étape ${i + 1}`
                });
                return;
            }
        }

        // Appeler la fonction de complétion du composable
        await onComplete();

        // → Redirection vers la liste des inventaires
        router.push({ name: 'inventory-list' });

        // Alerte de succès
        await alertService.success({
            title: 'Succès',
            text: 'Votre inventaire a été créé avec succès !'
        });
    } catch (err: any) {
        console.error('Erreur lors de la création:', err);

        // Vérifier si l'erreur est liée aux notifications
        if (err.message && err.message.includes('addNotification')) {
            // Si c'est juste une erreur de notification, on peut quand même considérer que c'est un succès
            console.log('⚠️ Erreur de notification, mais inventaire créé avec succès');

            // → Redirection vers la liste des inventaires
            router.push({ name: 'inventory-list' });

            // Alerte de succès
            await alertService.success({
                title: 'Succès',
                text: 'Votre inventaire a été créé avec succès !'
            });
        } else {
            // Erreur réelle, afficher le message d'erreur
            await alertService.error({
                title: 'Erreur',
                text: "Une erreur est survenue lors de la création de l'inventaire."
            });
        }
    }
}
</script>
