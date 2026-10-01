// types/dashboard.ts

export interface KpiSummary {
  tasaEficiencia: number;
  totalViajes: number;
  ingresosEstimados: number; // 🚀 NUEVO: Desde el backend
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

// 🚀 NUEVO: Interfaz específica para las tarjetas superiores (Sincronizada con NestJS)
export interface TopCardsSummary {
  totalFlota: number;
  operativas: number;
  enMantenimiento: number;
  noDisponibles: number;
  pendientes: number; // 🚀 NUEVO: Dato de operaciones en estado CREADO/ASIGNADO
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
  hasDesvios: boolean; // 🚀 NUEVO: Bandera de desvíos
  proximaAccion: string;
}

export interface Alert {
  type: 'MAINTENANCE' | 'SOAT' | 'DESVIO';
  message: string;
  count: number;
}

export interface DashboardSummary {
  kpis: KpiSummary;
  topCards: TopCardsSummary; // 🚀 Aplicamos la nueva interfaz aquí
  flota: FlotaSummary;
  activeDispatches: ActiveDispatch[];
  alertasCriticas: {
    mantenimiento: number;
    soatVencido: number;
    novedades: number;
    desvios: number; // 🚀 NUEVO
    lista: Alert[];
  };
}