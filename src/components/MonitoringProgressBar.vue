<template>
    <div
        class="flex w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        :class="size === 'lg' ? 'h-3' : size === 'md' ? 'h-2.5' : 'h-2'"
        role="img"
        :aria-label="ariaLabel"
        :title="ariaLabel">
        <div
            v-for="seg in segments"
            :key="seg.key"
            :class="seg.class"
            class="h-full transition-[width] duration-500 ease-out"
            :style="{ width: seg.width + '%' }" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CountingProgress } from '@/composables/monitoring/zoneProgress'

const props = withDefaults(defineProps<{ progress: CountingProgress; size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const segments = computed(() => {
    const p = props.progress
    const total = p.total || 1
    return [
        { key: 'termine', value: p.termine, class: 'bg-emerald-500' },
        { key: 'entame', value: p.entame, class: 'bg-amber-400' },
    ]
        .filter((s) => s.value > 0)
        .map((s) => ({ ...s, width: (s.value / total) * 100 }))
})

const ariaLabel = computed(() => {
    const p = props.progress
    return `${p.termine} terminé(s), ${p.entame} en cours, ${p.nonLance} non lancé(s) sur ${p.total} jobs`
})
</script>
