import { api } from "./api.service";
import { Driver, CreateDriverDto, UpdateDriverDto } from "@/types/drivers";

export const driversService = {
  getAll: async (): Promise<Driver[]> => {
    const { data } = await api.get('/drivers');
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

  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/drivers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },
};