import { api } from './api.service';

export interface AuthUser {
  id: number;
  email: string;
  name?: string | null;
  role: string;
}

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>('/users/me');
    return response.data;
  },
};