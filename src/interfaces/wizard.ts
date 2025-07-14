/**
 * Interface pour définir les étapes du Wizard
 */
export interface Step {
    /**
     * Titre de l'étape affiché dans l'en-tête du wizard
     */
    title: string;

    /**
     * Icône optionnelle (nom de la classe ou chemin)
     */
    icon?: string;

    /**
     * Description optionnelle de l'étape
     */
    description?: string;

    /**
     * Indique si l'étape est optionnelle
     */
    optional?: boolean;

    /**
     * Indique si l'étape est désactivée
     */
    disabled?: boolean;

    /**
     * Clés CSS personnalisées pour le style de l'étape
     */
    customClass?: string;

    /**
     * Données supplémentaires pour l'étape
     */
    metadata?: Record<string, any>;
}

/**
 * Interface pour les événements du wizard
 */
export interface WizardEvent {
    /**
     * Index de l'étape précédente
     */
    prev: number;

    /**
     * Index de l'étape actuelle
     */
    current: number;

    /**
     * Données de l'étape
     */
    stepData?: any;
}

/**
 * Interface pour la configuration du wizard
 */
export interface WizardConfig {
    /**
     * Couleur principale du wizard
     */
    color?: string;

    /**
     * Texte du bouton précédent
     */
    backButtonText?: string;

    /**
     * Texte du bouton suivant
     */
    nextButtonText?: string;

    /**
     * Texte du bouton de fin
     */
    finishButtonText?: string;

    /**
     * Indique si le wizard est en mode soumission
     */
    isSubmitting?: boolean;

    /**
     * Indique si l'étape actuelle est valide
     */
    isValid?: boolean;
}