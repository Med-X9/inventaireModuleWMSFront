import type { Ref } from 'vue'
import Swal from 'sweetalert2'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import { InventoryResultsService } from '@/services/inventoryResultsService'
import { downloadBlob, generateExportFilename } from '@/composables/helpers/useInventoryResults.helpers'
import type { Warehouse } from '@/models/Warehouse'
import type { useWarehouseStore } from '@/stores/warehouse'

export interface ResultsExportDeps {
    inventoryId: Ref<number | null>
    inventoryReference: Ref<string>
    selectedStore: Ref<string | null>
    warehouses: Ref<Warehouse[]>
    warehousesLoading: Ref<boolean>
    warehouseStore: ReturnType<typeof useWarehouseStore>
    exportLoading: Ref<boolean>
    exportResultsLoading: Ref<boolean>
    showExportResultsModal: Ref<boolean>
    exportResultsModalMessage: Ref<string>
}

export function useResultsExport(deps: ResultsExportDeps) {
    const {
        inventoryId,
        inventoryReference,
        selectedStore,
        warehouses,
        warehousesLoading,
        warehouseStore,
        exportLoading,
        exportResultsLoading,
        showExportResultsModal,
        exportResultsModalMessage,
    } = deps

    const handleExportResultsData = async () => {
        if (!inventoryId.value || !selectedStore.value) {
            alertService.warning({ text: "ID d'inventaire ou magasin non disponible" })
            return
        }

        try {
            exportResultsLoading.value = true
            showExportResultsModal.value = true
            exportResultsModalMessage.value = "Préparation de l'export..."

            if (warehouses.value.length === 0 && !warehousesLoading.value) {
                exportResultsModalMessage.value = 'Chargement des magasins...'
                await warehouseStore.fetchWarehouses()
            }

            const warehouseId = parseInt(selectedStore.value)
            const warehouse = warehouses.value.find((w) => w.id === warehouseId)

            if (!warehouse) {
                alertService.error({ text: 'Magasin non trouvé. Veuillez réessayer.' })
                return
            }

            exportResultsModalMessage.value = 'Génération du fichier Excel...'

            const response = await InventoryResultsService.exportResultsData(
                inventoryId.value,
                warehouse.id
            )

            exportResultsModalMessage.value = 'Téléchargement du fichier...'

            const blob = response.data as Blob
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            const filename = generateExportFilename(
                'Resultats_Inventaire',
                `${inventoryReference.value || inventoryId.value}_${warehouse.reference || warehouse.id}`,
                'xlsx'
            )
            link.setAttribute('download', filename)

            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            alertService.success({ text: 'Export des données de résultats réussi' })
            logger.debug('Export des données de résultats réussi', { filename })

            setTimeout(() => {
                showExportResultsModal.value = false
            }, 1000)
        } catch (error: any) {
            logger.error("Erreur lors de l'export des données de résultats", error)
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Erreur lors de l'export des données de résultats"
            alertService.error({ text: errorMessage })
        } finally {
            exportResultsLoading.value = false
            if (showExportResultsModal.value) {
                showExportResultsModal.value = false
            }
        }
    }

    const handleExportConsolidatedArticles = async () => {
        if (!inventoryId.value) {
            await alertService.warning({ text: 'Aucun inventaire sélectionné' })
            return
        }

        exportLoading.value = true

        try {
            await Swal.fire({
                title: 'Export en cours...',
                text: 'Le fichier Excel est en cours de préparation. Veuillez patienter.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const response = await InventoryResultsService.exportConsolidatedArticles(inventoryId.value)

            if (!response.data || !(response.data instanceof Blob)) {
                throw new Error('Aucune donnée reçue du backend')
            }

            const blob = response.data as Blob
            const filename = generateExportFilename(
                'Articles_Consolides',
                String(inventoryReference.value || inventoryId.value),
                'xlsx'
            )

            downloadBlob(blob, filename)

            await Swal.close()
            await alertService.success({ text: 'Export Excel réussi' })
            logger.debug('Export des articles consolidés réussi', { filename })
        } catch (error: any) {
            logger.error("Erreur lors de l'export des articles consolidés", error)
            const errorMessage =
                error?.response?.data?.message || error?.message || "Erreur lors de l'export Excel"
            await Swal.close()
            await alertService.error({ text: errorMessage })
        } finally {
            exportLoading.value = false
        }
    }

    return {
        handleExportResultsData,
        handleExportConsolidatedArticles,
    }
}
