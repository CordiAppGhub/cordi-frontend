import { api } from "./api.service";

export interface DashboardSummary {
  kpis: {
    enProgreso: number;
    disponibles: number;
    conNovedad: number;
    completadosHoy: number;
  };
  activeDispatches: Array<{
    id: number;
    route: string;
    driverName: string;
    vehiclePlate: string;
    status: string;
  }>;
  alerts: Array<{
    type: 'SOAT' | 'MAINTENANCE';
    message: string;
  }>;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/dashboard/summary');
    return response.data;
  },
};