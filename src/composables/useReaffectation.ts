/**
 * Composable useReaffectation - Gestion de la réaffectation des jobs
 *
 * Dédié à la page Réaffectation. Réutilise la logique d'affectation (useAffecter)
 * et :
 * - Ajoute l'action "Réaffecter" dans le menu d'actions de chaque ligne
 * - Exclut l'action "Supprimer" (non disponible en réaffectation)
 * - Expose la config DataTable pour la page Réaffectation
 *
 * @module useReaffectation
 */

import { computed, markRaw } from 'vue'
import type { ActionConfig } from '@SMATCH-Digital-dev/vue-system-design'
import IconEdit from '@/components/icon/icon-edit.vue'
import { useAffecter } from '@/composables/useAffecter'
import { JobService } from '@/services/jobService'
import { alertService } from '@/services/alertService'

export interface UseReaffectationOptions {
    inventoryReference?: string
    warehouseReference?: string
}

/** Clé de stockage du state DataTable pour la page Réaffectation */
export const REAFFECTATION_TABLE_STORAGE_KEY = 'reaffectation_table'

/**
 * Config DataTable dédiée à la page Réaffectation.
 * À utiliser avec v-bind ou en spread sur le composant DataTable.
 */
export const reaffectationDataTableConfig = {
    storageKey: REAFFECTATION_TABLE_STORAGE_KEY,
    enableDynamicColumns: false,
    debounceFilter: 300,
    debounceSearch: 300,
    pagination: true,
    rowSelection: true
} as const

/**
 * Composable pour la page Réaffectation.
 * Même API que useAffecter, avec :
 * - actions de ligne : Valider + Réaffecter (sans Supprimer)
 * - jobsDataTableConfig pour le DataTable
 */
export function useReaffectation(options?: UseReaffectationOptions) {
    const affecter = useAffecter(options)

    const reaffecterAction: ActionConfig<any> = {
        label: 'Réaffecter',
        icon: markRaw(IconEdit),
        color: 'primary',
        onClick: (row: any) => {
            const id = row?.id != null ? String(row.id) : row?.job
            if (id) void affecter.onRowClicked(id)
        },
        show: () => true
    }

    // Action "Remettre" : rouvre un assignment (statut ENTAME côté backend)
    const remettreAction: ActionConfig<any> = {
        label: 'Remettre',
        icon: markRaw(IconEdit),
        color: 'info',
        onClick: async (row: any) => {
            try {
                const assignments = (row as any)?.assignments || []

                if (!assignments || assignments.length === 0) {
                    await alertService.warning({ text: 'Aucun assignment trouvé pour ce job.' })
                    return
                }

                // Même logique que le suivi pour choisir l\'assignment : priorité au 1er comptage
                const firstCounting = assignments.find((a: any) => a.counting_order === 1) || null
                const secondCounting = assignments.find((a: any) => a.counting_order === 2) || null

                let assignmentId: number | null = null
                const firstId = (firstCounting as any)?.id || (firstCounting as any)?.assignment_id
                const secondId = (secondCounting as any)?.id || (secondCounting as any)?.assignment_id

                if (firstId) {
                    assignmentId = typeof firstId === 'number' ? firstId : parseInt(String(firstId))
                } else if (secondId) {
                    assignmentId = typeof secondId === 'number' ? secondId : parseInt(String(secondId))
                }

                if (!assignmentId || Number.isNaN(assignmentId)) {
                    await alertService.error({ text: 'Impossible de déterminer l\'assignment à rouvrir.' })
                    return
                }

                const confirmResult = await alertService.confirm({
                    title: 'Confirmer la remise',
                    text: 'Voulez-vous vraiment remettre ce job en statut ENTAME ?'
                })

                if (!confirmResult.isConfirmed) {
                    return
                }

                await JobService.reopenAssignmentWithLocations(assignmentId)
                await alertService.success({ text: 'Job remis en statut ENTAME avec succès.' })

                // Rafraîchir la liste des jobs
                await (affecter as any).refreshJobs?.()
            } catch (error) {
                await alertService.error({ text: 'Erreur lors de la remise du job.' })
            }
        },
        show: () => true
    }

    /** Actions de ligne pour la réaffectation : celles d'Affecter sauf Supprimer, plus Réaffecter */
    const jobsActionsWithReaffecter = computed(() => {
        const baseActions = affecter.jobsActions.value.filter(
            (a: ActionConfig<any>) => a.label !== 'Supprimer'
        )
        // Ajouter "Réaffecter" et "Remettre"
        return [...baseActions, reaffecterAction, remettreAction]
    })

    return {
        ...affecter,
        jobsActions: jobsActionsWithReaffecter,
        /** Config à passer au DataTable (storageKey, debounce, etc.) */
        jobsDataTableConfig: reaffectationDataTableConfig
    }
}
