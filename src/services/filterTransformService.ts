import type { ColumnDataType, FilterOperator } from '@/types/ColumnDefinition';

// Interface pour les filtres du DataTable
export interface DataTableFilter {
    filter: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    filterTo?: string;
}

// Interface pour les filtres transformés pour les stores
export interface TransformedFilter {
    filter: string;
    type?: string;
}

// Interface pour les paramètres de requête API
export interface ApiQueryParams {
    [key: string]: string | number | boolean;
}

// Interface pour la configuration des types de champs
export interface FieldTypeConfig {
    [fieldName: string]: {
        type: 'string' | 'number' | 'date' | 'boolean';
        operator?: string;
        apiField?: string;
    };
}

/**
 * Service centralisé pour transformer les filtres du DataTable
 * vers les formats attendus par les différents stores
 * Utilise les opérateurs de filtrage standard
 *
 * EXEMPLES D'UTILISATION :
 *
 * // 1. Utilisation simple avec générateur automatique
 * const filters = { status: { filter: 'EN ATTENTE' }, reference: { filter: 'JOB' } };
 * const jobFilters = FilterTransformService.generateFilters(filters, 'job');
 *
 * // 2. Utilisation avec configuration personnalisée
 * const customConfig = {
 *   name: { type: 'string', operator: 'icontains' },
 *   age: { type: 'number', operator: 'gte' },
 *   birthDate: { type: 'date', operator: 'range' }
 * };
 * const customFilters = FilterTransformService.generateCustomFilters(filters, customConfig, 'userStore');
 *
 * // 3. Utilisation dans n'importe quel composable
 * const onFilterChanged = async (filterModel) => {
 *   const queryParams = FilterTransformService.generateFilters(filterModel, 'inventory');
 *   await store.fetchData(queryParams);
 * };
 */
export class FilterTransformService {

    /**
     * Générateur automatique de transformation des filtres
     * Détecte automatiquement le type de données et applique les bons opérateurs
     */
    static generateFilterTransform(
        filterModel: Record<string, { filter: string }>,
        fieldTypeConfig: FieldTypeConfig,
        storeName?: string
    ): ApiQueryParams {
        const queryParameters: ApiQueryParams = {};

        Object.entries(filterModel).forEach(([fieldName, filterData]) => {
            if (filterData.filter) {
                const fieldConfig = fieldTypeConfig[fieldName];

                if (fieldConfig) {
                    const { type, operator, apiField } = fieldConfig;
                    const targetField = apiField || fieldName;
                    const targetOperator = operator || this.getDefaultOperator(type);

                    switch (type) {
                        case 'string':
                            queryParameters[`${targetField}_${targetOperator}`] = filterData.filter;
                            break;
                        case 'number':
                            if (targetOperator === 'range') {
                                // Pour les plages numériques
                                const [minValue, maxValue] = filterData.filter.split(',');
                                if (minValue) queryParameters[`${targetField}_gte`] = minValue;
                                if (maxValue) queryParameters[`${targetField}_lte`] = maxValue;
                            } else {
                                queryParameters[`${targetField}_${targetOperator}`] = filterData.filter;
                            }
                            break;
                        case 'date':
                            if (targetOperator === 'range') {
                                // Pour les plages de dates
                                const [startDate, endDate] = filterData.filter.split(',');
                                if (startDate) queryParameters[`${targetField}_gte`] = startDate;
                                if (endDate) queryParameters[`${targetField}_lte`] = endDate;
                            } else {
                                queryParameters[`${targetField}_${targetOperator}`] = filterData.filter;
                            }
                            break;
                        case 'boolean':
                            queryParameters[`${targetField}_exact`] = filterData.filter;
                            break;
                    }
                } else {
                    // Fallback : utiliser icontains pour les chaînes
                    queryParameters[`${fieldName}_icontains`] = filterData.filter;
                }
            }
        });

        return queryParameters;
    }

    /**
     * Générateur générique pour tous les types de données
     * Détecte automatiquement le type et applique la configuration appropriée
     */
    static generateFilters(
        filterModel: Record<string, { filter: string }>,
        dataType: 'job' | 'location' | 'inventory' | 'warehouse' | 'user' | 'product' | string
    ): ApiQueryParams {

        // Configuration automatique basée sur le type de données
        const fieldConfig = this.getAutoConfig(dataType);

        return this.generateFilterTransform(filterModel, fieldConfig, `${dataType}Store`);
    }

    /**
     * Obtient la configuration automatique selon le type de données
     */
    private static getAutoConfig(dataType: string): FieldTypeConfig {
        const baseConfig: FieldTypeConfig = {
            // Champs communs
            id: { type: 'number', operator: 'exact' },
            reference: { type: 'string', operator: 'icontains' },
            status: { type: 'string', operator: 'exact' },
            created_at: { type: 'date', operator: 'range' },
            updated_at: { type: 'date', operator: 'range' },
            name: { type: 'string', operator: 'icontains' },
            description: { type: 'string', operator: 'icontains' },
            is_active: { type: 'boolean', operator: 'exact' }
        };

        // Configurations spécifiques par type
        const specificConfigs: Record<string, FieldTypeConfig> = {
            job: {
                ...baseConfig,
                job_id: { type: 'number', operator: 'exact' },
                job_reference: { type: 'string', operator: 'icontains' },
                job_status: { type: 'string', operator: 'exact' },
                warehouse_name: { type: 'string', operator: 'icontains' },
                inventory_reference: { type: 'string', operator: 'icontains' }
            },
            location: {
                ...baseConfig,
                location_reference: { type: 'string', operator: 'icontains' },
                sous_zone: { type: 'string', operator: 'icontains', apiField: 'sous_zone_name' },
                zone: { type: 'string', operator: 'icontains', apiField: 'zone_name' },
                warehouse: { type: 'string', operator: 'icontains', apiField: 'warehouse_name' }
            },
            inventory: {
                ...baseConfig,
                label: { type: 'string', operator: 'icontains' },
                date: { type: 'date', operator: 'exact' },
                warehouse: { type: 'string', operator: 'icontains' },
                account_name: { type: 'string', operator: 'icontains' }
            },
            warehouse: {
                ...baseConfig,
                warehouse_name: { type: 'string', operator: 'icontains' },
                warehouse_type: { type: 'string', operator: 'exact' }
            },
            user: {
                ...baseConfig,
                email: { type: 'string', operator: 'icontains' },
                username: { type: 'string', operator: 'icontains' },
                first_name: { type: 'string', operator: 'icontains' },
                last_name: { type: 'string', operator: 'icontains' },
                age: { type: 'number', operator: 'gte' },
                birth_date: { type: 'date', operator: 'range' }
            },
            product: {
                ...baseConfig,
                title: { type: 'string', operator: 'icontains' },
                price: { type: 'number', operator: 'range' },
                category: { type: 'string', operator: 'exact' },
                is_available: { type: 'boolean', operator: 'exact' }
            }
        };

        return specificConfigs[dataType] || baseConfig;
    }

    /**
     * Générateur personnalisé avec configuration définie par l'utilisateur
     */
    static generateCustomFilters(
        filterModel: Record<string, { filter: string }>,
        customFieldConfig: FieldTypeConfig,
        storeName: string
    ): ApiQueryParams {
        return this.generateFilterTransform(filterModel, customFieldConfig, storeName);
    }

    /**
     * Transforme les filtres du DataTable vers le format générique API
     * Utilise les opérateurs de filtrage standard
     */
    static transformForGenericAPI(
        filterModel: Record<string, { filter: string }>,
        fieldMappings?: Record<string, string>,
        operatorMappings?: Record<string, string>
    ): ApiQueryParams {
        const queryParameters: ApiQueryParams = {};

        Object.entries(filterModel).forEach(([fieldName, filterData]) => {
            if (filterData.filter) {
                // Utiliser le mapping personnalisé ou le champ par défaut
                const apiFieldName = fieldMappings?.[fieldName] || fieldName;

                // Utiliser l'opérateur personnalisé ou 'icontains' par défaut
                const operator = operatorMappings?.[fieldName] || 'icontains';

                queryParameters[`${apiFieldName}_${operator}`] = filterData.filter;
            }
        });

        return queryParameters;
    }

    /**
     * Transforme les filtres avec des opérateurs spécifiques
     * Utilise les opérateurs de filtrage standard
     */
    static transformWithOperators(
        filterModel: Record<string, { filter: string }>,
        operatorMappings?: Record<string, FilterOperator>
    ): Record<string, TransformedFilter> {
        const transformedFilters: Record<string, TransformedFilter> = {};

        Object.entries(filterModel).forEach(([fieldName, filterData]) => {
            if (filterData.filter) {
                // Utiliser l'opérateur personnalisé ou 'icontains' par défaut
                const operator = operatorMappings?.[fieldName] || 'icontains';

                transformedFilters[fieldName] = {
                    filter: filterData.filter,
                    type: operator
                };
            }
        });

        return transformedFilters;
    }

    /**
     * Transforme les filtres avec des opérateurs avancés selon la documentation
     */
    static transformWithAdvancedOperators(
        filterModel: Record<string, { filter: string; operator?: string }>,
        fieldTypeMappings?: Record<string, 'string' | 'number' | 'date' | 'boolean'>
    ): ApiQueryParams {
        const queryParameters: ApiQueryParams = {};

        Object.entries(filterModel).forEach(([fieldName, filterData]) => {
            if (filterData.filter) {
                const fieldType = fieldTypeMappings?.[fieldName] || 'string';
                const operator = filterData.operator || this.getDefaultOperator(fieldType);

                switch (fieldType) {
                    case 'string':
                        queryParameters[`${fieldName}_${operator}`] = filterData.filter;
                        break;
                    case 'number':
                        if (operator === 'range') {
                            // Pour les plages numériques
                            const [minValue, maxValue] = filterData.filter.split(',');
                            if (minValue) queryParameters[`${fieldName}_gte`] = minValue;
                            if (maxValue) queryParameters[`${fieldName}_lte`] = maxValue;
                        } else {
                            queryParameters[`${fieldName}_${operator}`] = filterData.filter;
                        }
                        break;
                    case 'date':
                        if (operator === 'range') {
                            // Pour les plages de dates
                            const [startDate, endDate] = filterData.filter.split(',');
                            if (startDate) queryParameters[`${fieldName}_gte`] = startDate;
                            if (endDate) queryParameters[`${fieldName}_lte`] = endDate;
                        } else {
                            queryParameters[`${fieldName}_${operator}`] = filterData.filter;
                        }
                        break;
                    case 'boolean':
                        queryParameters[`${fieldName}_exact`] = filterData.filter;
                        break;
                }
            }
        });

        return queryParameters;
    }

    /**
     * Obtient l'opérateur par défaut selon le type de champ
     */
    private static getDefaultOperator(fieldType: string): string {
        switch (fieldType) {
            case 'string':
                return 'icontains';
            case 'number':
                return 'exact';
            case 'date':
                return 'exact';
            case 'boolean':
                return 'exact';
            default:
                return 'icontains';
        }
    }
}

// Export d'instances pré-configurées pour faciliter l'utilisation
export const filterTransformers = {
    // Générateur générique principal
    generateFilters: FilterTransformService.generateFilters,
    generateCustomFilters: FilterTransformService.generateCustomFilters,

    // Méthodes existantes pour compatibilité
    transformForGenericAPI: FilterTransformService.transformForGenericAPI,
    withOperators: FilterTransformService.transformWithOperators,
    withAdvancedOperators: FilterTransformService.transformWithAdvancedOperators
};
