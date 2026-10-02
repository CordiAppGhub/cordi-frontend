// types/dashboard.ts

export interface KpiSummary {
  tasaEficiencia: number;
  totalViajes: number;
  ingresosEstimados: number; 
  toneladas: number;
  kmTotales: number;
}

export interface FlotaSummary {
  total: number;
  disponible: number;
  enRuta: number;
  enMantenimiento: number;
  noDisponibles?: number;
}

export interface TopCardsSummary {
  totalFlota: number;
  operativas: number;
  enMantenimiento: number;
  noDisponibles: number;
  pendientes: number;
  viajesHoy: number;
}

export interface ActiveDispatch {
  id: number;
  vehiclePlate: string;
  driverName: string;
  status: string;
  cliente: string;
  viajeActual: string;
  ultimaUbicacion: string;
  hasDesvios: boolean;
  proximaAccion: string;
}

export interface Alert {
  type: 'MAINTENANCE' | 'SOAT' | 'DESVIO';
  message: string;
  count: number;
}

export interface DashboardSummary {
  kpis: KpiSummary;
  topCards: TopCardsSummary;
  flota: FlotaSummary;
  activeDispatches: ActiveDispatch[];
  alertasCriticas: {
    mantenimiento: number;
    soatVencido: number;
    novedades: number;
    desvios: number; 
    lista: Alert[];
  };
}