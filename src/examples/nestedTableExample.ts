/**
 * Exemple d'utilisation des tables imbriquées avec count et expansion
 */

// Exemple de données avec emplacements imbriqués
const sampleData = [
    {
        id: 1,
        reference: 'INV-001',
        status: 'en cours',
        emplacements: [
            { id: 1, reference: 'EMP-A1', zone: 'Zone A', sous_zone: 'Sous-zone 1' },
            { id: 2, reference: 'EMP-A2', zone: 'Zone A', sous_zone: 'Sous-zone 2' },
            { id: 3, reference: 'EMP-B1', zone: 'Zone B', sous_zone: 'Sous-zone 1' }
        ]
    },
    {
        id: 2,
        reference: 'INV-002',
        status: 'terminé',
        emplacements: [
            { id: 4, reference: 'EMP-C1', zone: 'Zone C', sous_zone: 'Sous-zone 1' }
        ]
    }
]

// Configuration des colonnes avec données imbriquées
const columns = [
    {
        field: 'reference',
        headerName: 'Référence',
        sortable: true,
        filterable: true,
        width: 200
    },
    {
        field: 'status',
        headerName: 'Statut',
        sortable: true,
        filterable: true,
        width: 150,
        badgeStyles: [
            { value: 'en attente', class: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
            { value: 'en cours', class: 'bg-blue-100 text-blue-800', icon: '🔄' },
            { value: 'terminé', class: 'bg-green-100 text-green-800', icon: '✅' }
        ]
    },
    {
        field: 'emplacements',
        headerName: 'Emplacements',
        sortable: true,
        filterable: true,
        width: 200,
        // Configuration pour les données imbriquées
        nestedData: {
            key: 'emplacements',           // Clé pour accéder aux données
            displayKey: 'reference',       // Clé à afficher pour chaque élément
            countSuffix: 'emplacements',   // Suffixe pour le count
            expandable: true,              // Permettre l'expansion
            iconCollapsed: '▶',           // Icône quand replié
            iconExpanded: '▼'             // Icône quand expandé
        }
    }
]

// Exemple avec des données imbriquées dans un objet
const sampleDataWithObject = [
    {
        id: 1,
        reference: 'INV-001',
        details: {
            emplacements: [
                { id: 1, reference: 'EMP-A1', zone: 'Zone A' },
                { id: 2, reference: 'EMP-A2', zone: 'Zone A' }
            ]
        }
    }
]

// Configuration pour données imbriquées dans un objet
const columnsWithObject = [
    {
        field: 'reference',
        headerName: 'Référence',
        width: 200
    },
    {
        field: 'details',
        headerName: 'Détails',
        width: 200,
        nestedData: {
            key: 'emplacements',           // Clé dans l'objet details
            displayKey: 'reference',       // Clé à afficher
            countSuffix: 'emplacements',
            expandable: true
        }
    }
]

// Exemple avec des données simples (tableau de strings)
const sampleDataSimple = [
    {
        id: 1,
        reference: 'INV-001',
        tags: ['urgent', 'inventaire', 'validation']
    }
]

// Configuration pour données simples
const columnsSimple = [
    {
        field: 'reference',
        headerName: 'Référence',
        width: 200
    },
    {
        field: 'tags',
        headerName: 'Tags',
        width: 200,
        nestedData: {
            key: 'tags',                   // Clé pour le tableau
            countSuffix: 'tags',           // Suffixe personnalisé
            expandable: true
        }
    }
]

export {
    sampleData,
    columns,
    sampleDataWithObject,
    columnsWithObject,
    sampleDataSimple,
    columnsSimple
}
