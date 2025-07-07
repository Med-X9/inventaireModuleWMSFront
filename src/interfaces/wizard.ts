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
}