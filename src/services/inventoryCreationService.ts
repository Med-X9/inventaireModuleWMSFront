import type { InventoryCreationState, ContageMode } from '@/interfaces/inventoryCreation';

export class InventoryCreationService {
getAvailableModesForStep(
state: InventoryCreationState,
stepIndex: number
): ContageMode[] {
if (stepIndex === 0) {
return [
'etat de stock',
'liste emplacement',
'article + emplacement',
'hybride'
];
}

if (stepIndex === 1) {
return [
'liste emplacement',
'article + emplacement',
'hybride'
];
}

if (stepIndex === 2) {
const firstContage = state.contages[0];
const secondContage = state.contages[1];

if (firstContage.mode === 'etat de stock') {
return [secondContage.mode];
}

const uniqueModes = new Set([firstContage.mode, secondContage.mode]);
return Array.from(uniqueModes) as ContageMode[];
}

return [];
}

getOptionsForMode(mode: ContageMode): { hasVariant: boolean; hasScanner: boolean; hasStock: boolean; } {
switch (mode) {
case 'liste emplacement':
return {
hasVariant: false,
hasScanner: true,
hasStock: false
};
case 'article + emplacement':
return {
hasVariant: true,
hasScanner: false,
hasStock: true
};
case 'hybride':
return {
hasVariant: true,
hasScanner: false,
hasStock: false
};
default:
return {
hasVariant: false,
hasScanner: false,
hasStock: false
};
}
}
}

export const inventoryCreationService = new InventoryCreationService();