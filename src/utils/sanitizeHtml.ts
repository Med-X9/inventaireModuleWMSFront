import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['strong', 'em', 'b', 'i', 'span', 'br']
const ALLOWED_ATTR = ['class']

/**
 * Sanitise une chaîne HTML avant affichage (v-html).
 * Autorise uniquement une mise en forme légère (gras, classes utilitaires).
 */
export function sanitizeHtml(dirty: string): string {
    if (!dirty) {
        return ''
    }
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
    })
}
