import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ComptageConfig, ComptageMode } from '@/interfaces/inventoryCreation'
import type { InventoryDetails } from '@/models/Inventory'
import { inventoryCreationService } from '@/services/inventoryCreationService'
import { useInventoryStore } from '@/stores/inventory'
import { Validators } from '@/utils/validators'
import { logger } from '@/services/loggerService'
import { alertService } from '@/services/alertService'

const OPTION_LABELS: Record<string, string> = {
    dlc: 'Date limite de consommation (DLC)',
    numeroSerie: 'Numéro de série',
    numeroLot: 'Numéro de lot',
    guideQuantite: 'Guide quantité',
    guideArticle: 'Guide article',
    isVariante: 'Gestion des variantes',
    saisieQuantite: 'Saisie quantité',
    scannerUnitaire: 'Scanner unitaire',
}

const ALLOWED_MODE_COMBINATIONS: ReadonlyArray<Readonly<[ComptageMode, ComptageMode, ComptageMode]>> = [
    ['image de stock', 'par article', 'par article'],
    ['image de stock', 'en vrac', 'en vrac'],
    ['par article', 'par article', 'par article'],
    ['en vrac', 'en vrac', 'en vrac'],
] as const

const emptyComptage = (): ComptageConfig => ({ mode: '' })

export function useInventoryConfiguration(reference: string) {
    const router = useRouter()
    const inventoryStore = useInventoryStore()

    const inventory = ref<InventoryDetails | null>(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const currentStep = ref(1)
    const showValidation = ref(false)

    const comptages = reactive<ComptageConfig[]>([
        emptyComptage(),
        emptyComptage(),
        emptyComptage(),
    ])

    const inventoryType = computed(() => inventory.value?.inventory_type?.toUpperCase() || '')
    const isGeneral = computed(() => inventoryType.value === 'GENERAL')
    const isSingleCounting = computed(() =>
        ['TOURNANT', 'MAGASIN'].includes(inventoryType.value)
    )

    const totalSteps = computed(() => (isGeneral.value ? 3 : 1))
    const isLastStep = computed(() => currentStep.value >= totalSteps.value)

    const availableModesForStep = (stepIndex: number): ComptageMode[] => {
        if (isSingleCounting.value) {
            return ['en vrac', 'par article']
        }
        return inventoryCreationService.getAvailableModesForStep(
            { header: {}, comptages },
            stepIndex
        )
    }

    const getOptions = (stepIndex: number): string[] => {
        const mode = comptages[stepIndex]?.mode as ComptageMode
        if (!mode) return []
        return inventoryCreationService.getOptionsForMode(mode)
    }

    const getOptionLabel = (opt: string): string => OPTION_LABELS[opt] || opt

    const getOptionDisabled = (stepIndex: number, opt: string): boolean => {
        const comptage = comptages[stepIndex]
        if (!comptage || comptage.mode !== 'par article') return false

        if (comptage.numeroSerie && (opt === 'numeroLot' || opt === 'dlc')) return true
        if (opt === 'numeroSerie' && (comptage.numeroLot || comptage.dlc)) return true
        return false
    }

    const resetComptageOptions = (comptage: ComptageConfig) => {
        comptage.inputMethod = ''
        comptage.saisieQuantite = false
        comptage.scannerUnitaire = false
        comptage.dlc = false
        comptage.numeroSerie = false
        comptage.numeroLot = false
        comptage.guideQuantite = false
        comptage.guideArticle = false
        comptage.isVariante = false
        comptage.stock_situation = false
    }

    const setMode = (stepIndex: number, mode: ComptageMode | '') => {
        const comptage = comptages[stepIndex]
        if (!comptage) return
        resetComptageOptions(comptage)
        comptage.mode = mode

        if (isGeneral.value && stepIndex === 1 && comptages[0]?.mode === 'image de stock') {
            Object.assign(comptages[2], JSON.parse(JSON.stringify(comptages[1])))
        }
    }

    const buildCountPayload = (comptage: ComptageConfig, order?: number) => {
        if (comptage.mode === 'en vrac') {
            comptage.saisieQuantite = comptage.inputMethod === 'saisie'
            comptage.scannerUnitaire = comptage.inputMethod === 'scanner'
        }

        const base: Record<string, unknown> = {
            count_mode: comptage.mode,
            n_lot: !!comptage.numeroLot,
            n_serie: !!comptage.numeroSerie,
            dlc: !!comptage.dlc,
            show_product: !!comptage.guideArticle,
            quantity_show: !!comptage.guideQuantite,
            unit_scanned: !!comptage.scannerUnitaire,
            entry_quantity: !!comptage.saisieQuantite,
            is_variant: !!comptage.isVariante,
            stock_situation: false,
        }

        if (comptage.mode === 'image de stock') {
            base.stock_situation = true
            base.quantity_show = false
            base.show_product = false
            base.unit_scanned = false
            base.entry_quantity = false
            base.is_variant = false
            base.n_lot = false
            base.n_serie = false
            base.dlc = false
        } else if (comptage.mode === 'en vrac') {
            base.show_product = false
            base.has_article = false
            base.has_quantity = true
            base.stock_situation = !!comptage.guideQuantite
        } else if (comptage.mode === 'par article') {
            base.stock_situation = false
            base.has_article = true
            base.has_quantity = true
        }

        if (order !== undefined) {
            base.order = order
        }

        return base
    }

    const validateCurrentStep = (): boolean => {
        const index = currentStep.value - 1
        const comptage = comptages[index]
        if (!comptage?.mode) return false

        if (comptage.mode === 'en vrac' && !comptage.inputMethod) return false

        try {
            inventoryCreationService.validateComptage(comptage)
            return true
        } catch {
            return false
        }
    }

    const validateAll = (): string[] => {
        const errors: string[] = []

        if (isSingleCounting.value) {
            if (!comptages[0]?.mode) {
                errors.push('Le mode de comptage est requis')
            } else if (comptages[0].mode === 'en vrac' && !comptages[0].inputMethod) {
                errors.push('La méthode opératoire est requise')
            } else {
                try {
                    inventoryCreationService.validateComptage(comptages[0])
                } catch (e) {
                    errors.push(e instanceof Error ? e.message : 'Configuration invalide')
                }
            }
            return errors
        }

        const modes = comptages.slice(0, 3).map((c) => c.mode as ComptageMode)
        if (modes.some((m) => !m)) {
            errors.push('Les 3 comptages doivent être configurés')
            return errors
        }

        const isAllowed = ALLOWED_MODE_COMBINATIONS.some(
            ([a, b, c]) => a === modes[0] && b === modes[1] && c === modes[2]
        )
        if (!isAllowed) {
            errors.push('Combinaison de modes invalide pour un inventaire GENERAL')
            return errors
        }

        if (modes[0] === 'image de stock') {
            const second = JSON.stringify(comptages[1])
            const third = JSON.stringify(comptages[2])
            if (second !== third) {
                errors.push(
                    'Lorsque le 1er comptage est "image de stock", les 2e et 3e doivent être identiques'
                )
            }
        }

        comptages.slice(0, 3).forEach((c, i) => {
            if (c.mode === 'en vrac' && !c.inputMethod) {
                errors.push(`Comptage ${i + 1} : méthode opératoire requise`)
            }
            try {
                inventoryCreationService.validateComptage(c)
            } catch (e) {
                errors.push(
                    `Comptage ${i + 1} : ${e instanceof Error ? e.message : 'Configuration invalide'}`
                )
            }
        })

        return errors
    }

    const goToNextStep = () => {
        showValidation.value = true
        if (!validateCurrentStep()) return
        showValidation.value = false
        if (currentStep.value < totalSteps.value) {
            currentStep.value += 1
        }
    }

    const goToPreviousStep = () => {
        showValidation.value = false
        if (currentStep.value > 1) {
            currentStep.value -= 1
        }
    }

    const loadInventory = async () => {
        loading.value = true
        error.value = null
        try {
            const data = await inventoryStore.fetchInventoryByReference(reference)
            if (!data) {
                throw new Error('Inventaire introuvable')
            }
            inventory.value = data

            if (data.status !== 'EN CONFIGURATION') {
                await alertService.warning({
                    title: 'Configuration indisponible',
                    text: `Cet inventaire est en statut "${data.status}" et ne peut plus être configuré.`,
                })
                await router.push({
                    name: 'inventory-detail',
                    params: { reference },
                })
            }
        } catch (err) {
            error.value = Validators.extractBackendError(err, 'Erreur lors du chargement')
            logger.error('Erreur chargement inventaire pour configuration', err)
        } finally {
            loading.value = false
        }
    }

    const submitConfiguration = async () => {
        showValidation.value = true
        const validationErrors = validateAll()
        if (validationErrors.length > 0) {
            error.value = validationErrors[0] ?? 'Configuration invalide'
            return false
        }

        if (!inventory.value?.id) return false

        saving.value = true
        error.value = null
        try {
            let payload: Record<string, unknown>

            if (isGeneral.value) {
                payload = {
                    comptages: comptages.slice(0, 3).map((c, i) => buildCountPayload(c, i + 1)),
                }
            } else {
                payload = buildCountPayload(comptages[0])
            }

            await inventoryStore.configureCountings(inventory.value.id, payload)

            await alertService.success({
                title: 'Configuration enregistrée',
                text: 'L\'inventaire est maintenant en préparation.',
            })

            await router.push({
                name: 'inventory-detail',
                params: { reference },
            })
            return true
        } catch (err) {
            error.value = Validators.extractBackendError(
                err,
                'Erreur lors de la configuration des comptages'
            )
            return false
        } finally {
            saving.value = false
        }
    }

    return {
        inventory,
        loading,
        saving,
        error,
        currentStep,
        showValidation,
        comptages,
        inventoryType,
        isGeneral,
        isSingleCounting,
        totalSteps,
        isLastStep,
        availableModesForStep,
        getOptions,
        getOptionLabel,
        getOptionDisabled,
        setMode,
        goToNextStep,
        goToPreviousStep,
        loadInventory,
        submitConfiguration,
        validateCurrentStep,
    }
}
