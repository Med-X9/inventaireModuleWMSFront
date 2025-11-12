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
}
