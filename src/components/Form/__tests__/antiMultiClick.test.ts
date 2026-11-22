import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import FormBuilder from '@/components/Form/FormBuilder.vue'

const deferred = () => {
    let resolve!: () => void
    const promise = new Promise<void>((r) => { resolve = r })
    return { promise, resolve }
}

describe('ButtonGroup — anti multi-clic', () => {
    it("ignore les clics tant que l'action du bouton est en cours", async () => {
        const d = deferred()
        const onClick = vi.fn(() => d.promise)
        const wrapper = mount(ButtonGroup, {
            props: { buttons: [{ id: 'launch', label: 'Lancer', onClick }] },
            global: { stubs: { MdiIcon: true } },
        })
        const btn = wrapper.get('button')

        await btn.trigger('click')
        await btn.trigger('click')
        await btn.trigger('click')
        expect(onClick).toHaveBeenCalledTimes(1)
        expect(btn.attributes('disabled')).toBeDefined()

        d.resolve()
        await flushPromises()
        expect(btn.attributes('disabled')).toBeUndefined()

        await btn.trigger('click')
        expect(onClick).toHaveBeenCalledTimes(2)
    })

    it("n'appelle pas l'action d'un bouton désactivé", async () => {
        const onClick = vi.fn()
        const wrapper = mount(ButtonGroup, {
            props: { buttons: [{ id: 'x', label: 'X', onClick, disabled: true }] },
            global: { stubs: { MdiIcon: true } },
        })
        await wrapper.get('button').trigger('click')
        expect(onClick).not.toHaveBeenCalled()
    })
})

describe('FormBuilder — anti multi-clic', () => {
    it('attend le handler @submit du parent et bloque les soumissions multiples', async () => {
        const d = deferred()
        const onSubmit = vi.fn(() => d.promise)
        const wrapper = mount(FormBuilder, {
            props: { fields: [], modelValue: {}, onSubmit },
        })
        const submit = wrapper.get('button')

        await submit.trigger('click')
        await submit.trigger('click')
        await submit.trigger('click')
        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(submit.attributes('disabled')).toBeDefined() // toujours bloqué : promesse non résolue

        d.resolve()
        await flushPromises()
        expect(submit.attributes('disabled')).toBeUndefined()
    })
})
