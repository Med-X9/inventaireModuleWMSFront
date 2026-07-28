import type { RouteRecordRaw } from 'vue-router'

export const inventoryRoutes: RouteRecordRaw[] = [
    {
        path: '/inventory/create',
        name: 'inventory-create',
        component: () => import(/* webpackChunkName: "inventory-create" */ '@/views/Inventory/InventoryCreation.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/management',
        name: 'inventory-list',
        component: () => import(/* webpackChunkName: "inventory-list" */ '@/views/Inventory/Management/InventoryManagement.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/results',
        name: 'inventory-results',
        component: () => import(/* webpackChunkName: "inventory-results" */ '@/views/Inventory/Results/InventoryResults.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/job-tracking',
        name: 'inventory-job-tracking',
        component: () => import(/* webpackChunkName: "inventory-job-tracking" */ '@/views/Inventory/Results/JobTracking.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/generated-pdfs',
        name: 'inventory-generated-pdfs',
        component: () => import(/* webpackChunkName: "inventory-generated-pdfs" */ '@/views/Inventory/GeneratedPdfs.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/import-tracking',
        name: 'inventory-import-tracking',
        component: () => import(/* webpackChunkName: "inventory-import-tracking" */ '@/views/Inventory/ImportTracking.vue'),
        props: (route) => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/detail',
        name: 'inventory-detail',
        component: () => import(/* webpackChunkName: "inventory-detail" */ '@/views/Inventory/InventoryDetail.vue'),
        props: (route) => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/planning',
        name: 'inventory-planning',
        component: () => import(/* webpackChunkName: "inventory-planning" */ '@/views/Inventory/Planning.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/affecter',
        name: 'inventory-affecter',
        component: () => import(/* webpackChunkName: "inventory-affecter" */ '@/views/Inventory/Affecter.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/reaffectation',
        name: 'inventory-reaffectation',
        component: () => import(/* webpackChunkName: "inventory-reaffectation" */ '@/views/Inventory/Reaffectation.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/edit',
        name: 'inventory-edit',
        component: () => import(/* webpackChunkName: "inventory-edit" */ '@/views/Inventory/InventoryCreation.vue'),
        props: (route) => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/configure',
        name: 'inventory-configure',
        component: () => import(/* webpackChunkName: "inventory-configure" */ '@/views/Inventory/InventoryConfiguration.vue'),
        props: (route) => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/planning-management',
        name: 'planning-management',
        component: () => import(/* webpackChunkName: "planning-management" */ '@/views/Inventory/PlanningManagement.vue'),
        props: (route) => ({ reference: route.params.reference as string }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/launch-jobs',
        name: 'jobs-launch',
        component: () => import(/* webpackChunkName: "jobs-launch" */ '@/views/Inventory/LaunchJobs.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/grid-demo',
        name: 'inventory-grid-demo',
        component: () => import(/* webpackChunkName: "inventory-grid-demo" */ '@/views/Inventory/InventoryGridDemo.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/job-management',
        name: 'inventory-job-management',
        component: () => import(/* webpackChunkName: "inventory-job-management" */ '@/views/Inventory/JobManagement.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:inventoryId/:warehouseId/monitoring/pivot',
        name: 'inventory-monitoring-pivot',
        component: () => import(/* webpackChunkName: "inventory-monitoring-pivot" */ '@/views/Inventory/MonitoringPivotTable.vue'),
        props: (route) => ({
            inventoryId: route.params.inventoryId as string,
            warehouseId: route.params.warehouseId as string,
        }),
        meta: { requiresAuth: true, layout: 'monitoring' },
    },
    {
        path: '/inventory/:reference/:warehouse/monitoring',
        name: 'inventory-monitoring',
        component: () => import(/* webpackChunkName: "inventory-monitoring" */ '@/views/Inventory/Monitoring.vue'),
        props: (route) => ({
            inventoryReference: route.params.reference as string,
            warehouseReference: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true, layout: 'monitoring' },
    },
    {
        path: '/inventory/:reference/:warehouse/kpi-dashboard',
        name: 'inventory-kpi-dashboard',
        component: () => import(/* webpackChunkName: "inventory-kpi-dashboard" */ '@/views/Inventory/InventoryKpiDashboard.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/kpi-dashboard',
        name: 'inventory-level-kpi',
        component: () => import(/* webpackChunkName: "inventory-level-kpi" */ '@/views/Inventory/InventoryLevelKpiDashboard.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/stock-import',
        name: 'inventory-stock-import',
        component: () => import(/* webpackChunkName: "inventory-stock-import" */ '@/views/Inventory/TheoreticalStockImport.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
    {
        path: '/inventory/:reference/:warehouse/stock-gaps',
        name: 'inventory-stock-gaps',
        component: () => import(/* webpackChunkName: "inventory-stock-gaps" */ '@/views/Inventory/StockGaps.vue'),
        props: (route) => ({
            reference: route.params.reference as string,
            warehouse: route.params.warehouse as string,
        }),
        meta: { requiresAuth: true },
    },
]
