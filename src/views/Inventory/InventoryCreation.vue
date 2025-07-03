<template>
    <div>
        <div class="flex justify-end mb-2">
            <button @click="onCancelClick" class="btn btn-outline-primary">
                Annuler
            </button>
        </div>

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
                        <span class="text-gray-900 dark:text-white-light ">{{ state.step1Data.libelle || 'Sans libellé'
                            }}</span>
                    </div>

                    <!-- Date -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Date:</span>
                        <span class="text-gray-900 dark:text-white-light">{{ state.step1Data.date || 'Date non définie'
                            }}</span>
                    </div>

                    <!-- Type -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Type:</span>
                        <span class="text-gray-900 dark:text-white-light">{{ state.step1Data.type || 'Type' }}</span>
                    </div>

                    <!-- Compte -->
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Compte:</span>
                        <span class="text-gray-900 dark:text-white-light">{{ state.step1Data.compte || 'Compte non défini' }}</span>
                    </div>
                </div>

                <!-- Deuxième ligne : Magasins -->
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-gray-500 dark:text-gray-400 flex-shrink-0">Magasin:</span>
                    <template v-if="Array.isArray(state.step1Data.magasin) && state.step1Data.magasin.length">
                        <span class="text-gray-900 dark:text-white-light">
                            {{state.step1Data.magasin.map(m => typeof m === 'string' ? m : m.magasin).join(', ')}}
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
            Chargement de votre brouillon…
        </div>

        <DynamicWizard v-else :key="wizardKey" :steps="wizardSteps" v-model:current-step="currentStep"
            :is-valid="isValid" :beforeChange="validateAndSaveStep" @complete="handleSubmit"
            :finish-button-text="isSubmitting ? 'Création…' : 'Créer'" :isSubmitting="isSubmitting" color="#ffc107">
            <template #step-0>
                <!-- Étape 1 : En-tête d'inventaire, aucune validation métier de comptage ici -->
                <FormBuilder
                    v-model:modelValue="state.step1Data"
                    :fields="formFields"
                    :loading="isSubmitting"
                    hide-submit
                    :columns="4"
                />
            </template>

            <!-- Étapes 2, 3, 4 : Paramétrage des comptages, validation métier via usecases dans ParamStep.vue -->
            <template v-for="(_, idx) in state.comptages" :key="idx" v-slot:[`step-${idx+1}`]>
                <ParamStep v-model="state.comptages[idx]" :step-index="idx"
                    :available-modes="availableModesForStep(idx)" :prev-comptages="state.comptages" />
            </template>
        </DynamicWizard>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryCreation } from '@/composables/useInventoryCreation';
import DynamicWizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ParamStep from '@/components/ParamStep.vue';
import type { FieldConfig } from '@/interfaces/form';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';
import { required, date, magasinWithDatesRequired } from '@/utils/validate';
import { alertService } from '@/services/alertService';
import { useAccount } from '@/composables/useAccount';
import { useWarehouse } from '@/composables/useWarehouse';
import { CountingDispatcher } from '@/usecases/CountingDispatcher';
import { CountingValidationError } from '@/usecases/CountingByArticle';
import { inventoryWizardLogic } from '@/services/InventoryWizardLogic';

const router = useRouter();
const isSubmitting = ref(false);
const wizardKey = ref(Date.now());

const {
    state,
    currentStep,
    availableModesForStep,
    onStepComplete,
    onComplete,
    cancelCreation,
    loaded,
    isValid,
    createInventory,
    resetState,
    // clearSavedState
} = useInventoryCreation();

const { accounts, loading: accountsLoading, fetchAccounts } = useAccount();
const { warehouses, loading: warehousesLoading, fetchWarehouses } = useWarehouse();

onMounted(() => {
    fetchAccounts();
    fetchWarehouses();
});

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
        options: (accounts.value && typeof accounts.value === 'object' && !Array.isArray(accounts.value) && Array.isArray((accounts.value as any).data))
            ? (accounts.value as any).data.map((acc: any) => ({
                label: acc.account_name,
                value: acc.id
            }))
            : (Array.isArray(accounts.value)
                ? (accounts.value as any[]).map(acc => ({
                    label: acc.account_name,
                    value: acc.id
                }))
                : []),
        validators: [{ key: 'compte', ...required('Veuillez sélectionner un compte') }]
    },
    {
        key: 'magasin',
        label: 'Magasin',
        type: 'multi-select-with-dates',
        options: (warehouses.value && typeof warehouses.value === 'object' && !Array.isArray(warehouses.value) && Array.isArray((warehouses.value as any).data))
            ? (warehouses.value as any).data.map((w: any) => ({
                label: w.warehouse_name,
                value: w.id
            }))
            : (Array.isArray(warehouses.value)
                ? (warehouses.value as any[]).map(w => ({
                    label: w.warehouse_name,
                    value: w.id
                }))
                : []),
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
        return comptage.stock_situation; // Aucune option pour "image de stock"
    }

    return false;
}

/* Valider et sauvegarder avant chaque changement d'étape */
async function validateAndSaveStep(prev: number, next: number): Promise<boolean> {
    let data: any;
    if (prev === 0) data = state.step1Data;
    else data = { ...state.comptages[prev - 1], order: prev };

    // Validation usecase pour les étapes de comptage
    if (prev > 0) {
        try {
            CountingDispatcher.validateCount({
                ...data,
                count_mode: data.mode, // mapping du champ mode -> count_mode attendu par le dispatcher
                unit_scanned: data.scannerUnitaire,
                entry_quantity: data.saisieQuantite,
                is_variant: data.isVariante,
                stock_situation: data.stock_situation,
                quantity_show: data.guideQuantite,
                show_product: data.guideArticle,
                n_lot: data.numeroLot,
                n_serie: data.numeroSerie,
                dlc: data.dlc,
            });
        } catch (e) {
            if (e instanceof CountingValidationError) {
                await alertService.error({
                    title: 'Erreur de validation',
                    text: e.message
                });
                return false;
            }
            throw e;
        }
    }

    return await onStepComplete(prev, data);
}

/* Annuler la création */
async function onCancelClick() {
    await cancelCreation();
    wizardKey.value = Date.now();
}

/* Soumission finale */
async function handleSubmit() {
    if (isSubmitting.value) return;
    isSubmitting.value = true;

    // Vérification de la cohérence image de stock
    if (!inventoryWizardLogic.checkImageDeStockConsistency(state)) {
        await alertService.error({
            title: 'Erreur de cohérence',
            text: 'Si le premier comptage est "image de stock", les 2e et 3e comptages doivent être identiques.'
        });
        isSubmitting.value = false;
        return;
    }

    try {
        // Validation et sauvegarde des 3 étapes de comptage (steps 1, 2, 3)
        for (let i = 1; i <= 3; i++) {
            const ok = await validateAndSaveStep(i, i + 1);
            if (!ok) {
                await alertService.error({
                    title: 'Validation',
                    text: `Erreurs de validation à l'étape ${i + 1}`
                });
                isSubmitting.value = false;
                return;
            }
        }

        // Construction du payload pour l'API (3 comptages uniquement)
        const payload = {
            label: state.step1Data.libelle,
            date: state.step1Data.date,
            account_id: Number(state.step1Data.compte),
            warehouse: Array.isArray(state.step1Data.magasin)
                ? state.step1Data.magasin.map((m: any) => ({
                    id: typeof m === 'object' ? m.id || m.magasin : m,
                    date: m.date || ''
                }))
                : [],
            comptages: state.comptages.slice(0, 3).map((c: any, idx: number) => ({
                order: idx + 1,
                count_mode: c.mode,
                unit_scanned: !!c.scannerUnitaire,
                entry_quantity: !!c.saisieQuantite,
                is_variant: !!c.isVariante,
                stock_situation: !!(c.stock_situation ?? c.stockSituation),
                quantity_show: !!c.guideQuantite,
                show_product: !!c.guideArticle,
                dlc: !!c.dlc,
                n_serie: !!c.numeroSerie,
                n_lot: !!c.numeroLot,
            }))
        };

        // Appel via le composable
        await createInventory(payload);
        await onComplete();
        await alertService.success({
            title: 'Succès',
            text: 'Votre inventaire a été créé avec succès !'
        });
    } catch (err) {
        console.error(err);
        await alertService.error({
            title: 'Erreur',
            text: "Une erreur est survenue lors de la création de l'inventaire."
        });
    } finally {
        isSubmitting.value = false;
    }
}
</script>
