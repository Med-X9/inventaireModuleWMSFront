/**
 * Composable pour gérer les exportations DataTable via l'API backend
 * 
 * Ce composable fournit des fonctions réutilisables pour exporter des données
 * depuis le backend en utilisant les paramètres actuels du DataTable
 * (pagination, tri, filtres, recherche)
 */

import { ref } from 'vue';
import Swal from 'sweetalert2';
import { buildDataTableParams } from '../utils/dataTableHelpers';
import type { Ref } from 'vue';

export interface ExportConfig {
    /**
     * Action Vuex à dispatcher pour l'export
     * Exemple: 'ItemModule/extractArticlesArchives'
     */
    vuexAction: string;
    
    /**
     * Nom du fichier à télécharger (sans extension)
     * Exemple: 'Articles_Archivés'
     */
    filename: string;
    
    /**
     * Extension du fichier
     * Défaut: 'xlsx'
     */
    fileExtension?: 'xlsx' | 'csv' | 'pdf';
    
    /**
     * Type MIME du fichier
     * Défaut: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
     */
    mimeType?: string;
    
    /**
     * Paramètre export à envoyer à l'API
     * Défaut: 'spreadsheet'
     */
    exportType?: 'spreadsheet' | 'csv' | 'pdf';
    
    /**
     * Paramètres additionnels à passer à l'action Vuex
     * Exemple: { id: 123 } pour TagHistoryModule
     */
    additionalParams?: Record<string, any>;
}

export interface DataTableState {
    pagination: Ref<any>;
    sortModel: Ref<any>;
    filters: Ref<any>;
    searchQuery: Ref<string>;
}

/**
 * Crée des fonctions d'export réutilisables pour un DataTable
 */
export function useDataTableExport(
    store: any,
    dataTableState: DataTableState
) {
    const exportLoading = ref(false);

    /**
     * Fonction générique d'export
     */
    const exportData = async (config: ExportConfig) => {
        exportLoading.value = true;

        // Afficher le loader
        Swal.fire({
            title: 'Téléchargement...',
            text: 'Le fichier est en cours de préparation. Veuillez patienter.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Construire les paramètres URL avec tous les filtres, tri, recherche
            const urlParams = buildDataTableParams({
                page: dataTableState.pagination.value.current_page,
                pageSize: dataTableState.pagination.value.page_size,
                search: dataTableState.searchQuery.value,
                sortModel: dataTableState.sortModel.value,
                filters: dataTableState.filters.value
            });

            // Ajouter le paramètre export
            const exportType = config.exportType || 'spreadsheet';
            urlParams.append('export', exportType);

            const url = `?${urlParams.toString()}`;
            
            // Dispatcher l'action Vuex avec ou sans paramètres additionnels
            const dispatchPayload = config.additionalParams 
                ? { ...config.additionalParams, url }
                : url;
            
            const response = await store.dispatch(config.vuexAction, dispatchPayload);
            
            // Vérifier si response.data est bien un blob
            if (!response || !response.data) {
                throw new Error('Aucune donnée reçue du backend');
            }

            // Obtenir le blob - soit directement de response.data (déjà un blob du backend)
            // soit en le créant si nécessaire
            let blob: Blob;
            const fileExtension = config.fileExtension || 'xlsx';
            const mimeType = config.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
            if (response.data instanceof Blob) {
                // Si le blob a déjà le bon type, l'utiliser tel quel
                // Sinon, recréer avec le bon MIME type
                if (response.data.type === mimeType || response.data.type === '') {
                    blob = response.data;
                } else {
                    blob = new Blob([response.data], { type: mimeType });
                }
            } else {
                blob = new Blob([response.data], { type: mimeType });
            }
            
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `${config.filename}.${fileExtension}`);
            document.body.appendChild(link);
            
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            // Succès
            Swal.fire({
                title: 'Succès !',
                text: 'Le fichier a été téléchargé avec succès.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error: any) {
            Swal.fire({
                title: 'Erreur',
                text: error.message || 'Une erreur est survenue lors de l\'export.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        } finally {
            exportLoading.value = false;
        }
    };

    /**
     * Export tableur (format XLSX)
     */
    const exportToSpreadsheet = async (config: Omit<ExportConfig, 'exportType' | 'fileExtension' | 'mimeType'>) => {
        await exportData({
            ...config,
            exportType: 'spreadsheet',
            fileExtension: 'xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    };

    /**
     * Export CSV
     */
    const exportToCsv = async (config: Omit<ExportConfig, 'exportType' | 'fileExtension' | 'mimeType'>) => {
        await exportData({
            ...config,
            exportType: 'csv',
            fileExtension: 'csv',
            mimeType: 'text/csv'
        });
    };

    /**
     * Export PDF
     */
    const exportToPdf = async (config: Omit<ExportConfig, 'exportType' | 'fileExtension' | 'mimeType'>) => {
        await exportData({
            ...config,
            exportType: 'pdf',
            fileExtension: 'pdf',
            mimeType: 'application/pdf'
        });
    };

    /**
     * Export CSV côté client (depuis les données en mémoire)
     */
    const exportToCsvClient = (data: any[], filename: string = 'export', columns?: string[]) => {
        try {
            // Déterminer les colonnes à exporter
            const cols = columns || (data.length > 0 ? Object.keys(data[0]) : [])
            
            // Créer l'en-tête CSV
            const header = cols.join(',')
            
            // Créer les lignes de données
            const rows = data.map(row => {
                return cols.map(col => {
                    const value = row[col]
                    // Échapper les valeurs contenant des virgules ou des guillemets
                    if (value === null || value === undefined) return ''
                    const stringValue = String(value).replace(/"/g, '""')
                    return `"${stringValue}"`
                }).join(',')
            })
            
            // Combiner header et rows
            const csvContent = [header, ...rows].join('\n')
            
            // Créer le blob et télécharger
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.setAttribute('download', `${filename}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(downloadUrl)
            
            return true
        } catch (error: any) {
            Swal.fire({
                title: 'Erreur',
                text: error.message || 'Une erreur est survenue lors de l\'export CSV.',
                icon: 'error'
            })
            return false
        }
    }

    /**
     * Export tableur côté client (utilise une bibliothèque externe si disponible)
     * Pour l'instant, exporte en CSV avec extension .xlsx
     */
    const exportToSpreadsheetClient = (data: any[], filename: string = 'export', columns?: string[]) => {
        // Pour un vrai export tableur, il faudrait utiliser une bibliothèque comme xlsx
        // Pour l'instant, on exporte en CSV avec extension .xlsx
        return exportToCsvClient(data, filename, columns)
    }

    return {
        exportLoading,
        exportData,
        exportToSpreadsheet,
        exportToCsv,
        exportToPdf,
        exportToCsvClient,
        exportToSpreadsheetClient
    };
}

