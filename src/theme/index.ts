/**
 * Point d'entrée du système de thème
 * Exporte toutes les configurations de thème (couleurs, typographie)
 * 
 * @module theme
 */

export { colors, darkColors, type ColorKey } from './colors'
export {
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacings,
    typography,
    type TypographyStyle,
} from './typography'

/**
 * Configuration complète du thème
 */
export const theme = {
    colors,
    darkColors,
    typography: {
        fontFamilies,
        fontSizes,
        fontWeights,
        lineHeights,
        letterSpacings,
        styles: typography,
    },
} as const

export default theme

