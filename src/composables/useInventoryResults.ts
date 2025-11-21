/**
 * Composable useInventoryResults - Gestion des résultats d'inventaire
 *
 * Ce composable gère :
 * - L'affichage des résultats d'inventaire par magasin
 * - La pagination, le tri et le filtrage côté serveur avec format standard DataTable
 * - La validation et modification des résultats
 * - La gestion dynamique des colonnes de comptage et d'écart
 *
 * @module useInventoryResults
 */

// ===== IMPORTS VUE =====
import { ref, computed, markRaw, watch } from 'vue'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS COMPOSABLES =====
import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'

// ===== IMPORTS SERVICES =====
import { dataTableService } from '@/services/dataTableService'
import { logger } from '@/services/loggerService'
import { alertService } from '@/services/alertService'
import { EcartComptageService } from '@/services/EcartComptageService'

// ===== IMPORTS STORES =====
import { useResultsStore } from '@/stores/results'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { useSessionStore } from '@/stores/session'
import { useJobStore } from '@/stores/job'

// ===== IMPORTS TYPES =====
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { InventoryResult, StoreOption } from '@/interfaces/inventoryResults'
import type { Warehouse } from '@/models/Warehouse'
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// ===== IMPORTS UTILS =====
import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'

// ===== IMPORTS ICÔNES =====
import IconCheck from '@/components/icon/icon-check.vue'
import IconPencil from '@/components/icon/icon-edit.vue'
import IconLaunch from '@/components/icon/icon-launch.vue'

/**
 * Options pour initialiser le composable
 */
export interface UseInventoryResultsConfig {
    inventoryReference?: string
    initialInventoryId?: number
}

/**
 * Composable pour la gestion des résultats d'inventaire
 * Utilise useBackendDataTable pour l'intégration avec Pinia
 */
export function useInventoryResults(config?: UseInventoryResultsConfig) {
    const resultsStore = useResultsStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()
    const sessionStore = useSessionStore()
    const jobStore = useJobStore()

    const {
        selectedStore,
        stores: storeOptionsFromStore
    } = storeToRefs(resultsStore)

    const { warehouses, loading: warehousesLoading } = storeToRefs(warehouseStore)

    // ===== ÉTAT LOCAL =====
    const inventoryReference = ref(config?.inventoryReference || '')
    const inventoryId = ref<number | null>(config?.initialInventoryId || null)
    const accountId = ref<number | null>(null)
    const isInitialized = ref(false)

    // États pour les magasins
    const storeOptions = ref<StoreOption[]>([])
    const usesWarehouseFallback = ref(false)

    const mapWarehouseToOption = (warehouse: Warehouse): StoreOption => ({
        label: warehouse.warehouse_name || warehouse.reference || `Entrepôt ${warehouse.id}`,
        value: String(warehouse.id)
    })

    const syncStoreOptions = (inventoryStores?: StoreOption[] | null) => {
        if (inventoryStores && inventoryStores.length > 0) {
            storeOptions.value = inventoryStores
            usesWarehouseFallback.value = false
            return
        }

        storeOptions.value = warehouses.value.map(mapWarehouseToOption)
        usesWarehouseFallback.value = true
    }

    watch(storeOptionsFromStore, newOptions => {
        if (newOptions.length > 0) {
            syncStoreOptions(newOptions)
        }
    })

    watch(warehouses, newWarehouses => {
        if (usesWarehouseFallback.value) {
            storeOptions.value = newWarehouses.map(mapWarehouseToOption)
        }
    })

    syncStoreOptions(storeOptionsFromStore.value)

    // ===== INITIALISATION DATATABLE =====

    /**
     * DataTable pour les résultats d'inventaire
     */
    const {
        data: results,
        loading,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        setPage,
        setPageSize,
        setSearch,
        setSortModel,
        setFilters,
        resetFilters,
        refresh,
        pagination
    } = useBackendDataTable<InventoryResult>('', {
        piniaStore: resultsStore,
        storeId: 'results',
        autoLoad: false,
        pageSize: 20
    })

    // ===== COMPUTED =====

    const hasResults = computed(() => results.value.length > 0)

    // ===== COLONNES DYNAMIQUES =====

    /**
     * Construire les colonnes de comptage dynamiquement
     */
    interface ResultWithLabels extends InventoryResult {
        __countingLabels?: Record<string, string>;
        __differenceLabels?: Record<string, string>;
    }

    const columns = computed<DataTableColumn[]>(() => {
        const inferCountingFields = () => {
            if (!results.value.length) return [] as string[];
            return Object.keys(results.value[0])
                .filter(key => /^contage_\d+$/.test(key))
                .sort((a, b) => Number(a.replace('contage_', '')) - Number(b.replace('contage_', '')));
        };

        const inferCountingLabel = (field: string, index: number) => {
            if (!results.value.length) return `${index + 1}ème comptage`;

            for (const result of results.value as ResultWithLabels[]) {
                const entries = Object.entries(result).filter(([key]) => key === field);
                for (const [key, value] of entries) {
                    if (key === field && result.__countingLabels?.[field]) {
                        return result.__countingLabels[field];
                    }
                }
            }

            if (index === 0) return '1er comptage';
            if (index === 1) return '2ème comptage';
            if (index === 2) return '3ème comptage';
            return `${index + 1}ème comptage`;
        };

        const inferDifferenceFields = () => {
            if (!results.value.length) return [] as string[];
            // Pattern modifié pour accepter tous les formats d'écart :
            // - ecart_1_2 (deux nombres)
            // - ecart_1_2_3 (trois nombres)
            // - ecart_1_2_3_4 (quatre nombres ou plus)
            // Pattern: ecart_ suivi d'au moins un chiffre, puis un ou plusieurs groupes de _chiffres
            return Object.keys(results.value[0])
                .filter(key => /^ecart_\d+(_\d+)+$/.test(key))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        };

        const inferDifferenceLabel = (field: string) => {
            if (!results.value.length) return 'Écart';

            for (const result of results.value as ResultWithLabels[]) {
                if (result.__differenceLabels?.[field]) {
                    return result.__differenceLabels[field];
                }
            }

            // Pattern modifié pour extraire tous les nombres de l'écart
            // Exemples :
            // - ecart_1_2 -> "Écart 1-2"
            // - ecart_1_2_3 -> "Écart 1-2-3"
            // - ecart_3_4 -> "Écart 3-4"
            const match = field.match(/^ecart_((?:\d+_?)+)$/);
            if (!match) return 'Écart';

            // Extraire tous les nombres et les joindre avec des tirets
            const numbers = match[1].split('_').filter(n => n.length > 0);
            if (numbers.length === 0) return 'Écart';

            // Si deux nombres, format "Écart X-Y", sinon "Écart X-Y-Z..."
            if (numbers.length === 2) {
                return `Écart ${numbers[0]}-${numbers[1]}`;
            } else {
                return `Écart ${numbers.join('-')}`;
            }
        };

        const sortedCountingFields = inferCountingFields();
        const sortedDifferenceFields = inferDifferenceFields();

        const cols: DataTableColumn[] = [
            {
                headerName: 'ID',
                field: 'id',
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                width: 80,
                editable: false,
                visible: false,
                draggable: true,
                autoSize: true,
                description: 'Identifiant unique'
            },
            {
                headerName: 'Article',
                field: 'article',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                width: dataTableService.calculateOptimalColumnWidth({
                    field: 'article',
                    headerName: 'Article',
                    dataType: 'text'
                }),
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-box',
                description: 'Référence de l\'article'
            },
            {
                headerName: 'Emplacement',
                field: 'emplacement',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                width: dataTableService.calculateOptimalColumnWidth({
                    field: 'emplacement',
                    headerName: 'Emplacement',
                    dataType: 'text'
                }),
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-map-pin',
                description: 'Emplacement de l\'article'
            }
        ];

        sortedCountingFields.forEach((field, index) => {
            cols.push({
                headerName: inferCountingLabel(field, index),
                field,
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                width: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-calculator',
                description: `Valeur du comptage ${index + 1}`
            });
        });

        sortedDifferenceFields.forEach(field => {
            cols.push({
                headerName: inferDifferenceLabel(field),
                field,
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                width: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-trending-up',
                description: 'Écart entre les comptages',
                // Utiliser cellRenderer qui peut être appelé de différentes manières
                // Le service cellRenderers l'appelle avec (value, column, row)
                // Mais le type attend (params: any), donc on doit gérer les deux cas
                cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                    // Déterminer si c'est le format params ou (value, column, row)
                    let ecart: any;
                    let rowData: any;

                    if (column && row) {
                        // Format (value, column, row) utilisé par cellRenderersService
                        ecart = paramsOrValue;
                        rowData = row;
                    } else {
                        // Format params utilisé par AG-Grid
                        const params = paramsOrValue;
                        ecart = params?.value;
                        rowData = params?.data || params?.rowData || params?.node?.data;
                    }

                    // Si la valeur n'est pas définie, chercher dans la ligne avec le nom du champ
                    if (ecart === undefined || ecart === null) {
                        ecart = rowData?.[field];
                    }

                    // Si toujours pas trouvé, chercher toutes les clés qui commencent par "ecart_"
                    if (ecart === undefined || ecart === null) {
                        if (rowData) {
                            const ecartKeys = Object.keys(rowData).filter(key =>
                                key.toLowerCase().startsWith('ecart_')
                            );
                            if (ecartKeys.length > 0) {
                                // Essayer de trouver celle qui correspond au pattern du champ
                                const matchingKey = ecartKeys.find(key =>
                                    key.toLowerCase() === field.toLowerCase()
                                );
                                ecart = matchingKey ? rowData[matchingKey] : rowData[ecartKeys[0]];
                            }
                        }
                    }

                    // Si la valeur est null, undefined ou chaîne vide, afficher '-'
                    if (ecart === undefined || ecart === null || ecart === '') {
                        return '-';
                    }

                    // Convertir en nombre
                    const numEcart = Number(ecart);

                    // Si la conversion échoue, afficher '-'
                    if (Number.isNaN(numEcart)) {
                        return '-';
                    }

                    // Retourner le HTML avec les classes de couleur
                    // Si écart = 0 → couleur succès (vert), sinon couleur erreur (rouge)
                    const color = numEcart === 0 ? 'text-green-600' : 'text-red-600';
                    return `<span class="${color} font-semibold">${numEcart}</span>`;
                }) as any
            });
        });

        cols.push({
            headerName: 'Résultat final',
            field: 'resultats',
            sortable: true,
            dataType: 'number' as ColumnDataType,
            filterable: true,
            width: 140,
            editable: true,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-check-circle',
            description: 'Résultat final validé'
        });

        return cols;
    });

    // Validation des colonnes
    columns.value.forEach(column => {
        const validation = dataTableService.validateColumnConfig(column)
        if (!validation.isValid) {
            logger.warn('Configuration de colonne invalide', { column, errors: validation.errors })
        }
    })

    // ===== ACTIONS =====

    /**
     * Actions pour chaque ligne de résultat
     */
    const actions: ActionConfig<InventoryResult>[] = [
        {
            label: 'Modifier',
            icon: markRaw(IconPencil),
            color: 'primary',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire l'ID de l'écart (peut être l'ID du résultat ou un champ spécifique)
                    const ecartId = result.ecart_id || result.id

                    if (!ecartId) {
                        await alertService.error({ text: 'ID de l\'écart manquant' })
                        return
                    }

                    // Première popup : Saisie de la nouvelle valeur
                    const swalResult = await Swal.fire({
                        title: 'Modifier le résultat final',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Entrez la nouvelle valeur du résultat final
                                </p>
                            </div>
                        `,
                        input: 'number',
                        inputPlaceholder: String(result.resultats ?? ''),
                        inputValue: result.resultats ?? '',
                        inputAttributes: {
                            min: '0',
                            step: '1'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Suivant',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#B4B6BA',
                        inputValidator: (value) => {
                            if (!value || value === '') {
                                return 'Veuillez entrer une valeur'
                            }
                            const numValue = Number(value)
                            if (Number.isNaN(numValue) || numValue < 0) {
                                return 'Veuillez entrer un nombre valide (≥ 0)'
                            }
                            return null
                        },
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn btn-secondary'
                        }
                    })

                    if (!swalResult.isConfirmed || swalResult.value === undefined || swalResult.value === null) {
                        return
                    }

                    const newValue = Number(swalResult.value)

                    // Deuxième popup : Justification (optionnelle)
                    const justificationResult = await Swal.fire({
                        title: 'Justification (optionnelle)',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Vous pouvez ajouter une justification pour cette modification
                                </p>
                            </div>
                        `,
                        input: 'textarea',
                        inputPlaceholder: 'Ex: Ajustement manuel après contrôle...',
                        inputAttributes: {
                            rows: '4'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Confirmer',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#B4B6BA',
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn btn-secondary'
                        }
                    })

                    if (!justificationResult.isConfirmed) {
                        return
                    }

                    // Appeler l'API de mise à jour du résultat final
                    await EcartComptageService.updateFinalResult(Number(ecartId), {
                        final_result: newValue,
                        justification: justificationResult.value || undefined
                    })

                    await alertService.success({ text: 'Résultat final modifié avec succès' })
                    await reloadResults()
                } catch (error: any) {
                    logger.error('Erreur lors de la modification du résultat final', error)

                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.response?.data?.message ||
                                        error?.message ||
                                        'Erreur lors de la modification du résultat final'

                    await alertService.error({ text: errorMessage })
                }
            },
            show: () => true
        },
        {
            label: 'Valider',
            icon: markRaw(IconCheck),
            color: 'success',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire l'ID de l'écart (peut être l'ID du résultat ou un champ spécifique)
                    const ecartId = result.ecart_id || result.id

                    if (!ecartId) {
                        await alertService.error({ text: 'ID de l\'écart manquant' })
                        return
                    }

                    // Vérifier que le résultat final est renseigné
                    if (!result.resultats && result.resultats !== 0) {
                        await alertService.warning({
                            text: 'Le résultat final doit être renseigné avant de pouvoir valider l\'écart'
                        })
                        return
                    }

                    const confirmation = await Swal.fire({
                        title: 'Valider l\'écart',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Voulez-vous vraiment valider cet écart de comptage ?
                                </p>
                                <div style="background: #f9fafb; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
                                    <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">Résultat final :</div>
                                    <div style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">${result.resultats ?? 'Non défini'}</div>
                                </div>
                            </div>
                        `,
                        input: 'textarea',
                        inputPlaceholder: 'Justification (optionnelle)...',
                        inputAttributes: {
                            rows: '4'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Valider',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#10B981',
                        cancelButtonColor: '#B4B6BA',
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-success',
                            cancelButton: 'btn btn-secondary'
                        }
                    })

                    if (!confirmation.isConfirmed) {
                        return
                    }

                    // Appeler l'API de résolution de l'écart (qui correspond à la validation)
                    await EcartComptageService.resolveEcart(Number(ecartId), {
                        justification: confirmation.value || undefined
                    })

                    await alertService.success({ text: 'Écart validé avec succès' })
                    await reloadResults()
                } catch (error: any) {
                    logger.error('Erreur lors de la validation de l\'écart', error)

                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.response?.data?.message ||
                                        error?.message ||
                                        'Erreur lors de la validation de l\'écart'

                    await alertService.error({ text: errorMessage })
                }
            },
            show: () => true
        },
        {
            label: 'Lancer',
            icon: markRaw(IconLaunch),
            color: 'warning',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire les informations nécessaires depuis la ligne
                    const jobId = result.jobId || result.job_id || result.id
                    const locationId = result.location_id || result.locationId || result.emplacement_id
                    const emplacementName = result.emplacement || result.location_reference || result.location_name || 'Emplacement inconnu'
                    const articleName = result.article || result.product || result.product_name || null

                    // Vérifier que les informations de base sont présentes
                    if (!jobId) {
                        await alertService.error({ text: 'ID du job manquant' })
                        return
                    }

                    if (!locationId) {
                        await alertService.error({ text: 'ID de l\'emplacement manquant' })
                        return
                    }

                    // Charger les sessions si elles ne sont pas déjà chargées
                    if (sessionStore.getAllSessions.length === 0) {
                        try {
                            await sessionStore.fetchSessions()
                        } catch (error) {
                            logger.error('Erreur lors du chargement des sessions', error)
                            await alertService.error({ text: 'Erreur lors du chargement des sessions' })
                            return
                        }
                    }

                    const sessions = sessionStore.getAllSessions

                    if (sessions.length === 0) {
                        await alertService.error({ text: 'Aucune session disponible' })
                        return
                    }

                    // Créer les options pour le select
                    const sessionOptions: Record<string, string> = {}
                    sessions.forEach(session => {
                        sessionOptions[session.id.toString()] = session.username
                    })

                    // Première popup : Sélection de la session - Design amélioré
                    const sessionSelection = await Swal.fire({
                        title: '<div style="font-size: 1.5rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Sélectionner une session</div>',
                        html: `
                            <div style="text-align: center; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem;">
                                    Choisissez la session pour lancer le comptage
                                </p>
                            </div>
                        `,
                        input: 'select',
                        inputOptions: sessionOptions,
                        inputPlaceholder: 'Sélectionnez une session...',
                        showCancelButton: true,
                        confirmButtonText: 'Suivant',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#B4B6BA',
                        inputValidator: (value) => {
                            if (!value) {
                                return 'Veuillez sélectionner une session'
                            }
                            return null
                        },
                        customClass: {
                            popup: 'sweet-alerts-launch',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn btn-secondary'
                        },
                        width: '500px',
                        padding: '2rem'
                    })

                    if (!sessionSelection.isConfirmed || !sessionSelection.value) {
                        return
                    }

                    const selectedSessionId = Number(sessionSelection.value)
                    const selectedSession = sessions.find(s => s.id === selectedSessionId)

                    if (!selectedSession) {
                        await alertService.error({ text: 'Session sélectionnée introuvable' })
                        return
                    }

                    // Deuxième popup : Confirmation - Design amélioré
                    const confirmation = await Swal.fire({
                        title: '<div style="font-size: 1.5rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Confirmer le lancement</div>',
                        html: `
                            <div style="text-align: left; padding: 1.5rem; background: #f9fafb; border-radius: 0.5rem; margin: 1rem 0;">
                                <div style="display: flex; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                                    <div style="width: 40px; height: 40px; background: #FECD1C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Emplacement</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${emplacementName}</div>
                                    </div>
                                </div>
                                ${articleName ? `
                                <div style="display: flex; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                                    <div style="width: 40px; height: 40px; background: #FECD1C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="9" y1="3" x2="9" y2="21"></line>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Article</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${articleName}</div>
                                    </div>
                                </div>
                                ` : ''}
                                <div style="display: flex; align-items: center;">
                                    <div style="width: 40px; height: 40px; background: #FECD1C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Session</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${selectedSession.username}</div>
                                    </div>
                                </div>
                            </div>
                            <p style="text-align: center; color: #6b7280; font-size: 0.95rem; margin-top: 1rem;">
                                Voulez-vous vraiment lancer le comptage pour cet emplacement ?
                            </p>
                        `,
                        icon: 'question',
                        iconColor: '#FECD1C',
                        showCancelButton: true,
                        confirmButtonText: 'Confirmer',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#B4B6BA',
                        customClass: {
                            popup: 'sweet-alerts-launch',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn btn-secondary'
                        },
                        width: '550px',
                        padding: '2rem'
                    })

                    if (confirmation.isConfirmed) {
                        // Appeler l'action du store pour lancer le comptage
                        await jobStore.launchCounting({
                            job_id: Number(jobId),
                            location_id: Number(locationId),
                            session_id: selectedSessionId
                        })

                        await alertService.success({ text: 'Comptage lancé avec succès' })
                        await reloadResults()
                    }
                } catch (error: any) {
                    logger.error('Erreur lors du lancement du comptage', error)

                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.userMessage ||
                                        error?.response?.data?.message ||
                                        error?.message ||
                                        'Erreur lors du lancement du comptage'

                    await alertService.error({ text: errorMessage })
                }
            },
            show: () => true
        }
    ]

    // ===== MÉTHODES DE CHARGEMENT =====

    /**
     * Récupérer les magasins disponibles
     * Priorité 1 : Charger par account_id
     * Priorité 2 : Charger depuis l'inventaire (avec timeout)
     * Priorité 3 : Utiliser les magasins du store existant
     */
    const fetchStores = async () => {
        if (!inventoryId.value) {
            logger.warn('Aucun ID d\'inventaire défini')
            return
        }

        // Priorité 1 : Charger les magasins filtrés par account_id (plus rapide et fiable)
        if (accountId.value) {
            try {
                await warehouseStore.fetchWarehouses(accountId.value)
                logger.debug('Magasins chargés pour le compte', accountId.value)
                // Utiliser les magasins du warehouse store
                syncStoreOptions(null) // null pour forcer l'utilisation du fallback warehouse

                // Si on a des magasins, on peut retourner directement
                if (storeOptions.value.length > 0) {
                    logger.debug('Magasins synchronisés depuis le compte', storeOptions.value)
                    return
                }
            } catch (error) {
                logger.warn('Erreur lors du chargement des magasins par compte, essai depuis l\'inventaire', error)
                // Continuer avec le fallback
            }
        }

        // Priorité 2 : Essayer de charger les magasins depuis l'inventaire (fallback)
        try {
            const inventoryStoreOptions = await Promise.race([
                resultsStore.fetchStores(inventoryId.value),
                new Promise<StoreOption[]>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]) as StoreOption[]

            logger.debug('Magasins chargés depuis l\'inventaire', inventoryStoreOptions)

            // Si on a des magasins depuis l'inventaire, les utiliser
            if (inventoryStoreOptions && inventoryStoreOptions.length > 0) {
                syncStoreOptions(inventoryStoreOptions)
                logger.debug('Magasins synchronisés depuis l\'inventaire', storeOptions.value)
                return
            }
        } catch (error) {
            logger.warn('Impossible de charger les magasins depuis l\'inventaire', error)
            // Ne pas afficher d'erreur bloquante, utiliser ce qu'on a
        }

        // Dernier recours : utiliser les magasins déjà dans le store s'ils existent
        if (storeOptionsFromStore.value.length > 0) {
            syncStoreOptions(storeOptionsFromStore.value)
            logger.debug('Utilisation des magasins du store existant', storeOptions.value)
        } else {
            logger.warn('Aucun magasin disponible')
        }
    }

    /**
     * Convertir les paramètres vers le format standard DataTable pour les résultats
     *
     * @param page - Numéro de page
     * @param pageSize - Taille de page
     * @param filters - Modèle de filtres
     * @param sort - Modèle de tri
     * @param globalSearch - Recherche globale
     * @returns Paramètres au format standard DataTable
     */
    const convertResultsParamsToStandard = (
        page: number,
        pageSize: number,
        filters?: Record<string, { filter: string }>,
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>,
        globalSearch?: string
    ) => {
        return convertToStandardDataTableParams(
            {
                page,
                pageSize,
                filters: filters || {},
                sort: sort || [],
                globalSearch
            },
            {
                columns: columns.value,
                draw: 1,
                customParams: {
                    inventory_id: inventoryId.value,
                    store_id: selectedStore.value
                }
            }
        )
    }

    /**
     * Récupérer les résultats pour un magasin avec paramètres DataTable
     *
     * @param storeId - ID du magasin
     * @param params - Paramètres DataTable optionnels (pagination, tri, filtres, recherche)
     */
    const fetchResults = async (
        storeId: string,
        params?: StandardDataTableParams | Record<string, any>
    ) => {
        if (!inventoryId.value) {
            logger.warn('Aucun ID d\'inventaire défini')
            return
        }

        try {
            resultsStore.setSelectedStore(storeId)

            // Utiliser les paramètres fournis ou construire à partir des valeurs actuelles
            let finalParams: StandardDataTableParams
            if (params && 'draw' in params && 'start' in params && 'length' in params) {
                finalParams = params as StandardDataTableParams
            } else {
                finalParams = convertResultsParamsToStandard(
                    currentPage.value || 1,
                    pageSize.value || 20,
                    undefined,
                    (sortModel.value || []).map(s => ({
                        colId: s.field,
                        sort: s.direction as 'asc' | 'desc'
                    })),
                    searchQuery.value || undefined
                )
            }

            logger.debug('Chargement des résultats avec paramètres', {
                inventoryId: inventoryId.value,
                storeId,
                params: finalParams
            })

            await resultsStore.fetchResults(inventoryId.value, storeId, finalParams)
            logger.debug('Résultats chargés pour le magasin', storeId)
        } catch (error) {
            logger.error('Erreur lors du chargement des résultats', error)
            await alertService.error({ text: 'Erreur lors du chargement des résultats' })
        }
    }

    /**
     * Recharger les résultats actuels avec les paramètres DataTable actuels
     */
    const reloadResults = async () => {
        if (selectedStore.value) {
            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                undefined,
                (sortModel.value || []).map(s => ({
                    colId: s.field,
                    sort: s.direction as 'asc' | 'desc'
                })),
                searchQuery.value || undefined
            )
            await fetchResults(selectedStore.value, standardParams)
        }
    }

    /**
     * Récupérer l'inventaire par référence
     */
    const fetchInventoryByReference = async (reference: string) => {
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(reference)
            inventoryId.value = inventory.id
            accountId.value = inventory.account_id || null
            inventoryReference.value = reference
            logger.debug('Inventaire chargé', { id: inventoryId.value, accountId: accountId.value, reference })
            return inventory
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'inventaire', error)
            await alertService.error({ text: `Inventaire "${reference}" introuvable` })
            throw error
        }
    }

    // ===== MÉTHODES D'ACTION =====

    /**
     * Sélectionner un magasin et charger ses résultats
     * Réinitialise la pagination et les filtres lors du changement de magasin
     */
    const handleStoreSelect = async (storeId: string | null) => {
        if (!storeId) return

        // Réinitialiser la pagination et les filtres lors du changement de magasin
        setPage(1)
        resetFilters()
        setSearch('')
        setSortModel([])

        // Charger les résultats avec les paramètres par défaut
        const standardParams = convertResultsParamsToStandard(
            1,
            pageSize.value || 20,
            undefined,
            [],
            undefined
        )

        await fetchResults(storeId, standardParams)
    }

    /**
     * Validation en masse des résultats sélectionnés
     */
    const handleBulkValidate = async (selectedResults: InventoryResult[]) => {
        if (selectedResults.length === 0) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un résultat à valider' })
            return
        }

        try {
            const confirmation = await alertService.confirm({
                title: 'Confirmer la validation en masse',
                text: `Voulez-vous vraiment valider ${selectedResults.length} résultat(s) ?`
            })

            if (confirmation.isConfirmed) {
                const ids = selectedResults.map(r => r.id)
                await resultsStore.validateResults(ids)
                await alertService.success({ text: `${selectedResults.length} résultat(s) validé(s) avec succès` })
                await reloadResults()
            }
        } catch (error) {
            logger.error('Erreur lors de la validation en masse', error)
            await alertService.error({ text: 'Erreur lors de la validation en masse' })
        }
    }

    // ===== HANDLERS DATATABLE =====

    /**
     * Handler pour les changements de pagination
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param params - Paramètres de pagination (format standard ou ancien format)
     */
    const onPaginationChanged = async (params: { page: number; pageSize: number } | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), utiliser directement
            if ('draw' in params && 'start' in params && 'length' in params) {
                const standardParams = params as StandardDataTableParams
                const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
                setPage(page)
                setPageSize(standardParams.length || 20)

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Sinon, convertir l'ancien format
            const paginationParams = params as { page: number; pageSize: number }
            setPage(paginationParams.page)
            setPageSize(paginationParams.pageSize)

            const standardParams = convertResultsParamsToStandard(
                paginationParams.page,
                paginationParams.pageSize,
                undefined,
                (sortModel.value || []).map(s => ({ colId: s.field, sort: s.direction as 'asc' | 'desc' })),
                searchQuery.value || undefined
            )

            if (selectedStore.value) {
                await fetchResults(selectedStore.value, standardParams)
            }
        } catch (error) {
            logger.error('Erreur dans onPaginationChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de pagination' })
        }
    }

    /**
     * Handler pour les changements de tri
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param sortModel - Modèle de tri (format standard ou ancien format)
     */
    const onSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }> | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), extraire les informations
            if ('draw' in sortModel && 'start' in sortModel && 'length' in sortModel) {
                const standardParams = sortModel as StandardDataTableParams
                const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
                setPage(page)
                setPageSize(standardParams.length || 20)

                // Extraire le tri depuis les paramètres standard
                const extractedSort: Array<{ field: string; direction: 'asc' | 'desc' }> = []
                let sortIndex = 0
                while (standardParams[`order[${sortIndex}][column]`] !== undefined) {
                    const columnIndex = standardParams[`order[${sortIndex}][column]`]
                    const direction = standardParams[`order[${sortIndex}][dir]`] as 'asc' | 'desc'
                    const fieldKey = `columns[${columnIndex}][data]`
                    const fieldName = standardParams[fieldKey]
                    if (fieldName) {
                        extractedSort.push({
                            field: fieldName,
                            direction
                        })
                    }
                    sortIndex++
                }
                setSortModel(extractedSort as any)

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Sinon, convertir l'ancien format
            const sortModelArray = sortModel as Array<{ colId: string; sort: 'asc' | 'desc' }>
            const adaptedSortModel = sortModelArray.map(sort => ({
                field: sort.colId,
                direction: sort.sort
            }))
            setSortModel(adaptedSortModel as any)

            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                undefined,
                sortModelArray,
                searchQuery.value || undefined
            )

            if (selectedStore.value) {
                await fetchResults(selectedStore.value, standardParams)
            }
        } catch (error) {
            logger.error('Erreur dans onSortChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de tri' })
        }
    }

    /**
     * Handler pour les changements de filtres
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param filterModel - Modèle de filtres (format standard ou ancien format)
     */
    const onFilterChanged = async (filterModel: Record<string, { filter: string }> | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), extraire les informations
            if ('draw' in filterModel && 'start' in filterModel && 'length' in filterModel) {
                const standardParams = filterModel as StandardDataTableParams
                const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
                setPage(page)
                setPageSize(standardParams.length || 20)

                // Extraire les filtres depuis les paramètres standard
                const extractedFilters: Record<string, { filter: string }> = {}
                Object.keys(standardParams).forEach(key => {
                    if (key.startsWith('columns[') && key.includes('][search][value]')) {
                        const match = key.match(/columns\[(\d+)\]\[search\]\[value\]/)
                        if (match && standardParams[key]) {
                            const columnIndex = parseInt(match[1])
                            const fieldKey = `columns[${columnIndex}][data]`
                            const fieldName = standardParams[fieldKey]
                            if (fieldName) {
                                extractedFilters[fieldName] = {
                                    filter: standardParams[key]
                                }
                            }
                        }
                    }
                })
                setFilters(extractedFilters)

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Sinon, utiliser directement l'ancien format
            const filterModelObj = filterModel as Record<string, { filter: string }>
            setFilters(filterModelObj)

            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                filterModelObj,
                (sortModel.value || []).map(s => ({ colId: s.field, sort: s.direction as 'asc' | 'desc' })),
                searchQuery.value || undefined
            )

            if (selectedStore.value) {
                await fetchResults(selectedStore.value, standardParams)
            }
        } catch (error) {
            logger.error('Erreur dans onFilterChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de filtre' })
        }
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param searchTerm - Terme de recherche (format standard ou string)
     */
    const onGlobalSearchChanged = async (searchTerm: string | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), extraire les informations
            if (typeof searchTerm === 'object' && 'draw' in searchTerm && 'start' in searchTerm && 'length' in searchTerm) {
                const standardParams = searchTerm as StandardDataTableParams
                const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
                setPage(page)
                setPageSize(standardParams.length || 20)
                setSearch(standardParams['search[value]'] || '')

                if (selectedStore.value) {
                    await fetchResults(selectedStore.value, standardParams)
                }
                return
            }

            // Sinon, utiliser directement la valeur string
            setSearch(searchTerm as string)

            const standardParams = convertResultsParamsToStandard(
                currentPage.value || 1,
                pageSize.value || 20,
                undefined,
                (sortModel.value || []).map(s => ({ colId: s.field, sort: s.direction as 'asc' | 'desc' })),
                searchTerm as string || undefined
            )

            if (selectedStore.value) {
                await fetchResults(selectedStore.value, standardParams)
            }
        } catch (error) {
            logger.error('Erreur dans onGlobalSearchChanged', error)
            await alertService.error({ text: 'Erreur lors de la recherche' })
        }
    }

    // ===== INITIALISATION =====

    /**
     * Initialiser le composable avec une référence d'inventaire
     */
    const initialize = async (reference?: string) => {
        try {
            // Utiliser la référence fournie ou celle stockée
            const ref = reference || inventoryReference.value

            if (!ref) {
                logger.error('Aucune référence d\'inventaire fournie')
                return
            }

            // Mettre à jour la référence si fournie
            if (reference) {
                inventoryReference.value = reference
            }

            logger.debug('Initialisation des résultats d\'inventaire', { reference: ref })

            // Récupérer l'inventaire
            await fetchInventoryByReference(ref)

            if (!inventoryId.value) {
                throw new Error('Impossible de résoudre l\'ID d\'inventaire')
            }

            // Charger les magasins
            await fetchStores()

            // Sélectionner le premier magasin par défaut seulement s'il y en a
            if (storeOptions.value.length > 0) {
                const defaultStoreId = storeOptions.value[0].value
                resultsStore.setSelectedStore(defaultStoreId)

                // Charger avec les paramètres par défaut
                const standardParams = convertResultsParamsToStandard(
                    1,
                    pageSize.value || 20,
                    undefined,
                    [],
                    undefined
                )

                await fetchResults(defaultStoreId, standardParams)
                logger.debug('Premier magasin sélectionné par défaut', defaultStoreId)
            } else {
                logger.warn('Aucun magasin disponible pour sélection automatique')
            }

            isInitialized.value = true
            logger.debug('Initialisation terminée avec succès')
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation', error)
            await alertService.error({ text: 'Erreur lors de l\'initialisation des résultats' })
        }
    }

    /**
     * Réinitialiser avec une nouvelle référence
     */
    const reinitialize = async (reference: string) => {
        if (!reference) return

        try {
            isInitialized.value = false
            resultsStore.setSelectedStore(null)
            storeOptions.value = []
            usesWarehouseFallback.value = false

            inventoryReference.value = reference
            await initialize()
        } catch (error) {
            logger.error('Erreur lors de la réinitialisation', error)
            throw error
        }
    }

    // ===== RETURN =====

    return {
        // État
        inventoryId: computed(() => inventoryId.value),
        inventoryReference: computed(() => inventoryReference.value),
        isInitialized,
        loading,

        // Données
        results,
        stores: storeOptions,
        selectedStore,
        warehouses,
        warehousesLoading,
        usesWarehouseFallback,
        hasResults,

        // Configuration DataTable
        columns,
        actions,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        pagination,

        // Méthodes DataTable
        setPage,
        setPageSize,
        setSearch,
        setSortModel,
        setFilters,
        resetFilters,
        refresh,

        // Actions
        handleStoreSelect,
        handleBulkValidate,
        initialize,
        reinitialize,
        fetchStores,
        fetchResults,
        reloadResults,

        // Handlers DataTable
        onPaginationChanged,
        onSortChanged,
        onFilterChanged,
        onGlobalSearchChanged,

        // Alias pour compatibilité
        fetchInventoryByReference,
        initializeWithReference: initialize,
        reloadWithReference: reinitialize,
        handlePaginationChanged: onPaginationChanged,
        handleSortChanged: onSortChanged,
        handleFilterChanged: onFilterChanged,
        handleGlobalSearchChanged: onGlobalSearchChanged
    }
}
