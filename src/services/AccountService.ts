import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { Account } from '@/models/Account';
import API from '@/api';
import type { ApiResponse } from '@/models/ResponseAPIMasterData';

export class AccountService {
    static async getAll(): Promise<AxiosResponse<ApiResponse<Account[]>>> {
        return axiosInstance.get<ApiResponse<Account[]>>(API.endpoints.account.base);
    }
}
