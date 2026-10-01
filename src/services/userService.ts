import { User, UserFormData } from "@/types/user-types";
import { api } from "./api.service";


export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data: UserFormData): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: number, data: Partial<UserFormData>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  disable: async (id: number): Promise<void> => {
    await api.patch(`/users/${id}/disable`);
  }
};