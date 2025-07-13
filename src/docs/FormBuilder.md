# FormBuilder Component

## Vue d'ensemble

Le composant `FormBuilder` est un générateur de formulaires dynamiques et réutilisables pour Vue 3. Il permet de créer des formulaires complexes à partir d'une configuration simple et déclarative.

## Fonctionnalités

- ✅ **Génération dynamique de formulaires**
- ✅ **Support de multiples types de champs**
- ✅ **Validation intégrée**
- ✅ **Grille responsive**
- ✅ **Thème sombre**
- ✅ **Accessibilité**
- ✅ **TypeScript support**
- ✅ **Composants modulaires**

## Types de champs supportés

| Type | Description | Props spécifiques |
|------|-------------|-------------------|
| `text` | Champ texte simple | `placeholder`, `maxlength` |
| `email` | Champ email | `placeholder` |
| `date` | Sélecteur de date | `min`, `max`, `enableTime` |
| `select` | Liste déroulante | `options`, `multiple`, `searchable` |
| `radio` | Boutons radio simples | `options` |
| `radio-group` | Groupe de boutons radio | `radioOptions` |
| `checkbox` | Case à cocher | - |
| `button-group` | Groupe de boutons | `options` |
| `multi-select-with-dates` | Sélection multiple avec dates | `options`, `itemKey`, `dateLabel` |

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `fields` | `FieldConfig[]` | - | Configuration des champs |
| `modelValue` | `Record<string, unknown>` | - | Données du formulaire (v-model) |
| `title` | `string` | - | Titre du formulaire |
| `columns` | `number` | `3` | Nombre de colonnes dans la grille |
| `hideSubmit` | `boolean` | `false` | Masquer le bouton de soumission |
| `submitLabel` | `string` | `'Enregistrer'` | Texte du bouton de soumission |

## Événements

| Événement | Payload | Description |
|-----------|---------|-------------|
| `submit` | `data` | Émis lors de la soumission |
| `update:modelValue` | `data` | Émis quand les données changent |
| `validation-change` | `isValid` | Émis quand l'état de validation change |

## Interfaces TypeScript

```typescript
interface FieldConfig {
    key: string;
    label: string;
    type: 'text' | 'email' | 'date' | 'select' | 'checkbox' | 'radio' | 'button-group' | 'radio-group' | 'multi-select-with-dates';
    options?: Array<string | SelectOption>;
    multiple?: boolean;
    searchable?: boolean;
    clearable?: boolean;
    props?: Record<string, unknown>;
    validators?: Array<{ key: string; fn: (value: unknown) => boolean; msg: string }>;
    min?: string;
    max?: string;
    defaultDate?: string;
    enableTime?: boolean;
    dateFormat?: string;
    gridCols?: number;
    radioOptions?: Array<SelectOption>;
    itemKey?: string;
    dateLabel?: string;
    tooltip?: string;
    optionTooltips?: Record<string, string>;
}
```

## Exemples d'utilisation

### Formulaire simple

```vue
<template>
    <FormBuilder
        :fields="fields"
        v-model="formData"
        title="Formulaire de contact"
        @submit="handleSubmit" />
</template>

<script setup>
import { reactive } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import { required, email } from '@/utils/validate';

const formData = reactive({});

const fields = [
    {
        key: 'nom',
        label: 'Nom',
        type: 'text',
        required: true,
        validators: [required()]
    },
    {
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        validators: [required(), email()]
    }
];

const handleSubmit = (data) => {
    console.log('Données soumises:', data);
};
</script>
```

### Formulaire avec validation complexe

```vue
<template>
    <FormBuilder
        :fields="fields"
        v-model="formData"
        :columns="2"
        title="Inscription utilisateur"
        @submit="handleSubmit"
        @validation-change="handleValidationChange" />
</template>

<script setup>
import { reactive, ref } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import { required, email, minLength } from '@/utils/validate';

const formData = reactive({});
const isValid = ref(false);

const fields = [
    {
        key: 'nom',
        label: 'Nom complet',
        type: 'text',
        required: true,
        validators: [required(), minLength(2)],
        props: { placeholder: 'Entrez votre nom' }
    },
    {
        key: 'email',
        label: 'Adresse email',
        type: 'email',
        required: true,
        validators: [required(), email()],
        tooltip: 'Votre email ne sera pas partagé'
    },
    {
        key: 'pays',
        label: 'Pays',
        type: 'select',
        required: true,
        validators: [required()],
        options: [
            { label: 'France', value: 'fr' },
            { label: 'Belgique', value: 'be' },
            { label: 'Suisse', value: 'ch' }
        ],
        searchable: true
    },
    {
        key: 'langues',
        label: 'Langues parlées',
        type: 'select',
        multiple: true,
        options: [
            { label: 'Français', value: 'fr' },
            { label: 'Anglais', value: 'en' },
            { label: 'Espagnol', value: 'es' }
        ],
        searchable: true
    },
    {
        key: 'methode_contact',
        label: 'Méthode de contact',
        type: 'radio-group',
        required: true,
        validators: [required()],
        radioOptions: [
            { label: 'Email', value: 'email' },
            { label: 'Téléphone', value: 'phone' }
        ]
    },
    {
        key: 'newsletter',
        label: 'Recevoir la newsletter',
        type: 'checkbox'
    }
];

const handleSubmit = (data) => {
    console.log('Inscription:', data);
};

const handleValidationChange = (valid) => {
    isValid.value = valid;
};
</script>
```

### Formulaire avec sélection multiple et dates

```vue
<template>
    <FormBuilder
        :fields="fields"
        v-model="formData"
        title="Planification d'événements"
        @submit="handleSubmit" />
</template>

<script setup>
import { reactive } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';

const formData = reactive({});

const fields = [
    {
        key: 'evenements',
        label: 'Événements à participer',
        type: 'multi-select-with-dates',
        options: [
            { label: 'Conférence Tech', value: 'tech_conf' },
            { label: 'Workshop Design', value: 'design_workshop' },
            { label: 'Meetup Développement', value: 'dev_meetup' }
        ],
        searchable: true,
        clearable: true,
        dateLabel: 'Date de participation',
        itemKey: 'event'
    }
];

const handleSubmit = (data) => {
    console.log('Événements planifiés:', data.evenements);
    // data.evenements = [
    //   { event: 'tech_conf', date: '2024-01-15' },
    //   { event: 'design_workshop', date: '2024-01-20' }
    // ]
};
</script>
```

## Architecture modulaire

Le FormBuilder utilise une architecture modulaire avec :

### Composables

- **`useFormData`** : Gestion des données du formulaire
- **`useFormValidation`** : Logique de validation
- **`useFormGrid`** : Gestion de la grille responsive

### Composants de champs

- **`TextInput`** : Champs texte et email
- **`DateInput`** : Sélecteur de date avec flat-pickr
- **`RadioInput`** : Boutons radio simples
- **`RadioGroupInput`** : Groupe de boutons radio
- **`ButtonGroupInput`** : Groupe de boutons
- **`MultiSelectWithDates`** : Sélection multiple avec dates
- **`SelectField`** : Liste déroulante (réutilise le composant existant)

### Composants utilitaires

- **`FormFieldLabel`** : Affichage des labels avec tooltips
- **`FormFieldError`** : Affichage des messages d'erreur
- **`CheckboxSection`** : Section des checkboxes

## Validation

Le FormBuilder supporte la validation avec des validateurs personnalisés :

```typescript
// Exemple de validateur personnalisé
const customValidator = {
    key: 'custom',
    fn: (value: unknown) => {
        // Logique de validation
        return typeof value === 'string' && value.length >= 3;
    },
    msg: 'Le champ doit contenir au moins 3 caractères'
};
```

## Grille responsive

Le FormBuilder utilise une grille responsive automatique :

- **1 champ** : 1-3 colonnes selon l'espace
- **2 champs** : Affichage vertical
- **3+ champs** : Grille 3 colonnes responsive

Vous pouvez aussi spécifier un nombre de colonnes personnalisé :

```vue
<FormBuilder :fields="fields" :columns="2" />
```

## Styles et thème

Le FormBuilder utilise Tailwind CSS et supporte :

- **Thème sombre** : Support automatique
- **Responsive design** : Adaptation mobile
- **Accessibilité** : ARIA labels, navigation clavier
- **Animations** : Transitions douces

## Performance

- **Lazy loading** : Composants chargés à la demande
- **Memoization** : Calculs optimisés avec computed
- **Event delegation** : Gestion efficace des événements
- **Virtual scrolling** : Pour les listes volumineuses

## Migration depuis l'ancien FormBuilder

Si vous migrez depuis l'ancien FormBuilder, les changements principaux sont :

1. **Architecture modulaire** : Séparation des responsabilités
2. **Composables** : Logique réutilisable
3. **Composants de champs** : Champs individuels
4. **API simplifiée** : Interface plus claire

```vue
<!-- Avant -->
<FormBuilder :fields="fields" v-model="data" />

<!-- Après (même API, mais architecture améliorée) -->
<FormBuilder :fields="fields" v-model="data" />
```

## Dependencies

- `vue-select`: Pour les champs select
- `flatpickr`: Pour les champs date
- `@/components/Tooltip.vue`: Pour les tooltips
- `@/utils/validate`: Fonctions de validation
- `@/utils/domUtils`: Utilitaires DOM

## Notes de développement

1. **Refactorisation complète** : Architecture modulaire et maintenable
2. **Composables** : Logique réutilisable et testable
3. **Composants de champs** : Champs individuels et spécialisés
4. **TypeScript** : Types stricts et autocomplétion
5. **Performance** : Optimisations pour les formulaires complexes 
