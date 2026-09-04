export type YardLocation = 'TLA' | 'Patio Nuevo Corditrans';
export type YardOperationType = 'Vacío Exportación' | 'Vacío Importación';
export type YardStatus = 'En Patio' | 'Programado para Cargue' | 'Programado para Devolución' | 'Despachado' | 'Devuelto' | 'Cerrado';
export type SLAStatus = 'verde' | 'amarillo' | 'rojo';

export interface YardContainer {
  id: number;
  containerNumber: string;
  type: YardOperationType;
  yard: YardLocation;
  entryDate: string;
  client: string;
  shippingCompany: string; // Naviera
  analyst: string;
  status: YardStatus;
  daysInYard: number; // Calculado por CORDIBOT o el backend
  slaStatus: SLAStatus; // Calculado basado en los días
}