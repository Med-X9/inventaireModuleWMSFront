/**
 * Couleurs du monitoring, alignées sur la palette des graphiques du design system
 * (PieChart / BarChart de @SMATCH-Digital-dev/vue-system-design).
 *
 * Sens : terminé = vert, en cours = orange, en attente / non lancé = gris,
 * emplacements = bleu, équipes = jaune de marque.
 */
export const MONITORING_COLORS = {
    done: '#50C878',
    progress: '#F59E0B',
    wait: '#B4B6BA',
    location: '#4A90E2',
    team: '#FECD1C',
} as const

/** Variables CSS posées sur la racine du dashboard (utilisées via bg-[var(--m-done)]…) */
export const MONITORING_CSS_VARS: Record<string, string> = {
    '--m-done': MONITORING_COLORS.done,
    '--m-progress': MONITORING_COLORS.progress,
    '--m-wait': MONITORING_COLORS.wait,
    '--m-loc': MONITORING_COLORS.location,
    '--m-team': MONITORING_COLORS.team,
}
