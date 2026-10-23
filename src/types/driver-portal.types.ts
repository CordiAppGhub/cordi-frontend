export type OperationStatus =
  | "CREADO"
  | "PROGRAMADO"
  | "ASIGNADO"
  | "EN_CURSO"
  | "PAUSADA"
  | "FINALIZADO"
  | "CANCELADO";

export type TripMicroState =
  | "RUMBO_AL_PUERTO"
  | "EN_PUERTO"
  | "EN_PUERTO_CARGADO"
  | "RUMBO_AL_CLIENTE"
  | "EN_CLIENTE"
  | "EN_RUTA_ORIGEN"
  | "LLEGADA_ORIGEN"
  | "EN_INSPECCION"
  | "EN_CARGUE"
  | "EN_RUTA_DESTINO"
  | "LLEGADA_DESTINO"
  | "EN_DESCARGUE"
  | "CONTENEDOR_LIBRE"
  | "FINALIZADO";

export type OperationContainerStatus =
  | "PENDIENTE"
  | "EN_PISO"
  | "PENDIENTE_DEVOLUCION"
  | "EN_INSPECCION"
  | "FALLA_REPORTADA"
  | "EN_CARGUE"
  | "CARGADO"
  | "EN_DESCARGUE"
  | "DESCARGADO";

export type ModalType = "DETAILS" | "OCR" | "CLOSING";
export type ViewMode = "table" | "cards";

export interface Location {
  name: string;
}

export interface DriverDeviationNotice {
  id: number;
  description: string;
  status: string;
  createdAt: string;
  metadata?: {
    comodatoOcr?: {
      legible: boolean;
      destino: string | null;
      fechaCita: string | null;
      numeroContenedor: string | null;
      referencia: string | null;
    };
  } | null;
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
  fleteAPagar?: number | null;
  estadoViaje?: TripMicroState;
  placaIA?: string | null;
  containerNumber?: string | null;
  containerType?: string | null;
  containerStatus?: OperationContainerStatus;
  containerStatusUpdatedAt?: string | null;
  containerIssueDescription?: string | null;
  loadingStartedAt?: string | null;
  loadingCompletedAt?: string | null;
  unloadingStartedAt?: string | null;
  unloadingCompletedAt?: string | null;
  parentId?: number | null;
  scheduledAt?: string | null;
  fechaCitaOrigen?: string | null;
  fechaCitaDestino?: string | null;
  nuevoDestinoId?: number | null;
  nuevoDestino?: Location;
  fechaCitaDesvio?: string | null;
  historialNovedades?: DriverDeviationNotice[];
  children?: Array<{
    id: number;
    type: string;
    status: string;
    destino?: { name: string } | null;
    fechaCitaDestino?: string | null;
  }>;
  amparoExportOperationId?: number | null;
  /** true si la operación participa en un OperationAmparo (expo o impo) */
  isAmparado?: boolean;
  evidences?: Array<{
    id: number;
    type: string;
    estadoRevision: string;
    notaAnalista?: string | null;
  }>;

  clientName?: string;
  clientLocationName?: string;
  origenName?: string;
  destinoName?: string;
  vehiclePlate?: string;

  origen?: Location;
  destino?: Location;
  vehicle?: Pick<Vehicle, "plate">;
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
