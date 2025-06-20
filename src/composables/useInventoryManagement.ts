import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { InventoryManagement, InventoryAction } from '../interfaces/inventoryManagement'
import type { DataTableColumn } from '@/interfaces/dataTable'
import { inventoryManagementService } from '../services/inventoryManagementService'
import { alertService } from '@/services/alertService'

import IconEdit          from '@/components/icon/icon-edit.vue'
import IconTrashLines    from '@/components/icon/icon-trash-lines.vue'
import IconEye           from '@/components/icon/icon-eye.vue'
import IconCalendar      from '@/components/icon/icon-calendar.vue'
import IconSquareCheck   from '@/components/icon/icon-square-check.vue'

export function useInventoryManagement() {
  const router = useRouter()
  const inventories = ref<InventoryManagement[]>([])
  const loading     = ref(false)

  const columns: DataTableColumn[] = [
    { headerName: 'Référence',      field: 'reference',     sortable: true, filter: 'agTextColumnFilter', description: 'Référence unique', editable: false  },
    { headerName: 'Libellé',         field: 'label',         sortable: true, filter: 'agTextColumnFilter', description: 'Libellé', editable: false  },
    { headerName: 'Type',            field: 'type',          sortable: true, filter: 'agTextColumnFilter', description: 'Type', editable: true  },
    {
      headerName: 'Statut',
      field: 'statut',
      sortable: true,
      filter: 'agTextColumnFilter',
      description: 'État',
      cellRenderer: params => {
        const val = (params.value || '').toString()
        const s   = val.toLowerCase()
        let cls   = ''
        switch (s) {
          case 'en préparation': cls = 'bg-warning-light text-warning'; break
          case 'en réalisation': cls = 'bg-info-light text-info';       break
          case 'terminé':        cls = 'bg-success-light text-success'; break
          case 'clôturé':        cls = 'bg-secondary-light text-secondary'; break
          default:               cls = 'bg-secondary-light text-secondary'
        }
        return `<span class="${cls} px-3 py-1 rounded-full">${val}</span>`
      }
    },
    { headerName: "Inventory_date",      field: 'inventory_date', sortable: true, filter: 'agDateColumnFilter', description: 'Inventory_date' },
    { headerName: 'Date_creation',       field: 'date_creation',  sortable: true, filter: 'agDateColumnFilter', description: 'Date_creation' },
    { headerName: 'Date_lancement',      field: 'date_lancement', sortable: true, filter: 'agDateColumnFilter', description: 'Date_lancement' },
    { headerName: "Date de fin",         field: 'date_echeance',  sortable: true, filter: 'agDateColumnFilter', description: 'Date de fin' },
    { headerName: 'Date_cloture',        field: 'date_cloture',   sortable: true, filter: 'agDateColumnFilter', description: 'Date_cloture' },
  ]

  const fetchInventories = async () => {
    loading.value = true
    try {
      inventories.value = await inventoryManagementService.getInventories()
    } catch {
      await alertService.error({ text: "Erreur lors du chargement" })
    } finally {
      loading.value = false
    }
  }

  const handleDelete = async (inv: InventoryManagement) => {
    try {
      const r = await alertService.confirm({
        title: 'Confirmation',
        text: 'Supprimer cet inventaire ?'
      })
      if (r.isConfirmed) {
        await inventoryManagementService.deleteInventory(inv.id)
        await alertService.success({ text: "Supprimé avec succès" })
        await fetchInventories()
      }
    } catch {
      await alertService.error({ text: "Erreur lors de la suppression" })
    }
  }

  const actions: InventoryAction[] = [
    {
      label: 'Détail',
      icon: IconEye,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: inv => { void router.push({ name: 'inventory-detail', params: { id: inv.id } }) },
      showWhen: () => true,
    },
    {
      label: 'Importer stock',
      icon: IconSquareCheck,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: inv => { void router.push({ name: 'stock-import', params: { id: inv.id } }) },
      showWhen: inv => inv.statut === 'En préparation',
    },
    {
      label: inv => inv.statut === 'En réalisation' ? 'Transférer' : 'Préparer',
      icon: IconCalendar,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: inv => { void router.push({ name: 'planning-management', params: { id: inv.id } }) },
      showWhen: inv => ['En préparation', 'En réalisation'].includes(inv.statut),
    },
    {
      label: 'Modifier',
      icon: IconEdit,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: inv => { void router.push({ name: 'inventory-edit', params: { id: inv.id } }) },
      showWhen: inv => inv.statut === 'En préparation',
    },
    {
      label: 'Résultats',
      icon: IconSquareCheck,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: inv => { void router.push({ name: 'inventory-results', params: { reference: inv.reference } }) },
      showWhen: inv => ['En réalisation', 'Terminé', 'Clôturé'].includes(inv.statut),
    },
    {
      label: 'Supprimer',
      icon: IconTrashLines,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: handleDelete,
      showWhen: inv => inv.statut === 'En préparation',
    },
  ]

  const redirectToAdd = () => { void router.push({ name: 'inventory-create' }) }

  return {
    inventories,
    loading,
    columns,
    actions,
    redirectToAdd,
    fetchInventories,
  }
}