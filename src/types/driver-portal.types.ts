
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
  | 'EN_CLIENTE'
  | 'FINALIZADO'

export type OperationContainerStatus =
  | 'PENDIENTE'
  | 'EN_PISO'
  | 'EN_INSPECCION'
  | 'FALLA_REPORTADA'
  | 'EN_CARGUE'
  | 'CARGADO'
  | 'EN_DESCARGUE'
  | 'DESCARGADO';

export type ModalType = 'DETAILS' | 'OCR' | 'CLOSING';
export type ViewMode = 'table' | 'cards';

export interface Location {
  name: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  type?: string;
  brand?: string;
  status?: string;
  empresa?: string;
}

export interface Operation {
  id: number;
  createdAt: string;
  type?: string;
  status?: OperationStatus;
  isActive: boolean;
  fletePago?: number | null;
  estadoViaje?: TripMicroState;
  placaIA?: string | null;
  containerNumber?: string | null;
  containerStatus?: OperationContainerStatus;
  containerStatusUpdatedAt?: string | null;
  containerIssueDescription?: string | null;
  loadingStartedAt?: string | null;
  loadingCompletedAt?: string | null;
  unloadingStartedAt?: string | null;
  unloadingCompletedAt?: string | null;
  amparoExportOperationId?: number | null;
  
  clientName?: string;
  clientLocationName?: string;
  origenName?: string;
  destinoName?: string;
  vehiclePlate?: string;

  origen?: Location;
  destino?: Location;
  vehicle?: Pick<Vehicle, 'plate'>;
}
export interface DriverPortalData {
  id: number;
  name: string;
  cedula: string;
  telefono: string | null;
  role: string;
  isActive: boolean;
  drivenVehicles: Vehicle[];
  assignedOperations: Operation[];
}

export interface OcrResult {
  codigo: string | null;
  legible: boolean;
}