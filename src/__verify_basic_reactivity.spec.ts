/**
 * Diagnostic : le DataTable installé (2.0.2) reflète-t-il correctement un changement de
 * rowDataProp après le montage initial (cas le plus basique, sans cellRenderer custom) ?
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

describe('DIAGNOSTIC: reactivite basique rowDataProp', () => {
    it('affiche les nouvelles lignes après changement de rowDataProp (0 -> N lignes, cas InventoryManagement)', async () => {
        const columns = [{ field: 'label', headerName: 'Label' }]

        const wrapper = mount(DataTable as any, {
            props: {
                columns,
                rowDataProp: [],
                actions: []
            }
        })
        await wrapper.vm.$nextTick()
        console.log('INITIAL_HTML_CONTAINS_ALPHA=' + wrapper.html().includes('Alpha'))

        await wrapper.setProps({
            rowDataProp: [{ id: 1, label: 'Alpha' }, { id: 2, label: 'Beta' }]
        })
        await wrapper.vm.$nextTick()
        await new Promise((r) => setTimeout(r, 50))
        await wrapper.vm.$nextTick()

        const html = wrapper.html()
        console.log('AFTER_HTML_CONTAINS_ALPHA=' + html.includes('Alpha'))
        console.log('AFTER_HTML_CONTAINS_BETA=' + html.includes('Beta'))
        expect(html).toContain('Alpha')
        expect(html).toContain('Beta')
    })

    it('met à jour un champ affiché directement quand la valeur change sur la même ligne (même id)', async () => {
        const columns = [{ field: 'status', headerName: 'Statut' }]

        const wrapper = mount(DataTable as any, {
            props: {
                columns,
                rowDataProp: [{ id: 42, status: 'En attente' }],
                actions: []
            }
        })
        await wrapper.vm.$nextTick()
        console.log('INITIAL_HTML_CONTAINS_ATTENTE=' + wrapper.html().includes('En attente'))

        await wrapper.setProps({
            rowDataProp: [{ id: 42, status: 'Termine' }]
        })
        await wrapper.vm.$nextTick()
        await new Promise((r) => setTimeout(r, 50))
        await wrapper.vm.$nextTick()

        const html = wrapper.html()
        console.log('AFTER_HTML_CONTAINS_ATTENTE=' + html.includes('En attente'))
        console.log('AFTER_HTML_CONTAINS_TERMINE=' + html.includes('Termine'))
        expect(html).toContain('Termine')
    })
})
