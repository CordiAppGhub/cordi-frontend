import { create } from 'zustand';
import { authService } from '@/services/auth.services';
import { AuthUser } from '@/types/auth-types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true }),

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
      window.location.href = '/login'; // O usar router.push
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getMe(); 
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));