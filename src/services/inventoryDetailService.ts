// import { alertService } from './alertService';
// // import { apiService } from '@/services/apiService';
// import type { InventoryDetail, InventoryDetailResponse } from '@/models/InventoryDetail';
// import type { DetailData } from '@/interfaces/Detail';

// class InventoryDetailService {
//     async getInventoryDetail(id: number): Promise<DetailData> {
//         try {
//             console.log(`🔍 Récupération des détails de l'inventaire ID: ${id}`);

//             const response = await apiService.get<InventoryDetailResponse>(`/inventories/${id}/`);

//             if (response.success && response.data) {
//                 console.log('✅ Détails de l\'inventaire récupérés:', response.data);

//                 // Convertir la réponse API en format DetailData
//                 const detailData: DetailData = {
//                     inventory: {
//                         id: response.data.id,
//                         reference: response.data.reference,
//                         label: response.data.label,
//                         date: response.data.date,
//                         status: response.data.status,
//                         inventory_type: response.data.inventory_type,
//                         en_preparation_status_date: response.data.en_preparation_status_date,
//                         en_realisation_status_date: response.data.en_realisation_status_date,
//                         termine_status_date: response.data.termine_status_date,
//                         cloture_status_date: response.data.cloture_status_date,
//                         account_name: response.data.account_name,
//                         warehouse_name: response.data.warehouse_name,
//                         comptages: response.data.comptages,
//                         equipe: response.data.equipe
//                     },
//                     magasins: response.data.warehouse_name,
//                     jobsData: {
//                         comptage1: [
//                             { name: 'Préparation zone', status: 'Terminé', date: '2025-12-20', operator: 'Jean D.' },
//                             { name: 'Scan emplacements', status: 'En cours', date: '2025-12-20', operator: 'Marie L.' },
//                             { name: 'Vérification', status: 'En attente', date: '2025-12-20', operator: 'Pierre M.' }
//                         ],
//                         comptage2: [
//                             { name: 'Scan articles', status: 'En attente', date: '2025-12-21', operator: 'Sophie R.' },
//                             { name: 'Contrôle quantités', status: 'En attente', date: '2025-12-21', operator: 'Luc B.' }
//                         ],
//                         comptage3: [
//                             { name: 'Validation finale', status: 'En attente', date: '2025-12-22', operator: 'Anne C.' }
//                         ]
//                     }
//                 };

//                 return detailData;
//             } else {
//                 throw new Error(response.message || 'Erreur lors de la récupération des détails');
//             }
//         } catch (error) {
//             console.error('❌ Erreur lors de la récupération des détails:', error);
//             await alertService.error({
//                 title: 'Erreur',
//                 text: 'Impossible de récupérer les détails de l\'inventaire'
//             });
//             throw error;
//         }
//     }

//     async launchInventory(inventory: InventoryDetail): Promise<boolean> {
//         try {
//             const result = await alertService.confirm({
//                 title: 'Lancer l\'inventaire',
//                 text: `Voulez-vous vraiment lancer l'inventaire "${inventory.label}" ?`
//             });

//             if (result.isConfirmed) {
//                 // Appel API pour lancer l'inventaire
//                 const response = await apiService.post(`/inventories/${inventory.id}/launch/`, {});

//                 if (response.success) {
//                     await alertService.success({
//                         text: 'L\'inventaire a été lancé avec succès'
//                     });
//                     return true;
//                 } else {
//                     throw new Error(response.message || 'Erreur lors du lancement');
//                 }
//             }

//             return false;
//         } catch (error) {
//             console.error('❌ Erreur lors du lancement:', error);
//             await alertService.error({
//                 text: 'Une erreur est survenue lors du lancement de l\'inventaire'
//             });
//             return false;
//         }
//     }

//     async cancelInventory(inventoryId: number): Promise<boolean> {
//         try {
//             const result = await alertService.confirm({
//                 title: 'Annuler l\'inventaire',
//                 text: 'Êtes-vous sûr de vouloir annuler le lancement de l\'inventaire ?'
//             });

//             if (result.isConfirmed) {
//                 // Appel API pour annuler l'inventaire
//                 const response = await apiService.post(`/inventories/${inventoryId}/cancel/`, {});

//                 if (response.success) {
//                     await alertService.success({
//                         text: 'L\'inventaire a été annulé'
//                     });
//                     return true;
//                 } else {
//                     throw new Error(response.message || 'Erreur lors de l\'annulation');
//                 }
//             }

//             return false;
//         } catch (error) {
//             console.error('❌ Erreur lors de l\'annulation:', error);
//             await alertService.error({
//                 text: 'Une erreur est survenue lors de l\'annulation'
//             });
//             return false;
//         }
//     }

//     async terminateInventory(id: number): Promise<boolean> {
//         try {

//         } catch (error) {
//             console.error('❌ Erreur lors de la terminaison:', error);
//             await alertService.error({
//                 text: 'Une erreur est survenue lors de la fin de l\'inventaire'
//             });
//             return false;
//         }
//     }

//     async closeInventory(inventory: InventoryDetail): Promise<boolean> {
//         try {
//             const result = await alertService.confirm({
//                 title: 'Clôturer l\'inventaire',
//                 text: `Voulez-vous vraiment clôturer définitivement l'inventaire "${inventory.label}" ?`
//             });

//             if (result.isConfirmed) {
//                 // Appel API pour clôturer l'inventaire
//                 const response = await apiService.post(`/inventories/${inventory.id}/close/`, {});

//                 if (response.success) {
//                     await alertService.success({
//                         text: 'L\'inventaire a été clôturé avec succès'
//                     });
//                     return true;
//                 } else {
//                     throw new Error(response.message || 'Erreur lors de la clôture');
//                 }
//             }

//             return false;
//         } catch (error) {
//             console.error('❌ Erreur lors de la clôture:', error);
//             await alertService.error({
//                 text: 'Une erreur est survenue lors de la clôture de l\'inventaire'
//             });
//             return false;
//         }
//     }
// }

// export const inventoryDetailService = new InventoryDetailService();

// Export vide pour faire du fichier un module
export {};
