<template>
    <div ref="menuRef" class="action-menu-container relative flex items-center justify-center text-center mt-1">
        <!-- Bouton de déclenchement -->
        <button @click="toggleMenu" :class="[
            'action-menu-trigger group relative p-1.5 rounded-lg transition-all duration-200 ease-in-out',
            'hover:bg-gray-100 dark:hover:bg-gray-800/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-gray-100 dark:focus:bg-gray-800/50',
            'active:scale-95',
            isOpen ? 'bg-gray-100 dark:bg-gray-800/50 shadow-sm' : '',
            props.buttonClass || ''
        ]" :aria-expanded="isOpen" aria-haspopup="true">
            <IconHorizontalDots :class="[
                'action-menu-icon w-4 h-4 transition-all duration-200',
                'text-gray-600 dark:text-gray-400',
                'group-hover:text-gray-900 dark:group-hover:text-gray-200',
                isOpen ? 'rotate-90' : ''
            ]" />
        </button>

        <!-- Menu déroulant avec Teleport -->
        <teleport to="body">
            <transition name="dropdown-transition">
                <div v-if="isOpen" ref="dropdownRef" :style="dropdownStyle"
                    class="action-menu-dropdown fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-200" @click.stop>
                    <!-- Container principal du menu -->
                    <div
                        :class="[
                            'action-menu-content bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200/80 dark:border-gray-700/60 min-w-[160px] overflow-hidden ring-1 ring-black/5 dark:ring-white/5',
                            props.dropdownClass || ''
                        ]">
                        <!-- Liste des actions -->
                        <div class="action-menu-list py-1">
                            <template v-for="(action, i) in filteredActions" :key="i">
                                <!-- Item d'action -->
                                <button @click="handleActionClick(action)" :class="[
                                    'action-menu-item group w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150',
                                    'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                                    'active:bg-gray-100 dark:active:bg-gray-800',
                                    (typeof action.disabled === 'function' ? action.disabled(row) : action.disabled) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                                    action.class || '',
                                    props.actionItemClass || '',
                                    // Couleurs de fond selon le type d'action
                                    action.color === 'primary' ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' : '',
                                    action.color === 'secondary' ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60' : '',
                                    action.color === 'success' ? 'hover:bg-green-50 dark:hover:bg-green-900/20' : '',
                                    action.color === 'warning' ? 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : '',
                                    action.color === 'danger' ? 'hover:bg-red-50 dark:hover:bg-red-900/20' : '',
                                    action.color === 'info' ? 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20' : ''
                                ]" :disabled="typeof action.disabled === 'function' ? action.disabled(row) : action.disabled"
                                    tabindex="-1">
                                    <!-- Icône de l'action -->
                                    <div :class="[
                                        'action-menu-icon-wrapper flex items-center justify-center w-4 h-4 flex-shrink-0 transition-colors duration-150',
                                        'text-gray-500 dark:text-gray-400',
                                        'group-hover:text-gray-700 dark:group-hover:text-gray-200',
                                        (typeof action.disabled === 'function' ? action.disabled(row) : action.disabled) ? '' : 'group-hover:scale-105',
                                        // Couleurs selon le type d'action
                                        action.color === 'primary' ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' : '',
                                        action.color === 'secondary' ? 'group-hover:text-gray-600 dark:group-hover:text-gray-400' : '',
                                        action.color === 'success' ? 'group-hover:text-green-600 dark:group-hover:text-green-400' : '',
                                        action.color === 'warning' ? 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400' : '',
                                        action.color === 'danger' ? 'group-hover:text-red-600 dark:group-hover:text-red-400' : '',
                                        action.color === 'info' ? 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400' : ''
                                    ]">
                                        <!-- Support pour icône composant Vue -->
                                        <component
                                            v-if="action.icon && typeof action.icon === 'object'"
                                            :is="action.icon"
                                            class="action-menu-icon-component w-4 h-4"
                                        />
                                        <!-- Support pour icône personnalisée par nom -->
                                        <component
                                            v-else-if="action.icon && typeof action.icon === 'string' && action.icon.startsWith('icon-')"
                                            :is="getIconComponent(action.icon)"
                                            class="action-menu-icon-component w-4 h-4"
                                        />
                                        <!-- Support pour icône SVG personnalisée -->
                                        <div v-else-if="action.icon && typeof action.icon === 'string' && action.icon.startsWith('<svg')"
                                            v-html="action.icon"
                                            class="action-menu-svg-icon w-4 h-4">
                                        </div>
                                        <!-- Support pour icône emoji ou texte -->
                                        <span v-else-if="action.icon" class="action-menu-text-icon text-sm">{{ action.icon }}</span>
                                    </div>

                                    <!-- Contenu du label -->
                                    <div class="action-menu-label flex-1 min-w-0">
                                        <div :class="[
                                            'action-menu-label-text font-medium text-sm truncate transition-colors duration-150',
                                            'text-gray-700 dark:text-gray-200',
                                            'group-hover:text-gray-900 dark:group-hover:text-gray-50'
                                        ]">
                                            {{ action.label }}
                                        </div>
                                    </div>
                                </button>
                            </template>

                            <!-- Message si aucune action -->
                            <div v-if="filteredActions.length === 0"
                                class="action-menu-empty px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                                <div
                                    class="action-menu-empty-icon w-6 h-6 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <IconHorizontalDots class="w-3 h-3" />
                                </div>
                                <p class="action-menu-empty-text text-xs">Aucune action disponible</p>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import type { ActionConfig } from '@/types/dataTable'
import IconHorizontalDots from '../icon/icon-horizontal-dots.vue'

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

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const filteredActions = computed(() => {
    return props.actions
        .filter(action => action.show ? action.show(props.row) : true)
        .map(action => {
            const labelText = typeof action.label === 'function'
                ? (action.label as Function)(props.row)
                : action.label as string

            return {
                ...action,
                label: labelText
            }
        })
})

// Calcul de la position
const calculatePosition = async () => {
    await nextTick()
    if (!menuRef.value || !dropdownRef.value) return

    const button = menuRef.value.getBoundingClientRect()
    const dropdown = dropdownRef.value
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    // Position initiale (alignement à droite du bouton)
    let top = button.bottom + 4
    let left = button.right - dropdown.offsetWidth

    // Ajustements
    const padding = 12

    // Ajustement horizontal
    if (left < padding) {
        left = button.left
    }
    if (left + dropdown.offsetWidth > viewport.width - padding) {
        left = viewport.width - dropdown.offsetWidth - padding
    }

    // Ajustement vertical - logique simplifiée et plus robuste
    const dropdownHeight = dropdown.offsetHeight
    const spaceBelow = viewport.height - button.bottom
    const spaceAbove = button.top

    // Si il y a assez d'espace en bas, positionner en bas
    if (spaceBelow >= dropdownHeight + padding) {
        top = button.bottom + 4
    }
    // Sinon, positionner au-dessus
    else if (spaceAbove >= dropdownHeight + padding) {
        top = button.top - dropdownHeight - 4
    }
    // Sinon, positionner au centre de l'écran
    else {
        top = Math.max(padding, (viewport.height - dropdownHeight) / 2)
    }

    // S'assurer que le dropdown reste dans les limites de l'écran
    top = Math.max(padding, Math.min(top, viewport.height - dropdownHeight - padding))

    dropdownStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
        minWidth: '160px',
        maxWidth: '220px'
    }
}

// Gestion des événements
const toggleMenu = async () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        // Attendre que le DOM soit mis à jour
        await nextTick()
        // Attendre un peu plus pour s'assurer que le dropdown est rendu
        setTimeout(() => {
            calculatePosition()
        }, 10)
    }
}

const handleActionClick = (action: ActionConfig) => {
    if (typeof action.disabled === 'function' ? action.disabled(props.row) : action.disabled) return

    action.onClick(props.row)
    isOpen.value = false
}

const closeMenu = () => {
    isOpen.value = false
}

// Gestionnaires d'événements globaux
const handleClickOutside = (e: MouseEvent) => {
    if (
        menuRef.value && !menuRef.value.contains(e.target as Node) &&
        dropdownRef.value && !dropdownRef.value.contains(e.target as Node)
    ) {
        closeMenu()
    }
}

const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeMenu()
    }
}

// Gestion du scroll pour recalculer la position
const handleScroll = () => {
    if (isOpen.value) {
        calculatePosition()
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    // Listener global pour le scroll de la page
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Listener pour le resize de la fenêtre
    window.addEventListener('resize', handleScroll, { passive: true })
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleScroll)
})

// Méthodes
const getIconComponent = (iconName: string) => {
    // Utiliser d'abord les icônes personnalisées passées via props
    if (props.iconMap && props.iconMap[iconName]) {
        return props.iconMap[iconName]
    }

    // Fallback vers les icônes par défaut
    const defaultIconMap: Record<string, any> = {
        // Icônes par défaut (peuvent être étendues via props)
        'icon-eye': null,
        'icon-edit': null,
        'icon-trash': null,
        'icon-upload': null,
        'icon-calendar': null,
        'icon-check': null,
        'icon-plus': null,
        'icon-settings': null,
        'icon-download': null,
        'icon-info': null,
        'icon-horizontal-dots': null,
    }
    return defaultIconMap[iconName] || null
}
</script>

<style scoped>
/* Transitions fluides */
.dropdown-transition-enter-active,
.dropdown-transition-leave-active {
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-transition-enter-from {
    opacity: 0;
    transform: scale(0.95) translateY(-2px);
}

.dropdown-transition-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-2px);
}

/* Styles pour éviter les perturbations */
.action-menu-item {
    /* Éviter les sauts de contenu */
    min-height: 2.5rem;
    /* Assurer une transition fluide */
    transition: all 0.15s ease-in-out;
}

.action-menu-item:focus {
    /* Améliorer l'accessibilité */
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
}

/* Styles pour les icônes SVG inline */
.action-menu-item :deep(.action-menu-svg-icon svg) {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
}

/* Éviter les débordements */
.action-menu-item :deep(.action-menu-svg-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
}

/* Améliorer la lisibilité du texte */
.action-menu-item :deep(.action-menu-text-icon) {
    line-height: 1.4;
    font-weight: 500;
}

/* Styles pour les états désactivés */
.action-menu-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

/* Améliorer l'apparence du bouton principal */
.action-menu-trigger {
    /* Éviter les sauts lors du hover */
    border: 1px solid transparent;
    transition: all 0.15s ease-in-out;
}

.action-menu-trigger:hover {
    border-color: #e5e7eb;
}

/* Styles pour le mode sombre */
@media (prefers-color-scheme: dark) {
    .action-menu-trigger:hover {
        border-color: #374151;
    }

    .action-menu-item:focus {
        outline-color: #60a5fa;
    }
}

/* Éviter les conflits avec d'autres composants */
.action-menu-item:not(:disabled):hover {
    background-color: #f9fafb;
}

@media (prefers-color-scheme: dark) {
    .action-menu-item:not(:disabled):hover {
        background-color: #FECD1C;
    }
}

/* Améliorer l'accessibilité */
.action-menu-trigger:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

/* Assurer une taille cohérente pour les icônes */
.action-menu-item :deep(.action-menu-icon-component),
.action-menu-item :deep(.action-menu-svg-icon),
.action-menu-item :deep(.action-menu-text-icon) {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
}

/* Éviter les débordements de texte */
.action-menu-item :deep(.action-menu-label-text) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Améliorer l'espacement */
.action-menu-item {
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
}

/* Styles pour les messages d'état vide */
.action-menu-empty {
    border-bottom: none;
}

/* Éviter les conflits avec les animations */
.dropdown-transition-enter-active .action-menu-item,
.dropdown-transition-leave-active .action-menu-item {
    transition: none;
}

/* Isolation du composant */
.action-menu-container {
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

/* Assurer que le dropdown reste au-dessus */
.action-menu-dropdown {
    z-index: 10000;
}

/* Améliorer l'apparence du contenu */
.action-menu-content {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
    min-width: 180px;
    max-width: 250px;
}

.dark .action-menu-content {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    border-color: #374151;
}

/* Améliorer l'apparence des items d'action */
.action-menu-item {
    border-radius: 8px;
    margin: 3px 6px;
    transition: all 0.15s ease-in-out;
    position: relative;
    overflow: hidden;
}

.action-menu-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(254, 205, 28, 0.1), transparent);
    transition: left 0.3s ease-in-out;
}

.action-menu-item:hover::before {
    left: 100%;
}

.action-menu-item:hover {
    background-color: #f9fafb;
    transform: translateX(2px);
}

.dark .action-menu-item:hover {
    background-color: #374151;
}

/* Améliorer l'apparence des icônes */
.action-menu-icon-wrapper {
    transition: all 0.15s ease-in-out;
    position: relative;
    z-index: 1;
}

.action-menu-item:hover .action-menu-icon-wrapper {
    transform: scale(1.1);
}

/* Améliorer l'apparence du texte */
.action-menu-label-text {
    font-weight: 500;
    transition: color 0.15s ease-in-out;
    position: relative;
    z-index: 1;
}

.action-menu-item:hover .action-menu-label-text {
    color: #374151;
}

.dark .action-menu-item:hover .action-menu-label-text {
    color: #f3f4f6;
}

/* Améliorer l'apparence du bouton principal */
.action-menu-trigger {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
}

.action-menu-trigger::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background-color: rgba(254, 205, 28, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease-in-out, height 0.3s ease-in-out;
}

.action-menu-trigger:hover::before {
    width: 100%;
    height: 100%;
}

/* Améliorer l'apparence de l'icône principale */
.action-menu-icon {
    position: relative;
    z-index: 1;
    transition: transform 0.15s ease-in-out;
}

.action-menu-trigger:hover .action-menu-icon {
    transform: rotate(90deg);
}

/* Styles pour les états vides */
.action-menu-empty-icon {
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

.action-menu-empty-text {
    color: #6b7280;
    font-style: italic;
}

.dark .action-menu-empty-text {
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

    .action-menu-item {
        margin: 2px 4px;
        padding: 8px 12px;
        border-radius: 6px;
    }

    .action-menu-label-text {
        font-size: 13px;
    }
}

/* Accessibilité */
@media (prefers-reduced-motion: reduce) {
    .action-menu-item::before,
    .action-menu-trigger::before {
        display: none;
    }

    .action-menu-item:hover {
        transform: none;
    }

    .action-menu-icon-wrapper:hover {
        transform: none;
    }

    .action-menu-trigger:hover .action-menu-icon {
        transform: none;
    }

    .action-menu-empty-icon {
        animation: none;
    }
}
</style>
