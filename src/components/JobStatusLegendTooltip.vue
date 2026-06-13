<template>
    <div class="relative inline-block" ref="triggerRef">
        <button
            @mouseenter="showTooltip"
            @mouseleave="hideTooltip"
            class="group flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 text-primary shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 hover:border-primary/30 hover:from-primary/5 hover:to-primary/10 hover:shadow-md hover:ring-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 dark:border-slate-600 dark:from-slate-800 dark:to-slate-800/90 dark:ring-slate-600/50 dark:hover:border-primary/40 dark:hover:ring-primary/30"
            type="button"
            aria-label="Signification des statuts des jobs"
            aria-describedby="job-status-legend-content">
            <svg
                class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>

        <Teleport to="body">
            <Transition name="job-status-tooltip">
                <div
                    v-if="isVisible"
                    id="job-status-legend-content"
                    ref="tooltipRef"
                    role="tooltip"
                    :style="tooltipStyle"
                    class="job-status-tooltip-panel fixed z-[100] max-w-sm overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25),0_0_0_1px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-900/95 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]"
                    style="min-width: min(320px, calc(100vw - 1.5rem)); max-height: min(70vh, 28rem)">
                    <!-- En-tête -->
                    <div
                        class="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3 dark:border-slate-700/80 dark:from-slate-800/90 dark:to-slate-900/80">
                        <p class="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Légende
                        </p>
                        <h4 class="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Statuts des jobs
                        </h4>
                    </div>
                    <!-- Liste (scrollable si besoin) -->
                    <div class="max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain px-3 py-2 scrollbar-thin">
                        <ul class="m-0 list-none p-0">
                            <li
                                v-for="item in legendItems"
                                :key="item.status"
                                class="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors odd:bg-slate-50/50 even:bg-transparent dark:odd:bg-slate-800/40">
                                <span class="shrink-0" :class="item.badgeClass">{{ item.status }}</span>
                                <span
                                    class="min-w-0 flex-1 pt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    {{ item.description }}
                                </span>
                            </li>
                        </ul>
                    </div>
                    <!-- “Queue” visuelle (pointe vers le bouton) -->
                    <div
                        class="job-status-tooltip-caret pointer-events-none absolute h-2.5 w-2.5 rotate-45 border-slate-200/90 dark:border-slate-600/80"
                        :class="caretPositionClass" />
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'
import { JOB_STATUS_BADGE_STYLES } from '@/constants/jobStatus'

const isVisible = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
const caretPositionClass = ref('top-[-5px] border-t border-l bg-gradient-to-br from-slate-50/95 to-white dark:from-slate-800/95 dark:to-slate-900')
let tooltipTimeoutId: number | null = null

const STATUS_DESCRIPTIONS: Record<string, string> = {
    'EN ATTENTE': 'Job en attente de validation',
    VALIDE: 'Job validé',
    AFFECTE: 'Job affecté à une équipe',
    PRET: 'Job prêt pour le comptage',
    TRANSFERT: 'Job en transfert',
    ENTAME: 'Comptage entamé',
    TERMINE: 'Comptage terminé',
    CLOTURE: 'Comptage clôturé'
}

const legendItems = JOB_STATUS_BADGE_STYLES.filter(style => style.value !== 'CLOTURE').map(style => ({
    status: style.value,
    badgeClass: style.class,
    description: STATUS_DESCRIPTIONS[style.value] || style.value
}))

const positionTooltip = () => {
    if (!triggerRef.value || !tooltipRef.value) return

    const triggerRect = triggerRef.value.getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()
    const margin = 10
    const gap = 10
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = triggerRect.bottom + gap
    let left = triggerRect.right - tooltipRect.width
    const placeAbove = top + tooltipRect.height > viewportHeight - margin
    if (placeAbove) {
        top = triggerRect.top - tooltipRect.height - gap
    }

    if (left < margin) left = margin
    if (left + tooltipRect.width > viewportWidth - margin) {
        left = viewportWidth - tooltipRect.width - margin
    }
    if (top < margin) top = margin
    if (top + tooltipRect.height > viewportHeight - margin) {
        top = Math.max(margin, viewportHeight - tooltipRect.height - margin)
    }

    // Flèche : alignée sous / au-dessus du centre du bouton
    const triggerCenterX = triggerRect.left + triggerRect.width / 2
    const centerXInPanel = triggerCenterX - left
    const caretRightPx = Math.max(
        10,
        Math.min(tooltipRect.width - 10, tooltipRect.width - centerXInPanel - 5)
    )

    tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
        '--caret-right': `${caretRightPx}px`
    }

    // Panneau au-dessus → flèche en bas (vers le bouton) ; panneau en dessous → flèche en haut
    caretPositionClass.value = placeAbove
        ? 'bottom-[-5px] border-b border-r bg-white dark:bg-slate-900'
        : 'top-[-5px] border-t border-l bg-gradient-to-br from-slate-50/95 to-white dark:from-slate-800/95 dark:to-slate-900'
}

const showTooltip = async () => {
    if (tooltipTimeoutId) clearTimeout(tooltipTimeoutId)
    tooltipTimeoutId = window.setTimeout(async () => {
        isVisible.value = true
        await nextTick()
        positionTooltip()
        requestAnimationFrame(() => positionTooltip())
    }, 200)
}

const hideTooltip = () => {
    if (tooltipTimeoutId) {
        clearTimeout(tooltipTimeoutId)
        tooltipTimeoutId = null
    }
    isVisible.value = false
}

onUnmounted(() => {
    if (tooltipTimeoutId) {
        clearTimeout(tooltipTimeoutId)
    }
})
</script>

<style scoped>
/* Transition entrée / sortie */
.job-status-tooltip-enter-active,
.job-status-tooltip-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.22s cubic-bezier(0.34, 1.15, 0.64, 1);
}

.job-status-tooltip-enter-from,
.job-status-tooltip-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
}

.job-status-tooltip-leave-active {
    pointer-events: none;
}

/* Flèche positionnée avec la variable (fallback right-6) */
.job-status-tooltip-caret {
    right: var(--caret-right, 1.25rem);
}

/* Scrollbar discrète */
.scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgb(203 213 225 / 0.8) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
    width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgb(203 213 225 / 0.9);
    border-radius: 999px;
}

:global(.dark) .scrollbar-thin {
    scrollbar-color: rgb(71 85 105 / 0.8) transparent;
}

:global(.dark) .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgb(71 85 105 / 0.9);
}
</style>
