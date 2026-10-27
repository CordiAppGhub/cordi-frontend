import { CreateVehicleDto, UpdateVehicleDto, Vehicle } from "@/types/vehicles";
import { api } from "./api.service";

export const vehiclesService = {
  getAll: async (): Promise<Vehicle[]> => {
    const { data } = await api.get('/vehicles');
    return data;
  },

  getById: async (id: number): Promise<Vehicle> => {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  },

  create: async (payload: CreateVehicleDto): Promise<Vehicle> => {
    const { data } = await api.post('/vehicles', payload);
    return data;
  },

  uploadDocument: async (file: File): Promise<{ fileUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/vehicles/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },

  extractDates: async (file: File): Promise<{ expirationDate: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/vehicles/extract-dates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },

  update: async (id: number, payload: UpdateVehicleDto): Promise<Vehicle> => {
    const { data } = await api.patch(`/vehicles/${id}`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },

  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/vehicles/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },
};