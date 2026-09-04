import { Location, CreateLocationInput, UpdateLocationInput } from '../types/location.types';
import { api } from './api.service';

export const locationService = {
  getAll: async (): Promise<Location[]> => {
    const response = await api.get('/locations');
    return response.data;
  },

  getById: async (id: number): Promise<Location> => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },

  create: async (data: CreateLocationInput): Promise<Location> => {
    const response = await api.post('/locations', data);
    return response.data;
  },

  update: async (id: number, data: UpdateLocationInput): Promise<Location> => {
    const response = await api.patch(`/locations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete(`/locations/${id}`);
    return response.data;
  }
};