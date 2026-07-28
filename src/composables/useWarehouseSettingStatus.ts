/**
 * Composable — Statut Setting magasin
 * GET /web/api/inventory/{id}/warehouse/{wid}/setting-status/
 *
 * Remplace le conditionnement sur le statut inventaire (EN PREPARATION / EN REALISATION)
 * pour les boutons Planning / Affecter.
 *
 * Mapping :
 * - EN ATTENTE  → mode préparation (édition planning, affectation, prêt…)
 * - LANCEE      → mode réalisation (transfert, validation, clôture…)
 * - TERMINEE | ANALYSER | CLOTURE → actions métier désactivées
 *
 * @module useWarehouseSettingStatus
 */

import { ref, computed, type Ref } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { logger } from '@/services/loggerService'
import type {
    WarehouseSettingStatusData,
    WarehouseSettingStatusValue,
} from '@/models/InventoryDetail'

export function useWarehouseSettingStatus(
    inventoryId: Ref<number | null>,
    warehouseId: Ref<number | null>
) {
    const inventoryStore = useInventoryStore()

    const settingStatusData = ref<WarehouseSettingStatusData | null>(null)
    const settingStatusLoading = ref(false)
    const settingStatusError = ref<string | null>(null)

    const settingStatus = computed((): WarehouseSettingStatusValue | string => {
        const raw = settingStatusData.value?.status
        return raw ? String(raw).toUpperCase() : ''
    })

    /** Équivalent historique de inventoryStatus === 'EN PREPARATION' */
    const isSettingEnAttente = computed(() => settingStatus.value === 'EN ATTENTE')

    /** Équivalent historique de inventoryStatus === 'EN REALISATION' */
    const isSettingLancee = computed(() => settingStatus.value === 'LANCEE')

    /** Planning / Affecter éditables uniquement en EN ATTENTE */
    const canEditPlanning = computed(() => isSettingEnAttente.value)

    const fetchSettingStatus = async () => {
        const invId = inventoryId.value
        const whId = warehouseId.value
        if (!invId || !whId) {
            settingStatusData.value = null
            settingStatusError.value = 'Contexte inventaire / magasin manquant'
            return null
        }

        settingStatusLoading.value = true
        settingStatusError.value = null
        try {
            const response = await inventoryStore.getWarehouseSettingStatus(invId, whId)
            settingStatusData.value = response.data ?? null
            return settingStatusData.value
        } catch (err: unknown) {
            settingStatusData.value = null
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || (err instanceof Error ? err.message : 'Impossible de récupérer le statut Setting')
            settingStatusError.value = msg
            logger.warn('Statut Setting magasin indisponible', err)
            return null
        } finally {
            settingStatusLoading.value = false
        }
    }

    return {
        settingStatusData,
        settingStatus,
        settingStatusLoading,
        settingStatusError,
        isSettingEnAttente,
        isSettingLancee,
        canEditPlanning,
        fetchSettingStatus,
    }
}
