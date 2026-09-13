// types/driver-portal.types.ts

export type OperationStatus = 
  | 'CREADO' 
  | 'ASIGNADO' 
  | 'EN_CURSO' 
  | 'FINALIZADO' 
  | 'CANCELADO';

export type TripMicroState = 
  | 'RUMBO_AL_PUERTO' 
  | 'EN_PUERTO' 
  | 'EN_PUERTO_CARGADO' 
  | 'RUMBO_AL_CLIENTE' 
  | 'EN_CLIENTE';

export type ModalType = 'DETAILS' | 'OCR' | 'CLOSING';
export type ViewMode = 'table' | 'cards';

export interface Location {
  name: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  brand?: string;
  status?: string;
  empresa?: string;
}

export interface Operation {
  id: number;
  createdAt: string;
  type?: string;
  status?: OperationStatus;
  estadoViaje?: TripMicroState;
  placaIA?: string | null;
  containerNumber?: string | null;
  origen?: Location;
  destino?: Location;
  vehicle?: Pick<Vehicle, 'plate'>; 
}

export interface DriverPortalData {
  id: number;
  name: string;
  cedula: string;
  telefono: string;
  portalLink: string;
  drivenVehicles: Vehicle[];
  assignedOperations: Operation[];
}

export interface OcrResult {
  codigo: string | null;
  legible: boolean;
}