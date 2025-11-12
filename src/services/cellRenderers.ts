/**
 * Service de cell renderers pour DataTable
 * Permet de personnaliser l'affichage des cellules de manière modulaire
 */

export interface CellRendererConfig {
    type: string
    renderer: (value: any, column: any, row: any, rowIndex?: number) => string
    priority?: number
}

export interface BadgeStyle {
    value: string
    class: string
    icon?: string
}

export interface NestedDataConfig {
    key: string
    displayKey?: string
    countSuffix?: string
    expandable?: boolean
    iconCollapsed?: string
    iconExpanded?: string
}

export class CellRenderersService {
    private renderers: Map<string, CellRendererConfig> = new Map()

    constructor() {
        this.registerDefaultRenderers()
    }

    /**
     * Enregistre un nouveau renderer
     */
    registerRenderer(config: CellRendererConfig): void {
        this.renderers.set(config.type, config)
    }

    /**
     * Récupère le renderer approprié pour une colonne
     */
    getRenderer(column: any): ((value: any, column: any, row: any, rowIndex?: number) => string) | null {
        // Vérifier si la colonne a un renderer personnalisé
        if (column.cellRenderer && typeof column.cellRenderer === 'function') {
            return column.cellRenderer
        }

        // Vérifier si la colonne a un type de renderer spécifié
        if (column.rendererType) {
            const renderer = this.renderers.get(column.rendererType)
            if (renderer) {
                return renderer.renderer
            }
        }

        // Détection automatique basée sur le type de colonne
        return this.detectRenderer(column)
    }

    /**
     * Détecte automatiquement le renderer à utiliser
     */
    private detectRenderer(column: any): ((value: any, column: any, row: any, rowIndex?: number) => string) | null {
        // Par ordre de priorité
        const checks = [
            () => column.badgeStyles ? this.badgeRenderer : null,
            () => column.nestedData ? this.nestedDataRenderer : null,
            () => column.dataType === 'date' || column.dataType === 'datetime' ? this.dateRenderer : null,
            () => column.dataType === 'boolean' ? this.booleanRenderer : null,
            () => column.dataType === 'number' ? this.numberRenderer : null,
            () => column.dataType === 'object' ? this.objectRenderer : null,
            () => column.dataType === 'currency' ? this.currencyRenderer : null,
            () => column.dataType === 'percentage' ? this.percentageRenderer : null
        ]

        for (const check of checks) {
            const renderer = check()
            if (renderer) {
                return renderer
            }
        }

        return null
    }

    /**
     * Enregistre les renderers par défaut
     */
    private registerDefaultRenderers(): void {
        this.registerRenderer({
            type: 'badge',
            renderer: this.badgeRenderer,
            priority: 1
        })

        this.registerRenderer({
            type: 'date',
            renderer: this.dateRenderer,
            priority: 2
        })

        this.registerRenderer({
            type: 'boolean',
            renderer: this.booleanRenderer,
            priority: 3
        })

        this.registerRenderer({
            type: 'number',
            renderer: this.numberRenderer,
            priority: 4
        })

        this.registerRenderer({
            type: 'object',
            renderer: this.objectRenderer,
            priority: 5
        })

        this.registerRenderer({
            type: 'currency',
            renderer: this.currencyRenderer,
            priority: 6
        })

        this.registerRenderer({
            type: 'percentage',
            renderer: this.percentageRenderer,
            priority: 7
        })
    }

    /**
     * Renderer générique pour les badges avec styles configurables
     */
    private badgeRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (!value) return '-'

        // Récupérer les styles de badge définis dans la colonne
        const badgeStyles: BadgeStyle[] = column.badgeStyles || []
        const baseClass = column.badgeBaseClass || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
        const defaultClass = column.badgeDefaultClass || 'bg-gray-100 text-gray-800'

        // Chercher le style pour cette valeur - comparaison plus robuste
        const valueStr = String(value).trim().toLowerCase()
        const style = badgeStyles.find(s => {
            const styleValue = String(s.value).trim().toLowerCase()
            return styleValue === valueStr
        })

        // Construire le badge
        const badgeClass = style ? style.class : defaultClass
        const icon = style?.icon ? `${style.icon} ` : ''

        const result = `<span class="${baseClass} ${badgeClass}">
            ${icon}${value}
        </span>`

        return result
    }

    /**
     * Renderer pour les données imbriquées avec count et expansion
     */
    private nestedDataRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (!value) return '-'

        const config: NestedDataConfig = column.nestedData
        if (!config) {
            return String(value)
        }

        // Si c'est un tableau, afficher le count
        if (Array.isArray(value)) {
            const count = value.length
            const suffix = config.countSuffix || 'éléments'
            const displayText = `${count} ${suffix}`

            return displayText
        }

        // Si c'est un objet, essayer d'extraire la valeur selon displayKey
        if (typeof value === 'object' && value !== null) {
            const displayKey = config.displayKey || config.key
            const displayValue = value[displayKey] || value[config.key]

            if (displayValue !== undefined) {
                return String(displayValue)
            }
        }

        return String(value)
    }

    /**
     * Renderer pour les dates
     */
    private dateRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (!value) return '-'

        try {
            const date = new Date(value)
            if (isNaN(date.getTime())) return String(value)

            const format = column.dateFormat || 'fr-FR'
            const options = column.dateOptions || {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }

            return date.toLocaleDateString(format, options)
        } catch (error) {
            return String(value)
        }
    }

    /**
     * Renderer pour les booléens
     */
    private booleanRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (value === null || value === undefined) return '-'

        const trueText = column.trueText || 'Oui'
        const falseText = column.falseText || 'Non'

        return value ? trueText : falseText
    }

    /**
     * Renderer pour les nombres
     */
    private numberRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (value === null || value === undefined) return '-'

        const number = Number(value)
        if (isNaN(number)) return String(value)

        const locale = column.locale || 'fr-FR'
        const options = column.numberOptions || {}

        return number.toLocaleString(locale, options)
    }

    /**
     * Renderer pour les objets
     */
    private objectRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (!value || typeof value !== 'object') return String(value)

        // Propriétés prioritaires pour l'affichage
        const priorityProps = ['name', 'label', 'reference', 'id', 'title']

        for (const prop of priorityProps) {
            if (value[prop] !== undefined) {
                return String(value[prop])
            }
        }

        // Formatage spécial pour certains objets
        if (value.zone && value.sous_zone) {
            return `${value.zone} / ${value.sous_zone}`
        }

        if (value.warehouse && value.warehouse_name) {
            return value.warehouse_name
        }

        // Fallback : première propriété
        const keys = Object.keys(value)
        if (keys.length > 0) {
            return String(value[keys[0]])
        }

        return '[Objet]'
    }

    /**
     * Renderer pour les devises
     */
    private currencyRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (value === null || value === undefined) return '-'

        const number = Number(value)
        if (isNaN(number)) return String(value)

        const currency = column.currency || 'EUR'
        const locale = column.locale || 'fr-FR'

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(number)
    }

    /**
     * Renderer pour les pourcentages
     */
    private percentageRenderer = (value: any, column: any, row: any, rowIndex?: number): string => {
        if (value === null || value === undefined) return '-'

        const number = Number(value)
        if (isNaN(number)) return String(value)

        const locale = column.locale || 'fr-FR'
        const decimals = column.decimals || 2

        return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number / 100)
    }
}

// Instance singleton
export const cellRenderersService = new CellRenderersService()
