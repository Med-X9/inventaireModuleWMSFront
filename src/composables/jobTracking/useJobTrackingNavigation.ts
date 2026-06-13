import type { Router } from 'vue-router'

export function navigateToInventoryResults(
    router: Router,
    inventoryReference: string,
    warehouseReference: string
): void {
    void router.push({
        name: 'inventory-results',
        params: {
            reference: inventoryReference,
            warehouse: warehouseReference,
        },
    })
}

export function navigateToInventoryDetail(router: Router, inventoryReference: string): void {
    void router.push({
        name: 'inventory-detail',
        params: { reference: inventoryReference },
    })
}
