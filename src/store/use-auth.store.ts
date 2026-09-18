import { create } from 'zustand';
import axios from 'axios';
import { authService } from '@/services/auth.services';
import { AuthUser } from '@/types/auth-types'; // Asegúrate de ajustar tus tipos si es necesario

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Métodos actualizados para 2FA
  loginStepOne: (email: string, pass: string) => Promise<{ requires2FA: boolean; email: string }>;
  verifyTwoFactor: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  // PASO 1: Valida correo y contraseña, y dispara el correo con el código OTP
  loginStepOne: async (email: string, pass: string) => {
    try {
      set({ isLoading: true });
      const data = await authService.loginStepOne(email, pass);
      set({ isLoading: false });
      return data;
    } catch (error: unknown) {
      set({ isLoading: false });
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Credenciales inválidas'
        );
      }
      throw new Error('Error al conectar con el servidor');
    }
  },

  // PASO 2: Valida el código OTP de 6 dígitos y autentica al usuario en la sesión
  verifyTwoFactor: async (email: string, code: string) => {
    try {
      set({ isLoading: true });
      const data = await authService.verifyTwoFactor(email, code);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({ isLoading: false });
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Código de verificación inválido o expirado'
        );
      }
      throw new Error('Error al conectar con el servidor');
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor', error);
    } finally {
      set({ user: null, isAuthenticated: false });
      window.location.href = '/login';
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const userData = await authService.getMe();
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));