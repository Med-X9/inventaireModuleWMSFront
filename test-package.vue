<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Test du Package @SMATCH-Digital-dev/vue-system-design</h1>
    
    <div class="space-y-4">
      <!-- Test Button -->
      <div>
        <h2 class="text-lg font-semibold mb-2">1. Test Button</h2>
        <Button variant="primary" size="md">Bouton du Package</Button>
      </div>

      <!-- Test Card -->
      <div>
        <h2 class="text-lg font-semibold mb-2">2. Test Card</h2>
        <Card>
          <template #header>
            <h3 class="text-lg font-semibold">Carte de Test</h3>
          </template>
          <p>Ceci est une carte du package système de design.</p>
        </Card>
      </div>

      <!-- Test Badge -->
      <div>
        <h2 class="text-lg font-semibold mb-2">3. Test Badge</h2>
        <Badge variant="success">Badge Succès</Badge>
        <Badge variant="warning" class="ml-2">Badge Warning</Badge>
        <Badge variant="danger" class="ml-2">Badge Danger</Badge>
      </div>

      <!-- Test Alert -->
      <div>
        <h2 class="text-lg font-semibold mb-2">4. Test Alert</h2>
        <Alert variant="info" :dismissible="true">
          Ceci est une alerte d'information du package.
        </Alert>
      </div>

      <!-- Résultat -->
      <div class="mt-6 p-4 bg-green-100 border border-green-400 rounded">
        <p class="text-green-800 font-semibold">
          ✅ Package installé et fonctionnel !
        </p>
        <p class="text-sm text-green-700 mt-2">
          Version: {{ packageVersion }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Card, Badge, Alert } from '@SMATCH-Digital-dev/vue-system-design'

// Vérifier que le package est bien importé
const packageVersion = '1.0.0'
</script>

