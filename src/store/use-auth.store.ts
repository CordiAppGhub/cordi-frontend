import { create } from 'zustand';
import axios from 'axios';
import { authService } from '@/services/auth.services';
import { AuthState } from '@/types/auth-types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

 login: async (email: string, password: string) => {
  try {
    set({ isLoading: true });

    const user = await authService.login(email, password);

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
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

  logout: async () => {
    try {
      // Llamamos al endpoint del backend para destruir la HttpOnly cookie
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
      // Intentamos obtener el perfil usando la cookie HttpOnly enviada automáticamente
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