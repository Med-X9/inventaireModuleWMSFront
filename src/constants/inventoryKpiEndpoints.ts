/**
 * Catalogue des endpoints KPI
 * Source : INVENTORY_KPI_CATALOG.md
 */

import type { InventoryKpiEndpointDef } from '@/models/InventoryKpi'

/** KPIs communs inventaire + magasin (A / B / C / D / T) */
export const INVENTORY_KPI_ENDPOINTS: readonly InventoryKpiEndpointDef[] = [
    { catalogId: 'KPI-A01', slug: 'nombre-jobs-total', dataKey: 'nombre_jobs_total', category: 'volume' },
    { catalogId: 'KPI-A02', slug: 'nombre-jobs-affectes', dataKey: 'nombre_jobs_affectes', category: 'volume' },
    { catalogId: 'KPI-A03', slug: 'nombre-emplacements-couverts', dataKey: 'nombre_emplacements_couverts', category: 'volume' },

    { catalogId: 'KPI-B01', slug: 'taux-jobs-termines-1er-comptage', dataKey: 'taux_jobs_termines_1er_comptage', category: 'jobs_termines' },
    { catalogId: 'KPI-B02', slug: 'taux-jobs-termines-2e-comptage', dataKey: 'taux_jobs_termines_2e_comptage', category: 'jobs_termines' },

    { catalogId: 'KPI-C01', slug: 'repartition-assignments-1er-comptage', dataKey: 'repartition_assignments_1er_comptage', category: 'assignments' },
    { catalogId: 'KPI-C02', slug: 'repartition-assignments-2e-comptage', dataKey: 'repartition_assignments_2e_comptage', category: 'assignments' },
    { catalogId: 'KPI-C03', slug: 'repartition-assignments-3e-comptage', dataKey: 'repartition_assignments_3e_comptage', category: 'assignments' },
    { catalogId: 'KPI-C04', slug: 'repartition-assignments-nieme-comptage', dataKey: 'repartition_assignments_nieme_comptage', category: 'assignments' },

    { catalogId: 'KPI-D01', slug: 'nombre-ecarts', dataKey: 'nombre_ecarts', category: 'discrepancies' },
    { catalogId: 'KPI-D02', slug: 'nombre-jobs-avec-ecart', dataKey: 'nombre_jobs_avec_ecart', category: 'discrepancies' },
    { catalogId: 'KPI-D03', slug: 'nombre-emplacements-avec-ecart', dataKey: 'nombre_emplacements_avec_ecart', category: 'discrepancies' },
    { catalogId: 'KPI-D04', slug: 'nombre-ecarts-ouverts', dataKey: 'nombre_ecarts_ouverts', category: 'discrepancies' },

    { catalogId: 'KPI-T01', slug: 'nombre-equipes', dataKey: 'nombre_equipes', category: 'teams' },
    { catalogId: 'KPI-T02', slug: 'taux-termine-1er-comptage-par-equipe', dataKey: 'taux_termine_1er_comptage_par_equipe', category: 'teams' },
    { catalogId: 'KPI-T03', slug: 'taux-termine-2e-comptage-par-equipe', dataKey: 'taux_termine_2e_comptage_par_equipe', category: 'teams' },
    { catalogId: 'KPI-T04', slug: 'repartition-1er-comptage-par-equipe', dataKey: 'repartition_1er_comptage_par_equipe', category: 'teams' },
    { catalogId: 'KPI-T05', slug: 'repartition-2e-comptage-par-equipe', dataKey: 'repartition_2e_comptage_par_equipe', category: 'teams' },
    { catalogId: 'KPI-T06', slug: 'equipes-multi-ecarts', dataKey: 'equipes_multi_ecarts', category: 'teams' },
    { catalogId: 'KPI-T07', slug: 'jobs-avec-ecart-par-equipe', dataKey: 'jobs_avec_ecart_par_equipe', category: 'teams' },
] as const

/** KPIs scope inventaire uniquement (S / E) */
export const INVENTORY_LEVEL_ONLY_KPI_ENDPOINTS: readonly InventoryKpiEndpointDef[] = [
    { catalogId: 'KPI-S01', slug: 'nombre-magasins', dataKey: 'nombre_magasins', category: 'stores' },
    {
        catalogId: 'KPI-S02',
        slug: 'repartition-magasins-par-statut',
        dataKey: 'repartition_magasins_par_statut',
        category: 'stores',
    },
    { catalogId: 'KPI-E01', slug: 'nombre-ecarts-stock', dataKey: 'nombre_ecarts_stock', category: 'stock_gaps' },
    {
        catalogId: 'KPI-E02',
        slug: 'nombre-ecarts-stock-valides',
        dataKey: 'nombre_ecarts_stock_valides',
        category: 'stock_gaps',
    },
] as const

/** Catalogue complet pour le dashboard inventaire (tous magasins) */
export const INVENTORY_LEVEL_KPI_ENDPOINTS: readonly InventoryKpiEndpointDef[] = [
    ...INVENTORY_KPI_ENDPOINTS,
    ...INVENTORY_LEVEL_ONLY_KPI_ENDPOINTS,
] as const
