import { Client, CreateClientInput, UpdateClientInput } from '@/types/client.-types';
import { api } from './api.service';

export const clientService = {
    getAll: async (): Promise<Client[]> => {
        const response = await api.get('/clients');
        return response.data;
    },
    getById: async (id: number): Promise<Client> => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },
    create: async (data: CreateClientInput): Promise<Client> => {
        const response = await api.post('/clients', data);
        return response.data;
    },
    update: async (id: number, data: UpdateClientInput): Promise<Client> => {
        const response = await api.patch(`/clients/${id}`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        const response = await api.delete(`/clients/${id}`);
        return response.data;
    }
};