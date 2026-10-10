export interface Evidence {
  id: number;
  url: string;
  type: string;
  createdAt?: string;
}

export interface NovedadHistorial {
  id: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
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
  driver?: UserDriver | null;
}

export interface OperationSurcharge {
  id: number;
  operationId: number;
  surchargeCode: string;
  appliedPrice: number;
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
  // 🚀 ACTUALIZADO: Añadido 'PROGRAMADO' que faltaba
  status: 'CREADO' | 'PROGRAMADO' | 'ASIGNADO' | 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADO' | 'PAUSADA' | 'CANCELADO';

  isActive: boolean;
  isAnticipada?: boolean;

  // CONTENEDOR Y CARGA
  containerNumber: string | null;
  containerType?: string | null;
  // 🚀 ACTUALIZADO: Alineado con Prisma
  peso?: number | null; 
  sealNumber?: string | null; // Sello/Precinto
  pinRetiro?: string | null;  // PIN del puerto

  numeroPedido?: string | null; 
  arin?: string | null;
  documentoTransporte?: string | null; // Usado para Manifiesto / DO / BL
  radicado?: string | null;
  cumplido?: string | null;
  novedades?: string | null;
  observaciones?: string | null;

  estadoViaje?: string | null;
  containerStatus?:
    | 'PENDIENTE'
    | 'EN_PISO'
    | 'EN_INSPECCION'
    | 'FALLA_REPORTADA'
    | 'EN_CARGUE'
    | 'CARGADO'
    | 'EN_DESCARGUE'
    | 'DESCARGADO';
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

  historialNovedades?: NovedadHistorial[];

  // CLIENTE
  clientId?: number | null; 
  client?: ClientNode | null;
  
  parentId?: number | null;
  children?: SubOperation[];
  
  // CITAS Y TIEMPOS OPERATIVOS
  fechaCitaOrigen?: string | null;
  fechaCitaDestino?: string | null;
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
  fleteCobro?: number | null;
  fleteCobroManual?: number | null; // Flete manual/excepción
  fletePago?: number | null;
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
  clientName: string;
  analystName: string;
  totalOperaciones: number;
  totalFacturacion: number;
  operations: Operation[];
}