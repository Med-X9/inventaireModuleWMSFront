<template>
  <div class="container mx-auto">
    <!-- Navigation Links -->
    <div class="mb-3">
      <PageNavigationLinks
        :inventoryId="currentInventoryId"
        :actions="['detail', 'planning', 'edit']"
      />
    </div>

    <!-- DataTable avec gestion des détails intégrée -->
    <div class="panel datatable">
      <DataTable
        :columns="columns"
        :rowDataProp="rows"
        :actions="rowActions"
        :pagination="true"
        :enableFiltering="true"
        :rowSelection="true"
        :showDetails="true"
        inlineEditing
        @selection-changed="onSelectionChanged"
        @row-clicked="onRowClicked"
        @cell-value-changed="onCellValueChanged"
        storageKey="affecter_table"
      >
        <template #table-actions>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 w-full">
            <div class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 w-full">
              <!-- Dropdown pour les affectations -->
              <div class="relative flex-shrink-0" ref="assignmentDropdownRef">
                <button
                  @click="toggleAssignmentDropdown"
                  :disabled="isLoading"
                  class="flex items-center justify-between w-full sm:w-auto p-2.5 btn btn-outline-primary btn-sm min-w-fit disabled:opacity-50"
                >
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.025m13.5-8.5a2.121 2.121 0 00-3-3L7 9l2.025 2.025M13.5 21V9l-6-6" />
                    </svg>
                    <span class="whitespace-nowrap">Affecter</span>
                  </span>
                  <svg
                    class="w-4 h-4 ml-2 transition-transform flex-shrink-0"
                    :class="{ 'rotate-180': showAssignmentDropdown }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  v-if="showAssignmentDropdown"
                  class="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-72 max-w-xs sm:max-w-none dark:bg-dark-bg dark:border-dark-border dark:text-white-dark bg-white border rounded shadow-lg z-50 p-2"
                  @click.stop
                >
                  <button
                    @click="handleAffecterPremierComptageClick"
                    class="flex items-center gap-3 w-full text-sm px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-light/10 rounded text-left transition-colors"
                  >
                    <div class="w-8 h-8 bg-warning-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-warning text-xs font-semibold">1</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-medium text-gray-900 dark:text-white">Premier Comptage</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">Affecter au premier comptage</div>
                    </div>
                  </button>

                  <button
                    @click="handleAffecterDeuxiemeComptageClick"
                    class="flex items-center gap-3 w-full text-sm px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-light/10 rounded text-left transition-colors"
                  >
                    <div class="w-8 h-8 bg-info-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-info text-xs font-semibold">2</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-medium text-gray-900 dark:text-white">Deuxième Comptage</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">Affecter au deuxième comptage</div>
                    </div>
                  </button>

                  <button
                    @click="handleActionRessourceClick"
                    class="flex items-center gap-3 w-full text-sm px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-light/10 rounded text-left transition-colors"
                  >
                    <div class="w-8 h-8 bg-success-light rounded-full flex items-center justify-center flex-shrink-0">
                      <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-medium text-gray-900 dark:text-white">Ressources</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">Affecter des ressources</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Conteneur pour les boutons d'action -->
              <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <!-- Bouton Transférer -->
                <button
                  @click="handleTransfererClick"
                  :disabled="isLoading"
                  class="btn px-4 sm:px-6 py-2.5 btn-primary btn-sm flex items-center justify-center whitespace-nowrap min-w-fit disabled:opacity-50"
                >
                  <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Transférer</span>
                </button>

                <!-- Bouton Valider -->
                <button
                  @click="handleValiderClick"
                  :disabled="isLoading"
                  class="btn px-4 sm:px-6 py-2.5 btn-primary btn-sm flex items-center justify-center whitespace-nowrap min-w-fit disabled:opacity-50"
                >
                  <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Valider</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Modal d'affectation d'équipe -->
    <Modal v-model="showTeamModal" :title="modalTitle" size="md">
      <div class="p-4">
        <!-- Formulaire -->
        <FormBuilder
          v-model="teamForm"
          :fields="teamFields"
          @submit="handleTeamSubmit"
          :submitLabel="isSubmitting ? 'Réaffectation en cours...' : 'Réaffecter'"
          :disabled="isSubmitting"
        />
      </div>
    </Modal>

    <!-- Modal d'affectation de ressources -->
    <Modal v-model="showResourceModal" title="Réaffecter Ressources" size="md">
      <div class="p-4">
        <FormBuilder
          v-model="resourceForm"
          :fields="resourceFields"
          @submit="handleResourceSubmit"
          :submitLabel="isSubmitting ? 'Réaffectation en cours...' : 'Réaffecter'"
          :columns="1"
          :disabled="isSubmitting"
        />
      </div>
    </Modal>

    <!-- Modal de transfert -->
    <Modal v-model="showTransferModal" title="Transférer Jobs" size="md">
      <div class="p-4">
        <FormBuilder
          v-model="transferForm"
          :fields="transferFields"
          @submit="handleTransferSubmit"
          :submitLabel="isSubmitting ? 'Transfert en cours...' : 'Transférer'"
          :columns="1"
          :disabled="isSubmitting"
        />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable/DataTable.vue'
import Modal from '@/components/Modal.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'
import PageNavigationLinks from '@/components/PageNavigationLinks.vue'
import type { CellValueChangedEvent, ValueGetterParams, ValueParserParams, ValueSetterParams, RowClickedEvent } from 'ag-grid-community'
import type { ActionConfig, TableRow, DataTableColumn } from '@/interfaces/dataTable'
import type { FieldConfig } from '@/interfaces/form'
import { useAffecter } from '@/composables/useAffecter'
import { alertService } from '@/services/alertService'

const route = useRoute()

// Fonction utilitaire pour récupérer l'ID d'inventaire
const currentInventoryId = computed<string>(() => {
  const fromParam = route.params.id
  const fromQuery = route.query.inventoryId
  const raw = typeof fromParam === 'string'
    ? fromParam
    : typeof fromQuery === 'string'
      ? fromQuery
      : '1'
  return raw.trim() || '1'
})

// Utilisation du composable
const {
  isLoading,
  error,
  rows,
  affecterAuPremierComptage,
  affecterAuDeuxiemeComptage,
  affecterRessources,
  validerJobs,
  transfererJobs,
  updateJobField,
  addResourceToJob,
  removeResourceFromJob,
  hasResource,
  getResourcesDisplay,
  getResourcesList,
  teamOptions,
  resourceOptions
} = useAffecter()

// Fonctions utilitaires pour les dates
const dateValueGetter = (params: ValueGetterParams) => {
  if (!params.data || params.data.isChild) return ''
  const dateStr = params.data[params.colDef.field!]
  if (!dateStr) return ''
  
  if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr
  }
  
  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

const dateValueParser = (params: ValueParserParams) => {
  if (!params.newValue) return ''
  
  const newVal = params.newValue
  if (newVal !== null && typeof newVal === 'object' && Object.prototype.toString.call(newVal) === '[object Date]') {
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

const dateValueSetter = (params: ValueSetterParams) => {
  if (!params.data || params.data.isChild) return false
  
  const parsedValue = dateValueParser(params)
  const field = params.colDef.field!
  const oldValue = params.data[field]
  
  if (parsedValue !== oldValue) {
    params.data[field] = parsedValue
    return true
  }
  return false
}

// Définition des colonnes
const columns: DataTableColumn[] = [
  {
    headerName: 'Job',
    field: 'job',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 2,
    editable: false,
    detailConfig: {
      key: 'locations',
      displayField: 'job',
      countSuffix: 'emplacements',
      columns: [{
        field: 'job',
        valueKey: '',
        formatter: (value) => `${value}`
      }]
    }
  },
  {
    headerName: 'Statut',
    field: 'status',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1,
    editable: false,
    cellRenderer: (params) => {
      if (!params.data || params.data.isChild) return ''
      
      const status = params.value
      let badgeClass = ''
      let statusText = ''
      
      switch (status) {
        case 'planifier':
          badgeClass = 'bg-warning-light text-warning'
          statusText = 'Planifier'
          break
        case 'affecter':
          badgeClass = 'bg-info-light text-info'
          statusText = 'Affecter'
          break
        case 'valider':
          badgeClass = 'bg-success-light text-success'
          statusText = 'Valider'
          break
        case 'transfere':
          badgeClass = 'bg-purple-100 text-purple-800'
          statusText = 'Transféré'
          break
        default:
          badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
          statusText = 'Inconnu'
      }
      
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">${statusText}</span>`
    }
  },
  {
    headerName: 'Équipe Premier Comptage',
    field: 'team1',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1.2,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['', ...teamOptions.map((option) => option.value)]
    },
    cellRenderer: (params) => {
      if (!params.data) return ''
      if (params.data.isChild) return ''
      return params.value || '<span class="text-gray-400">Non assigné</span>'
    }
  },
  {
    headerName: 'Date Premier Comptage',
    field: 'date1',
    sortable: true,
    filter: 'agDateColumnFilter',
    flex: 1,
    cellEditor: 'agDateCellEditor',
    cellEditorParams: {
      useFormatter: true
    },
    valueGetter: dateValueGetter,
    valueParser: dateValueParser,
    valueSetter: dateValueSetter,
    cellRenderer: (params) => {
      if (!params.data || params.data.isChild) return ''
      if (!params.value) return '<span class="text-gray-400">Non définie</span>'
      try {
        const date = new Date(params.value as string)
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR')
      } catch {
        return ''
      }
    }
  },
  {
    headerName: 'Équipe Deuxième Comptage',
    field: 'team2',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1.2,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['', ...teamOptions.map((option) => option.value)]
    },
    cellRenderer: (params) => {
      if (!params.data) return ''
      if (params.data.isChild) return ''
      return params.value || '<span class="text-gray-400">Non assigné</span>'
    }
  },
  {
    headerName: 'Date Deuxième Comptage',
    field: 'date2',
    sortable: true,
    filter: 'agDateColumnFilter',
    flex: 1,
    cellEditor: 'agDateCellEditor',
    cellEditorParams: {
      useFormatter: true
    },
    valueGetter: dateValueGetter,
    valueParser: dateValueParser,
    valueSetter: dateValueSetter,
    cellRenderer: (params) => {
      if (!params.data || params.data.isChild) return ''
      if (!params.value) return '<span class="text-gray-400">Non définie</span>'
      try {
        const date = new Date(params.value as string)
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR')
      } catch {
        return ''
      }
    }
  },
  {
    headerName: 'Ressources',
    field: 'resources',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1.5,
    detailConfig: {
      key: 'resourcesList',
      displayField: 'resources',
      columns: [{
        field: 'resources',
        valueKey: '',
        formatter: (value) => `${value}`
      }]
    },
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['', ...resourceOptions.map(option => option.value)]
    },
    cellRenderer: (params) => {
      if (!params.data) return ''
      
      if (params.data.isChild) {
        const value = params.value || ''
        return `<span class="text-blue-600">${value}</span>`
      }
      
      const resourceCount = params.data.resourceCount || 0
      return `<span class="text-blue-600 font-medium cursor-pointer hover:text-blue-800">${resourceCount} ressource${resourceCount > 1 ? 's' : ''} affectée${resourceCount > 1 ? 's' : ''} - Cliquer pour voir</span>`
    }
  }
]

// Gestion des changements de cellules
async function onCellValueChanged(event: CellValueChangedEvent) {
  const { data, colDef, newValue, oldValue } = event
  if (!data || !colDef.field) return
  
  const normalizedOldValue = oldValue === null || oldValue === undefined ? '' : String(oldValue)
  const normalizedNewValue = newValue === null || newValue === undefined ? '' : String(newValue)
  
  if (normalizedNewValue === normalizedOldValue) return
  
  try {
    if (colDef.field === 'resources') {
      if (data.isChild) {
        const parentId = data.parentId
        
        if (!normalizedNewValue) {
          const confirmed = await alertService.confirm({
            title: 'Supprimer la ressource',
            text: `Voulez-vous vraiment supprimer cette ressource ?`
          })
          
          if (confirmed.isConfirmed) {
            await removeResourceFromJob(parentId, normalizedOldValue)
          } else {
            data[colDef.field] = oldValue
          }
        } else {
          const confirmed = await alertService.confirm({
            title: 'Modifier la ressource',
            text: `Voulez-vous vraiment changer "${normalizedOldValue}" en "${normalizedNewValue}" ?`
          })
          
          if (confirmed.isConfirmed) {
            await removeResourceFromJob(parentId, normalizedOldValue)
            await addResourceToJob(parentId, normalizedNewValue)
          } else {
            data[colDef.field] = oldValue
          }
        }
      } else {
        if (normalizedNewValue) {
          const confirmed = await alertService.confirm({
            title: 'Ajouter la ressource',
            text: `Voulez-vous vraiment ajouter "${normalizedNewValue}" ?`
          })
          
          if (confirmed.isConfirmed) {
            await addResourceToJob(data.id, normalizedNewValue)
            data[colDef.field] = getResourcesDisplay(data.id)
          } else {
            data[colDef.field] = oldValue
          }
        }
      }
      return
    }
    
    if (data.isChild) return
    
    const confirmed = await alertService.confirm({
      title: 'Confirmer la modification',
      text: `Voulez-vous vraiment modifier "${colDef.headerName || colDef.field}" de "${normalizedOldValue}" vers "${normalizedNewValue}" ?`
    })
    
    if (confirmed.isConfirmed) {
      updateJobField(data.id, colDef.field, newValue)
      alertService.success({
        text: `${colDef.headerName} mis à jour avec succès.`
      })
    } else {
      if (data && colDef.field) {
        data[colDef.field] = oldValue
      }
    }
  } catch (error) {
    console.error('Erreur lors de la confirmation:', error)
    if (data && colDef.field) {
      data[colDef.field] = oldValue
    }
  }
}

// Actions sur chaque ligne - AMÉLIORÉES
const rowActions: ActionConfig[] = [
  {
    label: 'Réaffecter Ressources',
    icon: 'resource',
    handler: (row: TableRow) => {
      if (row.isChild) return
      selectedRows.value = [row]
      
      // Pré-remplir le formulaire avec les ressources existantes
      const existingResources = getResourcesList(String(row.id))
      resourceForm.value = {
        resources: [...existingResources]
      }
      
      showResourceModal.value = true
    }
  },
  {
    label: 'Réaffecter Premier Comptage',
    icon: 'team',
    handler: (row: TableRow) => {
      if (row.isChild) return
      selectedRows.value = [row]
      currentTeamType.value = 'premier'
      // Pré-remplir le formulaire avec les valeurs actuelles
      teamForm.value = {
        team: row.team1 || '',
        date: row.date1 || getDefaultDate()
      }
      showTeamModal.value = true
    }
  },
  {
    label: 'Réaffecter Deuxième Comptage',
    icon: 'team',
    handler: (row: TableRow) => {
      if (row.isChild) return
      
      selectedRows.value = [row]
      currentTeamType.value = 'deuxieme'
      // Pré-remplir le formulaire avec les valeurs actuelles
      teamForm.value = {
        team: row.team2 || '',
        date: row.date2 || getDefaultDate()
      }
      showTeamModal.value = true
    }
  }
]

// État des composants
const selectedRows = ref<TableRow[]>([])
const showAssignmentDropdown = ref(false)
const assignmentDropdownRef = ref<HTMLElement | null>(null)
const isSubmitting = ref(false)

// Modals
const showTeamModal = ref(false)
const showResourceModal = ref(false)
const showTransferModal = ref(false)

const currentTeamType = ref<'premier' | 'deuxieme'>('premier')
const modalTitle = computed(
  () => `Réaffecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`
)

// Fonction utilitaire pour obtenir la date par défaut
const getDefaultDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Formulaires
const teamForm = ref<Record<string, unknown>>({
  team: '',
  date: getDefaultDate()
})

const resourceForm = ref<{ resources: string[] }>({
  resources: []
})

const transferForm = ref({
  premierComptage: false,
  deuxiemeComptage: false
})

// Configuration des champs de formulaire
const teamFields: FieldConfig[] = [
  {
    key: 'team',
    label: 'Équipe',
    type: 'select',
    searchable: true,
    options: teamOptions,
    validators: [{ key: 'required', fn: (v) => !!v, msg: 'Équipe requise' }]
  },
  {
    key: 'date',
    label: 'Date',
    type: 'date',
    validators: [{ key: 'required', fn: (v) => !!v, msg: 'Date requise' }]
  }
]

const resourceFields: FieldConfig[] = [
  {
    key: 'resources',
    label: 'Ressources',
    type: 'select',
    options: resourceOptions,
    multiple: true,
    searchable: true,
    clearable: true,
    props: {
      placeholder: 'Sélectionnez une ou plusieurs ressources'
    },
    validators: [
      {
        key: 'required',
        fn: (v) => Array.isArray(v) && v.length > 0,
        msg: 'Sélectionnez au moins une ressource'
      }
    ]
  }
]

const transferFields: FieldConfig[] = [
  {
    key: 'premierComptage',
    label: 'Premier Comptage',
    type: 'checkbox',
    props: {
      label: 'Transférer le premier comptage',
      description: 'Transférer les affectations du premier comptage'
    }
  },
  {
    key: 'deuxiemeComptage',
    label: 'Deuxième Comptage',
    type: 'checkbox',
    props: {
      label: 'Transférer le deuxième comptage',
      description: 'Transférer les affectations du deuxième comptage'
    }
  }
]

// Gestionnaires d'événements
function onSelectionChanged(rowsData: TableRow[]) {
  selectedRows.value = rowsData.filter((r) => !r.isChild)
}

function onRowClicked(event: RowClickedEvent) {
  // Logique de clic si nécessaire
}

const toggleAssignmentDropdown = () => {
  showAssignmentDropdown.value = !showAssignmentDropdown.value
}

const handleClickOutsideAssignment = (event: MouseEvent) => {
  const wrap = assignmentDropdownRef.value
  if (wrap && !wrap.contains(event.target as Node)) {
    showAssignmentDropdown.value = false
  }
}

// Gestionnaires des actions - AMÉLIORÉS
function handleAffecterPremierComptageClick() {
  if (!selectedRows.value.length) {
    alertService.warning({
      text: 'Veuillez sélectionner au moins un job.'
    })
    return
  }
  currentTeamType.value = 'premier'
  teamForm.value = {
    team: '',
    date: getDefaultDate()
  }
  showTeamModal.value = true
  showAssignmentDropdown.value = false
}

function handleAffecterDeuxiemeComptageClick() {
  if (!selectedRows.value.length) {
    alertService.warning({
      text: 'Veuillez sélectionner au moins un job.'
    })
    return
  }
  
  currentTeamType.value = 'deuxieme'
  teamForm.value = {
    team: '',
    date: getDefaultDate()
  }
  showTeamModal.value = true
  showAssignmentDropdown.value = false
}

function handleActionRessourceClick() {
  if (!selectedRows.value.length) {
    alertService.warning({
      text: 'Veuillez sélectionner au moins un job.'
    })
    return
  }
  
  resourceForm.value = {
    resources: []
  }
  
  showResourceModal.value = true
  showAssignmentDropdown.value = false
}

function handleValiderClick() {
  if (!selectedRows.value.length) {
    alertService.warning({
      text: 'Veuillez sélectionner au moins un job.'
    })
    return
  }
  const jobIds = selectedRows.value.map((r) => String(r.id))
  validerJobs(jobIds)
}

function handleTransfererClick() {
  if (!selectedRows.value.length) {
    alertService.warning({
      text: 'Veuillez sélectionner au moins un job.'
    })
    return
  }
  transferForm.value = {
    premierComptage: false,
    deuxiemeComptage: false
  }
  showTransferModal.value = true
}

// Gestionnaires de soumission de formulaire - AMÉLIORÉS
async function handleTeamSubmit(data: Record<string, unknown>) {
  const { team, date } = data as { team: string; date: string }
  const jobIds = selectedRows.value.map((r) => String(r.id))
  
  isSubmitting.value = true
  
  try {
    if (currentTeamType.value === 'premier') {
      await affecterAuPremierComptage(team, jobIds, date)
      alertService.success({
        text: `${jobIds.length} job(s) réaffecté(s) au premier comptage avec l'équipe "${team}".`
      })
    } else {
      await affecterAuDeuxiemeComptage(team, jobIds, date)
      alertService.success({
        text: `${jobIds.length} job(s) réaffecté(s) au deuxième comptage avec l'équipe "${team}".`
      })
    }
    
    showTeamModal.value = false
    teamForm.value = { team: '', date: getDefaultDate() }
    selectedRows.value = []
  } catch (error) {
    console.error('Erreur lors de la réaffectation:', error)
    alertService.error({
      title: 'Erreur de réaffectation',
      text: 'Une erreur est survenue lors de la réaffectation. Veuillez réessayer.'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleResourceSubmit(data: Record<string, unknown>) {
  const { resources } = data as { resources: string[] }
  const jobIds = selectedRows.value.map((r) => String(r.id))
  
  isSubmitting.value = true
  
  try {
    // Pour la réaffectation, on remplace complètement les ressources
    // D'abord supprimer toutes les ressources existantes
    for (const jobId of jobIds) {
      const existingResources = getResourcesList(jobId)
      for (const resource of existingResources) {
        await removeResourceFromJob(jobId, resource)
      }
    }
    
    // Puis ajouter les nouvelles ressources
    if (resources.length > 0) {
      await affecterRessources(jobIds, resources)
    }
    
    alertService.success({
      text: `Ressources réaffectées avec succès à ${jobIds.length} job(s).`
    })
    
    showResourceModal.value = false
    resourceForm.value = { resources: [] }
    selectedRows.value = []
  } catch (error) {
    console.error('Erreur lors de la réaffectation des ressources:', error)
    alertService.error({
      title: 'Erreur de réaffectation',
      text: 'Une erreur est survenue lors de la réaffectation des ressources. Veuillez réessayer.'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleTransferSubmit(data: Record<string, unknown>) {
  const { premierComptage, deuxiemeComptage } = data as {
    premierComptage: boolean
    deuxiemeComptage: boolean
  }
  
  if (!premierComptage && !deuxiemeComptage) {
    alertService.error({
      title: 'Erreur de validation',
      text: 'Vous devez sélectionner au moins un type de comptage à transférer.'
    })
    return
  }
  
  const jobIds = selectedRows.value.map((r) => String(r.id))
  
  isSubmitting.value = true
  
  try {
    await transfererJobs(jobIds, { premierComptage, deuxiemeComptage })
    alertService.success({
      text: `${jobIds.length} job(s) transféré(s) avec succès.`
    })
    
    showTransferModal.value = false
    transferForm.value = { premierComptage: false, deuxiemeComptage: false }
    selectedRows.value = []
  } catch (error) {
    console.error('Erreur lors du transfert:', error)
    alertService.error({
      title: 'Erreur de transfert',
      text: 'Une erreur est survenue lors du transfert. Veuillez réessayer.'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutsideAssignment)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideAssignment)
})
</script>

<style scoped>
:deep(.ag-cell) {
  display: flex;
  align-items: center;
}
</style>