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
  status: 'CREADO' | 'ASIGNADO' | 'EN_CURSO' | 'FINALIZADO' | 'PAUSADA' | 'CANCELADO';

  isAnticipada?: boolean;

  containerNumber: string | null;
  driver?: UserDriver | null;
  estadoViaje?: string | null;
  scheduledAt?: string | null;

  vehicle?: Vehicle | null;
  evidences?: Evidence[];
  placaIA?: string | null;
  origen?: LogisticNode | null;
  cargue?: LogisticNode | null;
  descargue?: LogisticNode | null;
  destino?: LogisticNode | null;

  novedadesHistorial?: NovedadHistorial[];

  client?: ClientNode | null;
  basePrice?: number | null;
  containerType?: string | null;
  parentId?: number | null;
  children?: SubOperation[];
  fechaCitaOrigen?: string | null;
  fechaCitaDestino?: string | null;
  fechaRetiro?: string | null;
  fechaLimiteDevolucion?: string | null;


  fleteCobro?: number | null;
  fletePago?: number | null;
  rentabilidad?: number | null;
  surcharges?: OperationSurcharge[];

}