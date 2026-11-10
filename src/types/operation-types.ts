export interface Evidence {
  id: number;
  invalidated?: boolean;
  url: string | null;
  type: string;
  photosUrl?: string[];
  anomalyPhotosUrl?: string[];
  deliveryDocsUrl?: string[];
  tirillaEirUrl?: string | null;
  ocrResult?: {
    kind: "plate" | "trailer" | "container";
    codigo: string | null;
    legible: boolean;
    esperado: string | null;
    coincide: boolean | null;
  } | null;
  createdAt?: string;
  etapa?: string;
  estadoRevision: "PENDIENTE" | "APROBADO" | "DEVUELTO";
  notaAnalista?: string;
  formato?: string;
}

export interface NovedadHistorial {
  id: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  category?: string | null;
  status?: string;
  createdAt?: string;
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
  status?: string;
  affiliation?: string;
  ownershipType?: "PROPIO" | "TERCERO";
}

export interface Trailer {
  id: string;
  plate: string;
  trailerType?: "PLANCHA" | "GRILLO" | "TANQUE";
  axles?: 2 | 3 | null;
  capacity?: number | null;
  status?: string;
  currentLocation?: {
    id: number;
    name: string;
    address?: string | null;
  } | null;
}

export interface LogisticNode {
  id: number;
  name: string;
  address?: string | null;
  isDepot?: boolean;
  client?: ClientNode | null;
}

export interface UserDriver {
  id: number;
  name: string | null;
  chatId: string;
  cedula?: string | null;
  telefono?: string | null;
}

export interface ClientNode {
  id: number;
  razonSocial: string;
  nit?: string;
}

export interface SubOperation {
  id: number;
  type: string;
  status: string;
  createdAt: string;
  origen?: LogisticNode | null;
  destino?: LogisticNode | null;
  nuevoDestinoId?: number | null;
  nuevoDestino?: LogisticNode | null;
  fechaCitaDestino?: string | null;
  fechaCitaDesvio?: string | null;
  driver?: UserDriver | null;
}

export interface OperationSurcharge {
  id: number;
  operationId: number;
  surchargeCode: string;
  appliedPrice: number;
  costPrice?: number;
  quantity: number;
  totalPrice: number;
  observations?: string;
  createdAt?: string | Date;
  novedadId?: number | null;
  novedad?: {
    id: number;
    category?: string | null;
    description: string;
  } | null;

  surcharge?: {
    code: string;
    name: string;
    description?: string;
    applicableTo?: string;
    basePrice: number;
  };
}

export interface Operation {
  id: number;
  type: string;
  relatedOperationId?: number | null;
  isContainerized: boolean;
  tipoCarga?: "CONTENERIZADA" | "SUELTA";
  vehicleCapacityId?: number | null;
  vehicleType?: { id: number; code: string; name: string } | null;
  // 🚀 ACTUALIZADO: Añadido 'PROGRAMADO' que faltaba
  status:
    | "CREADO"
    | "PROGRAMADO"
    | "PENDIENTE_CARGUE"
    | "LISTA_PARA_CARGUE"
    | "ASIGNADO"
    | "PENDIENTE"
    | "EN_CURSO"
    | "CIERRE_FISICO"
    | "FINALIZADO"
    | "PAUSADA"
    | "CANCELADO"
    | "DESVIO_REPORTADO";

  isActive: boolean;
  amparosExportacion?: Array<{ id: number }>;
  isAnticipada?: boolean;
  requiresInspection?: boolean;
  inspectionStatus?: "APROBADO" | "RECHAZADO_MAL_ESTADO" | null;
  shippingLineId?: number | null;
  shippingLine?: {
    id: number;
    name: string;
    nit: string;
  } | null;
  depositoDevolucionId?: number | null;
  depositoDevolucion?: LogisticNode | null;
  routeScope?: "URBANO" | "NACIONAL" | null;
  stops?: Array<{
    id?: number;
    clientId: number;
    clientLocationId?: number | null;
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
    status?: string;
    client?: { id: number; razonSocial: string };
    clientLocation?: {
      id: number;
      name: string;
      address?: string | null;
      cityId?: number | null;
      department?: string | null;
      indications?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    } | null;
    location?: { id: number; name: string; address?: string | null } | null;
  }>;
  deviations?: Array<{
    id: number;
    reason: string;
    comodatoUrl: string;
    observations?: string | null;
    createdAt: string;
    newLocation: LogisticNode;
  }>;

  // CONTENEDOR Y CARGA
  containerNumber: string | null;
  containerType?: string | null;
  // 🚀 ACTUALIZADO: Alineado con Prisma
  peso?: number | null;
  cargoDescription?: string | null;
  weight?: number | null;
  dimensions?: string | null;
  packageType?: string | null;
  packageCount?: number | null;
  volumeM3?: number | null;
  sealNumber?: string | null; // Sello/Precinto
  pinRetiro?: string | null; // PIN del puerto

  numeroPedido?: string | null;
  arin?: string | null;
  documentoTransporte?: string | null; // Usado para manifiesto o DO
  radicado?: string | null;
  cumplido?: string | null;
  novedades?: string | null;
  observaciones?: string | null;

  estadoViaje?: string | null;
  containerStatus?:
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
  containerStatusUpdatedAt?: string | null;
  containerIssueDescription?: string | null;
  loadingStartedAt?: string | null;
  loadingCompletedAt?: string | null;
  unloadingStartedAt?: string | null;
  unloadingCompletedAt?: string | null;

  // FECHAS BASE
  scheduledAt?: string | null;
  createdAt?: string | Date;

  // 🚀 IDs DE LOS ACTORES
  driverId?: number | null;
  vehicleId?: number | null;
  trailerId?: string | null;
  analystId?: number | null;

  // OBJETOS RELACIONADOS
  driver?: UserDriver | null;
  analyst?: { id: number; name: string | null } | null;
  vehicle?: Vehicle | null;
  trailer?: Trailer | null;
  evidences?: Evidence[];
  placaIA?: string | null;

  // NODOS LOGÍSTICOS
  origen?: LogisticNode | null;
  cargue?: LogisticNode | null;
  descargue?: LogisticNode | null;
  destino?: LogisticNode | null;
  nuevoDestinoId?: number | null;
  nuevoDestino?: LogisticNode | null;

  historialNovedades?: NovedadHistorial[];
  issues?: Array<{ id: number }>;

  // CLIENTE
  clientId?: number | null;
  client?: ClientNode | null;

  parentId?: number | null;
  children?: SubOperation[];

  // CITAS Y TIEMPOS OPERATIVOS
  fechaCitaOrigen?: string | null;
  fechaCitaDestino?: string | null;
  fechaCitaDesvio?: string | null;
  fechaRetiro?: string | null;
  fechaAsignacion?: string | null;
  fechaCierreFisico?: string | null;
  fechaCierreDocumental?: string | null;
  horaInicio?: string | null;
  horaLlegada?: string | null;
  horaAtencion?: string | null;
  horaCargue?: string | null;
  horaDescargue?: string | null;
  horaSalida?: string | null;
  horaFinal?: string | null;

  // LIQUIDACIÓN Y FINANZAS
  // 🚀 ACTUALIZADO: Alineado con Prisma
  fleteACobrar?: number | null;
  fleteACobrarManual?: number | null; // Flete manual/excepción
  fleteAPagar?: number | null;
  agreedFreight?: number | null;
  retencionFlotaPorcentaje?: number | null;
  patioId?: number | null;
  patioCosto?: number | null;
  patioCobro?: number | null;
  patio?: LogisticNode | null;
  rentabilidadBruta?: number | null;
  totalRecargos?: number;
  totalCobrosExtras?: number;
  totalFacturacion?: number;
  surcharges?: OperationSurcharge[];
}

export interface OperationsClientGroup {
  id: string | number;
  clientId: number | null;
  clientName: string;
  analystName: string;
  totalOperaciones: number;
  totalFacturacion?: number;
  operations: Operation[];
  operationsMeta?: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}
