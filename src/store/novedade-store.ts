import { NovedadItem, novedadesService } from '@/services/novedades.servies';
import { create } from 'zustand';

interface NovedadesState {
  novedades: NovedadItem[];
  isLoading: boolean;
  error: string | null;
  fetchNovedades: (status?: string) => Promise<void>;
  resolveNovedad: (id: number, notes: string) => Promise<boolean>;
}

interface BackendErrorResponse {
  message?: string;
}

export const useNovedadesStore = create<NovedadesState>((set, get) => ({
  novedades: [],
  isLoading: false,
  error: null,

  fetchNovedades: async (status = 'TODAS') => {
    set({ isLoading: true, error: null });
    try {
      const data = await novedadesService.getAll(status);
      set({ novedades: data, isLoading: false });
    } catch (err) {
      set({ error: (err as BackendErrorResponse).message || 'Error al cargar novedades', isLoading: false });
    }
  },

  resolveNovedad: async (id: number, notes: string) => {
    try {
      await novedadesService.resolve(id, notes);
      return true; // Solo retornamos true para que el view dispare el refetch con el tab activo
    } catch (err) {
      alert((err as BackendErrorResponse).message || 'Error al resolver la novedad');
      return false;
    }
  },
}));