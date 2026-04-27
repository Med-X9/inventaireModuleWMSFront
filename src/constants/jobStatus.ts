export interface JobStatusBadgeStyle {
    value: string
    class: string
}

export const JOB_STATUS_BADGE_STYLES: JobStatusBadgeStyle[] = [
    {
        value: 'EN ATTENTE',
        class: 'inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset'
    },
    {
        value: 'VALIDE',
        class: 'inline-flex items-center rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
    },
    {
        value: 'AFFECTE',
        class: 'inline-flex items-center rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-teal-600/20 ring-inset'
    },
    {
        value: 'PRET',
        class: 'inline-flex items-center rounded-md bg-purple-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-purple-600/20 ring-inset'
    },
    {
        value: 'TRANSFERT',
        class: 'inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset'
    },
    {
        value: 'ENTAME',
        class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset'
    },
    {
        value: 'TERMINE',
        class: 'inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset'
    },
    {
        value: 'CLOTURE',
        class: 'inline-flex items-center rounded-md bg-slate-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
    }
]

export const JOB_STATUS_BADGE_DEFAULT_CLASS =
    'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'

export const JOB_STATUS_FILTER_OPTIONS = JOB_STATUS_BADGE_STYLES.map(({ value }) => ({
    label: value,
    value
}))

export const JOB_STATUS_LABELS: Record<string, string> = {
    'EN ATTENTE': 'Job en attente de validation',
    VALIDE: 'Job validé',
    AFFECTE: 'Job affecté à une équipe',
    PRET: 'Job prêt pour le comptage',
    TRANSFERT: 'Job en transfert',
    ENTAME: 'Comptage entamé',
    TERMINE: 'Comptage terminé',
    CLOTURE: 'Job clôturé'
}
