import { LoginResponse, AuthUser } from '@/types/auth-types';
import { api } from './api.service';


export const authService = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data.user;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>('/users/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};