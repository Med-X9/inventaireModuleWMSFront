/**
 * Script de test pour vérifier que le package @SMATCH-Digital-dev/vue-system-design
 * est correctement installé et importable
 */

// Test 1: Importer les composants de base
try {
  const { Button, Card, Badge, Alert } = await import('@SMATCH-Digital-dev/vue-system-design')
  console.log('✅ Composants de base importés:', { Button, Card, Badge, Alert })
} catch (error) {
  console.error('❌ Erreur lors de l\'import des composants de base:', error)
}

// Test 2: Importer le DataTable
try {
  const { DataTable } = await import('@SMATCH-Digital-dev/vue-system-design')
  console.log('✅ DataTable importé:', { DataTable })
} catch (error) {
  console.error('❌ Erreur lors de l\'import du DataTable:', error)
}

// Test 3: Importer les composants de layout
try {
  const { Header, Sidebar, Footer } = await import('@SMATCH-Digital-dev/vue-system-design')
  console.log('✅ Composants de layout importés:', { Header, Sidebar, Footer })
} catch (error) {
  console.error('❌ Erreur lors de l\'import des composants de layout:', error)
}

// Test 4: Importer les charts
try {
  const { BarChart, PieChart, LineChart } = await import('@SMATCH-Digital-dev/vue-system-design')
  console.log('✅ Charts importés:', { BarChart, PieChart, LineChart })
} catch (error) {
  console.error('❌ Erreur lors de l\'import des charts:', error)
}

// Test 5: Vérifier que le package est dans node_modules
import { existsSync } from 'fs'
import { join } from 'path'

const packagePath = join(process.cwd(), 'node_modules', '@SMATCH-Digital-dev', 'vue-system-design')
if (existsSync(packagePath)) {
  console.log('✅ Package trouvé dans node_modules:', packagePath)
} else {
  console.error('❌ Package non trouvé dans node_modules:', packagePath)
}

console.log('\n🎉 Tests terminés!')

