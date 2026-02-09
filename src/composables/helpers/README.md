# 📁 Dossier Helpers - Composables

Ce dossier contient les fonctions utilitaires (helpers) extraites des composables pour améliorer la lisibilité et la maintenabilité.

## 📋 Fichiers

### `useInventoryResults.helpers.ts`

Helpers privés pour `useInventoryResults.ts` :

- **Helpers de colonnes** : `getAvailableCountingOrders`, `getCountingOrderLabel`, `getCountingFieldName`, `getCountingStatusFieldName`
- **Helpers d'actions** : `extractEcartComptageId`
- **Helpers de modals** : `showSessionSelectModal`
- **Helpers d'export** : `downloadBlob`, `generateExportFilename`

## 🎯 Principe

Les helpers sont des fonctions **pures** (sans dépendances réactives) qui peuvent être :
- ✅ Testées indépendamment
- ✅ Réutilisées dans d'autres composables
- ✅ Facilement maintenues

## 📝 Usage

```typescript
import {
    getAvailableCountingOrders,
    extractEcartComptageId,
    downloadBlob
} from './helpers/useInventoryResults.helpers'
```

---

*Dossier créé le : ${new Date().toLocaleDateString('fr-FR')}*

