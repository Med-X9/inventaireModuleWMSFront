<template>
    <div class="inventory-creation bg-gray-50 min-h-screen w-full">
        <!-- Header avec navigation -->
        <div class="bg-white shadow-sm border-b border-gray-200">
            <div class="w-full px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <h1 class="text-3xl font-bold text-gray-900">
                            <span class="border-b-4 border-yellow-400 pb-2">Création d'inventaire</span>
                        </h1>
                        <button
                            @click="showBusinessRules"
                            class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
                            title="Afficher les règles métier"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Règles métier
                        </button>
                    </div>
                    <button
                        @click="resetForm"
                        class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
                        title="Réinitialiser le formulaire"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>

        <!-- Contenu principal -->
        <div class="w-full px-6 py-8">
            <!-- Affichage en temps réel -->
            <InventoryCreationRecap
                :header="state.header"
                :comptages="state.comptages"
            />

            <!-- Affichage des erreurs de validation du wizard -->
            <AlertMessage
                :show="!!wizardValidationError"
                type="warning"
                title="Validation requise"
                subtitle="Veuillez corriger cette erreur avant de continuer :"
                :message="wizardValidationError || ''"
                primary-action-text="J'ai compris"
                secondary-action-text="Recommencer"
                :primary-action="() => wizardValidationError = null"
                :secondary-action="resetForm"
            />

            <!-- Affichage d'erreur de création -->
            <AlertMessage
                :show="!!creationError"
                type="error"
                title="Erreur lors de la création"
                subtitle="Une erreur s'est produite lors de la création de l'inventaire :"
                :message="creationError || ''"
                primary-action-text="Réessayer"
                secondary-action-text="Fermer"
                :primary-action="resetForm"
                :secondary-action="() => creationError = null"
            />

            <!-- Affichage de succès de création -->
            <AlertMessage
                :show="!!creationSuccess"
                type="success"
                title="Inventaire créé avec succès !"
                subtitle="Votre inventaire a été créé avec succès :"
                :message="creationSuccess || ''"
                primary-action-text="Créer un autre inventaire"
                secondary-action-text="Fermer"
                :primary-action="resetForm"
                :secondary-action="() => creationSuccess = null"
            />

            <!-- Wizard avec meilleur espacement -->
            <div class="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <Wizard
                    :steps="steps"
                    :isValid="isValid"
                    :onFinish="() => handleCreateInventory()"
                    :validateStep="validateStep"
                    @finish="handleFinish"
                    @validationError="handleValidationError"
                >
                    <template #step-0>
                        <div class="p-4">
                            <FormBuilder
                                :key="JSON.stringify(headerFieldsValue)"
                                :fields="headerFieldsValue"
                                v-model="state.header"
                                :columns="4"
                                hide-submit
                            />
                        </div>
                    </template>
                    <template #step-1>
                        <div class="p-4">
                            <FormBuilder
                                :key="state.comptages[0].mode"
                                :fields="getFields(0)"
                                v-model="state.comptages[0]"
                                :columns="1"
                                hide-submit
                            />
                        </div>
                    </template>
                    <template #step-2>
                        <div class="p-4">
                            <FormBuilder
                                :key="state.comptages[1].mode"
                                :fields="getFields(1)"
                                v-model="state.comptages[1]"
                                :columns="1"
                                hide-submit
                            />
                        </div>
                    </template>
                    <template #step-3>
                        <div class="p-4">
                            <FormBuilder
                                :key="state.comptages[2].mode"
                                :fields="getFields(2)"
                                v-model="state.comptages[2]"
                                :columns="1"
                                hide-submit
                            />
                        </div>
                    </template>
                </Wizard>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useInventoryCreation } from '@/composables/useInventoryCreation';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import Wizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { FieldConfig } from '@/interfaces/form';
import { useWarehouse } from '@/composables/useWarehouse';
import { useAccount } from '@/composables/useAccount';
import Swal from 'sweetalert2';
import InventoryCreationRecap from './InventoryCreationRecap.vue';
import AlertMessage from '@/components/AlertMessage.vue';
import { Validators } from '@/utils/validators';

const { state, headerFields, getFields, createInventory, updateInventory, loadInventory, resetForm, validateBusinessRules, validateComptage } = useInventoryCreation();
const { fetchWarehouses } = useWarehouse();
const { fetchAccounts } = useAccount();

onMounted(() => {
    fetchWarehouses();
    fetchAccounts();
});

// Fonction pour afficher les règles métier
function showBusinessRules() {
    Swal.fire({
        title: '<div class="flex items-center gap-3"><span class="text-3xl">📋</span><span>Règles métier de comptage</span></div>',
        html: `
            <div class="text-left space-y-8 text-base max-h-[70vh] overflow-y-auto">
                <!-- Section Règles de comptage -->
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-green-100 p-2 rounded-lg">
                            <span class="text-2xl">🔢</span>
                        </div>
                        <h3 class="font-bold text-green-800 text-xl">Règles de comptage</h3>
                    </div>

                    <div class="space-y-6">
                        <!-- Mode En vrac -->
                        <div class="bg-white p-4 rounded-lg border border-green-100">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                <h4 class="font-semibold text-green-900 text-lg">Mode "En vrac"</h4>
                            </div>
                            <div class="text-green-700 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-green-500 mt-1">•</span>
                                    <span>La <strong>méthode de saisie</strong> (<span class="bg-green-100 px-2 py-1 rounded">Saisie manuelle</span> ou <span class="bg-green-100 px-2 py-1 rounded">Scanner</span>) est obligatoire.</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-green-500 mt-1">•</span>
                                    <span>Vous pouvez activer la <strong>saisie de quantité</strong> ou le <strong>scanner unitaire</strong> selon vos besoins.</span>
                                </p>
                                <div class="mt-3 p-3 bg-green-50 rounded-lg">
                                    <p class="text-sm font-medium text-green-800 mb-2">💡 Scénarios possibles :</p>
                                    <ul class="text-sm text-green-700 space-y-1">
                                        <li class="flex items-start gap-2">
                                            <span class="text-green-500 mt-1">→</span>
                                            <span>Choisir "Saisie manuelle" pour entrer les quantités à la main</span>
                                        </li>
                                        <li class="flex items-start gap-2">
                                            <span class="text-green-500 mt-1">→</span>
                                            <span>Choisir "Scanner" pour scanner les articles un par un</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Mode Par article -->
                        <div class="bg-white p-4 rounded-lg border border-green-100">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                <h4 class="font-semibold text-green-900 text-lg">Mode "Par article"</h4>
                            </div>
                            <div class="text-green-700 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-green-500 mt-1">•</span>
                                    <span>Les options sont <strong>optionnelles</strong> parmi : <span class="bg-green-100 px-2 py-1 rounded">Numéro de série</span>, <span class="bg-green-100 px-2 py-1 rounded">Numéro de lot</span>, <span class="bg-green-100 px-2 py-1 rounded">DLC</span>, <span class="bg-green-100 px-2 py-1 rounded">Variante</span>.</span>
                                </p>
                                <div class="mt-3 p-3 bg-green-50 rounded-lg">
                                    <p class="text-sm font-medium text-green-800 mb-2">✅ Combinaisons valides :</p>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div class="bg-white p-2 rounded border">
                                            <p class="font-medium text-green-800">Simples :</p>
                                            <p class="text-green-700">Numéro de série, Numéro de lot, DLC, Variante</p>
                                        </div>
                                        <div class="bg-white p-2 rounded border">
                                            <p class="font-medium text-green-800">Doubles :</p>
                                            <p class="text-green-700">(Numéro de série + Variante), (Numéro de lot + DLC), etc.</p>
                                        </div>
                                        <div class="bg-white p-2 rounded border">
                                            <p class="font-medium text-green-800">Triples :</p>
                                            <p class="text-green-700">(Numéro de lot + DLC + Variante)</p>
                                        </div>
                                        <div class="bg-white p-2 rounded border">
                                            <p class="font-medium text-green-800">Quadruples :</p>
                                            <p class="text-green-700">(Numéro de série + Numéro de lot + DLC + Variante)</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <p class="text-sm font-medium text-red-800 mb-2">⚠️ Règles importantes :</p>
                                        <ul class="text-sm text-red-700 space-y-1">
                                            <li class="flex items-start gap-2">
                                                <span class="text-red-500 mt-1">•</span>
                                                <span>Numéro de série ne peut être combiné qu'avec Variante</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-red-500 mt-1">•</span>
                                                <span>Numéro de série et Numéro de lot ne peuvent pas coexister</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-red-500 mt-1">•</span>
                                                <span>Numéro de série et DLC ne peuvent pas coexister</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section Règles de validation -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-blue-100 p-2 rounded-lg">
                            <span class="text-2xl">✅</span>
                        </div>
                        <h3 class="font-bold text-blue-800 text-xl">Règles de validation</h3>
                    </div>

                    <div class="space-y-6">
                        <!-- Règles générales -->
                        <div class="bg-white p-4 rounded-lg border border-blue-100">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <h4 class="font-semibold text-blue-900 text-lg">Règles générales</h4>
                            </div>
                            <div class="text-blue-700 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-blue-500 mt-1">•</span>
                                    <span>Le <strong>1er comptage</strong> doit toujours avoir un mode défini.</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-blue-500 mt-1">•</span>
                                    <span>Le <strong>2e comptage</strong> ne peut pas être "Image de stock".</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-blue-500 mt-1">•</span>
                                    <span>Le <strong>3e comptage</strong> doit correspondre au 1er OU au 2e comptage.</span>
                                </p>
                            </div>
                        </div>

                        <!-- Règles spécifiques -->
                        <div class="bg-white p-4 rounded-lg border border-blue-100">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <h4 class="font-semibold text-blue-900 text-lg">Règles spécifiques</h4>
                            </div>
                            <div class="text-blue-700 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-blue-500 mt-1">•</span>
                                    <span>Si le 1er comptage est "Image de stock", le 3e doit correspondre au 2e.</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-blue-500 mt-1">•</span>
                                    <span>Si le 1er comptage n'est pas "Image de stock", le 3e peut correspondre au 1er OU au 2e.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Compris',
        confirmButtonColor: '#10b981',
        width: '800px',
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            htmlContainer: 'swal-custom-html',
            confirmButton: 'swal-custom-confirm'
        },
        backdrop: 'rgba(0, 0, 0, 0.4)'
    });
}

const steps = [
    { title: 'Informations générales' },
    { title: 'Comptage 1' },
    { title: 'Comptage 2' },
    { title: 'Comptage 3' }
];
const finished = ref(false);
const creationError = ref<string | null>(null);
const wizardValidationError = ref<string | null>(null);
const creationSuccess = ref<string | null>(null);

// Watcher pour mettre à jour les erreurs métier
watch(
    () => state.comptages,
    () => {
        // Ne plus afficher automatiquement les erreurs métier
        // Les erreurs seront affichées seulement lors de la validation
    },
    { deep: true }
);

// Gestionnaire d'erreur de validation du wizard
function handleValidationError(error: string) {
    wizardValidationError.value = error;
}

// Fonction pour réinitialiser les erreurs de validation
function clearValidationErrors() {
    creationError.value = null;
    creationSuccess.value = null;
    // Ne pas réinitialiser wizardValidationError automatiquement
    // Il sera réinitialisé manuellement par l'utilisateur
}

// Watcher pour nettoyer les erreurs quand l'utilisateur change d'étape
watch(
    () => state.step,
    () => {
        // Réinitialiser seulement les erreurs de création et succès
        setTimeout(() => {
            creationError.value = null;
            creationSuccess.value = null;
        }, 1000);
    }
);

// Fonction de validation pour chaque étape
async function validateStep(step: number): Promise<boolean> {
    try {
        if (step === 0) {
            // Validation de l'en-tête
            const headerErrors = Validators.validateHeader(state.header);
            if (headerErrors.length > 0) {
                throw new Error(headerErrors.join(' | '));
            }
            return true;
        } else {
            // Validation des comptages (étapes 1, 2, 3)
            const comptageIndex = step - 1;
            const comptage = state.comptages[comptageIndex];

            const comptageErrors = Validators.validateComptage(comptage, comptageIndex);
            if (comptageErrors.length > 0) {
                throw new Error(comptageErrors.join(' | '));
            }

            // Validation spécifique du comptage via CountingDispatcher
            // On essaie de capturer le message d'erreur exact
            try {
                const isValid = validateComptage(comptageIndex);
                if (!isValid) {
                    // Si validateComptage retourne false, on essaie de valider directement pour obtenir le message
                    try {
                        inventoryCreationService.validateComptage(comptage);
                    } catch (validationError) {
                        const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
                        console.error('[validateStep] Message d\'erreur de validation:', errorMessage);
                        throw new Error(errorMessage || 'Configuration du comptage invalide selon les règles métier');
                    }
                    throw new Error('Configuration du comptage invalide selon les règles métier');
                }
            } catch (error) {
                console.error('[validateStep] Erreur de validation du comptage', {
                    step,
                    comptageIndex,
                    comptage: state.comptages[comptageIndex],
                    error: error instanceof Error ? error.message : String(error)
                });
                throw error;
            }

            // Validation spécifique du 3e comptage selon les nouvelles règles
            if (step === 3) {
                const thirdComptageErrors = Validators.validateThirdComptage(state.comptages);
                if (thirdComptageErrors.length > 0) {
                    throw new Error(thirdComptageErrors.join(' | '));
                }
            }

            // Vérifier les règles métier seulement à la dernière étape
            if (step === 3) {
                const businessErrors = Validators.validateBusinessRules(state.comptages);
                if (businessErrors.length > 0) {
                    throw new Error(businessErrors.join(' | '));
                }
            }

            return true;
        }
    } catch (error) {
        throw error;
    }
}

const headerFieldsValue = computed(() => headerFields.value);

const isValid = computed(() => {
    const h = state.header;
    const hasWarehouses = Array.isArray(h.magasin) && h.magasin.length > 0;

    return (
        !!h.libelle &&
        !!h.date &&
        !!h.inventory_type &&
        !!h.compte &&
        hasWarehouses
    );
});

watch(
    () => [state.header, isValid.value],
    ([header, valid]) => {
    },
    { deep: true }
);

function handleFinish() {
    finished.value = true;
    creationError.value = null; // Reset error
    creationSuccess.value = null; // Reset success
    // Ne pas réinitialiser wizardValidationError ici car il peut contenir des erreurs à afficher
}

// Fonction pour créer un inventaire
async function handleCreateInventory() {
    try {
        // Vérifier les règles métier avant la création
        const businessErrors = Validators.validateBusinessRules(state.comptages);
        if (businessErrors.length > 0) {
            // Afficher les erreurs métier dans l'interface
            wizardValidationError.value = businessErrors.join(' | ');
            throw new Error(businessErrors.join(' | '));
        }

        const result = await createInventory();

        // Afficher le message de succès
        creationSuccess.value = `L'inventaire "${state.header.libelle}" a été créé avec succès !`;
        creationError.value = null; // Réinitialiser les erreurs
        wizardValidationError.value = null; // Réinitialiser les erreurs de validation

        // Optionnel : rediriger vers la liste des inventaires
        // router.push('/inventories');

    } catch (error) {
        // Si c'est une erreur de validation métier, elle est déjà affichée
        if (!wizardValidationError.value) {
            creationError.value = error instanceof Error ? error.message : 'Erreur lors de la création de l\'inventaire';
        }
        creationSuccess.value = null; // Réinitialiser le succès
        throw error; // Re-lancer l'erreur pour que le Wizard puisse la gérer
    }
}

// Fonction pour modifier un inventaire
async function handleUpdateInventory(inventoryId: number | string) {
    try {
        const result = await updateInventory(inventoryId);

        // Rediriger vers la liste des inventaires ou afficher un message de succès
        alert('Inventaire modifié avec succès !');

    } catch (error) {
        alert('Erreur lors de la modification de l\'inventaire');
    }
}
</script>

<style scoped>
.inventory-creation {
    width: 100%;
    padding: 0;
    border: none;
    border-radius: 0;
    background: #f9fafb;
}

/* Amélioration des transitions */
.transition-all {
    transition: all 0.2s ease-in-out;
}

/* Amélioration des ombres */
.hover\:shadow-md:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Amélioration des bordures */
.hover\:border-gray-300:hover {
    border-color: #d1d5db;
}
</style>
