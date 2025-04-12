<template>
    <FormBuilder
      :fields="fields"
      :initialData="initialData"
      title="Modifier l'élément"
      submit-label="Enregistrer"
      @submit="handleEdit"
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
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'birthDate', label: 'Date de naissance', type: 'date' },
    { key: 'gender', label: 'Genre', type: 'select', options: ['Homme', 'Femme', 'Autre'] },
    { key: 'newsletter', label: 'S’abonner à la newsletter', type: 'checkbox' }
  ]
  
  const initialData = {
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    birthDate: '1990-05-20',
    gender: 'Homme',
    newsletter: true
  }
  
  function handleEdit(data: Record<string, any>) {
    console.log('Modification enregistrée :', data)
  }
  </script>
  