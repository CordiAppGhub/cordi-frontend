export type OperationStatus =
  | "CREADO"
  | "PROGRAMADO"
  | "PENDIENTE_CARGUE"
  | "LISTA_PARA_CARGUE"
  | "ASIGNADO"
  | "EN_CURSO"
  | "CIERRE_FISICO"
  | "PAUSADA"
  | "DESVIO_REPORTADO"
  | "FINALIZADO"
  | "CANCELADO";

export type TripMicroState =
  | "VERIFICADO_EN_SITIO"
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
  | "PENDIENTE_CARGUE"
  | "RESERVADO_ANTICIPADO"
  | "EN_PISO"
  | "PENDIENTE_DEVOLUCION"
  | "EN_INSPECCION"
  | "FALLA_REPORTADA"
  | "EN_CARGUE"
  | "CARGADO"
  | "EN_DESCARGUE"
  | "DESCARGADO"
  | "DEVUELTO_VACIO";

export type CargoStatus =
  | "PENDIENTE"
  | "EN_CARGUE"
  | "CARGADO"
  | "SELLADO"
  | "INSPECCIONADO"
  | "EN_DESCARGUE"
  | "DESCARGADO"
  | "DEVUELTO";

export type ModalType = "DETAILS" | "OCR" | "CLOSING";
export type ViewMode = "table" | "cards";

export interface Location {
  name: string;
  address?: string | null;
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
  affiliation?: string;
  currentTrailerId?: string | null;
}

export interface Operation {
  id: number;
  clientId?: number | null;
  createdAt: string;
  type?: string;
  isContainerized?: boolean;
  status?: OperationStatus;
  isActive: boolean;
  isAnticipada?: boolean;
  isAdvanceRetrieval?: boolean;
  fleteAPagar?: number | null;
  estadoViaje?: TripMicroState | null;
  placaIA?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  containerType?: string | null;
  cargoDescription?: string | null;
  peso?: number | null;
  weight?: number | null;
  dimensions?: string | null;
  packageType?: string | null;
  packageCount?: number | null;
  volumeM3?: number | null;
  containerStatus?: OperationContainerStatus;
  cargoStatus?: CargoStatus;
  containerStatusUpdatedAt?: string | null;
  containerIssueDescription?: string | null;
  loadingStartedAt?: string | null;
  loadingCompletedAt?: string | null;
  unloadingStartedAt?: string | null;
  unloadingCompletedAt?: string | null;
  parentId?: number | null;
  scheduledAt?: string | null;
  fechaRetiro?: string | null;
  fechaCitaOrigen?: string | null;
  fechaCitaDestino?: string | null;
  operationDate?: string | null;
  originAppointment?: string | null;
  destinationAppointment?: string | null;
  advanceRetrievalDate?: string | null;
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
  amparoExportFinished?: boolean | null;
  /** true si la operación participa en un OperationAmparo (expo o impo) */
  isAmparado?: boolean;
  evidences?: Array<{
    id: number;
    type: string;
    estadoRevision: string;
    notaAnalista?: string | null;
  }>;
  stops?: Array<{
    id: number;
    clientId: number;
    locationId: number | null;
    isCustomAddress?: boolean;
    address?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    observations?: string | null;
    stopType: "CARGUE" | "DESCARGUE";
    stopOrder: number;
    cargoDescription?: string | null;
    weightKg?: number | null;
    status: "PENDIENTE" | "EN_CURSO" | "COMPLETADA" | "OMITIDA";
    client: { razonSocial: string };
    location: { name: string; address?: string | null } | null;
  }>;

  clientName?: string;
  clientContactName?: string | null;
  clientContactPhone?: string | null;
  customer?: {
    name: string;
    contactName: string | null;
    contactPhone: string | null;
    locations: Array<{
      id: number;
      name: string;
      address: string | null;
    }>;
  } | null;
  clientLocationName?: string;
  clientLocationId?: number | null;
  trailerClientLocation?: {
    id: number;
    name: string;
    address?: string | null;
    clientName: string;
  } | null;
  trailerOwnYards?: Array<{
    id: number;
    name: string;
    address?: string | null;
  }>;
  origenName?: string;
  destinoName?: string;
  vehiclePlate?: string;

  origen?: Location;
  cargue?: Location | null;
  descargue?: Location | null;
  destino?: Location;
  originLocation?: Location | null;
  destinationLocation?: Location | null;
  vehicle?: Pick<Vehicle, "id" | "plate" | "type" | "currentTrailerId">;
  trailer?: {
    id: string;
    plate: string;
    trailerType?: "PLANCHA" | "GRILLO" | "TANQUE";
  };
}

export type TrailerDestinationType = "CLIENT" | "OWN_YARD";

export interface FleetPlateVerificationResult {
  verified: boolean;
  cabPlate: string;
  trailerPlate: string;
  estadoViaje: "VERIFICADO_EN_SITIO";
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
