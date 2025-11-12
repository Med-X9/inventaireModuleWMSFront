/**
 * Interfaces pour les réponses de l'API d'import de stocks
 * Basé sur la documentation API_STOCK_IMPORT_RESPONSES.md
 */

export interface StockImportSummary {
    total_rows: number
    valid_rows: number
    invalid_rows: number
}

export interface ImportedStock {
    id: number
    product: string
    location: string
    quantity: number
}

export interface ValidationError {
    row: number
    errors: string[]
    data: {
        article?: string | null
        emplacement?: string | null
        quantite?: number | null
    }
}

export interface StockImportErrorResponse {
    success: false
    message: string
    inventory_type?: 'GENERAL' | 'TOURNANT' | null
    existing_stocks_count?: number | null
    action_required?: 'DELETE_AND_RECREATE' | 'FIX_LOCATIONS' | null
    summary?: StockImportSummary | null
    errors?: ValidationError[]
    imported_stocks?: never
}

export interface StockImportSuccessResponse {
    success: true
    message: string
    inventory_type: 'GENERAL' | 'TOURNANT'
    summary: StockImportSummary
    imported_stocks: ImportedStock[]
    errors?: never
}

export type StockImportResponse = StockImportSuccessResponse | StockImportErrorResponse

