<template>
    <div class="inventory-creation bg-gray-50 min-h-screen w-full">
        <Container max-width="7xl" class="py-6">
            <!-- Header avec navigation -->
            <Card class="mb-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex items-center gap-4">
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
                            Création d'inventaire
                        </h1>
                        <Button
                            @click="showBusinessRules"
                            variant="primary"
                            size="sm"
                            class="flex items-center gap-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Règles métier
                        </Button>
                    </div>
                    <Button
                        @click="resetForm"
                        variant="secondary"
                        size="sm"
                        class="flex items-center gap-2"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Réinitialiser
                    </Button>
                </div>
            </Card>

            <!-- Contenu principal -->
            <div class="space-y-6">
            <!-- Affichage en temps réel -->
            <InventoryCreationRecap
                :header="state.header"
                :comptages="state.comptages"
            />

                <!-- Affichage des erreurs de validation du wizard -->
                <Alert
                    v-if="wizardValidationError"
                    type="warning"
                    :title="'Validation requise'"
                    :message="wizardValidationError"
                    :dismissible="true"
                    @dismiss="wizardValidationError = null"
                >
                    <template #action>
                        <Button variant="secondary" size="sm" @click="resetForm">
                            Recommencer
                        </Button>
                    </template>
                </Alert>

                <!-- Affichage d'erreur de création -->
                <Alert
                    v-if="creationError"
                    type="error"
                    :title="'Erreur lors de la création'"
                    :message="creationError"
                    :dismissible="true"
                    @dismiss="creationError = null"
                >
                    <template #action>
                        <Button variant="primary" size="sm" @click="resetForm">
                            Réessayer
                        </Button>
                    </template>
                </Alert>

                <!-- Affichage de succès de création -->
                <Alert
                    v-if="creationSuccess"
                    type="success"
                    :title="'Inventaire créé avec succès !'"
                    :message="creationSuccess"
                    :dismissible="true"
                    @dismiss="creationSuccess = null"
                >
                    <template #action>
                        <Button variant="primary" size="sm" @click="resetForm">
                            Créer un autre inventaire
                        </Button>
                    </template>
                </Alert>

                <!-- Stepper avec composant Steps du package -->
                <Card>
                    <template #header>
                        <Steps
                            :steps="stepsData"
                            size="md"
                            @step-click="(step, index) => handleStepClick(index + 1)"
                        />
                    </template>

                    <!-- Contenu des étapes -->
                    <div class="p-6">
                    <!-- Étape 1 : Informations générales -->
                    <div v-if="currentStep === 1">
                        <Form>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormGroup>
                                    <FormLabel>Libellé <span class="text-red-500">*</span></FormLabel>
                                    <Input
                                        v-model="state.header.libelle"
                                        type="text"
                                        placeholder="Entrez le libellé"
                                    />
                                    <FormError v-if="!state.header.libelle && isValid">Le libellé est requis</FormError>
                                </FormGroup>

                                <FormGroup>
                                    <FormLabel>Date <span class="text-red-500">*</span></FormLabel>
                                    <Input
                                        v-model="state.header.date"
                                        type="date"
                                        :error="!state.header.date && isValid ? 'La date est requise' : undefined"
                                    />
                                    <FormError v-if="!state.header.date && isValid">La date est requise</FormError>
                                </FormGroup>

                                <FormGroup>
                                    <FormLabel>Type <span class="text-red-500">*</span></FormLabel>
                                    <Autocomplete
                                        :options="[
                                            { label: 'Général', value: 'GENERAL' },
                                            { label: 'Tournant', value: 'TOURNANT' }
                                        ]"
                                        v-model="state.header.inventory_type"
                                        placeholder="Sélectionnez un type"
                                        :disabled="false"
                                        :error="!state.header.inventory_type && isValid ? 'Le type est requis' : undefined"
                                    />
                                    <FormError v-if="!state.header.inventory_type && isValid">Le type est requis</FormError>
                                </FormGroup>

                                <FormGroup>
                                    <FormLabel>Compte <span class="text-red-500">*</span></FormLabel>
                                    <Autocomplete
                                        :options="accountOptions as AutocompleteOption[]"
                                        v-model="state.header.compte"
                                        placeholder="Sélectionnez un compte"
                                        :disabled="false"
                                        :error="!state.header.compte && isValid ? 'Le compte est requis' : undefined"
                                    />
                                    <FormError v-if="!state.header.compte && isValid">Le compte est requis</FormError>
                                </FormGroup>
                            </div>

                            <FormGroup class="mt-4">
                                <FormLabel>Magasin <span class="text-red-500">*</span></FormLabel>
                                <MultiSelectWithDates
                                    :field="{
                                        key: 'magasin',
                                        label: 'Magasin',
                                        type: 'multi-select-with-dates',
                                        options: warehouseOptions,
                                        dateLabel: 'Dates par magasin'
                                    }"
                                    :value="state.header.magasin"
                                    :error="false"
                                    :disabled="false"
                                    @update:value="(val) => {
                                        if (Array.isArray(val)) {
                                            (state.header.magasin as any) = val;
                                        }
                                    }"
                                />
                                <FormError v-if="(!state.header.magasin || state.header.magasin.length === 0) && isValid">
                                    Au moins un magasin est requis
                                </FormError>
                            </FormGroup>
                        </Form>
                    </div>

                    <!-- Étape 2 : Comptage 1 -->
                    <div v-else-if="currentStep === 2">
                        <Form>
                            <FormGroup>
                                <FormLabel>Mode de comptage <span class="text-red-500">*</span></FormLabel>
                                <Autocomplete
                                    :options="getStepConfig(0).modes.map(m => ({ label: m, value: m })) as AutocompleteOption[]"
                                    v-model="state.comptages[0].mode"
                                    placeholder="Sélectionnez un mode"
                                    :disabled="false"
                                    :error="!state.comptages[0].mode && isValid ? 'Le mode est requis' : undefined"
                                />
                                <FormError v-if="!state.comptages[0].mode && isValid">Le mode est requis</FormError>
                            </FormGroup>

                            <!-- Options pour mode "en vrac" -->
                            <template v-if="state.comptages[0].mode === 'en vrac'">
                                <FormGroup>
                                    <FormLabel>Méthode opératoire <span class="text-red-500">*</span></FormLabel>
                                    <div class="flex gap-6">
                                        <Radio
                                            v-model="state.comptages[0].inputMethod"
                                            value="saisie"
                                            label="Saisie quantité"
                                            name="inputMethod-0"
                                            :error="!state.comptages[0].inputMethod && isValid ? 'La méthode opératoire est requise' : undefined"
                                        />
                                        <Radio
                                            v-model="state.comptages[0].inputMethod"
                                            value="scanner"
                                            label="Scanner unitaire"
                                            name="inputMethod-0"
                                            :error="!state.comptages[0].inputMethod && isValid ? 'La méthode opératoire est requise' : undefined"
                                        />
                                    </div>
                                    <FormError v-if="!state.comptages[0].inputMethod && isValid">La méthode opératoire est requise</FormError>
                                </FormGroup>

                                <div v-if="getOptions(0).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(0).filter(opt => opt !== 'saisieQuantite' && opt !== 'scannerUnitaire')"
                                            :key="opt"
                                            v-model="(state.comptages[0] as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                        />
                                    </div>
                                </div>
                            </template>

                            <!-- Options pour mode "par article" -->
                            <template v-else-if="state.comptages[0].mode === 'par article'">
                                <div v-if="getOptions(0).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(0)"
                                            :key="opt"
                                            v-model="(state.comptages[0] as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                            :disabled="getOptionDisabled(0, opt)"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Form>
                    </div>

                    <!-- Étape 3 : Comptage 2 -->
                    <div v-else-if="currentStep === 3">
                        <Form>
                            <FormGroup>
                                <FormLabel>Mode de comptage <span class="text-red-500">*</span></FormLabel>
                                <Autocomplete
                                    :options="getStepConfig(1).modes.map(m => ({ label: m, value: m })) as AutocompleteOption[]"
                                    v-model="state.comptages[1].mode"
                                    placeholder="Sélectionnez un mode"
                                    :disabled="false"
                                    :error="!state.comptages[1].mode && isValid ? 'Le mode est requis' : undefined"
                                />
                                <FormError v-if="!state.comptages[1].mode && isValid">Le mode est requis</FormError>
                            </FormGroup>

                            <!-- Options pour mode "en vrac" -->
                            <template v-if="state.comptages[1].mode === 'en vrac'">
                                <FormGroup>
                                    <FormLabel>Méthode opératoire <span class="text-red-500">*</span></FormLabel>
                                    <div class="flex gap-6">
                                        <Radio
                                            v-model="state.comptages[1].inputMethod"
                                            value="saisie"
                                            label="Saisie quantité"
                                            name="inputMethod-1"
                                            :error="!state.comptages[1].inputMethod && isValid ? 'La méthode opératoire est requise' : undefined"
                                        />
                                        <Radio
                                            v-model="state.comptages[1].inputMethod"
                                            value="scanner"
                                            label="Scanner unitaire"
                                            name="inputMethod-1"
                                            :error="!state.comptages[1].inputMethod && isValid ? 'La méthode opératoire est requise' : undefined"
                                        />
                                    </div>
                                    <FormError v-if="!state.comptages[1].inputMethod && isValid">La méthode opératoire est requise</FormError>
                                </FormGroup>

                                <div v-if="getOptions(1).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(1).filter(opt => opt !== 'saisieQuantite' && opt !== 'scannerUnitaire')"
                                            :key="opt"
                                            v-model="(state.comptages[1] as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                        />
                                    </div>
                                </div>
                            </template>

                            <!-- Options pour mode "par article" -->
                            <template v-else-if="state.comptages[1].mode === 'par article'">
                                <div v-if="getOptions(1).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(1)"
                                            :key="opt"
                                            v-model="(state.comptages[1] as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                            :disabled="getOptionDisabled(1, opt)"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Form>
                    </div>

                    <!-- Étape 4 : Comptage 3 -->
                    <div v-else-if="currentStep === 4">
                        <Form>
                            <FormGroup>
                                <FormLabel>Mode de comptage <span class="text-red-500">*</span></FormLabel>
                                <Autocomplete
                                    :options="getStepConfig(2).modes.map(m => ({ label: m, value: m })) as AutocompleteOption[]"
                                    v-model="state.comptages[2].mode"
                                    placeholder="Sélectionnez un mode"
                                    :disabled="false"
                                    :error="!state.comptages[2].mode && isValid ? 'Le mode est requis' : undefined"
                                />
                                <FormError v-if="!state.comptages[2].mode && isValid">Le mode est requis</FormError>
                            </FormGroup>

                            <!-- Options pour mode "en vrac" -->
                            <template v-if="state.comptages[2].mode === 'en vrac'">
                                <FormGroup>
                                    <FormLabel>Méthode opératoire <span class="text-red-500">*</span></FormLabel>
                                    <div class="flex gap-6">
                                        <Radio
                                            v-model="state.comptages[2].inputMethod"
                                            value="saisie"
                                            label="Saisie quantité"
                                            name="inputMethod-2"
                                            :error="!state.comptages[2].inputMethod && isValid ? 'La méthode opératoire est requise' : undefined"
                                        />
                                        <Radio
                                            v-model="state.comptages[2].inputMethod"
                                            value="scanner"
                                            label="Scanner unitaire"
                                            name="inputMethod-2"
                                            :error="!state.comptages[2].inputMethod && isValid ? 'La méthode opératoire est requise' : undefined"
                                        />
                                    </div>
                                    <FormError v-if="!state.comptages[2].inputMethod && isValid">La méthode opératoire est requise</FormError>
                                </FormGroup>

                                <div v-if="getOptions(2).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(2).filter(opt => opt !== 'saisieQuantite' && opt !== 'scannerUnitaire')"
                                            :key="opt"
                                            v-model="(state.comptages[2] as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                        />
                                    </div>
                                </div>
                            </template>

                            <!-- Options pour mode "par article" -->
                            <template v-else-if="state.comptages[2].mode === 'par article'">
                                <div v-if="getOptions(2).length > 0" class="mt-6">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Checkbox
                                            v-for="opt in getOptions(2)"
                                            :key="opt"
                                            v-model="(state.comptages[2] as any)[opt]"
                                            :label="getOptionLabel(opt)"
                                            :disabled="getOptionDisabled(2, opt)"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Form>
                    </div>
                </div>

                    <!-- Actions du stepper -->
                    <div class="border-t border-gray-200 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="text-sm text-gray-500">
                            Étape {{ currentStep }} sur {{ steps.length }}
                        </div>
                        <div class="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                :disabled="currentStep === 1"
                                @click="goToPreviousStep"
                            >
                                Précédent
                            </Button>
                            <Button
                                v-if="!isLastStep"
                                variant="primary"
                                :disabled="!isValid"
                                @click="goToNextStep"
                            >
                                Suivant
                            </Button>
                            <Button
                                v-else
                                variant="primary"
                                :disabled="!isValid"
                                @click="finishStepper"
                            >
                                Terminer
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryCreation } from '@/composables/useInventoryCreation';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import { useWarehouse } from '@/composables/useWarehouse';
import { useAccount } from '@/composables/useAccount';
import Swal from 'sweetalert2';
import InventoryCreationRecap from './InventoryCreationRecap.vue';
import { Validators } from '@/utils/validators';
import { Form, FormGroup, FormLabel, FormError, Button, Input, Autocomplete, Radio, Checkbox, Card, Alert, Steps, Container } from '@SMATCH-Digital-dev/vue-system-design';
import type { AutocompleteOption, Step } from '@SMATCH-Digital-dev/vue-system-design';
import MultiSelectWithDates from '@/components/Form/fields/MultiSelectWithDates.vue';

const router = useRouter();

const { state, headerFields, getFields, getOptions, getStepConfig, createInventory, updateInventory, loadInventory, resetForm, validateBusinessRules, validateComptage, accountOptions, warehouseOptions } = useInventoryCreation();
const { fetchAccounts } = useAccount();

onMounted(() => {
    fetchAccounts();
});

// Fonction pour afficher les règles métier
function showBusinessRules() {
    Swal.fire({
        title: '<div class="flex items-center gap-3"><span class="text-primary">Règles métier de comptage</span></div>',
        html: `
            <div class="text-left space-y-8 text-base overflow-y-auto max-h-[calc(100vh-200px)]">
                <!-- Section Règles de comptage -->
                <div class="bg-primary/10 dark:bg-primary/20 p-6 rounded-xl border border-primary/20 dark:border-primary/30 shadow-sm">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-primary/20 dark:bg-primary/30 p-2 rounded-lg">
                            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                            </svg>
                        </div>
                        <h3 class="font-bold text-gray-900 dark:text-white text-xl">Règles de comptage</h3>
                    </div>

                    <div class="space-y-6">
                        <!-- Mode En vrac -->
                        <div class="bg-white dark:bg-dark-bg p-4 rounded-lg border border-primary/20 dark:border-primary/30">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-primary rounded-full"></div>
                                <h4 class="font-semibold text-gray-900 dark:text-white text-lg">Mode "En vrac"</h4>
                            </div>
                            <div class="text-gray-700 dark:text-gray-300 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>La <strong>méthode de saisie</strong> (<span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Saisie manuelle</span> ou <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Scanner</span>) est <strong>obligatoire</strong>.</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Options disponibles : <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Saisie de quantité</span>, <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Scanner unitaire</span>, <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Guide quantité</span>.</span>
                                </p>
                                <div class="mt-3 p-3 bg-info/10 dark:bg-info/20 rounded-lg border border-info/20 dark:border-info/30">
                                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <svg class="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        Note importante :
                                    </p>
                                    <p class="text-sm text-gray-700 dark:text-gray-300">L'option <strong>Guide article</strong> n'est <strong>pas disponible</strong> pour le mode "En vrac".</p>
                                </div>
                            </div>
                        </div>

                        <!-- Mode Par article -->
                        <div class="bg-white dark:bg-dark-bg p-4 rounded-lg border border-primary/20 dark:border-primary/30">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-primary rounded-full"></div>
                                <h4 class="font-semibold text-gray-900 dark:text-white text-lg">Mode "Par article"</h4>
                            </div>
                            <div class="text-gray-700 dark:text-gray-300 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span><strong>Toutes les options sont optionnelles</strong> (vous pouvez créer un comptage sans aucune option).</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Options disponibles : <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Numéro de série</span>, <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Numéro de lot</span>, <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">DLC</span>, <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Variante</span>, <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Guide quantité</span>, <span class="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded text-gray-900 dark:text-white">Guide article</span>.</span>
                                </p>
                                <div class="mt-3 p-3 bg-success/10 dark:bg-success/20 rounded-lg border border-success/20 dark:border-success/30">
                                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        Combinaisons valides (10 au total) :
                                    </p>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div class="bg-white dark:bg-dark-bg p-2 rounded border border-primary/20 dark:border-primary/30">
                                            <p class="font-medium text-gray-900 dark:text-white mb-1">Aucune option :</p>
                                            <p class="text-gray-700 dark:text-gray-300 text-xs">(vide) ✓</p>
                                        </div>
                                        <div class="bg-white dark:bg-dark-bg p-2 rounded border border-primary/20 dark:border-primary/30">
                                            <p class="font-medium text-gray-900 dark:text-white mb-1">Simples :</p>
                                            <p class="text-gray-700 dark:text-gray-300 text-xs">Numéro de série, Numéro de lot, DLC, Variante</p>
                                        </div>
                                        <div class="bg-white dark:bg-dark-bg p-2 rounded border border-primary/20 dark:border-primary/30">
                                            <p class="font-medium text-gray-900 dark:text-white mb-1">Doubles :</p>
                                            <p class="text-gray-700 dark:text-gray-300 text-xs">(Numéro de série + Variante), (DLC + Numéro de lot), (DLC + Variante), (Numéro de lot + Variante)</p>
                                        </div>
                                        <div class="bg-white dark:bg-dark-bg p-2 rounded border border-primary/20 dark:border-primary/30">
                                            <p class="font-medium text-gray-900 dark:text-white mb-1">Triples :</p>
                                            <p class="text-gray-700 dark:text-gray-300 text-xs">(DLC + Numéro de lot + Variante)</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 p-3 bg-error/10 dark:bg-error/20 rounded-lg border border-error/20 dark:border-error/30">
                                        <p class="text-sm font-medium text-error-700 dark:text-error-300 mb-2 flex items-center gap-2">
                                            <svg class="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                            </svg>
                                            Règles d'exclusion :
                                        </p>
                                        <ul class="text-sm text-error-600 dark:text-error-400 space-y-1">
                                            <li class="flex items-start gap-2">
                                                <span class="text-error mt-1">•</span>
                                                <span><strong>Numéro de série</strong> ne peut être combiné qu'avec <strong>Variante</strong></span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-error mt-1">•</span>
                                                <span><strong>Numéro de série</strong> et <strong>Numéro de lot</strong> ne peuvent pas coexister</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-error mt-1">•</span>
                                                <span><strong>Numéro de série</strong> et <strong>DLC</strong> ne peuvent pas coexister</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mode Image de stock -->
                        <div class="bg-white dark:bg-dark-bg p-4 rounded-lg border border-primary/20 dark:border-primary/30">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-primary rounded-full"></div>
                                <h4 class="font-semibold text-gray-900 dark:text-white text-lg">Mode "Image de stock"</h4>
                            </div>
                            <div class="text-gray-700 dark:text-gray-300 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Aucune option disponible. Ce mode ne peut être utilisé qu'en <strong>1er comptage</strong>.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section Combinaisons de modes -->
                <div class="bg-primary/10 dark:bg-primary/20 p-6 rounded-xl border border-primary/20 dark:border-primary/30 shadow-sm">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-primary/20 dark:bg-primary/30 p-2 rounded-lg">
                            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </div>
                        <h3 class="font-bold text-gray-900 dark:text-white text-xl">Combinaisons de modes autorisées</h3>
                    </div>

                    <div class="space-y-4">
                        <div class="bg-white dark:bg-dark-bg p-4 rounded-lg border border-primary/20 dark:border-primary/30">
                            <p class="text-gray-700 dark:text-gray-300 mb-3">Un inventaire doit contenir exactement <strong>3 comptages</strong>. Voici les combinaisons autorisées :</p>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-center gap-2 p-2 bg-primary/5 dark:bg-primary/10 rounded">
                                    <span class="text-primary font-bold">1.</span>
                                    <span class="text-gray-800 dark:text-gray-200"><strong>Image de stock</strong> → <strong>Par article</strong> → <strong>Par article</strong></span>
                                </div>
                                <div class="flex items-center gap-2 p-2 bg-primary/5 dark:bg-primary/10 rounded">
                                    <span class="text-primary font-bold">2.</span>
                                    <span class="text-gray-800 dark:text-gray-200"><strong>Image de stock</strong> → <strong>En vrac</strong> → <strong>En vrac</strong></span>
                                </div>
                                <div class="flex items-center gap-2 p-2 bg-primary/5 dark:bg-primary/10 rounded">
                                    <span class="text-primary font-bold">3.</span>
                                    <span class="text-gray-800 dark:text-gray-200"><strong>Par article</strong> → <strong>Par article</strong> → <strong>Par article</strong></span>
                                </div>
                                <div class="flex items-center gap-2 p-2 bg-primary/5 dark:bg-primary/10 rounded">
                                    <span class="text-primary font-bold">4.</span>
                                    <span class="text-gray-800 dark:text-gray-200"><strong>En vrac</strong> → <strong>En vrac</strong> → <strong>En vrac</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section Règles de validation -->
                <div class="bg-primary/10 dark:bg-primary/20 p-6 rounded-xl border border-primary/20 dark:border-primary/30 shadow-sm">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-primary/20 dark:bg-primary/30 p-2 rounded-lg">
                            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3 class="font-bold text-gray-900 dark:text-white text-xl">Règles de validation</h3>
                    </div>

                    <div class="space-y-6">
                        <!-- Règles générales -->
                        <div class="bg-white dark:bg-dark-bg p-4 rounded-lg border border-primary/20 dark:border-primary/30">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-primary rounded-full"></div>
                                <h4 class="font-semibold text-gray-900 dark:text-white text-lg">Règles générales</h4>
                            </div>
                            <div class="text-gray-700 dark:text-gray-300 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Le <strong>1er comptage</strong> doit toujours avoir un mode défini.</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Le <strong>2e comptage</strong> ne peut <strong>jamais</strong> être "Image de stock".</span>
                                </p>
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Le <strong>3e comptage</strong> doit avoir des <strong>options identiques</strong> au 1er <strong>OU</strong> au 2e comptage.</span>
                                </p>
                            </div>
                        </div>

                        <!-- Règles spécifiques -->
                        <div class="bg-white dark:bg-dark-bg p-4 rounded-lg border border-primary/20 dark:border-primary/30">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-3 h-3 bg-primary rounded-full"></div>
                                <h4 class="font-semibold text-gray-900 dark:text-white text-lg">Règles spécifiques</h4>
                            </div>
                            <div class="text-gray-700 dark:text-gray-300 space-y-2">
                                <p class="flex items-start gap-2">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Si le <strong>1er comptage</strong> est "Image de stock" :</span>
                                </p>
                                <ul class="ml-6 space-y-1 text-sm">
                                    <li class="flex items-start gap-2">
                                        <span class="text-primary mt-1">→</span>
                                        <span>Le <strong>3e comptage</strong> doit correspondre au <strong>2e comptage</strong> (même mode et mêmes options).</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-primary mt-1">→</span>
                                        <span>Les <strong>2e et 3e comptages</strong> doivent être identiques.</span>
                                    </li>
                                </ul>
                                <p class="flex items-start gap-2 mt-3">
                                    <span class="text-primary mt-1">•</span>
                                    <span>Si le <strong>1er comptage</strong> n'est <strong>pas</strong> "Image de stock" :</span>
                                </p>
                                <ul class="ml-6 space-y-1 text-sm">
                                    <li class="flex items-start gap-2">
                                        <span class="text-primary mt-1">→</span>
                                        <span>Le <strong>3e comptage</strong> peut correspondre au <strong>1er OU au 2e</strong> comptage (même mode et mêmes options).</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-primary mt-1">→</span>
                                        <span>Si tous les comptages sont "Par article" ou "En vrac", les <strong>3 comptages</strong> doivent avoir des <strong>options identiques</strong>.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showConfirmButton: true,
        showCancelButton: false,
        confirmButtonText: 'Compris',
        confirmButtonColor: '#4F46E5',
        width: '95%',
        heightAuto: false,
        customClass: {
            popup: '!max-w-[95vw] !w-[95vw] !max-h-[95vh] !m-[2.5vh_auto] !p-6',
            title: '!text-2xl !font-bold !text-gray-900 !mb-6',
            htmlContainer: '!max-h-[calc(95vh-200px)] !overflow-y-auto',
            confirmButton: '!bg-primary !text-white !border-none !px-8 !py-3 !font-semibold !rounded-lg hover:!bg-primary-dark !transition-colors !duration-200'
        },
        backdrop: 'rgba(0, 0, 0, 0.5)'
    });
}

const steps = [
    { id: 1, title: 'Informations générales' },
    { id: 2, title: 'Comptage 1' },
    { id: 3, title: 'Comptage 2' },
    { id: 4, title: 'Comptage 3' }
];
const currentStep = ref(1);
const isLastStep = computed(() => currentStep.value === steps.length);

// Données pour le composant Steps
const stepsData = computed<Step[]>(() => {
    return steps.map((step, index) => {
        const stepNumber = index + 1;
        let state: Step['state'] = 'pending';

        if (stepNumber < currentStep.value) {
            state = 'completed';
        } else if (stepNumber === currentStep.value) {
            state = 'current';
        } else {
            state = 'available';
        }

        return {
            title: step.title,
            state: state,
            clickable: stepNumber < currentStep.value
        };
    });
});

// Gestion du clic sur une étape
function handleStepClick(stepNumber: number) {
    if (stepNumber < currentStep.value) {
        currentStep.value = stepNumber;
        wizardValidationError.value = null;
    }
}
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
                    try {
                        inventoryCreationService.validateComptage(comptage);
                    } catch (validationError) {
                        const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
                        throw new Error(errorMessage || 'Configuration du comptage invalide selon les règles métier');
                    }
                    throw new Error('Configuration du comptage invalide selon les règles métier');
                }
            } catch (error) {
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

// Fonctions utilitaires pour les labels et états des options
function getOptionLabel(opt: string): string {
    const optionLabels: Record<string, string> = {
        'dlc': 'Date limite de consommation (DLC)',
        'numeroSerie': 'Numéro de série',
        'numeroLot': 'Numéro de lot',
        'guideQuantite': 'Guide quantité',
        'guideArticle': 'Guide article',
        'isVariante': 'Gestion des variantes',
        'saisieQuantite': 'Saisie quantité',
        'scannerUnitaire': 'Scanner unitaire'
    };
    return optionLabels[opt] || opt;
}

function getOptionDisabled(step: number, opt: string): boolean {
    const comptage = state.comptages[step];
    if (comptage.mode !== 'par article') return false;

    const numeroSerieSelected = comptage.numeroSerie;
    const numeroLotSelected = comptage.numeroLot;
    const dlcSelected = comptage.dlc;

    // Désactiver lot et DLC si numéro de série est sélectionné
    if (numeroSerieSelected && (opt === 'numeroLot' || opt === 'dlc')) {
        return true;
    }

    // Désactiver numéro de série si lot ou DLC sont sélectionnés
    if (opt === 'numeroSerie' && (numeroLotSelected || dlcSelected)) {
        return true;
    }

    // Les options guideQuantite et guideArticle ne sont jamais désactivées
    if (opt === 'guideQuantite' || opt === 'guideArticle') {
        return false;
    }

    return false;
}

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

const goToPreviousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value -= 1;
    }
};

const goToNextStep = async () => {
    try {
        // validateStep attend un index 0‑based (0 = header, 1..3 = comptages)
        const isValidStep = await validateStep(currentStep.value - 1);
        if (!isValidStep) {
            return;
        }
        // Réinitialiser l'erreur de validation du wizard si tout est OK
        wizardValidationError.value = null;
        if (currentStep.value < steps.length) {
            currentStep.value += 1;
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        handleValidationError(message);
    }
};

const finishStepper = async () => {
    try {
        await handleCreateInventory();
        handleFinish();
    } catch {
        // L'erreur est déjà gérée dans handleCreateInventory
    }
};

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

        // Rediriger vers la liste des inventaires après un court délai pour laisser voir le message
        setTimeout(() => {
            router.push({ name: 'inventory-list' });
        }, 2000);

    } catch (error) {
        // Extraire le message d'erreur backend de manière cohérente
        const errorMessage = Validators.extractBackendError(error, 'Erreur lors de la création de l\'inventaire');

        // Si c'est une erreur de validation métier, elle est déjà affichée dans wizardValidationError
        if (!wizardValidationError.value) {
            // Afficher l'erreur backend dans creationError
            creationError.value = errorMessage;
        } else {
            // Si on a déjà une erreur de validation, combiner avec l'erreur backend si différente
            if (wizardValidationError.value !== errorMessage) {
                creationError.value = errorMessage;
            }
        }

        creationSuccess.value = null; // Réinitialiser le succès

        // Re-lancer l'erreur pour que le Wizard puisse la gérer
        throw error;
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

