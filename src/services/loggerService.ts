/**
 * Service de logging centralisé
 * Remplace les console.log par un système de logging configurable
 */
export class LoggerService {
    private static instance: LoggerService
    private isDebugMode: boolean = false

    private constructor() {}

    static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService()
        }
        return LoggerService.instance
    }

    /**
     * Active le mode debug
     */
    enableDebugMode(): void {
        this.isDebugMode = true
    }

    /**
     * Désactive le mode debug
     */
    disableDebugMode(): void {
        this.isDebugMode = false
    }

    /**
     * Log d'information
     */
    info(message: string, data?: any): void {
        if (this.isDebugMode) {
            console.info(`[INFO] ${message}`, data || '')
        }
    }

    /**
     * Log de debug
     */
    debug(message: string, data?: any): void {
        if (this.isDebugMode) {
            console.debug(`[DEBUG] ${message}`, data || '')
        }
    }

    /**
     * Log d'avertissement
     */
    warn(message: string, data?: any): void {
        console.warn(`[WARN] ${message}`, data || '')
    }

    /**
     * Log d'erreur
     */
    error(message: string, error?: any): void {
        console.error(`[ERROR] ${message}`, error || '')
    }

    /**
     * Log de succès
     */
    success(message: string, data?: any): void {
        if (this.isDebugMode) {
            console.log(`[SUCCESS] ${message}`, data || '')
        }
    }

    /**
     * Log pour les actions utilisateur
     */
    action(action: string, details?: any): void {
        if (this.isDebugMode) {
            console.log(`[ACTION] ${action}`, details || '')
        }
    }
}

// Instance singleton
export const logger = LoggerService.getInstance()
