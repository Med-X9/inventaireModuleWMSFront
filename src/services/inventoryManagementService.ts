import type { InventoryManagement } from '@/interfaces/inventoryManagement';
// at bottom of file, after mockInventories, before your export:
export function findInventoryByReference(ref: string) {
    return mockInventories.find(inv => inv.reference === ref);
}

// Inventaire statique avec l'ID 1 forcé
const staticInventory: InventoryManagement = {
    id: 1,
    reference: 'INV-2025-001',
    label: 'Inventaire général 2025',
    inventory_type: 'Inventaire Général',
    status: 'En préparation',
    date: '2025-12-20',
    created_at: '2025-06-24',
    en_preparation_status_date: '',
    en_realisation_status_date: "",
    ternime_status_date: "",
    cloture_status_date: "" ,
    account_name: "",
    warehouse: [],
    comptages: []
};

// Types et statuts disponibles pour les autres inventaires
const types = ['Inventaire Partiel', 'Contrôle Qualité'];
// Statuts possibles
const statuts = ['En préparation', 'En réalisation', 'Terminé', 'Clôturé'];

// Génère une date au format YYYY-MM-DD entre deux dates données
function randomDate(start: string, end: string): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const date = new Date(startTime + Math.random() * (endTime - startTime));
    return date.toISOString().split('T')[0];
}

// Génère des inventaires mock (ID 2 à 100) pour démonstration
function generateMockInventories(count = 99): InventoryManagement[] {
    return Array.from({ length: count }, (_, i) => {
        const id = i + 2;
        const reference = `INV-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
        const label = `Inventaire ${id}`;
        const inventory_type = types[Math.floor(Math.random() * types.length)];
        const status = statuts[Math.floor(Math.random() * statuts.length)];
        const created_at = randomDate('2025-01-01', '2025-06-24');
        const en_preparation_status_date = randomDate(created_at, '2025-12-31');
        const date = randomDate(en_preparation_status_date, '2026-06-30');
        const en_realisation_status_date = randomDate(en_preparation_status_date, date);
        const ternime_status_date = ['Clôturé', 'Terminé'].includes(status)
            ? randomDate(en_realisation_status_date, '2026-12-31')
            : '';
        const cloture_status_date = status === 'Clôturé'
            ? randomDate(ternime_status_date || en_realisation_status_date, '2026-12-31')
            : '';
        const account_name = `Compte ${id}`;

        return {
            id,
            reference,
            label,
            date,
            inventory_type,
            status,
            created_at,
            en_preparation_status_date,
            en_realisation_status_date,
            ternime_status_date,
            cloture_status_date,
            account_name,
            warehouse: [],
            comptages: []
        };
    });
}

// Mock complet: premier inventaire fixe + 99 inventaires générés
const mockInventories: InventoryManagement[] = [staticInventory, ...generateMockInventories()];

export const inventoryManagementService = {
    async getInventories(): Promise<InventoryManagement[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...mockInventories];
    },

    async deleteInventory(id: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = mockInventories.findIndex(inv => inv.id === id);
        if (index > -1) {
            mockInventories.splice(index, 1);
        }
    },

    async createInventory(inventory: Omit<InventoryManagement, 'id'>): Promise<InventoryManagement> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const newInventory: InventoryManagement = {
            ...inventory,
            id: Math.max(...mockInventories.map(i => i.id), 0) + 1
        };
        mockInventories.push(newInventory);
        return newInventory;
    },

    async updateInventory(id: number, inventory: Partial<InventoryManagement>): Promise<InventoryManagement> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = mockInventories.findIndex(inv => inv.id === id);
        if (index > -1) {
            mockInventories[index] = { ...mockInventories[index], ...inventory };
            return mockInventories[index];
        }
        throw new Error('Inventory not found');
    }

};