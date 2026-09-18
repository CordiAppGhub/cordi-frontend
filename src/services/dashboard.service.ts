import { api } from "./api.service";

export interface DashboardSummary {
  kpis: {
    operacionesPendientes: number;
    operacionesEnCurso: number;
    conNovedad: number;
    completadosHoy: number;
    totalFlota: number;
    flotaDisponible: number;
    tasaEficiencia: number; // 👈 Nuevo
  };
  flota: { // 👈 Nuevo objeto para la barra de progreso
    total: number;
    disponible: number;
    enRuta: number;
    enMantenimiento: number;
    inactivos: number;
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