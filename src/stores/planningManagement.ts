import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { planningManagementService } from '@/services/planningManagementService';
import { alertService } from '@/services/alertService';
import type {
    PlanningManagementResponse,
    WarehouseStats,
    PlanningManagementFilters,
    GlobalPlanningStats,
    DetailedWarehouseStats,
    PerformanceMetrics,
    PlanningReport,
    PlanningNotification,
    PlanningEvent,
    PlanningActivityLog,
    PlanningConfig
} from '@/models/PlanningManagement';

export const usePlanningManagementStore = defineStore('planningManagement', () => {
    // ===== ÉTAT =====

    // Données principales
    const planningData = ref<PlanningManagementResponse | null>(null);
    const warehouses = ref<WarehouseStats[]>([]);
    const currentWarehouse = ref<WarehouseStats | null>(null);
    const detailedWarehouseStats = ref<DetailedWarehouseStats | null>(null);

    // États de chargement
    const loading = ref(false);
    const warehousesLoading = ref(false);
    const detailedStatsLoading = ref(false);
    const globalStatsLoading = ref(false);

    // États d'erreur
    const error = ref<string | null>(null);
    const warehousesError = ref<string | null>(null);
    const detailedStatsError = ref<string | null>(null);
    const globalStatsError = ref<string | null>(null);

    // Statistiques globales
    const globalStats = ref<GlobalPlanningStats | null>(null);

    // Métriques de performance
    const performanceMetrics = ref<PerformanceMetrics[]>([]);
    const performanceMetricsLoading = ref(false);
    const performanceMetricsError = ref<string | null>(null);

    // Rapports
    const reports = ref<PlanningReport[]>([]);
    const currentReport = ref<PlanningReport | null>(null);
    const reportsLoading = ref(false);
    const reportsError = ref<string | null>(null);

    // Notifications
    const notifications = ref<PlanningNotification[]>([]);
    const unreadNotificationsCount = ref(0);
    const notificationsLoading = ref(false);
    const notificationsError = ref<string | null>(null);

    // Événements
    const events = ref<PlanningEvent[]>([]);
    const eventsLoading = ref(false);
    const eventsError = ref<string | null>(null);

    // Logs d'activité
    const activityLogs = ref<PlanningActivityLog[]>([]);
    const activityLogsLoading = ref(false);
    const activityLogsError = ref<string | null>(null);

    // Configuration
    const config = ref<PlanningConfig | null>(null);
    const configLoading = ref(false);
    const configError = ref<string | null>(null);

    // ===== GETTERS =====

    // Données principales
    const getPlanningData = computed(() => planningData.value);
    const getWarehouses = computed(() => warehouses.value);
    const getCurrentWarehouse = computed(() => currentWarehouse.value);
    const getDetailedWarehouseStats = computed(() => detailedWarehouseStats.value);

    // États de chargement
    const getLoading = computed(() => loading.value);
    const getWarehousesLoading = computed(() => warehousesLoading.value);
    const getDetailedStatsLoading = computed(() => detailedStatsLoading.value);
    const getGlobalStatsLoading = computed(() => globalStatsLoading.value);

    // États d'erreur
    const getError = computed(() => error.value);
    const getWarehousesError = computed(() => warehousesError.value);
    const getDetailedStatsError = computed(() => detailedStatsError.value);
    const getGlobalStatsError = computed(() => globalStatsError.value);

    // Statistiques globales
    const getGlobalStats = computed(() => globalStats.value);

    // Métriques de performance
    const getPerformanceMetrics = computed(() => performanceMetrics.value);
    const getPerformanceMetricsLoading = computed(() => performanceMetricsLoading.value);
    const getPerformanceMetricsError = computed(() => performanceMetricsError.value);

    // Rapports
    const getReports = computed(() => reports.value);
    const getCurrentReport = computed(() => currentReport.value);
    const getReportsLoading = computed(() => reportsLoading.value);
    const getReportsError = computed(() => reportsError.value);

    // Notifications
    const getNotifications = computed(() => notifications.value);
    const getUnreadNotificationsCount = computed(() => unreadNotificationsCount.value);
    const getNotificationsLoading = computed(() => notificationsLoading.value);
    const getNotificationsError = computed(() => notificationsError.value);

    // Événements
    const getEvents = computed(() => events.value);
    const getEventsLoading = computed(() => eventsLoading.value);
    const getEventsError = computed(() => eventsError.value);

    // Logs d'activité
    const getActivityLogs = computed(() => activityLogs.value);
    const getActivityLogsLoading = computed(() => activityLogsLoading.value);
    const getActivityLogsError = computed(() => activityLogsError.value);

    // Configuration
    const getConfig = computed(() => config.value);
    const getConfigLoading = computed(() => configLoading.value);
    const getConfigError = computed(() => configError.value);

    // Getters calculés
    const getWarehousesWithJobs = computed(() =>
        warehouses.value.filter(warehouse => warehouse.jobs_count > 0)
    );

    const getWarehousesWithTeams = computed(() =>
        warehouses.value.filter(warehouse => warehouse.teams_count > 0)
    );

    const getActiveWarehouses = computed(() =>
        warehouses.value.filter(warehouse => warehouse.jobs_count > 0 || warehouse.teams_count > 0)
    );

    const getTotalJobs = computed(() =>
        warehouses.value.reduce((total, warehouse) => total + warehouse.jobs_count, 0)
    );

    const getTotalTeams = computed(() =>
        warehouses.value.reduce((total, warehouse) => total + warehouse.teams_count, 0)
    );

    // ===== ACTIONS =====

    // Récupérer les données de planning pour un inventaire
    const fetchPlanningManagement = async (inventoryId: number) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await planningManagementService.getPlanningManagement(inventoryId);
            planningData.value = response;
            warehouses.value = response.data;

            // Mettre à jour les statistiques globales si disponibles
            if (response.warehouses_count !== undefined) {
                globalStats.value = {
                    total_warehouses: response.warehouses_count,
                    total_jobs: getTotalJobs.value,
                    total_teams: getTotalTeams.value,
                    active_warehouses: getActiveWarehouses.value.length,
                    warehouses_with_jobs: getWarehousesWithJobs.value.length,
                    warehouses_with_teams: getWarehousesWithTeams.value.length
                };
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des données de planning';
            await alertService.error({ text: 'Erreur lors du chargement des données de planning' });
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Récupérer les statistiques globales
    const fetchGlobalStats = async () => {
        globalStatsLoading.value = true;
        globalStatsError.value = null;

        try {
            globalStats.value = await planningManagementService.getGlobalStats();
        } catch (err) {
            globalStatsError.value = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques globales';
            await alertService.error({ text: 'Erreur lors du chargement des statistiques globales' });
            throw err;
        } finally {
            globalStatsLoading.value = false;
        }
    };

    // Récupérer les statistiques détaillées d'un warehouse
    const fetchDetailedWarehouseStats = async (warehouseId: number) => {
        detailedStatsLoading.value = true;
        detailedStatsError.value = null;

        try {
            detailedWarehouseStats.value = await planningManagementService.getDetailedWarehouseStats(warehouseId);
        } catch (err) {
            detailedStatsError.value = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques détaillées';
            await alertService.error({ text: 'Erreur lors du chargement des statistiques détaillées' });
            throw err;
        } finally {
            detailedStatsLoading.value = false;
        }
    };

    // Récupérer les métriques de performance
    const fetchPerformanceMetrics = async (filters?: PlanningManagementFilters) => {
        performanceMetricsLoading.value = true;
        performanceMetricsError.value = null;

        try {
            performanceMetrics.value = await planningManagementService.getPerformanceMetrics(filters);
        } catch (err) {
            performanceMetricsError.value = err instanceof Error ? err.message : 'Erreur lors du chargement des métriques de performance';
            await alertService.error({ text: 'Erreur lors du chargement des métriques de performance' });
            throw err;
        } finally {
            performanceMetricsLoading.value = false;
        }
    };

    // Générer un rapport
    const generateReport = async (reportType: 'daily' | 'weekly' | 'monthly' | 'custom', options: {
        inventoryId?: number;
        dateFrom?: string;
        dateTo?: string;
        warehouseIds?: number[];
    }) => {
        reportsLoading.value = true;
        reportsError.value = null;

        try {
            const report = await planningManagementService.generateReport(reportType, options);
            currentReport.value = report;
            reports.value.push(report);
            await alertService.success({ text: 'Rapport généré avec succès' });
            return report;
        } catch (err) {
            reportsError.value = err instanceof Error ? err.message : 'Erreur lors de la génération du rapport';
            await alertService.error({ text: 'Erreur lors de la génération du rapport' });
            throw err;
        } finally {
            reportsLoading.value = false;
        }
    };

    // Récupérer les notifications
    const fetchNotifications = async (filters?: {
        read?: boolean;
        type?: string;
        warehouseId?: number;
    }) => {
        notificationsLoading.value = true;
        notificationsError.value = null;

        try {
            notifications.value = await planningManagementService.getNotifications(filters);
            unreadNotificationsCount.value = notifications.value.filter(n => !n.read).length;
        } catch (err) {
            notificationsError.value = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications';
            await alertService.error({ text: 'Erreur lors du chargement des notifications' });
            throw err;
        } finally {
            notificationsLoading.value = false;
        }
    };

    // Marquer une notification comme lue
    const markNotificationAsRead = async (notificationId: string) => {
        try {
            await planningManagementService.markNotificationAsRead(notificationId);

            // Mettre à jour l'état local
            const notification = notifications.value.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                unreadNotificationsCount.value = notifications.value.filter(n => !n.read).length;
            }
        } catch (err) {
            await alertService.error({ text: 'Erreur lors du marquage de la notification' });
            throw err;
        }
    };

    // Récupérer les événements
    const fetchEvents = async (filters?: {
        eventType?: string;
        warehouseId?: number;
        dateFrom?: string;
        dateTo?: string;
    }) => {
        eventsLoading.value = true;
        eventsError.value = null;

        try {
            events.value = await planningManagementService.getEvents(filters);
        } catch (err) {
            eventsError.value = err instanceof Error ? err.message : 'Erreur lors du chargement des événements';
            await alertService.error({ text: 'Erreur lors du chargement des événements' });
            throw err;
        } finally {
            eventsLoading.value = false;
        }
    };

    // Récupérer les logs d'activité
    const fetchActivityLogs = async (filters?: {
        entityType?: string;
        entityId?: number;
        userId?: number;
        dateFrom?: string;
        dateTo?: string;
    }) => {
        activityLogsLoading.value = true;
        activityLogsError.value = null;

        try {
            activityLogs.value = await planningManagementService.getActivityLogs(filters);
        } catch (err) {
            activityLogsError.value = err instanceof Error ? err.message : 'Erreur lors du chargement des logs d\'activité';
            await alertService.error({ text: 'Erreur lors du chargement des logs d\'activité' });
            throw err;
        } finally {
            activityLogsLoading.value = false;
        }
    };

    // Récupérer la configuration
    const fetchConfig = async () => {
        configLoading.value = true;
        configError.value = null;

        try {
            config.value = await planningManagementService.getConfig();
        } catch (err) {
            configError.value = err instanceof Error ? err.message : 'Erreur lors du chargement de la configuration';
            await alertService.error({ text: 'Erreur lors du chargement de la configuration' });
            throw err;
        } finally {
            configLoading.value = false;
        }
    };

    // Mettre à jour la configuration
    const updateConfig = async (newConfig: Partial<PlanningConfig>) => {
        configLoading.value = true;
        configError.value = null;

        try {
            config.value = await planningManagementService.updateConfig(newConfig);
            await alertService.success({ text: 'Configuration mise à jour avec succès' });
        } catch (err) {
            configError.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la configuration';
            await alertService.error({ text: 'Erreur lors de la mise à jour de la configuration' });
            throw err;
        } finally {
            configLoading.value = false;
        }
    };

    // Rechercher des warehouses
    const searchWarehouses = async (query: string) => {
        try {
            return await planningManagementService.searchWarehouses(query);
        } catch (err) {
            console.error('Erreur lors de la recherche de warehouses:', err);
            throw err;
        }
    };

    // Récupérer les statistiques en temps réel
    const fetchRealTimeStats = async (inventoryId: number) => {
        try {
            const response = await planningManagementService.getRealTimeStats(inventoryId);
            planningData.value = response;
            warehouses.value = response.data;
            return response;
        } catch (err) {
            console.error('Erreur lors de la récupération des statistiques en temps réel:', err);
            throw err;
        }
    };

    // Synchroniser les données
    const syncPlanningData = async (inventoryId: number) => {
        try {
            await planningManagementService.syncPlanningData(inventoryId);
            await alertService.success({ text: 'Données synchronisées avec succès' });
            return true;
        } catch (err) {
            await alertService.error({ text: 'Erreur lors de la synchronisation des données' });
            throw err;
        }
    };

    // Valider la configuration
    const validatePlanningConfig = async (inventoryId: number) => {
        try {
            return await planningManagementService.validatePlanningConfig(inventoryId);
        } catch (err) {
            console.error('Erreur lors de la validation de la configuration:', err);
            throw err;
        }
    };

    // Sélectionner un warehouse
    const selectWarehouse = (warehouse: WarehouseStats) => {
        currentWarehouse.value = warehouse;
    };

    // Réinitialiser le store
    const resetStore = () => {
        planningData.value = null;
        warehouses.value = [];
        currentWarehouse.value = null;
        detailedWarehouseStats.value = null;
        globalStats.value = null;
        performanceMetrics.value = [];
        reports.value = [];
        currentReport.value = null;
        notifications.value = [];
        unreadNotificationsCount.value = 0;
        events.value = [];
        activityLogs.value = [];
        config.value = null;

        // Réinitialiser les erreurs
        error.value = null;
        warehousesError.value = null;
        detailedStatsError.value = null;
        globalStatsError.value = null;
        performanceMetricsError.value = null;
        reportsError.value = null;
        notificationsError.value = null;
        eventsError.value = null;
        activityLogsError.value = null;
        configError.value = null;
    };

    return {
        // Getters
        getPlanningData,
        getWarehouses,
        getCurrentWarehouse,
        getDetailedWarehouseStats,
        getLoading,
        getWarehousesLoading,
        getDetailedStatsLoading,
        getGlobalStatsLoading,
        getError,
        getWarehousesError,
        getDetailedStatsError,
        getGlobalStatsError,
        getGlobalStats,
        getPerformanceMetrics,
        getPerformanceMetricsLoading,
        getPerformanceMetricsError,
        getReports,
        getCurrentReport,
        getReportsLoading,
        getReportsError,
        getNotifications,
        getUnreadNotificationsCount,
        getNotificationsLoading,
        getNotificationsError,
        getEvents,
        getEventsLoading,
        getEventsError,
        getActivityLogs,
        getActivityLogsLoading,
        getActivityLogsError,
        getConfig,
        getConfigLoading,
        getConfigError,

        // Getters calculés
        getWarehousesWithJobs,
        getWarehousesWithTeams,
        getActiveWarehouses,
        getTotalJobs,
        getTotalTeams,

        // Actions
        fetchPlanningManagement,
        fetchGlobalStats,
        fetchDetailedWarehouseStats,
        fetchPerformanceMetrics,
        generateReport,
        fetchNotifications,
        markNotificationAsRead,
        fetchEvents,
        fetchActivityLogs,
        fetchConfig,
        updateConfig,
        searchWarehouses,
        fetchRealTimeStats,
        syncPlanningData,
        validatePlanningConfig,
        selectWarehouse,
        resetStore
    };
});
