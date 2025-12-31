import API from "@/api";
import { SessionResponse } from "@/models/Session";
import axiosInstance from '@/utils/axiosConfig';
import { logger } from '@/services/loggerService';
import type { AxiosResponse } from 'axios';


export class SessoinService {
    /**
     * Récupérer toutes les sessions avec pagination
     */
    static async getSession(): Promise<SessionResponse> {
        try {
            const response: AxiosResponse<SessionResponse> = await axiosInstance.get(
                `${API.endpoints.auth.session}`
            );
            return response.data;
        } catch (error) {
            logger.error('Erreur lors de la récupération des sessions', error);
            throw error;
        }
    }



    /**
     * Récupère les sessions disponibles pour un comptage spécifique
     */
    static async getMobileUsersForCountingOrder(countingOrder: number): Promise<any[]> {
        try {
            const response: AxiosResponse<any> = await axiosInstance.get(
                `${API.endpoints.auth.session}comptage/${countingOrder}/`
            );

            // L'API retourne { status, message, data: [] }
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }

            // Fallback si le format n'est pas celui attendu
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            logger.error(`Erreur lors de la récupération des sessions pour le comptage ${countingOrder}`, error);
            throw error;
        }
    }
}
