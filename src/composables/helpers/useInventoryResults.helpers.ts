/**
 * Helpers privés pour useInventoryResults
 *
 * Ce fichier contient les fonctions utilitaires extraites de useInventoryResults.ts
 * pour améliorer la lisibilité et la maintenabilité.
 *
 * @module useInventoryResults.helpers
 */

import { ref, h, createApp, onMounted } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from '@/i18n'
import Modal from '@/components/Modal.vue'
import SelectField from '@/components/Form/SelectField.vue'
import type { SelectOption } from '@/interfaces/form'
import type { InventoryResult } from '@/interfaces/inventoryResults'
import type { JobResult } from '@/models/Job'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import { MODAL_CLOSE_DELAY_MS } from '../useInventoryResults.constants'

// ===== HELPERS DE COLONNES =====

/**
 * Récupère tous les ordres de comptage disponibles dans les résultats
 * Détecte dynamiquement les champs contage_1, contage_2, contage_3, etc.
 *
 * @param results - Résultats d'inventaire normalisés
 * @returns Tableau des ordres de comptage disponibles (toujours inclure au moins 1 et 2)
 */
export function getAvailableCountingOrders(results: InventoryResult[]): number[] {
    if (!results || results.length === 0) {
        return [1, 2] // Par défaut, afficher au moins 1er et 2ème comptage
    }

    const ordersSet = new Set<number>()

    // Parcourir les résultats pour détecter les champs de comptage
    results.forEach(result => {
        // Vérifier les champs contage_X
        Object.keys(result).forEach(key => {
            // Pattern: contage_1, contage_2, contage_3, etc.
            const match = key.match(/^contage_(\d+)$/i)
            if (match) {
                const order = parseInt(match[1], 10)
                if (!isNaN(order) && order > 0) {
                    ordersSet.add(order)
                }
            }

            // Pattern alternatif: "2e comptage", "3e comptage", etc.
            const matchAlt = key.match(/^(\d+)e?\s*comptage$/i)
            if (matchAlt) {
                const order = parseInt(matchAlt[1], 10)
                if (!isNaN(order) && order > 0) {
                    ordersSet.add(order)
                }
            }
        })
    })

    const orders = Array.from(ordersSet).sort((a, b) => a - b)

    // Toujours inclure au moins 1 et 2
    if (!orders.includes(1)) orders.unshift(1)
    if (!orders.includes(2)) {
        const index = orders.findIndex(o => o > 2)
        if (index === -1) orders.push(2)
        else orders.splice(index, 0, 2)
    }

    return orders
}

/**
 * Retourne le label pour un ordre de comptage (1er, 2ème, 3ème, Nème)
 *
 * @param order - Ordre du comptage
 * @returns Label formaté (1er, 2ème, 3ème, etc.)
 */
export function getCountingOrderLabel(order: number): string {
    if (order === 1) return '1er comptage'
    if (order === 2) return '2ème comptage'
    if (order === 3) return '3ème comptage'
    return `${order}ème comptage`
}

/**
 * Retourne le nom du champ pour un ordre de comptage
 * Gère les formats: contage_1, contage_2, "2e comptage", etc.
 *
 * @param order - Ordre du comptage
 * @returns Nom du champ (contage_X ou format alternatif)
 */
export function getCountingFieldName(order: number): string {
    if (order === 2) {
        // Le 2ème comptage utilise parfois "2e comptage" au lieu de "contage_2"
        // On essaie d'abord "2e comptage", puis "contage_2" en fallback
        return '2e comptage'
    }
    return `contage_${order}`
}

/**
 * Retourne le nom du champ de statut pour un ordre de comptage
 *
 * @param order - Ordre du comptage
 * @returns Nom du champ de statut (statut_1er_comptage, statut_2er_comptage, etc.)
 */
export function getCountingStatusFieldName(order: number): string {
    if (order === 1) return 'statut_1er_comptage'
    if (order === 2) return 'statut_2er_comptage'
    return `statut_${order}er_comptage`
}

// ===== HELPERS D'ACTIONS =====

/**
 * Fonction helper pour extraire l'ID de l'écart de comptage depuis le résultat
 *
 * Recherche l'ID dans l'ordre de priorité suivant :
 * 1. ecart_comptage_id directement dans le résultat
 * 2. ecart_comptage_id dans le job (si job est un objet)
 * 3. ecart_comptage_id dans les assignments
 * 4. ecart_id dans le résultat (fallback pour compatibilité)
 * 5. ecart_id dans le job ou assignments (fallback)
 *
 * @param result - Résultat d'inventaire
 * @returns ID de l'écart de comptage ou null si non trouvé
 */
export function extractEcartComptageId(result: InventoryResult): number | string | null {
    // Priorité 1 : ecart_comptage_id directement dans le résultat
    if ((result as any).ecart_comptage_id !== undefined && (result as any).ecart_comptage_id !== null && (result as any).ecart_comptage_id !== '') {
        return (result as any).ecart_comptage_id
    }

    // Priorité 2 : ecart_comptage_id dans le job (si le job est un objet)
    const job = (result as any).job
    if (job && typeof job === 'object') {
        if (job.ecart_comptage_id !== undefined && job.ecart_comptage_id !== null && job.ecart_comptage_id !== '') {
            return job.ecart_comptage_id
        }
        // Chercher aussi dans job_id si c'est un objet
        if (job.job_id && typeof job.job_id === 'object' && job.job_id.ecart_comptage_id) {
            return job.job_id.ecart_comptage_id
        }
    }

    // Priorité 3 : ecart_comptage_id dans les assignments
    const assignments = (result as any).assignments || (result as any).assignment
    if (assignments) {
        // Si c'est un tableau
        if (Array.isArray(assignments)) {
            for (const assignment of assignments) {
                if (assignment && typeof assignment === 'object') {
                    if (assignment.ecart_comptage_id !== undefined && assignment.ecart_comptage_id !== null && assignment.ecart_comptage_id !== '') {
                        return assignment.ecart_comptage_id
                    }
                }
            }
        }
        // Si c'est un objet unique
        else if (typeof assignments === 'object') {
            if (assignments.ecart_comptage_id !== undefined && assignments.ecart_comptage_id !== null && assignments.ecart_comptage_id !== '') {
                return assignments.ecart_comptage_id
            }
        }
    }

    // Priorité 4 : Fallback vers ecart_id pour compatibilité (si ecart_comptage_id n'est pas trouvé)
    if (result.ecart_id !== undefined && result.ecart_id !== null && result.ecart_id !== '') {
        return result.ecart_id
    }

    // Priorité 5 : ecart_id dans le job (fallback)
    const jobFallback = (result as any).job
    if (jobFallback && typeof jobFallback === 'object') {
        if (jobFallback.ecart_id !== undefined && jobFallback.ecart_id !== null && jobFallback.ecart_id !== '') {
            return jobFallback.ecart_id
        }
    }

    // Priorité 6 : ecart_id dans les assignments (fallback)
    const assignmentsFallback = (result as any).assignments || (result as any).assignment
    if (assignmentsFallback) {
        if (Array.isArray(assignmentsFallback)) {
            for (const assignment of assignmentsFallback) {
                if (assignment && typeof assignment === 'object' && assignment.ecart_id !== undefined && assignment.ecart_id !== null && assignment.ecart_id !== '') {
                    return assignment.ecart_id
                }
            }
        } else if (typeof assignmentsFallback === 'object' && assignmentsFallback.ecart_id !== undefined && assignmentsFallback.ecart_id !== null && assignmentsFallback.ecart_id !== '') {
            return assignmentsFallback.ecart_id
        }
    }

    return null
}

// ===== HELPERS DE MODALS =====

/**
 * Fonction helper pour afficher une modal avec SelectField pour sélectionner une session
 *
 * @param options - Options pour le select
 * @param title - Titre de la modal
 * @param description - Description à afficher
 * @returns Promise qui se résout avec la valeur sélectionnée ou null si annulé
 */
export function showSessionSelectModal(
    options: SelectOption[],
    title: string = 'Sélectionner une session',
    description: string = 'Choisissez la session pour lancer le comptage'
): Promise<string | number | null> {
    return new Promise((resolve) => {
        // Créer un conteneur pour la modal
        const container = document.createElement('div')
        document.body.appendChild(container)

        // Créer l'application Vue
        const app = createApp({
            setup() {
                const showModal = ref<boolean>(true)
                const selectedValue = ref<string | number | null>(null)

                const handleConfirm = () => {
                    showModal.value = false
                    setTimeout(() => {
                        app.unmount()
                        container.remove()
                        resolve(selectedValue.value)
                    }, MODAL_CLOSE_DELAY_MS)
                }

                const handleCancel = () => {
                    showModal.value = false
                    setTimeout(() => {
                        app.unmount()
                        container.remove()
                        resolve(null)
                    }, MODAL_CLOSE_DELAY_MS)
                }

                const handleSelectChange = (value: string | number | string[] | number[] | null) => {
                    if (value !== null && !Array.isArray(value)) {
                        selectedValue.value = value
                    } else {
                        selectedValue.value = null
                    }
                }

                return () => h(Modal, {
                    modelValue: showModal.value,
                    'onUpdate:modelValue': (value: boolean) => {
                        showModal.value = value
                        if (!value) {
                            handleCancel()
                        }
                    },
                    title,
                    size: 'md'
                }, {
                    default: () => [
                        h('div', { class: 'space-y-6' }, [
                            h('p', {
                                class: 'text-sm text-slate-600 dark:text-slate-400 text-center mb-4'
                            }, description),
                            h(SelectField, {
                                modelValue: selectedValue.value,
                                options,
                                searchable: true,
                                clearable: false,
                                placeholder: 'Rechercher une session...',
                                searchPlaceholder: 'Tapez pour rechercher...',
                                'onUpdate:modelValue': handleSelectChange,
                                class: 'w-full',
                                maxVisibleOptions: 3,
                                dropdownClass: 'max-h-48 overflow-y-auto'
                            }),
                            h('div', { class: 'flex justify-end gap-3 mt-6' }, [
                                h('button', {
                                    class: 'px-6 py-3 bg-transparent border-2 border-primary text-primary rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-primary hover:text-white',
                                    onClick: handleCancel
                                }, 'Annuler'),
                                h('button', {
                                    class: 'px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:from-primary-dark hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed',
                                    disabled: selectedValue.value === null,
                                    onClick: handleConfirm
                                }, 'Suivant')
                            ])
                        ])
                    ]
                })
            }
        })

        // Utiliser les plugins nécessaires
        const pinia = createPinia()
        pinia.use(piniaPluginPersistedstate)
        app.use(pinia)
        app.use(i18n)

        // Monter l'application
        app.mount(container)
    })
}

// ===== HELPERS D'EXPORT =====

/**
 * Télécharge un fichier blob avec un nom de fichier donné
 *
 * @param blob - Blob à télécharger
 * @param filename - Nom du fichier
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

/**
 * Génère un nom de fichier avec timestamp pour les exports
 *
 * @param prefix - Préfixe du nom de fichier
 * @param suffix - Suffixe du nom de fichier (optionnel)
 * @param extension - Extension du fichier (défaut: 'xlsx')
 * @returns Nom de fichier généré
 */
export function generateExportFilename(prefix: string, suffix?: string, extension: string = 'xlsx'): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const parts = [prefix, suffix, timestamp].filter(Boolean)
    return `${parts.join('_')}.${extension}`
}

