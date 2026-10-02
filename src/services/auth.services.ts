import { LoginResponse, AuthUser } from '@/types/auth-types';
import { api } from './api.service';

export const authService = {
  loginStepOne: async (email: string, pass: string): Promise<{ requires2FA: boolean; email: string }> => {
    const response = await api.post('/auth/login', {
      email,
      password: pass
    });
    return response.data;
  },

  verifyTwoFactor: async (email: string, code: string): Promise<{ user: AuthUser; message: string }> => {
    const response = await api.post('/auth/verify-2fa', { email, code });
    return response.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>('/users/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};