import type { Ref } from 'vue'
import type { useInventoryStore } from '@/stores/inventory'
import type { useWarehouseStore } from '@/stores/warehouse'

export interface PlanningContextIds {
    inventoryId: Ref<number | null>
    warehouseId: Ref<number | null>
    accountId: Ref<number | null>
}

export async function resolvePlanningContextIds(
    inventoryReference: string,
    warehouseReference: string,
    inventoryStore: ReturnType<typeof useInventoryStore>,
    warehouseStore: ReturnType<typeof useWarehouseStore>,
    ids: PlanningContextIds
): Promise<void> {
    if (inventoryReference) {
        const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
        ids.inventoryId.value = inventory?.id ?? null
        ids.accountId.value = inventory?.account_id ?? null
    }

    if (warehouseReference) {
        ids.warehouseId.value = await warehouseStore.fetchWarehouseByReference(warehouseReference)
    }

    if (!ids.inventoryId.value || !ids.warehouseId.value) {
        throw new Error(
            `IDs de contexte manquants - inventaire: ${ids.inventoryId.value}, entrepôt: ${ids.warehouseId.value}`
        )
    }
}

export function formatPlanningDate(date: string | Date): string {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export function getPlanningFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toUpperCase()
    return extension ? `Fichier ${extension}` : 'Fichier inconnu'
}
