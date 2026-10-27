export interface Evidence {
  id: number;
  url: string;
  type: string;
  createdAt?: string;
  etapa?: string;
  estadoRevision: 'PENDIENTE' | 'APROBADO' | 'DEVUELTO';
  notaAnalista?: string;
  formato?: string;
}

export interface NovedadHistorial {
  id: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
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
  status?: string;
}

export interface LogisticNode {
  id: number;
  name: string;
  address?: string | null;
  client?: ClientNode | null;
}

export interface UserDriver {
  id: number;
  name: string | null;
  chatId: string;
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
  cargoFormat?: "CONTENERIZADA" | "SUELTA";
  vehicleTypeId?: number | null;
  vehicleType?: { id: number; code: string; name: string } | null;
  // 🚀 ACTUALIZADO: Añadido 'PROGRAMADO' que faltaba
  status:
    | "CREADO"
    | "PROGRAMADO"
    | "ASIGNADO"
    | "PENDIENTE"
    | "EN_CURSO"
    | "FINALIZADO"
    | "PAUSADA"
    | "CANCELADO"
    | "DESVIO_REPORTADO";

  isActive: boolean;
  isAnticipada?: boolean;
  requiresInspection?: boolean;
  inspectionStatus?: "APROBADO" | "RECHAZADO_MAL_ESTADO" | null;
  shippingLineId?: number | null;
  shippingLine?: { id: number; name: string; nit: string } | null;
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
  sealNumber?: string | null; // Sello/Precinto
  pinRetiro?: string | null; // PIN del puerto

  numeroPedido?: string | null;
  arin?: string | null;
  documentoTransporte?: string | null; // Usado para Manifiesto / DO / BL
  radicado?: string | null;
  cumplido?: string | null;
  novedades?: string | null;
  observaciones?: string | null;

  estadoViaje?: string | null;
  containerStatus?:
    | "PENDIENTE"
    | "EN_PISO"
    | "PENDIENTE_DEVOLUCION"
    | "EN_INSPECCION"
    | "FALLA_REPORTADA"
    | "EN_CARGUE"
    | "CARGADO"
    | "EN_DESCARGUE"
    | "DESCARGADO";
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
  trailerId?: number | null; // NUEVO: Remolque/Chasis
  analystId?: number | null;

  // OBJETOS RELACIONADOS
  driver?: UserDriver | null;
  analyst?: { id: number; name: string | null } | null;
  vehicle?: Vehicle | null;
  trailer?: Vehicle | null; // NUEVO: Objeto Remolque
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
  fechaLimiteDevolucion?: string | null;
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
