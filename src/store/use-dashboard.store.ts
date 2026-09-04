import { create } from 'zustand';
import { dashboardService, DashboardSummary } from '@/services/dashboard.service';
import axios from 'axios';

interface DashboardState {
  data: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await dashboardService.getSummary();
      set({ data: result, isLoading: false });
    } catch (err: unknown) {
      let errorMessage = 'Error al cargar los datos del dashboard';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
}));