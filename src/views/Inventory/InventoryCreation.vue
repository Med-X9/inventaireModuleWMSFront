<template>
    <div class="inventory-creation min-h-screen w-full bg-app dark:bg-bg-dark">
        <Container max-width="7xl" class="py-6">
            <Card class="mb-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Création d'inventaire
                        </h1>
                        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Renseignez les informations générales. La configuration des comptages se fera ensuite.
                        </p>
                    </div>
                    <Button
                        @click="resetForm"
                        variant="secondary"
                        size="sm"
                        class="flex items-center gap-2"
                    >
                        Réinitialiser
                    </Button>
                </div>
            </Card>

            <div class="space-y-6">
                <InventoryCreationRecap :header="state.header" />

                <Alert
                    v-if="creationError"
                    type="error"
                    title="Erreur lors de la création"
                    :message="creationError"
                    :dismissible="true"
                    @dismiss="creationError = null"
                    class="mb-0"
                />

                <Alert
                    v-if="creationSuccess"
                    type="success"
                    title="Inventaire créé avec succès !"
                    :message="creationSuccess"
                    :dismissible="true"
                    @dismiss="creationSuccess = null"
                />

                <Card>
                    <div class="p-6">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Informations générales
                        </h2>

                        <Form>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormGroup>
                                    <FormLabel>Libellé <span class="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <Input
                                        v-model="state.header.libelle"
                                        type="text"
                                        placeholder="Entrez le libellé"
                                    />
                                    <FormError v-if="showValidation && !state.header.libelle">
                                        Le libellé est requis
                                    </FormError>
                                </FormGroup>

                                <FormGroup>
                                    <FormLabel>Date <span class="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <Input
                                        v-model="state.header.date"
                                        type="date"
                                        :error="showValidation && !state.header.date ? 'La date est requise' : undefined"
                                    />
                                    <FormError v-if="showValidation && !state.header.date">
                                        La date est requise
                                    </FormError>
                                </FormGroup>

                                <FormGroup>
                                    <FormLabel>Type <span class="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <Autocomplete
                                        :options="typeOptions"
                                        v-model="state.header.inventory_type"
                                        placeholder="Sélectionnez un type"
                                        :error="showValidation && !state.header.inventory_type ? 'Le type est requis' : undefined"
                                    />
                                    <FormError v-if="showValidation && !state.header.inventory_type">
                                        Le type est requis
                                    </FormError>
                                </FormGroup>

                                <FormGroup>
                                    <FormLabel>Compte <span class="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <Autocomplete
                                        :options="accountOptions as AutocompleteOption[]"
                                        v-model="state.header.compte"
                                        placeholder="Sélectionnez un compte"
                                        :error="showValidation && !state.header.compte ? 'Le compte est requis' : undefined"
                                    />
                                    <FormError v-if="showValidation && !state.header.compte">
                                        Le compte est requis
                                    </FormError>
                                </FormGroup>
                            </div>

                            <FormGroup class="mt-4">
                                <FormLabel>Magasin <span class="text-red-500 dark:text-red-400">*</span></FormLabel>
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
                                            (state.header.magasin as any) = val
                                        }
                                    }"
                                />
                                <FormError v-if="showValidation && (!state.header.magasin || state.header.magasin.length === 0)">
                                    Au moins un magasin est requis
                                </FormError>
                            </FormGroup>
                        </Form>
                    </div>

                    <div class="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-end gap-3">
                        <Button
                            variant="secondary"
                            :disabled="isSubmitting"
                            @click="router.push({ name: 'inventory-list' })"
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="primary"
                            :disabled="isSubmitting"
                            @click="handleCreateInventory"
                        >
                            {{ isSubmitting ? 'Création...' : 'Créer l\'inventaire' }}
                        </Button>
                    </div>
                </Card>
            </div>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryCreation } from '@/composables/useInventoryCreation'
import { useAccount } from '@/composables/useAccount'
import { Validators } from '@/utils/validators'
import InventoryCreationRecap from './InventoryCreationRecap.vue'
import MultiSelectWithDates from '@/components/Form/fields/MultiSelectWithDates.vue'
import {
    Form,
    FormGroup,
    FormLabel,
    FormError,
    Button,
    Input,
    Autocomplete,
    Card,
    Alert,
    Container,
} from '@SMATCH-Digital-dev/vue-system-design'
import type { AutocompleteOption } from '@SMATCH-Digital-dev/vue-system-design'

const router = useRouter()
const { state, createInventory, resetForm, accountOptions, warehouseOptions } = useInventoryCreation()
const { fetchAccounts } = useAccount()

const showValidation = ref(false)
const creationError = ref<string | null>(null)
const creationSuccess = ref<string | null>(null)
const isSubmitting = ref(false)

const typeOptions: AutocompleteOption[] = [
    { label: 'Général', value: 'GENERAL' },
    { label: 'Tournant', value: 'TOURNANT' },
    { label: 'Magasin', value: 'MAGASIN' },
]

onMounted(() => {
    fetchAccounts()
})

async function handleCreateInventory() {
    showValidation.value = true
    creationError.value = null
    creationSuccess.value = null

    const headerErrors = Validators.validateHeader(state.header)
    if (headerErrors.length > 0) {
        creationError.value = headerErrors.join(' | ')
        return
    }

    isSubmitting.value = true
    try {
        const result = await createInventory()
        const reference = (result as { reference?: string } | undefined)?.reference

        creationSuccess.value = `L'inventaire "${state.header.libelle}" a été créé. Configurez maintenant les comptages.`

        if (reference) {
            await router.push({ name: 'inventory-configure', params: { reference } })
        } else {
            await router.push({ name: 'inventory-list' })
        }
    } catch (error) {
        creationError.value = Validators.extractBackendError(
            error,
            'Erreur lors de la création de l\'inventaire'
        )
    } finally {
        isSubmitting.value = false
    }
}
</script>
