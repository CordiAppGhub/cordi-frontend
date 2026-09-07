import { create } from 'zustand';
import Cookies from 'js-cookie';
import axios from 'axios';
import { authService } from '@/services/auth.services';
import { AuthState } from '@/types/auth-types';


const COOKIE_NAME = 'corditrans_session';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const { access_token, user } = await authService.login(email, password);

      // Guardamos la cookie de sesión antes de actualizar el estado global
      Cookies.set(COOKIE_NAME, access_token, { expires: 1, path: '/' });

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({ isLoading: false });
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Credenciales inválidas');
      }
      throw new Error('Error al conectar con el servidor');
    }
  },

  logout: () => {
    Cookies.remove(COOKIE_NAME, { path: '/' });
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  checkSession: async () => {
    const token = Cookies.get(COOKIE_NAME);
    
    if (!token) {
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }

    try {
      const userData = await authService.getMe();
      set({ 
        token, 
        user: userData,
        isAuthenticated: true 
      });
    } catch (error) {
      console.error('El token guardado ya no es válido', error);
      Cookies.remove(COOKIE_NAME);
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));