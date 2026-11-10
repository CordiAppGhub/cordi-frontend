import { api } from "./api.service";
import {
  Driver,
  CreateDriverDto,
  PaginatedDrivers,
  UpdateDriverDto,
} from "@/types/drivers";
import type { BulkImportResult } from '@/types/bulk-import';

export const driversService = {
  getAll: async (): Promise<Driver[]> => {
    const { data } = await api.get('/drivers');
    return data;
  },

  getPaginated: async (
    page: number,
    limit: number,
    search: string,
  ): Promise<PaginatedDrivers> => {
    const { data } = await api.get<PaginatedDrivers>('/drivers/paginated', {
      params: { page, limit, search: search || undefined },
    });
    return data;
  },

  getById: async (id: number): Promise<Driver> => {
    const { data } = await api.get(`/drivers/${id}`);
    return data;
  },

  create: async (payload: CreateDriverDto): Promise<Driver> => {
    const { data } = await api.post('/drivers', payload);
    return data;
  },

  update: async (id: number, payload: UpdateDriverDto): Promise<Driver> => {
    const { data } = await api.patch(`/drivers/${id}`, payload);
    return data;
  },

  disable: async (id: number): Promise<void> => {
    await api.patch(`/drivers/${id}/disable`);
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/drivers/${id}`);
    return data;
  },

  importExcel: async (file: File): Promise<BulkImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<BulkImportResult>('/drivers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },
};