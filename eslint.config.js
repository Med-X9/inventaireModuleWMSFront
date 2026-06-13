import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'

export default tseslint.config(
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '**/*.d.ts',
            'src/theme/**',
            'src/assets/**',
        ],
    },
    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                sourceType: 'module',
                extraFileExtensions: ['.vue'],
            },
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-empty-object-type': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/no-mutating-props': 'warn',
            'vue/no-unused-vars': ['warn', { ignorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-case-declarations': 'warn',
            'no-useless-catch': 'warn',
            'prefer-const': 'warn',
            'no-empty': 'warn',
        },
    },
    prettier
)
