/**
 * Vérification ponctuelle (jetable) : confirme que le package @SMATCH-Digital-dev/vue-system-design
 * INSTALLÉ (2.0.1, pas le code source local) contient bien le fix du cache cellRendererPool.
 * Monte le vrai DataTable publié avec un cellRenderer lisant 2 champs, change seulement le champ
 * annexe (même valeur affichée), vérifie que le rendu se met à jour.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'

describe('VERIF installée: cellRendererPool ne sert pas de HTML obsolète', () => {
    it('un renderer multi-champs se met à jour quand seul le champ annexe change', async () => {
        const columns = [
            {
                field: 'status',
                headerName: 'Statut',
                cellRenderer: (value: unknown, _col: any, row: any) => {
                    const late = row?.dueDate && new Date(row.dueDate) < new Date('2026-01-01')
                    return `<span class="${late ? 'late' : 'ontime'}">${value}</span>`
                }
            }
        ]

        const row1 = { id: 42, status: 'En cours', dueDate: '2025-06-01' }
        const wrapper = mount(DataTable as any, {
            props: {
                columns,
                rowDataProp: [row1],
                actions: []
            }
        })
        await wrapper.vm.$nextTick()

        expect(wrapper.html()).toContain('late')

        // Même id, même valeur affichée, seul dueDate change
        await wrapper.setProps({
            rowDataProp: [{ id: 42, status: 'En cours', dueDate: '2027-01-01' }]
        })
        await wrapper.vm.$nextTick()

        const htmlAfter = wrapper.html()
        console.log('RESULT_HTML_CONTAINS_LATE=' + htmlAfter.includes('late'))
        console.log('RESULT_HTML_CONTAINS_ONTIME=' + htmlAfter.includes('ontime'))
        expect(htmlAfter).toContain('ontime')
    })
})
