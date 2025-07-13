# SelectField Component

## Vue d'ensemble

Le composant `SelectField` est un composant Vue 3 réutilisable basé sur `vue-select` qui offre une interface utilisateur moderne et accessible pour les sélections. Il est conçu pour être facilement intégré dans un form builder.

## Fonctionnalités

- ✅ **Sélection simple et multiple**
- ✅ **Recherche intégrée**
- ✅ **Tooltips sur les options**
- ✅ **Validation et gestion d'erreurs**
- ✅ **Mode compact**
- ✅ **Recherche avancée**
- ✅ **Support du thème sombre**
- ✅ **Accessibilité**
- ✅ **TypeScript support**

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `modelValue` | `string \| number \| string[] \| number[] \| null` | - | Valeur du modèle (v-model) |
| `selected` | `string \| number \| string[] \| number[] \| null` | - | Valeur sélectionnée (alternative à modelValue) |
| `options` | `Array<string \| SelectOption>` | - | Options disponibles |
| `label` | `string` | - | Label du champ |
| `placeholder` | `string` | - | Texte d'aide |
| `searchable` | `boolean` | `true` | Activer la recherche |
| `clearable` | `boolean` | `true` | Permettre de vider la sélection |
| `multiple` | `boolean` | `false` | Sélection multiple |
| `disabled` | `boolean` | `false` | Désactiver le champ |
| `loading` | `boolean` | `false` | Afficher un état de chargement |
| `required` | `boolean` | `false` | Champ obligatoire |
| `error` | `boolean` | `false` | État d'erreur |
| `errorMessage` | `string` | - | Message d'erreur |
| `helperText` | `string` | - | Texte d'aide |
| `tooltip` | `string` | - | Tooltip du label |
| `compact` | `boolean` | `false` | Mode compact |
| `enhancedSearch` | `boolean` | `false` | Recherche avancée |
| `searchPlaceholder` | `string` | - | Placeholder pour la recherche |
| `noOptionsText` | `string` | - | Texte quand aucune option |
| `customFilter` | `function` | - | Fonction de filtrage personnalisée |

## Événements

| Événement | Payload | Description |
|-----------|---------|-------------|
| `update:modelValue` | `value` | Émis quand la valeur change |
| `search` | `query` | Émis lors de la recherche |
| `open` | - | Émis quand le dropdown s'ouvre |
| `close` | - | Émis quand le dropdown se ferme |

## Interfaces TypeScript

```typescript
interface SelectOption {
    label: string;
    value: string | number;
    tooltip?: string;
}

interface SelectFieldProps {
    modelValue?: string | number | string[] | number[] | null;
    selected?: string | number | string[] | number[] | null;
    options: Array<string | SelectOption>;
    label?: string;
    placeholder?: string;
    searchable?: boolean;
    clearable?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    loading?: boolean;
    required?: boolean;
    error?: boolean;
    errorMessage?: string;
    helperText?: string;
    tooltip?: string;
    compact?: boolean;
    enhancedSearch?: boolean;
    searchPlaceholder?: string;
    noOptionsText?: string;
    customFilter?: (option: SelectOption, label: string, search: string) => boolean;
}
```

## Exemples d'utilisation

### Select Simple

```vue
<template>
    <SelectField
        v-model="selectedValue"
        :options="options"
        label="Sélectionnez une option"
        placeholder="Choisissez..."
    />
</template>

<script setup>
import { ref } from 'vue';
import SelectField from '@/components/Form/SelectField.vue';

const selectedValue = ref(null);
const options = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' }
];
</script>
```

### Multi-Select

```vue
<template>
    <SelectField
        v-model="selectedValues"
        :options="options"
        label="Sélection multiple"
        :multiple="true"
        placeholder="Sélectionnez plusieurs options..."
    />
</template>

<script setup>
import { ref } from 'vue';
import SelectField from '@/components/Form/SelectField.vue';

const selectedValues = ref([]);
const options = [
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JavaScript', value: 'js' },
    { label: 'Vue.js', value: 'vue' }
];
</script>
```

### Select avec Tooltips

```vue
<template>
    <SelectField
        v-model="selectedValue"
        :options="optionsWithTooltips"
        label="Options avec informations"
        placeholder="Sélectionnez avec info..."
    />
</template>

<script setup>
import { ref } from 'vue';
import SelectField from '@/components/Form/SelectField.vue';

const selectedValue = ref(null);
const optionsWithTooltips = [
    { 
        label: 'JavaScript', 
        value: 'js', 
        tooltip: 'Langage de programmation côté client' 
    },
    { 
        label: 'TypeScript', 
        value: 'ts', 
        tooltip: 'Superset typé de JavaScript' 
    },
    { 
        label: 'Vue.js', 
        value: 'vue', 
        tooltip: 'Framework JavaScript progressif' 
    }
];
</script>
```

### Select avec Validation

```vue
<template>
    <SelectField
        v-model="selectedValue"
        :options="options"
        label="Champ requis"
        :required="true"
        :error="!selectedValue"
        error-message="Veuillez sélectionner une option"
    />
</template>

<script setup>
import { ref } from 'vue';
import SelectField from '@/components/Form/SelectField.vue';

const selectedValue = ref(null);
const options = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c' }
];
</script>
```

### Select avec Recherche Avancée

```vue
<template>
    <SelectField
        v-model="selectedValue"
        :options="options"
        label="Recherche avancée"
        :enhanced-search="true"
        search-placeholder="Rechercher dans les options..."
        :searchable="true"
    />
</template>

<script setup>
import { ref } from 'vue';
import SelectField from '@/components/Form/SelectField.vue';

const selectedValue = ref(null);
const options = [
    { label: 'Algérie', value: 'algeria' },
    { label: 'Belgique', value: 'belgium' },
    { label: 'Canada', value: 'canada' },
    { label: 'France', value: 'france' },
    // ... plus d'options
];
</script>
```

## Intégration dans un Form Builder

Le composant `SelectField` est conçu pour s'intégrer facilement dans un form builder. Voici un exemple :

```vue
<template>
    <div v-for="field in formFields" :key="field.key">
        <SelectField
            v-if="field.type === 'select'"
            v-model="formData[field.key]"
            :options="field.options"
            :label="field.label"
            :placeholder="field.placeholder"
            :required="field.required"
            :multiple="field.multiple"
            :searchable="field.searchable"
            :error="fieldErrors[field.key]"
            :error-message="fieldErrors[field.key]"
        />
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import SelectField from '@/components/Form/SelectField.vue';

const formFields = ref([
    {
        key: 'country',
        label: 'Pays',
        type: 'select',
        options: [
            { label: 'France', value: 'france' },
            { label: 'Belgique', value: 'belgium' },
            { label: 'Suisse', value: 'switzerland' }
        ],
        required: true,
        searchable: true
    }
]);

const formData = reactive({});
const fieldErrors = reactive({});
</script>
```

## Styles CSS

Le composant utilise Tailwind CSS et inclut des styles personnalisés pour :

- **Tooltips** : Affichage en pleine largeur sous les options
- **Mode compact** : Réduction de l'espacement
- **Thème sombre** : Support automatique
- **Animations** : Transitions douces pour les tooltips

## Accessibilité

- Support des attributs ARIA
- Navigation au clavier
- Focus management
- Screen reader support
- Contraste approprié

## Dependencies

- `vue-select`: Composant de base
- `@/components/Tooltip.vue`: Composant tooltip
- `@/utils/domUtils`: Utilitaires DOM
- `@/interfaces/form`: Interfaces TypeScript

## Notes de développement

1. **Correction des erreurs TypeScript** : Les slots de vue-select ont été corrigés pour éviter les erreurs de linter
2. **Gestion sécurisée des événements** : Utilisation de `safeExecute` pour éviter les erreurs
3. **Support des tooltips** : Implémentation complète avec positionnement automatique
4. **Flexibilité** : Support de multiples modes d'utilisation
5. **Performance** : Optimisations pour les listes volumineuses

## Migration depuis vue-select

Si vous migrez depuis vue-select directement, voici les changements principaux :

```vue
<!-- Avant -->
<v-select v-model="value" :options="options" />

<!-- Après -->
<SelectField v-model="value" :options="options" />
```

Le composant `SelectField` encapsule `vue-select` et ajoute des fonctionnalités supplémentaires tout en maintenant la compatibilité avec l'API de base. 
