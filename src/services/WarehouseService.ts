import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { Warehouse } from '@/models/Warehouse';
import API from '@/api';
import { ApiResponse } from '@/models/ResponseAPIMasterData';



export class WarehouseService {
  static async getAll(): Promise<AxiosResponse<ApiResponse<Warehouse[]>>> {
    return axiosInstance.get<ApiResponse<Warehouse[]>>(API.endpoints.warehouse.base);
  }
}
