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
import IconUpload        from '@/components/icon/icon-upload.vue'

export function useInventoryManagement() {
  const router = useRouter()
  const inventories = ref<InventoryManagement[]>([])
  const loading     = ref(false)

  const columns: DataTableColumn[] = [
    { headerName: 'Référence',      field: 'reference',     sortable: true, filter: 'agTextColumnFilter', description: 'Référence unique'  },
    { headerName: 'Libellé',         field: 'label',         sortable: true, filter: 'agTextColumnFilter', description: 'Libellé' },
    { headerName: 'Type',            field: 'type',          sortable: true, filter: 'agTextColumnFilter', description: 'Type' },
    {
      headerName: 'Statut',
      field: 'statut',
      sortable: true,
      filter: 'agTextColumnFilter',
      minWidth: 150,
      description: 'État',
      cellRenderer: params => {
        const val = (params.value || '').toString()
        const s   = val.toLowerCase()
        let cls   = ''
        let textCls = ''
        
        switch (s) {
          case 'en préparation': 
            cls = 'bg-gradient-to-r from-amber-50 to-primary/20'
            textCls = 'text-amber-800 font-medium'
            break
          case 'en réalisation': 
            cls = 'bg-gradient-to-r from-blue-50 to-info/20 '
            textCls = 'text-blue-800 font-medium'
            break
          case 'terminé': 
            cls = 'bg-gradient-to-r from-emerald-50 to-success/20'
            textCls = 'text-emerald-800 font-medium'
            break
          case 'clôturé': 
            cls = 'bg-gradient-to-r from-slate-50 to-gray-200'
            textCls = 'text-slate-700 font-medium'
            break
          default: 
            cls = 'bg-gradient-to-r from-gray-50 to-slate-50'
            textCls = 'text-gray-700 font-medium'
        }
        
        return `<span class="${cls} ${textCls} px-3 py-1.5 rounded-full text-xs shadow-sm inline-flex items-center">${val}</span>`
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
      class: 'flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 text-md',
      handler: inv => { void router.push({ name: 'inventory-detail', params: { id: inv.id } }) },
      showWhen: () => true,
    },
    {
      label: 'Importer stock',
      icon: IconUpload,
      class: 'flex items-center gap-1 px-2 py-1 text-purple-600 hover:text-purple-800 text-md',
      handler: inv => { void router.push({ name: 'stock-import', params: { id: inv.id } }) },
      showWhen: inv => inv.statut === 'En préparation',
    },
    {
      label: inv => inv.statut === 'En réalisation' ? 'Transférer' : 'Préparer',
      icon: IconCalendar,
      class: 'flex items-center gap-1 px-2 py-1 text-orange-600 hover:text-orange-800 text-md',
      handler: inv => { void router.push({ name: 'planning-management', params: { id: inv.id } }) },
      showWhen: inv => ['En préparation', 'En réalisation'].includes(inv.statut),
    },
    {
      label: 'Modifier',
      icon: IconEdit,
      class: 'flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-800 text-md',
      handler: inv => { void router.push({ name: 'inventory-edit', params: { id: inv.id } }) },
      showWhen: inv => inv.statut === 'En préparation',
    },
    {
      label: 'Résultats',
      icon: IconSquareCheck,
      class: 'flex items-center gap-1 px-2 py-1 text-emerald-600 hover:text-emerald-800 text-md',
      handler: inv => { void router.push({ name: 'inventory-results', params: { reference: inv.reference } }) },
      showWhen: inv => ['En réalisation', 'Terminé', 'Clôturé'].includes(inv.statut),
    },
    {
      label: 'Supprimer',
      icon: IconTrashLines,
      class: 'flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 text-md',
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