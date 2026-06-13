import { defineComponent, h, markRaw, type Component } from 'vue'
import MdiIcon from '@/components/MdiIcon.vue'

/**
 * Crée un composant Vue à partir d'une icône MDI (pour SidebarItem, etc.).
 */
export function createMdiIconComponent(
    name: string,
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'sm'
): Component {
    return markRaw(
        defineComponent({
            name: `MdiIcon_${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
            setup() {
                return () => h(MdiIcon, { name, size })
            },
        })
    )
}
