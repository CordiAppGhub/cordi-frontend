// types/dashboard.ts

export interface KpiSummary {
  tasaEficiencia: number;
  totalViajes: number;
  ingresosEstimados: number;
  toneladas?: number;
  kmTotales?: number;
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
  analytics: {
    periodStart: string;
    periodEnd: string;
    current: DashboardPeriodMetrics;
    previous: DashboardPeriodMetrics;
    trend: Array<DashboardPeriodMetrics & {
      label: string;
      startDate: string;
      endDate: string;
    }>;
    operationTypes: Array<{ type: string; count: number }>;
    fleetStatus: Array<{ status: string; count: number }>;
    analystPerformance: AnalystPerformance[];
    activeAnalystCount: number;
    activeClientCount: number;
  };
  kpis: KpiSummary;
  topCards: TopCardsSummary;
  flota: FlotaSummary;
  administrator: {
    analystCount: number;
    clientCount: number;
    analystPerformance: AnalystPerformance[];
  };
  activeDispatches: ActiveDispatch[];
  alertasCriticas: {
    mantenimiento: number;
    soatVencido: number;
    soatProximoAVencer: number;
    novedades: number;
    desvios: number;
    lista: Alert[];
  };
}

export interface DashboardPeriodMetrics {
  totalTrips: number;
  completedTrips: number;
  invoicedRevenue: number;
  registeredCosts: number;
  outstandingTrips: number;
  statusCounts: Record<string, number>;
}

export interface AnalystPerformance {
  id: number;
  name: string;
  totalTrips: number;
  completedTrips: number;
  completionRate: number;
}