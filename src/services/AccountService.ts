import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { Account } from '@/models/Account';
import API from '@/api';

export class AccountService {
    static async getAll(): Promise<AxiosResponse<Account[]>> {
        return axiosInstance.get<Account[]>(API.endpoints.account.base);
    }
}
