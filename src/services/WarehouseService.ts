import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
import type { Warehouse } from '@/models/Warehouse';
import API from '@/api';

export class WarehouseService {
  static async getAll(): Promise<AxiosResponse<Warehouse[]>> {
    return axiosInstance.get<Warehouse[]>(API.endpoints.warehouse.base);
  }
}
