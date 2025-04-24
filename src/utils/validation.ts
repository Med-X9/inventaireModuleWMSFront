// src/utils/validation.ts
import { required, email } from '@vuelidate/validators'

export function getValidationRules(fields: any[]) {
  const rules: Record<string, any> = {}

  fields.forEach(field => {
    const fieldRules: any[] = []

    if (field.required) {
      fieldRules.push(required)
    }

    if (field.type === 'email') {
      fieldRules.push(email)
    }

    rules[field.key] = fieldRules
  })

  return rules
}
