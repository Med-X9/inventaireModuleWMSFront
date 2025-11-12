<template>
    <!--
        Menu d'actions pour les lignes de DataTable
        Affiche un menu déroulant avec les actions disponibles pour chaque ligne
        Supporte les icônes Vue, SVG, et texte avec gestion des couleurs
    -->
    <div ref="menuRef" class="dt-action-menu-wrapper relative flex items-center justify-center text-center mt-1">
        <!-- Bouton de déclenchement du menu -->
        <button @click="toggleMenu" :class="[
            'dt-action-btn group relative p-1.5 rounded-lg transition-all duration-200 ease-in-out',
            'hover:bg-gray-100 dark:hover:bg-gray-800/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-gray-100 dark:focus:bg-gray-800/50',
            'active:scale-95',
            isOpen ? 'bg-gray-100 dark:bg-gray-800/50 shadow-sm' : '',
            props.buttonClass || ''
        ]" :aria-expanded="isOpen" aria-haspopup="true">
            <!-- Icône de trois points horizontaux -->
            <IconHorizontalDots :class="[
                'dt-action-icon w-4 h-4 transition-all duration-200',
                'text-gray-600 dark:text-gray-400',
                'group-hover:text-gray-900 dark:group-hover:text-gray-200',
                isOpen ? 'rotate-90' : ''
            ]" />
        </button>

        <!-- Menu déroulant avec teleport et positionnement optimisé -->
        <teleport to="body">
            <!-- Backdrop subtil -->
            <transition name="backdrop-transition">
                <div v-if="isOpen" class="dt-dropdown-backdrop fixed inset-0 z-[99998]" @click="closeMenu"></div>
            </transition>
            
            <transition name="dropdown-transition">
                <div v-if="isOpen" ref="dropdownRef" :style="simpleDropdownStyle"
                    class="dt-dropdown-menu fixed z-[99999]" @click.stop>
                    <!-- Container principal du menu avec styles adaptatifs -->
                    <div
                        :class="[
                            'dt-menu-content bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-[180px] overflow-hidden',
                            props.dropdownClass || ''
                        ]">
                        <!-- Liste des actions filtrées et formatées -->
                        <div class="dt-menu-list py-1">
                            <template v-for="(action, i) in filteredActions" :key="i">
                                <!-- Item d'action avec gestion des états et couleurs -->
                                <button @click="handleActionClick(action)" :class="[
                                    'dt-menu-item group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-150',
                                    'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                                    'active:bg-gray-100 dark:active:bg-gray-800',
                                    (typeof action.disabled === 'function' ? action.disabled(row) : action.disabled) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                                    action.class || '',
                                    props.actionItemClass || '',
                                    // Couleurs de fond selon le type d'action (primary, secondary, success, warning, danger, info)
                                    action.color === 'primary' ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' : '',
                                    action.color === 'secondary' ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60' : '',
                                    action.color === 'success' ? 'hover:bg-green-50 dark:hover:bg-green-900/20' : '',
                                    action.color === 'warning' ? 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : '',
                                    action.color === 'danger' ? 'hover:bg-red-50 dark:hover:bg-red-900/20' : '',
                                    action.color === 'info' ? 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20' : ''
                                ]" :disabled="typeof action.disabled === 'function' ? action.disabled(row) : action.disabled"
                                    tabindex="-1">
                                    <!-- Container pour l'icône avec gestion des différents types -->
                                    <div :class="[
                                        'dt-menu-icon-wrapper',
                                        action.color === 'primary' ? 'icon-primary' : '',
                                        action.color === 'secondary' ? 'icon-secondary' : '',
                                        action.color === 'success' ? 'icon-success' : '',
                                        action.color === 'warning' ? 'icon-warning' : '',
                                        action.color === 'danger' ? 'icon-danger' : '',
                                        action.color === 'info' ? 'icon-info' : ''
                                    ]">
                                        <!-- Support pour icône composant Vue (markRaw) -->
                                        <component
                                            v-if="action.icon && typeof action.icon === 'object'"
                                            :is="action.icon"
                                            class="dt-menu-icon-component"
                                        />
                                        <!-- Support pour icône personnalisée par nom (icon-xxx) -->
                                        <component
                                            v-else-if="action.icon && typeof action.icon === 'string' && action.icon.startsWith('icon-')"
                                            :is="getIconComponent(action.icon)"
                                            class="dt-menu-icon-component"
                                        />
                                        <!-- Support pour icône Material Design (mdi-xxx) -->
                                        <i v-else-if="action.icon && typeof action.icon === 'string' && action.icon.startsWith('mdi-')"
                                            :class="['mdi', action.icon, 'dt-menu-mdi-icon']">
                                        </i>
                                        <!-- Support pour icône SVG personnalisée (inline) -->
                                        <div v-else-if="action.icon && typeof action.icon === 'string' && action.icon.startsWith('<svg')"
                                            v-html="action.icon"
                                            class="dt-menu-svg-icon">
                                        </div>
                                        <!-- Support pour icône emoji ou texte -->
                                        <span v-else-if="action.icon" class="dt-menu-text-icon">{{ action.icon }}</span>
                                    </div>

                                    <!-- Contenu du label avec support pour les labels dynamiques -->
                                    <div class="dt-menu-label flex-1 min-w-0">
                                        <div :class="[
                                            'dt-menu-label-text font-medium text-sm truncate transition-colors duration-150',
                                            'text-gray-700 dark:text-gray-200',
                                            'group-hover:text-gray-900 dark:group-hover:text-gray-50'
                                        ]">
                                            {{ action.label }}
                                        </div>
                                    </div>
                                </button>
                            </template>

                            <!-- Message si aucune action disponible -->
                            <div v-if="filteredActions.length === 0"
                                class="dt-menu-empty px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                                <div
                                    class="dt-menu-empty-icon w-6 h-6 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <IconHorizontalDots class="w-3 h-3" />
                                </div>
                                <p class="dt-menu-empty-text text-xs">Aucune action disponible</p>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import type { ActionConfig } from '@/components/DataTable/types/dataTable'
import IconHorizontalDots from '../icon/icon-horizontal-dots.vue'

// Imports des icônes personnalisées
import IconEdit from '../icon/icon-edit.vue'
import IconTrash from '../icon/icon-trash.vue'
import IconEye from '../icon/icon-eye.vue'
import IconUpload from '../icon/icon-upload.vue'
import IconCalendar from '../icon/icon-calendar.vue'
import IconCheck from '../icon/icon-check.vue'
import IconPlus from '../icon/icon-plus.vue'
import IconSettings from '../icon/icon-settings.vue'
import IconDownload from '../icon/icon-download.vue'
import IconInfo from '../icon/icon-info-circle.vue'

/**
 * Props du composant ActionMenu
 *
 * @param actions - Configuration des actions disponibles
 * @param row - Données de la ligne courante
 * @param iconMap - Map d'icônes personnalisées (optionnel)
 * @param buttonClass - Classes CSS pour le bouton principal (optionnel)
 * @param dropdownClass - Classes CSS pour le dropdown (optionnel)
 * @param actionItemClass - Classes CSS pour les items d'action (optionnel)
 */
const props = defineProps<{
    actions: ActionConfig[]
    row: any
    // Props pour personnaliser les icônes
    iconMap?: Record<string, any>
    // Props pour personnaliser l'apparence
    buttonClass?: string
    dropdownClass?: string
    actionItemClass?: string
}>()

// ===== ÉTAT LOCAL =====

/**
 * État d'ouverture du menu
 */
const isOpen = ref(false)

/**
 * Référence vers le conteneur du menu
 */
const menuRef = ref<HTMLElement | null>(null)

/**
 * Référence vers le dropdown
 */
const dropdownRef = ref<HTMLElement | null>(null)

/**
 * Style de positionnement du dropdown
 */
/**
 * Style simplifié pour le positionnement du dropdown
 */
const simpleDropdownStyle = ref<Record<string, string>>({})

// ===== COMPUTED PROPERTIES =====

/**
 * Actions filtrées selon les conditions d'affichage
 * Applique les labels dynamiques si définis comme fonctions
 */
const filteredActions = computed(() => {
    return props.actions
        .filter(action => action.show ? action.show(props.row) : true)
        .map(action => {
            // Gestion des labels dynamiques (fonction ou string)
            const labelText = typeof action.label === 'function'
                ? (action.label as (row: any) => string)(props.row)
                : action.label as string

            return {
                ...action,
                label: labelText
            }
        })
})

// ===== MÉTHODES SIMPLIFIÉES =====
// Plus besoin de calculs complexes avec le positionnement CSS relatif

// ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

/**
 * Bascule l'état d'ouverture du menu
 * Recalcule la position si le menu s'ouvre
 */
const toggleMenu = async () => {
    isOpen.value = !isOpen.value
    
    if (isOpen.value) {
        // Attendre que le DOM soit mis à jour
        await nextTick()
        
        // Calculer la position du dropdown
        if (menuRef.value) {
            const rect = menuRef.value.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            const viewportWidth = window.innerWidth
            
            // Hauteur estimée du dropdown (peut être ajustée selon le contenu)
            const dropdownHeight = 200 // Hauteur estimée du menu
            const footerHeight = 80 // Hauteur estimée du footer
            const safeZone = 20 // Zone de sécurité
            
            // Calculer la position optimale
            let top = rect.bottom + 4
            let left = rect.left
            
            // Vérifier si le dropdown dépasse en bas de la viewport
            if (top + dropdownHeight > viewportHeight - footerHeight - safeZone) {
                // Positionner au-dessus du bouton
                top = rect.top - dropdownHeight - 4
            }
            
            // Vérifier si le dropdown dépasse à droite de la viewport
            if (left + 200 > viewportWidth - 20) {
                left = viewportWidth - 220 // 200px de largeur + 20px de marge
            }
            
            // S'assurer que le dropdown ne dépasse pas à gauche
            if (left < 20) {
                left = 20
            }
            
            // S'assurer que le dropdown ne dépasse pas en haut
            if (top < 20) {
                top = 20
            }
            
            const style = {
                top: `${top}px`,
                left: `${left}px`,
                minWidth: '140px',
                maxWidth: '220px'
            }
            
            simpleDropdownStyle.value = style
        }
    }
}

/**
 * Gère le clic sur une action
 * Vérifie si l'action est désactivée avant d'exécuter
 *
 * @param action - Action cliquée
 */
const handleActionClick = (action: ActionConfig) => {
    if (typeof action.disabled === 'function' ? action.disabled(props.row) : action.disabled) return

    action.onClick(props.row)
    isOpen.value = false
}

/**
 * Ferme le menu
 */
const closeMenu = () => {
    isOpen.value = false
}

// ===== GESTIONNAIRES D'ÉVÉNEMENTS GLOBAUX =====

/**
 * Gère les clics en dehors du menu pour le fermer
 *
 * @param e - Événement de clic
 */
const handleClickOutside = (e: MouseEvent) => {
    if (
        menuRef.value && !menuRef.value.contains(e.target as Node) &&
        dropdownRef.value && !dropdownRef.value.contains(e.target as Node)
    ) {
        closeMenu()
    }
}

/**
 * Gère la touche Escape pour fermer le menu
 *
 * @param e - Événement clavier
 */
const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeMenu()
    }
}

/**
 * Gère le scroll - ferme le menu pour éviter les problèmes de positionnement
 */
const handleScroll = () => {
    if (isOpen.value) {
        isOpen.value = false
    }
}

/**
 * Gère le redimensionnement de la fenêtre - recalcule la position ou ferme le menu
 */
const handleResize = () => {
    if (isOpen.value) {
        // Recalculer la position si le menu est ouvert
        toggleMenu()
    }
}

// ===== LIFECYCLE =====

/**
 * Initialise les event listeners au montage
 */
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    // Listener global pour le scroll de la page
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Listener pour le resize de la fenêtre
    window.addEventListener('resize', handleResize, { passive: true })
})

/**
 * Nettoie les event listeners au démontage
 */
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
})

// ===== MÉTHODES UTILITAIRES =====

/**
 * Récupère le composant icône par nom
 * Utilise d'abord les icônes personnalisées, puis les icônes par défaut
 *
 * @param iconName - Nom de l'icône
 * @returns Composant Vue ou null
 */
const getIconComponent = (iconName: string) => {
    // Utiliser d'abord les icônes personnalisées passées via props
    if (props.iconMap && props.iconMap[iconName]) {
        return props.iconMap[iconName]
    }

    // Map des icônes personnalisées importées
    const iconMap: Record<string, any> = {
        'icon-eye': IconEye,
        'icon-edit': IconEdit,
        'icon-trash': IconTrash,
        'icon-upload': IconUpload,
        'icon-calendar': IconCalendar,
        'icon-check': IconCheck,
        'icon-plus': IconPlus,
        'icon-settings': IconSettings,
        'icon-download': IconDownload,
        'icon-info': IconInfo,
        'icon-horizontal-dots': IconHorizontalDots,
    }
    
    return iconMap[iconName] || null
}
</script>

<style scoped>
/*
    Styles pour le composant ActionMenu
    Inclut les transitions, animations et responsive design
*/

/* Backdrop subtil */
.dt-dropdown-backdrop {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
}

.backdrop-transition-enter-active,
.backdrop-transition-leave-active {
    transition: all 0.2s ease-in-out;
}

.backdrop-transition-enter-from,
.backdrop-transition-leave-to {
    background: rgba(0, 0, 0, 0);
}

/* Transitions fluides pour l'ouverture/fermeture du dropdown */
.dropdown-transition-enter-active,
.dropdown-transition-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-transition-enter-from {
    opacity: 0;
    transform: scale(0.9) translateY(-8px);
}

.dropdown-transition-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
}

/* Séparateur subtil entre les items */
.dt-menu-item + .dt-menu-item {
    border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.dark .dt-menu-item + .dt-menu-item {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.dt-menu-item:first-child {
    margin-top: 6px;
}

.dt-menu-item:last-child {
    margin-bottom: 6px;
}

.dt-menu-item:focus {
    /* Améliorer l'accessibilité */
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
}

/* Styles pour les icônes SVG inline */
.dt-menu-svg-icon :deep(svg) {
    width: 18px !important;
    height: 18px !important;
    flex-shrink: 0;
    display: block;
}

/* Améliorer la lisibilité du texte d'icône */
.dt-menu-text-icon {
    line-height: 1;
    font-weight: 500;
    font-size: 16px;
}

/* Styles pour les états désactivés */
.dt-menu-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

/* Améliorer l'apparence du bouton principal */
.dt-action-btn {
    /* Éviter les sauts lors du hover */
    border: 1px solid transparent;
    transition: all 0.15s ease-in-out;
}

.dt-action-btn:hover {
    border-color: #e5e7eb;
}

/* Styles pour le mode sombre */
@media (prefers-color-scheme: dark) {
    .dt-action-btn:hover {
        border-color: #374151;
    }

    .dt-menu-item:focus {
        outline-color: #60a5fa;
    }
}

/* Éviter les conflits avec d'autres composants */
.dt-menu-item:not(:disabled):hover {
    background-color: #f9fafb;
}

@media (prefers-color-scheme: dark) {
    .dt-menu-item:not(:disabled):hover {
        background-color: #FECD1C;
    }
}

/* Améliorer l'accessibilité */
.dt-action-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

/* Optimiser l'affichage des icônes SVG */
.dt-menu-svg-icon :deep(svg) {
    fill: currentColor;
}

/* Espacement optimisé pour dropdown moderne */
.dt-menu-list {
    padding: 4px 0;
}

/* Styles pour les messages d'état vide */
.dt-menu-empty {
    border-bottom: none;
}

/* Éviter les conflits avec les animations */
.dropdown-transition-enter-active .action-menu-item,
.dropdown-transition-leave-active .dt-menu-item {
    transition: none;
}

/* Isolation du composant */
.dt-action-menu-wrapper {
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

/* Assurer que le dropdown reste au-dessus de tous les éléments */
.dt-dropdown-menu {
    z-index: 99999 !important;
    position: fixed !important;
    pointer-events: auto !important;
    isolation: isolate !important;
}

/* S'assurer que le contenu du dropdown reste au-dessus */
.dt-menu-content {
    position: relative !important;
    z-index: 1 !important;
    pointer-events: auto !important;
}

/* Améliorer l'apparence du contenu du dropdown */
.dt-menu-content {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 12px;
    box-shadow: 
        0 0 0 1px rgba(0, 0, 0, 0.05),
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 20px 25px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(229, 231, 235, 0.8);
    min-width: 180px;
    max-width: 240px;
    background-color: rgba(255, 255, 255, 0.98);
    transform-origin: top;
    animation: dropdownSlideDown 0.2s ease-out;
}

@keyframes dropdownSlideDown {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.dark .dt-menu-content {
    box-shadow: 
        0 0 0 1px rgba(0, 0, 0, 0.3),
        0 4px 6px -1px rgba(0, 0, 0, 0.3),
        0 10px 15px -3px rgba(0, 0, 0, 0.3),
        0 20px 25px -5px rgba(0, 0, 0, 0.4);
    border-color: rgba(55, 65, 81, 0.8);
    background-color: rgba(17, 24, 39, 0.98);
}

/* Améliorer l'apparence des items d'action */
.dt-menu-item {
    border-radius: 6px;
    margin: 2px 6px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    background: transparent;
    font-size: 14px;
    padding: 10px 14px;
    min-height: 42px;
    width: calc(100% - 12px) !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    text-align: left;
    border: none;
}

.dt-menu-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 0;
    background: linear-gradient(180deg, #F7AA0B, #FECD1C);
    transition: height 0.2s ease-in-out;
    border-radius: 0 3px 3px 0;
}

.dt-menu-item:hover::before {
    height: 100%;
}

.dt-menu-item:hover {
    background-color: rgba(247, 170, 11, 0.08);
    transform: translateX(2px);
}

.dark .dt-menu-item:hover {
    background-color: rgba(247, 170, 11, 0.15);
}

/* Améliorer l'apparence des icônes */
.dt-menu-icon-wrapper {
    transition: all 0.2s ease-in-out;
    position: relative;
    z-index: 1;
    width: 20px !important;
    height: 20px !important;
    min-width: 20px;
    min-height: 20px;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    color: #6b7280;
}

.dt-menu-item:hover .dt-menu-icon-wrapper {
    transform: scale(1.1);
    color: #F7AA0B;
}

/* Styles pour les différents types d'icônes */
.dt-menu-icon-component,
.dt-menu-mdi-icon,
.dt-menu-svg-icon {
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    min-height: 18px !important;
    display: block !important;
    flex-shrink: 0 !important;
}

.dt-menu-mdi-icon {
    font-size: 18px !important;
    line-height: 1 !important;
}

/* Couleurs des icônes selon le type */
.icon-primary .dt-menu-icon-component,
.icon-primary .dt-menu-mdi-icon,
.icon-primary .dt-menu-svg-icon {
    color: #3b82f6;
}

.icon-success .dt-menu-icon-component,
.icon-success .dt-menu-mdi-icon,
.icon-success .dt-menu-svg-icon {
    color: #10b981;
}

.icon-warning .dt-menu-icon-component,
.icon-warning .dt-menu-mdi-icon,
.icon-warning .dt-menu-svg-icon {
    color: #F7AA0B;
}

.icon-danger .dt-menu-icon-component,
.icon-danger .dt-menu-mdi-icon,
.icon-danger .dt-menu-svg-icon {
    color: #ef4444;
}

.icon-info .dt-menu-icon-component,
.icon-info .dt-menu-mdi-icon,
.icon-info .dt-menu-svg-icon {
    color: #06b6d4;
}

/* Améliorer l'apparence du label */
.dt-menu-label {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
}

.dt-menu-label-text {
    font-weight: 500;
    transition: all 0.2s ease-in-out;
    position: relative;
    z-index: 1;
    color: #374151;
    font-size: 14px;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}

.dt-menu-item:hover .dt-menu-label-text {
    color: #111827;
    font-weight: 600;
}

.dark .dt-menu-label-text {
    color: #d1d5db;
}

.dark .dt-menu-item:hover .dt-menu-label-text {
    color: #f9fafb;
}

/* Améliorer l'apparence du bouton principal */
.dt-action-btn {
    position: relative;
    overflow: visible;
    border-radius: 8px;
    background: transparent;
    min-width: 32px;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dt-action-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: linear-gradient(135deg, rgba(247, 170, 11, 0.1), rgba(254, 205, 28, 0.15));
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
}

.dt-action-btn:hover::before {
    width: 100%;
    height: 100%;
    opacity: 1;
}

.dt-action-btn:active::before {
    width: 90%;
    height: 90%;
}

/* Améliorer l'apparence de l'icône principale */
.dt-action-icon {
    position: relative;
    z-index: 1;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #6b7280;
}

.dt-action-btn:hover .dt-action-icon {
    transform: rotate(90deg);
    color: #F7AA0B;
}

.dt-action-btn.bg-gray-100 .dt-action-icon {
    color: #F7AA0B;
}

/* Styles pour les états vides */
.dt-menu-empty-icon {
    opacity: 0.6;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 0.6;
    }
    50% {
        opacity: 0.3;
    }
}

.dt-menu-empty-text {
    color: #6b7280;
    font-style: italic;
}

.dark .dt-menu-empty-text {
    color: #9ca3af;
}

/* Améliorer les transitions */
.dropdown-transition-enter-active,
.dropdown-transition-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-transition-enter-from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
}

.dropdown-transition-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
}

/* Responsive */
@media (max-width: 640px) {
    .action-menu-content {
        min-width: 160px;
        max-width: 200px;
    }

    .dt-menu-item {
        margin: 2px 4px;
        padding: 8px 12px;
        border-radius: 6px;
    }

    .dt-menu-label-text {
        font-size: 13px;
    }
}

/* Accessibilité */
@media (prefers-reduced-motion: reduce) {
    .dt-menu-item::before,
    .dt-action-btn::before {
        display: none;
    }

    .dt-menu-item:hover {
        transform: none;
    }

    .dt-action-icon-wrapper:hover {
        transform: none;
    }

    .dt-action-btn:hover .dt-action-icon {
        transform: none;
    }

    .dt-menu-empty-icon {
        animation: none;
    }
}
</style>
