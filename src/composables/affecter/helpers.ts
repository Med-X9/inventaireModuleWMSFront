import type { InventoryDetails } from '@/models/Inventory'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'

export async function fetchInventoryIdByReference(
    reference: string,
    inventoryStore: ReturnType<typeof useInventoryStore>,
    options?: {
        onInventoryResolved?: (inventory: InventoryDetails | null) => void
    }
): Promise<number | null> {
    try {
        const inventory = await inventoryStore.fetchInventoryByReference(reference)
        options?.onInventoryResolved?.(inventory ?? null)
        return inventory?.id || null
    } catch {
        return null
    }
}

export async function fetchWarehouseIdByReference(
    reference: string,
    warehouseStore: ReturnType<typeof useWarehouseStore>
): Promise<number | null> {
    try {
        const warehouseId = await warehouseStore.fetchWarehouseByReference(reference)
        return warehouseId || null
    } catch {
        return null
    }
}

export function dateValueParser(params: any): string {
    if (!params.newValue) return ''

    const newVal = params.newValue
    if (
        newVal !== null
        && typeof newVal === 'object'
        && Object.prototype.toString.call(newVal) === '[object Date]'
    ) {
        return (newVal as Date).toISOString().split('T')[0]
    }

    if (typeof params.newValue === 'string') {
        if (params.newValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return params.newValue
        }

        try {
            const date = new Date(params.newValue)
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
        } catch {
            return ''
        }
    }

    return ''
}

export function dateValueSetter(params: any): boolean {
    const rowData = params.data || (params.node && params.node.data) || params.value || {}
    if (!rowData || rowData.isChild) return false

    const parsedValue = dateValueParser(params)
    const field = params.colDef.field!
    const oldValue = rowData[field]

    if (parsedValue !== oldValue) {
        rowData[field] = parsedValue
        return true
    }

    return false
}
