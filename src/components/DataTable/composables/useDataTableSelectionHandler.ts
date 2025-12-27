/**
 * Composable pour gérer les handlers de sélection du DataTable
 * 
 * Responsabilité unique : Gestion des événements de sélection
 * 
 * @module useDataTableSelectionHandler
 */

/**
 * Configuration pour useDataTableSelectionHandler
 */
export interface UseDataTableSelectionHandlerConfig {
    /** Composable useDataTable */
    dataTable: any
    /** Émission d'événements */
    emit: {
        'selection-changed': (selectedRows: Set<string>) => void
    }
}

/**
 * Composable pour gérer les handlers de sélection
 */
export function useDataTableSelectionHandler(config: UseDataTableSelectionHandlerConfig) {
    const { dataTable, emit } = config

    /**
     * Handler pour les changements de sélection
     *
     * Met à jour l'état de sélection dans useDataTable et émet l'événement vers le parent.
     */
    const handleSelectionChanged = (selectedRows: Set<string>) => {
        if (dataTable && typeof dataTable.setSelectedRows === 'function') {
            dataTable.setSelectedRows(selectedRows)
        }

        emit['selection-changed'](new Set(selectedRows))
    }

    return {
        handleSelectionChanged
    }
}

