import { AuthUser } from '@/types/auth-types';
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

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ user: AuthUser; message: string }> => {
    const response = await api.patch('/auth/change-password', data);
    return response.data;
  },

  requestPasswordReset: async (
    email: string,
  ): Promise<{ message: string }> => {
    const response = await api.post('/auth/password/forgot', { email });
    return response.data;
  },

  resetPassword: async (data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/auth/password/reset', data);
    return response.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.post<{ user: AuthUser }>('/auth/session/refresh');
    return response.data.user;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};