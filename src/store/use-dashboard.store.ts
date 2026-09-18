import { create } from 'zustand';
import { dashboardService, DashboardSummary } from '@/services/dashboard.service';
import axios from 'axios';

interface DashboardState {
  data: DashboardSummary | null;
  isLoading: boolean;
  isRefetching: boolean; // 👈 Nuevo estado para recargas silenciosas
  error: string | null;
  fetchDashboardData: (background?: boolean) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  isLoading: false,
  isRefetching: false,
  error: null,

  fetchDashboardData: async (background = false) => {
    const { data } = get();
    
    // Si ya hay datos y es background, solo activamos el refetching silencioso
    if (!data || !background) {
      set({ isLoading: true, error: null });
    } else {
      set({ isRefetching: true, error: null });
    }

    try {
      const result = await dashboardService.getSummary();
      set({ data: result, isLoading: false, isRefetching: false });
    } catch (err: unknown) {
      let errorMessage = 'Error al cargar los datos del dashboard';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      set({ error: errorMessage, isLoading: false, isRefetching: false });
    }
  },
}));