import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { Warehouse } from '@/models/Warehouse';
import API from '@/api';
import { ApiResponse } from '@/models/ResponseAPIMasterData';
import { Job } from '@/models/Job';



export class WarehouseService {
    static async getAll(): Promise<AxiosResponse<ApiResponse<Warehouse[]>>> {
        return axiosInstance.get<ApiResponse<Warehouse[]>>(API.endpoints.warehouse.base);
    }

    static async getByAccountId(accountId: number): Promise<AxiosResponse<ApiResponse<Warehouse[]>>> {
        return axiosInstance.get<ApiResponse<Warehouse[]>>(`${API.endpoints.inventory.base}account/${accountId}/warehouses/`);
    }

    static async getByReference(reference: string): Promise<AxiosResponse<ApiResponse<Warehouse>>> {
        return axiosInstance.get<ApiResponse<Warehouse>>(`${API.endpoints.warehouse.base}${reference}/`);
    }

    static async getAllJobsByWarehouseId(id: number): Promise<AxiosResponse<ApiResponse<Job[]>>> {
        return axiosInstance.get<ApiResponse<Job[]>>(API.endpoints.warehouse.base + id + '/pending-jobs');
    }
}
