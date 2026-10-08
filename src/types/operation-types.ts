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

  isAnticipada?: boolean;

  // CONTENEDOR Y CARGA
  containerNumber: string | null;
  containerType?: string | null;
  // 🚀 ACTUALIZADO: Alineado con Prisma
  peso?: number | null; 
  sealNumber?: string | null; // Sello/Precinto
  pinRetiro?: string | null;  // PIN del puerto
  
  numeroPedido?: string | null; 
  documentoTransporte?: string | null; // Usado para Manifiesto / DO / BL
  observaciones?: string | null;

  estadoViaje?: string | null;
  
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
  vehicle?: Vehicle | null;
  trailer?: Vehicle | null; // NUEVO: Objeto Remolque
  evidences?: Evidence[];
  placaIA?: string | null;
  
  // NODOS LOGÍSTICOS
  origen?: LogisticNode | null;
  cargue?: LogisticNode | null;
  descargue?: LogisticNode | null;
  destino?: LogisticNode | null;

  novedadesHistorial?: NovedadHistorial[];

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

  // LIQUIDACIÓN Y FINANZAS
  // 🚀 ACTUALIZADO: Alineado con Prisma
  fleteCobro?: number | null;
  fleteCobroManual?: number | null; // Flete manual/excepción
  fletePago?: number | null;
  surcharges?: OperationSurcharge[];
}