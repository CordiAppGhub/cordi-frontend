import { NewUserFormData, User, UserFormData } from "@/types/user-types";
import { api } from "./api.service";
import type { BulkImportResult } from '@/types/bulk-import';


export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data: NewUserFormData): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },
  resendCredentials: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/users/${id}/resend-credentials`);
    return response.data;
  },
  importExcel: async (file: File): Promise<BulkImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BulkImportResult>('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data;
  },
  update: async (id: number, data: Partial<UserFormData>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  disable: async (id: number): Promise<void> => {
    await api.patch(`/users/${id}/disable`);
  },
  enable: async (id: number): Promise<void> => {
    await api.patch(`/users/${id}/enable`);
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};