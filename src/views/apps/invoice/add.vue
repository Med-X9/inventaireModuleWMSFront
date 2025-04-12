<template>
  <FormBuilder
    :fields="fields"
    title="Ajouter un nouvel élément"
    submit-label="Ajouter"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import FormBuilder from '@/components/Form/FormBuilder.vue'

interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'email' | 'checkbox' | 'select' | 'date'
  options?: string[]
  props?: Record<string, any>
}

const fields: FieldConfig[] = [
  { key: 'name', label: 'Nom', type: 'text', props: { placeholder: 'Entrez le nom' } },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'birthDate', label: 'Date de naissance', type: 'date' },
  { key: 'gender', label: 'Genre', type: 'select', options: ['Homme', 'Femme', 'Autre'] },
  { key: 'newsletter', label: 'S’abonner à la newsletter', type: 'checkbox' }
]

function handleSubmit(data: Record<string, any>) {
  console.log('Formulaire soumis avec les données :', data)
}
</script>
