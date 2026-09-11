export type OperationStatus = 'CREADO' | 'ASIGNADO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';
export type TripMicroState = 'RUMBO_AL_PUERTO' | 'EN_PUERTO' | ' EN_PUERTO_CARGADO' | 'EN_RUMBO_AL_CLIENTE' | 'EN_CLIENTE';

export interface DriverOperation {
  id: number;
  type: string;
  status: OperationStatus;
  estadoViaje: TripMicroState | null;
  cliente: string | null;
  containerNumber: string | null;
  placaIA: string | null;
  pinRetiro: string | null;
  documentoTransporte: string | null;
  sealNumber: string | null;
  novedades: string | null;
  observaciones: string | null;
  scheduledAt: string | null;
  origen: { name: string; address: string | null } | null;
  cargue: { name: string; address: string | null } | null;
  descargue: { name: string; address: string | null } | null;
  destino: { name: string; address: string | null } | null;
  vehicle: { plate: string; brand: string | null } | null;
}

export interface UpdateMicroStateDto {
  estadoViaje: TripMicroState;
  novedades?: string;
}